// WelcomePage.js - ULTRA-MODERN REDESIGN 2024-2025
// Гласморфизм + Aurora градиенты + Параллакс + Rotating Backgrounds
// 
// 🎛️ НАСТРОЙКИ:
// - Смена фонов: каждые 12 секунд (строка 177: `12000`)
// - Aurora скорость: каждые 100мс (строка 164: `100`)
// - Тайминг анимаций: 3s показ + 1s переход (строки 148-149)
//
// 📁 ДЛЯ РАЗНЫХ ФОНОВ:
// 1. Создай в папке src/components/ файлы:
//    - background1.png (первый фон)
//    - background2.png (второй фон) 
//    - background3.png (третий фон)
// 2. Раскомментируй строки импорта выше
// 3. Обнови массив backgrounds

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';
import { motion, AnimatePresence } from 'framer-motion';
import logoImage from './components/logo.png';

const WelcomePage = () => {
  const navigate = useNavigate();
  
  // Рефы для анимаций
  const logoRef = useRef(null);
  const textRef = useRef(null);
  const containerRef = useRef(null);

  // Основные состояния
  const [logoAnimated, setLogoAnimated] = useState(false);
  const [textAnimated, setTextAnimated] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [greeting, setGreeting] = useState('');
  
  // НОВЫЕ состояния для современного дизайна
  const [currentBgIndex, setCurrentBgIndex] = useState(0);
  const [auroraOffset, setAuroraOffset] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isLoaded, setIsLoaded] = useState(false);

  // Массив фонов - ВРЕМЕННО используем один файл (до создания остальных)
  // Замени на: [backgroundImage1, backgroundImage2, backgroundImage3] когда создашь файлы
  const backgrounds = [
    backgroundImage,
    backgroundImage,
    backgroundImage
  ];

  // ===== СОВРЕМЕННЫЕ СТИЛИ =====

  // Главный контейнер с улучшенной адаптивностью
  const containerStyle = {
    position: 'relative',
    width: '100%',
    height: '100vh',
    minHeight: '100vh',
    overflow: 'hidden',
    fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, system-ui, "Helvetica Neue", Helvetica, Arial, sans-serif',
    background: '#0a0a0a', // fallback
    
    // Поддержка мобильных браузеров
    '@supports (-webkit-touch-callout: none)': {
      height: '-webkit-fill-available',
      minHeight: '-webkit-fill-available'
    }
  };

  // Animated Background с crossfade
  const backgroundStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    zIndex: 0
  };

  // Aurora градиент - ГЛАВНЫЙ ТРЕНД 2024-2025
  const auroraOverlayStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: `
      radial-gradient(circle at ${20 + auroraOffset}% ${30 + auroraOffset * 0.5}%, 
        rgba(139, 69, 19, 0.4) 0%,     /* Mocha Mousse */
        rgba(255, 20, 147, 0.3) 25%,   /* Deep Pink */ 
        rgba(75, 0, 130, 0.4) 50%,     /* Indigo */
        rgba(0, 191, 255, 0.3) 75%,    /* Deep Sky Blue */
        transparent 100%),
      radial-gradient(circle at ${80 - auroraOffset}% ${70 - auroraOffset * 0.3}%, 
        rgba(50, 205, 50, 0.3) 0%,     /* Lime Green */
        rgba(255, 215, 0, 0.4) 30%,    /* Gold */
        rgba(148, 0, 211, 0.3) 60%,    /* Dark Violet */
        transparent 100%),
      linear-gradient(135deg, 
        rgba(139, 69, 19, 0.6) 0%,     /* Mocha Mousse overlay */
        rgba(30, 30, 60, 0.7) 50%, 
        rgba(139, 69, 19, 0.5) 100%)
    `,
    mixBlendMode: 'overlay',
    animation: 'auroraShift 12s ease-in-out infinite alternate',
    zIndex: 1
  };

  // Гласморфизм контейнер - УЛУЧШЕННАЯ ВЕРСИЯ
  const glassContainerStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: `translate(-50%, -50%) perspective(1000px) rotateX(${mousePosition.y * 0.01}deg) rotateY(${mousePosition.x * 0.01}deg)`,
    width: '90%',
    maxWidth: '400px',
    background: 'rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '24px',
    boxShadow: `
      0 8px 32px rgba(0, 0, 0, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.4),
      0 0 60px rgba(139, 69, 19, 0.3)
    `,
    padding: '40px 30px',
    textAlign: 'center',
    zIndex: 10,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
  };

  // Логотип с hover эффектами
  const logoContainerStyle = {
    position: 'relative',
    width: '120px',
    height: '120px',
    margin: '0 auto 30px',
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    borderRadius: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
    transition: 'all 0.3s ease',
    cursor: 'pointer'
  };

  // Текст с кинетической типографикой
  const titleStyle = {
    fontSize: 'clamp(2rem, 5vw, 3rem)',
    fontFamily: '"Segoe UI", sans-serif',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 50%, #ffffff 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    letterSpacing: '0.02em',
    lineHeight: '1.2',
    margin: 0,
    textShadow: '0 2px 20px rgba(255, 255, 255, 0.1)',
    animation: 'textShimmer 3s ease-in-out infinite alternate'
  };

  // Floating particles - УЛУЧШЕННЫЕ
  const particleStyle = (index) => ({
    position: 'absolute',
    width: `${Math.random() * 8 + 4}px`,
    height: `${Math.random() * 8 + 4}px`,
    background: `radial-gradient(circle, 
      rgba(255, 255, 255, ${Math.random() * 0.6 + 0.2}) 0%, 
      rgba(139, 69, 19, ${Math.random() * 0.4 + 0.1}) 50%, 
      transparent 100%)`,
    borderRadius: '50%',
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    animation: `float${(index % 3) + 1} ${Math.random() * 20 + 30}s linear infinite`,
    zIndex: 2,
    pointerEvents: 'none'
  });

  // ===== ЭФФЕКТЫ И ЛОГИКА =====

  // Инициализация и анимации
  useEffect(() => {
    setIsLoaded(true);
    
    // Определяем приветствие
    const hour = new Date().getHours();
    let text = '';
    if (hour >= 6 && hour < 11) text = 'Доброе утро';
    else if (hour >= 11 && hour < 17) text = 'Добрый день';
    else if (hour >= 17 && hour < 24) text = 'Добрый вечер';
    else text = 'Доброй ночи';
    setGreeting(text);

    // Запускаем анимации
    const logoTimer = setTimeout(() => setLogoAnimated(true), 300);
    const textTimer = setTimeout(() => setTextAnimated(true), 800);
    
    // Auto-exit
    const exitTimer = setTimeout(() => setIsExiting(true), 3000);
    const navTimer = setTimeout(() => navigate('/main-menu'), 4000);

    return () => {
      clearTimeout(logoTimer);
      clearTimeout(textTimer);
      clearTimeout(exitTimer);
      clearTimeout(navTimer);
    };
  }, [navigate]);

  // Aurora animation
  useEffect(() => {
    const auroraInterval = setInterval(() => {
      setAuroraOffset(prev => (prev + 1) % 100);
    }, 100);

    return () => clearInterval(auroraInterval);
  }, []);

  // Background rotation - ОТКЛЮЧЕНО пока все фоны одинаковые
  // Раскомментируй когда добавишь разные фоны
  /*
  useEffect(() => {
    const bgInterval = setInterval(() => {
      setCurrentBgIndex(prev => (prev + 1) % backgrounds.length);
    }, 12000); // меняем каждые 12 секунд

    return () => clearInterval(bgInterval);
  }, []);
  */

  // Mouse tracking для параллакса
  useEffect(() => {
    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      
      setMousePosition({
        x: (clientX - innerWidth / 2) / innerWidth,
        y: (clientY - innerHeight / 2) / innerHeight
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Swipe handlers
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => !isExiting && navigate('/main-menu'),
    onSwipedRight: () => !isExiting && navigate('/main-menu'),
    onTap: () => !isExiting && navigate('/main-menu')
  });

  // ===== АНИМАЦИИ FRAMER MOTION =====

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        duration: 0.8, 
        ease: [0.6, 0.01, -0.05, 0.95] 
      }
    },
    exit: { 
      opacity: 0, 
      scale: 1.1, 
      y: -50,
      transition: { 
        duration: 0.6,
        ease: [0.6, 0.01, -0.05, 0.95] 
      }
    }
  };

  const logoVariants = {
    hidden: { y: -100, opacity: 0, rotateY: -90 },
    visible: { 
      y: 0, 
      opacity: 1, 
      rotateY: 0,
      transition: { 
        type: 'spring',
        stiffness: 200,
        damping: 20,
        delay: 0.2
      }
    }
  };

  const textVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { 
        type: 'spring',
        stiffness: 150,
        damping: 25,
        delay: 0.5
      }
    }
  };

  // ===== РЕНДЕРИНГ =====

  return (
    <>
      {/* CSS анимации */}
      <style>
        {`
          @keyframes auroraShift {
            0% { filter: hue-rotate(0deg) brightness(1) saturate(1); }
            50% { filter: hue-rotate(90deg) brightness(1.2) saturate(1.5); }
            100% { filter: hue-rotate(180deg) brightness(0.9) saturate(1.2); }
          }

          @keyframes textShimmer {
            0% { background-position: -200px 0; }
            100% { background-position: 200px 0; }
          }

          @keyframes float1 {
            0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.4; }
            25% { transform: translateY(-20px) rotate(90deg); opacity: 0.8; }
            50% { transform: translateY(-40px) rotate(180deg); opacity: 0.6; }
            75% { transform: translateY(-20px) rotate(270deg); opacity: 0.9; }
          }

          @keyframes float2 {
            0%, 100% { transform: translateX(0) rotate(0deg); opacity: 0.3; }
            33% { transform: translateX(30px) rotate(120deg); opacity: 0.7; }
            66% { transform: translateX(-30px) rotate(240deg); opacity: 0.5; }
          }

          @keyframes float3 {
            0%, 100% { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 0.5; }
            25% { transform: translate(20px, -30px) rotate(90deg) scale(1.2); opacity: 0.8; }
            50% { transform: translate(-20px, -60px) rotate(180deg) scale(0.8); opacity: 0.6; }
            75% { transform: translate(-40px, -30px) rotate(270deg) scale(1.1); opacity: 0.7; }
          }

          .glass-logo:hover {
            transform: scale(1.05) rotateY(10deg);
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
          }
        `}
      </style>

      <motion.div
        ref={containerRef}
        style={containerStyle}
        variants={containerVariants}
        initial="hidden"
        animate={isLoaded ? "visible" : "hidden"}
        exit="exit"
        {...swipeHandlers}
      >
        {/* Animated Backgrounds с crossfade */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentBgIndex}
            style={{
              ...backgroundStyle,
              backgroundImage: `url(${backgrounds[currentBgIndex]})`
            }}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 2, ease: "easeInOut" }}
          />
        </AnimatePresence>

        {/* Aurora градиент overlay */}
        <div style={auroraOverlayStyle} />

        {/* Floating particles */}
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} style={particleStyle(i)} />
        ))}

        {/* Главный гласморфизм контейнер */}
        <AnimatePresence>
          {!isExiting && (
            <motion.div
              style={glassContainerStyle}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {/* Логотип с анимацией */}
              <motion.div
                ref={logoRef}
                style={logoContainerStyle}
                variants={logoVariants}
                className="glass-logo"
                whileHover={{ 
                  scale: 1.05, 
                  rotateY: 10,
                  transition: { duration: 0.3 }
                }}
                whileTap={{ scale: 0.95 }}
              >
                <img
                  src={logoImage}
                  alt="Логотип РГС Жизнь"
                  style={{
                    width: '80px',
                    height: '80px',
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
                  }}
                />
              </motion.div>

              {/* Приветственный текст */}
              <motion.div
                ref={textRef}
                variants={textVariants}
              >
                <h1 style={titleStyle}>
                  {greeting}
                </h1>
                <p style={{
                  fontSize: '0.9rem',
                  fontFamily: '"Segoe UI", sans-serif',
                  fontWeight: 'normal',
                  color: 'rgba(255, 255, 255, 0.8)',
                  margin: '15px 0 0',
                  letterSpacing: '0.5px'
                }}>
                  Добро пожаловать в будущее
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Background indicator - СКРЫТО пока все фоны одинаковые */}
        {/* Раскомментируй когда добавишь разные фоны
        <div style={{
          position: 'absolute',
          bottom: '30px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '8px',
          zIndex: 15
        }}>
          {backgrounds.map((_, index) => (
            <div
              key={index}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: index === currentBgIndex 
                  ? 'rgba(255, 255, 255, 0.9)' 
                  : 'rgba(255, 255, 255, 0.4)',
                border: index === currentBgIndex 
                  ? '2px solid rgba(139, 69, 19, 0.8)' 
                  : '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: index === currentBgIndex 
                  ? '0 0 10px rgba(139, 69, 19, 0.5)' 
                  : 'none',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onClick={() => setCurrentBgIndex(index)}
            />
          ))}
        </div>
        */}
        <motion.div
          style={{
            position: 'absolute',
            top: '20%',
            right: '10%',
            zIndex: 3,
            opacity: 0.6
          }}
          animate={{
            x: mousePosition.x * 50,
            y: mousePosition.y * 30,
            rotate: auroraOffset * 2
          }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        >
  
        </motion.div>
      </motion.div>
    </>
  );
};

export default WelcomePage;














































