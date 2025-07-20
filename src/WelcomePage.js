// WelcomePage.js - УПРОЩЕННАЯ ВЕРСИЯ С АНИМАЦИЕЙ КАК В MainMenu
// ✅ Логотип спускается сверху
// ✅ Текст поднимается снизу
// ✅ Без гласморфизм контейнера

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import logoImage from './components/logo.png';

const WelcomePage = () => {
  const navigate = useNavigate();
  
  // Состояния анимаций
  const [logoAnimated, setLogoAnimated] = useState(false);
  const [textAnimated, setTextAnimated] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [greeting, setGreeting] = useState('');

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
    
    // Анимация выхода происходит автоматически через MainApp
  }, [isExiting, triggerHaptic]);

  // ===== ИНИЦИАЛИЗАЦИЯ И АНИМАЦИЯ =====
  useEffect(() => {
    setGreeting(getTimeBasedGreeting());
    
    // Запускаем анимации последовательно
    const timer1 = setTimeout(() => {
      setLogoAnimated(true);
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

  // Логотип с анимацией (как в MainMenu)
  const logoStyle = {
    position: 'absolute',
    top: logoAnimated && !isExiting ? '200px' : '-200px',
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

  // Контейнер для текста
  const textContainerStyle = {
    position: 'absolute',
    top: textAnimated && !isExiting ? '380px' : '100%',
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
      {/* Логотип спускается сверху */}
      <div style={logoStyle}>
        <img
          src={logoImage}
          alt="Логотип РГС Жизнь"
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














































