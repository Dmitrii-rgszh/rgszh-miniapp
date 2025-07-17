// MainApp.js - ЦЕНТРАЛИЗОВАННОЕ УПРАВЛЕНИЕ ФОНАМИ
// ✅ Вся логика фонов в одном файле
// ✅ Применены корпоративные цвета: R:180 G:0 B:55, R:152 G:164 B:174, R:0 G:40 B:130
// ✅ Семейство шрифтов: Segoe UI Bold для заголовков, Segoe UI Regular для текста
// ✅ Инлайн стили как основной подход
// ✅ Автоматическая смена фонов каждые 15 секунд
// ✅ Исправлены проблемы Safari для мобильных устройств
// ✅ ДОБАВЛЕНО: Система предзагрузки фонов с прогресс-баром
// ✅ ДОБАВЛЕНО: Ультра-плавные переходы без белых экранов (2.5s)

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
  const [currentBackgroundIndex, setCurrentBackgroundIndex] = useState(0);
  const [nextBackgroundIndex, setNextBackgroundIndex] = useState(1);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  const [auroraOffset, setAuroraOffset] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // ===== СОСТОЯНИЕ ПРЕДЗАГРУЗКИ =====
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [loadedImages, setLoadedImages] = useState(new Set());
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
        setLoadedImages(prev => new Set([...prev, index]));
        const progress = Math.round((loadedCount / totalImages) * 100);
        setLoadingProgress(progress);
        
        console.log(`Загружено изображение ${loadedCount}/${totalImages} (${progress}%)`);
        
        if (loadedCount === totalImages) {
          console.log('Все фоновые изображения предзагружены!');
          setTimeout(() => {
            setImagesLoaded(true);
          }, 500); // Небольшая задержка для плавности
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

  // ===== УЛЬТРА-ПЛАВНАЯ СМЕНА ФОНОВ =====
  const changeBackground = () => {
    if (!imagesLoaded || availableBackgrounds.length <= 1) return;
    
    setIsTransitioning(true);
    
    // Подготавливаем следующий фон
    const nextIndex = (currentBackgroundIndex + 1) % availableBackgrounds.length;
    setNextBackgroundIndex(nextIndex);
    
    // ИСПРАВЛЕНО: Увеличено время для ультра-плавного перехода
    setTimeout(() => {
      setCurrentBackgroundIndex(nextIndex);
      setIsTransitioning(false);
      console.log(`Смена фона: → ${nextIndex + 1}/${availableBackgrounds.length}`);
    }, 2500); // ИСПРАВЛЕНО: 2.5 секунды для ультра-плавного перехода
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

  // ===== АВТОМАТИЧЕСКАЯ СМЕНА ФОНОВ =====
  useEffect(() => {
    if (!imagesLoaded || availableBackgrounds.length <= 1) return;
    
    console.log('Запуск автоматической смены фонов каждые 15 секунд');
    const bgInterval = setInterval(changeBackground, 15000); // ИСПРАВЛЕНО: 15 секунд

    return () => clearInterval(bgInterval);
  }, [imagesLoaded, currentBackgroundIndex]);

  // ===== AURORA АНИМАЦИЯ =====
  useEffect(() => {
    const auroraInterval = setInterval(() => {
      setAuroraOffset(prev => (prev + 1) % 100);
    }, 100);

    return () => clearInterval(auroraInterval);
  }, []);

  // ===== ГЛОБАЛЬНЫЕ СТИЛИ КОНТЕЙНЕРА =====
  const globalContainerStyle = {
    position: 'relative',
    width: '100%',
    height: `${viewportHeight}px`,
    minHeight: `${viewportHeight}px`,
    overflow: 'hidden',
    fontFamily: '"Segoe UI", sans-serif',
    
    // ФОНОВОЕ ИЗОБРАЖЕНИЕ или КОРПОРАТИВНЫЙ ГРАДИЕНТ
    ...(availableBackgrounds.length > 0 && imagesLoaded ? {
      backgroundImage: `url(${availableBackgrounds[currentBackgroundIndex]})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    } : {
      // Fallback: корпоративный градиент если изображения недоступны или загружаются
      background: `
        linear-gradient(135deg, 
          rgba(180, 0, 55, 0.95) 0%,     /* Основной красный */
          rgba(153, 0, 55, 0.9) 25%,     /* Темнее красный */
          rgba(152, 164, 174, 0.8) 50%,  /* Серый */
          rgba(118, 143, 146, 0.85) 75%, /* Темнее серый */
          rgba(0, 40, 130, 0.95) 100%    /* Синий */
        )
      `,
      backgroundSize: '400% 400%',
      animation: 'globalBackgroundShift 25s ease-in-out infinite' // ИСПРАВЛЕНО: 25s
    }),
    
    // Ультра-плавная смена фонов
    transition: 'background-image 2.5s cubic-bezier(0.4, 0.0, 0.2, 1)',
    
    // Адаптивность для мобильных
    '@supports (-webkit-touch-callout: none)': {
      height: '-webkit-fill-available',
      minHeight: '-webkit-fill-available'
    }
  };

  // ===== СТИЛЬ СЛЕДУЮЩЕГО ФОНА (для ультра-плавного перехода) =====
  const nextBackgroundStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundImage: availableBackgrounds.length > 0 && imagesLoaded ? 
      `url(${availableBackgrounds[nextBackgroundIndex]})` : 'none',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    opacity: isTransitioning ? 1 : 0,
    transition: 'opacity 2.5s cubic-bezier(0.4, 0.0, 0.2, 1)', // ИСПРАВЛЕНО: 2.5s + Material easing
    zIndex: 0,
    pointerEvents: 'none'
  };

  // ===== AURORA ОВЕРЛЕЙ =====
  const auroraOverlayStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: `
      radial-gradient(circle at ${20 + auroraOffset}% ${30 + auroraOffset * 0.5}%, 
        rgba(180, 0, 55, 0.15) 0%,     /* Корпоративный красный */
        rgba(152, 164, 174, 0.1) 25%,  /* Корпоративный серый */
        rgba(0, 40, 130, 0.15) 50%,    /* Корпоративный синий */
        transparent 75%),
      radial-gradient(circle at ${80 - auroraOffset}% ${70 - auroraOffset * 0.3}%, 
        rgba(153, 0, 55, 0.1) 0%,      /* Темнее красный */
        rgba(118, 143, 146, 0.08) 30%, /* Темнее серый */
        rgba(0, 32, 104, 0.12) 60%,    /* Темнее синий */
        transparent 80%)
    `,
    zIndex: 1,
    pointerEvents: 'none'
  };

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
    transition: 'opacity 0.5s ease-out, visibility 0.5s ease-out'
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
    transition: 'width 0.3s ease-out'
  };

  const progressTextStyle = {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: '14px',
    fontFamily: '"Segoe UI", sans-serif'
  };

  // ===== CSS-В-JS ДЛЯ АНИМАЦИИ =====
  const keyframesStyle = `
    @keyframes globalBackgroundShift {
      0%, 100% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
    }
  `;

  // Добавляем анимацию в head, если её еще нет
  useEffect(() => {
    const styleId = 'global-background-animation';
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
        {/* Следующий фон для ультра-плавного перехода */}
        {availableBackgrounds.length > 1 && imagesLoaded && (
          <div style={nextBackgroundStyle} />
        )}
        
        {/* Aurora оверлей поверх фона */}
        <div style={auroraOverlayStyle} />
        
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

        {/* Индикатор текущего фона - УДАЛЕН по запросу пользователя */}
        {/* 
        {process.env.NODE_ENV === 'development' && availableBackgrounds.length > 1 && imagesLoaded && (
          <div style={{
            position: 'fixed',
            bottom: '10px',
            right: '10px',
            background: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '5px 10px',
            borderRadius: '5px',
            fontSize: '12px',
            fontFamily: '"Segoe UI", sans-serif',
            zIndex: 9999
          }}>
            Фон: {currentBackgroundIndex + 1}/{availableBackgrounds.length}
            {isTransitioning && ' (переход...)'}
          </div>
        )}
        */}
      </div>
    </ErrorBoundary>
  );
}

export default MainApp;














