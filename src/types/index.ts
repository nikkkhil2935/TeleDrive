export type MediaKind = 'photo' | 'video';

export interface CaptionMetadataV1 {
  v: 1;
  taken: string; // ISO 8601
  w: number;
  h: number;
  sha: string;
  name: string;
  albums?: string[];
  fav?: 0 | 1;
  camera?: string;
  lat?: number;
  lon?: number;
}

export interface MediaItem {
  messageId: number; // Telegram message ID (Canonical Primary Key)
  libraryId: string;
  kind: MediaKind;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  width: number;
  height: number;
  durationMs?: number;
  takenAt: string; // ISO string
  latitude?: number;
  longitude?: number;
  placeName?: string;
  thumbnailDataUrl?: string; // cached data URL
  isFavorite: boolean;
  isArchived: boolean;
  trashedAt?: string;
  uploadedAt: string;
  albums: string[];
}

export interface Album {
  id?: number;
  name: string;
  coverMediaId?: number;
  createdAt: string;
}

export type JobStatus = 'queued' | 'processing' | 'uploading' | 'cooldown' | 'done' | 'error';

export interface UploadJob {
  id: string;
  filename: string;
  sizeBytes: number;
  status: JobStatus;
  progress: number; // 0.0 to 1.0
  chunksUploaded: number;
  totalChunks: number;
  currentSpeedBytesSec?: number;
  cooldownUntil?: number; // epoch ms if flood wait
  error?: string;
  file?: File;
  thumbnailDataUrl?: string;
  metadata?: Partial<CaptionMetadataV1>;
}

export interface UserSession {
  apiId: number;
  apiHash: string;
  sessionString: string;
  channelId?: string;
  channelTitle?: string;
  userId?: string;
  userName?: string;
  phone?: string;
}
