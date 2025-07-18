// WelcomePage.js - СОВРЕМЕННЫЕ UI/UX ЭФФЕКТЫ 2024-2025
// ✨ Гласморфизм + Анимированные градиенты + 3D трансформы + Touch-friendly + Haptic feedback

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';

import logoImage from './components/logo.png';

const WelcomePage = () => {
  const navigate = useNavigate();
  
  // Рефы для анимаций и эффектов
  const logoRef = useRef(null);
  const textRef = useRef(null);
  const containerRef = useRef(null);
  const meshRef = useRef(null);

  // Состояния
  const [greeting, setGreeting] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [gradientPhase, setGradientPhase] = useState(0);

  // ===== HAPTIC FEEDBACK ФУНКЦИЯ =====
  const triggerHaptic = useCallback((type = 'light') => {
    // Для Telegram WebApp
    if (window.Telegram?.WebApp?.HapticFeedback) {
      switch (type) {
        case 'light':
          window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
          break;
        case 'medium':
          window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
          break;
        case 'heavy':
          window.Telegram.WebApp.HapticFeedback.impactOccurred('heavy');
          break;
        case 'success':
          window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
          break;
        case 'error':
          window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
          break;
        default:
          window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
      }
    }
    // Fallback для браузеров с поддержкой Vibration API
    else if (navigator.vibrate) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30],
        success: [10, 50, 10],
        error: [20, 20, 20]
      };
      navigator.vibrate(patterns[type] || patterns.light);
    }
  }, []);

  // ===== АНИМИРОВАННЫЙ MESH ГРАДИЕНТ =====
  const createAnimatedMeshGradient = () => {
    return `
      radial-gradient(ellipse at ${20 + Math.sin(gradientPhase) * 10}% ${30 + Math.cos(gradientPhase * 1.2) * 10}%, 
        rgba(180, 0, 55, 0.8) 0%, transparent 60%),
      radial-gradient(ellipse at ${80 + Math.sin(gradientPhase * 1.5) * 8}% ${70 + Math.cos(gradientPhase * 0.8) * 12}%, 
        rgba(152, 164, 174, 0.6) 0%, transparent 50%),
      radial-gradient(ellipse at ${50 + Math.sin(gradientPhase * 0.7) * 15}% ${20 + Math.cos(gradientPhase * 1.8) * 8}%, 
        rgba(0, 40, 130, 0.7) 0%, transparent 70%),
      radial-gradient(ellipse at ${30 + Math.sin(gradientPhase * 2) * 5}% ${80 + Math.cos(gradientPhase) * 10}%, 
        rgba(153, 0, 55, 0.5) 0%, transparent 40%)
    `;
  };

  // ===== ВРЕМЯ СУТОК =====
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return 'Доброй ночи';
    if (hour < 12) return 'Доброе утро';
    if (hour < 18) return 'Добрый день';
    return 'Добрый вечер';
  };

  // ===== SWIPE ОБРАБОТЧИКИ =====
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      triggerHaptic('medium');
      handleNavigation();
    },
    onSwipedUp: () => {
      triggerHaptic('medium');
      handleNavigation();
    },
    trackMouse: true,
    trackTouch: true,
    delta: 60, // Увеличена чувствительность для touch-friendly
    preventScrollOnSwipe: true,
    touchEventOptions: { passive: false }
  });

  // ===== ОБРАБОТКА МЫШИ ДЛЯ 3D ЭФФЕКТОВ =====
  const handleMouseMove = useCallback((e) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    setMousePos({ x, y });

    // 3D трансформация логотипа
    if (logoRef.current) {
      const rotateX = (y - 0.5) * 10;
      const rotateY = (x - 0.5) * -10;
      const translateZ = isHovered ? 20 : 0;
      
      logoRef.current.style.transform = `
        translateX(-50%) 
        perspective(1000px) 
        rotateX(${rotateX}deg) 
        rotateY(${rotateY}deg) 
        translateZ(${translateZ}px)
        scale(${isHovered ? 1.05 : 1})
      `;
    }
  }, [isHovered]);

  // ===== НАВИГАЦИЯ С АНИМАЦИЕЙ =====
  const handleNavigation = useCallback(() => {
    if (isExiting) return;
    
    triggerHaptic('success');
    setIsExiting(true);
    
    // Push/Pop эффект при переходе
    if (containerRef.current) {
      containerRef.current.style.transform = 'scale(0.95) translateY(20px)';
      containerRef.current.style.opacity = '0';
    }
    
    setTimeout(() => {
      navigate('/main-menu');
    }, 300);
  }, [isExiting, navigate, triggerHaptic]);

  // ===== ИНИЦИАЛИЗАЦИЯ =====
  useEffect(() => {
    setGreeting(getTimeBasedGreeting());
    
    // Стартовая анимация с задержкой
    const timer = setTimeout(() => {
      setIsLoaded(true);
      triggerHaptic('light');
    }, 100);

    return () => clearTimeout(timer);
  }, [triggerHaptic]);

  // ===== АНИМАЦИЯ ГРАДИЕНТА =====
  useEffect(() => {
    const interval = setInterval(() => {
      setGradientPhase(prev => prev + 0.02);
    }, 50);

    return () => clearInterval(interval);
  }, []);

  // ===== СТИЛИ =====

  // Главный контейнер с анимированным mesh градиентом
  const containerStyle = {
    position: 'relative',
    width: '100%',
    height: window.innerHeight + 'px',
    minHeight: '100vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    
    // Анимированный mesh градиент поверх глобального фона
    background: createAnimatedMeshGradient(),
    backgroundSize: '200% 200%',
    
    // Touch-friendly зона (вся страница кликабельная)
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
    userSelect: 'none'
  };

  // Гласморфизм контейнер с улучшенными эффектами
  const glassContainerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '50px 40px', // Увеличенные touch-friendly отступы
    minHeight: '200px',
    maxWidth: '400px',
    width: '90%',
    
    // Продвинутый гласморфизм
    background: 'rgba(255, 255, 255, 0.12)',
    backdropFilter: 'blur(25px) saturate(180%)',
    WebkitBackdropFilter: 'blur(25px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.25)',
    borderRadius: '28px',
    
    // Layered тени для глубины
    boxShadow: `
      0 8px 32px rgba(0, 0, 0, 0.3),
      0 2px 8px rgba(0, 0, 0, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.3),
      inset 0 -1px 0 rgba(255, 255, 255, 0.1)
    `,
    
    // 3D трансформации
    transform: isLoaded ? 'translateY(0) scale(1)' : 'translateY(50px) scale(0.95)',
    opacity: isLoaded ? 1 : 0,
    transition: 'all 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    
    // Hover эффекты
    '&:hover': {
      transform: 'translateY(-5px) scale(1.02)',
      boxShadow: `
        0 15px 45px rgba(0, 0, 0, 0.4),
        0 5px 15px rgba(0, 0, 0, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.4)
      `
    }
  };

  // Логотип с 3D эффектами
  const logoContainerStyle = {
    position: 'relative',
    width: '120px', // Увеличено для touch-friendly
    height: '120px',
    marginBottom: '30px',
    
    // 3D контекст
    transformStyle: 'preserve-3d',
    transition: 'all 0.3s ease-out',
    
    // Дополнительный гласморфизм для логотипа
    background: 'rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(10px)',
    borderRadius: '24px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    
    // Тень для логотипа
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
  };

  const logoImageStyle = {
    width: '80px',
    height: '80px',
    objectFit: 'contain',
    filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3))',
    transition: 'all 0.3s ease'
  };

  // Текст с типографическими эффектами
  const greetingStyle = {
    fontSize: '28px', // Увеличено для мобильных
    fontWeight: '700', // Segoe UI Bold
    fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif',
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    lineHeight: '1.3',
    marginBottom: '15px',
    
    // Текстовые эффекты
    textShadow: '0 2px 10px rgba(0, 0, 0, 0.5), 0 1px 3px rgba(0, 0, 0, 0.3)',
    letterSpacing: '0.5px',
    
    // Анимация появления
    transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
    opacity: isLoaded ? 1 : 0,
    transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.2s'
  };

  const instructionStyle = {
    fontSize: '18px', // Увеличено для мобильных
    fontWeight: '400', // Segoe UI Regular
    fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: '1.5',
    
    textShadow: '0 1px 5px rgba(0, 0, 0, 0.4)',
    
    // Анимация появления
    transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
    opacity: isLoaded ? 1 : 0,
    transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.4s'
  };

  // Floating элементы для декора
  const floatingElementStyle = (delay) => ({
    position: 'absolute',
    width: '6px',
    height: '6px',
    background: 'rgba(255, 255, 255, 0.4)',
    borderRadius: '50%',
    animation: `float 3s ease-in-out infinite ${delay}s`,
    pointerEvents: 'none'
  });

  // ===== CSS-IN-JS АНИМАЦИИ =====
  const animationStyles = `
    @keyframes float {
      0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.4; }
      50% { transform: translateY(-20px) rotate(180deg); opacity: 0.8; }
    }
    
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
    
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
  `;

  // Добавляем анимации в DOM
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = animationStyles;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      style={containerStyle} 
      {...swipeHandlers}
      onClick={handleNavigation}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Floating декоративные элементы */}
      <div style={{...floatingElementStyle(0), top: '20%', left: '15%'}} />
      <div style={{...floatingElementStyle(0.5), top: '30%', right: '20%'}} />
      <div style={{...floatingElementStyle(1), bottom: '25%', left: '25%'}} />
      <div style={{...floatingElementStyle(1.5), bottom: '15%', right: '15%'}} />
      
      {/* Главный гласморфизм контейнер */}
      <div style={glassContainerStyle}>
        {/* Логотип с 3D эффектами */}
        <div 
          ref={logoRef}
          style={logoContainerStyle}
        >
          <img
            src={logoImage}
            alt="Логотип РГС Жизнь"
            style={logoImageStyle}
          />
        </div>

        {/* Приветствие */}
        <div ref={textRef} style={greetingStyle}>
          {greeting}!
        </div>

        {/* Инструкция */}
        <div style={instructionStyle}>
          Нажмите в любом месте экрана<br />
          или проведите пальцем вверх
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;














































