// MainMenu.js - ВЕРСИЯ С ПОЛНЫМИ ИНЛАЙН СТИЛЯМИ
// ОБНОВЛЕНО: размеры логотипа уменьшены на 20%

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logoImage from './components/logo.png';


export default function MainMenu() {
  const navigate = useNavigate();
  
  // Состояния анимаций
  const [logoAnimated, setLogoAnimated] = useState(false);
  const [buttonsAnimated, setButtonsAnimated] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  
  // Длительности анимаций Pi
  const [moveDuration] = useState('70s');
  const [rotateDuration] = useState('6s');

  // ===== СТИЛИ =====

  // Основной контейнер
  const mainContainerStyle = {
    position: 'relative',
    width: '100%',
    height: window.innerHeight + 'px',
    minHeight: '100vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, sans-serif'
  };

  // Логотип с анимацией - РАЗМЕРЫ УМЕНЬШЕНЫ НА 20% (было 160px, стало 128px)
  const logoStyle = {
    position: 'absolute',
    top: logoAnimated && !isExiting ? '110px' : isExiting ? '-200px' : '-200px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '128px',  // было 160px
    height: '128px', // было 160px
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    backdropFilter: 'blur(8px)',
    borderRadius: '20px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.25)',
    opacity: logoAnimated && !isExiting ? 1 : 0,
    zIndex: 3,
    transition: 'all 0.8s ease-out',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  // Изображение логотипа - РАЗМЕРЫ УМЕНЬШЕНЫ НА 20% (было 120px, стало 96px)
  const logoImageStyle = {
    width: '96px',   // было 120px
    height: '96px',  // было 120px
    objectFit: 'contain'
  };

  // Контейнер кнопок - ПОЗИЦИОНИРУЕМ ПОД ЛОГОТИПОМ
  // Логотип теперь: 110px (top) + 128px (height) + 30px (отступ) = 268px
  const buttonContainerStyle = {
    position: 'absolute',
    top: buttonsAnimated ? '268px' : '368px', // обновлено для нового размера логотипа
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    maxWidth: '400px',
    zIndex: 3,
    paddingLeft: '20px',
    paddingRight: '20px',
    boxSizing: 'border-box',
    opacity: buttonsAnimated ? 1 : 0,
    transition: 'all 0.8s ease-out 0.2s'
  };

  // Стиль кнопки
  const getButtonStyle = (index, animated) => ({
    position: 'relative',
    minWidth: '280px',
    padding: '18px 36px',
    fontSize: '18px',
    fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, sans-serif',
    fontWeight: '600',
    color: 'white',
    background: 'linear-gradient(135deg, rgba(180, 0, 55, 0.9) 0%, rgba(153, 0, 55, 0.9) 50%, rgba(0, 40, 130, 0.9) 100%)',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(147, 112, 219, 0.3)',
    transform: animated && !isExiting ? 'translateY(0)' : isExiting ? 'translateY(100px)' : 'translateY(50px)',
    opacity: animated && !isExiting ? 1 : 0,
    transition: `all 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) ${0.1 + index * 0.15}s`,
    overflow: 'hidden',
    zIndex: 2
  });

  // Кнопки меню
  const buttons = [
    { label: 'Опросы', to: '/polls' },
    { label: 'Сотрудники', to: '/employee' },
  ];

  // Анимация входа
  useEffect(() => {
    const timer1 = setTimeout(() => setLogoAnimated(true), 100);
    const timer2 = setTimeout(() => setButtonsAnimated(true), 600);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  // Обработка клика по кнопке
  const handleClick = (e, path) => {
    if (isExiting) return;
    
    e.preventDefault();
    createRipple(e);
    
    setIsExiting(true);
    
    setTimeout(() => {
      navigate(path);
    }, 800);
  };

  // Создание ripple эффекта
  const createRipple = (e) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.cssText = `
      position: absolute;
      left: ${x}px;
      top: ${y}px;
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.6);
      transform: scale(0);
      animation: ripple-animation 600ms linear;
      pointer-events: none;
    `;
    
    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  };

  // Стили анимации
  const animations = (
    <style>
      {`
        @keyframes ripple-animation {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }

        .menu-button {
          position: relative;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .menu-button:hover:not(:disabled) {
          transform: translateY(-3px) !important;
          box-shadow: 0 8px 25px rgba(180, 0, 55, 0.4) !important;
        }

        .menu-button:active {
          transform: translateY(0) scale(0.98) !important;
        }

        .menu-button:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.3);
        }

        /* Адаптивность */
        @media (max-width: 768px) {
          .menu-button {
            min-width: 260px !important;
            padding: 16px 32px !important;
            font-size: 16px !important;
          }
        }

        @media (max-width: 480px) {
          .menu-button {
            min-width: 240px !important;
            padding: 14px 28px !important;
            font-size: 15px !important;
          }
        }
      `}
    </style>
  );

  return (
    <div style={mainContainerStyle}>
      {animations}

      {/* Логотип */}
      <div style={logoStyle}>
        <img
          src={logoImage}
          alt="Логотип РГС Жизнь"
          style={logoImageStyle}
        />
      </div>

      {/* Кнопки меню */}
      <div style={buttonContainerStyle}>
        {buttons.map((btn, index) => (
          <button
            key={btn.to}
            className="menu-button"
            style={getButtonStyle(index, buttonsAnimated)}
            onClick={(e) => handleClick(e, btn.to)}
            onMouseEnter={(e) => {
              if (!isExiting) {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(180, 0, 55, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isExiting) {
                e.currentTarget.style.transform = buttonsAnimated ? 'translateY(0)' : 'translateY(50px)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(147, 112, 219, 0.3)';
              }
            }}
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
}















































