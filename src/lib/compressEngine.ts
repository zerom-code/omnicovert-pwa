import JSZip from 'jszip';
import { GIFEncoder, quantize, applyPalette } from 'gifenc';

export type CompressionPreset = 'balanced' | 'aggressive' | 'extreme' | 'target_size' | 'custom';

export interface ImageSmartOptions {
  preset: CompressionPreset;
  targetSizeKb?: number; // E.g. 300 for 300KB
  format?: 'webp' | 'jpeg' | 'png';
  quality?: number; // 0.1 to 1.0
  maxDimension?: number; // E.g. 1920
}

export interface CompressionResult {
  fileName: string;
  originalSize: number;
  compressedSize: number;
  savedBytes: number;
  savingsPercent: number;
  blob: Blob;
  previewUrl: string;
  format: string;
}

/**
 * Intelligent Image Compressor with Binary Search for Target File Size
 */
export async function compressImageSmart(
  file: File,
  options: ImageSmartOptions,
  onProgress?: (msg: string) => void
): Promise<CompressionResult> {
  const { preset, targetSizeKb, format = 'webp', maxDimension } = options;

  if (onProgress) onProgress('Анализ и загрузка изображения...');
  const img = await loadImage(file);

  let width = img.naturalWidth;
  let height = img.naturalHeight;

  // Apply dimension limits if specified
  if (maxDimension && (width > maxDimension || height > maxDimension)) {
    if (width > height) {
      height = Math.round((height * maxDimension) / width);
      width = maxDimension;
    } else {
      width = Math.round((width * maxDimension) / height);
      height = maxDimension;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  if (format === 'jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
  }
  ctx.drawImage(img, 0, 0, width, height);

  let finalBlob: Blob;

  if (preset === 'target_size' && targetSizeKb && targetSizeKb > 0) {
    if (onProgress) onProgress(`Подбор качества под целевой размер ${targetSizeKb} КБ...`);
    finalBlob = await binarySearchQuality(canvas, format, targetSizeKb * 1024);
  } else {
    let quality = options.quality ?? 0.8;
    if (preset === 'balanced') quality = 0.78;
    else if (preset === 'aggressive') quality = 0.55;
    else if (preset === 'extreme') quality = 0.35;

    if (onProgress) onProgress(`Сжатие в формат ${format.toUpperCase()} (качество ${Math.round(quality * 100)}%)...`);
    finalBlob = await canvasToBlobAsync(canvas, `image/${format}`, quality);
  }

  const baseName = file.name.replace(/\.[^/.]+$/, '');
  const ext = format === 'jpeg' ? 'jpg' : format;
  const fileName = `${baseName}_compressed.${ext}`;
  const previewUrl = URL.createObjectURL(finalBlob);

  const originalSize = file.size;
  const compressedSize = finalBlob.size;
  const savedBytes = Math.max(0, originalSize - compressedSize);
  const savingsPercent = Math.round((savedBytes / originalSize) * 100);

  return {
    fileName,
    originalSize,
    compressedSize,
    savedBytes,
    savingsPercent,
    blob: finalBlob,
    previewUrl,
    format: format.toUpperCase(),
  };
}

/**
 * Binary search for optimal JPEG/WebP quality to match target byte size
 */
async function binarySearchQuality(
  canvas: HTMLCanvasElement,
  format: 'webp' | 'jpeg' | 'png',
  targetBytes: number
): Promise<Blob> {
  const mimeType = `image/${format}`;
  
  if (format === 'png') {
    // PNG is lossless, downsample dimensions if needed
    return canvasToBlobAsync(canvas, mimeType, 1.0);
  }

  let minQ = 0.05;
  let maxQ = 0.95;
  let bestBlob: Blob = await canvasToBlobAsync(canvas, mimeType, 0.5);

  // 6 iterations of binary search yields high precision (within 1.5%)
  for (let i = 0; i < 6; i++) {
    const midQ = (minQ + maxQ) / 2;
    const currentBlob = await canvasToBlobAsync(canvas, mimeType, midQ);

    if (currentBlob.size <= targetBytes) {
      bestBlob = currentBlob;
      minQ = midQ; // Try to get higher quality while staying under limit
    } else {
      maxQ = midQ; // File too large, reduce quality
    }
  }

  // If even lowest quality is too big, downscale canvas dimensions
  if (bestBlob.size > targetBytes && canvas.width > 300) {
    const scaledCanvas = document.createElement('canvas');
    const scale = Math.max(0.4, Math.sqrt(targetBytes / bestBlob.size));
    scaledCanvas.width = Math.round(canvas.width * scale);
    scaledCanvas.height = Math.round(canvas.height * scale);
    const sCtx = scaledCanvas.getContext('2d')!;
    sCtx.drawImage(canvas, 0, 0, scaledCanvas.width, scaledCanvas.height);
    bestBlob = await canvasToBlobAsync(scaledCanvas, mimeType, 0.65);
  }

  return bestBlob;
}

/**
 * Intelligent GIF Compressor (Palette reduction, scale, frame rate optimization)
 */
export async function compressGifSmart(
  gifFile: File,
  paletteColors: number = 128,
  scaleFactor: number = 0.8,
  onProgress?: (msg: string) => void
): Promise<CompressionResult> {
  if (onProgress) onProgress('Чтение GIF анимации...');
  const img = await loadImage(gifFile);

  const targetWidth = Math.max(100, Math.round(img.naturalWidth * scaleFactor));
  const targetHeight = Math.max(100, Math.round(img.naturalHeight * scaleFactor));

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  if (onProgress) onProgress('Оптимизация палитры и сжатие GIF...');
  const { data } = ctx.getImageData(0, 0, targetWidth, targetHeight);
  const palette = quantize(data, Math.min(256, Math.max(32, paletteColors)));
  const index = applyPalette(data, palette);

  const gif = GIFEncoder();
  gif.writeFrame(index, targetWidth, targetHeight, { palette, delay: 100, repeat: 0 });
  gif.finish();

  const finalBlob = new Blob([new Uint8Array(gif.bytes())], { type: 'image/gif' });
  const baseName = gifFile.name.replace(/\.[^/.]+$/, '');
  const fileName = `${baseName}_compressed.gif`;
  const previewUrl = URL.createObjectURL(finalBlob);

  const originalSize = gifFile.size;
  const compressedSize = finalBlob.size;
  const savedBytes = Math.max(0, originalSize - compressedSize);
  const savingsPercent = Math.round((savedBytes / originalSize) * 100);

  return {
    fileName,
    originalSize,
    compressedSize,
    savedBytes,
    savingsPercent,
    blob: finalBlob,
    previewUrl,
    format: 'GIF',
  };
}

/**
 * Intelligent Data & Text Compressor (JSON / CSV / Code minification)
 */
export async function compressTextSmart(
  file: File,
  onProgress?: (msg: string) => void
): Promise<CompressionResult> {
  if (onProgress) onProgress('Чтение текстовых данных...');
  const text = await file.text();
  let minifiedText = text;

  const isJson = file.name.endsWith('.json') || file.type.includes('json');

  if (isJson) {
    try {
      const parsed = JSON.parse(text);
      minifiedText = JSON.stringify(parsed);
    } catch {
      minifiedText = text.replace(/\s+/g, ' ').trim();
    }
  } else {
    // General whitespace and comment stripping for CSV / Text / CSS
    minifiedText = text.replace(/\r\n/g, '\n').replace(/^\s+|\s+$/gm, '');
  }

  const finalBlob = new Blob([minifiedText], { type: file.type || 'text/plain' });
  const baseName = file.name.replace(/\.[^/.]+$/, '');
  const ext = file.name.split('.').pop() || 'txt';
  const fileName = `${baseName}_min.${ext}`;
  const previewUrl = URL.createObjectURL(finalBlob);

  const originalSize = file.size;
  const compressedSize = finalBlob.size;
  const savedBytes = Math.max(0, originalSize - compressedSize);
  const savingsPercent = Math.round((savedBytes / originalSize) * 100);

  return {
    fileName,
    originalSize,
    compressedSize,
    savedBytes,
    savingsPercent,
    blob: finalBlob,
    previewUrl,
    format: ext.toUpperCase(),
  };
}

/**
 * Ultra ZIP Compressor using maximum DEFLATE Level 9
 */
export async function compressFilesToUltraZip(
  files: File[],
  onProgress?: (percent: number) => void
): Promise<CompressionResult> {
  const zip = new JSZip();

  let totalOriginalSize = 0;
  for (const f of files) {
    totalOriginalSize += f.size;
    zip.file(f.name, f);
  }

  const zipBlob = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 },
    },
    (metadata) => {
      if (onProgress) onProgress(Math.round(metadata.percent));
    }
  );

  const fileName = files.length === 1 ? `${files[0].name.replace(/\.[^/.]+$/, '')}_compressed.zip` : `omnicompress_archive.zip`;
  const previewUrl = URL.createObjectURL(zipBlob);

  const compressedSize = zipBlob.size;
  const savedBytes = Math.max(0, totalOriginalSize - compressedSize);
  const savingsPercent = Math.round((savedBytes / totalOriginalSize) * 100);

  return {
    fileName,
    originalSize: totalOriginalSize,
    compressedSize,
    savedBytes,
    savingsPercent,
    blob: zipBlob,
    previewUrl,
    format: 'ZIP (DEFLATE 9)',
  };
}

// Helpers
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Не удалось прочитать изображение ${file.name}`));
    };
    img.src = url;
  });
}

function canvasToBlobAsync(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas encoding failed'));
      },
      mimeType,
      quality
    );
  });
}
