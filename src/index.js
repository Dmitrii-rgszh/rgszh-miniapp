import React from 'react';
import { createRoot } from 'react-dom/client';
import MainApp from './MainApp';
import './index.css';

// Отключаем старые service workers, если они есть
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then(regs => regs.forEach(r => r.unregister()))
    .catch(() => {});
}

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <MainApp />
  </React.StrictMode>
);

// Telegram WebApp API: соообщаем, что страница готова, и раскрываем WebView
if (window.Telegram && window.Telegram.WebApp) {
  window.Telegram.WebApp.ready();
  window.Telegram.WebApp.expand();
}

// Глобальный лог ошибок для отладки
window.addEventListener('error',   e => console.error('Global error:', e.message, e));
window.addEventListener('unhandledrejection', e => console.error('UnhandledRejection:', e.reason));







