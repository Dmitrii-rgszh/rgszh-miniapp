// MainMenu.js - ВЕРСИЯ С ПОЛНЫМИ ИНЛАЙН СТИЛЯМИ

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import logoImage from './components/logo.png';
import piImage from './components/pi.png';

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

  // Логотип с анимацией
  const logoStyle = {
    position: 'absolute',
    top: logoAnimated && !isExiting ? '110px' : isExiting ? '-200px' : '-200px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '160px',
    height: '160px',
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

  const logoImageStyle = {
    width: '120px',
    height: '120px',
    objectFit: 'contain'
  };

  // Контейнер кнопок - ПОЗИЦИОНИРУЕМ ПОД ЛОГОТИПОМ
  const buttonContainerStyle = {
    position: 'absolute',
    top: buttonsAnimated ? '300px' : '400px', // Под логотипом (логотип на 110px + высота 160px + отступ 30px = 300px)
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
    transform: animated && !isExiting ? 'translateY(0)' : isExiting ? `translateY(${window.innerHeight}px)` : 'translateY(50px)',
    opacity: animated && !isExiting ? 1 : 0,
    transition: `all 0.8s cubic-bezier(0.34,1.56,0.64,1) ${0.3 + index * 0.1}s`,
    overflow: 'hidden',
    textAlign: 'center',
    zIndex: 10
  });

  // Фоновые точки
  const dotStyle = (index) => ({
    position: 'absolute',
    width: Math.random() * 8 + 4 + 'px',
    height: Math.random() * 8 + 4 + 'px',
    borderRadius: '50%',
    background: `rgba(${152 + Math.random() * 28}, ${164 + Math.random() * 20}, ${174 + Math.random() * 20}, ${0.3 + Math.random() * 0.4})`,
    zIndex: 2,
    animation: `dotPulse${(index % 3) + 1} ${3 + Math.random() * 4}s infinite`,
    ...(index === 1 && { top: '15%', left: '10%' }),
    ...(index === 2 && { top: '25%', right: '15%' }),
    ...(index === 3 && { bottom: '30%', left: '8%' }),
    ...(index === 4 && { top: '50%', left: '20%' }),
    ...(index === 5 && { bottom: '15%', right: '12%' }),
    ...(index === 6 && { top: '35%', right: '8%' }),
    ...(index === 7 && { top: '45%', left: '5%' }),
    ...(index === 8 && { bottom: '5%', right: '30%' }),
    ...(index === 9 && { top: '60%', right: '25%' }),
    ...(index === 10 && { bottom: '40%', left: '30%' })
  });

  // Pi элемент с космической анимацией
  const piWrapperStyle = {
    position: 'absolute',
    top: '0',
    left: '0',
    zIndex: 2,
    opacity: 0.4,
    animation: `piFloatAround ${moveDuration} ease-in-out infinite`
  };

  const piImageStyle = {
    width: '40px',
    height: '40px',
    opacity: 0.8,
    animation: `piRotate ${rotateDuration} linear infinite`
  };

  // ===== ЛОГИКА =====

  useEffect(() => {
    // Запускаем анимации появления
    const logoTimer = setTimeout(() => setLogoAnimated(true), 100);
    const buttonsTimer = setTimeout(() => setButtonsAnimated(true), 900);

    return () => {
      clearTimeout(logoTimer);
      clearTimeout(buttonsTimer);
    };
  }, []);

  // Обработчик клика с риппл-эффектом и анимацией выхода
  const handleClick = (e, route) => {
    const btn = e.currentTarget;
    
    // Риппл-эффект
    const circle = document.createElement('span');
    const diameter = Math.max(btn.clientWidth, btn.clientHeight);
    const radius = diameter / 2;
    
    circle.style.cssText = `
      position: absolute;
      width: ${diameter}px;
      height: ${diameter}px;
      left: ${e.clientX - btn.offsetLeft - radius}px;
      top: ${e.clientY - btn.offsetTop - radius}px;
      background: rgba(255, 255, 255, 0.6);
      border-radius: 50%;
      transform: scale(0);
      animation: ripple 0.6s linear;
      pointer-events: none;
    `;
    
    // Удаляем предыдущий риппл
    const oldRipple = btn.querySelector('.ripple');
    if (oldRipple) oldRipple.remove();
    
    circle.className = 'ripple';
    btn.appendChild(circle);

    // Запускаем анимацию выхода
    setIsExiting(true);

    // Переходим на новую страницу
    setTimeout(() => navigate(route), 1000);
  };

  // Кнопки меню - ТОЛЬКО 2 КНОПКИ
  const buttons = [
    { to: '/polls', label: 'Опросы' },
    { to: '/employee', label: 'Сотрудники' }
  ];

  // ===== РЕНДЕРИНГ =====

  // CSS анимации
  const animations = (
    <style>
      {`
        @keyframes piRotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes piFloatAround {
          0% { 
            transform: translate(20px, 20px); 
          }
          25% { 
            transform: translate(calc(100vw - 60px), 30px); 
          }
          50% { 
            transform: translate(calc(100vw - 50px), calc(100vh - 70px)); 
          }
          75% { 
            transform: translate(30px, calc(100vh - 60px)); 
          }
          100% { 
            transform: translate(20px, 20px); 
          }
        }

        @keyframes ripple {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }

        @keyframes dotPulse1 {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.5); }
        }
        @keyframes dotPulse2 {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.3); }
        }
        @keyframes dotPulse3 {
          0%, 100% { opacity: 0.1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.8); }
        }

        /* Hover эффекты для кнопок */
        .menu-button:hover {
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















































