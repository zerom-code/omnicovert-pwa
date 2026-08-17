import { useState } from 'react';
import { Header } from './components/layout/Header';
import { BottomNav, type TabType } from './components/layout/BottomNav';
import { WhisperStudio } from './components/converters/WhisperStudio';
import { GifStudio } from './components/converters/GifStudio';
import { PdfSuite } from './components/converters/PdfSuite';
import { ImageConverter } from './components/converters/ImageConverter';
import { AudioVideoConverter } from './components/converters/AudioVideoConverter';
import { DataConverter } from './components/converters/DataConverter';
import { SmartCompressor } from './components/converters/SmartCompressor';
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

      {/* Main Content Area (Scrollable Flex Item) */}
      <main className="app-content-scroll">
        <div style={{ maxWidth: '900px', margin: '0 auto', width: '100%' }}>
          {currentTab === 'whisper' && (
            <WhisperStudio onOpenApiKey={() => setIsApiKeyModalOpen(true)} />
          )}
          {currentTab === 'compress' && <SmartCompressor />}
          {currentTab === 'gif' && <GifStudio />}
          {currentTab === 'pdf' && <PdfSuite />}
          {currentTab === 'images' && <ImageConverter />}
          {currentTab === 'media' && <AudioVideoConverter />}
          {currentTab === 'data' && <DataConverter />}
        </div>
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
