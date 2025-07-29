// index.js - ТОЧКА ВХОДА ПРИЛОЖЕНИЯ
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import MainApp from './MainApp';
import reportWebVitals from './reportWebVitals';

// Импортируем функцию для ripple эффекта
import { initRippleEffect } from './ripple';

// Импортируем CSS файлы
import './Styles/containers.css';
import './Styles/buttons.css';
import './Styles/logo.css';
import './Styles/text.css';
import './Styles/cards.css';
import './Styles/BackButton.css';
import './Styles/HomeButton.css';
import './Styles/ModalWindow.css';
import './Styles/ProgressIndicator.css';
import './Styles/QRStyles.css';
import './Styles/animations.css'; // Новый файл с анимациями

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <MainApp />
  </React.StrictMode>
);

// Инициализируем ripple эффект после рендера
setTimeout(() => {
  initRippleEffect();
}, 100);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();







