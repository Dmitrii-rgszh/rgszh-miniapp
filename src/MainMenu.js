// MainMenu.js - УПРОЩЕННАЯ ВЕРСИЯ
// ✅ Удалены все useState и useEffect
// ✅ Удалены все инлайн стили
// ✅ Вся логика через CSS классы

import React from 'react';
import { useNavigate } from 'react-router-dom';
import logoImage from './components/logo.png';

// Подключаем CSS файлы
import './Styles/containers.css';
import './Styles/buttons.css';
import './Styles/logo.css';

export default function MainMenu() {
  const navigate = useNavigate();

  // ===== ДАННЫЕ КНОПОК =====
  const buttons = [
    { label: 'Опросы', to: '/polls', type: 'primary' },
    { label: 'Сотрудники', to: '/employee', type: 'primary' },
  ];

  // ===== ОБРАБОТКА КЛИКА =====
  const handleClick = (path) => {
    navigate(path);
  };

  return (
    <div className="main-container">
      {/* Логотип */}
      <div className="logo-wrapper animate-logo">
        <img
          src={logoImage}
          alt="Логотип РГС Жизнь"
          className="logo-image"
        />
      </div>

      {/* Кнопки */}
      <div className="button-container with-logo">
        {buttons.map((btn, index) => (
          <button
            key={btn.to}
            className={`btn-universal btn-${btn.type} btn-large btn-shadow button-animated`}
            onClick={() => handleClick(btn.to)}
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
}















































