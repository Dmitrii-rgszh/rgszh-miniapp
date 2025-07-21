// PollsPage.js - С УНИФИЦИРОВАННЫМИ СТИЛЯМИ
// ✅ Использует containers.css для позиционирования
// ✅ Использует buttons.css для стилей кнопок
// ✅ Минимум инлайн стилей

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logoImage from './components/logo.png';

// Подключаем CSS файлы
import './Styles/containers.css';    // Универсальные контейнеры
import './Styles/buttons.css';       // Универсальные кнопки
import './Styles/logo.css';          // Логотип
import './Styles/QRStyles.css';      // QR функциональность
import './Styles/ModalWindow.css';   // Модальные окна
import './Styles/HomeButton.css';    // Кнопка домой

export default function PollsPage() {
  const navigate = useNavigate();
  const logoRef = useRef(null);
  const homeRef = useRef(null);

  // ===== СОСТОЯНИЯ =====
  const [logoAnimated, setLogoAnimated] = useState(false);
  const [buttonsAnimated, setButtonsAnimated] = useState(false);
  const [homeAnimated, setHomeAnimated] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [qrData, setQrData] = useState({ open: false, path: '', label: '' });

  // ===== ДАННЫЕ ОПРОСОВ =====
  const polls = [
    { path: '/assessment', label: 'Оценка кандидата' },
    { path: '/feedback', label: 'Обратная связь' },
    { path: '/marza-poll', label: 'Маржа продаж' },
  ];

  // ===== АНИМАЦИЯ ВХОДА =====
  useEffect(() => {
    const timer1 = setTimeout(() => {
      setLogoAnimated(true);
      setHomeAnimated(true);
      if (logoRef.current) {
        logoRef.current.classList.add('animate-logo');
      }
    }, 100);
    
    const timer2 = setTimeout(() => {
      setButtonsAnimated(true);
    }, 600);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  // ===== ОБРАБОТЧИКИ =====
  const handleClick = (path) => {
    if (isExiting) return;
    
    setIsExiting(true);
    
    if (logoRef.current) {
      logoRef.current.classList.add('animate-logo-exit');
    }
    
    setTimeout(() => navigate(path), 800);
  };

  const handleHomeClick = () => {
    if (isExiting) return;
    
    setIsExiting(true);
    
    if (logoRef.current) {
      logoRef.current.classList.add('animate-logo-exit');
    }
    
    setTimeout(() => navigate('/main-menu'), 800);
  };

  const handleQrClick = (e, poll) => {
    e.stopPropagation();
    setQrData({ open: true, path: poll.path, label: poll.label });
  };

  const closeQr = () => setQrData({ open: false, path: '', label: '' });

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

  // ===== КЛАССЫ ДЛЯ ЭЛЕМЕНТОВ =====
  const getContainerClasses = () => [
    'main-container',
    isExiting ? 'exiting' : ''
  ].filter(Boolean).join(' ');

  const getLogoClasses = () => [
    'logo-wrapper',
    logoAnimated ? 'animated' : '',
    isExiting ? 'exiting' : ''
  ].filter(Boolean).join(' ');

  const getButtonContainerClasses = () => [
    'button-container',
    'with-logo',
    buttonsAnimated ? 'animated' : '',
    isExiting ? 'exiting' : ''
  ].filter(Boolean).join(' ');

  const getHomeButtonClasses = () => [
    'home-button',
    'with-top-logo',  // Указываем что есть логотип наверху
    homeAnimated ? 'animate-in' : '',
    isExiting ? 'animate-out' : ''
  ].filter(Boolean).join(' ');

  const getPollButtonClasses = (index) => [
    'btn-universal',
    'btn-primary',
    'btn-large',
    'btn-shadow',
    'btn-fullwidth',
    buttonsAnimated ? 'button-animated' : 'button-hidden',
    isExiting ? 'button-exiting' : ''
  ].filter(Boolean).join(' ');

  const getQrButtonClasses = () => [
    'qr-button'  // Используем класс из QRStyles.css
  ].filter(Boolean).join(' ');

  // QR URL
  const qrUrl = qrData.path ? `${window.location.origin}${qrData.path}` : '';

  return (
    <div className={getContainerClasses()}>
      {/* ===== ЛОГОТИП ===== */}
      <div 
        ref={logoRef} 
        className={getLogoClasses()}
      >
        <img
          src={logoImage}
          alt="Логотип РГС Жизнь"
          className="logo-image"
        />
      </div>

      {/* ===== КНОПКА ДОМОЙ ===== */}
      <button
        ref={homeRef}
        onClick={handleHomeClick}
        className={getHomeButtonClasses()}
        title="Назад в главное меню"
      >
        <svg viewBox="0 0 24 24">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
        </svg>
      </button>

      {/* ===== КНОПКИ ОПРОСОВ ===== */}
      <div className={getButtonContainerClasses()}>
        {polls.map((poll, index) => (
          <div key={poll.path} className={`poll-row ${buttonsAnimated ? 'animated' : ''}`}>
            {/* Основная кнопка опроса */}
            <button
              className={getPollButtonClasses(index)}
              data-index={index}
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
              className={getQrButtonClasses()}
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

      {/* ===== QR МОДАЛЬНОЕ ОКНО ===== */}
      {qrData.open && (
        <div className="modal-overlay" onClick={closeQr}>
          <div className="modal-content card-container" onClick={e => e.stopPropagation()}>
            {/* Кнопка закрытия */}
            <button
              onClick={closeQr}
              className="modal-close"
              aria-label="Закрыть"
            >
              ×
            </button>
            
            {/* Заголовок */}
            <div className="modal-header">
              <h3 className="modal-title">QR-код для опроса</h3>
              <p className="modal-subtitle">«{qrData.label}»</p>
            </div>
            
            {/* QR код */}
            <div className="modal-qr-container">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}`}
                alt="QR Code"
                className="modal-qr-image"
                loading="lazy"
              />
            </div>
            
            {/* URL */}
            <div className="modal-url">
              {qrUrl}
            </div>
            
            {/* Кнопка копирования */}
            <button
              onClick={(e) => {
                navigator.clipboard.writeText(qrUrl).then(() => {
                  const btn = e.target;
                  const originalText = btn.textContent;
                  const originalClass = btn.className;
                  btn.textContent = '✓ Скопировано!';
                  btn.className = originalClass + ' btn-success';
                  setTimeout(() => {
                    btn.textContent = originalText;
                    btn.className = originalClass;
                  }, 2000);
                });
              }}
              className="btn-universal btn-primary btn-medium"
            >
              Скопировать ссылку
            </button>
          </div>
        </div>
      )}
    </div>
  );
}