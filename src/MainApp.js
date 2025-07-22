// MainApp.js - ЧИСТАЯ ВЕРСИЯ БЕЗ АНИМАЦИЙ ДВИЖЕНИЯ
// ✅ УБРАН BrowserRouter (перенесен в index.js)
// ✅ ТОЛЬКО плавная смена фонов без движения
// ✅ Смена каждые 15 секунд
// ✅ ТОЛЬКО WebP файлы

import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom'; // ← БЕЗ BrowserRouter

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

// ===== ИМПОРТ ФОНОВЫХ ИЗОБРАЖЕНИЙ - ТОЛЬКО WEBP =====
let backgroundImage1, backgroundImage2, backgroundImage3, backgroundImage4;

// Background 1
try {
  backgroundImage1 = require('./components/background/background1.webp');
} catch (error) {
  console.log('ℹ️ Background 1 not found');
  backgroundImage1 = null;
}

// Background 2
try {
  backgroundImage2 = require('./components/background/background2.webp');
} catch (error) {
  console.log('ℹ️ Background 2 not found');
  backgroundImage2 = null;
}

// Background 3
try {
  backgroundImage3 = require('./components/background/background3.webp');
} catch (error) {
  console.log('ℹ️ Background 3 not found');
  backgroundImage3 = null;
}

// Background 4
try {
  backgroundImage4 = require('./components/background/background4.webp');
} catch (error) {
  console.log('ℹ️ Background 4 not found');
  backgroundImage4 = null;
}

// Массив доступных фонов - убираем null значения
const availableBackgrounds = [
  backgroundImage1,
  backgroundImage2,
  backgroundImage3,
  backgroundImage4
].filter(Boolean);

// Если нет изображений - используем только корпоративный градиент
if (availableBackgrounds.length === 0) {
  console.log('📱 No background images found, using gradient only');
  availableBackgrounds.push(null);
}

console.log(`📷 Loaded ${availableBackgrounds.length} background(s):`, availableBackgrounds.map((bg, i) => bg ? `Background ${i+1}: found` : `Background ${i+1}: gradient`));

// ===== ERROR BOUNDARY =====
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  
  static getDerivedStateFromError(error) {
    return { error };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('React Error Boundary:', error, errorInfo);
  }
  
  render() {
    if (this.state.error) {
      return (
        <div className="error-boundary" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, rgb(180, 0, 55) 0%, rgb(153, 0, 55) 25%, rgb(152, 164, 174) 50%, rgb(118, 143, 146) 75%, rgb(0, 40, 130) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          color: 'white',
          fontFamily: '"Segoe UI", sans-serif',
          padding: '20px',
          textAlign: 'center'
        }}>
          <h2>Произошла ошибка</h2>
          <p>Пожалуйста, перезагрузите страницу</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '8px',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            Перезагрузить
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ===== АВТОНАВИГАЦИЯ =====
function AutoNavigator({ children }) {
  const navigate = useNavigate();
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (window.location.pathname === '/') {
        navigate('/main-menu');
      }
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [navigate]);
  
  return children;
}

// ===== ГЛАВНЫЙ КОМПОНЕНТ =====
function MainApp() {
  // ===== СОСТОЯНИЕ ДЛЯ ФОНОВ =====
  const [activeBackgroundIndex, setActiveBackgroundIndex] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  const [backgroundOpacities, setBackgroundOpacities] = useState(
    availableBackgrounds.map((_, index) => index === 0 ? 1 : 0)
  );
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // ===== ПРЕДЗАГРУЗКА ИЗОБРАЖЕНИЙ =====
  useEffect(() => {
    if (availableBackgrounds.length === 0) {
      setImagesLoaded(true);
      return;
    }

    let loadedCount = 0;
    const totalImages = availableBackgrounds.length;

    const preloadImage = (imageSrc, index) => {
      if (!imageSrc) {
        // Для градиентов - считаем загруженными
        loadedCount++;
        console.log(`📷 Background ${index + 1}: using gradient`);
        if (loadedCount === totalImages) {
          setImagesLoaded(true);
          console.log('✅ All backgrounds ready');
        }
        return;
      }

      const img = new Image();
      img.onload = () => {
        loadedCount++;
        console.log(`✅ Background ${index + 1}: loaded successfully`);
        if (loadedCount === totalImages) {
          setImagesLoaded(true);
          console.log('✅ All backgrounds loaded');
        }
      };
      img.onerror = () => {
        loadedCount++;
        console.warn(`⚠️ Background ${index + 1}: failed to load, will use gradient`);
        if (loadedCount === totalImages) {
          setImagesLoaded(true);
          console.log('✅ All backgrounds processed (some with errors)');
        }
      };
      img.src = imageSrc;
    };

    availableBackgrounds.forEach((imageSrc, index) => {
      preloadImage(imageSrc, index);
    });
  }, []);

  // ===== ОБРАБОТКА ИЗМЕНЕНИЯ РАЗМЕРА ОКНА =====
  useEffect(() => {
    const handleResize = () => {
      setViewportHeight(window.innerHeight);
    };

    const handleOrientationChange = () => {
      setTimeout(() => {
        setViewportHeight(window.innerHeight);
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  // ===== СМЕНА ФОНОВ КАЖДЫЕ 15 СЕКУНД =====
  useEffect(() => {
    if (!imagesLoaded || availableBackgrounds.length <= 1) return;

    const changeTimer = setTimeout(() => {
      setIsTransitioning(true);
      
      const nextIndex = (activeBackgroundIndex + 1) % availableBackgrounds.length;
      console.log(`🔄 Switching from background ${activeBackgroundIndex + 1} to ${nextIndex + 1}`);
      
      setBackgroundOpacities(prev => 
        prev.map((opacity, index) => 
          index === nextIndex ? 1 : index === activeBackgroundIndex ? 0 : 0
        )
      );
      
      setTimeout(() => {
        setActiveBackgroundIndex(nextIndex);
        setIsTransitioning(false);
      }, 2000);
      
    }, 15000); // 15 секунд

    return () => clearTimeout(changeTimer);
  }, [imagesLoaded, activeBackgroundIndex]);

  // ===== ТОЛЬКО СТИЛИ ДЛЯ ФОНОВ (никаких других!) =====
  
  // Основной контейнер - минимальные стили
  const mainContainerStyle = {
    position: 'relative',
    width: '100%',
    height: `${viewportHeight}px`,
    minHeight: '100vh',
    overflow: 'hidden',
    fontFamily: '"Segoe UI", sans-serif'
  };

  // Стили фоновых слоев - БЕЗ АНИМАЦИЙ ДВИЖЕНИЯ
  const createBackgroundStyle = (backgroundSrc, index) => {
    const opacity = backgroundOpacities[index] || 0;
    
    return {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100vw',
      height: '100vh',
      zIndex: opacity > 0 ? -1 : -2, // ← ИСПРАВЛЕНО: отрицательные z-index для фонов
      
      // Фон: изображение или корпоративный градиент
      backgroundImage: backgroundSrc 
        ? `url(${backgroundSrc})` 
        : 'linear-gradient(135deg, rgb(180, 0, 55) 0%, rgb(153, 0, 55) 25%, rgb(152, 164, 174) 50%, rgb(118, 143, 146) 75%, rgb(0, 40, 130) 100%)',
      
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed',
      
      // ТОЛЬКО плавный переход opacity - БЕЗ ДРУГИХ АНИМАЦИЙ
      opacity: opacity,
      transition: isTransitioning ? 'opacity 2.0s ease-in-out' : 'none',
      
      // Оптимизация
      willChange: isTransitioning ? 'opacity' : 'auto',
      transform: 'translateZ(0)',
      pointerEvents: 'none' // ← ВАЖНО: фоны не должны перехватывать клики
    };
  };

  // Контейнер контента - минимальные стили
  const contentContainerStyle = {
    position: 'relative',
    zIndex: 100, // ← ИСПРАВЛЕНО: высокий z-index для контента
    width: '100%',
    height: '100%',
    pointerEvents: 'auto' // ← ВАЖНО: разрешаем клики на контенте
  };

  return (
    <ErrorBoundary>
      <div className="main-app-container" style={mainContainerStyle}>
        {/* ===== ФОНОВЫЕ СЛОИ БЕЗ АНИМАЦИЙ ДВИЖЕНИЯ ===== */}
        {availableBackgrounds.map((backgroundSrc, index) => {
          const opacity = backgroundOpacities[index] || 0;
          
          return (
            <div
              key={`background-${index}`}
              className={`background-layer ${isTransitioning ? 'transitioning' : ''} ${opacity > 0 ? 'active' : ''}`}
              style={createBackgroundStyle(backgroundSrc, index)}
            />
          );
        })}
        
        {/* ===== ОСНОВНОЙ КОНТЕНТ БЕЗ Router ===== */}
        <AutoNavigator>
          <div style={contentContainerStyle}>
            <Routes>
              <Route path="/" element={<WelcomePage />} />
              <Route path="/main-menu" element={<MainMenu />} />
              <Route path="/polls" element={<PollsPage />} />
              <Route path="/employee" element={<EmployeePage />} />
              <Route path="/snp" element={<SNPPage />} />
              <Route path="/assessment" element={<AssessmentPage />} />
              <Route path="/feedback" element={<FeedbackPage />} />
              <Route path="/justincase" element={<JustincasePage />} />
              <Route path="/care-future" element={<CareFuturePage />} />
              <Route path="/marza-poll" element={<MarzaPollPage />} />
              {/* Fallback для неизвестных маршрутов */}
              <Route path="*" element={<WelcomePage />} />
            </Routes>
          </div>
        </AutoNavigator>
      </div>
    </ErrorBoundary>
  );
}

export default MainApp;














