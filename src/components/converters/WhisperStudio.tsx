import React, { useState } from 'react';
import { Mic, Sparkles, Download, Copy, Check, FileText, Subtitles, Key, RefreshCw } from 'lucide-react';
import { DropZone } from '../ui/DropZone';
import { getStoredApiKey, addHistoryItem, triggerHaptic } from '../../lib/storage';
import {
  transcribeAudioWithWhisper,
  summarizeTranscription,
  formatAsSrt,
  formatAsVtt,
  type TranscriptionResponse,
} from '../../lib/openai';
import confetti from 'canvas-confetti';

interface WhisperStudioProps {
  onOpenApiKey: () => void;
}

export const WhisperStudio: React.FC<WhisperStudioProps> = ({ onOpenApiKey }) => {
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState('auto');
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [result, setResult] = useState<TranscriptionResponse | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeView, setActiveView] = useState<'text' | 'segments' | 'summary'>('text');

  const apiKey = getStoredApiKey();

  const handleFilesSelected = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setResult(null);
      setSummary(null);
    }
  };

  const handleTranscribe = async () => {
    if (!file) return;
    if (!apiKey) {
      onOpenApiKey();
      return;
    }

    setIsLoading(true);
    setStatusMessage('Отправка аудио/видео в OpenAI Whisper...');
    triggerHaptic('medium');

    try {
      const resp = await transcribeAudioWithWhisper(apiKey, file, file.name, language, prompt);
      setResult(resp);
      addHistoryItem({
        type: 'whisper',
        title: 'Whisper Расшифровка',
        subtitle: file.name,
      });
      triggerHaptic('success');
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.8 } });
    } catch (err: any) {
      alert(err.message || 'Ошибка расшифровки');
    } finally {
      setIsLoading(false);
      setStatusMessage('');
    }
  };

  const handleSummarize = async () => {
    if (!result?.text || !apiKey) return;
    setIsSummarizing(true);
    triggerHaptic('medium');

    try {
      const summaryText = await summarizeTranscription(apiKey, result.text);
      setSummary(summaryText);
      setActiveView('summary');
      triggerHaptic('success');
    } catch (err: any) {
      alert(err.message || 'Ошибка генерации выжимки');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    triggerHaptic('light');
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    triggerHaptic('medium');
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const baseFileName = file?.name.replace(/\.[^/.]+$/, '') || 'transcription';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner */}
      <div className="glass-panel" style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(236,72,153,0.08) 0%, rgba(99,102,241,0.08) 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{ padding: '8px', borderRadius: '12px', background: 'rgba(236, 72, 153, 0.2)', color: '#ec4899' }}>
            <Mic size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800 }}>AI Whisper Расшифровка</h2>
              <span className="badge badge-ai">OpenAI</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Загрузите видео или аудио — Whisper распознает речь с таймкодами, создаст субтитры SRT и сделает выжимку
            </p>
          </div>
        </div>

        {!apiKey && (
          <div
            style={{
              marginTop: '16px',
              padding: '12px 16px',
              borderRadius: '12px',
              background: 'rgba(236, 72, 153, 0.12)',
              border: '1px solid rgba(236, 72, 153, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#fbcfe8' }}>
              <Key size={16} />
              <span>Для начала работы добавьте ваш OpenAI API ключ</span>
            </div>
            <button className="btn-primary" style={{ padding: '6px 14px', fontSize: '12px' }} onClick={onOpenApiKey}>
              Ввести ключ
            </button>
          </div>
        )}
      </div>

      {/* File Upload Zone */}
      {!file ? (
        <DropZone
          accept=".mp3,.wav,.m4a,.ogg,.mp4,.mov,.webm,.aac,.flac"
          onFilesSelected={handleFilesSelected}
          title="Выберите аудио или видео файл"
          subtitle="MP3, WAV, M4A, MP4, MOV, WebM и другие форматы до 25 МБ"
          icon={<Mic size={28} />}
        />
      ) : (
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary-light)' }}>
                <FileText size={20} />
              </div>
              <div>
                <strong style={{ fontSize: '15px' }}>{file.name}</strong>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {(file.size / (1024 * 1024)).toFixed(2)} МБ
                </div>
              </div>
            </div>
            <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => setFile(null)}>
              Выбрать другой
            </button>
          </div>

          {/* Options */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                Язык записи:
              </label>
              <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                <option value="auto">🌐 Автоопределение языка</option>
                <option value="ru">🇷🇺 Русский (Russian)</option>
                <option value="en">🇺🇸 Английский (English)</option>
                <option value="uk">🇺🇦 Украинский (Ukrainian)</option>
                <option value="de">🇩🇪 Немецкий (German)</option>
                <option value="fr">🇫🇷 Французский (French)</option>
                <option value="es">🇪🇸 Испанский (Spanish)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                Подсказка для редких терминов (опционально):
              </label>
              <input
                type="text"
                placeholder="Имена, термины, сленг..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>
          </div>

          <button
            className="btn-primary"
            style={{ width: '100%', padding: '14px', fontSize: '16px' }}
            onClick={handleTranscribe}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                <span>{statusMessage || 'Идет расшифровка Whisper...'}</span>
              </>
            ) : (
              <>
                <Sparkles size={18} />
                <span>Запустить расшифровку через Whisper</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Results View */}
      {result && (
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div className="tab-pills" style={{ maxWidth: '360px' }}>
              <button
                className={`tab-pill ${activeView === 'text' ? 'active' : ''}`}
                onClick={() => setActiveView('text')}
              >
                Текст
              </button>
              <button
                className={`tab-pill ${activeView === 'segments' ? 'active' : ''}`}
                onClick={() => setActiveView('segments')}
              >
                С таймкодами ({result.segments?.length || 0})
              </button>
              <button
                className={`tab-pill ${activeView === 'summary' ? 'active' : ''}`}
                onClick={() => setActiveView('summary')}
              >
                AI Саммари
              </button>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '12px' }}
                onClick={() => handleCopyText(activeView === 'summary' && summary ? summary : result.text)}
              >
                {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                <span>{copied ? 'Скопировано' : 'Копировать'}</span>
              </button>

              <button
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '12px' }}
                onClick={() => downloadFile(result.text, `${baseFileName}.txt`, 'text/plain')}
              >
                <Download size={14} />
                <span>TXT</span>
              </button>

              <button
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '12px' }}
                onClick={() => downloadFile(formatAsSrt(result.segments, result.text), `${baseFileName}.srt`, 'text/plain')}
              >
                <Subtitles size={14} />
                <span>SRT Субтитры</span>
              </button>

              <button
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '12px' }}
                onClick={() => downloadFile(formatAsVtt(result.segments, result.text), `${baseFileName}.vtt`, 'text/vtt')}
              >
                <FileText size={14} />
                <span>VTT</span>
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.4)',
              borderRadius: '12px',
              padding: '16px',
              maxHeight: '400px',
              overflowY: 'auto',
              border: '1px solid var(--border-subtle)',
              fontSize: '14px',
              lineHeight: '1.7',
            }}
          >
            {activeView === 'text' && (
              <div style={{ whiteSpace: 'pre-wrap' }}>{result.text}</div>
            )}

            {activeView === 'segments' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {result.segments?.map((seg) => (
                  <div
                    key={seg.id}
                    style={{
                      display: 'flex',
                      gap: '12px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.03)',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'monospace',
                        color: 'var(--primary-light)',
                        fontSize: '12px',
                        flexShrink: 0,
                        paddingTop: '2px',
                      }}
                    >
                      {Math.floor(seg.start)}s - {Math.floor(seg.end)}s
                    </span>
                    <span>{seg.text}</span>
                  </div>
                ))}
              </div>
            )}

            {activeView === 'summary' && (
              <div>
                {summary ? (
                  <div style={{ whiteSpace: 'pre-wrap' }}>{summary}</div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '30px 0' }}>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
                      Сгенерируйте краткое резюме, ключевые тезисы и задачи из этой записи с помощью GPT-4o-mini
                    </p>
                    <button
                      className="btn-primary"
                      onClick={handleSummarize}
                      disabled={isSummarizing}
                    >
                      {isSummarizing ? (
                        <>
                          <RefreshCw size={16} className="animate-spin" />
                          <span>Генерация выжимки...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={16} />
                          <span>Создать AI Саммари</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
