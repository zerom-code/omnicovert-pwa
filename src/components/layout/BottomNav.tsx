import React from 'react';
import { Mic, Film, FileText, Image as ImageIcon, Music, Database } from 'lucide-react';
import { triggerHaptic } from '../../lib/storage';

export type TabType = 'whisper' | 'gif' | 'pdf' | 'images' | 'media' | 'data';

interface BottomNavProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab }) => {
  const tabs = [
    { id: 'whisper' as TabType, label: 'AI Whisper', icon: <Mic size={18} /> },
    { id: 'gif' as TabType, label: 'GIF Студия', icon: <Film size={18} /> },
    { id: 'pdf' as TabType, label: 'PDF Suite', icon: <FileText size={18} /> },
    { id: 'images' as TabType, label: 'Фото', icon: <ImageIcon size={18} /> },
    { id: 'media' as TabType, label: 'Медиа', icon: <Music size={18} /> },
    { id: 'data' as TabType, label: 'Данные', icon: <Database size={18} /> },
  ];

  const handleTabClick = (tabId: TabType) => {
    triggerHaptic('light');
    onSelectTab(tabId);
  };

  return (
    <nav
      style={{
        flexShrink: 0,
        width: '100%',
        background: 'rgba(8, 10, 16, 0.98)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingTop: '6px',
        paddingLeft: '4px',
        paddingRight: '4px',
        paddingBottom: 'max(4px, env(safe-area-inset-bottom, 4px))',
        zIndex: 50,
      }}
    >
      {tabs.map((tab) => {
        const isActive = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              background: 'transparent',
              border: 'none',
              color: isActive ? 'var(--primary-light)' : 'var(--text-muted)',
              cursor: 'pointer',
              padding: '2px 4px',
              borderRadius: '8px',
              transition: 'all 0.15s ease',
              position: 'relative',
              flex: 1,
              maxWidth: '70px',
            }}
          >
            {isActive && (
              <div
                style={{
                  position: 'absolute',
                  top: '-6px',
                  width: '16px',
                  height: '2px',
                  borderRadius: '9999px',
                  background: 'var(--primary-gradient)',
                  boxShadow: '0 0 8px rgba(99, 102, 241, 0.8)',
                }}
              />
            )}
            <div
              style={{
                transform: isActive ? 'scale(1.05)' : 'scale(1)',
                transition: 'transform 0.15s ease',
              }}
            >
              {tab.icon}
            </div>
            <span
              style={{
                fontSize: '10px',
                fontWeight: isActive ? 700 : 500,
                fontFamily: 'var(--font-heading)',
              }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
