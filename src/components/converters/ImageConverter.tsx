import React, { useState } from 'react';
import { Image as ImageIcon, Download, RefreshCw, Archive, Trash2 } from 'lucide-react';
import { DropZone } from '../ui/DropZone';
import { convertSingleImage, createZipArchive, type ConvertedResult } from '../../lib/imageEngine';
import { addHistoryItem, triggerHaptic } from '../../lib/storage';
import confetti from 'canvas-confetti';

export const ImageConverter: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [targetFormat, setTargetFormat] = useState<'png' | 'jpeg' | 'webp' | 'avif'>('webp');
  const [quality, setQuality] = useState(0.85);
  const [maxWidth, setMaxWidth] = useState<number | undefined>(undefined);
  const [isConverting, setIsConverting] = useState(false);
  const [results, setResults] = useState<ConvertedResult[]>([]);

  const handleFilesSelected = (newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
    setResults([]);
  };

  const handleConvert = async () => {
    if (files.length === 0) return;
    setIsConverting(true);
    triggerHaptic('medium');

    try {
      const convertedList: ConvertedResult[] = [];
      for (const file of files) {
        const res = await convertSingleImage(file, {
          format: targetFormat,
          quality,
          maxWidth,
        });
        convertedList.push(res);
      }
      setResults(convertedList);
      addHistoryItem({
        type: 'image',
        title: `Конвертация в ${targetFormat.toUpperCase()}`,
        subtitle: `${convertedList.length} изображений`,
      });
      triggerHaptic('success');
      confetti({ particleCount: 50, spread: 50, origin: { y: 0.8 } });
    } catch (err: any) {
      alert(err.message || 'Ошибка конвертации');
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownloadZip = async () => {
    if (results.length === 0) return;
    triggerHaptic('medium');
    const zipBlob = await createZipArchive(results);
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `images_${targetFormat}_converted.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Banner */}
      <div className="glass-panel" style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(6,182,212,0.08) 0%, rgba(99,102,241,0.08) 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{ padding: '8px', borderRadius: '12px', background: 'rgba(6, 182, 212, 0.2)', color: '#06b6d4' }}>
            <ImageIcon size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Конвертер Изображений</h2>
              <span className="badge badge-offline">Оффлайн</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Конвертация форматов, изменение разрешения, сжатие размера и скачивание ZIP-архивом
            </p>
          </div>
        </div>
      </div>

      <DropZone
        accept=".png,.jpg,.jpeg,.webp,.avif,.bmp,.svg"
        multiple
        onFilesSelected={handleFilesSelected}
        title="Загрузите изображения для конвертации"
        subtitle="PNG, JPG, WebP, AVIF, SVG (пакетная обработка)"
        icon={<ImageIcon size={28} />}
      />

      {files.length > 0 && (
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <strong style={{ fontSize: '15px' }}>Выбрано файлов: {files.length}</strong>
            <button
              className="btn-secondary"
              style={{ padding: '4px 10px', fontSize: '12px', color: '#f87171' }}
              onClick={() => {
                setFiles([]);
                setResults([]);
              }}
            >
              <Trash2 size={13} /> Очистить
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                Целевой формат:
              </label>
              <select value={targetFormat} onChange={(e) => setTargetFormat(e.target.value as any)}>
                <option value="webp">WebP (Современный, легкий)</option>
                <option value="jpeg">JPG / JPEG (Классический)</option>
                <option value="png">PNG (Без потерь, прозрачность)</option>
                <option value="avif">AVIF (Ультра-сжатие)</option>
                <option value="gif">GIF (Формат GIF)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                <span>Качество сжатия:</span>
                <strong>{Math.round(quality * 100)}%</strong>
              </label>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                Макс. ширина (px, опционально):
              </label>
              <input
                type="number"
                placeholder="Автоматически"
                value={maxWidth || ''}
                onChange={(e) => setMaxWidth(e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>
          </div>

          <button
            className="btn-primary"
            onClick={handleConvert}
            disabled={isConverting}
            style={{ width: '100%', padding: '14px', fontSize: '15px' }}
          >
            {isConverting ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                <span>Конвертация...</span>
              </>
            ) : (
              <>
                <Download size={18} />
                <span>Сконвертировать {files.length} изображений в {targetFormat.toUpperCase()}</span>
              </>
            )}
          </button>

          {/* Results List */}
          {results.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <strong style={{ color: 'var(--primary-light)' }}>Результаты ({results.length}):</strong>
                {results.length > 1 && (
                  <button className="btn-primary" style={{ padding: '6px 14px', fontSize: '13px' }} onClick={handleDownloadZip}>
                    <Archive size={14} /> Скачать все (ZIP)
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {results.map((res, i) => (
                  <div
                    key={i}
                    className="glass-card"
                    style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img
                        src={res.previewUrl}
                        alt="thumb"
                        style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover' }}
                      />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600 }}>{res.fileName}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {(res.originalSize / 1024).toFixed(1)} KB ➔ {(res.newSize / 1024).toFixed(1)} KB (
                          {Math.round((1 - res.newSize / res.originalSize) * 100)}% экономии)
                        </div>
                      </div>
                    </div>

                    <a
                      href={res.previewUrl}
                      download={res.fileName}
                      className="btn-secondary"
                      style={{ padding: '6px 10px', fontSize: '12px', textDecoration: 'none' }}
                    >
                      <Download size={13} />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
