// WelcomePage.js - ИСПРАВЛЕННАЯ ВЕРСИЯ
// ✅ Логотип управляется через CSS классы
// ✅ Правильные отступы для текста

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import logoImage from './components/logo.png';
import './Styles/logo.css'; // Импортируем стили логотипа

const WelcomePage = () => {
  const navigate = useNavigate();
  
  // Состояния анимаций
  const [textAnimated, setTextAnimated] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [greeting, setGreeting] = useState('');
  
  // Ref для логотипа
  const logoRef = useRef(null);

  // ===== HAPTIC FEEDBACK ФУНКЦИЯ =====
  const triggerHaptic = useCallback((type = 'light') => {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      switch (type) {
        case 'light':
          window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
          break;
        case 'medium':
          window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
          break;
        case 'success':
          window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
          break;
        default:
          window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
      }
    }
  }, []);

  // ===== ВРЕМЯ СУТОК =====
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return 'Доброй ночи';
    if (hour < 12) return 'Доброе утро';
    if (hour < 18) return 'Добрый день';
    return 'Добрый вечер';
  };

  // ===== НАВИГАЦИЯ =====
  const handleNavigation = useCallback(() => {
    if (isExiting) return;
    
    triggerHaptic('success');
    setIsExiting(true);
    
    // Анимируем выход логотипа через CSS класс
    if (logoRef.current) {
      logoRef.current.classList.remove('animate-logo');
      logoRef.current.classList.add('animate-logo-exit');
    }
  }, [isExiting, triggerHaptic]);

  // ===== ИНИЦИАЛИЗАЦИЯ И АНИМАЦИЯ =====
  useEffect(() => {
    setGreeting(getTimeBasedGreeting());
    
    // Запускаем анимации последовательно
    const timer1 = setTimeout(() => {
      if (logoRef.current) {
        logoRef.current.classList.add('animate-logo');
      }
      triggerHaptic('light');
    }, 100);
    
    const timer2 = setTimeout(() => {
      setTextAnimated(true);
    }, 600);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [triggerHaptic]);

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
    fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, sans-serif',
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
    userSelect: 'none'
  };

  // Изображение логотипа
  const logoImageStyle = {
    width: '100%',
    height: '100%',
    objectFit: 'contain'
  };

  // Контейнер для текста с правильным отступом от логотипа
  const textContainerStyle = {
    position: 'absolute',
    top: textAnimated && !isExiting ? '320px' : '100%', // Изменено с 380px на 320px (80 + 102 + 50 + 88 для отступа)
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
    width: '100%',
    maxWidth: '400px',
    paddingLeft: '20px',
    paddingRight: '20px',
    boxSizing: 'border-box',
    opacity: textAnimated && !isExiting ? 1 : 0,
    transition: 'all 0.8s ease-out 0.2s'
  };

  // Стиль приветствия
  const greetingStyle = {
    fontSize: '32px',
    fontWeight: '700', // Segoe UI Bold
    fontFamily: '"Segoe UI", sans-serif',
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    lineHeight: '1.3',
    textShadow: '0 2px 10px rgba(0, 0, 0, 0.5), 0 1px 3px rgba(0, 0, 0, 0.3)',
    letterSpacing: '0.5px'
  };

  // Стиль инструкции
  const instructionStyle = {
    fontSize: '18px',
    fontWeight: '400', // Segoe UI Regular
    fontFamily: '"Segoe UI", sans-serif',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: '1.5',
    textShadow: '0 1px 5px rgba(0, 0, 0, 0.4)'
  };

  return (
    <div 
      style={mainContainerStyle}
      onClick={handleNavigation}
    >
      {/* Логотип - управляется через CSS классы */}
      <div ref={logoRef} className="logo-wrapper">
        <img
          src={logoImage}
          alt="Логотип РГС Жизнь"
          className="logo-image"
          style={logoImageStyle}
        />
      </div>

      {/* Текст поднимается снизу */}
      <div style={textContainerStyle}>
        <div style={greetingStyle}>
          {greeting}!
        </div>
        <div style={instructionStyle}>
          Подождите немного<br />
          или нажмите для продолжения
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;














































