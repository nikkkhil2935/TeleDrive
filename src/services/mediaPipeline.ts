import ExifReader from 'exifreader';
import type { CaptionMetadataV1, MediaKind } from '../types';

export interface ProcessedMedia {
  file: File;
  kind: MediaKind;
  width: number;
  height: number;
  takenAt: string;
  sha256: string;
  thumbnailBlob: Blob;
  thumbnailDataUrl: string;
  durationMs?: number;
  camera?: string;
  latitude?: number;
  longitude?: number;
}

/**
 * Computes SHA-256 hash of a file or array buffer.
 */
export async function computeSha256(data: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Extracts EXIF, generates thumbnail, and prepares media for upload.
 */
export async function processMediaFile(file: File): Promise<ProcessedMedia> {
  const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|mkv|webm)$/i.test(file.name);
  const kind: MediaKind = isVideo ? 'video' : 'photo';

  const buffer = await file.slice(0, Math.min(file.size, 1024 * 1024 * 2)).arrayBuffer();
  let takenAt = new Date(file.lastModified).toISOString();
  let camera: string | undefined;
  let latitude: number | undefined;
  let longitude: number | undefined;

  // Try extracting EXIF
  if (!isVideo) {
    try {
      const tags = ExifReader.load(buffer, { expanded: true });
      if (tags.exif?.DateTimeOriginal?.description) {
        // EXIF date format: "YYYY:MM:DD HH:MM:SS"
        const dStr = tags.exif.DateTimeOriginal.description.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
        const parsed = new Date(dStr);
        if (!isNaN(parsed.getTime())) {
          takenAt = parsed.toISOString();
        }
      }
      if (tags.exif?.Make?.description || tags.exif?.Model?.description) {
        camera = `${tags.exif?.Make?.description || ''} ${tags.exif?.Model?.description || ''}`.trim();
      }
      if (tags.gps?.Latitude && tags.gps?.Longitude) {
        latitude = Number(tags.gps.Latitude);
        longitude = Number(tags.gps.Longitude);
      }
    } catch (e) {
      console.warn('Could not parse EXIF from file:', file.name, e);
    }
  }

  // Calculate full SHA-256 (or fast chunk hash for large files)
  const fullBuffer = await file.arrayBuffer();
  const sha256 = await computeSha256(fullBuffer);

  // Generate thumbnail and dimensions
  let width = 1920;
  let height = 1080;
  let durationMs: number | undefined;
  let thumbnailBlob: Blob;
  let thumbnailDataUrl: string;

  if (isVideo) {
    const videoResult = await extractVideoPoster(file);
    width = videoResult.width;
    height = videoResult.height;
    durationMs = videoResult.durationMs;
    thumbnailBlob = videoResult.thumbnailBlob;
    thumbnailDataUrl = videoResult.thumbnailDataUrl;
  } else {
    const imgResult = await generateImageThumbnail(file);
    width = imgResult.width;
    height = imgResult.height;
    thumbnailBlob = imgResult.thumbnailBlob;
    thumbnailDataUrl = imgResult.thumbnailDataUrl;
  }

  return {
    file,
    kind,
    width,
    height,
    takenAt,
    sha256,
    thumbnailBlob,
    thumbnailDataUrl,
    durationMs,
    camera,
    latitude,
    longitude,
  };
}

/**
 * Resizes image to thumbnail and returns JPEG blob + dimensions.
 */
async function generateImageThumbnail(file: File): Promise<{ width: number; height: number; thumbnailBlob: Blob; thumbnailDataUrl: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const originalWidth = img.naturalWidth || 800;
      const originalHeight = img.naturalHeight || 600;

      // Fit inside 256x256
      const maxDim = 256;
      let targetW = originalWidth;
      let targetH = originalHeight;
      if (targetW > maxDim || targetH > maxDim) {
        if (targetW > targetH) {
          targetH = Math.round((targetH * maxDim) / targetW);
          targetW = maxDim;
        } else {
          targetW = Math.round((targetW * maxDim) / targetH);
          targetH = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas 2D context'));
        return;
      }
      ctx.drawImage(img, 0, 0, targetW, targetH);
      const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.85);

      canvas.toBlob(blob => {
        if (!blob) {
          reject(new Error('Failed to create thumbnail blob'));
          return;
        }
        resolve({
          width: originalWidth,
          height: originalHeight,
          thumbnailBlob: blob,
          thumbnailDataUrl,
        });
      }, 'image/jpeg', 0.85);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for thumbnailing: ' + e));
    };
    img.src = url;
  });
}

/**
 * Extracts poster frame and metadata from video.
 */
async function extractVideoPoster(file: File): Promise<{ width: number; height: number; durationMs: number; thumbnailBlob: Blob; thumbnailDataUrl: string }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    const url = URL.createObjectURL(file);

    video.onloadedmetadata = () => {
      video.currentTime = Math.min(1.0, video.duration / 2);
    };

    video.onseeked = () => {
      const originalWidth = video.videoWidth || 1280;
      const originalHeight = video.videoHeight || 720;
      const durationMs = Math.round((video.duration || 0) * 1000);

      const maxDim = 256;
      let targetW = originalWidth;
      let targetH = originalHeight;
      if (targetW > maxDim || targetH > maxDim) {
        if (targetW > targetH) {
          targetH = Math.round((targetH * maxDim) / targetW);
          targetW = maxDim;
        } else {
          targetW = Math.round((targetW * maxDim) / targetH);
          targetH = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, targetW, targetH);
        const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        canvas.toBlob(blob => {
          URL.revokeObjectURL(url);
          if (blob) {
            resolve({
              width: originalWidth,
              height: originalHeight,
              durationMs,
              thumbnailBlob: blob,
              thumbnailDataUrl,
            });
          } else {
            reject(new Error('Failed to create video thumbnail blob'));
          }
        }, 'image/jpeg', 0.85);
      } else {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to get 2d context for video poster'));
      }
    };

    video.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to read video metadata: ' + e));
    };

    video.src = url;
  });
}
