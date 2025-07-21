// MainMenu.js - С УНИВЕРСАЛЬНЫМИ СТИЛЯМИ КНОПОК
// ✅ Использует универсальные классы из buttons.css
// ✅ Только логика и CSS классы
// ✅ Чистый код без инлайн стилей

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import logoImage from './components/logo.png';

// Подключаем CSS файлы
import './Styles/buttons.css';   // Универсальные кнопки
import './Styles/logo.css';     // Логотип

export default function MainMenu() {
  const navigate = useNavigate();
  
  // ===== СОСТОЯНИЯ =====
  const [logoAnimated, setLogoAnimated] = useState(false);
  const [buttonsAnimated, setButtonsAnimated] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const logoRef = useRef(null);

  // ===== ДАННЫЕ КНОПОК =====
  const buttons = [
    { label: 'Опросы', to: '/polls', type: 'primary' },
    { label: 'Сотрудники', to: '/employee', type: 'primary' },
  ];

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
    
    // Добавляем CSS классы для exit анимации
    if (logoRef.current) {
      logoRef.current.classList.add('animate-logo-exit');
    }
    
    setTimeout(() => {
      navigate(path);
    }, 800);
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
    buttonsAnimated ? 'animated' : '',
    isExiting ? 'exiting' : ''
  ].filter(Boolean).join(' ');

  // Универсальные классы кнопок
  const getButtonClasses = (btn, index) => [
    'btn-universal',           // Базовый класс
    `btn-${btn.type}`,        // Тип кнопки (primary, secondary, etc.)
    'btn-responsive',         // Адаптивная кнопка
    'btn-shadow',            // С тенью
    buttonsAnimated ? 'button-animated' : 'button-hidden',
    isExiting ? 'button-exiting' : ''
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

      {/* ===== КНОПКИ ===== */}
      <div className={getButtonContainerClasses()}>
        {buttons.map((btn, index) => (
          <button
            key={btn.to}
            className={getButtonClasses(btn, index)}
            data-index={index}
            onClick={(e) => {
              createRipple(e);
              handleClick(btn.to);
            }}
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
}















































