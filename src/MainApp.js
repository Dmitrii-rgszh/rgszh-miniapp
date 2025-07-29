// MainApp.js - УПРОЩЕННАЯ ВЕРСИЯ - только роутинг и градиент
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Импорт CSS для градиентного фона
import './Styles/containers.css';

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

// ===== ГЛАВНЫЙ КОМПОНЕНТ =====
function MainApp() {
  return (
    <BrowserRouter>
      <div className="main-app-container">
        {/* Градиентный фон */}
        <div className="gradient-background" />
        
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















