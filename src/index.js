// index.js - ОКОНЧАТЕЛЬНОЕ ИСПРАВЛЕНИЕ
import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom'; // ← ИСПОЛЬЗУЕМ HashRouter для надежности
import './index.css';
import './Styles/backgrounds.css';
import MainApp from './MainApp';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <HashRouter>
      <MainApp />
    </HashRouter>
  </React.StrictMode>
);








