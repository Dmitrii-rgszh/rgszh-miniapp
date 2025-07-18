// WelcomePage.js - ИСПРАВЛЕННАЯ ВЕРСИЯ С УМЕНЬШЕННЫМ ЛОГОТИПОМ
// Работает поверх глобального фона из MainApp.js
// Логотип уменьшен на 20%: контейнер 96x96px, изображение 76x76px

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

  // Состояния
  const [greeting, setGreeting] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // ===== СТИЛИ (работают поверх глобального фона) =====

  // Главный контейнер - БЕЗ ФОНА
  const containerStyle = {
    position: 'relative',
    width: '100%',
    height: '100vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: '"Segoe UI", sans-serif',
  };

  // Гласморфизм контейнер
  const glassContainerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 30px',
    background: 'rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '24px',
    boxShadow: `
      0 8px 32px rgba(0, 0, 0, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.4),
      0 0 60px rgba(180, 0, 55, 0.2)
    `,
    maxWidth: '400px',
    width: '90%',
    textAlign: 'center',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
  };

  // Логотип контейнер - УМЕНЬШЕН НА 20%
  const logoContainerStyle = {
    position: 'relative',
    width: '96px',        // было 120px
    height: '96px',       // было 120px
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

  // Заголовок с корпоративными цветами
  const titleStyle = {
    fontSize: 'clamp(2rem, 5vw, 3rem)',
    fontFamily: '"Segoe UI", sans-serif',
    fontWeight: 'bold', // Segoe UI Bold
    background: 'linear-gradient(135deg, #ffffff 0%, rgba(180, 0, 55, 0.8) 50%, #ffffff 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    letterSpacing: '0.02em',
    lineHeight: '1.2',
    margin: 0,
    textShadow: '0 2px 20px rgba(255, 255, 255, 0.1)',
    animation: 'textShimmer 3s ease-in-out infinite alternate'
  };

  // Подзаголовок
  const subtitleStyle = {
    fontSize: '0.9rem',
    fontFamily: '"Segoe UI", sans-serif',
    fontWeight: 'normal', // Segoe UI Regular
    color: 'rgba(255, 255, 255, 0.8)',
    margin: '15px 0 0',
    letterSpacing: '0.5px'
  };

  // ===== ЛОГИКА =====

  // Инициализация
  useEffect(() => {
    setIsLoaded(true);
    
    // Определяем приветствие по времени
    const hour = new Date().getHours();
    let text = '';
    if (hour >= 6 && hour < 11) text = 'Доброе утро';
    else if (hour >= 11 && hour < 17) text = 'Добрый день';
    else if (hour >= 17 && hour < 24) text = 'Добрый вечер';
    else text = 'Доброй ночи';
    setGreeting(text);

    // Автопереход через 3 секунды
    const exitTimer = setTimeout(() => {
      handleNavigation();
    }, 3000);

    return () => clearTimeout(exitTimer);
  }, []);

  // Swipe handlers
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => !isExiting && handleNavigation(),
    onSwipedRight: () => !isExiting && handleNavigation(),
    onTap: () => !isExiting && handleNavigation()
  });

  // Навигация с анимацией
  const handleNavigation = () => {
    if (isExiting) return;
    
    setIsExiting(true);
    setTimeout(() => {
      navigate('/main-menu');
    }, 600);
  };

  // ===== АНИМАЦИИ FRAMER MOTION =====

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        duration: 0.8, 
        ease: [0.6, 0.01, 0.05, 0.95]
      }
    },
    exit: { 
      opacity: 0, 
      scale: 1.1, 
      y: -50,
      transition: { 
        duration: 0.6,
        ease: [0.6, 0.01, 0.05, 0.95]
      }
    }
  };

  const glassVariants = {
    hidden: { y: 50, opacity: 0, scale: 0.8 },
    visible: { 
      y: 0, 
      opacity: 1, 
      scale: 1,
      transition: { 
        duration: 0.8, 
        delay: 0.2,
        ease: [0.6, 0.01, 0.05, 0.95]
      }
    },
    exit: { 
      y: -30, 
      opacity: 0, 
      scale: 0.9,
      transition: { 
        duration: 0.4,
        ease: [0.6, 0.01, 0.05, 0.95]
      }
    }
  };

  const logoVariants = {
    hidden: { scale: 0, rotate: -180 },
    visible: { 
      scale: 1, 
      rotate: 0,
      transition: { 
        duration: 0.6, 
        delay: 0.4,
        ease: [0.34, 1.56, 0.64, 1]
      }
    }
  };

  const textVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { 
        duration: 0.6, 
        delay: 0.6,
        ease: [0.6, 0.01, 0.05, 0.95]
      }
    }
  };

  // Добавляем CSS анимации
  const animationStyles = (
    <style>
      {`
        @keyframes textShimmer {
          0% { 
            background: linear-gradient(135deg, #ffffff 0%, rgba(180, 0, 55, 0.8) 50%, #ffffff 100%); 
          }
          100% { 
            background: linear-gradient(135deg, rgba(180, 0, 55, 0.8) 0%, #ffffff 50%, rgba(180, 0, 55, 0.8) 100%); 
          }
        }
        
        @keyframes logoFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }

        .clickable-area {
          cursor: pointer;
          user-select: none;
        }

        .glass-container:hover {
          background: rgba(255, 255, 255, 0.12);
          border-color: rgba(255, 255, 255, 0.3);
        }

        .glass-logo:hover {
          background: rgba(255, 255, 255, 0.15);
        }
      `}
    </style>
  );

  return (
    <>
      {animationStyles}
      
      <motion.div
        ref={containerRef}
        style={containerStyle}
        variants={containerVariants}
        initial="hidden"
        animate={isLoaded ? "visible" : "hidden"}
        exit="exit"
        {...swipeHandlers}
        onClick={handleNavigation}
        className="clickable-area"
      >
        {/* Главный гласморфизм контейнер */}
        <AnimatePresence>
          {!isExiting && (
            <motion.div
              style={glassContainerStyle}
              className="glass-container"
              variants={glassVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Логотип */}
              <motion.div
                ref={logoRef}
                style={logoContainerStyle}
                variants={logoVariants}
                className="glass-logo"
                whileHover={{ 
                  scale: 1.05, 
                  rotateY: 5,
                  transition: { duration: 0.3 }
                }}
              >
                <img
                  src={logoImage}
                  alt="Логотип РГС Жизнь"
                  style={{
                    width: '76px',      // уменьшено на 20% (было 96px)
                    height: '76px',     // уменьшено на 20% (было 96px)
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))',
                    animation: 'logoFloat 4s ease-in-out infinite'
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
                <p style={subtitleStyle}>
                  Добро пожаловать в будущее
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
};

export default WelcomePage;














































