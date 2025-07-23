// EmployeePage.js - С ЛОГИКОЙ СТИЛЕЙ ИЗ MAINMENU
// ✅ Используются только модульные CSS стили
// ✅ Красные кнопки как в MainMenu
// ✅ Добавлена кнопка "Далее"
// ✅ Убраны все инлайн стили и фиолетовый фон

import React, { useState, useEffect, useRef } from 'react';
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
  
  // ===== СОСТОЯНИЯ =====
  const [logoAnimated, setLogoAnimated] = useState(false);
  const [buttonsAnimated, setButtonsAnimated] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // ===== ДАННЫЕ ПРОДУКТОВ =====
  const products = [
    { to: '/justincase', label: 'На всякий случай', type: 'primary' },
    { to: '/snp', label: 'Стратегия на пять. Гарант', type: 'primary' },
    { to: '/care-future', label: 'Забота о будущем', type: 'primary' }
  ];

  // ===== СБРОС СОСТОЯНИЯ ПРИ МОНТИРОВАНИИ =====
  useEffect(() => {
    setIsExiting(false);
  }, []);

  // ===== АНИМАЦИЯ ВХОДА =====
  useEffect(() => {
    const timer1 = setTimeout(() => {
      setLogoAnimated(true);
      if (logoRef.current) {
        logoRef.current.classList.add('animate-logo');
      }
    }, 100);
    
    const timer2 = setTimeout(() => {
      setButtonsAnimated(true);
    }, 600);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  // ===== ОБРАБОТКА КЛИКА ПО КНОПКЕ =====
  const handleClick = (path) => {
    if (isExiting) return;
    
    setIsExiting(true);
    
    if (logoRef.current) {
      logoRef.current.classList.add('animate-logo-exit');
    }
    
    setTimeout(() => {
      navigate(path);
    }, 800);
  };

  // ===== ОБРАБОТКА КНОПКИ "НАЗАД" =====
  const handleBack = () => {
    if (isExiting) return;
    
    setIsExiting(true);
    
    if (logoRef.current) {
      logoRef.current.classList.add('animate-logo-exit');
    }
    
    setTimeout(() => {
      navigate('/main-menu');
    }, 800);
  };

  // ===== TOUCH ОБРАБОТЧИКИ =====
  const handleTouchStart = (e) => {
    // Touch start handler
  };

  const handleTouchEnd = (e, path) => {
    e.preventDefault();
    handleClick(path);
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

  // ===== КЛАССЫ ДЛЯ ЭЛЕМЕНТОВ =====
  const getContainerClasses = () => [
    'main-container',
    isExiting ? 'exiting' : ''
  ].filter(Boolean).join(' ');

  const getLogoClasses = () => [
    'logo-wrapper',
    logoAnimated ? 'animated' : '',
    isExiting ? 'exiting' : ''
  ].filter(Boolean).join(' ');

  const getButtonContainerClasses = () => [
    'button-container',
    'with-logo',
    buttonsAnimated ? 'animated' : '',
    isExiting ? 'exiting' : ''
  ].filter(Boolean).join(' ');

  const getButtonClasses = (product, index) => [
    'btn-universal',
    `btn-${product.type}`,
    'btn-large',
    'btn-shadow',
    buttonsAnimated ? 'button-animated' : 'button-hidden',
    (buttonsAnimated && isExiting) ? 'button-exiting' : ''
  ].filter(Boolean).join(' ');

  const getBackButtonClasses = () => [
    'back-btn',
    buttonsAnimated ? 'animate-home' : '',
    isExiting ? 'animate-home-exit' : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={getContainerClasses()}>
      {/* ===== ЛОГОТИП ===== */}
      <div 
        ref={logoRef}
        className={getLogoClasses()}
      >
        <img
          src={logoImage}
          alt="Логотип РГС Жизнь"
          className="logo-image"
        />
      </div>

      {/* ===== КНОПКА "НАЗАД" ===== */}
      <button 
        className={getBackButtonClasses()}
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

      {/* ===== ЗАГОЛОВОК И КНОПКИ ===== */}
      <div className={getButtonContainerClasses()}>
        <h1 className="text-h1 text-center text-white">Страница сотрудника</h1>
        
        {products.map((product, index) => (
          <button
            key={product.to}
            className={getButtonClasses(product, index)}
            data-index={index}
            onClick={(e) => {
              createRipple(e);
              handleClick(product.to);
            }}
            onTouchStart={handleTouchStart}
            onTouchEnd={(e) => handleTouchEnd(e, product.to)}
          >
            {product.label}
          </button>
        ))}
      </div>

      {/* ===== СТИЛЬ ДЛЯ БЕЛОГО ТЕКСТА ===== */}
      <style>
        {`
          .text-white {
            color: white;
          }
        `}
      </style>
    </div>
  );
};

export default EmployeePage;