// WelcomePage.js - ВЕРСИЯ С ПОЛНЫМИ ИНЛАЙН СТИЛЯМИ

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';

import backgroundImage from './components/background.png';
import logoImage from './components/logo.png';
import piImage from './components/pi.png';

const WelcomePage = () => {
  const navigate = useNavigate();

  // Рефы на логотип и текст для управления анимациями
  const logoRef = useRef(null);
  const textRef = useRef(null);

  // Состояния
  const [logoAnimated, setLogoAnimated] = useState(false);
  const [textAnimated, setTextAnimated] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [moveDuration] = useState('70s');
  const [rotateDuration] = useState('6s');

  // ===== СТИЛИ =====

  // Основной контейнер
  const welcomeContainerStyle = {
    position: 'relative',
    width: '100%',
    height: '100vh',
    backgroundImage: `url(${backgroundImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  };

  // Оверлей с градиентом
  const overlayStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, rgba(147, 39, 143, 0.85) 0%, rgba(71, 125, 191, 0.85) 100%)',
    zIndex: 1
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

  // Текст приветствия
  const textWrapperStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: textAnimated && !isExiting 
      ? 'translate(-50%, -50%)' 
      : isExiting 
        ? 'translate(-50%, calc(-50% + 100px))' 
        : 'translate(-50%, calc(-50% - 100px))',
    opacity: textAnimated && !isExiting ? 1 : 0,
    zIndex: 3,
    textAlign: 'center',
    transition: 'all 0.8s ease-out'
  };

  const welcomeTitleStyle = {
    fontSize: '48px',
    fontWeight: 'bold',
    color: 'white',
    margin: '0',
    textShadow: '2px 2px 8px rgba(0, 0, 0, 0.5)',
    letterSpacing: '2px'
  };

  // Точки фона
  const dotStyle = (index) => ({
    position: 'absolute',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.2)',
    zIndex: 1,
    ...(index === 1 && { top: '10%', left: '10%' }),
    ...(index === 2 && { top: '20%', right: '15%' }),
    ...(index === 3 && { top: '30%', left: '25%' }),
    ...(index === 4 && { bottom: '15%', left: '15%' }),
    ...(index === 5 && { top: '5%', right: '20%' }),
    ...(index === 6 && { bottom: '25%', right: '10%' }),
    ...(index === 7 && { top: '45%', left: '5%' }),
    ...(index === 8 && { bottom: '5%', right: '30%' }),
    ...(index === 9 && { top: '60%', right: '25%' }),
    ...(index === 10 && { bottom: '40%', left: '30%' })
  });

  // Pi элемент с анимацией полета
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
    // Определяем приветствие по времени суток
    const hour = new Date().getHours();
    let text = '';
    if (hour >= 6 && hour < 11) text = 'Доброе утро';
    else if (hour >= 11 && hour < 17) text = 'Добрый день';
    else if (hour >= 17 && hour < 24) text = 'Добрый вечер';
    else text = 'Доброй ночи';
    setGreeting(text);

    // Запускаем анимации появления
    const logoTimer = setTimeout(() => setLogoAnimated(true), 100);
    const textTimer = setTimeout(() => setTextAnimated(true), 600);

    // Запускаем анимации исчезновения через 2 секунды
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, 2000);

    // Переходим на главную страницу через 2.8 секунды
    const navTimer = setTimeout(() => {
      navigate('/main-menu');
    }, 2800);

    return () => {
      clearTimeout(logoTimer);
      clearTimeout(textTimer);
      clearTimeout(exitTimer);
      clearTimeout(navTimer);
    };
  }, [navigate]);

  // Свайп-обработчик
  const swipeHandlers = useSwipeable({ 
    preventDefault: true,
    onSwipedLeft: () => navigate('/main-menu'),
    onSwipedRight: () => navigate('/main-menu'),
    onTap: () => navigate('/main-menu')
  });

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
            left: 10%; 
            top: 10%; 
            transform: scale(1); 
          }
          12.5% { 
            left: 80%; 
            top: 15%; 
            transform: scale(1.2); 
          }
          25% { 
            left: 85%; 
            top: 40%; 
            transform: scale(0.8); 
          }
          37.5% { 
            left: 70%; 
            top: 70%; 
            transform: scale(1.1); 
          }
          50% { 
            left: 40%; 
            top: 80%; 
            transform: scale(0.9); 
          }
          62.5% { 
            left: 15%; 
            top: 75%; 
            transform: scale(1.3); 
          }
          75% { 
            left: 5%; 
            top: 50%; 
            transform: scale(0.7); 
          }
          87.5% { 
            left: 20%; 
            top: 25%; 
            transform: scale(1.1); 
          }
          100% { 
            left: 10%; 
            top: 10%; 
            transform: scale(1); 
          }
        }

        /* Дополнительные анимации для точек */
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
      `}
    </style>
  );

  return (
    <div
      style={welcomeContainerStyle}
      {...swipeHandlers}
    >
      {animations}

      {/* Фоновые точки с дополнительными анимациями */}
      {[1,2,3,4,5,6,7,8,9,10].map(n => (
        <div 
          key={n} 
          style={{
            ...dotStyle(n),
            animation: `dotPulse${(n % 3) + 1} ${4 + (n % 3)}s ease-in-out infinite`
          }} 
        />
      ))}

      {/* Pi элемент с космической анимацией */}
      <div style={piWrapperStyle}>
        <img src={piImage} style={piImageStyle} alt="Pi" />
      </div>

      {/* Оверлей */}
      <div style={overlayStyle} />

      {/* Логотип */}
      <div ref={logoRef} style={logoStyle}>
        <img
          src={logoImage}
          alt="Логотип РГС Жизнь"
          style={logoImageStyle}
        />
      </div>

      {/* Приветственный текст */}
      <div ref={textRef} style={textWrapperStyle}>
        <h1 style={welcomeTitleStyle}>{greeting}</h1>
      </div>
    </div>
  );
};

export default WelcomePage;














































