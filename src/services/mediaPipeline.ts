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
 * Computes memory-safe SHA-256 hash of a file or array buffer.
 */
export async function computeSha256(fileOrBuffer: File | ArrayBuffer): Promise<string> {
  try {
    if (fileOrBuffer instanceof ArrayBuffer) {
      const hashBuffer = await crypto.subtle.digest('SHA-256', fileOrBuffer);
      return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Memory safe: For files <= 20 MB, hash full buffer
    if (fileOrBuffer.size <= 20 * 1024 * 1024) {
      const buf = await fileOrBuffer.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buf);
      return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // For large files (> 20 MB, e.g. 140MB videos), hash head (4MB) + tail (4MB) + size
    const sliceSize = Math.min(4 * 1024 * 1024, Math.floor(fileOrBuffer.size / 2));
    const head = await fileOrBuffer.slice(0, sliceSize).arrayBuffer();
    const tail = await fileOrBuffer.slice(fileOrBuffer.size - sliceSize).arrayBuffer();
    const combined = new Uint8Array(head.byteLength + tail.byteLength);
    combined.set(new Uint8Array(head), 0);
    combined.set(new Uint8Array(tail), head.byteLength);
    const hashBuffer = await crypto.subtle.digest('SHA-256', combined.buffer);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (err) {
    console.warn('SHA-256 computation fallback:', err);
    return `sha_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Extracts EXIF, generates thumbnail, and prepares media for upload.
 */
export async function processMediaFile(file: File): Promise<ProcessedMedia> {
  const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|mkv|webm|avi|m4v)$/i.test(file.name);
  const kind: MediaKind = isVideo ? 'video' : 'photo';

  let takenAt = new Date(file.lastModified || Date.now()).toISOString();
  let camera: string | undefined;
  let latitude: number | undefined;
  let longitude: number | undefined;

  // Try extracting EXIF for photos
  if (!isVideo) {
    try {
      const headerSlice = await file.slice(0, Math.min(file.size, 1024 * 1024 * 2)).arrayBuffer();
      const tags = ExifReader.load(headerSlice, { expanded: true });
      if (tags.exif?.DateTimeOriginal?.description) {
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

  // Calculate memory-safe SHA-256
  const sha256 = await computeSha256(file);

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
 * Creates a valid JPEG fallback blob and DataURL on an HTML Canvas.
 * Telegram MTProto strictly requires JPEG (image/jpeg) thumbnails; SVG blobs cause MTProto RPC errors.
 */
function createFallbackJpegBlob(
  width: number,
  height: number,
  label: string,
  isVideo = false
): Promise<{ width: number; height: number; thumbnailBlob: Blob; thumbnailDataUrl: string }> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = Math.min(width || 1280, 640);
    canvas.height = Math.min(height || 720, 360);
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Dark slate background gradient
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(1, '#1e293b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (isVideo) {
        // Play circle
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2 - 14, 28, 0, Math.PI * 2);
        ctx.fill();

        // Play triangle
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2 - 8, canvas.height / 2 - 26);
        ctx.lineTo(canvas.width / 2 + 14, canvas.height / 2 - 14);
        ctx.lineTo(canvas.width / 2 - 8, canvas.height / 2 - 2);
        ctx.closePath();
        ctx.fill();
      } else {
        // Photo icon circle
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2 - 14, 28, 0, Math.PI * 2);
        ctx.fill();
      }

      // Filename label
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label.slice(0, 30), canvas.width / 2, canvas.height / 2 + 36);
    }

    const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.85);
    canvas.toBlob(
      (blob) => {
        resolve({
          width: width || 1920,
          height: height || 1080,
          thumbnailBlob: blob || new Blob([], { type: 'image/jpeg' }),
          thumbnailDataUrl,
        });
      },
      'image/jpeg',
      0.85
    );
  });
}

/**
 * Resizes image to thumbnail and returns JPEG blob + dimensions.
 */
async function generateImageThumbnail(file: File): Promise<{ width: number; height: number; thumbnailBlob: Blob; thumbnailDataUrl: string }> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    const fallback = async () => {
      URL.revokeObjectURL(url);
      const res = await createFallbackJpegBlob(1920, 1080, file.name, false);
      resolve(res);
    };

    img.onload = () => {
      URL.revokeObjectURL(url);
      const originalWidth = img.naturalWidth || 1920;
      const originalHeight = img.naturalHeight || 1080;

      const maxDim = 720;
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
        fallback();
        return;
      }
      ctx.drawImage(img, 0, 0, targetW, targetH);
      const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.85);

      canvas.toBlob(blob => {
        if (!blob) {
          fallback();
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

    img.onerror = () => {
      fallback();
    };

    img.src = url;
  });
}

/**
 * Robustly extracts poster frame from video with safe timeout & codec fallback (e.g. MOV, HEVC).
 */
async function extractVideoPoster(file: File): Promise<{ width: number; height: number; durationMs: number; thumbnailBlob: Blob; thumbnailDataUrl: string }> {
  return new Promise((resolve) => {
    let settled = false;

    const fallback = async () => {
      if (settled) return;
      settled = true;
      try { URL.revokeObjectURL(url); } catch (e) {}

      const res = await createFallbackJpegBlob(1920, 1080, file.name, true);
      resolve({
        width: res.width,
        height: res.height,
        durationMs: 0,
        thumbnailBlob: res.thumbnailBlob,
        thumbnailDataUrl: res.thumbnailDataUrl,
      });
    };

    // 3.5 second safety timeout: if video cannot be decoded by browser, gracefully use fallback
    const timer = setTimeout(fallback, 3500);

    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    const url = URL.createObjectURL(file);

    video.onloadedmetadata = () => {
      if (settled) return;
      video.currentTime = Math.min(1.0, (video.duration || 2) / 2);
    };

    video.onseeked = () => {
      if (settled) return;
      clearTimeout(timer);
      settled = true;

      const originalWidth = video.videoWidth || 1920;
      const originalHeight = video.videoHeight || 1080;
      const durationMs = Math.round((video.duration || 0) * 1000);

      const maxDim = 720;
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
            fallback();
          }
        }, 'image/jpeg', 0.85);
      } else {
        fallback();
      }
    };

    video.onerror = () => {
      fallback();
    };

    video.src = url;
  });
}
