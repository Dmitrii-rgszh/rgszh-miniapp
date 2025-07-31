// MainApp.js - С ФОНОМ
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Импорт CSS
import './Styles/containers.css';

// Импорт фонового изображения
import backgroundImage from './components/background/background2.png';

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
        {/* Фоновое изображение */}
        <div 
          className="app-background"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            zIndex: -1,
            pointerEvents: 'none'
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















