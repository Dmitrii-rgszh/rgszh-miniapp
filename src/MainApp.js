// MainApp.js - С ФОНОМ
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Импорт CSS
import './Styles/containers.css';
import './Styles/ios-safari-fixes.css';

// Импорт фонового изображения
import backgroundImage from './components/background/background2.jpg';

// Импорты компонентов
import MainMenu        from './MainMenu';
import PollsPage       from './PollsPage';
import SNPPage         from './SNPPage';
import EmployeePage    from './EmployeePage';
import AssessmentPage  from './AssessmentPage';
import FeedbackPage    from './FeedbackPage';
import JustincasePage  from './JustincasePage';
import CareFuturePage  from './CareFuturePage';
import MarzaPollPage   from './MarzaPollPage';

function MainApp() {
  return (
    <BrowserRouter>
      <div className="main-app-container">
        {/* Фоновое изображение с ПРИНУДИТЕЛЬНЫМ полным покрытием */}
        <div 
          className="app-background"
          style={{
            position: 'fixed',
            top: 'calc(-20px - env(safe-area-inset-top, 0))',
            left: 'calc(-20px - env(safe-area-inset-left, 0))',
            right: 'calc(-20px - env(safe-area-inset-right, 0))',
            bottom: 'calc(-50px - env(safe-area-inset-bottom, 0))',
            width: 'calc(100vw + 40px + env(safe-area-inset-left, 0) + env(safe-area-inset-right, 0))',
            height: 'calc(100vh + 70px + env(safe-area-inset-top, 0) + env(safe-area-inset-bottom, 0))',
            marginTop: 'calc(-20px - env(safe-area-inset-top, 0))',
            marginBottom: 'calc(-50px - env(safe-area-inset-bottom, 0))',
            marginLeft: 'calc(-20px - env(safe-area-inset-left, 0))',
            marginRight: 'calc(-20px - env(safe-area-inset-right, 0))',
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            zIndex: -1,
            pointerEvents: 'none',
            overflow: 'hidden',
            transform: 'scale(1.2)',
            transformOrigin: 'center center'
          }}
        />
        
        {/* Основной контент */}
        <div className="main-content-container">
          <Routes>
            <Route path="/" element={<MainMenu />} />
            <Route path="/main-menu" element={<MainMenu />} />
            <Route path="/polls" element={<PollsPage />} />
            <Route path="/employee" element={<EmployeePage />} />
            <Route path="/snp" element={<SNPPage />} />
            <Route path="/assessment" element={<AssessmentPage />} />
            <Route path="/feedback" element={<FeedbackPage />} />
            <Route path="/justincase" element={<JustincasePage />} />
            <Route path="/care-future" element={<CareFuturePage />} />
            <Route path="/marza-poll" element={<MarzaPollPage />} />
            <Route path="*" element={<MainMenu />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default MainApp;















