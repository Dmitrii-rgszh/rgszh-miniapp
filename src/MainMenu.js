// MainMenu.js - БЕЗ МАГНИТНЫХ КНОПОК
// Обычные кнопки с корпоративными стилями

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logoImage from './components/logo.png';

export default function MainMenu() {
  const navigate = useNavigate();
  
  // Состояния анимаций
  const [logoAnimated, setLogoAnimated] = useState(false);
  const [buttonsAnimated, setButtonsAnimated] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

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
    width: '128px',
    height: '128px',
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

  // Изображение логотипа
  const logoImageStyle = {
    width: '96px',
    height: '96px',
    objectFit: 'contain'
  };

  // Контейнер кнопок
  const buttonContainerStyle = {
    position: 'absolute',
    top: buttonsAnimated ? '268px' : '368px',
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

  // Стиль для обычных кнопок
  const getButtonStyle = (index, animated) => ({
    minWidth: '280px',
    background: 'linear-gradient(135deg, rgba(180, 0, 55, 0.9) 0%, rgba(153, 0, 55, 0.85) 50%, rgba(0, 40, 130, 0.9) 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    padding: '18px 36px',
    cursor: 'pointer',
    transform: animated && !isExiting ? 'translateY(0)' : isExiting ? 'translateY(100px)' : 'translateY(50px)',
    opacity: animated && !isExiting ? 1 : 0,
    transition: `all 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) ${0.1 + index * 0.15}s`,
    zIndex: 2,
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
    fontSize: '20px',
    fontWeight: '600',
    fontFamily: '"Segoe UI", sans-serif',
    boxSizing: 'border-box',
    outline: 'none',
    textDecoration: 'none'
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
  const handleClick = (path) => {
    if (isExiting) return;
    
    setIsExiting(true);
    
    setTimeout(() => {
      navigate(path);
    }, 800);
  };

  // Hover эффект для кнопок (JavaScript реализация)
  const handleMouseEnter = (e) => {
    e.target.style.transform = e.target.style.transform.replace('translateY(0)', 'translateY(-2px)');
    e.target.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.3)';
  };

  const handleMouseLeave = (e) => {
    if (!isExiting) {
      e.target.style.transform = e.target.style.transform.replace('translateY(-2px)', 'translateY(0)');
      e.target.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
    }
  };

  return (
    <div style={mainContainerStyle}>
      {/* Логотип */}
      <div style={logoStyle}>
        <img
          src={logoImage}
          alt="Логотип РГС Жизнь"
          style={logoImageStyle}
        />
      </div>

      {/* Обычные кнопки меню */}
      <div style={buttonContainerStyle}>
        {buttons.map((btn, index) => (
          <button
            key={btn.to}
            style={getButtonStyle(index, buttonsAnimated)}
            onClick={() => handleClick(btn.to)}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
}















































