// index.js - ОБНОВЛЕННАЯ ВЕРСИЯ С BrowserRouter
import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom'; // ← ПЕРЕНЕСЕН СЮДА
import './index.css';
import MainApp from './MainApp'; // или App, если используете App.js

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <BrowserRouter basename={process.env.PUBLIC_URL}>
      <MainApp />
    </BrowserRouter>
  </React.StrictMode>
);








