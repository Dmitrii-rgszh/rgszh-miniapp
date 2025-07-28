// MainApp.js - ИСПРАВЛЕННАЯ ВЕРСИЯ БЕЗ ЛИШНЕГО КОДА
// ✅ Добавлена система рандомных CSS анимаций фонов
// ✅ Убраны все неподходящие хуки и переменные
// ✅ Исправлено расположение хуков внутри компонента
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
  // ===== ХУКИ НАВИГАЦИИ =====
  const location = useLocation();
  
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

  // ===== TELEGRAM WEBAPP SUPPORT =====
  useEffect(() => {
    // Проверяем, запущено ли приложение в Telegram
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      
      // Расширяем приложение на весь экран
      tg.expand();
      
      // Устанавливаем цвет header bar
      tg.setHeaderColor('#B40037');
      
      // Готовность приложения
      tg.ready();
    }
  }, []);

  // ===== iOS SAFARI FIX =====
  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    if (isIOS) {
      // Добавляем специальные стили для iOS
      const style = document.createElement('style');
      style.textContent = `
        /* iOS Safari fixes */
        .next-btn, .back-btn {
          -webkit-transform: translate3d(0, 0, 0);
          transform: translate3d(0, 0, 0);
        }
        
        /* Предотвращаем масштабирование при двойном тапе */
        .next-btn, .back-btn, button {
          touch-action: manipulation;
        }
        
        /* Исправление для iOS клавиатуры */
        input, textarea, select {
          font-size: 16px !important;
        }
      `;
      document.head.appendChild(style);
      
      return () => {
        document.head.removeChild(style);
      };
    }
  }, []);

  // ===== МОБИЛЬНЫЙ CSS RESET =====
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      /* Мобильный reset для кнопок */
      @media (max-width: 768px) {
        .next-btn, .back-btn {
          -webkit-tap-highlight-color: transparent !important;
          -webkit-touch-callout: none !important;
          touch-action: manipulation !important;
          user-select: none !important;
          -webkit-user-select: none !important;
          position: absolute !important;
          z-index: 9999 !important;
        }
        
        /* Убираем возможные конфликты с background-layer */
        .background-layer {
          pointer-events: none !important;
          z-index: -10 !important;
        }
        
        /* Гарантируем видимость кнопок */
        .next-btn:not(.disabled), .back-btn:not(.disabled) {
          pointer-events: auto !important;
          cursor: pointer !important;
        }
        
        /* Убеждаемся, что контент не перекрывает кнопки */
        .main-content-container > div {
          position: relative !important;
          z-index: 1 !important;
        }
        
        /* SVG внутри кнопок не должны блокировать клики */
        .next-btn svg, .next-btn path, .next-btn div,
        .back-btn svg, .back-btn path, .back-btn div {
          pointer-events: none !important;
        }
      }
      
      /* Дополнительные стили для очень маленьких экранов */
      @media (max-width: 374px) {
        .next-btn, .back-btn {
          z-index: 10000 !important;
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

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
      const allButtons = document.querySelectorAll('button, [role="button"], .btn, .btn-universal, .next-btn, .back-btn, input[type="button"], input[type="submit"]');
      
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
        
        // Не трогаем отключенные кнопки
        if (button.classList.contains('disabled') || button.disabled) {
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
        
        // Специальная обработка для next-btn и back-btn
        if (button.classList.contains('next-btn') || button.classList.contains('back-btn')) {
          button.style.zIndex = '1000';
          button.style.position = 'absolute';
          
          // Дополнительные стили для мобильных устройств
          if (window.innerWidth <= 768) {
            button.style.touchAction = 'manipulation';
            button.style.WebkitTouchCallout = 'none';
            button.style.WebkitUserSelect = 'none';
            button.style.userSelect = 'none';
          }
        }
        
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

    // Специальная обработка для мобильных устройств
    const fixMobileButtons = () => {
      if (window.innerWidth <= 768) {
        const nextButtons = document.querySelectorAll('.next-btn');
        const backButtons = document.querySelectorAll('.back-btn');
        
        [...nextButtons, ...backButtons].forEach(button => {
          if (!button.classList.contains('disabled') && !button.disabled) {
            // Принудительно устанавливаем стили для мобильных
            button.style.cssText += `
              pointer-events: auto !important;
              z-index: 9999 !important;
              position: absolute !important;
              cursor: pointer !important;
              -webkit-tap-highlight-color: transparent !important;
              touch-action: manipulation !important;
            `;
            
            // Также убедимся, что SVG внутри кнопки не блокирует клики
            const svgs = button.querySelectorAll('svg, path, div');
            svgs.forEach(svg => {
              svg.style.pointerEvents = 'none';
            });
          }
        });
      }
    };

    // Предотвращение множественных кликов
    let lastClickTime = 0;
    const CLICK_DELAY = 300;
    
    // Дополнительная обработка событий для next и back кнопок
    const handleGlobalClick = (e) => {
      const now = Date.now();
      if (now - lastClickTime < CLICK_DELAY) {
        e.preventDefault();
        return;
      }
      
      const target = e.target.closest('.next-btn, .back-btn');
      if (target && !target.classList.contains('disabled') && !target.disabled) {
        lastClickTime = now;
        
        // Убедимся, что событие не заблокировано
        e.stopPropagation = () => {};
        
        // Для мобильных устройств - эмулируем клик если нужно
        if (window.innerWidth <= 768 && e.type === 'touchend') {
          e.preventDefault();
          const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
          });
          target.dispatchEvent(clickEvent);
        }
      }
    };
    
    // Специальная обработка для мобильных устройств
    const handleTouchStart = (e) => {
      const target = e.target.closest('.next-btn, .back-btn');
      if (target && !target.classList.contains('disabled') && !target.disabled) {
        // Добавляем визуальный отклик
        target.style.transform = 'scale(0.95)';
        target.style.opacity = '0.8';
      }
    };
    
    const handleTouchEnd = (e) => {
      const target = e.target.closest('.next-btn, .back-btn');
      if (target && !target.classList.contains('disabled') && !target.disabled) {
        // Убираем визуальный отклик
        setTimeout(() => {
          target.style.transform = '';
          target.style.opacity = '';
        }, 100);
      }
    };
    
    document.addEventListener('click', handleGlobalClick, true);
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    // Финальная проверка работоспособности кнопок
    const ensureButtonsWork = () => {
      const allNavigationButtons = document.querySelectorAll('.next-btn, .back-btn');
      
      allNavigationButtons.forEach(button => {
        if (!button.dataset.ensured) {
          button.dataset.ensured = 'true';
          
          // Добавляем резервный обработчик клика
          button.addEventListener('click', function(e) {
            if (!this.classList.contains('disabled') && !this.disabled) {
              // Кнопка должна обработать клик
            }
          }, { capture: true });
          
          // Добавляем резервный обработчик для touch
          button.addEventListener('touchend', function(e) {
            if (!this.classList.contains('disabled') && !this.disabled) {
              e.preventDefault();
              this.click();
            }
          }, { passive: false });
        }
      });
    };
    
    // Запускаем проверку периодически
    const ensureTimer = setInterval(ensureButtonsWork, 1000);
    
    // Немедленный первый запуск
    fixAllButtons();
    fixAllInputs();
    fixMobileButtons();
    ensureButtonsWork();
    
    const initialButtonTimer = setTimeout(() => {
      fixAllButtons();
      fixMobileButtons();
    }, 100);
    const initialInputTimer = setTimeout(fixAllInputs, 200);
    
    const observer = new MutationObserver((mutations) => {
      let hasNewButtons = false;
      let hasNewInputs = false;
      
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            if (node.matches?.('button, [role="button"], .btn, .btn-universal, .next-btn, .back-btn, input[type="button"], input[type="submit"]')) {
              hasNewButtons = true;
            } else if (node.querySelectorAll) {
              const newButtons = node.querySelectorAll('button, [role="button"], .btn, .btn-universal, .next-btn, .back-btn, input[type="button"], input[type="submit"]');
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
        setTimeout(() => {
          fixAllButtons();
          fixMobileButtons();
        }, 50);
      }
      
      if (hasNewInputs) {
        setTimeout(fixAllInputs, 100);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    const periodicButtonTimer = setInterval(() => {
      fixAllButtons();
      fixMobileButtons();
    }, 2000);
    const periodicInputTimer = setInterval(fixAllInputs, 2500);
    
    // Обработчик изменения размера окна
    const handleResize = () => {
      fixMobileButtons();
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    return () => {
      clearTimeout(initialButtonTimer);
      clearTimeout(initialInputTimer);
      clearInterval(periodicButtonTimer);
      clearInterval(periodicInputTimer);
      clearInterval(ensureTimer);
      observer.disconnect();
      document.removeEventListener('click', handleGlobalClick, true);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [location]);

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
    fontFamily: '"Segoe UI", sans-serif',
    // Убедимся, что контейнер не блокирует события
    pointerEvents: 'auto'
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
    height: '100%',
    pointerEvents: 'auto' // Убедимся, что контент принимает события
  };

  return (
    <ErrorBoundary>
      <div className="main-app-container" style={mainContainerStyle}>
        {/* ===== АНИМИРОВАННЫЕ ФОНОВЫЕ СЛОИ ===== */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: -10, pointerEvents: 'none' }}>
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
        </div>
        
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















