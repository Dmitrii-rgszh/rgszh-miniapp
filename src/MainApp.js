// MainApp.js - ИСПРАВЛЕННАЯ ВЕРСИЯ С HASHROUTER
import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';

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

// Импортируем CSS для фонов
import './Styles/backgrounds.css';

// ===== ERROR BOUNDARY =====
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  
  static getDerivedStateFromError(error) {
    return { error };
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
          background: 'linear-gradient(135deg, rgb(180, 0, 55) 0%, rgb(0, 40, 130) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontFamily: '"Segoe UI", sans-serif',
          padding: '20px',
          textAlign: 'center'
        }}>
          <div>
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
    // ✅ ИСПРАВЛЕНО: правильная проверка для HashRouter
    const isRootPath = location.pathname === '/' || location.pathname === '';
    
    if (isRootPath) {
      const timer = setTimeout(() => {
        navigate('/main-menu'); // HashRouter автоматически добавит #
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [location.pathname, navigate]);
  
  return children;
}

// ===== ВНУТРЕННИЙ КОМПОНЕНТ С РОУТАМИ =====
function AppRoutes() {
  return (
    <AutoNavigator>
      <div className="main-content-container">
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
  );
}

// ===== ГЛАВНЫЙ КОМПОНЕНТ =====
function MainApp() {
  // ===== TELEGRAM WEBAPP =====
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.expand();
      tg.setHeaderColor('#B40037');
      tg.ready();
      
      // ✅ ДОБАВЛЯЕМ: отключаем back button Telegram
      tg.BackButton.hide();
      
      console.log('📱 Telegram WebApp initialized with HashRouter');
    }
  }, []);

  // ===== iOS FIX =====
  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    if (isIOS) {
      const style = document.createElement('style');
      style.textContent = `
        input, textarea, select { font-size: 16px !important; }
        button { touch-action: manipulation; }
        * { -webkit-tap-highlight-color: transparent; }
      `;
      document.head.appendChild(style);
      
      return () => {
        if (document.head.contains(style)) {
          document.head.removeChild(style);
        }
      };
    }
  }, []);

  // ===== HASHROUTER FIX =====
  useEffect(() => {
    // Убираем конфликтующие обработчики navigation
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    // Логируем все изменения роутинга для отладки
    window.addEventListener('hashchange', (e) => {
      console.log('🔄 Hash changed:', window.location.hash);
    });
    
    return () => {
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, []);

  return (
    <ErrorBoundary>
      <HashRouter>
        <div className="main-app-container">
          {/* ===== ФОНОВЫЕ СЛОИ ЧЕРЕЗ CSS ===== */}
          <div className="backgrounds-container">
            <div className="background-layer active gradient-fallback" />
            <div className="background-layer" data-bg="1" />
            <div className="background-layer" data-bg="2" />
            <div className="background-layer" data-bg="3" />
            <div className="background-layer" data-bg="4" />
          </div>
          
          {/* ===== ОСНОВНОЙ КОНТЕНТ ===== */}
          <AppRoutes />
        </div>
      </HashRouter>
    </ErrorBoundary>
  );
}

export default MainApp;















