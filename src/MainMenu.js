// MainMenu.js - С ИМПОРТОМ logo.css
import React from 'react';
import { useNavigate } from 'react-router-dom';
import logoImage from './components/logo.png';

// Импорт CSS файлов
import './Styles/containers.css';
import './Styles/buttons.css';
import './Styles/logo.css'; // ← ДОБАВЛЕН ИМПОРТ logo.css

export default function MainMenu() {
  const navigate = useNavigate();

  return (
    <div className="main-container">
      {/* Логотип */}
      <div className="logo-wrapper animate-logo">
        <img 
          src={logoImage} 
          alt="РГС Жизнь" 
          className="logo-image"
        />
      </div>
      
      {/* Контейнер с кнопками */}
      <div className="button-container with-logo">
        <button
          className="btn-universal btn-primary btn-large btn-shadow"
          onClick={() => navigate('/polls')}
        >
          Опросы
        </button>
        
        <button
          className="btn-universal btn-primary btn-large btn-shadow"
          onClick={() => navigate('/employee')}
        >
          Сотрудники
        </button>
      </div>
    </div>
  );
}















































