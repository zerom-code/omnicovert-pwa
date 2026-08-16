import { useState } from 'react';
import { Header } from './components/layout/Header';
import { BottomNav, type TabType } from './components/layout/BottomNav';
import { WhisperStudio } from './components/converters/WhisperStudio';
import { GifStudio } from './components/converters/GifStudio';
import { PdfSuite } from './components/converters/PdfSuite';
import { ImageConverter } from './components/converters/ImageConverter';
import { AudioVideoConverter } from './components/converters/AudioVideoConverter';
import { DataConverter } from './components/converters/DataConverter';
import { ApiKeyModal } from './components/ui/ApiKeyModal';
import { HistoryModal } from './components/ui/HistoryModal';

export function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('whisper');
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [, setHistoryRefreshTick] = useState(0);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header */}
      <Header
        onOpenApiKey={() => setIsApiKeyModalOpen(true)}
        onOpenHistory={() => setIsHistoryModalOpen(true)}
      />

      {/* Main Content Area (Native App Shell) */}
      <main
        className="main-scroll-area"
        style={{
          maxWidth: '900px',
          width: '100%',
          margin: '0 auto',
          padding: '20px 16px',
        }}
      >
        {currentTab === 'whisper' && (
          <WhisperStudio onOpenApiKey={() => setIsApiKeyModalOpen(true)} />
        )}
        {currentTab === 'gif' && <GifStudio />}
        {currentTab === 'pdf' && <PdfSuite />}
        {currentTab === 'images' && <ImageConverter />}
        {currentTab === 'media' && <AudioVideoConverter />}
        {currentTab === 'data' && <DataConverter />}
      </main>

      {/* Mobile-First Navigation Bar */}
      <BottomNav currentTab={currentTab} onSelectTab={setCurrentTab} />

      {/* Modals */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onSaved={() => {}}
      />

      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        onRefresh={() => setHistoryRefreshTick((prev) => prev + 1)}
      />
    </div>
  );
}

export default App;
