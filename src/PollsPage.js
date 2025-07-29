// PollsPage.js - УПРОЩЕННАЯ ВЕРСИЯ
// ✅ Удалены все useState и useEffect
// ✅ Удалены все инлайн стили
// ✅ Простая функциональность

import React from 'react';
import { useNavigate } from 'react-router-dom';
import logoImage from './components/logo.png';

// Подключаем CSS файлы
import './Styles/containers.css';
import './Styles/buttons.css';
import './Styles/logo.css';
import './Styles/QRStyles.css';
import './Styles/ModalWindow.css';
import './Styles/HomeButton.css';

export default function PollsPage() {
  const navigate = useNavigate();

  // ===== ДАННЫЕ ОПРОСОВ =====
  const polls = [
    { path: '/assessment', label: 'Оценка кандидата' },
    { path: '/feedback', label: 'Обратная связь' },
    { path: '/marza-poll', label: 'Маржа продаж' },
  ];

  // ===== ОБРАБОТКА КЛИКА ПО ОПРОСУ =====
  const handleClick = (path) => {
    navigate(path);
  };

  // ===== ОБРАБОТКА КЛИКА ПО КНОПКЕ ДОМОЙ =====
  const handleHomeClick = () => {
    navigate('/main-menu');
  };

  // ===== QR ОБРАБОТЧИК =====
  const handleQrClick = (e, poll) => {
    e.stopPropagation();
    const qrUrl = `${window.location.origin}${poll.path}`;
    alert(`QR URL: ${qrUrl}`); // Простой alert вместо модального окна
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

      {/* Кнопка домой */}
      <button
        onClick={handleHomeClick}
        className="home-button with-top-logo animate-home"
        title="Назад в главное меню"
      >
        <svg viewBox="0 0 24 24">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
        </svg>
      </button>

      {/* Кнопки опросов */}
      <div className="button-container with-logo">
        {polls.map((poll) => (
          <div key={poll.path} className="poll-row animated">
            {/* Основная кнопка опроса */}
            <button
              className="btn-universal btn-primary btn-large btn-shadow btn-fullwidth"
              onClick={() => handleClick(poll.path)}
            >
              {poll.label}
            </button>

            {/* QR кнопка */}
            <button
              onClick={(e) => handleQrClick(e, poll)}
              className="qr-button"
              title={`QR-код для ${poll.label}`}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                className="qr-icon"
                fill="currentColor"
              >
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
                <rect x="5" y="5" width="3" height="3" fill="white" />
                <rect x="16" y="5" width="3" height="3" fill="white" />
                <rect x="5" y="16" width="3" height="3" fill="white" />
                <rect x="14" y="14" width="2" height="2" />
                <rect x="17" y="14" width="2" height="2" />
                <rect x="19" y="16" width="2" height="2" />
                <rect x="14" y="17" width="2" height="2" />
                <rect x="16" y="19" width="2" height="2" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}