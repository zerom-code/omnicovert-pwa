import React, { useState } from 'react';
import { Key, ShieldCheck, ExternalLink, X, Check } from 'lucide-react';
import { getStoredApiKey, setStoredApiKey, triggerHaptic } from '../../lib/storage';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSaved }) => {
  const [apiKey, setApiKey] = useState(getStoredApiKey());
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    setStoredApiKey(apiKey);
    triggerHaptic('success');
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onSaved();
      onClose();
    }, 600);
  };

  const handleClear = () => {
    setStoredApiKey('');
    setApiKey('');
    triggerHaptic('light');
    onSaved();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '480px',
          padding: '24px',
          background: 'rgba(15, 20, 32, 0.95)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
          }}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div
            style={{
              padding: '10px',
              borderRadius: '12px',
              background: 'rgba(236, 72, 153, 0.15)',
              color: '#ec4899',
            }}
          >
            <Key size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>OpenAI API Ключ</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Для работы AI Whisper расшифровки и суммаризации
            </p>
          </div>
        </div>

        <div
          style={{
            padding: '12px',
            borderRadius: '10px',
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            marginBottom: '18px',
          }}
        >
          <ShieldCheck size={18} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '12px', color: '#a7f3d0' }}>
            <strong>100% Приватность:</strong> Ваш ключ сохраняется исключительно в защищенном локальном хранилище вашего браузера (localStorage) и отправляется напрямую на серверы OpenAI без сторонних серверов.
          </div>
        </div>

        <div style={{ marginBottom: '18px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
            Введите ваш ключ (sk-...):
          </label>
          <input
            type="password"
            placeholder="sk-proj-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            style={{ fontFamily: 'monospace' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <a
            href="https://platform.openai.com/api-keys"
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              color: 'var(--primary-light)',
              textDecoration: 'none',
            }}
          >
            <span>Получить ключ на platform.openai.com</span>
            <ExternalLink size={12} />
          </a>

          {apiKey && (
            <button
              onClick={handleClear}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#f87171',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Удалить ключ
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-secondary" style={{ flex: 1 }} onClick={onClose}>
            Отмена
          </button>
          <button
            className="btn-primary"
            style={{ flex: 1 }}
            onClick={handleSave}
            disabled={!apiKey.trim()}
          >
            {savedSuccess ? (
              <>
                <Check size={16} /> Сохранено!
              </>
            ) : (
              'Сохранить ключ'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
