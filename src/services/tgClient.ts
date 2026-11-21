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
        phoneCodeHash,
        phoneCode: phoneCode.trim(),
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

  const fileBuffer = await file.arrayBuffer();
  const customFile = new CustomFile(file.name, file.size, '', Buffer.from(fileBuffer));

  const thumbBuffer = await thumbnailBlob.arrayBuffer();
  const thumbCustomFile = new CustomFile('thumb.jpg', thumbnailBlob.size, '', Buffer.from(thumbBuffer));

  const captionString = serializeCaptionJson(caption);

  const targetPeer = await resolveTargetPeer(client, channelId);

  let message: any;
  try {
    message = await client.sendFile(targetPeer, {
      file: customFile,
      thumb: thumbCustomFile,
      caption: captionString,
      forceDocument: true, // Keep original bytes untouched
      progressCallback: (percentage: number) => {
        if (onProgress) {
          onProgress(percentage, Math.round(percentage * file.size));
        }
      },
    });
  } catch (err: any) {
    // If entity resolution fails for channel, gracefully fall back to Saved Messages (InputPeerSelf)
    const isEntityError =
      err?.message &&
      (err.message.includes('Could not find the input entity') ||
        err.message.includes('CHANNEL_INVALID') ||
        err.message.includes('CHAT_WRITE_FORBIDDEN'));

    if (isEntityError) {
      console.warn('[Telegram] Channel upload failed with entity/access error, falling back to Saved Messages:', err.message);
      const selfPeer = new Api.InputPeerSelf();
      message = await client.sendFile(selfPeer, {
        file: customFile,
        thumb: thumbCustomFile,
        caption: captionString,
        forceDocument: true,
        progressCallback: (percentage: number) => {
          if (onProgress) {
            onProgress(percentage, Math.round(percentage * file.size));
          }
        },
      });
    } else {
      throw err;
    }
  }

  return { messageId: message.id };
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

      if (!msg.media || msg.media.className !== 'MessageMediaDocument') {
        continue;
      }

      const doc = msg.media.document;
      if (!doc) continue;

      const meta = parseCaptionJson(msg.message);
      const isVideo = doc.mimeType?.startsWith('video/') || false;

      const mediaRow: MediaItem = {
        messageId: msg.id,
        libraryId: channelId,
        kind: isVideo ? 'video' : 'photo',
        filename: meta?.name || 'media_' + msg.id,
        mimeType: doc.mimeType || (isVideo ? 'video/mp4' : 'image/jpeg'),
        sizeBytes: Number(doc.size || 0),
        sha256: meta?.sha || '',
        width: meta?.w || 1920,
        height: meta?.h || 1080,
        takenAt: meta?.taken || new Date(msg.date * 1000).toISOString(),
        isFavorite: meta?.fav === 1,
        isArchived: false,
        uploadedAt: new Date(msg.date * 1000).toISOString(),
        albums: meta?.albums || [],
        latitude: meta?.lat,
        longitude: meta?.lon,
      };

      await db.media.put(mediaRow);
      indexedCount++;
    }

    if (onProgress) {
      onProgress(scannedCount, indexedCount);
    }

    if (messages.length < BATCH_SIZE) break;
  }

  return { totalScanned: scannedCount, totalIndexed: indexedCount };
}
