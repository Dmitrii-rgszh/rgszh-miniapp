import React from 'react';
import { createRoot } from 'react-dom/client';   // <-- именно named‑импорт
import MainApp from './MainApp';
import './index.css';

// 1. найдём контейнер
const container = document.getElementById('root');
// 2. создадим root
const root = createRoot(container);
// 3. отрендерим
root.render(
  <React.StrictMode>
    <MainApp />
  </React.StrictMode>
);

// (опционально) отключим service workers, чтобы не кэшировалось старое
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then(regs => regs.forEach(r => r.unregister()))
    .catch(() => {/* ignore */});
}

// (опционально) ловим необработанные ошибки
window.addEventListener('error', e => console.error('Global error:', e));
window.addEventListener('unhandledrejection', e => console.error('Unhandled promise:', e.reason));







