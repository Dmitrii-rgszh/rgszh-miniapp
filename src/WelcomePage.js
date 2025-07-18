// WelcomePage.js - В СТИЛЕ MAINMENU
// Логотип как в MainMenu, текст как кнопки (простой белый)

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';

import logoImage from './components/logo.png';

const WelcomePage = () => {
  const navigate = useNavigate();
  
  // Рефы для анимаций
  const logoRef = useRef(null);
  const textRef = useRef(null);
  const containerRef = useRef(null);

  // Состояния - КАК В MAINMENU
  const [greeting, setGreeting] = useState('');
  const [logoAnimated, setLogoAnimated] = useState(false);
  const [textAnimated, setTextAnimated] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [autoExitTimer, setAutoExitTimer] = useState(null);

  // ===== СТИЛИ КАК В MAINMENU =====

  // Основной контейнер - КАК В MAINMENU
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

  // Логотип с анимацией - ТОЧНО КАК В MAINMENU (уменьшенный на 20%)
  const logoStyle = {
    position: 'absolute',
    top: logoAnimated && !isExiting ? '110px' : isExiting ? '-200px' : '-200px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '128px',  // уменьшено на 20%
    height: '128px', // уменьшено на 20%
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

  // Изображение логотипа - ТОЧНО КАК В MAINMENU (уменьшенное на 20%)
  const logoImageStyle = {
    width: '96px',   // уменьшено на 20%
    height: '96px',  // уменьшено на 20%
    objectFit: 'contain'
  };

  // Контейнер текста - ПОД ЛОГОТИПОМ КАК КНОПКИ
  // Логотип: 110px (top) + 128px (height) + 50px (отступ) = 288px
  const textContainerStyle = {
    position: 'absolute',
    top: textAnimated ? '288px' : '388px', // под логотипом
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    maxWidth: '400px',
    zIndex: 3,
    paddingLeft: '20px',
    paddingRight: '20px',
    boxSizing: 'border-box',
    opacity: textAnimated ? 1 : 0,
    transition: 'all 0.8s ease-out 0.2s'
  };

  // Заголовок - ПРОСТОЙ БЕЛЫЙ КАК КНОПКИ
  const titleStyle = {
    fontSize: 'clamp(2rem, 6vw, 3.5rem)',
    fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, sans-serif',
    fontWeight: '600',
    color: 'white',
    margin: 0,
    textAlign: 'center',
    textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
    transform: textAnimated && !isExiting ? 'translateY(0)' : isExiting ? 'translateY(50px)' : 'translateY(30px)',
    opacity: textAnimated && !isExiting ? 1 : 0,
    transition: 'all 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.1s'
  };

  // Подзаголовок - ПРОСТОЙ БЕЛЫЙ КАК КНОПКИ
  const subtitleStyle = {
    fontSize: 'clamp(1rem, 3vw, 1.3rem)',
    fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, sans-serif',
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.9)',
    margin: 0,
    textAlign: 'center',
    textShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
    transform: textAnimated && !isExiting ? 'translateY(0)' : isExiting ? 'translateY(50px)' : 'translateY(30px)',
    opacity: textAnimated && !isExiting ? 1 : 0,
    transition: 'all 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.25s'
  };

  // ===== ЛОГИКА КАК В MAINMENU =====

  // Инициализация
  useEffect(() => {
    console.log('WelcomePage: Компонент монтируется');
    
    // Определяем приветствие по времени
    const hour = new Date().getHours();
    let text = '';
    if (hour >= 6 && hour < 11) text = 'Доброе утро';
    else if (hour >= 11 && hour < 17) text = 'Добрый день';
    else if (hour >= 17 && hour < 24) text = 'Добрый вечер';
    else text = 'Доброй ночи';
    
    console.log('WelcomePage: Установлено приветствие:', text);
    setGreeting(text);

    // Анимация входа - КАК В MAINMENU
    const timer1 = setTimeout(() => setLogoAnimated(true), 100);
    const timer2 = setTimeout(() => setTextAnimated(true), 600);
    
    // Автопереход через 4 секунды
    const timer3 = setTimeout(() => {
      console.log('WelcomePage: Автопереход запущен');
      handleNavigation();
    }, 4000);
    
    setAutoExitTimer(timer3);

    return () => {
      console.log('WelcomePage: Очистка таймеров');
      clearTimeout(timer1);
      clearTimeout(timer2);
      if (timer3) clearTimeout(timer3);
    };
  }, []);

  // Swipe handlers
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      console.log('WelcomePage: Swipe left');
      if (!isExiting) handleNavigation();
    },
    onSwipedRight: () => {
      console.log('WelcomePage: Swipe right');
      if (!isExiting) handleNavigation();
    },
    onTap: () => {
      console.log('WelcomePage: Tap');
      if (!isExiting) handleNavigation();
    }
  });

  // Навигация с анимацией - КАК В MAINMENU
  const handleNavigation = () => {
    if (isExiting) {
      console.log('WelcomePage: Навигация уже в процессе');
      return;
    }
    
    console.log('WelcomePage: Начинаем навигацию');
    
    if (autoExitTimer) {
      clearTimeout(autoExitTimer);
      setAutoExitTimer(null);
    }
    
    setIsExiting(true);
    
    setTimeout(() => {
      console.log('WelcomePage: Переход на main-menu');
      navigate('/main-menu');
    }, 800);
  };

  // Обработчик клика
  const handleClick = () => {
    console.log('WelcomePage: Click обработан');
    handleNavigation();
  };

  // Стили анимации - КАК В MAINMENU
  const animations = (
    <style>
      {`
        .clickable-area {
          cursor: pointer;
          user-select: none;
        }

        /* Адаптивность */
        @media (max-width: 768px) {
          .welcome-title {
            font-size: clamp(1.8rem, 6vw, 2.5rem) !important;
          }
          .welcome-subtitle {
            font-size: clamp(0.9rem, 3vw, 1.1rem) !important;
          }
        }

        @media (max-width: 480px) {
          .welcome-title {
            font-size: clamp(1.6rem, 6vw, 2rem) !important;
          }
          .welcome-subtitle {
            font-size: clamp(0.8rem, 3vw, 1rem) !important;
          }
        }
      `}
    </style>
  );

  console.log('WelcomePage: Рендер - logoAnimated:', logoAnimated, 'textAnimated:', textAnimated, 'isExiting:', isExiting, 'greeting:', greeting);

  return (
    <>
      {animations}
      
      <div
        ref={containerRef}
        style={mainContainerStyle}
        {...swipeHandlers}
        onClick={handleClick}
        className="clickable-area"
      >
        {/* Логотип - ТОЧНО КАК В MAINMENU */}
        <div style={logoStyle}>
          <img
            src={logoImage}
            alt="Логотип РГС Жизнь"
            style={logoImageStyle}
          />
        </div>

        {/* Текст - КАК КНОПКИ В MAINMENU */}
        <div style={textContainerStyle}>
          <h1 
            style={titleStyle}
            className="welcome-title"
          >
            {greeting || 'Добро пожаловать'}
          </h1>
          <p 
            style={subtitleStyle}
            className="welcome-subtitle"
          >
            Под крылом сильной компании
          </p>
        </div>
      </div>
    </>
  );
};

export default WelcomePage;














































