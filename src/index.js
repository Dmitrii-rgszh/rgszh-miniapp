// src/index.js
import React from 'react';
import { createRoot } from 'react-dom/client';  // <-- обязательно named‑импорт
import MainApp from './MainApp';
import './index.css';

// Отключаем все ранее зарегистрированные service workers, чтобы не подхватить закэшированный манифест.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then(regs => regs.forEach(r => r.unregister()))
    .catch(() => { /* silently */ });
}

// Создаём корень React 18+
const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <MainApp />
  </React.StrictMode>
);

// Для отладки любых необработанных ошибок
window.addEventListener('error',   e => console.error('Global error:', e.message, e));
window.addEventListener('unhandledrejection', e => console.error('UnhandledRejection:', e.reason));







