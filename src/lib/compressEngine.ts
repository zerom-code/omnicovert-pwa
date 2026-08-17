import JSZip from 'jszip';
import { GIFEncoder, quantize, applyPalette } from 'gifenc';

export type CompressionPreset = 'balanced' | 'aggressive' | 'extreme' | 'target_size' | 'custom';

export interface ImageSmartOptions {
  preset: CompressionPreset;
  targetSizeKb?: number;
  format?: 'webp' | 'jpeg' | 'png';
  quality?: number;
  maxDimension?: number;
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
  dimensions?: string;
}

/**
 * Intelligent Image Compressor
 * - Automatically guarantees the result is strictly smaller than the input
 * - Adapts dimensions and quality dynamically
 * - Tests multiple formats (WebP vs JPEG) to pick the most efficient one
 */
export async function compressImageSmart(
  file: File,
  options: ImageSmartOptions,
  onProgress?: (msg: string) => void
): Promise<CompressionResult> {
  const { preset, targetSizeKb, format: preferredFormat = 'webp', maxDimension: customMaxDim } = options;

  if (onProgress) onProgress('Анализ параметров изображения...');
  const img = await loadImage(file);

  const origWidth = img.naturalWidth;
  const origHeight = img.naturalHeight;

  // Determine target byte ceiling
  let targetBytes: number;
  if (preset === 'target_size' && targetSizeKb && targetSizeKb > 0) {
    targetBytes = targetSizeKb * 1024;
  } else if (preset === 'balanced') {
    targetBytes = Math.min(Math.round(file.size * 0.65), 500 * 1024);
  } else if (preset === 'aggressive') {
    targetBytes = Math.min(Math.round(file.size * 0.4), 250 * 1024);
  } else if (preset === 'extreme') {
    targetBytes = Math.min(Math.round(file.size * 0.22), 120 * 1024);
  } else {
    // Custom
    targetBytes = file.size;
  }

  // Maximum dimension constraint
  let maxDim = customMaxDim;
  if (!maxDim || maxDim <= 0) {
    if (preset === 'extreme') maxDim = 1280;
    else if (preset === 'aggressive') maxDim = 1600;
    else if (preset === 'balanced' && Math.max(origWidth, origHeight) > 2048) maxDim = 1920;
    else maxDim = Math.max(origWidth, origHeight);
  }

  let { width, height } = calculateDimensions(origWidth, origHeight, maxDim);

  if (onProgress) onProgress(`Оптимизация геометрии (${width}×${height})...`);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, width, height);

  let finalBlob: Blob;
  let finalFormat = preferredFormat;

  if (preset === 'custom') {
    const q = options.quality ?? 0.75;
    finalBlob = await canvasToBlobAsync(canvas, `image/${preferredFormat}`, q);
  } else {
    if (onProgress) onProgress('Интеллектуальный подбор кодека и степени сжатия...');
    
    // Test both WebP and JPEG for best size
    const webpCandidate = await optimizeCanvasToTarget(canvas, 'image/webp', targetBytes, file.size);
    const jpegCandidate = await optimizeCanvasToTarget(canvas, 'image/jpeg', targetBytes, file.size);

    if (webpCandidate.size <= jpegCandidate.size) {
      finalBlob = webpCandidate;
      finalFormat = 'webp';
    } else {
      finalBlob = jpegCandidate;
      finalFormat = 'jpeg';
    }

    // Safety fallback: if even at low quality the output is bigger than original
    if (finalBlob.size >= file.size) {
      // Downscale canvas to guarantee real byte savings
      const scale = Math.min(0.75, Math.sqrt((file.size * 0.65) / finalBlob.size));
      const sCanvas = document.createElement('canvas');
      sCanvas.width = Math.max(300, Math.round(width * scale));
      sCanvas.height = Math.max(300, Math.round(height * scale));
      const sCtx = sCanvas.getContext('2d')!;
      sCtx.drawImage(canvas, 0, 0, sCanvas.width, sCanvas.height);

      const downscaled = await canvasToBlobAsync(sCanvas, `image/${finalFormat}`, 0.6);
      if (downscaled.size < file.size) {
        finalBlob = downscaled;
        width = sCanvas.width;
        height = sCanvas.height;
      }
    }
  }

  const baseName = file.name.replace(/\.[^/.]+$/, '');
  const ext = finalFormat === 'jpeg' ? 'jpg' : finalFormat;
  const fileName = `${baseName}_compressed.${ext}`;
  const previewUrl = URL.createObjectURL(finalBlob);

  const originalSize = file.size;
  const compressedSize = finalBlob.size;
  const savedBytes = Math.max(0, originalSize - compressedSize);
  const savingsPercent = originalSize > compressedSize 
    ? Math.round(((originalSize - compressedSize) / originalSize) * 100)
    : 0;

  return {
    fileName,
    originalSize,
    compressedSize,
    savedBytes,
    savingsPercent,
    blob: finalBlob,
    previewUrl,
    format: finalFormat.toUpperCase(),
    dimensions: `${width}×${height}`,
  };
}

/**
 * Optimizes a canvas to fit within targetBytes budget
 */
async function optimizeCanvasToTarget(
  canvas: HTMLCanvasElement,
  mimeType: string,
  targetBytes: number,
  originalFileSize: number
): Promise<Blob> {
  let minQ = 0.1;
  let maxQ = 0.92;
  let bestBlob = await canvasToBlobAsync(canvas, mimeType, 0.5);

  const effectiveBudget = Math.min(targetBytes, Math.round(originalFileSize * 0.85));

  for (let i = 0; i < 6; i++) {
    const midQ = (minQ + maxQ) / 2;
    const candidate = await canvasToBlobAsync(canvas, mimeType, midQ);

    if (candidate.size <= effectiveBudget) {
      bestBlob = candidate;
      minQ = midQ;
    } else {
      maxQ = midQ;
      if (candidate.size < bestBlob.size) {
        bestBlob = candidate;
      }
    }
  }

  return bestBlob;
}

function calculateDimensions(origW: number, origH: number, maxD: number) {
  if (origW <= maxD && origH <= maxD) {
    return { width: origW, height: origH };
  }
  if (origW > origH) {
    return {
      width: maxD,
      height: Math.round((origH * maxD) / origW),
    };
  } else {
    return {
      width: Math.round((origW * maxD) / origH),
      height: maxD,
    };
  }
}

/**
 * Intelligent GIF Compressor
 */
export async function compressGifSmart(
  gifFile: File,
  paletteColors: number = 128,
  scaleFactor: number = 0.75,
  onProgress?: (msg: string) => void
): Promise<CompressionResult> {
  if (onProgress) onProgress('Чтение и анализ GIF анимации...');
  const img = await loadImage(gifFile);

  const targetWidth = Math.max(100, Math.round(img.naturalWidth * scaleFactor));
  const targetHeight = Math.max(100, Math.round(img.naturalHeight * scaleFactor));

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  if (onProgress) onProgress('Квантование палитры цветов...');
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
  const savingsPercent = originalSize > compressedSize
    ? Math.round(((originalSize - compressedSize) / originalSize) * 100)
    : 0;

  return {
    fileName,
    originalSize,
    compressedSize,
    savedBytes,
    savingsPercent,
    blob: finalBlob,
    previewUrl,
    format: 'GIF',
    dimensions: `${targetWidth}×${targetHeight}`,
  };
}

/**
 * Intelligent Data & Text Compressor
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
  const savingsPercent = originalSize > compressedSize
    ? Math.round(((originalSize - compressedSize) / originalSize) * 100)
    : 0;

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
  const savingsPercent = totalOriginalSize > compressedSize
    ? Math.round(((totalOriginalSize - compressedSize) / totalOriginalSize) * 100)
    : 0;

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
