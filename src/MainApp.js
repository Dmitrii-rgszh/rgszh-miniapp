// MainApp.js - БЕЗ ЧАСТИЦ, ГОТОВ ДЛЯ МАГНИТНЫХ КНОПОК
// Убраны частицы, оставлена чистая основа для других эффектов

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

let backgroundImage1, backgroundImage2, backgroundImage3, defaultBackground;

// Импорт основного фона (fallback)
try {
  defaultBackground = require('./components/background.png');
} catch (error) {
  console.warn('Default background not found');
  defaultBackground = null;
}

// Импорт фонов из папки background/
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
  const [currentBackgroundIndex, setCurrentBackgroundIndex] = useState(0);
  const [nextBackgroundIndex, setNextBackgroundIndex] = useState(1);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // ===== СОСТОЯНИЕ ДЛЯ ПЛАВНЫХ ПЕРЕХОДОВ =====
  const [currentOpacity, setCurrentOpacity] = useState(1);
  const [nextOpacity, setNextOpacity] = useState(0);
  
  // ===== СОСТОЯНИЕ ПРЕДЗАГРУЗКИ =====
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // ===== ПРЕДЗАГРУЗКА ИЗОБРАЖЕНИЙ =====
  const preloadImages = () => {
    if (availableBackgrounds.length === 0) {
      setImagesLoaded(true);
      return;
    }

    console.log('Начинаем скрытую предзагрузку фоновых изображений...');
    let loadedCount = 0;
    const totalImages = availableBackgrounds.length;

    availableBackgrounds.forEach((imageSrc, index) => {
      const img = new Image();
      
      img.onload = () => {
        loadedCount++;
        const progress = Math.round((loadedCount / totalImages) * 100);
        setLoadingProgress(progress);
        
        console.log(`Скрыто загружено изображение ${loadedCount}/${totalImages} (${progress}%)`);
        
        if (loadedCount === totalImages) {
          console.log('Все фоновые изображения скрыто предзагружены! Запускаем систему смены фонов.');
          setTimeout(() => {
            setImagesLoaded(true);
          }, 100);
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

  // ===== ФУНКЦИЯ ПОЛУЧЕНИЯ СЛЕДУЮЩЕГО ИНДЕКСА =====
  const getNextBackgroundIndex = (currentIndex) => {
    if (availableBackgrounds.length === 0) return 0;
    return (currentIndex + 1) % availableBackgrounds.length;
  };

  // ===== ГЛАВНАЯ ФУНКЦИЯ ПЕРЕХОДА =====
  const startSimpleTransition = () => {
    if (!imagesLoaded) {
      console.log('⏸️ Фоны еще не загружены, пропускаем переход');
      return;
    }
    
    if (isTransitioning) {
      console.log('⏸️ Переход уже выполняется, пропускаем');
      return;
    }
    
    if (availableBackgrounds.length < 2) {
      console.log('⏸️ Недостаточно фонов для смены (' + availableBackgrounds.length + '), пропускаем');
      return;
    }
    
    setCurrentBackgroundIndex(currentIndex => {
      const nextIndex = getNextBackgroundIndex(currentIndex);
      
      console.log(`🔄 Простой переход: фон ${currentIndex + 1} → ${nextIndex + 1}`);
      
      setIsTransitioning(true);
      setNextBackgroundIndex(nextIndex);
      
      executeCrossfadeTransition();
      
      return currentIndex;
    });
  };

  // ===== РЕАЛИЗАЦИЯ CROSSFADE ПЕРЕХОДА =====
  const executeCrossfadeTransition = () => {
    const duration = 3000;
    const steps = 120;
    
    setNextOpacity(0);
    
    setTimeout(() => {
      let step = 0;
      const fadeInterval = setInterval(() => {
        step++;
        const progress = step / steps;
        const easeProgress = 0.5 * (1 + Math.sin(Math.PI * (progress - 0.5)));
        
        const currentOpacityValue = Math.max(0, Math.min(1, 1 - easeProgress));
        const nextOpacityValue = Math.max(0, Math.min(1, easeProgress));
        
        setCurrentOpacity(currentOpacityValue);
        setNextOpacity(nextOpacityValue);
        
        if (step >= steps) {
          clearInterval(fadeInterval);
          setCurrentOpacity(0);
          setNextOpacity(1);
          finalizeTransition();
        }
      }, 25);
    }, 100);
  };

  // ===== ФИНАЛИЗАЦИЯ ПЕРЕХОДА =====
  const finalizeTransition = () => {
    setTimeout(() => {
      setNextBackgroundIndex(nextIndex => {
        console.log(`✅ Переход завершен: теперь активен фон ${nextIndex + 1}`);
        
        setCurrentBackgroundIndex(nextIndex);
        setCurrentOpacity(1);
        setNextOpacity(0);
        setIsTransitioning(false);
        
        return nextIndex;
      });
    }, 100);
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
    setImagesLoaded(false);
    preloadImages();
  }, []);

  // ===== АВТОМАТИЧЕСКАЯ СМЕНА ФОНОВ =====
  useEffect(() => {
    if (!imagesLoaded || availableBackgrounds.length <= 1) return;
    
    console.log('🚀 Запуск простой системы смены фонов: каждые 15 секунд');
    
    const repeatTimer = setInterval(() => {
      startSimpleTransition();
    }, 15000);

    return () => {
      clearInterval(repeatTimer);
    };
  }, [imagesLoaded]);

  // ===== ГЛОБАЛЬНЫЕ СТИЛИ КОНТЕЙНЕРА =====
  const globalContainerStyle = {
    position: 'relative',
    width: '100%',
    height: `${viewportHeight}px`,
    minHeight: `${viewportHeight}px`,
    overflow: 'hidden',
    fontFamily: '"Segoe UI", sans-serif',
    
    // ПОСТОЯННЫЙ КОРПОРАТИВНЫЙ ФОН
    background: `linear-gradient(135deg, 
      rgba(180, 0, 55, 0.95) 0%,
      rgba(153, 0, 55, 0.9) 25%,
      rgba(152, 164, 174, 0.8) 50%,
      rgba(118, 143, 146, 0.85) 75%,
      rgba(0, 40, 130, 0.95) 100%
    )`,
    
    paddingTop: 'env(safe-area-inset-top, 20px)',
    boxSizing: 'border-box'
  };

  // ===== СТИЛЬ ОСНОВНОГО ФОНА =====
  const mainBackgroundStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 1,
    
    ...(availableBackgrounds.length > 0 && imagesLoaded ? {
      backgroundImage: `url(${availableBackgrounds[currentBackgroundIndex]})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      opacity: currentOpacity
    } : {
      opacity: 0
    })
  };

  // ===== СТИЛЬ СЛЕДУЮЩЕГО ФОНА =====
  const nextBackgroundStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: isTransitioning ? 2 : 1,
    
    ...(availableBackgrounds.length > 0 && imagesLoaded ? {
      backgroundImage: `url(${availableBackgrounds[nextBackgroundIndex]})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      opacity: nextOpacity
    } : {
      opacity: 0
    }),
    
    pointerEvents: 'none'
  };

  // ===== CSS-В-JS ДЛЯ SAFE AREA =====
  const keyframesStyle = `
    :root {
      --safe-area-top: env(safe-area-inset-top, 50px);
      --safe-area-bottom: env(safe-area-inset-bottom, 0px);
      --safe-area-left: env(safe-area-inset-left, 0px);
      --safe-area-right: env(safe-area-inset-right, 0px);
    }
    
    .safe-top { margin-top: var(--safe-area-top) !important; }
    .safe-top-padding { padding-top: var(--safe-area-top) !important; }
    .safe-bottom { margin-bottom: var(--safe-area-bottom) !important; }
    .safe-bottom-padding { padding-bottom: var(--safe-area-bottom) !important; }
    
    .logo-safe { top: 110px !important; }
    .buttons-safe { top: 300px !important; }
    .title-safe { top: 260px !important; }
  `;

  // Добавляем стили в head
  useEffect(() => {
    const styleId = 'global-safe-area-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = keyframesStyle;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <ErrorBoundary>
      <div style={globalContainerStyle}>
        {/* Основной фон */}
        {imagesLoaded && availableBackgrounds.length > 0 && (
          <div style={mainBackgroundStyle} />
        )}
        
        {/* Следующий фон для переходов */}
        {imagesLoaded && availableBackgrounds.length > 1 && (
          <div style={nextBackgroundStyle} />
        )}
        
        {/* Роутер с компонентами - поверх всего */}
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














