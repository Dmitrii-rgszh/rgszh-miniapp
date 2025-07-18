// MainApp.js - УПРОЩЕННАЯ СИСТЕМА ФОНОВ
// ✅ Простой цикл: background1 → background2 → background3 → background1...
// ✅ Только плавное растворение (crossfade) без сложных анимаций
// ✅ Применены корпоративные цвета: R:180 G:0 B:55, R:152 G:164 B:174, R:0 G:40 B:130
// ✅ Семейство шрифтов: Segoe UI Bold для заголовков, Segoe UI Regular для текста
// ✅ Инлайн стили как основной подход
// ✅ Автоматическая смена фонов каждые 15 секунд
// ✅ Глобальная логика Safe Area для всех страниц

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
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // ===== СОСТОЯНИЕ ДЛЯ ПЛАВНЫХ ПЕРЕХОДОВ =====
  const [currentOpacity, setCurrentOpacity] = useState(1);
  const [nextOpacity, setNextOpacity] = useState(0);
  
  // ===== СОСТОЯНИЕ ПРЕДЗАГРУЗКИ =====
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // ===== ПРЕДЗАГРУЗКА ИЗОБРАЖЕНИЙ (СКРЫТАЯ ОТ ПОЛЬЗОВАТЕЛЯ) =====
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
          }, 100); // Минимальная задержка
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

  // ===== ГЛАВНАЯ ФУНКЦИЯ ПРОСТОГО ПЕРЕХОДА =====
  const startSimpleTransition = () => {
    // Проверки
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
    
    // Используем функциональное обновление состояния для получения актуального значения
    setCurrentBackgroundIndex(currentIndex => {
      const nextIndex = getNextBackgroundIndex(currentIndex);
      
      console.log(`🔄 Простой переход: фон ${currentIndex + 1} → ${nextIndex + 1}`);
      
      setIsTransitioning(true);
      setNextBackgroundIndex(nextIndex);
      
      // Запускаем простое растворение
      executeCrossfadeTransition();
      
      return currentIndex; // Не меняем здесь, изменим в finalizeTransition
    });
  };

  // ===== РЕАЛИЗАЦИЯ ПРОСТОГО CROSSFADE ПЕРЕХОДА =====
  const executeCrossfadeTransition = () => {
    const duration = 3000; // 3 секунды на переход
    const steps = 120; // 120 шагов = 25ms на шаг (более плавная анимация)
    
    // Сбрасываем состояние следующего фона
    setNextOpacity(0);
    
    setTimeout(() => {
      let step = 0;
      const fadeInterval = setInterval(() => {
        step++;
        const progress = step / steps;
        
        // Используем ease-in-out функцию для более плавного перехода
        const easeProgress = 0.5 * (1 + Math.sin(Math.PI * (progress - 0.5)));
        
        // Плавное изменение прозрачности с гарантией границ [0, 1]
        const currentOpacityValue = Math.max(0, Math.min(1, 1 - easeProgress));
        const nextOpacityValue = Math.max(0, Math.min(1, easeProgress));
        
        setCurrentOpacity(currentOpacityValue);
        setNextOpacity(nextOpacityValue);
        
        if (step >= steps) {
          clearInterval(fadeInterval);
          // Принудительно устанавливаем финальные значения
          setCurrentOpacity(0);
          setNextOpacity(1);
          finalizeTransition();
        }
      }, 25); // 25ms интервал для плавности
    }, 100);
  };

  // ===== ФИНАЛИЗАЦИЯ ПЕРЕХОДА =====
  const finalizeTransition = () => {
    setTimeout(() => {
      // Используем функциональное обновление для получения актуального nextBackgroundIndex
      setNextBackgroundIndex(nextIndex => {
        console.log(`✅ Переход завершен: теперь активен фон ${nextIndex + 1}`);
        
        // Обновляем текущий индекс на следующий
        setCurrentBackgroundIndex(nextIndex);
        
        // ПРИНУДИТЕЛЬНО устанавливаем правильные финальные состояния
        setCurrentOpacity(1);
        setNextOpacity(0);
        setIsTransitioning(false);
        
        return nextIndex;
      });
    }, 100); // Уменьшили задержку
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

  // ===== ПРЕДЗАГРУЗКА ПРИ МОНТИРОВАНИИ (СКРЫТАЯ) =====
  useEffect(() => {
    // Сразу показываем интерфейс пользователю
    setImagesLoaded(false); // Фоны еще не загружены, но интерфейс уже работает
    
    // Запускаем скрытую предзагрузку в фоне
    preloadImages();
  }, []);

  // ===== АВТОМАТИЧЕСКАЯ СМЕНА ФОНОВ КАЖДЫЕ 15 СЕКУНД =====
  useEffect(() => {
    if (!imagesLoaded || availableBackgrounds.length <= 1) return;
    
    console.log('🚀 Запуск простой системы смены фонов: каждые 15 секунд');
    
    // Повторяющийся таймер каждые 15 секунд
    const repeatTimer = setInterval(() => {
      startSimpleTransition();
    }, 15000);

    // Cleanup при размонтировании
    return () => {
      clearInterval(repeatTimer);
    };
  }, [imagesLoaded]); // Убрали currentBackgroundIndex из зависимостей!

  // ===== ГЛОБАЛЬНЫЕ СТИЛИ КОНТЕЙНЕРА + SAFE AREA =====
  const globalContainerStyle = {
    position: 'relative',
    width: '100%',
    height: `${viewportHeight}px`,
    minHeight: `${viewportHeight}px`,
    overflow: 'hidden',
    fontFamily: '"Segoe UI", sans-serif',
    
    // ✨ ПОСТОЯННЫЙ КОРПОРАТИВНЫЙ ФОН
    background: `linear-gradient(135deg, 
      rgba(180, 0, 55, 0.95) 0%,
      rgba(153, 0, 55, 0.9) 25%,
      rgba(152, 164, 174, 0.8) 50%,
      rgba(118, 143, 146, 0.85) 75%,
      rgba(0, 40, 130, 0.95) 100%
    )`,
    
    // ✨ SAFE AREA: отступ сверху для безопасной зоны
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
      // Убрали transition - анимация полностью управляется JavaScript
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
      // Убрали transition - анимация полностью управляется JavaScript
    } : {
      opacity: 0
    }),
    
    pointerEvents: 'none'
  };

  // ===== CSS-В-JS ДЛЯ SAFE AREA =====
  const keyframesStyle = `
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
        {/* Основной фон - показываем только после загрузки */}
        {imagesLoaded && availableBackgrounds.length > 0 && (
          <div style={mainBackgroundStyle} />
        )}
        
        {/* Следующий фон для переходов - показываем только после загрузки */}
        {imagesLoaded && availableBackgrounds.length > 1 && (
          <div style={nextBackgroundStyle} />
        )}
        
        {/* Роутер с компонентами - показываем сразу */}
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














