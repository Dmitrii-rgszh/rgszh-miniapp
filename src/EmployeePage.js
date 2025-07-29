// EmployeePage.js - УПРОЩЕННАЯ ВЕРСИЯ
// ✅ Удалены все useState и useEffect
// ✅ Удалены все инлайн стили
// ✅ Только базовая функциональность

import React from 'react';
import { useNavigate } from 'react-router-dom';
import logoImage from './components/logo.png';

import './Styles/logo.css';
import './Styles/BackButton.css';

const EmployeePage = () => {
  const navigate = useNavigate();

  // ===== ДАННЫЕ ПРОДУКТОВ =====
  const products = [
    { to: '/justincase', label: 'На всякий случай', type: 'primary' },
    { to: '/snp', label: 'Стратегия на пять.Гарант', type: 'primary' },
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

  return (
    <div className="main-container">
      {/* Логотип */}
      <div className="logo-wrapper animate-logo">
        <img
          src={logoImage}
          alt="Логотип РГС Жизнь"
          className="logo-image"
        />
      </div>
      {/* Заголовок и кнопки */}
      <div className="button-container with-logo">
        <h1 className="text-h1 text-center text-white">Страница сотрудника</h1>
        
        {products.map((product) => (
          <button
            key={product.to}
            className={`btn-universal btn-${product.type} btn-large btn-shadow button-animated`}
            onClick={() => handleClick(product.to)}
          >
            {product.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default EmployeePage;
