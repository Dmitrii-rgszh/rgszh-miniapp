// MainApp.js - ФИНАЛЬНАЯ ВЕРСИЯ БЕЗ ЛОГОВ
// ✅ Добавлена система рандомных CSS анимаций фонов
// ✅ Удалены все логи и отладочная информация
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

// ===== ИМПОРТ CSS АНИМАЦИЙ ФОНОВ =====
import './Styles/background-animations.css';

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

// ===== НАСТРОЙКИ РАНДОМНЫХ АНИМАЦИЙ =====
const ANIMATION_TYPES = ['ken-burns', 'floating', 'tilt-3d', 'breathing'];

// Функция для случайного выбора анимации (избегаем повторения)
const getRandomAnimationType = (excludeType = null) => {
  const availableTypes = excludeType 
    ? ANIMATION_TYPES.filter(type => type !== excludeType)
    : ANIMATION_TYPES;
  
  return availableTypes[Math.floor(Math.random() * availableTypes.length)];
};

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
  // ===== СОСТОЯНИЕ ДЛЯ ФОНОВ И РАНДОМНЫХ АНИМАЦИЙ =====
  const [activeBackgroundIndex, setActiveBackgroundIndex] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  const [backgroundOpacities, setBackgroundOpacities] = useState(
    availableBackgrounds.map((_, index) => index === 0 ? 1 : 0)
  );
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  
  // Состояние для рандомных анимаций каждого фона
  const [backgroundAnimations, setBackgroundAnimations] = useState(() => {
    // Инициализируем рандомными анимациями для каждого фона
    const animations = [];
    let previousAnimation = null;
    
    for (let i = 0; i < availableBackgrounds.length; i++) {
      const newAnimation = getRandomAnimationType(previousAnimation);
      animations.push(newAnimation);
      previousAnimation = newAnimation;
    }
    
    return animations;
  });

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

  // ===== УНИВЕРСАЛЬНЫЙ АВТОСКРОЛЛ =====
  useEffect(() => {
    const handleAutoScroll = (event) => {
      const element = event.target;
      const tagName = element.tagName.toUpperCase();
      
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(tagName)) {
        setTimeout(() => {
          const rect = element.getBoundingClientRect();
          const viewportHeight = window.innerHeight;
          const keyboardHeight = viewportHeight * 0.4;
          const visibleAreaBottom = viewportHeight - keyboardHeight;
          
          if (rect.bottom > visibleAreaBottom || rect.top < 100) {
            element.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center',
              inline: 'nearest' 
            });
          }
        }, 300);
      }
    };
    
    const handleSelectClick = (event) => {
      const element = event.target;
      if (element.tagName === 'SELECT' && /iPhone|iPad|iPod/.test(navigator.userAgent)) {
        setTimeout(() => {
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }, 100);
      }
    };
    
    document.addEventListener('focusin', handleAutoScroll, true);
    document.addEventListener('click', handleSelectClick, true);
    
    if ('ontouchstart' in window) {
      document.addEventListener('touchstart', handleSelectClick, { passive: true });
    }
    
    return () => {
      document.removeEventListener('focusin', handleAutoScroll, true);
      document.removeEventListener('click', handleSelectClick, true);
      document.removeEventListener('touchstart', handleSelectClick);
    };
  }, []);

  // ===== ГЛОБАЛЬНОЕ ИСПРАВЛЕНИЕ КЛИКАБЕЛЬНОСТИ =====
  useEffect(() => {
    const fixAllButtons = () => {
      const allButtons = document.querySelectorAll('button, [role="button"], .btn, .btn-universal, input[type="button"], input[type="submit"]');
      
      allButtons.forEach((button) => {
        if (button.dataset.globalFixed) return;
        
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
        
        button.dataset.globalFixed = 'true';
      });
    };

    const fixAllInputs = () => {
      const allInputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"], input[type="search"], textarea, .autosuggest-input, .react-autosuggest__input');
      
      allInputs.forEach((input) => {
        if (input.dataset.globalInputFixed) return;
        
        Object.assign(input.style, {
          userSelect: 'auto',
          WebkitUserSelect: 'auto',
          pointerEvents: 'auto',
          cursor: 'text',
          touchAction: 'manipulation',
          WebkitTouchCallout: 'auto',
          WebkitTapHighlightColor: 'rgba(255, 255, 255, 0.1)',
          position: 'relative',
          zIndex: '10',
          fontSize: '16px',
          transform: 'scale(1)',
        });
        
        input.dataset.globalInputFixed = 'true';
      });
    };

    const initialButtonTimer = setTimeout(fixAllButtons, 500);
    const initialInputTimer = setTimeout(fixAllInputs, 600);
    
    const observer = new MutationObserver((mutations) => {
      let hasNewButtons = false;
      let hasNewInputs = false;
      
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

            if (node.matches?.('input[type="text"], input[type="email"], input[type="password"], input[type="search"], textarea, .autosuggest-input, .react-autosuggest__input')) {
              hasNewInputs = true;
            } else if (node.querySelectorAll) {
              const newInputs = node.querySelectorAll('input[type="text"], input[type="email"], input[type="password"], input[type="search"], textarea, .autosuggest-input, .react-autosuggest__input');
              if (newInputs.length > 0) {
                hasNewInputs = true;
              }
            }
          }
        });
      });
      
      if (hasNewButtons) {
        setTimeout(fixAllButtons, 100);
      }
      
      if (hasNewInputs) {
        setTimeout(fixAllInputs, 150);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    const periodicButtonTimer = setInterval(fixAllButtons, 5000);
    const periodicInputTimer = setInterval(fixAllInputs, 5500);
    
    return () => {
      clearTimeout(initialButtonTimer);
      clearTimeout(initialInputTimer);
      clearInterval(periodicButtonTimer);
      clearInterval(periodicInputTimer);
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
      
      // Обновляем анимацию для следующего фона
      setBackgroundAnimations(prev => {
        const newAnimations = [...prev];
        // Получаем текущую анимацию активного фона, чтобы избежать повторения
        const currentAnimation = prev[activeBackgroundIndex];
        
        // При завершении полного цикла фонов - перемешиваем все анимации
        if (nextIndex === 0 && activeBackgroundIndex === availableBackgrounds.length - 1) {
          // Создаем новый набор уникальных анимаций
          const shuffledAnimations = [];
          let lastAnimation = currentAnimation;
          
          for (let i = 0; i < availableBackgrounds.length; i++) {
            const newAnim = getRandomAnimationType(lastAnimation);
            shuffledAnimations.push(newAnim);
            lastAnimation = newAnim;
          }
          
          return shuffledAnimations;
        }
        
        // Обычная смена анимации для следующего фона
        newAnimations[nextIndex] = getRandomAnimationType(currentAnimation);
        
        return newAnimations;
      });
      
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

  // ===== ФУНКЦИЯ ДЛЯ ПОЛУЧЕНИЯ CSS КЛАССОВ РАНДОМНОЙ АНИМАЦИИ =====
  const getAnimationClass = (index) => {
    const animationIndex = (index % 4) + 1; // Циклически от 1 до 4
    const animationType = backgroundAnimations[index] || 'ken-burns'; // Fallback
    
    return `${animationType}-${animationIndex}`;
  };

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
      zIndex: -1,
      backgroundImage: backgroundSrc 
        ? `url(${backgroundSrc})` 
        : 'linear-gradient(135deg, rgb(180, 0, 55) 0%, rgb(153, 0, 55) 25%, rgb(152, 164, 174) 50%, rgb(118, 143, 146) 75%, rgb(0, 40, 130) 100%)',
      opacity: opacity,
      transition: isTransitioning ? 'opacity 2.0s ease-in-out' : 'none',
      willChange: isTransitioning ? 'opacity' : 'auto',
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
        {/* ===== АНИМИРОВАННЫЕ ФОНОВЫЕ СЛОИ ===== */}
        {availableBackgrounds.map((backgroundSrc, index) => {
          const opacity = backgroundOpacities[index] || 0;
          const animationClass = getAnimationClass(index);
          
          const fullClassName = `background-layer ${animationClass} ${isTransitioning ? 'transitioning' : ''} ${opacity > 0 ? 'active' : ''} ${!backgroundSrc ? 'gradient-fallback' : ''}`;
          
          return (
            <div
              key={`background-${index}`}
              className={fullClassName}
              style={createBackgroundStyle(backgroundSrc, index)}
              data-bg-index={index}
              data-animation={animationClass}
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















