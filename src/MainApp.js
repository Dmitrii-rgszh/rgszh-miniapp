import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

// ✅ ИМПОРТЫ ГЛОБАЛЬНЫХ ФОНОВ
import backgroundImage1 from './components/background1.png';
import backgroundImage2 from './components/background2.png';
import backgroundImage3 from './components/background3.png';
import piImage from './components/pi.png';

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
import ThankYouPage    from './ThankYouPage';

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
          color: 'white',
          fontFamily: '"Segoe UI", sans-serif',
          background: 'linear-gradient(135deg, rgb(180, 0, 55) 0%, rgb(0, 40, 130) 100%)',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column'
        }}>
          <h2 style={{ fontFamily: '"Segoe UI", sans-serif', fontWeight: 'bold' }}>Произошла ошибка</h2>
          <pre style={{ fontFamily: '"Segoe UI", sans-serif', fontWeight: 'normal' }}>
            {this.state.error.toString()}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

// ✅ ГЛАВНЫЙ КОМПОНЕНТ С ГЛОБАЛЬНОЙ ЛОГИКОЙ ФОНОВ
function AppContent() {
  const location = useLocation();
  
  // Состояние для динамической высоты viewport
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  
  // ✅ ГЛОБАЛЬНАЯ ЛОГИКА ФОНОВ
  const [currentBgIndex, setCurrentBgIndex] = useState(0);
  const [auroraOffset, setAuroraOffset] = useState(0);
  
  // ✅ МАССИВ ФОНОВ (один раз, для всего приложения)
  const backgrounds = [
    backgroundImage1,
    backgroundImage2,
    backgroundImage3
  ];

  // ✅ АВТОСМЕНА ФОНОВ каждые 10 секунд (глобально)
  useEffect(() => {
    const bgInterval = setInterval(() => {
      setCurrentBgIndex(prev => (prev + 1) % backgrounds.length);
      console.log('🎨 Смена фона:', (currentBgIndex + 1) % backgrounds.length);
    }, 10000); // 10 секунд

    return () => clearInterval(bgInterval);
  }, [backgrounds.length, currentBgIndex]);

  // ✅ AURORA АНИМАЦИЯ (глобально)
  useEffect(() => {
    const auroraInterval = setInterval(() => {
      setAuroraOffset(prev => (prev + 1) % 100);
    }, 150); // Каждые 150мс

    return () => clearInterval(auroraInterval);
  }, []);

  // Обработчик изменения размера окна для Safari
  useEffect(() => {
    const updateHeight = () => {
      setViewportHeight(window.innerHeight);
    };

    window.addEventListener('resize', updateHeight);
    window.addEventListener('orientationchange', updateHeight);

    return () => {
      window.removeEventListener('resize', updateHeight);
      window.removeEventListener('orientationchange', updateHeight);
    };
  }, []);

  // ✅ ГЛОБАЛЬНЫЙ ФОН с анимированными картинками
  const globalBackgroundStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: `${viewportHeight}px`,
    zIndex: -1,
    overflow: 'hidden'
  };

  // ✅ СТИЛЬ ФОНОВОЙ КАРТИНКИ
  const backgroundImageStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    transition: 'opacity 2s ease-in-out', // Плавный crossfade
  };

  // ✅ AURORA OVERLAY с корпоративными цветами
  const auroraOverlayStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: `
      radial-gradient(circle at ${20 + auroraOffset * 0.3}% ${30 + auroraOffset * 0.2}%, 
        rgba(180, 0, 55, 0.4) 0%,      /* Корпоративный красный */
        rgba(153, 0, 55, 0.3) 25%,     /* Темный красный */ 
        rgba(0, 40, 130, 0.4) 50%,     /* Корпоративный синий */
        rgba(0, 32, 104, 0.3) 75%,     /* Темный синий */
        transparent 100%),
      radial-gradient(circle at ${80 - auroraOffset * 0.2}% ${70 - auroraOffset * 0.4}%, 
        rgba(152, 164, 174, 0.3) 0%,   /* Корпоративный серый */
        rgba(118, 143, 146, 0.4) 30%,  /* Темный серый */
        rgba(180, 0, 55, 0.3) 60%,     /* Красный снова */
        transparent 100%),
      linear-gradient(135deg, 
        rgba(180, 0, 55, 0.2) 0%,      /* Красный оверлей */
        rgba(0, 40, 130, 0.3) 50%,     /* Синий оверлей */ 
        rgba(152, 164, 174, 0.2) 100%) /* Серый оверлей */
    `,
    mixBlendMode: 'overlay',
    pointerEvents: 'none',
    zIndex: 1
  };

  // Контейнер приложения
  const appContainerStyle = {
    position: 'relative',
    width: '100%',
    height: `${viewportHeight}px`,
    overflow: 'hidden',
    
    // Шрифты по умолчанию
    fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
    fontWeight: 'normal',
    color: 'white',
    
    // Сглаживание текста
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
    textRendering: 'optimizeLegibility'
  };

  // Обертка контента
  const contentWrapperStyle = {
    position: 'relative',
    width: '100%',
    height: '100%',
    zIndex: 10 // Поверх фонов
  };

  // Глобальная Pi иконка
  const globalPiStyle = {
    position: 'fixed',
    width: '50px',
    height: '50px',
    opacity: 0.6,
    zIndex: 15, // Поверх всего контента
    animation: 'globalPiMove 80s linear infinite, globalPiRotate 8s linear infinite',
    filter: 'drop-shadow(0 2px 8px rgba(255, 255, 255, 0.3))',
    pointerEvents: 'none',
    transition: 'opacity 0.3s ease'
  };

  // ✅ ФУНКЦИЯ ДЛЯ РУЧНОЙ СМЕНЫ ФОНА (экспорт через контекст если нужно)
  const changeBg = (index) => {
    if (index >= 0 && index < backgrounds.length) {
      setCurrentBgIndex(index);
      console.log('🎨 Ручная смена фона на:', index);
    }
  };

  return (
    <>
      {/* Глобальные стили */}
      <style>
        {`
          /* Сброс и базовые стили */
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          html, body, #root {
            width: 100%;
            height: 100%;
            overflow-x: hidden;
          }
          
          /* Специально для Safari iOS */
          @supports (-webkit-touch-callout: none) {
            html, body, #root {
              height: -webkit-fill-available;
            }
          }
          
          /* Шрифты */
          body, input, textarea, button, select {
            font-family: "Segoe UI", -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
            font-weight: normal;
          }
          
          h1, h2, h3, h4, h5, h6 {
            font-family: "Segoe UI", -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
            font-weight: bold;
          }
          
          /* Глобальная анимация Pi элемента */
          @keyframes globalPiMove {
            0% { 
              left: -60px; 
              top: 15%; 
            }
            20% { 
              left: 20%; 
              top: 10%; 
            }
            40% { 
              left: calc(100% - 60px); 
              top: 25%; 
            }
            60% { 
              left: 80%; 
              top: 75%; 
            }
            80% { 
              left: 15%; 
              top: 85%; 
            }
            100% { 
              left: -60px; 
              top: 15%; 
            }
          }
          
          @keyframes globalPiRotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          /* Плавные переходы для фонов */
          .bg-transition {
            transition: opacity 2s ease-in-out;
          }
          
          /* Скрытие скроллбаров */
          ::-webkit-scrollbar {
            display: none;
          }
          
          /* Исправление для мобильного Safari */
          body {
            position: fixed;
            width: 100%;
            height: 100%;
          }
          
          /* Сглаживание анимаций */
          * {
            -webkit-transform: translate3d(0, 0, 0);
            transform: translate3d(0, 0, 0);
          }
          
          /* Отключение выделения текста на некоторых элементах */
          .no-select {
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
          }
        `}
      </style>

      {/* ✅ ГЛОБАЛЬНЫЙ ФОН С ТРЕМЯ КАРТИНКАМИ */}
      <div style={globalBackgroundStyle}>
        {/* Рендерим все 3 фона, показываем только текущий */}
        {backgrounds.map((bg, index) => (
          <div
            key={index}
            style={{
              ...backgroundImageStyle,
              backgroundImage: `url(${bg})`,
              opacity: index === currentBgIndex ? 1 : 0,
              zIndex: index === currentBgIndex ? 1 : 0
            }}
            className="bg-transition"
          />
        ))}
        
        {/* ✅ AURORA OVERLAY поверх фонов */}
        <div style={auroraOverlayStyle} />
      </div>
      
      {/* ✅ ГЛОБАЛЬНАЯ PI ИКОНКА */}
      <img 
        src={piImage} 
        alt="Pi" 
        style={globalPiStyle}
      />
      
      {/* ✅ ИНДИКАТОРЫ ФОНОВ (опционально, для дебага) */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        display: 'flex',
        gap: '8px',
        zIndex: 20,
        background: 'rgba(0, 0, 0, 0.3)',
        padding: '8px',
        borderRadius: '12px',
        backdropFilter: 'blur(10px)'
      }}>
        {backgrounds.map((_, index) => (
          <div
            key={index}
            onClick={() => changeBg(index)}
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: index === currentBgIndex 
                ? 'rgba(180, 0, 55, 1)' 
                : 'rgba(255, 255, 255, 0.4)',
              border: index === currentBgIndex 
                ? '2px solid white' 
                : '1px solid rgba(255, 255, 255, 0.2)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: index === currentBgIndex 
                ? '0 0 10px rgba(180, 0, 55, 0.8)' 
                : 'none'
            }}
            title={`Фон ${index + 1}`}
          />
        ))}
      </div>
      
      {/* Основной контейнер приложения */}
      <div style={appContainerStyle}>
        <div style={contentWrapperStyle}>
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
            <Route path="/thankyou"   element={<ThankYouPage />} />
          </Routes>
        </div>
      </div>
    </>
  );
}

function MainApp() {
  return (
    <ErrorBoundary>
      <Router>
        <AppContent />
      </Router>
    </ErrorBoundary>
  );
}

export default MainApp;















