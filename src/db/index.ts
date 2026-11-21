import Dexie, { type Table } from 'dexie';
import type { MediaItem, Album, UploadJob } from '../types';

export class TelegramPhotosDatabase extends Dexie {
  media!: Table<MediaItem, number>;
  albums!: Table<Album, number>;
  uploadJobs!: Table<UploadJob, string>;
  settings!: Table<{ key: string; value: any }, string>;

  constructor() {
    super('TelegramPhotosDB_v2');
    this.version(1).stores({
      // messageId is the canonical unique primary key from Telegram
      media: 'messageId, libraryId, takenAt, filename, kind, isFavorite, isArchived, *albums, uploadedAt',
      albums: '++id, &name, createdAt',
      uploadJobs: 'id, status, progress, cooldownUntil',
      settings: 'key',
    });
  }
}

export const db = new TelegramPhotosDatabase();
