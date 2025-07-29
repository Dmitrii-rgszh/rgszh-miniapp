// index.js - ТОЧКА ВХОДА ПРИЛОЖЕНИЯ
import React from 'react';
import ReactDOM from 'react-dom/client';

// Базовые стили
import './index.css';
import './Styles/global.css';
import './Styles/text.css'; // Важно! Все текстовые стили здесь

// Компонент приложения
import MainApp from './MainApp';
import reportWebVitals from './reportWebVitals';

// Остальные стили компонентов
import './Styles/containers.css';
import './Styles/buttons.css';
import './Styles/logo.css';
import './Styles/cards.css';
import './Styles/BackButton.css';
import './Styles/HomeButton.css';
import './Styles/ModalWindow.css';
import './Styles/ProgressIndicator.css';
import './Styles/QRStyles.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <MainApp />
  </React.StrictMode>
);

reportWebVitals();







