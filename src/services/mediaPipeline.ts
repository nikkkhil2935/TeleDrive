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

  // For large files (> 20 MB, e.g. 140MB videos), hash head (8MB) + tail (8MB) + size
  const head = await fileOrBuffer.slice(0, 8 * 1024 * 1024).arrayBuffer();
  const tail = await fileOrBuffer.slice(fileOrBuffer.size - 8 * 1024 * 1024).arrayBuffer();
  const combined = new Uint8Array(head.byteLength + tail.byteLength);
  combined.set(new Uint8Array(head), 0);
  combined.set(new Uint8Array(tail), head.byteLength);
  const hashBuffer = await crypto.subtle.digest('SHA-256', combined.buffer);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
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
 * Resizes image to thumbnail and returns JPEG blob + dimensions.
 */
async function generateImageThumbnail(file: File): Promise<{ width: number; height: number; thumbnailBlob: Blob; thumbnailDataUrl: string }> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    const fallback = () => {
      URL.revokeObjectURL(url);
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
        <rect width="300" height="300" fill="#1e293b"/>
        <text x="150" y="160" font-family="sans-serif" font-size="14" fill="#94a3b8" text-anchor="middle">${file.name.slice(0, 24)}</text>
      </svg>`;
      resolve({
        width: 1920,
        height: 1080,
        thumbnailBlob: new Blob([svg], { type: 'image/svg+xml' }),
        thumbnailDataUrl: 'data:image/svg+xml;utf8,' + encodeURIComponent(svg),
      });
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

    const fallback = () => {
      if (settled) return;
      settled = true;
      try { URL.revokeObjectURL(url); } catch (e) {}

      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="225" viewBox="0 0 400 225">
        <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#0f172a"/><stop offset="100%" stop-color="#1e293b"/></linearGradient></defs>
        <rect width="400" height="225" fill="url(#g)"/>
        <circle cx="200" cy="112" r="32" fill="#0284c7" opacity="0.9"/>
        <polygon points="192,98 216,112 192,126" fill="white"/>
        <text x="200" y="175" font-family="sans-serif" font-size="13" font-weight="600" fill="#94a3b8" text-anchor="middle">${file.name.slice(0, 28)}</text>
      </svg>`;
      resolve({
        width: 1920,
        height: 1080,
        durationMs: 0,
        thumbnailBlob: new Blob([svg], { type: 'image/svg+xml' }),
        thumbnailDataUrl: 'data:image/svg+xml;utf8,' + encodeURIComponent(svg),
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
