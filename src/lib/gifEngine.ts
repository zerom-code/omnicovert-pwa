import { GIFEncoder, quantize, applyPalette } from 'gifenc';

export interface GifOptions {
  fps: number;
  quality?: number; // 1-30 (lower is better in quantize)
  width?: number;
  height?: number;
  loop?: boolean;
}

/**
 * Encodes a series of images (Photos) into an animated GIF
 */
export async function createGifFromImages(
  files: File[],
  options: GifOptions,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  const { fps = 10, loop = true, width, height } = options;
  const delay = Math.round(1000 / fps);

  // Load all images
  const loadedImages: HTMLImageElement[] = await Promise.all(
    files.map(
      (file) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = URL.createObjectURL(file);
        })
    )
  );

  if (loadedImages.length === 0) {
    throw new Error('No images provided');
  }

  // Determine output canvas size
  const outWidth = width || loadedImages[0].naturalWidth || 480;
  const outHeight = height || loadedImages[0].naturalHeight || 480;

  const canvas = document.createElement('canvas');
  canvas.width = outWidth;
  canvas.height = outHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

  const gif = GIFEncoder();

  for (let i = 0; i < loadedImages.length; i++) {
    const img = loadedImages[i];
    ctx.clearRect(0, 0, outWidth, outHeight);

    // Draw image maintaining aspect ratio centered
    const hRatio = outWidth / img.naturalWidth;
    const vRatio = outHeight / img.naturalHeight;
    const ratio = Math.min(hRatio, vRatio);
    const centerShiftX = (outWidth - img.naturalWidth * ratio) / 2;
    const centerShiftY = (outHeight - img.naturalHeight * ratio) / 2;

    ctx.drawImage(
      img,
      0,
      0,
      img.naturalWidth,
      img.naturalHeight,
      centerShiftX,
      centerShiftY,
      img.naturalWidth * ratio,
      img.naturalHeight * ratio
    );

    const { data } = ctx.getImageData(0, 0, outWidth, outHeight);
    const palette = quantize(data, 256);
    const index = applyPalette(data, palette);

    gif.writeFrame(index, outWidth, outHeight, {
      palette,
      delay,
      repeat: loop ? 0 : -1,
    });

    if (onProgress) {
      onProgress(Math.round(((i + 1) / loadedImages.length) * 100));
    }
  }

  gif.finish();
  return new Blob([new Uint8Array(gif.bytes())], { type: 'image/gif' });
}

/**
 * Extracts frames from a video and encodes into a GIF
 */
export async function createGifFromVideo(
  videoFile: File,
  startTime: number,
  duration: number,
  fps: number = 10,
  targetWidth: number = 480,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  const videoUrl = URL.createObjectURL(videoFile);
  const video = document.createElement('video');
  video.src = videoUrl;
  video.muted = true;
  video.playsInline = true;

  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error('Failed to load video'));
  });

  const totalFrames = Math.max(1, Math.floor(duration * fps));
  const frameInterval = 1 / fps;
  const aspectRatio = video.videoHeight / video.videoWidth;
  const outWidth = targetWidth;
  const outHeight = Math.round(targetWidth * aspectRatio);

  const canvas = document.createElement('canvas');
  canvas.width = outWidth;
  canvas.height = outHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

  const gif = GIFEncoder();
  const delay = Math.round(1000 / fps);

  for (let i = 0; i < totalFrames; i++) {
    const currentTime = startTime + i * frameInterval;
    video.currentTime = currentTime;

    await new Promise<void>((resolve) => {
      const onSeeked = () => {
        video.removeEventListener('seeked', onSeeked);
        resolve();
      };
      video.addEventListener('seeked', onSeeked);
    });

    ctx.clearRect(0, 0, outWidth, outHeight);
    ctx.drawImage(video, 0, 0, outWidth, outHeight);

    const { data } = ctx.getImageData(0, 0, outWidth, outHeight);
    const palette = quantize(data, 256);
    const index = applyPalette(data, palette);

    gif.writeFrame(index, outWidth, outHeight, {
      palette,
      delay,
      repeat: 0,
    });

    if (onProgress) {
      onProgress(Math.round(((i + 1) / totalFrames) * 100));
    }
  }

  gif.finish();
  URL.revokeObjectURL(videoUrl);
  return new Blob([new Uint8Array(gif.bytes())], { type: 'image/gif' });
}
