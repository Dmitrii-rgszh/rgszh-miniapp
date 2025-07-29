// EmployeePage.js - МАКСИМАЛЬНО УПРОЩЕННАЯ ВЕРСИЯ
// ✅ УДАЛЕНЫ ВСЕ СОСТОЯНИЯ И useEffect
// ✅ УДАЛЕНЫ ВСЕ ИНЛАЙН СТИЛИ
// ✅ ТОЛЬКО БАЗОВАЯ ФУНКЦИОНАЛЬНОСТЬ

import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import logoImage from './components/logo.png';

// Подключаем модульные CSS файлы
import './Styles/containers.css';
import './Styles/buttons.css';
import './Styles/logo.css';
import './Styles/text.css';
import './Styles/BackButton.css';

const EmployeePage = () => {
  const navigate = useNavigate();
  const logoRef = useRef(null);

  // ===== ДАННЫЕ ПРОДУКТОВ =====
  const products = [
    { to: '/justincase', label: 'На всякий случай', type: 'primary' },
    { to: '/snp', label: 'Стратегия на пять. Гарант', type: 'primary' },
    { to: '/care-future', label: 'Забота о будущем', type: 'primary' }
  ];

  // ===== ОБРАБОТКА КЛИКА ПО КНОПКЕ =====
  const handleClick = (path) => {
    navigate(path);
  };

  // ===== ОБРАБОТКА КНОПКИ "НАЗАД" =====
  const handleBack = () => {
    navigate('/main-menu');
  };

  // ===== RIPPLE ЭФФЕКТ =====
  const createRipple = (event) => {
    const button = event.currentTarget;
    const circle = document.createElement('span');
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;
    
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - button.offsetLeft - radius}px`;
    circle.style.top = `${event.clientY - button.offsetTop - radius}px`;
    circle.classList.add('ripple');
    
    const ripple = button.getElementsByClassName('ripple')[0];
    if (ripple) {
      ripple.remove();
    }
    
    button.appendChild(circle);
  };

  return (
    <div className="main-container">
      {/* Логотип */}
      <div ref={logoRef} className="logo-wrapper">
        <img
          src={logoImage}
          alt="Логотип РГС Жизнь"
          className="logo-image"
        />
      </div>

      {/* Кнопка "Назад" */}
      <button 
        className="back-btn"
        onClick={handleBack}
        aria-label="Назад"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
          <path 
            d="M15 18l-6-6 6-6" 
            stroke="white" 
            strokeWidth="2.5" 
            fill="none" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Заголовок и кнопки */}
      <div className="button-container with-logo">
        <h1 className="text-h1 text-center text-white">Страница сотрудника</h1>
        
        {products.map((product, index) => (
          <button
            key={product.to}
            className={`btn-universal btn-${product.type} btn-large btn-shadow`}
            onClick={(e) => {
              createRipple(e);
              handleClick(product.to);
            }}
          >
            {product.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default EmployeePage;
