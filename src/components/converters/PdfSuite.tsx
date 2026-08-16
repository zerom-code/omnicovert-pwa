import React, { useState } from 'react';
import { FileText, Images, Combine, Split, Download, RefreshCw, Sparkles, Trash2 } from 'lucide-react';
import { DropZone } from '../ui/DropZone';
import { imagesToPdf, mergePdfs, splitPdf, textToPdf } from '../../lib/pdfEngine';
import { addHistoryItem, triggerHaptic } from '../../lib/storage';
import confetti from 'canvas-confetti';

export const PdfSuite: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'imagesToPdf' | 'merge' | 'split' | 'textToPdf'>('imagesToPdf');

  // Images to PDF
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  // Merge PDF
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);

  // Split PDF
  const [splitFile, setSplitFile] = useState<File | null>(null);
  const [pageRange, setPageRange] = useState('1-3');

  // Text to PDF
  const [docTitle, setDocTitle] = useState('Мой документ');
  const [docText, setDocText] = useState('# Заголовок документа\n\nЗдесь может быть ваш текст или отчет, который конвертируется в PDF...');

  const downloadBlob = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    triggerHaptic('success');
    confetti({ particleCount: 50, spread: 50, origin: { y: 0.8 } });
  };

  const handleImagesToPdf = async () => {
    if (imageFiles.length === 0) return;
    setIsProcessing(true);
    setProgress(0);
    triggerHaptic('medium');

    try {
      const blob = await imagesToPdf(imageFiles, orientation, (p) => setProgress(p));
      downloadBlob(blob, 'images_document.pdf');
      addHistoryItem({
        type: 'pdf',
        title: 'Фото в PDF',
        subtitle: `${imageFiles.length} страниц`,
      });
    } catch (err: any) {
      alert(err.message || 'Ошибка конвертации в PDF');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMergePdf = async () => {
    if (pdfFiles.length < 2) {
      alert('Выберите как минимум 2 PDF файла для объединения');
      return;
    }
    setIsProcessing(true);
    triggerHaptic('medium');

    try {
      const blob = await mergePdfs(pdfFiles, (p) => setProgress(p));
      downloadBlob(blob, 'merged_document.pdf');
      addHistoryItem({
        type: 'pdf',
        title: 'Объединение PDF',
        subtitle: `${pdfFiles.length} файлов склеено`,
      });
    } catch (err: any) {
      alert(err.message || 'Ошибка объединения PDF');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSplitPdf = async () => {
    if (!splitFile) return;
    setIsProcessing(true);
    triggerHaptic('medium');

    try {
      const blob = await splitPdf(splitFile, pageRange);
      downloadBlob(blob, `extracted_pages_${pageRange.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
      addHistoryItem({
        type: 'pdf',
        title: 'Разделение PDF',
        subtitle: `Страницы: ${pageRange}`,
      });
    } catch (err: any) {
      alert(err.message || 'Ошибка разделения PDF');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTextToPdf = async () => {
    if (!docText.trim()) return;
    setIsProcessing(true);
    triggerHaptic('medium');

    try {
      const blob = await textToPdf(docText, docTitle);
      downloadBlob(blob, `${docTitle.replace(/\s+/g, '_')}.pdf`);
      addHistoryItem({
        type: 'pdf',
        title: 'Текст в PDF',
        subtitle: docTitle,
      });
    } catch (err: any) {
      alert(err.message || 'Ошибка генерации PDF');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Banner */}
      <div className="glass-panel" style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(99,102,241,0.08) 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
          <div style={{ padding: '8px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>
            <FileText size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800 }}>PDF Power Suite</h2>
              <span className="badge badge-offline">Оффлайн</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Конвертация изображений в PDF, объединение, разделение страниц и создание документов
            </p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="tab-pills" style={{ overflowX: 'auto' }}>
          <button
            className={`tab-pill ${activeTab === 'imagesToPdf' ? 'active' : ''}`}
            onClick={() => setActiveTab('imagesToPdf')}
          >
            <Images size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
            Фото ➔ PDF
          </button>
          <button
            className={`tab-pill ${activeTab === 'merge' ? 'active' : ''}`}
            onClick={() => setActiveTab('merge')}
          >
            <Combine size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
            Склейка PDF
          </button>
          <button
            className={`tab-pill ${activeTab === 'split' ? 'active' : ''}`}
            onClick={() => setActiveTab('split')}
          >
            <Split size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
            Разделение
          </button>
          <button
            className={`tab-pill ${activeTab === 'textToPdf' ? 'active' : ''}`}
            onClick={() => setActiveTab('textToPdf')}
          >
            <FileText size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
            Текст ➔ PDF
          </button>
        </div>
      </div>

      {/* Mode 1: Images to PDF */}
      {activeTab === 'imagesToPdf' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <DropZone
            accept=".png,.jpg,.jpeg,.webp,.avif"
            multiple
            onFilesSelected={(files) => setImageFiles((prev) => [...prev, ...files])}
            title="Выберите фото или сканы для объединения в PDF"
            subtitle="Каждое изображение станет отдельной страницей документа"
            icon={<Images size={28} />}
          />

          {imageFiles.length > 0 && (
            <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <strong style={{ fontSize: '15px' }}>Выбрано страниц: {imageFiles.length}</strong>
                <button
                  className="btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '12px', color: '#f87171' }}
                  onClick={() => setImageFiles([])}
                >
                  <Trash2 size={13} /> Очистить
                </button>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  Ориентация страниц:
                </label>
                <select value={orientation} onChange={(e) => setOrientation(e.target.value as any)}>
                  <option value="portrait">📄 Книжная (Portrait A4)</option>
                  <option value="landscape">📃 Альбомная (Landscape A4)</option>
                </select>
              </div>

              <button
                className="btn-primary"
                onClick={handleImagesToPdf}
                disabled={isProcessing}
                style={{ width: '100%', padding: '14px', fontSize: '15px' }}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    <span>Сборка PDF документа... {progress}%</span>
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    <span>Собрать и скачать PDF ({imageFiles.length} стр.)</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Merge PDF */}
      {activeTab === 'merge' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <DropZone
            accept=".pdf"
            multiple
            onFilesSelected={(files) => setPdfFiles((prev) => [...prev, ...files])}
            title="Выберите PDF файлы для объединения"
            subtitle="Загрузите 2 или более PDF файлов"
            icon={<Combine size={28} />}
          />

          {pdfFiles.length > 0 && (
            <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <strong style={{ fontSize: '15px' }}>Выбрано PDF файлов: {pdfFiles.length}</strong>
                <button
                  className="btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '12px', color: '#f87171' }}
                  onClick={() => setPdfFiles([])}
                >
                  <Trash2 size={13} /> Очистить
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {pdfFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="glass-card"
                    style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <span style={{ fontSize: '14px' }}>
                      #{idx + 1} {file.name}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {(file.size / 1024).toFixed(1)} КБ
                    </span>
                  </div>
                ))}
              </div>

              <button
                className="btn-primary"
                onClick={handleMergePdf}
                disabled={isProcessing || pdfFiles.length < 2}
                style={{ width: '100%', padding: '14px', fontSize: '15px' }}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    <span>Объединение PDF файлов...</span>
                  </>
                ) : (
                  <>
                    <Combine size={18} />
                    <span>Объединить {pdfFiles.length} PDF в один</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Mode 3: Split PDF */}
      {activeTab === 'split' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {!splitFile ? (
            <DropZone
              accept=".pdf"
              onFilesSelected={(files) => files.length > 0 && setSplitFile(files[0])}
              title="Выберите PDF для разделения / извлечения страниц"
              subtitle="Поддерживаются многостраничные PDF файлы"
              icon={<Split size={28} />}
            />
          ) : (
            <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <strong style={{ fontSize: '15px' }}>{splitFile.name}</strong>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {(splitFile.size / 1024).toFixed(1)} КБ
                  </div>
                </div>
                <button className="btn-secondary" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={() => setSplitFile(null)}>
                  Выбрать другой
                </button>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  Диапазон страниц для извлечения:
                </label>
                <input
                  type="text"
                  placeholder="Например: 1-3, 5, 8-10"
                  value={pageRange}
                  onChange={(e) => setPageRange(e.target.value)}
                />
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Укажите страницы через запятую или тире (например: 1, 3, 5-10)
                </div>
              </div>

              <button
                className="btn-primary"
                onClick={handleSplitPdf}
                disabled={isProcessing || !pageRange.trim()}
                style={{ width: '100%', padding: '14px', fontSize: '15px' }}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    <span>Извлечение страниц...</span>
                  </>
                ) : (
                  <>
                    <Split size={18} />
                    <span>Извлечь страницы ({pageRange})</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Mode 4: Text to PDF */}
      {activeTab === 'textToPdf' && (
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              Заголовок документа:
            </label>
            <input
              type="text"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              placeholder="Название файла"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              Содержимое документа:
            </label>
            <textarea
              rows={8}
              value={docText}
              onChange={(e) => setDocText(e.target.value)}
              placeholder="Введите или вставьте текст..."
            />
          </div>

          <button
            className="btn-primary"
            onClick={handleTextToPdf}
            disabled={isProcessing || !docText.trim()}
            style={{ width: '100%', padding: '14px', fontSize: '15px' }}
          >
            {isProcessing ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                <span>Генерация PDF...</span>
              </>
            ) : (
              <>
                <Sparkles size={18} />
                <span>Сгенерировать и скачать PDF</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
