import React, { useState, useEffect } from 'react';
import { Key, History, Download, Sparkles } from 'lucide-react';
import { getStoredApiKey } from '../../lib/storage';

interface HeaderProps {
  onOpenApiKey: () => void;
  onOpenHistory: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenApiKey, onOpenHistory }) => {
  const [hasApiKey, setHasApiKey] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    setHasApiKey(!!getStoredApiKey());

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstallable(false);
      }
      setDeferredPrompt(null);
    }
  };

  return (
    <header className="top-header-container">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'var(--primary-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-glow)',
          }}
        >
          <Sparkles size={20} color="#ffffff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <h1 style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Omni<span style={{ color: 'var(--primary-light)' }}>Convert</span>
            </h1>
            <span className="badge badge-pwa" style={{ fontSize: '9px', padding: '2px 6px' }}>
              PWA
            </span>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Мультиконвертер & AI Whisper
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {isInstallable && (
          <button
            className="btn-secondary"
            onClick={handleInstallClick}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              color: 'var(--primary-light)',
              borderColor: 'var(--border-glow)',
            }}
          >
            <Download size={14} />
            <span className="hide-mobile">Установить PWA</span>
          </button>
        )}

        <button
          className="btn-secondary"
          onClick={onOpenHistory}
          style={{ padding: '8px', borderRadius: '10px' }}
          title="История"
        >
          <History size={16} />
        </button>

        <button
          className="btn-secondary"
          onClick={onOpenApiKey}
          style={{
            padding: '8px 12px',
            borderRadius: '10px',
            borderColor: hasApiKey ? 'rgba(16, 185, 129, 0.4)' : 'rgba(236, 72, 153, 0.4)',
            background: hasApiKey ? 'rgba(16, 185, 129, 0.08)' : 'rgba(236, 72, 153, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
          }}
          title="Настройка API ключа OpenAI"
        >
          <Key size={14} color={hasApiKey ? '#10b981' : '#ec4899'} />
          <span style={{ color: hasApiKey ? '#34d399' : '#f472b6', fontWeight: 600 }}>
            {hasApiKey ? 'OpenAI OK' : 'API Ключ'}
          </span>
        </button>
      </div>
    </header>
  );
};
