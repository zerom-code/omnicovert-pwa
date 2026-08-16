import JSZip from 'jszip';

export interface ImageConvertOptions {
  format: 'png' | 'jpeg' | 'webp' | 'avif';
  quality: number; // 0.1 to 1.0
  maxWidth?: number;
  maxHeight?: number;
  preserveRatio?: boolean;
}

export interface ConvertedResult {
  fileName: string;
  blob: Blob;
  previewUrl: string;
  originalSize: number;
  newSize: number;
}

/**
 * Converts a single image file to target format with options
 */
export async function convertSingleImage(
  file: File,
  options: ImageConvertOptions
): Promise<ConvertedResult> {
  const { format, quality, maxWidth, maxHeight } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let width = img.naturalWidth;
      let height = img.naturalHeight;

      if (maxWidth && width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      if (maxHeight && height > maxHeight) {
        width = Math.round((width * maxHeight) / height);
        height = maxHeight;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;

      // White background for JPEG if transparency exists
      if (format === 'jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
      }

      ctx.drawImage(img, 0, 0, width, height);

      const mimeType = `image/${format}`;
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to encode image canvas'));
            return;
          }

          const baseName = file.name.replace(/\.[^/.]+$/, '');
          const newExt = format === 'jpeg' ? 'jpg' : format;
          const fileName = `${baseName}_converted.${newExt}`;
          const previewUrl = URL.createObjectURL(blob);

          resolve({
            fileName,
            blob,
            previewUrl,
            originalSize: file.size,
            newSize: blob.size,
          });
        },
        mimeType,
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to parse image file'));
    img.src = objectUrl;
  });
}

/**
 * Creates a ZIP archive of all converted files
 */
export async function createZipArchive(results: ConvertedResult[]): Promise<Blob> {
  const zip = new JSZip();

  results.forEach((res) => {
    zip.file(res.fileName, res.blob);
  });

  return zip.generateAsync({ type: 'blob' });
}
