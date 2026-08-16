import React, { useState } from 'react';
import { Film, Images, Video, Download, RefreshCw, Sparkles, Play, Trash2 } from 'lucide-react';
import { DropZone } from '../ui/DropZone';
import { createGifFromImages, createGifFromVideo, createAnimatedGifFromSingleImage } from '../../lib/gifEngine';
import { addHistoryItem, triggerHaptic } from '../../lib/storage';
import confetti from 'canvas-confetti';

const ImageThumbnail: React.FC<{ file: File; onRemove: () => void; index: number }> = ({ file, onRemove, index }) => {
  const [url, setUrl] = useState<string>('');
  React.useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: '8px',
        overflow: 'hidden',
        aspectRatio: '1',
        border: '1px solid var(--border-subtle)',
      }}
    >
      {url && <img src={url} alt="frame" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
      <button
        onClick={onRemove}
        style={{
          position: 'absolute',
          top: '2px',
          right: '2px',
          background: 'rgba(0,0,0,0.7)',
          border: 'none',
          color: '#fff',
          borderRadius: '50%',
          width: '18px',
          height: '18px',
          fontSize: '10px',
          cursor: 'pointer',
        }}
      >
        ✕
      </button>
      <span
        style={{
          position: 'absolute',
          bottom: '2px',
          left: '4px',
          fontSize: '10px',
          fontWeight: 700,
          color: '#fff',
          textShadow: '0 1px 2px #000',
        }}
      >
        #{index + 1}
      </span>
    </div>
  );
};

export const GifStudio: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'images' | 'video'>('images');

  // Images to GIF State
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [singleImageEffect, setSingleImageEffect] = useState<'zoom' | 'pulse' | 'pan' | 'static'>('zoom');
  const [imageFps, setImageFps] = useState(10);
  const [imageLoop, setImageLoop] = useState(true);
  const [imageProgress, setImageProgress] = useState(0);
  const [imageGifUrl, setImageGifUrl] = useState<string | null>(null);
  const [isRenderingImages, setIsRenderingImages] = useState(false);

  // Video to GIF State
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [gifDuration, setGifDuration] = useState(3);
  const [videoFps, setVideoFps] = useState(10);
  const [videoWidth, setVideoWidth] = useState(480);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoGifUrl, setVideoGifUrl] = useState<string | null>(null);
  const [isRenderingVideo, setIsRenderingVideo] = useState(false);

  // Handlers for Images to GIF
  const handleImagesSelected = (files: File[]) => {
    setImageFiles((prev) => [...prev, ...files]);
    setImageGifUrl(null);
  };

  const handleGenerateImageGif = async () => {
    if (imageFiles.length === 0) return;
    setIsRenderingImages(true);
    setImageProgress(0);
    triggerHaptic('medium');

    try {
      let blob: Blob;
      if (imageFiles.length === 1) {
        blob = await createAnimatedGifFromSingleImage(
          imageFiles[0],
          singleImageEffect,
          2.5,
          imageFps,
          (p: number) => setImageProgress(p)
        );
      } else {
        blob = await createGifFromImages(
          imageFiles,
          { fps: imageFps, loop: imageLoop },
          (p: number) => setImageProgress(p)
        );
      }

      const url = URL.createObjectURL(blob);
      setImageGifUrl(url);
      addHistoryItem({
        type: 'gif',
        title: imageFiles.length === 1 ? '1 Фото в GIF' : 'Серия Фото в GIF',
        subtitle: `${imageFiles.length} фото • ${(blob.size / 1024).toFixed(1)} КБ`,
      });
      triggerHaptic('success');
      confetti({ particleCount: 50, spread: 50, origin: { y: 0.8 } });
    } catch (err: any) {
      alert(err.message || 'Ошибка генерации GIF');
    } finally {
      setIsRenderingImages(false);
    }
  };

  // Handlers for Video to GIF
  const handleVideoSelected = (files: File[]) => {
    if (files.length > 0) {
      const f = files[0];
      setVideoFile(f);
      const url = URL.createObjectURL(f);
      setVideoUrl(url);
      setVideoGifUrl(null);
      setStartTime(0);
    }
  };

  const handleLoadedVideoMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const dur = e.currentTarget.duration || 10;
    setVideoDuration(dur);
    setGifDuration(Math.min(4, Math.floor(dur)));
  };

  const handleGenerateVideoGif = async () => {
    if (!videoFile) return;
    setIsRenderingVideo(true);
    setVideoProgress(0);
    triggerHaptic('medium');

    try {
      const blob = await createGifFromVideo(
        videoFile,
        startTime,
        gifDuration,
        videoFps,
        videoWidth,
        (p) => setVideoProgress(p)
      );
      const url = URL.createObjectURL(blob);
      setVideoGifUrl(url);
      addHistoryItem({
        type: 'gif',
        title: 'Видео в GIF',
        subtitle: `${videoFile.name} • ${(blob.size / (1024 * 1024)).toFixed(2)} МБ`,
      });
      triggerHaptic('success');
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.8 } });
    } catch (err: any) {
      alert(err.message || 'Ошибка конвертации видео в GIF');
    } finally {
      setIsRenderingVideo(false);
    }
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImageGifUrl(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Banner */}
      <div className="glass-panel" style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(6,182,212,0.08) 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
          <div style={{ padding: '8px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.2)', color: 'var(--primary-light)' }}>
            <Film size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800 }}>GIF Студия</h2>
              <span className="badge badge-offline">Оффлайн</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Создавайте анимированные GIF из серии фотографий или видеороликов прямо на устройстве
            </p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="tab-pills">
          <button
            className={`tab-pill ${activeTab === 'images' ? 'active' : ''}`}
            onClick={() => setActiveTab('images')}
          >
            <Images size={15} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
            Серия Фото ➔ GIF
          </button>
          <button
            className={`tab-pill ${activeTab === 'video' ? 'active' : ''}`}
            onClick={() => setActiveTab('video')}
          >
            <Video size={15} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
            Видео ➔ GIF
          </button>
        </div>
      </div>

      {/* Mode 1: Photos to GIF */}
      {activeTab === 'images' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <DropZone
            accept=".png,.jpg,.jpeg,.webp,.avif"
            multiple
            onFilesSelected={handleImagesSelected}
            title="Загрузите фотографии для создания GIF"
            subtitle="Выберите от 2 до 50 кадров (PNG, JPG, WebP)"
            icon={<Images size={28} />}
          />

          {imageFiles.length > 0 && (
            <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <strong style={{ fontSize: '15px' }}>Выбрано кадров: {imageFiles.length}</strong>
                <button
                  className="btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '12px', color: '#f87171' }}
                  onClick={() => {
                    setImageFiles([]);
                    setImageGifUrl(null);
                  }}
                >
                  <Trash2 size={13} /> Очистить
                </button>
              </div>

              {/* Thumbnails preview */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))',
                  gap: '8px',
                  maxHeight: '160px',
                  overflowY: 'auto',
                  padding: '4px',
                }}
              >
                {imageFiles.map((file, idx) => (
                  <ImageThumbnail
                    key={`${file.name}-${idx}`}
                    file={file}
                    index={idx}
                    onRemove={() => removeImage(idx)}
                  />
                ))}
              </div>

              {/* Controls */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                {imageFiles.length === 1 ? (
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                      Эффект анимации для 1 фото:
                    </label>
                    <select value={singleImageEffect} onChange={(e) => setSingleImageEffect(e.target.value as any)}>
                      <option value="zoom">🔍 Живой Zoom (Плавное приближение)</option>
                      <option value="pulse">💓 Пульсация (Эффект дыхания)</option>
                      <option value="pan">↔️ Панорама (Сдвиг влево-вправо)</option>
                      <option value="static">🖼️ Статичный GIF (1 кадр)</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                      <span>Скорость (FPS):</span>
                      <strong>{imageFps} кадр/сек</strong>
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="24"
                      value={imageFps}
                      onChange={(e) => setImageFps(Number(e.target.value))}
                    />
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '18px' }}>
                  <input
                    type="checkbox"
                    id="loopCheck"
                    checked={imageLoop}
                    onChange={(e) => setImageLoop(e.target.checked)}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <label htmlFor="loopCheck" style={{ fontSize: '13px', cursor: 'pointer' }}>
                    Зацикливать GIF анимацию
                  </label>
                </div>
              </div>

              <button
                className="btn-primary"
                onClick={handleGenerateImageGif}
                disabled={isRenderingImages}
                style={{ width: '100%', padding: '14px', fontSize: '15px' }}
              >
                {isRenderingImages ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    <span>Сборка GIF... {imageProgress}%</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>
                      {imageFiles.length === 1
                        ? 'Сгенерировать GIF из 1 фото'
                        : `Сгенерировать GIF из ${imageFiles.length} фото`}
                    </span>
                  </>
                )}
              </button>

              {/* Result Preview */}
              {imageGifUrl && (
                <div
                  className="glass-card"
                  style={{
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                    background: 'rgba(0,0,0,0.5)',
                  }}
                >
                  <strong style={{ fontSize: '14px', color: 'var(--primary-light)' }}>Готовый GIF:</strong>
                  <img
                    src={imageGifUrl}
                    alt="Result GIF"
                    style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px' }}
                  />
                  <a
                    href={imageGifUrl}
                    download="photos_animation.gif"
                    className="btn-primary"
                    style={{ textDecoration: 'none' }}
                  >
                    <Download size={16} />
                    <span>Скачать GIF</span>
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Video to GIF */}
      {activeTab === 'video' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {!videoFile ? (
            <DropZone
              accept=".mp4,.mov,.webm,.mkv"
              onFilesSelected={handleVideoSelected}
              title="Загрузите видеоролик для конвертации в GIF"
              subtitle="Поддерживаются форматы MP4, MOV, WebM"
              icon={<Video size={28} />}
            />
          ) : (
            <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <strong style={{ fontSize: '15px' }}>{videoFile.name}</strong>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Длительность видео: {videoDuration.toFixed(1)} сек
                  </div>
                </div>
                <button
                  className="btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '12px' }}
                  onClick={() => {
                    setVideoFile(null);
                    setVideoUrl(null);
                    setVideoGifUrl(null);
                  }}
                >
                  Выбрать другое
                </button>
              </div>

              {/* Video Player */}
              {videoUrl && (
                <div style={{ borderRadius: '12px', overflow: 'hidden', background: '#000', maxHeight: '240px', display: 'flex', justifyContent: 'center' }}>
                  <video
                    src={videoUrl}
                    controls
                    onLoadedMetadata={handleLoadedVideoMetadata}
                    style={{ maxWidth: '100%', maxHeight: '240px' }}
                  />
                </div>
              )}

              {/* Range settings */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                    <span>Начало фрагмента:</span>
                    <strong>{startTime.toFixed(1)} с</strong>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max={Math.max(0, videoDuration - 1)}
                    step="0.1"
                    value={startTime}
                    onChange={(e) => setStartTime(Number(e.target.value))}
                  />
                </div>

                <div>
                  <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                    <span>Длительность GIF:</span>
                    <strong>{gifDuration.toFixed(1)} с</strong>
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max={Math.min(10, Math.max(1, videoDuration - startTime))}
                    step="0.5"
                    value={gifDuration}
                    onChange={(e) => setGifDuration(Number(e.target.value))}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                    Качество (FPS):
                  </label>
                  <select value={videoFps} onChange={(e) => setVideoFps(Number(e.target.value))}>
                    <option value={8}>8 FPS (Легкий вес)</option>
                    <option value={10}>10 FPS (Стандарт)</option>
                    <option value={15}>15 FPS (Плавный)</option>
                    <option value={20}>20 FPS (Максимальная плавность)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                    Ширина кадра:
                  </label>
                  <select value={videoWidth} onChange={(e) => setVideoWidth(Number(e.target.value))}>
                    <option value={320}>320 px (Маленький)</option>
                    <option value={480}>480 px (Оптимальный для смартфонов)</option>
                    <option value={640}>640 px (Высокое разрешение)</option>
                  </select>
                </div>
              </div>

              <button
                className="btn-primary"
                onClick={handleGenerateVideoGif}
                disabled={isRenderingVideo}
                style={{ width: '100%', padding: '14px', fontSize: '15px' }}
              >
                {isRenderingVideo ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    <span>Конвертация видео в GIF... {videoProgress}%</span>
                  </>
                ) : (
                  <>
                    <Play size={18} />
                    <span>Сконвертировать видео в GIF</span>
                  </>
                )}
              </button>

              {/* Result Preview */}
              {videoGifUrl && (
                <div
                  className="glass-card"
                  style={{
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                    background: 'rgba(0,0,0,0.5)',
                  }}
                >
                  <strong style={{ fontSize: '14px', color: 'var(--primary-light)' }}>Готовый GIF:</strong>
                  <img
                    src={videoGifUrl}
                    alt="Result Video GIF"
                    style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px' }}
                  />
                  <a
                    href={videoGifUrl}
                    download="video_animation.gif"
                    className="btn-primary"
                    style={{ textDecoration: 'none' }}
                  >
                    <Download size={16} />
                    <span>Скачать GIF</span>
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
