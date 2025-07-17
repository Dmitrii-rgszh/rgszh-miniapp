import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Импорт глобальной Pi иконки
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

function MainApp() {
  // Состояние для динамической высоты viewport (исправление Safari)
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);

  // Обработчик изменения размера окна для Safari и мобильных браузеров
  useEffect(() => {
    const updateHeight = () => {
      setViewportHeight(window.innerHeight);
    };

    // Добавляем обработчики событий
    window.addEventListener('resize', updateHeight);
    window.addEventListener('orientationchange', updateHeight);

    // Очистка при размонтировании
    return () => {
      window.removeEventListener('resize', updateHeight);
      window.removeEventListener('orientationchange', updateHeight);
    };
  }, []);

  // ===== ГЛОБАЛЬНЫЕ СТИЛИ ФОНА =====
  const globalBackgroundStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: `${viewportHeight}px`,
    zIndex: -1,
    
    // Основной градиент с корпоративными цветами
    background: `
      linear-gradient(135deg, 
        rgb(180, 0, 55) 0%,     /* Основной красный */
        rgb(153, 0, 55) 25%,    /* Темный красный */
        rgb(152, 164, 174) 50%, /* Основной серый */
        rgb(118, 143, 146) 75%, /* Темный серый */
        rgb(0, 40, 130) 100%    /* Основной синий */
      )
    `,
    backgroundSize: '400% 400%',
    
    // Анимация градиента
    animation: 'gradientShift 15s ease infinite',
    
    // Дополнительные эффекты
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: `
        radial-gradient(circle at 20% 80%, rgba(180, 0, 55, 0.3) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(0, 40, 130, 0.3) 0%, transparent 50%),
        radial-gradient(circle at 40% 40%, rgba(152, 164, 174, 0.2) 0%, transparent 50%)
      `,
      pointerEvents: 'none'
    }
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
    zIndex: 1
  };

  // Глобальная Pi иконка (анимируется постоянно)
  const globalPiStyle = {
    position: 'fixed',
    width: '50px',
    height: '50px',
    opacity: 0.6,
    zIndex: 10, // Поверх всего контента, но под модальными окнами
    animation: 'globalPiMove 80s linear infinite, globalPiRotate 8s linear infinite',
    filter: 'drop-shadow(0 2px 8px rgba(255, 255, 255, 0.3))',
    pointerEvents: 'none', // Не мешает кликам
    transition: 'opacity 0.3s ease'
  };

  return (
    <ErrorBoundary>
      {/* Глобальные стили для всего документа */}
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
          
          /* Анимация градиента */
          @keyframes gradientShift {
            0% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
            100% {
              background-position: 0% 50%;
            }
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
          
          /* Скрытие скроллбаров для Safari */
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

      {/* Глобальный фон */}
      <div style={globalBackgroundStyle}></div>
      
      {/* Глобальная Pi иконка */}
      <img 
        src={piImage} 
        alt="Pi" 
        style={globalPiStyle}
      />
      
      {/* Основной контейнер приложения */}
      <div style={appContainerStyle}>
        <div style={contentWrapperStyle}>
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
      </div>
    </ErrorBoundary>
  );
}

export default MainApp;















