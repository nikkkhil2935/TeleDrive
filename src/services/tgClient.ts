import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { CustomFile } from 'telegram/client/uploads';
import { Api } from 'telegram/tl';
import { Buffer } from 'buffer';
import type { CaptionMetadataV1, MediaItem, UserSession } from '../types';
import { db } from '../db';

let clientInstance: TelegramClient | null = null;
let activeSession: UserSession | null = null;
let qrAbortController: AbortController | null = null;

const SESSION_STORAGE_KEY = 'tg_photos_session_v1';

export function getActiveSession(): UserSession | null {
  if (activeSession) return activeSession;
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (raw) {
      activeSession = JSON.parse(raw);
      if (activeSession?.channelId === '2093810291' || activeSession?.sessionString?.includes('DemoSessionKey')) {
        localStorage.removeItem(SESSION_STORAGE_KEY);
        activeSession = null;
        return null;
      }
      return activeSession;
    }
  } catch (e) {
    console.error('Failed to parse saved session:', e);
  }
  return null;
}

export function saveActiveSession(session: UserSession) {
  activeSession = session;
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function clearActiveSession() {
  activeSession = null;
  localStorage.removeItem(SESSION_STORAGE_KEY);
  if (clientInstance) {
    try {
      clientInstance.disconnect();
    } catch (e) {}
    clientInstance = null;
  }
}

/**
 * Initializes or returns existing connected TelegramClient.
 */
export async function getTelegramClient(creds?: { apiId: number; apiHash: string; sessionString?: string }): Promise<TelegramClient> {
  if (clientInstance && clientInstance.connected) {
    return clientInstance;
  }

  const sessionData = creds || getActiveSession();
  if (!sessionData) {
    throw new Error('No Telegram credentials or session found. Please sign in.');
  }

  const stringSession = new StringSession(sessionData.sessionString || '');
  const client = new TelegramClient(stringSession, sessionData.apiId, sessionData.apiHash, {
    connectionRetries: 5,
    useWSS: true, // Connect over WebSocket in browser environments
  });

  await client.connect();
  clientInstance = client;
  return client;
}

/**
 * Step 1 of Phone Login: Requests Telegram to send verification code.
 */
export async function sendTelegramPhoneCode(
  apiId: number,
  apiHash: string,
  phoneNumber: string
): Promise<{ phoneCodeHash: string; isCodeViaApp: boolean }> {
  // Reset previous client if any
  if (clientInstance) {
    try {
      await clientInstance.disconnect();
    } catch (e) {}
    clientInstance = null;
  }

  const client = new TelegramClient(new StringSession(''), apiId, apiHash, {
    connectionRetries: 5,
    useWSS: true,
  });

  await client.connect();
  clientInstance = client;

  const result = await client.sendCode(
    { apiId, apiHash },
    phoneNumber.trim()
  );

  return {
    phoneCodeHash: result.phoneCodeHash,
    isCodeViaApp: result.isCodeViaApp,
  };
}

/**
 * Step 2 of Phone Login: Submits code (and optional 2FA password).
 */
export async function verifyTelegramCodeAndSignIn(
  apiId: number,
  apiHash: string,
  phoneNumber: string,
  phoneCode: string,
  phoneCodeHash: string,
  password?: string
): Promise<UserSession> {
  if (!clientInstance || !clientInstance.connected) {
    await getTelegramClient({ apiId, apiHash, sessionString: '' });
  }
  const client = clientInstance!;

  let authUser: any = null;
  try {
    authUser = await client.invoke(
      new Api.auth.SignIn({
        phoneNumber: phoneNumber.trim(),
        phoneCodeHash: String(phoneCodeHash).trim(),
        phoneCode: String(phoneCode).trim(),
      })
    );
  } catch (err: any) {
    // Check if 2FA cloud password is required
    const is2fa =
      (err?.message && err.message.includes('SESSION_PASSWORD_NEEDED')) ||
      (err?.errorMessage && err.errorMessage.includes('SESSION_PASSWORD_NEEDED'));

    if (is2fa) {
      if (!password || !password.trim()) {
        throw new Error('2FA_REQUIRED');
      }
      authUser = await client.signInWithPassword(
        { apiId, apiHash },
        {
          password: async () => password.trim(),
          onError: (e) => {
            throw e;
          },
        }
      );
    } else {
      throw err;
    }
  }

  // Save session string
  const sessionString = client.session.save() as unknown as string;

  // Auto-discover or provision library channel
  const { channelId, channelTitle, channelAccessHash } = await ensureLibraryChannel(client);

  const userObj = authUser.user || authUser;
  const session: UserSession = {
    apiId,
    apiHash,
    sessionString,
    channelId,
    channelTitle,
    channelAccessHash,
    phone: phoneNumber,
    userId: userObj?.id?.toString(),
    userName: [userObj?.firstName, userObj?.lastName].filter(Boolean).join(' ') || phoneNumber,
  };

  saveActiveSession(session);
  return session;
}

/**
 * QR Code Login flow using GramJS signInUserWithQrCode.
 */
export async function startTelegramQrLogin(
  apiId: number,
  apiHash: string,
  onQrToken: (qrAuthUrl: string, expires: number) => void,
  onPasswordNeeded?: () => Promise<string>
): Promise<UserSession> {
  if (clientInstance) {
    try {
      await clientInstance.disconnect();
    } catch (e) {}
    clientInstance = null;
  }

  const client = new TelegramClient(new StringSession(''), apiId, apiHash, {
    connectionRetries: 5,
    useWSS: true,
  });

  await client.connect();
  clientInstance = client;

  let passwordResolver: ((hint?: string) => Promise<string>) | undefined;
  if (onPasswordNeeded) {
    passwordResolver = async () => {
      const pass = await onPasswordNeeded();
      return pass.trim();
    };
  }

  const authUser = await client.signInUserWithQrCode(
    { apiId, apiHash },
    {
      qrCode: async ({ token, expires }) => {
        // Construct official Telegram QR login URI: tg://login?token=<base64url>
        // Use RFC 4648 URL-safe base64 conversion that works universally in any polyfill
        const b64 = Buffer.from(token).toString('base64');
        const base64UrlToken = b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        const qrUrl = `tg://login?token=${base64UrlToken}`;
        onQrToken(qrUrl, expires);
      },
      password: passwordResolver,
      onError: (err) => {
        console.error('QR Login error callback:', err);
      },
    }
  );

  const sessionString = client.session.save() as unknown as string;
  const { channelId, channelTitle, channelAccessHash } = await ensureLibraryChannel(client);

  const userObj = authUser as any;
  const session: UserSession = {
    apiId,
    apiHash,
    sessionString,
    channelId,
    channelTitle,
    channelAccessHash,
    userId: userObj?.id?.toString(),
    userName: [userObj?.firstName, userObj?.lastName].filter(Boolean).join(' ') || 'Telegram User',
  };

  saveActiveSession(session);
  return session;
}

/**
 * Ensures or creates the private library channel for storing media.
 */
export async function ensureLibraryChannel(
  client: TelegramClient,
  title = 'Telegram Photos Library'
): Promise<{ channelId: string; channelTitle: string; channelAccessHash?: string }> {
  const session = getActiveSession();
  if (session?.channelId && session?.channelAccessHash) {
    return {
      channelId: session.channelId,
      channelTitle: session.channelTitle || title,
      channelAccessHash: session.channelAccessHash,
    };
  }

  try {
    // Check existing dialogs first to reuse existing Photos Library channel
    const dialogs: any[] = await client.getDialogs({ limit: 100 });
    const existing = dialogs.find(d => (d.isChannel || d.isGroup) && d.title?.toLowerCase().includes('photos library'));
    if (existing && existing.entity) {
      const channelId = existing.entity.id.toString();
      const channelTitle = existing.title || title;
      const channelAccessHash = existing.entity.accessHash ? existing.entity.accessHash.toString() : undefined;
      if (session) {
        session.channelId = channelId;
        session.channelTitle = channelTitle;
        session.channelAccessHash = channelAccessHash;
        saveActiveSession(session);
      }
      return { channelId, channelTitle, channelAccessHash };
    }
  } catch (e) {
    console.warn('Could not inspect dialogs for existing channel:', e);
  }

  // Create new private channel
  const result: any = await client.invoke(
    new Api.channels.CreateChannel({
      title,
      about: 'Private photo and video storage created by Telegram Photos App. Messages represent original media documents with metadata captions.',
      broadcast: true,
      megagroup: false,
    })
  );

  const updates = result.chats || [];
  const createdChannel = updates[0];
  if (!createdChannel) {
    throw new Error('Failed to create private library channel');
  }

  const channelId = createdChannel.id.toString();
  const channelAccessHash = createdChannel.accessHash ? createdChannel.accessHash.toString() : undefined;
  if (session) {
    session.channelId = channelId;
    session.channelTitle = title;
    session.channelAccessHash = channelAccessHash;
    saveActiveSession(session);
  }

  return { channelId, channelTitle: title, channelAccessHash };
}

/**
 * Robustly resolves the target destination peer for uploads or indexing.
 * Resolves private channel entities with their accessHash or falls back to 'me' (Saved Messages).
 */
export async function resolveTargetPeer(client: TelegramClient, targetChannelId?: string): Promise<any> {
  const session = getActiveSession();
  const chId = targetChannelId || session?.channelId;

  // 1. Saved Messages ('me' / 'self')
  if (!chId || chId === 'me' || chId === 'self') {
    return new Api.InputPeerSelf();
  }

  // Clean numeric ID without '-100' or '+'
  const cleanId = chId.replace(/^-100/, '').trim();

  // 2. Direct InputPeerChannel if we have accessHash saved in session
  if (session?.channelAccessHash && (session.channelId === chId || session.channelId?.replace(/^-100/, '') === cleanId)) {
    try {
      return new Api.InputPeerChannel({
        channelId: BigInt(cleanId) as any,
        accessHash: BigInt(session.channelAccessHash) as any,
      });
    } catch (e) {
      console.warn('Direct InputPeerChannel construction failed, falling back:', e);
    }
  }

  // 3. Search active dialogs cache
  try {
    const dialogs: any[] = await client.getDialogs({ limit: 100 });
    const match = dialogs.find(d => {
      if (!d.entity) return false;
      const entId = d.entity.id ? d.entity.id.toString() : '';
      const dialId = d.id ? d.id.toString() : '';
      return (
        entId === cleanId ||
        entId === chId ||
        dialId === chId ||
        dialId === `-100${cleanId}` ||
        chId === `-100${entId}`
      );
    });

    if (match && match.entity) {
      if (match.entity.accessHash && session) {
        session.channelAccessHash = match.entity.accessHash.toString();
        session.channelId = match.entity.id.toString();
        saveActiveSession(session);
      }
      return match.inputEntity || match.entity;
    }

    const libraryMatch = dialogs.find(d => (d.isChannel || d.isGroup) && d.title?.toLowerCase().includes('photos library'));
    if (libraryMatch && libraryMatch.entity) {
      if (session) {
        session.channelId = libraryMatch.entity.id.toString();
        session.channelTitle = libraryMatch.title;
        if (libraryMatch.entity.accessHash) {
          session.channelAccessHash = libraryMatch.entity.accessHash.toString();
        }
        saveActiveSession(session);
      }
      return libraryMatch.inputEntity || libraryMatch.entity;
    }
  } catch (e) {
    console.warn('Could not inspect dialogs for peer resolution:', e);
  }

  // 4. Try client.getInputEntity with marked ID
  try {
    return await client.getInputEntity(`-100${cleanId}`);
  } catch (e) {}

  // 5. Fallback: Saved Messages so uploads always succeed
  console.info('[Telegram] Using Saved Messages (InputPeerSelf) as cloud storage destination.');
  return new Api.InputPeerSelf();
}

/**
 * Parses caption JSON from a message.
 */
export function parseCaptionJson(captionText?: string): CaptionMetadataV1 | null {
  if (!captionText) return null;
  try {
    const parsed = JSON.parse(captionText);
    if (parsed.v === 1 && parsed.name && parsed.taken) {
      return parsed as CaptionMetadataV1;
    }
  } catch (e) {
    // Not a valid JSON caption
  }
  return null;
}

export function serializeCaptionJson(meta: CaptionMetadataV1): string {
  return JSON.stringify(meta);
}

/**
 * Uploads a media document with custom thumbnail and caption JSON.
 */
export async function uploadMediaDocument(
  client: TelegramClient,
  channelId: string,
  options: {
    file: File;
    thumbnailBlob: Blob;
    caption: CaptionMetadataV1;
    onProgress?: (progress: number, uploadedBytes: number) => void;
  }
): Promise<{ messageId: number }> {
  const { file, thumbnailBlob, caption, onProgress } = options;

  if (file.size > 2_000_000_000) {
    throw new Error(`File ${file.name} (${file.size} bytes) exceeds Telegram's 2,000,000,000 byte (2 GB) cap.`);
  }

  // For files of any size, passing the DOM File directly
  // utilizes CustomBuffer's on-demand chunk slicing with 0 memory bloat.
  let uploadPayload: any = file;

  let thumbCustomFile: CustomFile | undefined = undefined;
  if (thumbnailBlob && thumbnailBlob.size > 0) {
    try {
      const thumbBuffer = await thumbnailBlob.arrayBuffer();
      thumbCustomFile = new CustomFile('thumb.jpg', thumbnailBlob.size, '', Buffer.from(thumbBuffer));
    } catch (e) {
      console.warn('Could not construct CustomFile for thumbnail, continuing without thumb:', e);
    }
  }

  const captionString = serializeCaptionJson(caption);
  const targetPeer = await resolveTargetPeer(client, channelId);

  const sendFilePayload = async (peer: any, includeThumb: boolean) => {
    const opts: any = {
      file: uploadPayload,
      caption: captionString,
      forceDocument: true, // Keep original bytes untouched without compression
      workers: 2, // 2-worker chunk streaming for reliable high throughput without WebSocket congestion
      progressCallback: (percentage: number) => {
        if (onProgress) {
          onProgress(percentage, Math.round(percentage * file.size));
        }
      },
    };
    if (includeThumb && thumbCustomFile) {
      opts.thumb = thumbCustomFile;
    }
    return await client.sendFile(peer, opts);
  };

  let message: any;
  try {
    message = await sendFilePayload(targetPeer, !!thumbCustomFile);
  } catch (err: any) {
    // If thumbnail caused any error, retry immediately without thumbnail
    if (err?.message && (err.message.includes('Could not create file from') || err.message.includes('Cannot use')) && thumbCustomFile) {
      console.warn('[Telegram] Upload with thumbnail failed, retrying without thumbnail:', err.message);
      message = await sendFilePayload(targetPeer, false);
    } else {
      // If entity resolution fails for channel, gracefully fall back to Saved Messages (InputPeerSelf)
      const isEntityError =
        err?.message &&
        (err.message.includes('Could not find the input entity') ||
          err.message.includes('CHANNEL_INVALID') ||
          err.message.includes('CHAT_WRITE_FORBIDDEN'));

      if (isEntityError) {
        console.warn('[Telegram] Channel upload failed with entity/access error, falling back to Saved Messages:', err.message);
        const selfPeer = new Api.InputPeerSelf();
        message = await sendFilePayload(selfPeer, !!thumbCustomFile);
      } else {
        throw err;
      }
    }
  }

  return { messageId: message.id };
}

/**
 * Parses and indexes any Telegram message (manual upload or app upload) into local Dexie database.
 */
export async function parseAndIndexTelegramMessage(
  client: TelegramClient,
  channelId: string,
  msg: any
): Promise<boolean> {
  if (!msg || !msg.media) return false;

  const msgId = msg.id;
  const isDoc = msg.media.className === 'MessageMediaDocument' || !!msg.media.document;
  const isPhoto = msg.media.className === 'MessageMediaPhoto' || !!msg.media.photo;

  if (!isDoc && !isPhoto) return false;

  let filename = `media_${msgId}.jpg`;
  let kind: 'photo' | 'video' = 'photo';
  let mimeType = 'image/jpeg';
  let sizeBytes = 0;
  let width = 1920;
  let height = 1080;
  let durationMs: number | undefined = undefined;
  let thumbnailDataUrl: string | undefined = undefined;
  let sha256 = `tg_${msgId}`;
  let takenAt = new Date((msg.date || Date.now() / 1000) * 1000).toISOString();
  let albums: string[] = [];
  let isFavorite = false;
  let camera: string | undefined = undefined;
  let latitude: number | undefined = undefined;
  let longitude: number | undefined = undefined;

  // Try parsing JSON caption if created by Telegram Photos app
  const meta = parseCaptionJson(msg.message);
  if (meta) {
    filename = meta.name || filename;
    takenAt = meta.taken || takenAt;
    width = meta.w || width;
    height = meta.h || height;
    sha256 = meta.sha || sha256;
    albums = meta.albums || [];
    isFavorite = meta.fav === 1;
    camera = meta.camera;
    latitude = meta.lat;
    longitude = meta.lon;
  } else if (msg.message && typeof msg.message === 'string' && msg.message.trim()) {
    // If user provided a normal text caption in Telegram app
    filename = msg.message.trim().slice(0, 60);
  }

  if (isPhoto) {
    const photo = msg.media.photo;
    if (photo && photo.className !== 'PhotoEmpty') {
      filename = filename.endsWith('.jpg') || filename.endsWith('.png') ? filename : `${filename}.jpg`;
      kind = 'photo';
      mimeType = 'image/jpeg';

      if (Array.isArray(photo.sizes)) {
        for (const s of photo.sizes) {
          if (s.w && s.h && s.w * s.h > width * height) {
            width = s.w;
            height = s.h;
          }
          if (s.size && s.size > sizeBytes) {
            sizeBytes = s.size;
          }
        }
      }
    }
  } else if (isDoc) {
    const doc = msg.media.document;
    if (doc) {
      sizeBytes = Number(doc.size || 0);
      mimeType = doc.mimeType || 'application/octet-stream';
      kind = mimeType.startsWith('video/') ? 'video' : 'photo';

      if (Array.isArray(doc.attributes)) {
        for (const attr of doc.attributes) {
          if (attr.className === 'DocumentAttributeFilename' && attr.fileName) {
            filename = attr.fileName;
          } else if (attr.className === 'DocumentAttributeImageSize') {
            width = attr.w || width;
            height = attr.h || height;
          } else if (attr.className === 'DocumentAttributeVideo') {
            kind = 'video';
            durationMs = Math.round((attr.duration || 0) * 1000);
            if (attr.w) width = attr.w;
            if (attr.h) height = attr.h;
          }
        }
      }
    }
  }

  // Check if item is already indexed in local database to avoid redundant network calls
  const existing = await db.media.get(msgId);
  if (existing?.thumbnailDataUrl) {
    thumbnailDataUrl = existing.thumbnailDataUrl;
  } else {
    // Attempt to download a fast thumbnail if not already present
    try {
      const thumbBuffer = await client.downloadMedia(msg, { thumb: 1 });
      if (thumbBuffer && thumbBuffer.length > 0) {
        thumbnailDataUrl = 'data:image/jpeg;base64,' + Buffer.from(thumbBuffer).toString('base64');
      }
    } catch (e) {
      // If network thumbnail download fails, generate a clean SVG gradient thumbnail
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
        <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#0284c7"/><stop offset="100%" stop-color="#4f46e5"/></linearGradient></defs>
        <rect width="400" height="400" fill="url(#g)"/>
        <circle cx="200" cy="180" r="60" fill="white" opacity="0.9"/>
        <text x="200" y="310" font-family="sans-serif" font-size="20" font-weight="bold" fill="white" text-anchor="middle">${filename.slice(0, 24)}</text>
      </svg>`;
      thumbnailDataUrl = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
    }
  }

  const mediaRow: MediaItem = {
    messageId: msgId,
    libraryId: channelId,
    kind,
    filename,
    mimeType,
    sizeBytes,
    sha256,
    width,
    height,
    durationMs,
    camera,
    takenAt,
    isFavorite,
    isArchived: false,
    uploadedAt: new Date((msg.date || Date.now() / 1000) * 1000).toISOString(),
    albums,
    latitude,
    longitude,
    thumbnailDataUrl,
  };

  await db.media.put(mediaRow);
  return true;
}

/**
 * Scans the newest messages from the Telegram channel and indexes any newly added media.
 */
export async function syncRecentChannelMessages(
  client: TelegramClient,
  channelId: string,
  limit = 50
): Promise<number> {
  const targetPeer = await resolveTargetPeer(client, channelId);
  const messages: any[] = await client.getMessages(targetPeer, { limit });
  if (!messages || messages.length === 0) return 0;

  let addedCount = 0;
  for (const msg of messages) {
    if (msg.media) {
      const indexed = await parseAndIndexTelegramMessage(client, channelId, msg);
      if (indexed) addedCount++;
    }
  }
  return addedCount;
}

let activeLiveListenerCleanup: (() => void) | null = null;

/**
 * Real-time event listener: detects whenever photos or documents are posted to the channel (e.g. from Telegram app).
 */
export function startChannelLiveListener(client: TelegramClient, channelId: string) {
  if (activeLiveListenerCleanup) return;

  const eventHandler = async (update: any) => {
    try {
      const msg = update?.message || (update?.className === 'UpdateNewChannelMessage' ? update.message : null);
      if (msg && (msg.media || msg.photo || msg.document)) {
        console.info('[Telegram Live] Received new channel message, indexing:', msg.id);
        await parseAndIndexTelegramMessage(client, channelId, msg);
      }
    } catch (e) {
      console.warn('[Telegram Live] Error processing incoming update:', e);
    }
  };

  client.addEventHandler(eventHandler);
  activeLiveListenerCleanup = () => {
    try {
      client.removeEventHandler(eventHandler, undefined as any);
    } catch (e) {}
    activeLiveListenerCleanup = null;
  };
}

/**
 * Scans the Telegram channel history and rebuilds the local Dexie index.
 */
export async function rebuildIndexFromChannel(
  client: TelegramClient,
  channelId: string,
  onProgress?: (scannedCount: number, indexedCount: number) => void
): Promise<{ totalScanned: number; totalIndexed: number }> {
  let scannedCount = 0;
  let indexedCount = 0;
  let offsetId = 0;
  const BATCH_SIZE = 100;

  const targetPeer = await resolveTargetPeer(client, channelId);

  while (true) {
    const messages: any[] = await client.getMessages(targetPeer, {
      limit: BATCH_SIZE,
      offsetId,
    });

    if (!messages || messages.length === 0) break;

    for (const msg of messages) {
      scannedCount++;
      offsetId = msg.id;

      if (msg.media) {
        const indexed = await parseAndIndexTelegramMessage(client, channelId, msg);
        if (indexed) indexedCount++;
      }
    }

    if (onProgress) {
      onProgress(scannedCount, indexedCount);
    }

    if (messages.length < BATCH_SIZE) break;
  }

  return { totalScanned: scannedCount, totalIndexed: indexedCount };
}

/**
 * In-memory cache for downloaded full media Object URLs to make switching instant and avoid repeated MTProto downloads.
 */
const fullMediaUrlCache = new Map<number, string>();

export function getCachedFullMediaUrl(messageId: number): string | undefined {
  return fullMediaUrlCache.get(messageId);
}

export function clearFullMediaUrlCache(): void {
  for (const url of fullMediaUrlCache.values()) {
    try {
      URL.revokeObjectURL(url);
    } catch (e) {}
  }
  fullMediaUrlCache.clear();
}

/**
 * Downloads the original full-resolution media from Telegram for a given message ID.
 * Returns an Object URL (blob:...) that can be rendered directly by <img> or <video>.
 */
export async function downloadFullMedia(
  client: TelegramClient,
  channelId: string,
  messageId: number,
  onProgress?: (progress: number) => void
): Promise<string> {
  if (fullMediaUrlCache.has(messageId)) {
    return fullMediaUrlCache.get(messageId)!;
  }

  const targetPeer = await resolveTargetPeer(client, channelId);
  const messages: any[] = await client.getMessages(targetPeer, { ids: [messageId] });
  if (!messages || messages.length === 0 || !messages[0]?.media) {
    throw new Error(`Message #${messageId} has no downloadable media on Telegram.`);
  }

  const msg = messages[0];
  const downloadOpts: any = {
    workers: 4, // 4-worker parallel chunk streaming for maximum download speed
    progressCallback: (downloaded: any, total: any) => {
      if (onProgress) {
        const pct = total ? Number(downloaded) / Number(total) : 0.5;
        onProgress(pct);
      }
    },
  };
  const buffer: any = await client.downloadMedia(msg, downloadOpts);

  if (!buffer || buffer.length === 0) {
    throw new Error(`Failed to download full media buffer for message #${messageId}`);
  }

  let mimeType = 'image/jpeg';
  if (msg.media.document && msg.media.document.mimeType) {
    mimeType = msg.media.document.mimeType;
  }

  const rawBytes = typeof buffer === 'string' ? Buffer.from(buffer) : Buffer.from(buffer);
  const uint8 = new Uint8Array(rawBytes.buffer, rawBytes.byteOffset, rawBytes.byteLength);
  const blob = new Blob([uint8], { type: mimeType });
  const objectUrl = URL.createObjectURL(blob);
  fullMediaUrlCache.set(messageId, objectUrl);

  return objectUrl;
}

