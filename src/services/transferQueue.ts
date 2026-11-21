import { db } from '../db';
import type { CaptionMetadataV1, UploadJob } from '../types';
import { processMediaFile } from './mediaPipeline';
import { getTelegramClient, uploadMediaDocument } from './tgClient';

type QueueListener = (jobs: UploadJob[]) => void;

class TransferQueueService {
  private listeners: Set<QueueListener> = new Set();
  private isProcessing = false;
  private activeJobsCount = 0;
  private maxConcurrency = 2;
  private cooldownUntil: number | null = null;
  private fileCache: Map<string, File> = new Map();

  subscribe(listener: QueueListener): () => void {
    this.listeners.add(listener);
    this.notify();
    return () => this.listeners.delete(listener);
  }

  private async notify() {
    const jobs = await db.uploadJobs.toArray();
    this.listeners.forEach(fn => fn(jobs));
  }

  async enqueueFiles(files: File[], libraryChannelId: string): Promise<void> {
    for (const file of files) {
      if (file.size > 2_000_000_000) {
        alert(`File ${file.name} exceeds the 2 GB hard limit and cannot be uploaded.`);
        continue;
      }

      const jobId = 'job_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
      this.fileCache.set(jobId, file);

      const job: UploadJob = {
        id: jobId,
        filename: file.name,
        sizeBytes: file.size,
        status: 'queued',
        progress: 0,
        chunksUploaded: 0,
        totalChunks: Math.ceil(file.size / (512 * 1024)),
      };

      await db.uploadJobs.put(job);
    }

    this.notify();
    this.processQueue(libraryChannelId);
  }

  async processQueue(libraryChannelId: string) {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      while (true) {
        // Check cooldown
        if (this.cooldownUntil && Date.now() < this.cooldownUntil) {
          const waitMs = this.cooldownUntil - Date.now();
          console.log(`[TransferQueue] In cooldown for ${Math.round(waitMs / 1000)}s`);
          await new Promise(r => setTimeout(r, Math.min(1000, waitMs)));
          continue;
        }

        if (this.activeJobsCount >= this.maxConcurrency) {
          await new Promise(r => setTimeout(r, 500));
          continue;
        }

        const nextJob = await db.uploadJobs
          .where('status')
          .equals('queued')
          .first();

        if (!nextJob) {
          // Check if any are still active
          const activeAny = await db.uploadJobs
            .where('status')
            .anyOf('processing', 'uploading')
            .count();
          if (activeAny === 0) break;
          await new Promise(r => setTimeout(r, 500));
          continue;
        }

        const file = this.fileCache.get(nextJob.id);
        if (!file) {
          nextJob.status = 'error';
          nextJob.error = 'File handle expired or not found';
          await db.uploadJobs.put(nextJob);
          this.notify();
          continue;
        }

        this.activeJobsCount++;
        this.runJob(nextJob, file, libraryChannelId).finally(() => {
          this.activeJobsCount--;
          this.notify();
          this.processQueue(libraryChannelId);
        });
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async runJob(job: UploadJob, file: File, channelId: string) {
    try {
      // Step 1: Process EXIF & Thumbnail
      job.status = 'processing';
      await db.uploadJobs.put(job);
      this.notify();

      const processed = await processMediaFile(file);
      job.thumbnailDataUrl = processed.thumbnailDataUrl;

      // Step 2: Upload to Telegram
      job.status = 'uploading';
      await db.uploadJobs.put(job);
      this.notify();

      const client = await getTelegramClient();

      const caption: CaptionMetadataV1 = {
        v: 1,
        taken: processed.takenAt,
        w: processed.width,
        h: processed.height,
        sha: processed.sha256.substring(0, 16),
        name: file.name,
        camera: processed.camera,
        lat: processed.latitude,
        lon: processed.longitude,
        fav: 0,
        albums: [],
      };

      const startTime = Date.now();
      let lastUploadedBytes = 0;

      const { messageId } = await uploadMediaDocument(client, channelId, {
        file,
        thumbnailBlob: processed.thumbnailBlob,
        caption,
        onProgress: (progress, uploadedBytes) => {
          job.progress = progress;
          job.chunksUploaded = Math.round(progress * job.totalChunks);
          const elapsedSec = (Date.now() - startTime) / 1000;
          if (elapsedSec > 0) {
            job.currentSpeedBytesSec = Math.round(uploadedBytes / elapsedSec);
          }
          db.uploadJobs.put(job);
          this.notify();
        },
      });

      // Step 3: Insert into media database
      await db.media.put({
        messageId,
        libraryId: channelId,
        kind: processed.kind,
        filename: file.name,
        mimeType: file.type || 'image/jpeg',
        sizeBytes: file.size,
        sha256: processed.sha256,
        width: processed.width,
        height: processed.height,
        durationMs: processed.durationMs,
        takenAt: processed.takenAt,
        latitude: processed.latitude,
        longitude: processed.longitude,
        thumbnailDataUrl: processed.thumbnailDataUrl,
        isFavorite: false,
        isArchived: false,
        uploadedAt: new Date().toISOString(),
        albums: [],
      });

      job.status = 'done';
      job.progress = 1.0;
      await db.uploadJobs.put(job);
      this.fileCache.delete(job.id);
      this.notify();
    } catch (err: any) {
      console.error('[TransferQueue] Upload failed:', err);

      // Check for Telegram FLOOD_WAIT_X
      const match = /FLOOD_WAIT_(\d+)/i.exec(err.message || '');
      if (match) {
        const seconds = parseInt(match[1], 10);
        this.cooldownUntil = Date.now() + (seconds + 2) * 1000;
        job.status = 'cooldown';
        job.cooldownUntil = this.cooldownUntil;
        job.error = `Telegram Rate Limit: Paused for ${seconds}s`;
        await db.uploadJobs.put(job);
        this.notify();
      } else {
        job.status = 'error';
        job.error = err.message || 'Upload failed';
        await db.uploadJobs.put(job);
        this.notify();
      }
    }
  }

  async clearCompleted() {
    const doneJobs = await db.uploadJobs.where('status').equals('done').toArray();
    for (const j of doneJobs) {
      await db.uploadJobs.delete(j.id);
    }
    this.notify();
  }
}

export const transferQueue = new TransferQueueService();
