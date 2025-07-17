// MainApp.js - ЦЕНТРАЛИЗОВАННОЕ УПРАВЛЕНИЕ ФОНАМИ
// ✅ Вся логика фонов в одном файле
// ✅ Применены корпоративные цвета: R:180 G:0 B:55, R:152 G:164 B:174, R:0 G:40 B:130
// ✅ Семейство шрифтов: Segoe UI Bold для заголовков, Segoe UI Regular для текста
// ✅ Инлайн стили как основной подход
// ✅ Автоматическая смена фонов каждые 15 секунд
// ✅ Исправлены проблемы Safari для мобильных устройств
// ✅ ДОБАВЛЕНО: Система предзагрузки фонов с прогресс-баром
// ✅ ДОБАВЛЕНО: Ультра-плавные переходы без белых экранов (2.5s)
// ✅ ДОБАВЛЕНО: Эффект блюра при смене фонов (1s) - УСКОРЕНО В 2 РАЗА
// ✅ ДОБАВЛЕНО: Глобальная логика Safe Area для всех страниц

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
  
  // ===== СОСТОЯНИЕ ДЛЯ БЛЮРА =====
  const [currentBlur, setCurrentBlur] = useState(0);  // Блюр текущего фона (0px = четкий)
  const [nextBlur, setNextBlur] = useState(15);       // Блюр следующего фона (15px = размытый)
  
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

  // ===== НАЧАЛО РАЗМЫТИЯ ТЕКУЩЕГО ФОНА (за 1 секунду до смены) =====
  const startBlurring = () => {
    if (!imagesLoaded || availableBackgrounds.length <= 1) return;
    
    console.log(`🌫️ Начинаем размытие текущего фона за 1 секунду до смены`);
    
    // Плавно размываем текущий фон за 1 секунду (УСКОРЕНО В 2 РАЗА)
    const blurStep = 15 / 10; // 15px размытия за 10 шагов (по 100ms) = 1 секунда
    let currentStep = 0;
    
    const blurInterval = setInterval(() => {
      currentStep++;
      const newBlur = blurStep * currentStep;
      
      if (newBlur >= 15) {
        setCurrentBlur(15);
        clearInterval(blurInterval);
        console.log(`🌫️ Размытие завершено: ${15}px`);
      } else {
        setCurrentBlur(newBlur);
      }
    }, 100); // Каждые 100ms
  };

  // ===== СМЕНА ФОНОВ (когда старый уже размыт) =====
  const changeBackground = () => {
    if (!imagesLoaded || availableBackgrounds.length <= 1) return;
    
    setIsTransitioning(true);
    
    // Подготавливаем следующий фон
    const nextIndex = (currentBackgroundIndex + 1) % availableBackgrounds.length;
    setNextBackgroundIndex(nextIndex);
    
    console.log(`🎨 Начинаем смену фона: ${currentBackgroundIndex + 1} → ${nextIndex + 1}`);
    
    // Новый фон начинает размытым и становится четким за 1 секунду (УСКОРЕНО В 2 РАЗА)
    setNextBlur(15); // Начинаем с максимального размытия
    
    // Плавно убираем размытие с нового фона за 1 секунду
    const unblurStep = 15 / 10; // 15px размытия за 10 шагов = 1 секунда
    let currentStep = 0;
    
    const unblurInterval = setInterval(() => {
      currentStep++;
      const newBlur = 15 - (unblurStep * currentStep);
      
      if (newBlur <= 0) {
        setNextBlur(0);
        clearInterval(unblurInterval);
        
        // Финальное переключение
        setTimeout(() => {
          setCurrentBackgroundIndex(nextIndex);
          setIsTransitioning(false);
          setCurrentBlur(0);    // Новый фон четкий
          setNextBlur(15);      // Готовим для следующего перехода
          console.log(`✅ Переход завершен: фон ${nextIndex + 1}/${availableBackgrounds.length}`);
        }, 100);
      } else {
        setNextBlur(newBlur);
      }
    }, 100); // Каждые 100ms
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
    
    console.log('Запуск автоматической смены фонов: размытие через 14 сек, смена через 15 сек');
    
    // Размытие начинается через 14 секунд (за 1 секунду до смены) - ОБНОВЛЕНО
    const blurTimer = setInterval(() => {
      startBlurring();
    }, 14000); // ИЗМЕНЕНО: 14 секунд вместо 13
    
    // Смена фона происходит через 15 секунд (когда фон уже размыт)
    const changeTimer = setInterval(() => {
      changeBackground();
    }, 15000);

    return () => {
      clearInterval(blurTimer);
      clearInterval(changeTimer);
    };
  }, [imagesLoaded, currentBackgroundIndex]);

  // ===== AURORA АНИМАЦИЯ (синхронизированная с фонами) =====
  useEffect(() => {
    if (!imagesLoaded) return;
    
    // Aurora цикл = 15 секунд (время жизни одного фона)
    // 150 шагов по 100ms = 15 секунд
    const auroraInterval = setInterval(() => {
      setAuroraOffset(prev => (prev + 1) % 150); // 150 шагов вместо 100
    }, 100);

    return () => clearInterval(auroraInterval);
  }, [imagesLoaded]);

  // ===== ГЛОБАЛЬНЫЕ СТИЛИ КОНТЕЙНЕРА + SAFE AREA =====
  const globalContainerStyle = {
    position: 'relative',
    width: '100%',
    height: `${viewportHeight}px`,
    minHeight: `${viewportHeight}px`,
    overflow: 'hidden',
    fontFamily: '"Segoe UI", sans-serif',
    
    // ✨ SAFE AREA: отступ сверху для безопасной зоны
    paddingTop: 'env(safe-area-inset-top, 50px)',
    boxSizing: 'border-box',
    
    // Адаптивность для мобильных
    '@supports (-webkit-touch-callout: none)': {
      height: '-webkit-fill-available',
      minHeight: '-webkit-fill-available'
    }
  };

  // ===== СТИЛЬ ОСНОВНОГО ФОНА (с блюром только для фона) =====
  const mainBackgroundStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: -1, // Под всеми элементами
    
    // ФОНОВОЕ ИЗОБРАЖЕНИЕ или КОРПОРАТИВНЫЙ ГРАДИЕНТ
    ...(availableBackgrounds.length > 0 && imagesLoaded ? {
      backgroundImage: `url(${availableBackgrounds[currentBackgroundIndex]})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      filter: `blur(${currentBlur}px)`,  // ✨ Блюр только для фона
      transition: 'filter 1s cubic-bezier(0.4, 0.0, 0.2, 1)' // ✨ УСКОРЕНО: 1 секунда анимация блюра
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
      animation: 'globalBackgroundShift 25s ease-in-out infinite'
    })
  };

  // ===== СТИЛЬ СЛЕДУЮЩЕГО ФОНА (для ультра-плавного перехода с блюром) =====
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
    filter: `blur(${nextBlur}px)`,  // ✨ Блюр только для фона
    transition: 'opacity 1s cubic-bezier(0.4, 0.0, 0.2, 1), filter 1s cubic-bezier(0.4, 0.0, 0.2, 1)', // ✨ УСКОРЕНО: 1 секунда анимация
    zIndex: -1, // Под всеми элементами
    pointerEvents: 'none'
  };

  // ===== ПЛАВНАЯ AURORA АНИМАЦИЯ (синхронизированная с фонами) =====
  const auroraOverlayStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: `
      radial-gradient(circle at ${15 + (auroraOffset * 0.4)}% ${25 + (auroraOffset * 0.3)}%, 
        rgba(180, 0, 55, 0.08) 0%,     /* Более мягкий красный */
        rgba(152, 164, 174, 0.05) 30%,  /* Более мягкий серый */
        rgba(0, 40, 130, 0.08) 60%,    /* Более мягкий синий */
        transparent 85%),
      radial-gradient(circle at ${85 - (auroraOffset * 0.3)}% ${75 - (auroraOffset * 0.2)}%, 
        rgba(153, 0, 55, 0.06) 0%,      /* Еще мягче красный */
        rgba(118, 143, 146, 0.04) 40%, /* Еще мягче серый */
        rgba(0, 32, 104, 0.06) 70%,    /* Еще мягче синий */
        transparent 90%)
    `,
    zIndex: 0, // Над фоном, но под интерфейсом
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
    zIndex: 100, // Над всем во время загрузки
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

  // ===== CSS-В-JS ДЛЯ АНИМАЦИИ + SAFE AREA =====
  const keyframesStyle = `
    @keyframes globalBackgroundShift {
      0%, 100% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
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
    
    /* ✨ АНИМАЦИИ С SAFE AREA */
    @keyframes piFloatAroundSafe {
      0% { transform: translate(20px, 20px); }
      25% { transform: translate(calc(100vw - 60px), 30px); }
      50% { transform: translate(calc(100vw - 50px), calc(100vh - 70px - var(--safe-area-bottom))); }
      75% { transform: translate(30px, calc(100vh - 60px - var(--safe-area-bottom))); }
      100% { transform: translate(20px, 20px); }
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
        {/* Основной фон (с блюром только для фона) */}
        <div style={mainBackgroundStyle} />
        
        {/* Следующий фон для ультра-плавного перехода с блюром */}
        {availableBackgrounds.length > 1 && imagesLoaded && (
          <div style={nextBackgroundStyle} />
        )}
        
        {/* Плавная Aurora анимация поверх фона */}
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
      </div>
    </ErrorBoundary>
  );
}

export default MainApp;














