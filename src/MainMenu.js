// MainMenu.js - ИСПРАВЛЕННАЯ ВЕРСИЯ С TOUCH ПОДДЕРЖКОЙ
// ✅ Исправлено состояние isExiting
// ✅ Добавлены touch события
// ✅ Добавлено логирование для отладки

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import logoImage from './components/logo.png';

// Подключаем CSS файлы
import './Styles/containers.css'; // Универсальные контейнеры
import './Styles/buttons.css';    // Универсальные кнопки (включая анимации)
import './Styles/logo.css';       // Логотип

export default function MainMenu() {
  const navigate = useNavigate();
  
  // ===== СОСТОЯНИЯ =====
  const [logoAnimated, setLogoAnimated] = useState(false);
  const [buttonsAnimated, setButtonsAnimated] = useState(false);
  const [isExiting, setIsExiting] = useState(false); // ← Убеждаемся что false по умолчанию
  const logoRef = useRef(null);

  // ===== ДАННЫЕ КНОПОК =====
  const buttons = [
    { label: 'Опросы', to: '/polls', type: 'primary' },
    { label: 'Сотрудники', to: '/employee', type: 'primary' },
  ];

  // ===== СБРОС СОСТОЯНИЯ ПРИ МОНТИРОВАНИИ =====
  useEffect(() => {
    console.log('🔄 MainMenu: Инициализация, сбрасываем isExiting');
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
    console.log('🔘 MainMenu: handleClick вызван, path:', path);
    console.log('🔘 MainMenu: isExiting текущее значение:', isExiting);
    
    if (isExiting) {
      console.log('❌ MainMenu: Клик заблокирован - isExiting=true');
      return;
    }
    
    console.log('✅ MainMenu: Клик разрешен, начинаем навигацию');
    setIsExiting(true);
    
    // Добавляем CSS классы для exit анимации
    if (logoRef.current) {
      logoRef.current.classList.add('animate-logo-exit');
    }
    
    setTimeout(() => {
      console.log('🔄 MainMenu: Навигация к:', path);
      navigate(path);
    }, 800);
  };

  // ===== TOUCH ОБРАБОТЧИКИ =====
  const handleTouchStart = (e) => {
    console.log('👆 MainMenu: TouchStart');
  };

  const handleTouchEnd = (e, path) => {
    console.log('👆 MainMenu: TouchEnd, path:', path);
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
    'with-logo',                  // Позиционирование с учетом логотипа
    buttonsAnimated ? 'animated' : '',
    isExiting ? 'exiting' : ''
  ].filter(Boolean).join(' ');

  // Универсальные классы кнопок - ИСПРАВЛЕНО: НЕ добавляем exiting если кнопки еще не анимированы
  const getButtonClasses = (btn, index) => [
    'btn-universal',              // Базовый класс
    `btn-${btn.type}`,           // Тип кнопки (primary, secondary, etc.)
    'btn-large',                 // Размер кнопки
    'btn-shadow',                // С тенью
    buttonsAnimated ? 'button-animated' : 'button-hidden',
    // ТОЛЬКО добавляем button-exiting если кнопки уже анимированы И идет выход
    (buttonsAnimated && isExiting) ? 'button-exiting' : ''
  ].filter(Boolean).join(' ');

  // Отладочная информация
  useEffect(() => {
    console.log('🔍 MainMenu: Состояние изменилось:', {
      logoAnimated,
      buttonsAnimated,
      isExiting
    });
  }, [logoAnimated, buttonsAnimated, isExiting]);

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

      {/* ===== КНОПКИ С ПОЛНОЙ ПОДДЕРЖКОЙ СОБЫТИЙ ===== */}
      <div className={getButtonContainerClasses()}>
        {buttons.map((btn, index) => (
          <button
            key={btn.to}
            className={getButtonClasses(btn, index)}
            data-index={index}
            onClick={(e) => {
              console.log('🖱️ MainMenu: onClick обработчик вызван', btn.label);
              createRipple(e);
              handleClick(btn.to);
            }}
            onTouchStart={handleTouchStart}
            onTouchEnd={(e) => {
              e.preventDefault(); // Предотвращаем двойной вызов
              handleTouchEnd(e, btn.to);
            }}
            onPointerDown={() => console.log('👉 MainMenu: PointerDown', btn.label)}
            style={{
              // ПРИНУДИТЕЛЬНЫЕ СТИЛИ для обеспечения кликабельности
              userSelect: 'auto',
              WebkitUserSelect: 'auto',
              pointerEvents: 'auto',
              cursor: 'pointer',
              touchAction: 'manipulation'
            }}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* ОТЛАДОЧНАЯ ИНФОРМАЦИЯ */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        background: 'black',
        color: 'yellow',
        padding: '10px',
        fontSize: '12px',
        zIndex: 9999,
        borderRadius: '4px'
      }}>
        <div>isExiting: {String(isExiting)}</div>
        <div>buttonsAnimated: {String(buttonsAnimated)}</div>
        <div>logoAnimated: {String(logoAnimated)}</div>
      </div>
    </div>
  );
}















































