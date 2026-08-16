import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { registerSW } from 'virtual:pwa-register';

// Auto-update PWA service worker immediately on new deploys
registerSW({
  immediate: true,
  onNeedRefresh() {
    window.location.reload();
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
