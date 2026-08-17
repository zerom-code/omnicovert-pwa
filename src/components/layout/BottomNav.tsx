import React from 'react';
import { Mic, Film, FileText, Image as ImageIcon, Music, Database, Zap } from 'lucide-react';
import { triggerHaptic } from '../../lib/storage';

export type TabType = 'whisper' | 'compress' | 'gif' | 'pdf' | 'images' | 'media' | 'data';

interface BottomNavProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab }) => {
  const tabs = [
    { id: 'whisper' as TabType, label: 'AI Whisper', icon: <Mic size={18} /> },
    { id: 'compress' as TabType, label: 'Сжатие', icon: <Zap size={18} /> },
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
    <nav className="bottom-nav-container">
      {tabs.map((tab) => {
        const isActive = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className="bottom-nav-btn"
            style={{
              color: isActive ? 'var(--primary-light)' : 'var(--text-muted)',
            }}
          >
            {isActive && <div className="bottom-nav-indicator" />}
            <div
              style={{
                transform: isActive ? 'scale(1.08)' : 'scale(1)',
                transition: 'transform 0.15s ease',
              }}
            >
              {tab.icon}
            </div>
            <span
              className="bottom-nav-label"
              style={{
                fontWeight: isActive ? 700 : 500,
                color: isActive ? '#ffffff' : 'var(--text-muted)',
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
