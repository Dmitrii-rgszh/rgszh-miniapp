// PollsPage.js - МАКСИМАЛЬНО УПРОЩЕННАЯ ВЕРСИЯ
// ✅ УДАЛЕНЫ ВСЕ СОСТОЯНИЯ И useEffect
// ✅ УДАЛЕНЫ ВСЕ ИНЛАЙН СТИЛИ
// ✅ ТОЛЬКО БАЗОВАЯ ФУНКЦИОНАЛЬНОСТЬ

import React, { useRef } from 'react';
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
  const logoRef = useRef(null);
  const homeRef = useRef(null);

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

  // ===== QR ОБРАБОТЧИКИ =====
  const handleQrClick = (e, poll) => {
    e.stopPropagation();
    const qrUrl = `${window.location.origin}${poll.path}`;
    
    // Простое модальное окно
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content card-container">
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
        <div class="modal-header">
          <h3 class="modal-title">QR-код для опроса</h3>
          <p class="modal-subtitle">«${poll.label}»</p>
        </div>
        <div class="modal-qr-container">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}" 
               alt="QR Code" class="modal-qr-image" />
        </div>
        <div class="modal-url">${qrUrl}</div>
        <button class="btn-universal btn-primary btn-medium" onclick="
          navigator.clipboard.writeText('${qrUrl}').then(() => {
            this.textContent = '✓ Скопировано!';
            setTimeout(() => this.textContent = 'Скопировать ссылку', 2000);
          })
        ">Скопировать ссылку</button>
      </div>
    `;
    
    modal.onclick = (e) => {
      if (e.target === modal) modal.remove();
    };
    
    document.body.appendChild(modal);
  };

  // ===== RIPPLE ЭФФЕКТ =====
  const createRipple = (event) => {
    const button = event.currentTarget;
    const circle = document.createElement('span');
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;
    
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - button.offsetLeft - radius}px`;
    circle.style.top = `${event.clientY - button.offsetTop - radius}px`;
    circle.classList.add('ripple');
    
    const ripple = button.getElementsByClassName('ripple')[0];
    if (ripple) {
      ripple.remove();
    }
    
    button.appendChild(circle);
  };

  return (
    <div className="main-container">
      {/* Логотип */}
      <div ref={logoRef} className="logo-wrapper">
        <img
          src={logoImage}
          alt="Логотип РГС Жизнь"
          className="logo-image"
        />
      </div>

      {/* Кнопка домой */}
      <button
        ref={homeRef}
        onClick={handleHomeClick}
        className="home-button with-top-logo"
        title="Назад в главное меню"
      >
        <svg viewBox="0 0 24 24">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
        </svg>
      </button>

      {/* Кнопки опросов */}
      <div className="button-container with-logo">
        {polls.map((poll, index) => (
          <div key={poll.path} className="poll-row">
            {/* Основная кнопка опроса */}
            <button
              className="btn-universal btn-primary btn-large btn-shadow btn-fullwidth"
              onClick={(e) => {
                createRipple(e);
                handleClick(poll.path);
              }}
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