// MainApp.js - ПРОСТАЯ ВЕРСИЯ С WEBP
// ✅ Один размер WebP для всех устройств
// ✅ Автоматический fallback на PNG
// ✅ Простая и быстрая загрузка

import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';

// Импорт CSS для фонов
import './Styles/backgrounds.css';

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

// ===== КОНФИГУРАЦИЯ =====
const BACKGROUNDS_CONFIG = {
  backgrounds: ['1', '2', '3', '4'],
  changeInterval: 15000, // 15 секунд
  transitionDuration: 2000 // 2 секунды на переход
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

// ===== КОМПОНЕНТ УПРАВЛЕНИЯ ФОНАМИ =====
function BackgroundManager() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const { backgrounds, changeInterval, transitionDuration } = BACKGROUNDS_CONFIG;

  // Детекция поддержки WebP
  useEffect(() => {
    const checkWebP = () => {
      const webP = new Image();
      webP.onload = webP.onerror = function () {
        const isSupported = webP.height === 2;
        document.documentElement.classList.add(isSupported ? 'webp' : 'no-webp');
        console.log(`🎨 WebP поддержка: ${isSupported ? 'Да ✅' : 'Нет ❌ (используем PNG)'}`);
      };
      webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    };
    
    checkWebP();
  }, []);

  // Проверка загрузки первого фона
  useEffect(() => {
    const isWebP = document.documentElement.classList.contains('webp');
    const extension = isWebP ? '.webp' : '.png';
    const imagePath = `/components/background/background1${extension}`;
    
    const testImg = new Image();
    
    testImg.onload = () => {
      setIsLoaded(true);
      const skeleton = document.querySelector('.backgrounds-skeleton');
      if (skeleton) {
        skeleton.classList.add('loaded');
      }
      console.log(`✅ Первый фон загружен: background1${extension}`);
    };
    
    testImg.onerror = () => {
      console.warn(`❌ Не удалось загрузить фон, используем градиент`);
      setIsLoaded(true);
      const firstLayer = document.querySelector('.background-layer');
      if (firstLayer) {
        firstLayer.classList.add('gradient-fallback');
      }
    };
    
    // Небольшая задержка для определения WebP
    setTimeout(() => {
      testImg.src = imagePath;
    }, 100);
  }, []);

  // Смена фонов
  useEffect(() => {
    if (!isLoaded || backgrounds.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex(prevIndex => {
        const nextIndex = (prevIndex + 1) % backgrounds.length;
        
        // Обновляем классы для анимации
        const layers = document.querySelectorAll('.background-layer');
        
        // Убираем active у всех
        layers.forEach(layer => {
          layer.classList.remove('active', 'transitioning');
        });
        
        // Текущий слой остается видимым во время перехода
        if (layers[prevIndex]) {
          layers[prevIndex].classList.add('active');
        }
        
        // Новый слой начинает появляться
        if (layers[nextIndex]) {
          layers[nextIndex].classList.add('transitioning');
          
          // Через небольшую задержку делаем его активным
          setTimeout(() => {
            layers[nextIndex].classList.add('active');
            layers[nextIndex].classList.remove('transitioning');
            
            // Убираем старый слой после завершения анимации
            setTimeout(() => {
              if (layers[prevIndex]) {
                layers[prevIndex].classList.remove('active');
              }
            }, transitionDuration);
          }, 50);
        }
        
        console.log(`🔄 Смена фона: ${prevIndex + 1} → ${nextIndex + 1}`);
        return nextIndex;
      });
    }, changeInterval);

    return () => clearInterval(interval);
  }, [isLoaded, backgrounds, changeInterval, transitionDuration]);

  return (
    <>
      {/* Skeleton loader */}
      <div className="backgrounds-skeleton" />
      
      {/* Контейнер для фонов */}
      <div className="backgrounds-container">
        {backgrounds.map((bg, index) => (
          <div
            key={`bg-${bg}`}
            className={`background-layer ${index === 0 ? 'active' : ''}`}
            data-bg={bg}
          />
        ))}
      </div>
    </>
  );
}

// ===== ГЛАВНЫЙ КОМПОНЕНТ =====
function MainApp() {
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);

  // Обработка изменения размера окна (для Safari iOS)
  useEffect(() => {
    const handleResize = () => {
      setViewportHeight(window.innerHeight);
    };

    const handleOrientationChange = () => {
      setTimeout(handleResize, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  // Стили контейнера
  const mainContainerStyle = {
    position: 'relative',
    width: '100%',
    height: `${viewportHeight}px`,
    minHeight: '100vh',
    overflow: 'hidden',
    fontFamily: '"Segoe UI", sans-serif'
  };

  const contentContainerStyle = {
    position: 'relative',
    zIndex: 10,
    width: '100%',
    height: '100%'
  };

  return (
    <ErrorBoundary>
      <div className="main-app-container" style={mainContainerStyle}>
        {/* Управление фонами */}
        <BackgroundManager />
        
        {/* Основной контент */}
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














