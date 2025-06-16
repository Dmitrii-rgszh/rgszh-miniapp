import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
        <div style={{ padding: 20, color: 'red' }}>
          <h2>Произошла ошибка</h2>
          <pre>{this.state.error.toString()}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function MainApp() {
  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}

export default MainApp;















