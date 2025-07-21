// MainApp.js - ИСПРАВЛЕННАЯ ВЕРСИЯ
// ✅ Фоны загружаются во время экрана приветствия (без показа прогресса)
// ✅ Автоматический переход на MainMenu через 3 секунды
// ✅ Исправлены warnings о конфликте стилей

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';

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
let backgroundImage1, backgroundImage2, backgroundImage3, backgroundImage4, defaultBackground;

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

try {
  backgroundImage4 = require('./components/background/background4.png');
} catch (error) {
  try {
    backgroundImage4 = require('./components/background/background (4).png');
  } catch (error2) {
    console.warn('Background 4 not found with either name');
    backgroundImage4 = null;
  }
}

// Создаем массив доступных фонов
const availableBackgrounds = [
  backgroundImage1, 
  backgroundImage2, 
  backgroundImage3,
  backgroundImage4
].filter(Boolean);

// Добавляем defaultBackground только если других фонов нет
if (availableBackgrounds.length === 0 && defaultBackground) {
  availableBackgrounds.push(defaultBackground);
}

// ✅ НОВОЕ: Если нет вообще никаких изображений - добавляем null для корпоративного градиента
if (availableBackgrounds.length === 0) {
  availableBackgrounds.push(null); // null покажет корпоративный градиент из createBackgroundStyle
  console.log('📍 Используем корпоративный градиент как основной фон');
}

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

// Компонент для автоматического перехода
function AutoNavigator({ children }) {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Автоматический переход на MainMenu через 3 секунды
    const timer = setTimeout(() => {
      if (window.location.pathname === '/') {
        navigate('/main-menu');
      }
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [navigate]);
  
  return children;
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

  // ===== ПРЕДЗАГРУЗКА ИЗОБРАЖЕНИЙ (без показа прогресса) =====
  useEffect(() => {
    if (availableBackgrounds.length === 0) {
      setImagesLoaded(true);
      return;
    }

    console.log('Предзагрузка фоновых изображений...');
    let loadedCount = 0;
    const totalImages = availableBackgrounds.length;

    availableBackgrounds.forEach((imageSrc, index) => {
      const img = new Image();
      
      img.onload = () => {
        loadedCount++;
        console.log(`Загружено изображение ${index + 1}/${totalImages}`);
        
        if (loadedCount === totalImages) {
          console.log('Все фоновые изображения предзагружены!');
          setImagesLoaded(true);
        }
      };
      
      img.onerror = () => {
        console.warn(`Ошибка загрузки изображения ${index}`);
        loadedCount++;
        
        if (loadedCount === totalImages) {
          setImagesLoaded(true);
        }
      };
      
      img.src = imageSrc;
    });
  }, []);

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
    
    // Запускаем переход с усиленным Aurora эффектом
    executeCrossfadeWithAurora(activeBackgroundIndex, nextIndex);
  };

  // ===== РЕАЛИЗАЦИЯ CROSSFADE С AURORA ЭФФЕКТОМ =====
  const executeCrossfadeWithAurora = (fromIndex, toIndex) => {
    const duration = 10000; // 10 секунд на переход для максимально плавного Aurora эффекта
    const steps = 400; // Еще больше шагов для плавности
    
    let step = 0;
    const fadeInterval = setInterval(() => {
      step++;
      const progress = step / steps;
      
      // Сложная функция для Aurora эффекта
      const easeProgress = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      
      // Многослойные волны для эффекта северного сияния
      const auroraWave1 = Math.sin(progress * Math.PI * 3) * 0.15 + 0.85;
      const auroraWave2 = Math.cos(progress * Math.PI * 2) * 0.1 + 0.9;
      const auroraWave3 = Math.sin(progress * Math.PI * 4) * 0.05 + 0.95;
      
      // Комбинированная Aurora волна
      const combinedAurora = (auroraWave1 + auroraWave2 + auroraWave3) / 3;
      
      // Обновляем массив opacity с Aurora эффектом
      setBackgroundOpacities(opacities => {
        const newOpacities = [...opacities];
        
        // Уходящий фон с волновым затуханием
        newOpacities[fromIndex] = Math.max(0, Math.min(1, 
          (1 - easeProgress) * combinedAurora * 0.95
        ));
        
        // Появляющийся фон с Aurora свечением
        newOpacities[toIndex] = Math.max(0, Math.min(1, 
          easeProgress * (0.7 + combinedAurora * 0.3)
        ));
        
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

  // ===== CSS СТИЛИ БЕЗ АНИМАЦИИ ДВИЖЕНИЯ =====
  const staticStyles = `
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
    const styleId = 'static-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = staticStyles;
      document.head.appendChild(style);
    }
  }, []);

  // ===== ГЛОБАЛЬНЫЕ СТИЛИ КОНТЕЙНЕРА =====
  // ===== ЗАМЕНИТЕ ВАШ globalContainerStyle НА ЭТО: =====

  const globalContainerStyle = {
    // ✅ ИЗМЕНЕНО: fixed вместо relative для полного покрытия экрана
    position: 'fixed',
    top: 0,
    left: 0,
  
    // ✅ ИЗМЕНЕНО: используем viewport units для полного покрытия
    width: '100vw',
    height: '100vh',
    minHeight: '100vh',
  
    overflow: 'hidden',
    fontFamily: '"Segoe UI", sans-serif',
  
    // ❌ УБРАНО: фон переносим в createBackgroundStyle
    // backgroundColor: 'rgba(180, 0, 55, 0.95)', // ← УДАЛИТЬ
    // backgroundImage: `...`, // ← УДАЛИТЬ
  
    // ✅ СОХРАНЕНО: Safe Area отступы для КОНТЕНТА (НЕ для фона)
    paddingTop: 'env(safe-area-inset-top, 50px)',
    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    paddingLeft: 'env(safe-area-inset-left, 0px)',
    paddingRight: 'env(safe-area-inset-right, 0px)',
  
    boxSizing: 'border-box',
  
    // ✅ СОХРАНЕНО: мобильная адаптивность
    '@supports (-webkit-touch-callout: none)': {
      height: '100vh', // ✅ ИЗМЕНЕНО: используем vh вместо -webkit-fill-available
      minHeight: '100vh'
    }
  };

  // ===== СТИЛЬ ДЛЯ СТАТИЧНЫХ ФОНОВ С ПРОСТЫМ ЭФФЕКТОМ =====
  const createBackgroundStyle = (backgroundSrc, index) => {
    const opacity = backgroundOpacities[index] || 0;
  
    return {
      position: 'absolute',
    
      // ✅ КЛЮЧЕВОЕ ИЗМЕНЕНИЕ: фон распространяется ЗА Safe Area
      top: `calc(-1 * env(safe-area-inset-top, 0px))`,      // Поднимается В статус-бар
      left: `calc(-1 * env(safe-area-inset-left, 0px))`,    // Распространяется влево ЗА вырез
      right: `calc(-1 * env(safe-area-inset-right, 0px))`,  // Распространяется вправо ЗА вырез  
      bottom: `calc(-1 * env(safe-area-inset-bottom, 0px))`, // Распространяется вниз ЗА bottom area
    
      // ✅ КОРПОРАТИВНЫЙ ФОН: если нет изображения - используем градиент
      backgroundImage: backgroundSrc 
        ? `url(${backgroundSrc})` 
        : `linear-gradient(135deg, 
            rgba(180, 0, 55, 0.95) 0%,
            rgba(153, 0, 55, 0.9) 25%,
            rgba(152, 164, 174, 0.8) 50%,
            rgba(118, 143, 146, 0.85) 75%,
            rgba(0, 40, 130, 0.95) 100%
          )`,
    
      // ✅ FALLBACK: корпоративный цвет если нет изображения
      backgroundColor: 'rgba(180, 0, 55, 0.95)',
    
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    
      opacity: opacity,
      filter: `brightness(${0.7 + opacity * 0.1})`,
      transition: 'opacity 3s ease-in-out',
    
      pointerEvents: 'none',
      zIndex: 1,
      willChange: 'opacity'
    };
  };

  return (
    <ErrorBoundary>
      <div style={globalContainerStyle}>
        {/* Создаем отдельный div для каждого фона со статичным положением */}
        {imagesLoaded && availableBackgrounds.map((background, index) => (
          <div
            key={index}
            style={createBackgroundStyle(background, index)}
          />
        ))}
        
        {/* Роутер с компонентами */}
        <Router>
          <AutoNavigator>
            <div style={{ position: 'relative', zIndex: 10, width: '100%', height: '100%' }}>
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
            </div>
          </AutoNavigator>
        </Router>
      </div>
    </ErrorBoundary>
  );
}

export default MainApp;














