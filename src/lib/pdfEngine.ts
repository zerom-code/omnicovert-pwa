import { PDFDocument } from 'pdf-lib';
import jsPDF from 'jspdf';

/**
 * Combines multiple images into a multi-page PDF document
 */
export async function imagesToPdf(
  imageFiles: File[],
  orientation: 'portrait' | 'landscape' = 'portrait',
  onProgress?: (p: number) => void
): Promise<Blob> {
  const doc = new jsPDF({
    orientation,
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 0; i < imageFiles.length; i++) {
    if (i > 0) {
      doc.addPage('a4', orientation);
    }

    const file = imageFiles[i];
    const { dataUrl, width, height, format } = await readFileAsCompatibleImageData(file);

    const margin = 20;
    const availWidth = pageWidth - margin * 2;
    const availHeight = pageHeight - margin * 2;

    const widthRatio = availWidth / width;
    const heightRatio = availHeight / height;
    const ratio = Math.min(widthRatio, heightRatio, 1);

    const targetWidth = width * ratio;
    const targetHeight = height * ratio;

    const posX = (pageWidth - targetWidth) / 2;
    const posY = (pageHeight - targetHeight) / 2;

    doc.addImage(dataUrl, format, posX, posY, targetWidth, targetHeight, undefined, 'FAST');

    if (onProgress) {
      onProgress(Math.round(((i + 1) / imageFiles.length) * 100));
    }
  }

  return doc.output('blob');
}

/**
 * Merges multiple PDF files into one
 */
export async function mergePdfs(
  pdfFiles: File[],
  onProgress?: (p: number) => void
): Promise<Blob> {
  const mergedPdf = await PDFDocument.create();

  for (let i = 0; i < pdfFiles.length; i++) {
    const fileBytes = await pdfFiles[i].arrayBuffer();
    const pdfDoc = await PDFDocument.load(fileBytes);
    const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));

    if (onProgress) {
      onProgress(Math.round(((i + 1) / pdfFiles.length) * 100));
    }
  }

  const mergedBytes = await mergedPdf.save();
  return new Blob([new Uint8Array(mergedBytes)], { type: 'application/pdf' });
}

/**
 * Splits / Extracts specific pages from a PDF
 * Example range: "1, 3, 5-8"
 */
export async function splitPdf(
  pdfFile: File,
  pageRangeStr: string
): Promise<Blob> {
  const fileBytes = await pdfFile.arrayBuffer();
  const srcPdf = await PDFDocument.load(fileBytes);
  const totalPages = srcPdf.getPageCount();

  const targetIndices = parsePageRanges(pageRangeStr, totalPages);
  if (targetIndices.length === 0) {
    throw new Error('No valid pages found in specified range');
  }

  const newPdf = await PDFDocument.create();
  const copiedPages = await newPdf.copyPages(srcPdf, targetIndices);
  copiedPages.forEach((page) => newPdf.addPage(page));

  const outputBytes = await newPdf.save();
  return new Blob([new Uint8Array(outputBytes)], { type: 'application/pdf' });
}

/**
 * Converts formatted text or markdown to PDF
 */
export async function textToPdf(text: string, title?: string): Promise<Blob> {
  const doc = new jsPDF({
    unit: 'pt',
    format: 'a4',
  });

  const margin = 40;
  let cursorY = margin + 20;

  if (title) {
    doc.setFontSize(18);
    doc.text(title, margin, cursorY);
    cursorY += 30;
  }

  doc.setFontSize(11);
  const splitText = doc.splitTextToSize(text, doc.internal.pageSize.getWidth() - margin * 2);

  for (let i = 0; i < splitText.length; i++) {
    if (cursorY > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      cursorY = margin + 20;
    }
    doc.text(splitText[i], margin, cursorY);
    cursorY += 16;
  }

  return doc.output('blob');
}

function parsePageRanges(rangeStr: string, maxPages: number): number[] {
  const indices: Set<number> = new Set();
  const parts = rangeStr.split(/[,;\s]+/).filter(Boolean);

  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-');
      const start = Math.max(1, parseInt(startStr, 10));
      const end = Math.min(maxPages, parseInt(endStr, 10));
      if (!isNaN(start) && !isNaN(end) && start <= end) {
        for (let i = start; i <= end; i++) {
          indices.add(i - 1);
        }
      }
    } else {
      const pageNum = parseInt(part, 10);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= maxPages) {
        indices.add(pageNum - 1);
      }
    }
  }

  return Array.from(indices).sort((a, b) => a - b);
}

function readFileAsCompatibleImageData(
  file: File
): Promise<{ dataUrl: string; width: number; height: number; format: 'JPEG' | 'PNG' }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || 800;
      canvas.height = img.naturalHeight || 600;
      const ctx = canvas.getContext('2d')!;

      const isPng = file.type.includes('png');
      if (!isPng) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const format = isPng ? 'PNG' : 'JPEG';
      const dataUrl = canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', 0.92);
      resolve({ dataUrl, width: canvas.width, height: canvas.height, format });
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Не удалось загрузить изображение ${file.name}`));
    };
    img.src = objectUrl;
  });
}
