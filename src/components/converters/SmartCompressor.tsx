import React, { useState } from 'react';
import {
  Zap,
  Download,
  RefreshCw,
  Sliders,
  CheckCircle2,
  TrendingDown,
  Image as ImageIcon,
  Film,
  FileText,
  Trash2,
  Target
} from 'lucide-react';
import { DropZone } from '../ui/DropZone';
import {
  compressImageSmart,
  compressGifSmart,
  compressTextSmart,
  compressFilesToUltraZip,
  type CompressionPreset,
  type CompressionResult
} from '../../lib/compressEngine';
import { addHistoryItem, triggerHaptic } from '../../lib/storage';
import confetti from 'canvas-confetti';

export const SmartCompressor: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [preset, setPreset] = useState<CompressionPreset>('balanced');
  const [targetSizeKb, setTargetSizeKb] = useState<number>(300);
  const [format, setFormat] = useState<'webp' | 'jpeg' | 'png'>('webp');
  const [quality, setQuality] = useState<number>(0.8);
  const [maxDimension, setMaxDimension] = useState<number>(1920);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [results, setResults] = useState<CompressionResult[]>([]);

  const handleFilesSelected = (newFiles: File[]) => {
    setFiles(newFiles);
    setResults([]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setResults([]);
  };

  const clearAll = () => {
    setFiles([]);
    setResults([]);
  };

  const handleCompress = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    triggerHaptic('medium');
    const newResults: CompressionResult[] = [];

    try {
      // Check if multi-file generic archive mode or individual processing
      const allImages = files.every((f) => f.type.startsWith('image/') && !f.type.includes('gif'));
      const isSingleGif = files.length === 1 && (files[0].type.includes('gif') || files[0].name.endsWith('.gif'));
      const allText = files.every((f) => f.type.includes('json') || f.type.includes('text') || f.name.endsWith('.json') || f.name.endsWith('.csv'));

      if (isSingleGif) {
        setProgressMsg('Оптимизация GIF палитры...');
        const res = await compressGifSmart(files[0], 128, 0.85, (msg) => setProgressMsg(msg));
        newResults.push(res);
      } else if (allImages) {
        for (let i = 0; i < files.length; i++) {
          setProgressMsg(`Сжатие изображения ${i + 1} из ${files.length}...`);
          const res = await compressImageSmart(
            files[i],
            {
              preset,
              targetSizeKb: preset === 'target_size' ? targetSizeKb : undefined,
              format,
              quality,
              maxDimension: maxDimension > 0 ? maxDimension : undefined,
            },
            (msg) => setProgressMsg(msg)
          );
          newResults.push(res);
        }
      } else if (allText) {
        for (let i = 0; i < files.length; i++) {
          setProgressMsg(`Минификация файла ${i + 1} из ${files.length}...`);
          const res = await compressTextSmart(files[i], (msg) => setProgressMsg(msg));
          newResults.push(res);
        }
      } else {
        // Universal Ultra ZIP compression
        setProgressMsg('Ультра-сжатие в ZIP архив (DEFLATE 9)...');
        const res = await compressFilesToUltraZip(files, (pct) => setProgressMsg(`Архивация: ${pct}%`));
        newResults.push(res);
      }

      setResults(newResults);

      const totalOriginal = newResults.reduce((acc, r) => acc + r.originalSize, 0);
      const totalCompressed = newResults.reduce((acc, r) => acc + r.compressedSize, 0);
      const totalSavedPercent = Math.round(((totalOriginal - totalCompressed) / totalOriginal) * 100);

      addHistoryItem({
        type: 'compress',
        title: `Умное сжатие (${newResults.length} ${newResults.length === 1 ? 'файл' : 'файлов'})`,
        subtitle: `Экономия -${totalSavedPercent}% (${formatBytes(totalOriginal)} ➔ ${formatBytes(totalCompressed)})`,
      });

      triggerHaptic('success');
      if (totalSavedPercent > 40) {
        confetti({ particleCount: 70, spread: 70, origin: { y: 0.75 } });
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Ошибка при сжатии файлов');
    } finally {
      setIsProcessing(false);
      setProgressMsg('');
    }
  };

  const handleDownloadAllZip = async () => {
    if (results.length === 0) return;
    triggerHaptic('light');

    if (results.length === 1) {
      const link = document.createElement('a');
      link.href = results[0].previewUrl;
      link.download = results[0].fileName;
      link.click();
      return;
    }

    const zipFiles = results.map((r) => new File([r.blob], r.fileName, { type: r.blob.type }));
    const zipResult = await compressFilesToUltraZip(zipFiles);
    const link = document.createElement('a');
    link.href = zipResult.previewUrl;
    link.download = 'omnicompress_all_files.zip';
    link.click();
  };

  const isImageMode = files.length > 0 && files.every((f) => f.type.startsWith('image/') && !f.type.includes('gif'));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '24px',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(236,72,153,0.1) 100%)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div
            style={{
              padding: '10px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
              color: '#ffffff',
              boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)',
            }}
          >
            <Zap size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Умное Сжатие Файлов</h2>
              <span className="badge badge-ai">Smart AI</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Интеллектуальное сжатие изображений, GIF, документов и данных прямо на устройстве без потери качества
            </p>
          </div>
        </div>
      </div>

      {files.length === 0 ? (
        <DropZone
          accept="image/*,video/*,application/pdf,application/json,text/*,.zip,.rar,.tar,.gz"
          onFilesSelected={handleFilesSelected}
          title="Перетащите файлы или фото для умного сжатия"
          subtitle="Изображения, GIF, JSON, документы и архивы — алгоритм сам подберет оптимальный метод"
          icon={<Zap size={32} color="var(--primary-light)" />}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Selected files overview */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 700, fontSize: '15px' }}>Выбрано файлов: {files.length}</span>
                <span className="badge badge-offline">
                  {formatBytes(files.reduce((acc, f) => acc + f.size, 0))}
                </span>
              </div>
              <button
                className="btn-secondary"
                onClick={clearAll}
                style={{ padding: '4px 10px', fontSize: '12px', color: '#f87171' }}
              >
                <Trash2 size={13} style={{ marginRight: '4px' }} />
                Очистить
              </button>
            </div>

            {/* Files chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '120px', overflowY: 'auto' }}>
              {files.map((file, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '12px',
                  }}
                >
                  {file.type.startsWith('image/') ? <ImageIcon size={14} /> : file.type.includes('gif') ? <Film size={14} /> : <FileText size={14} />}
                  <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {file.name}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>({formatBytes(file.size)})</span>
                  <button
                    onClick={() => removeFile(idx)}
                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0 2px' }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Compression Settings (For Images) */}
          {isImageMode && (
            <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sliders size={18} color="var(--primary-light)" />
                <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Режим умной компрессии:</h3>
              </div>

              {/* Preset Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
                <button
                  className={`glass-card ${preset === 'balanced' ? 'active' : ''}`}
                  onClick={() => setPreset('balanced')}
                  style={{
                    padding: '14px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    border: preset === 'balanced' ? '1px solid var(--primary-light)' : '1px solid var(--border-subtle)',
                    background: preset === 'balanced' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, fontSize: '13px' }}>⚡ Баланс</span>
                    <span className="badge badge-offline" style={{ fontSize: '10px' }}>-60%</span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Незаметно для глаза</span>
                </button>

                <button
                  className={`glass-card ${preset === 'aggressive' ? 'active' : ''}`}
                  onClick={() => setPreset('aggressive')}
                  style={{
                    padding: '14px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    border: preset === 'aggressive' ? '1px solid var(--primary-light)' : '1px solid var(--border-subtle)',
                    background: preset === 'aggressive' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, fontSize: '13px' }}>🔥 Сильное</span>
                    <span className="badge badge-pwa" style={{ fontSize: '10px' }}>-75%</span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Для веба и чатов</span>
                </button>

                <button
                  className={`glass-card ${preset === 'target_size' ? 'active' : ''}`}
                  onClick={() => setPreset('target_size')}
                  style={{
                    padding: '14px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    border: preset === 'target_size' ? '1px solid var(--primary-light)' : '1px solid var(--border-subtle)',
                    background: preset === 'target_size' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, fontSize: '13px' }}>🎯 Точный вес</span>
                    <span className="badge badge-ai" style={{ fontSize: '10px' }}>Binary</span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Задать размер в КБ</span>
                </button>

                <button
                  className={`glass-card ${preset === 'custom' ? 'active' : ''}`}
                  onClick={() => setPreset('custom')}
                  style={{
                    padding: '14px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    border: preset === 'custom' ? '1px solid var(--primary-light)' : '1px solid var(--border-subtle)',
                    background: preset === 'custom' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, fontSize: '13px' }}>🛠️ Свой</span>
                    <span className="badge" style={{ fontSize: '10px', background: 'rgba(255,255,255,0.1)' }}>Pro</span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Ручные параметры</span>
                </button>
              </div>

              {/* Target Size Input */}
              {preset === 'target_size' && (
                <div
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    background: 'rgba(99, 102, 241, 0.08)',
                    border: '1px solid var(--border-glow)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Target size={16} color="var(--primary-light)" />
                      Целевой максимальный вес файла:
                    </label>
                    <span style={{ fontWeight: 800, color: 'var(--primary-light)', fontSize: '16px' }}>
                      {targetSizeKb} КБ
                    </span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="2000"
                    step="50"
                    value={targetSizeKb}
                    onChange={(e) => setTargetSizeKb(Number(e.target.value))}
                    style={{ width: '100%' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                    <span>50 КБ (Супер-легкий)</span>
                    <span>500 КБ (Для почты)</span>
                    <span>2 МБ (Высокое качество)</span>
                  </div>
                </div>
              )}

              {/* Custom controls */}
              {preset === 'custom' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                      Формат сжатия:
                    </label>
                    <select value={format} onChange={(e) => setFormat(e.target.value as any)}>
                      <option value="webp">WebP (Рекомендуется)</option>
                      <option value="jpeg">JPEG (Макс. совместимость)</option>
                      <option value="png">PNG (Без потерь)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                      Качество ({Math.round(quality * 100)}%):
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={quality}
                      onChange={(e) => setQuality(Number(e.target.value))}
                      style={{ marginTop: '8px' }}
                    />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                      Макс. разрешение (длинная сторона):
                    </label>
                    <select value={maxDimension} onChange={(e) => setMaxDimension(Number(e.target.value))}>
                      <option value="0">Оригинальное разрешение</option>
                      <option value="2560">2K QHD (2560px)</option>
                      <option value="1920">Full HD (1920px)</option>
                      <option value="1280">HD (1280px)</option>
                      <option value="800">Компактное (800px)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Compress Action Button */}
          <button
            className="btn-primary"
            onClick={handleCompress}
            disabled={isProcessing}
            style={{ width: '100%', padding: '16px', fontSize: '16px' }}
          >
            {isProcessing ? (
              <>
                <RefreshCw size={20} className="animate-spin" />
                <span>{progressMsg || 'Интеллектуальное сжатие...'}</span>
              </>
            ) : (
              <>
                <Zap size={20} />
                <span>Сжать {files.length} {files.length === 1 ? 'файл' : 'файлов'}</span>
              </>
            )}
          </button>

          {/* Results section */}
          {results.length > 0 && (
            <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Total Savings Summary Header */}
              {(() => {
                const totalOriginal = results.reduce((acc, r) => acc + r.originalSize, 0);
                const totalCompressed = results.reduce((acc, r) => acc + r.compressedSize, 0);
                const totalSavedBytes = Math.max(0, totalOriginal - totalCompressed);
                const totalPercent = totalOriginal > totalCompressed
                  ? Math.round((totalSavedBytes / totalOriginal) * 100)
                  : 0;

                return (
                  <div
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(6,182,212,0.15) 100%)',
                      border: '1px solid rgba(16,185,129,0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ padding: '8px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>
                        <TrendingDown size={22} />
                      </div>
                      <div>
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>Результат умного сжатия:</span>
                        <div style={{ fontSize: '18px', fontWeight: 800, color: '#34d399' }}>
                          -{totalPercent}% ({formatBytes(totalSavedBytes)} сэкономлено)
                        </div>
                      </div>
                    </div>

                    <button
                      className="btn-primary"
                      onClick={handleDownloadAllZip}
                      style={{ padding: '8px 16px', fontSize: '13px', background: 'var(--emerald-gradient)' }}
                    >
                      <Download size={15} />
                      <span>Скачать {results.length > 1 ? 'ZIP' : 'файл'}</span>
                    </button>
                  </div>
                );
              })()}

              {/* Items List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {results.map((res, idx) => (
                  <div
                    key={idx}
                    className="glass-card"
                    style={{
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <CheckCircle2 size={18} color="#34d399" />
                      <div style={{ minWidth: 0 }}>
                        <strong style={{ fontSize: '13px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {res.fileName}
                        </strong>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{ textDecoration: 'line-through' }}>{formatBytes(res.originalSize)}</span>
                          <span>➔</span>
                          <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{formatBytes(res.compressedSize)}</span>
                          <span style={{ color: '#34d399', fontWeight: 700 }}>(-{res.savingsPercent}%)</span>
                          {res.dimensions && <span className="badge" style={{ fontSize: '10px', padding: '1px 6px' }}>{res.dimensions}</span>}
                          <span className="badge badge-pwa" style={{ fontSize: '10px', padding: '1px 6px' }}>{res.format}</span>
                        </div>
                      </div>
                    </div>

                    <a
                      href={res.previewUrl}
                      download={res.fileName}
                      className="btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '12px', textDecoration: 'none', flexShrink: 0 }}
                    >
                      <Download size={14} />
                      <span>Скачать</span>
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

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Байт';
  const k = 1024;
  const sizes = ['Байт', 'КБ', 'МБ', 'ГБ'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
