// WelcomePage.js - С УНИФИЦИРОВАННЫМИ СТИЛЯМИ И РАБОЧИМИ АНИМАЦИЯМИ
// ✅ Использует containers.css для позиционирования
// ✅ Использует logo.css для логотипа (с анимациями)
// ✅ Использует text.css для текста
// ✅ Рабочий автопереход и анимации выхода

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import logoImage from './components/logo.png';

// Подключаем CSS файлы
import './Styles/containers.css'; // Универсальные контейнеры
import './Styles/logo.css';       // Стили логотипа с анимациями
import './Styles/text.css';        // Стили текста

const WelcomePage = () => {
  const navigate = useNavigate();
  
  // ===== СОСТОЯНИЯ =====
  const [textAnimated, setTextAnimated] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [logoAnimated, setLogoAnimated] = useState(false);
  
  // Ref для логотипа
  const logoRef = useRef(null);

  // ===== HAPTIC FEEDBACK =====
  const triggerHaptic = useCallback((type = 'light') => {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      switch (type) {
        case 'light':
          window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
          break;
        case 'medium':
          window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
          break;
        case 'success':
          window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
          break;
        default:
          window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
      }
    }
  }, []);

  // ===== ВРЕМЯ СУТОК =====
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return 'Доброй ночи';
    if (hour < 12) return 'Доброе утро';
    if (hour < 18) return 'Добрый день';
    return 'Добрый вечер';
  };

  // ===== НАВИГАЦИЯ =====
  const handleNavigation = useCallback(() => {
    if (isExiting) return;
    
    triggerHaptic('success');
    setIsExiting(true);
    
    // Анимируем выход логотипа через CSS класс
    if (logoRef.current) {
      // Убираем класс входной анимации
      logoRef.current.classList.remove('animate-logo');
      // Добавляем класс выходной анимации
      logoRef.current.classList.add('animate-logo-exit');
    }
    
    // Переход на следующую страницу после анимации
    setTimeout(() => {
      navigate('/main-menu');
    }, 800);
  }, [isExiting, triggerHaptic, navigate]);

  // ===== ИНИЦИАЛИЗАЦИЯ И АНИМАЦИЯ =====
  useEffect(() => {
    setGreeting(getTimeBasedGreeting());
    
    // Запускаем анимации последовательно
    const timer1 = setTimeout(() => {
      setLogoAnimated(true);
      if (logoRef.current) {
        logoRef.current.classList.add('animate-logo');
      }
      triggerHaptic('light');
    }, 100);
    
    const timer2 = setTimeout(() => {
      setTextAnimated(true);
    }, 600);
    
    // Автоматический переход через 3 секунды
    const autoNavigate = setTimeout(() => {
      handleNavigation();
    }, 3000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(autoNavigate);
    };
  }, []); // Пустой массив зависимостей для однократного выполнения

  // ===== КЛАССЫ ДЛЯ ЭЛЕМЕНТОВ =====
  const getContainerClasses = () => [
    'main-container',
    'align-center',
    isExiting ? 'exiting' : ''
  ].filter(Boolean).join(' ');

  const getLogoClasses = () => [
    'logo-wrapper'
    // НЕ добавляем здесь animated и exiting, так как управляем через classList
  ].filter(Boolean).join(' ');

  const getTextContainerClasses = () => [
    'welcome-text-container',
    textAnimated ? 'animated' : '',
    isExiting ? 'exiting' : ''
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={getContainerClasses()}
      onClick={handleNavigation}
      style={{ cursor: 'pointer' }}
    >
      {/* ===== ЛОГОТИП ===== */}
      <div ref={logoRef} className={getLogoClasses()}>
        <img
          src={logoImage}
          alt="Логотип РГС Жизнь"
          className="logo-image"
        />
      </div>

      {/* ===== ТЕКСТ ПРИВЕТСТВИЯ ===== */}
      <div className={getTextContainerClasses()}>
        <h1 className="text-greeting text-pulse">
          {greeting}!
        </h1>
        <p className="text-instruction">
          Подождите немного<br />
          или нажмите для продолжения
        </p>
      </div>
    </div>
  );
};

export default WelcomePage;














































