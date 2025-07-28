// MainApp.js - ЧИСТАЯ РАБОЧАЯ ВЕРСИЯ БЕЗ КОНФЛИКТОВ
// ✅ Минимальный код без лишних исправлений
// ✅ Простая система фонов
// ✅ Рабочие кнопки без конфликтов

import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';

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

// ===== ИМПОРТ ФОНОВЫХ ИЗОБРАЖЕНИЙ =====
let backgroundImage1, backgroundImage2, backgroundImage3, backgroundImage4;

// Пробуем загрузить изображения
try {
  backgroundImage1 = require('./components/background/background1.webp');
} catch (error) {
  try {
    backgroundImage1 = require('./components/background/background1.png');
  } catch (error2) {
    backgroundImage1 = null;
  }
}

try {
  backgroundImage2 = require('./components/background/background2.webp');
} catch (error) {
  try {
    backgroundImage2 = require('./components/background/background2.png');
  } catch (error2) {
    backgroundImage2 = null;
  }
}

try {
  backgroundImage3 = require('./components/background/background3.webp');
} catch (error) {
  try {
    backgroundImage3 = require('./components/background/background3.png');
  } catch (error2) {
    backgroundImage3 = null;
  }
}

try {
  backgroundImage4 = require('./components/background/background4.webp');
} catch (error) {
  try {
    backgroundImage4 = require('./components/background/background4.png');
  } catch (error2) {
    backgroundImage4 = null;
  }
}

// Массив доступных фонов
const availableBackgrounds = [
  backgroundImage1,
  backgroundImage2,
  backgroundImage3,
  backgroundImage4
].filter(Boolean);

// Если нет изображений - добавляем null для градиента
if (availableBackgrounds.length === 0) {
  availableBackgrounds.push(null);
}

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
        <div style={{
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
          textAlign: 'center',
          zIndex: 9999
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
  const location = useLocation();
  
  useEffect(() => {
    const isRootPath = location.pathname === '/' && (!location.hash || location.hash === '#/' || location.hash === '');
    
    if (isRootPath) {
      const timer = setTimeout(() => {
        const currentPath = window.location.pathname;
        const currentHash = window.location.hash;
        const stillOnRoot = currentPath === '/' && (!currentHash || currentHash === '#/' || currentHash === '');
        
        if (stillOnRoot) {
          navigate('/main-menu');
        }
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [location.pathname, location.hash, navigate]);
  
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
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // ===== TELEGRAM WEBAPP SUPPORT =====
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.expand();
      tg.setHeaderColor('#B40037');
      tg.ready();
    }
  }, []);

  // ===== ПРОСТОЕ ИСПРАВЛЕНИЕ ДЛЯ iOS =====
  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    if (isIOS) {
      // Исправляем проблемы iOS Safari
      const style = document.createElement('style');
      style.textContent = `
        input, textarea, select {
          font-size: 16px !important;
        }
        button {
          touch-action: manipulation;
        }
      `;
      document.head.appendChild(style);
      
      return () => {
        if (document.head.contains(style)) {
          document.head.removeChild(style);
        }
      };
    }
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

  // ===== ЗАГРУЗКА ИЗОБРАЖЕНИЙ =====
  useEffect(() => {
    const preloadImages = async () => {
      if (availableBackgrounds.length === 0 || availableBackgrounds[0] === null) {
        setImagesLoaded(true);
        return;
      }

      const promises = availableBackgrounds
        .filter(bg => bg !== null)
        .map(src => {
          return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = src;
          });
        });
      
      await Promise.all(promises);
      setImagesLoaded(true);
    };
    
    preloadImages();
  }, []);

  // ===== СМЕНА ФОНОВ =====
  useEffect(() => {
    if (!imagesLoaded || availableBackgrounds.length <= 1) return;

    const changeTimer = setTimeout(() => {
      setIsTransitioning(true);
      
      const nextIndex = (activeBackgroundIndex + 1) % availableBackgrounds.length;
      
      setBackgroundOpacities(prev => 
        prev.map((opacity, index) => 
          index === nextIndex ? 1 : index === activeBackgroundIndex ? 0 : 0
        )
      );
      
      setTimeout(() => {
        setActiveBackgroundIndex(nextIndex);
        setIsTransitioning(false);
      }, 2000);
      
    }, 15000); // Смена каждые 15 секунд

    return () => clearTimeout(changeTimer);
  }, [imagesLoaded, activeBackgroundIndex]);

  // ===== СТИЛИ =====
  const mainContainerStyle = {
    position: 'relative',
    width: '100%',
    height: `${viewportHeight}px`,
    minHeight: '100vh',
    overflow: 'hidden',
    fontFamily: '"Segoe UI", sans-serif'
  };

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
      zIndex: -1, // ВАЖНО: фон всегда сзади
      backgroundImage: backgroundSrc 
        ? `url(${backgroundSrc})` 
        : 'linear-gradient(135deg, rgb(180, 0, 55) 0%, rgb(153, 0, 55) 25%, rgb(152, 164, 174) 50%, rgb(118, 143, 146) 75%, rgb(0, 40, 130) 100%)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed',
      opacity: opacity,
      transition: isTransitioning ? 'opacity 2.0s ease-in-out' : 'none',
      pointerEvents: 'none' // ВАЖНО: фон не перехватывает события
    };
  };

  const contentContainerStyle = {
    position: 'relative',
    zIndex: 1, // ВАЖНО: контент всегда поверх фона
    width: '100%',
    height: '100%'
  };

  return (
    <ErrorBoundary>
      <div className="main-app-container" style={mainContainerStyle}>
        {/* ===== ФОНОВЫЕ СЛОИ ===== */}
        {availableBackgrounds.map((backgroundSrc, index) => (
          <div
            key={`background-${index}`}
            style={createBackgroundStyle(backgroundSrc, index)}
          />
        ))}
        
        {/* ===== ОСНОВНОЙ КОНТЕНТ ===== */}
        <AutoNavigator>
          <div style={contentContainerStyle} className="main-content-container">
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
              <Route path="*" element={<WelcomePage />} />
            </Routes>
          </div>
        </AutoNavigator>
      </div>
    </ErrorBoundary>
  );
}

export default MainApp;















