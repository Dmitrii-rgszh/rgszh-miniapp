// MainApp.js - ФИНАЛЬНАЯ ВЕРСИЯ БЕЗ ОТЛАДКИ
// ✅ Исправлена логика автонавигации
// ✅ Убраны все логи и тестовые элементы
// ✅ Готовая к продакшену версия

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

// Background 1
try {
  backgroundImage1 = require('./components/background/background1.webp');
} catch (error) {
  backgroundImage1 = null;
}

// Background 2
try {
  backgroundImage2 = require('./components/background/background2.webp');
} catch (error) {
  backgroundImage2 = null;
}

// Background 3
try {
  backgroundImage3 = require('./components/background/background3.webp');
} catch (error) {
  backgroundImage3 = null;
}

// Background 4
try {
  backgroundImage4 = require('./components/background/background4.webp');
} catch (error) {
  backgroundImage4 = null;
}

// Массив доступных фонов
const availableBackgrounds = [
  backgroundImage1,
  backgroundImage2,
  backgroundImage3,
  backgroundImage4
].filter(Boolean);

// Если нет изображений - используем корпоративный градиент
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

  // ===== RESIZE HANDLING =====
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

  // ===== ГЛОБАЛЬНОЕ ИСПРАВЛЕНИЕ КЛИКАБЕЛЬНОСТИ КНОПОК =====
  useEffect(() => {
    const fixAllButtons = () => {
      const allButtons = document.querySelectorAll('button, [role="button"], .btn, .btn-universal, input[type="button"], input[type="submit"]');
      
      allButtons.forEach((button) => {
        if (button.dataset.globalFixed) return;
        
        // ИСКЛЮЧАЕМ autosuggest input поля
        if (button.classList.contains('autosuggest-input') || 
            button.classList.contains('react-autosuggest__input') ||
            button.type === 'text' || 
            button.type === 'email' || 
            button.type === 'password' ||
            button.tagName.toLowerCase() === 'input') {
          return;
        }
        
        Object.assign(button.style, {
          userSelect: 'auto',
          WebkitUserSelect: 'auto',
          pointerEvents: 'auto',
          cursor: 'pointer',
          touchAction: 'manipulation',
          WebkitTouchCallout: 'auto',
          WebkitTapHighlightColor: 'rgba(255, 255, 255, 0.2)'
        });
        
        const originalOnClick = button.onclick;
        const originalOnTouchEnd = button.ontouchend;
        
        const universalClickHandler = (e) => {
          if (originalOnClick && typeof originalOnClick === 'function') {
            originalOnClick.call(button, e);
          }
          
          const reactProps = Object.keys(button).find(key => key.startsWith('__reactProps') || key.startsWith('__reactInternalInstance'));
          if (reactProps && button[reactProps]?.onClick) {
            button[reactProps].onClick(e);
          }
        };
        
        const touchHandler = (e) => {
          if (originalOnTouchEnd && typeof originalOnTouchEnd === 'function') {
            originalOnTouchEnd.call(button, e);
            return;
          }
          
          setTimeout(() => {
            button.click();
          }, 50);
        };
        
        button.addEventListener('click', universalClickHandler, { passive: false });
        button.addEventListener('touchend', touchHandler, { passive: false });
        button.addEventListener('pointerup', universalClickHandler, { passive: false });
        
        button.dataset.globalFixed = 'true';
      });
    };
    
    const initialTimer = setTimeout(fixAllButtons, 500);
    
    const observer = new MutationObserver((mutations) => {
      let hasNewButtons = false;
      
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            if (node.matches?.('button, [role="button"], .btn, .btn-universal, input[type="button"], input[type="submit"]')) {
              hasNewButtons = true;
            } else if (node.querySelectorAll) {
              const newButtons = node.querySelectorAll('button, [role="button"], .btn, .btn-universal, input[type="button"], input[type="submit"]');
              if (newButtons.length > 0) {
                hasNewButtons = true;
              }
            }
          }
        });
      });
      
      if (hasNewButtons) {
        setTimeout(fixAllButtons, 100);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    const periodicTimer = setInterval(fixAllButtons, 5000);
    
    return () => {
      clearTimeout(initialTimer);
      clearInterval(periodicTimer);
      observer.disconnect();
    };
  }, []);

  // ===== ЗАГРУЗКА И СМЕНА ФОНОВ =====
  useEffect(() => {
    const preloadImages = async () => {
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
      
    }, 15000);

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
      zIndex: -1,
      backgroundImage: backgroundSrc 
        ? `url(${backgroundSrc})` 
        : 'linear-gradient(135deg, rgb(180, 0, 55) 0%, rgb(153, 0, 55) 25%, rgb(152, 164, 174) 50%, rgb(118, 143, 146) 75%, rgb(0, 40, 130) 100%)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed',
      opacity: opacity,
      transition: isTransitioning ? 'opacity 2.0s ease-in-out' : 'none',
      willChange: isTransitioning ? 'opacity' : 'auto',
      transform: 'translateZ(0)',
      pointerEvents: 'none'
    };
  };

  const contentContainerStyle = {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    height: '100%'
  };

  return (
    <ErrorBoundary>
      <div className="main-app-container" style={mainContainerStyle}>
        {/* ===== ФОНОВЫЕ СЛОИ ===== */}
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
        
        {/* ===== ОСНОВНОЙ КОНТЕНТ ===== */}
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
              <Route path="*" element={<WelcomePage />} />
            </Routes>
          </div>
        </AutoNavigator>
      </div>
    </ErrorBoundary>
  );
}

export default MainApp;














