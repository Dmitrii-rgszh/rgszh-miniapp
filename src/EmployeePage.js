import React, { useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';
import backgroundImage from './components/background.png';
import logo from './components/logo.png';

const EmployeePage = () => {
  const navigate = useNavigate();
  const swipeHandlers = useSwipeable({
    onSwipedRight: () => navigate('/main-menu'),
    preventDefaultTouchmoveEvent: true,
    trackMouse: true,
  });

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div
      className="polls-container"
      style={{ backgroundImage: `url(${backgroundImage})` }}
      {...swipeHandlers}
    >
      {/* HEADER: кнопка «Домой» + логотип */}
      <div className="polls-header">
        <button
          className="back-btn"
          onClick={() => navigate('/main-menu')}
        >
          <svg viewBox="0 0 24 24">
            <path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1V11z" />
          </svg>
        </button>
        <div className="logo-wrapper animate-logo">
          <img src={logo} alt="Логотип" className="poll-logo" />
        </div>
      </div>

      {/* Заголовок */}
      <h2 className="polls-title animate-title">
        Страница для сотрудника
      </h2>

      {/* Кнопки выбора продукта */}
      <div className="polls-buttons">
        <button
          className="polls-btn animate-btn btn1"
          onClick={() => navigate('/justincase')}
        >
          На всякий случай
        </button>
        <button
          className="polls-btn animate-btn btn2"
          onClick={() => navigate('/snp')}
        >
          Стратегия на пять. Гарант
        </button>
        <button
          className="polls-btn animate-btn btn3"
          onClick={() => navigate('/carefuture')}
        >
          Забота о будущем
        </button>
      </div>
    </div>
  );
};

export default EmployeePage;























