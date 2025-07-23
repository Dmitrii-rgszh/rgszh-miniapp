// EmployeePage.js - ВЕРСИЯ С МОДУЛЬНЫМИ CSS СТИЛЯМИ

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import logoImage from './components/logo.png';

// Подключаем модульные CSS файлы
import './Styles/containers.css';
import './Styles/buttons.css';
import './Styles/logo.css';
import './Styles/text.css';
import './Styles/backgrounds.css';

const EmployeePage = () => {
  const navigate = useNavigate();
  const logoRef = useRef(null);
  
  // Состояния анимаций
  const [logoAnimated, setLogoAnimated] = useState(false);
  const [contentAnimated, setContentAnimated] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Запускаем анимации появления
    const logoTimer = setTimeout(() => {
      setLogoAnimated(true);
      if (logoRef.current) {
        logoRef.current.classList.add('animate-logo');
      }
    }, 100);
    
    const contentTimer = setTimeout(() => {
      setContentAnimated(true);
    }, 600);

    return () => {
      clearTimeout(logoTimer);
      clearTimeout(contentTimer);
    };
  }, []);

  // Обработчик клика с анимацией выхода
  const handleClick = (route) => {
    if (isExiting) return;
    
    setIsExiting(true);
    
    if (logoRef.current) {
      logoRef.current.classList.add('animate-logo-exit');
    }
    
    setTimeout(() => navigate(route), 800);
  };

  // Обработчик возврата
  const handleBack = () => {
    if (isExiting) return;
    
    setIsExiting(true);
    
    if (logoRef.current) {
      logoRef.current.classList.add('animate-logo-exit');
    }
    
    setTimeout(() => navigate('/main-menu'), 800);
  };

  // Продукты для сотрудника
  const products = [
    { to: '/justincase', label: 'На всякий случай' },
    { to: '/snp', label: 'Стратегия на пять. Гарант' },
    { to: '/carefuture', label: 'Забота о будущем' }
  ];

  return (
    <div className={`main-container ${isExiting ? 'exiting' : ''}`}>
      {/* Фоновый слой */}
      <div className="background-layer background-gradient-purple" />
      
      {/* Логотип */}
      <div 
        ref={logoRef}
        className={`logo-wrapper ${logoAnimated ? 'animated' : ''} ${isExiting ? 'exiting' : ''}`}
      >
        <img
          src={logoImage}
          alt="Логотип РГС Жизнь"
          className="logo-image"
        />
      </div>

      {/* Кнопка "Назад" */}
      <button 
        className={`back-btn ${contentAnimated ? 'animate-home' : ''} ${isExiting ? 'animate-home-exit' : ''}`}
        onClick={handleBack}
        aria-label="Назад"
      >
        <svg viewBox="0 0 24 24">
          <path d="M15 18l-6-6 6-6" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Заголовок и кнопки */}
      <div className={`button-container with-logo ${contentAnimated ? 'animated' : ''} ${isExiting ? 'exiting' : ''}`}>
        <h1 className="text-h1 text-center">Страница сотрудника</h1>
        
        {products.map((product, index) => (
          <button
            key={product.to}
            className="btn-universal"
            onClick={() => handleClick(product.to)}
            style={{
              animationDelay: `${index * 0.1}s`
            }}
          >
            <span className="btn-text">{product.label}</span>
          </button>
        ))}
      </div>

      {/* Дополнительные стили для этой страницы */}
      <style>
        {`
          /* Фиолетовый градиент для фона */
          .background-gradient-purple {
            background: linear-gradient(135deg, 
              #9370DB 0%, 
              #6A5ACD 25%, 
              #8B7AB8 50%, 
              #7B68EE 75%, 
              #6A5ACD 100%
            );
          }

          /* Адаптация кнопок под фиолетовую тему */
          .btn-universal {
            background: linear-gradient(135deg, rgba(147, 112, 219, 0.9) 0%, rgba(106, 90, 205, 0.9) 100%);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
          }

          .btn-universal:hover {
            background: linear-gradient(135deg, rgba(147, 112, 219, 1) 0%, rgba(106, 90, 205, 1) 100%);
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(147, 112, 219, 0.4);
          }

          /* Анимация появления кнопок */
          .button-container.animated .btn-universal {
            animation: fadeInUp 0.6s ease-out forwards;
            opacity: 0;
          }

          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          /* Мобильная адаптация */
          @media (max-width: 768px) {
            .button-container.with-logo {
              top: 200px;
            }
            
            .text-h1 {
              font-size: 24px;
              margin-bottom: 20px;
            }
          }

          @media (max-width: 374px) {
            .button-container.with-logo {
              top: 180px;
            }
            
            .text-h1 {
              font-size: 22px;
            }
          }
        `}
      </style>
    </div>
  );
};

export default EmployeePage;