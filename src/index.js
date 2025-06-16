import React from 'react';
import ReactDOM from 'react-dom/client';
import MainApp from './MainApp';
import './index.css';

// Глобальный отлов ошибок
window.addEventListener("error", event => {
  console.error("Global JS Error:", event.error || event.message, event);
});
window.addEventListener("unhandledrejection", event => {
  console.error("Global Promise Rejection:", event.reason);
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <MainApp />
  </React.StrictMode>
);








