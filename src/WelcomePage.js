import React, { useEffect, useRef, useState } from 'react';
import { useNavigate }               from 'react-router-dom';
import { useSwipeable }              from 'react-swipeable';

import './Styles/global.css';      // Montserrat + базовые сбросы
import './Styles/background.css';  // фон-градиент, шум, subtle-dot, pi-иконка
import './Styles/logo.css';        // Анимации логотипа (оставляем без изменений)
import './WelcomePage.css';        // Позиционирование и анимации текста

import backgroundImage from './components/background.png';
import logoImage       from './components/logo.png';
import piImage         from './components/pi.png';

const WelcomePage = () => {
  const navigate = useNavigate();

  // Рефы на логотип и текст, чтобы переключать CSS-классы
  const logoRef = useRef(null);
  const textRef = useRef(null);

  // Флаг, чтобы запустить exit-анимацию текста
  const [textExiting, setTextExiting] = useState(false);

  // Состояние для приветственного текста
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    // 1) Определяем приветствие по времени суток
    const hour = new Date().getHours();
    let text = '';
    if (hour >= 6 && hour < 11)       text = 'Доброе утро';
    else if (hour >= 11 && hour < 17) text = 'Добрый день';
    else if (hour >= 17 && hour < 24) text = 'Добрый вечер';
    else                              text = 'Доброй ночи';
    setGreeting(text);

    // 2) Запускаем entry-анимацию логотипа (через CSS-класс из logo.css)
    if (logoRef.current) {
      logoRef.current.classList.add('animate-logo');
    }

    // 3) Через небольшую задержку (например, 100ms) запускаем entry-анимацию текста
    //    чтобы логотип успел «въехать» немного раньше
    const textEntryTimer = setTimeout(() => {
      if (textRef.current) {
        textRef.current.classList.add('animate-text');
      }
    }, 100);

    // 4) Через 2 секунды запускаем exit-анимацию:
    //    • для логотипа: переключаем CSS-класс на animate-logo-exit
    //    • для текста: переключаем CSS-класс на animate-text-exit
    const exitTimer = setTimeout(() => {
      if (logoRef.current) {
        logoRef.current.classList.remove('animate-logo');
        logoRef.current.classList.add('animate-logo-exit');
      }
      if (textRef.current) {
        textRef.current.classList.remove('animate-text');
        textRef.current.classList.add('animate-text-exit');
      }
      setTextExiting(true);
    }, 2000);

    // 5) Через 2.8 секунды переходим на /main-menu,
    //    даём 0.8 секунды, чтобы exit-анимация текста (и логотипа) завершилась
    const navTimer = setTimeout(() => {
      navigate('/main-menu');
    }, 2800);

    return () => {
      clearTimeout(textEntryTimer);
      clearTimeout(exitTimer);
      clearTimeout(navTimer);
    };
  }, [navigate]);

  // Свайп-обработчик (если нужен)
  const swipeHandlers = useSwipeable({ preventDefault: true });

  return (
    <div
      className="welcome-container"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundRepeat:  'no-repeat',
        backgroundSize:    'cover',
        backgroundPosition:'center'
      }}
    >
      {/* 10 «subtle-dot» шариков (из background.css) */}
      <div className="subtle-dot dot-1"  />
      <div className="subtle-dot dot-2"  />
      <div className="subtle-dot dot-3"  />
      <div className="subtle-dot dot-4"  />
      <div className="subtle-dot dot-5"  />
      <div className="subtle-dot dot-6"  />
      <div className="subtle-dot dot-7"  />
      <div className="subtle-dot dot-8"  />
      <div className="subtle-dot dot-9"  />
      <div className="subtle-dot dot-10" />

      {/* Полупрозрачный оверлей (если нужен) */}
      <div className="mainmenu-overlay" />

      {/* === ЛОГОТИП (CSS-анимации в logo.css, ничего не меняется) === */}
      <div ref={logoRef} className="logo-wrapper">
        <img
          src={logoImage}
          alt="Логотип РГС Жизнь"
          className="logo-image"
        />
      </div>

      {/* === ТЕКСТ-ПРИВЕТСТВИЕ (чисто через CSS-анимации) === */}
      <div ref={textRef} className="text-wrapper">
        <h1 className="welcome-title">{greeting}</h1>
      </div>
    </div>
  );
};

export default WelcomePage;














































