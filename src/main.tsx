import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

// Registrazione del Service Worker PWA con aggiornamento automatico
registerSW({
  immediate: true,
  onOfflineReady() {
    console.log('SpesApp è pronta per funzionare offline.');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
