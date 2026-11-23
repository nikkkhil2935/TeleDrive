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
  private pausedJobIds: Set<string> = new Set();

  getMaxConcurrency(): number {
    return this.maxConcurrency;
  }

  setMaxConcurrency(count: number): void {
    this.maxConcurrency = Math.max(1, Math.min(4, count));
  }

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

      // Persist the File Blob to IndexedDB so uploads survive browser refresh
      try {
        await db.uploadBlobs.put({
          id: jobId,
          blob: file,
          filename: file.name,
          mimeType: file.type || 'application/octet-stream',
          lastModified: file.lastModified || Date.now(),
        });
      } catch (blobErr) {
        console.warn('[TransferQueue] Could not persist blob to IndexedDB (will use memory cache):', blobErr);
      }

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

        // Check if user paused this job
        if (this.pausedJobIds.has(nextJob.id)) {
          nextJob.status = 'paused';
          await db.uploadJobs.put(nextJob);
          this.notify();
          continue;
        }

        let file = this.fileCache.get(nextJob.id);
        if (!file) {
          // Attempt to restore file from IndexedDB uploadBlobs table across browser refresh
          try {
            const record = await db.uploadBlobs.get(nextJob.id);
            if (record && record.blob) {
              file = new File([record.blob], record.filename, {
                type: record.mimeType,
                lastModified: record.lastModified,
              });
              this.fileCache.set(nextJob.id, file);
              console.info(`[TransferQueue] Restored file "${record.filename}" from persistent IndexedDB.`);
            }
          } catch (restoreErr) {
            console.warn('[TransferQueue] Error reading from persistent uploadBlobs:', restoreErr);
          }
        }

        if (!file) {
          nextJob.status = 'error';
          nextJob.error = 'File handle expired or not found. Click retry to re-select.';
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
      if (this.pausedJobIds.has(job.id)) {
        job.status = 'paused';
        await db.uploadJobs.put(job);
        this.notify();
        return;
      }

      // Step 1: Process EXIF & Thumbnail
      job.status = 'processing';
      await db.uploadJobs.put(job);
      this.notify();

      const processed = await processMediaFile(file);
      job.thumbnailDataUrl = processed.thumbnailDataUrl;

      if (this.pausedJobIds.has(job.id)) {
        job.status = 'paused';
        await db.uploadJobs.put(job);
        this.notify();
        return;
      }

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
      let lastProgressNotify = 0;

      const { messageId } = await uploadMediaDocument(client, channelId, {
        file,
        thumbnailBlob: processed.thumbnailBlob,
        caption,
        onProgress: (progress, uploadedBytes) => {
          // If paused mid-flight, do not progress
          if (this.pausedJobIds.has(job.id)) {
            return;
          }
          job.progress = progress;
          job.chunksUploaded = Math.round(progress * job.totalChunks);
          const elapsedSec = (Date.now() - startTime) / 1000;
          if (elapsedSec > 0) {
            job.currentSpeedBytesSec = Math.round(uploadedBytes / elapsedSec);
          }
          const now = Date.now();
          if (now - lastProgressNotify > 120 || progress >= 1.0) {
            lastProgressNotify = now;
            db.uploadJobs.put(job);
            this.notify();
          }
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
      this.pausedJobIds.delete(job.id);
      try {
        await db.uploadBlobs.delete(job.id);
      } catch (e) {}
      this.notify();
    } catch (err: any) {
      if (this.pausedJobIds.has(job.id)) {
        job.status = 'paused';
        await db.uploadJobs.put(job);
        this.notify();
        return;
      }

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
        job.error = err?.message || 'Upload error';
        await db.uploadJobs.put(job);
        this.notify();
      }
    }
  }

  // Individual Pause
  async pauseJob(jobId: string) {
    this.pausedJobIds.add(jobId);
    const job = await db.uploadJobs.get(jobId);
    if (job) {
      job.status = 'paused';
      await db.uploadJobs.put(job);
      this.notify();
    }
  }

  // Individual Resume
  async resumeJob(jobId: string, channelId?: string) {
    this.pausedJobIds.delete(jobId);
    const job = await db.uploadJobs.get(jobId);
    if (job) {
      job.status = 'queued';
      job.error = undefined;
      await db.uploadJobs.put(job);
      this.notify();
      if (channelId) {
        this.processQueue(channelId);
      }
    }
  }

  // Pause All Jobs
  async pauseAll() {
    const jobs = await db.uploadJobs
      .where('status')
      .anyOf('queued', 'processing', 'uploading')
      .toArray();

    for (const j of jobs) {
      this.pausedJobIds.add(j.id);
      j.status = 'paused';
      await db.uploadJobs.put(j);
    }
    this.notify();
  }

  // Resume All Jobs
  async resumeAll(channelId: string) {
    this.pausedJobIds.clear();
    const paused = await db.uploadJobs.where('status').equals('paused').toArray();
    for (const j of paused) {
      j.status = 'queued';
      j.error = undefined;
      await db.uploadJobs.put(j);
    }
    this.notify();
    this.processQueue(channelId);
  }

  async clearCompleted() {
    const doneJobs = await db.uploadJobs.where('status').equals('done').toArray();
    for (const j of doneJobs) {
      await db.uploadJobs.delete(j.id);
      await db.uploadBlobs.delete(j.id).catch(() => {});
    }
    this.notify();
  }

  async retrySingleJob(jobId: string, channelId?: string) {
    this.pausedJobIds.delete(jobId);
    const job = await db.uploadJobs.get(jobId);
    if (!job) return;

    let hasFile = this.fileCache.has(jobId);
    if (!hasFile) {
      const stored = await db.uploadBlobs.get(jobId).catch(() => null);
      if (stored) hasFile = true;
    }

    if (hasFile) {
      job.status = 'queued';
      job.error = undefined;
      job.progress = 0;
      await db.uploadJobs.put(job);
      this.notify();
      if (channelId) {
        this.processQueue(channelId);
      }
    } else {
      job.status = 'error';
      job.error = 'File handle expired. Click + to re-upload.';
      await db.uploadJobs.put(job);
      this.notify();
    }
  }

  async removeJob(jobId: string) {
    this.pausedJobIds.delete(jobId);
    await db.uploadJobs.delete(jobId);
    await db.uploadBlobs.delete(jobId).catch(() => {});
    this.fileCache.delete(jobId);
    this.notify();
  }

  async retryFailedJobs(channelId?: string) {
    const failedJobs = await db.uploadJobs.where('status').equals('error').toArray();
    for (const j of failedJobs) {
      this.pausedJobIds.delete(j.id);
      let hasFile = this.fileCache.has(j.id);
      if (!hasFile) {
        const stored = await db.uploadBlobs.get(j.id).catch(() => null);
        if (stored) hasFile = true;
      }

      if (hasFile) {
        j.status = 'queued';
        j.error = undefined;
        j.progress = 0;
        await db.uploadJobs.put(j);
      } else {
        await db.uploadJobs.delete(j.id);
        await db.uploadBlobs.delete(j.id).catch(() => {});
      }
    }
    this.notify();
    if (channelId) {
      this.processQueue(channelId);
    }
  }

  async clearAll() {
    this.pausedJobIds.clear();
    await db.uploadJobs.clear();
    await db.uploadBlobs.clear().catch(() => {});
    this.fileCache.clear();
    this.notify();
  }
}

export const transferQueue = new TransferQueueService();
