import React, { useState } from 'react';
import { Music, Download, RefreshCw, Volume2 } from 'lucide-react';
import { DropZone } from '../ui/DropZone';
import { extractAudioFromVideo } from '../../lib/audioEngine';
import { addHistoryItem, triggerHaptic } from '../../lib/storage';
import confetti from 'canvas-confetti';

export const AudioVideoConverter: React.FC = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [status, setStatus] = useState('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const handleVideoSelected = (files: File[]) => {
    if (files.length > 0) {
      setVideoFile(files[0]);
      setAudioUrl(null);
    }
  };

  const handleExtractAudio = async () => {
    if (!videoFile) return;
    setIsExtracting(true);
    triggerHaptic('medium');

    try {
      const wavBlob = await extractAudioFromVideo(videoFile, (msg) => setStatus(msg));
      const url = URL.createObjectURL(wavBlob);
      setAudioUrl(url);
      addHistoryItem({
        type: 'audio',
        title: 'Извлечение аудио',
        subtitle: `${videoFile.name} ➔ WAV`,
      });
      triggerHaptic('success');
      confetti({ particleCount: 50, spread: 50, origin: { y: 0.8 } });
    } catch (err: any) {
      alert(err.message || 'Ошибка извлечения аудио');
    } finally {
      setIsExtracting(false);
      setStatus('');
    }
  };

  const baseName = videoFile?.name.replace(/\.[^/.]+$/, '') || 'extracted_audio';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="glass-panel" style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(236,72,153,0.08) 0%, rgba(16,185,129,0.08) 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{ padding: '8px', borderRadius: '12px', background: 'rgba(236, 72, 153, 0.2)', color: '#ec4899' }}>
            <Music size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Извлечение Аудио из Видео</h2>
              <span className="badge badge-offline">Оффлайн</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Извлекайте чистый звук в формате WAV/Audio из любых видеофайлов прямо в браузере
            </p>
          </div>
        </div>
      </div>

      {!videoFile ? (
        <DropZone
          accept=".mp4,.mov,.webm,.mkv,.avi,.3gp"
          onFilesSelected={handleVideoSelected}
          title="Загрузите видеофайл для извлечения звуковой дорожки"
          subtitle="MP4, MOV, WebM, MKV и другие форматы"
          icon={<Music size={28} />}
        />
      ) : (
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Volume2 size={20} color="var(--primary-light)" />
              <div>
                <strong style={{ fontSize: '15px' }}>{videoFile.name}</strong>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {(videoFile.size / (1024 * 1024)).toFixed(2)} МБ
                </div>
              </div>
            </div>
            <button className="btn-secondary" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={() => setVideoFile(null)}>
              Выбрать другой
            </button>
          </div>

          <button
            className="btn-primary"
            onClick={handleExtractAudio}
            disabled={isExtracting}
            style={{ width: '100%', padding: '14px', fontSize: '15px' }}
          >
            {isExtracting ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                <span>{status || 'Извлечение аудиопотока...'}</span>
              </>
            ) : (
              <>
                <Music size={18} />
                <span>Извлечь аудиодорожку (WAV)</span>
              </>
            )}
          </button>

          {audioUrl && (
            <div
              className="glass-card"
              style={{
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                background: 'rgba(0,0,0,0.5)',
              }}
            >
              <strong style={{ fontSize: '14px', color: 'var(--primary-light)' }}>Готовая аудиодорожка:</strong>
              <audio src={audioUrl} controls style={{ width: '100%' }} />
              <a
                href={audioUrl}
                download={`${baseName}_audio.wav`}
                className="btn-primary"
                style={{ textDecoration: 'none', alignSelf: 'center' }}
              >
                <Download size={16} />
                <span>Скачать аудио (WAV)</span>
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
