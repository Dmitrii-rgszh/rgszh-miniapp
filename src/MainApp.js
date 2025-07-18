// MainApp.js - СИСТЕМА ФОНОВ С ДВИЖЕНИЕМ
// ✅ Простой цикл: background1 → background2 → background3 → background1...
// ✅ Плавное растворение (crossfade) + движение фона
// ✅ Каждый фон имеет свой независимый div с анимацией
// ✅ Плавное круговое движение фонов
// ✅ Увеличение фона на 130% для избежания пустот
// ✅ Автоматическая смена фонов каждые 15 секунд

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Импорты компонентов
import WelcomePage     from './WelcomePage';
import MainMenu        from './MainMenu';
import PollsPage       from './PollsPage';
import SNPPage         from './SNPPage';
import EmployeePage    from './EmployeePage';
import AssessmentPage  from './AssessmentPage';
import FeedbackPage    from './FeedbackPage';
import JustincasePage  from './JustincasePage';
import CareFuturePage  from './CareFuturePage';
import MarzaPollPage   from './MarzaPollPage';

// ===== ЦЕНТРАЛИЗОВАННЫЕ ИМПОРТЫ ФОНОВ =====

// Безопасные импорты фоновых изображений из папки background/
let backgroundImage1, backgroundImage2, backgroundImage3, defaultBackground;

// Импорт основного фона (fallback)
try {
  defaultBackground = require('./components/background.png');
} catch (error) {
  console.warn('Default background not found');
  defaultBackground = null;
}

// Импорт фонов из папки background/ с проверкой разных названий
try {
  backgroundImage1 = require('./components/background/background1.png');
} catch (error) {
  try {
    backgroundImage1 = require('./components/background/background (1).png');
  } catch (error2) {
    console.warn('Background 1 not found with either name');
    backgroundImage1 = null;
  }
}

try {
  backgroundImage2 = require('./components/background/background2.png');
} catch (error) {
  try {
    backgroundImage2 = require('./components/background/background (2).png');
  } catch (error2) {
    console.warn('Background 2 not found with either name');
    backgroundImage2 = null;
  }
}

try {
  backgroundImage3 = require('./components/background/background3.png');
} catch (error) {
  try {
    backgroundImage3 = require('./components/background/background (3).png');
  } catch (error2) {
    console.warn('Background 3 not found with either name');
    backgroundImage3 = null;
  }
}

// Создаем массив доступных фонов
const availableBackgrounds = [
  backgroundImage1, 
  backgroundImage2, 
  backgroundImage3, 
  defaultBackground
].filter(Boolean);

console.log(`Найдено фоновых изображений: ${availableBackgrounds.length}`);

// Компонент обработки ошибок
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  
  static getDerivedStateFromError(error) {
    return { error };
  }
  
  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
  }
  
  render() {
    if (this.state.error) {
      return (
        <div style={{
          padding: '20px',
          fontFamily: '"Segoe UI", sans-serif',
          color: 'rgb(180, 0, 55)',
          backgroundColor: 'white',
          border: '2px solid rgb(180, 0, 55)',
          borderRadius: '8px',
          margin: '20px',
          textAlign: 'center'
        }}>
          <h2 style={{ 
            fontFamily: '"Segoe UI", sans-serif',
            fontWeight: 'bold',
            color: 'rgb(180, 0, 55)' 
          }}>
            Произошла ошибка
          </h2>
          <pre style={{ 
            fontSize: '14px',
            color: 'rgb(0, 40, 130)',
            fontFamily: '"Segoe UI", sans-serif'
          }}>
            {this.state.error.toString()}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function MainApp() {
  // ===== СОСТОЯНИЕ ДЛЯ УПРАВЛЕНИЯ ФОНАМИ =====
  const [activeBackgroundIndex, setActiveBackgroundIndex] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // ===== СОСТОЯНИЕ ДЛЯ ПЛАВНЫХ ПЕРЕХОДОВ =====
  // Массив opacity для каждого фона
  const [backgroundOpacities, setBackgroundOpacities] = useState(
    availableBackgrounds.map((_, index) => index === 0 ? 1 : 0)
  );
  
  // ===== СОСТОЯНИЕ ПРЕДЗАГРУЗКИ =====
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // ===== ПРЕДЗАГРУЗКА ИЗОБРАЖЕНИЙ =====
  const preloadImages = () => {
    if (availableBackgrounds.length === 0) {
      setImagesLoaded(true);
      return;
    }

    console.log('Начинаем предзагрузку фоновых изображений...');
    let loadedCount = 0;
    const totalImages = availableBackgrounds.length;

    availableBackgrounds.forEach((imageSrc, index) => {
      const img = new Image();
      
      img.onload = () => {
        loadedCount++;
        const progress = Math.round((loadedCount / totalImages) * 100);
        setLoadingProgress(progress);
        
        console.log(`Загружено изображение ${index + 1}/${totalImages} (${progress}%)`);
        
        if (loadedCount === totalImages) {
          console.log('Все фоновые изображения предзагружены!');
          setTimeout(() => {
            setImagesLoaded(true);
          }, 500);
        }
      };
      
      img.onerror = () => {
        console.warn(`Ошибка загрузки изображения ${index}`);
        loadedCount++;
        const progress = Math.round((loadedCount / totalImages) * 100);
        setLoadingProgress(progress);
        
        if (loadedCount === totalImages) {
          setImagesLoaded(true);
        }
      };
      
      img.src = imageSrc;
    });
  };

  // ===== ПРОСТАЯ ФУНКЦИЯ ПОЛУЧЕНИЯ СЛЕДУЮЩЕГО ИНДЕКСА =====
  const getNextBackgroundIndex = (currentIndex) => {
    if (availableBackgrounds.length === 0) return 0;
    return (currentIndex + 1) % availableBackgrounds.length;
  };

  // ===== ГЛАВНАЯ ФУНКЦИЯ ПЕРЕХОДА =====
  const startTransition = () => {
    if (!imagesLoaded || isTransitioning || availableBackgrounds.length < 2) {
      return;
    }
    
    const nextIndex = getNextBackgroundIndex(activeBackgroundIndex);
    console.log(`🔄 Переход: фон ${activeBackgroundIndex + 1} → ${nextIndex + 1}`);
    
    setIsTransitioning(true);
    
    // Запускаем переход
    executeCrossfade(activeBackgroundIndex, nextIndex);
  };

  // ===== РЕАЛИЗАЦИЯ CROSSFADE =====
  const executeCrossfade = (fromIndex, toIndex) => {
    const duration = 5000; // 5 секунд на переход
    const steps = 200; // 200 шагов = 25ms на шаг
    
    let step = 0;
    const fadeInterval = setInterval(() => {
      step++;
      const progress = step / steps;
      
      // Используем ease-in-out функцию для более плавного перехода
      const easeProgress = 0.5 * (1 + Math.sin(Math.PI * (progress - 0.5)));
      
      // Обновляем массив opacity
      setBackgroundOpacities(opacities => {
        const newOpacities = [...opacities];
        newOpacities[fromIndex] = Math.max(0, Math.min(1, 1 - (easeProgress * 0.8))); // Оставляем 20% видимости
        newOpacities[toIndex] = Math.max(0, Math.min(1, easeProgress));
        return newOpacities;
      });
      
      if (step >= steps) {
        clearInterval(fadeInterval);
        finalizeTransition(toIndex);
      }
    }, 25);
  };

  // ===== ФИНАЛИЗАЦИЯ ПЕРЕХОДА =====
  const finalizeTransition = (newActiveIndex) => {
    console.log(`✅ Переход завершен: активен фон ${newActiveIndex + 1}`);
    
    // Обновляем активный индекс
    setActiveBackgroundIndex(newActiveIndex);
    
    // Устанавливаем финальные значения opacity
    setBackgroundOpacities(opacities => {
      const newOpacities = opacities.map((_, index) => index === newActiveIndex ? 1 : 0);
      return newOpacities;
    });
    
    setIsTransitioning(false);
  };

  // ===== ФУНКЦИЯ ОБНОВЛЕНИЯ ВЫСОТЫ =====
  const updateViewportHeight = () => {
    setViewportHeight(window.innerHeight);
  };

  // ===== ОБРАБОТЧИК ИЗМЕНЕНИЯ РАЗМЕРА ОКНА =====
  useEffect(() => {
    window.addEventListener('resize', updateViewportHeight);
    window.addEventListener('orientationchange', updateViewportHeight);
    
    const handleOrientationChange = () => {
      setTimeout(updateViewportHeight, 100);
    };
    
    window.addEventListener('orientationchange', handleOrientationChange);
    
    return () => {
      window.removeEventListener('resize', updateViewportHeight);
      window.removeEventListener('orientationchange', updateViewportHeight);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  // ===== ПРЕДЗАГРУЗКА ПРИ МОНТИРОВАНИИ =====
  useEffect(() => {
    preloadImages();
  }, []);

  // ===== АВТОМАТИЧЕСКАЯ СМЕНА ФОНОВ КАЖДЫЕ 15 СЕКУНД =====
  useEffect(() => {
    if (!imagesLoaded || availableBackgrounds.length <= 1) return;
    
    console.log('🚀 Запуск системы смены фонов: каждые 15 секунд');
    
    const repeatTimer = setInterval(() => {
      startTransition();
    }, 15000);

    return () => {
      clearInterval(repeatTimer);
    };
  }, [imagesLoaded, activeBackgroundIndex]);

  // ===== CSS KEYFRAMES ДЛЯ АНИМАЦИЙ =====
  const animationStyles = `
    @keyframes moveBackground0 {
      0% { transform: translate(-5%, 5%); }
      25% { transform: translate(5%, 5%); }
      50% { transform: translate(5%, -5%); }
      75% { transform: translate(-5%, -5%); }
      100% { transform: translate(-5%, 5%); }
    }
    
    @keyframes moveBackground1 {
      0% { transform: translate(5%, -5%); }
      25% { transform: translate(5%, 5%); }
      50% { transform: translate(-5%, 5%); }
      75% { transform: translate(-5%, -5%); }
      100% { transform: translate(5%, -5%); }
    }
    
    @keyframes moveBackground2 {
      0% { transform: translate(-5%, -5%); }
      25% { transform: translate(-5%, 5%); }
      50% { transform: translate(5%, 5%); }
      75% { transform: translate(5%, -5%); }
      100% { transform: translate(-5%, -5%); }
    }
    
    @keyframes moveBackground3 {
      0% { transform: translate(5%, 5%); }
      25% { transform: translate(-5%, 5%); }
      50% { transform: translate(-5%, -5%); }
      75% { transform: translate(5%, -5%); }
      100% { transform: translate(5%, 5%); }
    }
    
    /* ✨ ГЛОБАЛЬНЫЕ CSS ПЕРЕМЕННЫЕ ДЛЯ SAFE AREA */
    :root {
      --safe-area-top: env(safe-area-inset-top, 50px);
      --safe-area-bottom: env(safe-area-inset-bottom, 0px);
      --safe-area-left: env(safe-area-inset-left, 0px);
      --safe-area-right: env(safe-area-inset-right, 0px);
    }
    
    /* ✨ ГЛОБАЛЬНЫЕ УТИЛИТАРНЫЕ КЛАССЫ ДЛЯ SAFE AREA */
    .safe-top { margin-top: var(--safe-area-top) !important; }
    .safe-top-padding { padding-top: var(--safe-area-top) !important; }
    .safe-bottom { margin-bottom: var(--safe-area-bottom) !important; }
    .safe-bottom-padding { padding-bottom: var(--safe-area-bottom) !important; }
    
    /* ✨ АВТОМАТИЧЕСКИЙ SAFE AREA ДЛЯ ОСНОВНЫХ ЭЛЕМЕНТОВ */
    .logo-safe { top: 110px !important; }
    .buttons-safe { top: 300px !important; }
    .title-safe { top: 260px !important; }
  `;

  // Добавляем стили в head
  useEffect(() => {
    const styleId = 'animation-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = animationStyles;
      document.head.appendChild(style);
    }
  }, []);

  // ===== ГЛОБАЛЬНЫЕ СТИЛИ КОНТЕЙНЕРА =====
  const globalContainerStyle = {
    position: 'relative',
    width: '100%',
    height: `${viewportHeight}px`,
    minHeight: `${viewportHeight}px`,
    overflow: 'hidden',
    fontFamily: '"Segoe UI", sans-serif',
    
    // ✨ ПОСТОЯННЫЙ КОРПОРАТИВНЫЙ ФОН
    background: `
      linear-gradient(135deg, 
        rgba(180, 0, 55, 0.95) 0%,
        rgba(153, 0, 55, 0.9) 25%,
        rgba(152, 164, 174, 0.8) 50%,
        rgba(118, 143, 146, 0.85) 75%,
        rgba(0, 40, 130, 0.95) 100%
      )
    `,
    
    // ✨ SAFE AREA: отступ сверху для безопасной зоны
    paddingTop: 'env(safe-area-inset-top, 50px)',
    boxSizing: 'border-box',
    
    // Адаптивность для мобильных
    '@supports (-webkit-touch-callout: none)': {
      height: '-webkit-fill-available',
      minHeight: '-webkit-fill-available'
    }
  };

  // ===== ФУНКЦИЯ СОЗДАНИЯ СТИЛЯ ДЛЯ КАЖДОГО ФОНА =====
  const createBackgroundStyle = (backgroundImage, index) => ({
    position: 'absolute',
    top: '-15%',
    left: '-15%',
    width: '130%',
    height: '130%',
    backgroundImage: `url(${backgroundImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    opacity: backgroundOpacities[index] || 0,
    filter: `brightness(${0.7 + (backgroundOpacities[index] || 0) * 0.3})`,
    animation: `moveBackground${index} ${40 + index * 5}s ease-in-out infinite`,
    transition: 'opacity 0.025s linear',
    pointerEvents: 'none',
    zIndex: backgroundOpacities[index] > 0 ? 2 : 1
  });

  // ===== LOADER СТИЛИ =====
  const loaderOverlayStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: `
      linear-gradient(135deg, 
        rgba(180, 0, 55, 0.95) 0%,
        rgba(0, 40, 130, 0.95) 100%
      )
    `,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    opacity: imagesLoaded ? 0 : 1,
    visibility: imagesLoaded ? 'hidden' : 'visible',
    transition: 'opacity 1s ease-out, visibility 1s ease-out'
  };

  const loaderTextStyle = {
    color: 'white',
    fontSize: '18px',
    fontFamily: '"Segoe UI", sans-serif',
    fontWeight: 'bold',
    marginBottom: '20px',
    textAlign: 'center'
  };

  const progressBarStyle = {
    width: '200px',
    height: '4px',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: '2px',
    overflow: 'hidden',
    marginBottom: '10px'
  };

  const progressFillStyle = {
    width: `${loadingProgress}%`,
    height: '100%',
    background: `linear-gradient(90deg, 
      rgba(255, 255, 255, 0.8) 0%, 
      rgba(255, 255, 255, 1) 100%
    )`,
    transition: 'width 0.5s ease-out'
  };

  const progressTextStyle = {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: '14px',
    fontFamily: '"Segoe UI", sans-serif'
  };

  return (
    <ErrorBoundary>
      <div style={globalContainerStyle}>
        {/* Создаем отдельный div для каждого фона */}
        {imagesLoaded && availableBackgrounds.map((background, index) => (
          <div
            key={index}
            style={createBackgroundStyle(background, index)}
          />
        ))}
        
        {/* Loader во время предзагрузки */}
        <div style={loaderOverlayStyle}>
          <div style={loaderTextStyle}>
            Загрузка фоновых изображений...
          </div>
          <div style={progressBarStyle}>
            <div style={progressFillStyle} />
          </div>
          <div style={progressTextStyle}>
            {loadingProgress}%
          </div>
        </div>
        
        {/* Роутер с компонентами */}
        <Router>
          <Routes>
            <Route path="/"           element={<WelcomePage />} />
            <Route path="/main-menu"  element={<MainMenu />} />
            <Route path="/polls"      element={<PollsPage />} />
            <Route path="/snp"        element={<SNPPage />} />
            <Route path="/employee"   element={<EmployeePage />} />
            <Route path="/assessment" element={<AssessmentPage />} />
            <Route path="/feedback"   element={<FeedbackPage />} />
            <Route path="/justincase" element={<JustincasePage />} />
            <Route path="/carefuture" element={<CareFuturePage />} />
            <Route path="/marzapoll"  element={<MarzaPollPage />} />
          </Routes>
        </Router>
      </div>
    </ErrorBoundary>
  );
}

export default MainApp;














