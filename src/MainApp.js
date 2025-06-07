// src/MainApp.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

/* Подключаем глобальный фон-градиент и глобальные стили (Montserrat, сбросы) */
import './Styles/global.css';

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

function MainApp() {
  return (
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
          <Route path="/thankyou"   element={<ThankYouPage />} />
        </Routes>
      </Router>
  );
}

export default MainApp;














