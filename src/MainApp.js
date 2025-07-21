// MainApp.js - ЧИСТАЯ ВЕРСИЯ
// ✅ ТОЛЬКО смена фонов в MainApp.js
// ✅ ВСЕ остальные стили - через CSS файлы

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

// ===== ИМПОРТ ФОНОВЫХ ИЗОБРАЖЕНИЙ =====
let backgroundImage1, backgroundImage2, backgroundImage3, backgroundImage4, defaultBackground;

try {
  defaultBackground = require('./components/background.png');
} catch (error) {
  console.warn('Default background not found');
  defaultBackground = null;
}

try {
  backgroundImage1 = require('./components/background/background1.png');
} catch (error) {
  try {
    backgroundImage1 = require('./components/background/background (1).png');
  } catch (error2) {
    backgroundImage1 = null;
  }
}

try {
  backgroundImage2 = require('./components/background/background2.png');
} catch (error) {
  try {
    backgroundImage2 = require('./components/background/background (2).png');
  } catch (error2) {
    backgroundImage2 = null;
  }
}

try {
  backgroundImage3 = require('./components/background/background3.png');
} catch (error) {
  try {
    backgroundImage3 = require('./components/background/background (3).png');
  } catch (error2) {
    backgroundImage3 = null;
  }
}

try {
  backgroundImage4 = require('./components/background/background4.png');
} catch (error) {
  try {
    backgroundImage4 = require('./components/background/background (4).png');
  } catch (error2) {
    backgroundImage4 = null;
  }
}

// Массив доступных фонов
const availableBackgrounds = [
  defaultBackground,
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
        <div className="error-boundary">
          <h2>Произошла ошибка</h2>
          <pre>{this.state.error.toString()}</pre>
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

    availableBackgrounds.forEach((imageSrc, index) => {
      if (!imageSrc) {
        loadedCount++;
        if (loadedCount === totalImages) {
          setImagesLoaded(true);
        }
        return;
      }

      const img = new Image();
      img.onload = () => {
        loadedCount++;
        if (loadedCount === totalImages) {
          setImagesLoaded(true);
        }
      };
      img.onerror = () => {
        loadedCount++;
        if (loadedCount === totalImages) {
          setImagesLoaded(true);
        }
      };
      img.src = imageSrc;
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

  // ===== СМЕНА ФОНОВ КАЖДЫЕ 30 СЕКУНД =====
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
      
    }, 30000);

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

  // Стили фоновых слоев
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
      zIndex: opacity > 0 ? 1 : 0,
      
      // Фон: изображение или корпоративный градиент
      backgroundImage: backgroundSrc 
        ? `url(${backgroundSrc})` 
        : 'linear-gradient(135deg, rgb(180, 0, 55) 0%, rgb(153, 0, 55) 25%, rgb(152, 164, 174) 50%, rgb(118, 143, 146) 75%, rgb(0, 40, 130) 100%)',
      
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed',
      
      // Плавный переход
      opacity: opacity,
      transition: isTransitioning ? 'opacity 2.0s ease-in-out' : 'none',
      
      // Оптимизация
      willChange: isTransitioning ? 'opacity' : 'auto',
      transform: 'translateZ(0)',
      pointerEvents: 'none'
    };
  };

  // Контейнер контента - минимальные стили
  const contentContainerStyle = {
    position: 'relative',
    zIndex: 10,
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
            className="background-layer"
            style={createBackgroundStyle(backgroundSrc, index)}
          />
        ))}
        
        {/* ===== ОСНОВНОЙ КОНТЕНТ ===== */}
        <Router>
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
              </Routes>
            </div>
          </AutoNavigator>
        </Router>
      </div>
    </ErrorBoundary>
  );
}

export default MainApp;














