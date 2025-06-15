import React from 'react';
import { createRoot } from 'react-dom/client';   // <— Точно такой импорт!
import MainApp from './MainApp';
import './index.css';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Под root‑элементом не найден контейнер #root');
}
const root = createRoot(container);              // <— createRoot, а не ReactDOM.createRoot
root.render(
  <React.StrictMode>
    <MainApp />
  </React.StrictMode>
);








