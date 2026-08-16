import React from 'react';
import { History, X, Trash2, Clock } from 'lucide-react';
import { getConversionHistory, clearHistory, type HistoryItem } from '../../lib/storage';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, onRefresh }) => {
  const history = getConversionHistory();

  if (!isOpen) return null;

  const handleClear = () => {
    clearHistory();
    onRefresh();
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + d.toLocaleDateString();
  };

  const getBadgeClass = (type: HistoryItem['type']) => {
    switch (type) {
      case 'whisper':
        return 'badge-ai';
      case 'gif':
        return 'badge-pwa';
      default:
        return 'badge-offline';
    }
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
          maxWidth: '520px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px',
          background: 'rgba(15, 20, 32, 0.95)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                padding: '8px',
                borderRadius: '10px',
                background: 'rgba(99, 102, 241, 0.15)',
                color: 'var(--primary-light)',
              }}
            >
              <History size={20} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>История конвертаций</h3>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              <Clock size={36} style={{ opacity: 0.4, marginBottom: '8px' }} />
              <p>История пуста. Ваши недавние конвертации появятся здесь.</p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="glass-card"
                style={{
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span className={`badge ${getBadgeClass(item.type)}`} style={{ fontSize: '10px' }}>
                      {item.type}
                    </span>
                    <strong style={{ fontSize: '14px' }}>{item.title}</strong>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.subtitle}</div>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'right' }}>
                  {formatTime(item.timestamp)}
                </div>
              </div>
            ))
          )}
        </div>

        {history.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              className="btn-secondary"
              style={{ color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.2)' }}
              onClick={handleClear}
            >
              <Trash2 size={15} />
              Очистить историю
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
