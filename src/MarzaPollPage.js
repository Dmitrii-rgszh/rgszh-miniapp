// MarzaPollPage.js - УПРОЩЕННАЯ ВЕРСИЯ БЕЗ СОСТОЯНИЙ
import React from 'react';
import { useNavigate } from 'react-router-dom';
import logoImage from './components/logo.png';

import './Styles/logo.css';
import './Styles/HomeButton.css';

export default function MarzaPollPage() {
  const navigate = useNavigate();

  // Опции для голосования (статические данные)
  const pollOptions = [
    'Чтобы отстал руководитель',
    'Чтобы перевыполнить план и заработать много деняк',
    'Чтобы победить в конкурсе и полетать на самолёте',
    'Чтобы клиент меня любил сильнее, чем маму',
    'Какого ещё маржа?'
  ];

  // Обработчик клика по опции
  const handleOptionClick = (optionText) => {
    alert(`Вы выбрали: ${optionText}\n\nВ упрощенной версии голосование недоступно.`);
  };

  // Обработчик кнопки домой
  const handleHomeClick = () => {
    navigate('/main-menu');
  };

  // Обработчик кнопки сброса
  const handleResetClick = () => {
    alert('Функция сброса временно недоступна');
  };

  return (
    <div className="main-container">
      {/* Логотип */}
      <div className="logo-wrapper animate-logo">
        <img src={logoImage} alt="Логотип" className="logo-image" />
      </div>

      {/* Кнопка домой */}
      <button
        onClick={handleHomeClick}
        className="home-button with-top-logo animate-home"
        title="На главную"
      >
        <svg viewBox="0 0 24 24">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
        </svg>
      </button>

      {/* Кнопка сброса */}
      <button
        onClick={handleResetClick}
        className="reset-btn animate-home"
        title="Сбросить голоса"
      >
        <svg viewBox="0 0 24 24">
          <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
        </svg>
      </button>

      {/* Контейнер опроса */}
      <div className="card-container poll-container slide-up">
        <h2 className="text-h2 text-center">Чем вам поможет Маржа?</h2>
        
        <div className="poll-options">
          {pollOptions.map((option, index) => (
            <button
              key={index}
              className="answer-option button-animated"
              onClick={() => handleOptionClick(option)}
              style={{ animationDelay: `${0.7 + index * 0.1}s` }}
            >
              {option}
            </button>
          ))}
        </div>

        <p className="text-caption text-center" style={{ marginTop: '20px' }}>
          Голосование временно недоступно в упрощенной версии
        </p>
      </div>
    </div>
  );
}












































