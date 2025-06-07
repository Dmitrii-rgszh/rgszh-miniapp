// PollsPage.js
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import './Styles/background.css';   // Фон, subtle-dot, анимация pi
import './Styles/logo.css';         // Стили и анимация логотипа
import './Styles/Buttons.css';      // Стили остальных кнопок (опросы и т.д.)
import './Styles/HomeButton.css';   // Стили для кнопки «Домой»

import backgroundImage from './components/background.png';
import logoImage       from './components/logo.png';
import piImage         from './components/pi.png';

export default function PollsPage() {
  const navigate = useNavigate();

  // Рефы для управления элементами DOM
  const logoRef = useRef(null);
  const homeRef = useRef(null);
  const buttonRefs = useRef([]);

  // Флаг, чтобы запустить анимацию кнопок «Опросы» после логотипа
  const [buttonsAnimated, setButtonsAnimated] = useState(false);

  // Здесь массив маршрутов «опросов» (для примера)
  const polls = [
    { path: '/assessment', label: 'Оценка кандидата'    },
    { path: '/feedback',   label: 'Обратная связь'      },
    { path: '/marzapoll',     label: 'Маржа продаж'        },
  ];

  useEffect(() => {
    // 1) Запускаем «въезд» логотипа через 100 мс, чтобы дать отрисоваться бэкграунду
    const logoTimer = setTimeout(() => {
      if (logoRef.current) {
        logoRef.current.classList.add('animate-logo');
      }
    }, 100);

    // 2) После того, как логотип «въехал», через 200 мс запускаем «въезд» кнопки «Домой»
    //    Длительность анимации логотипа, допустим, составляет 800 мс, но нам важно именно
    //    небольшое отставание в 200 мс, чтобы кнопку «Домой» было видно позднее.
    const homeTimer = setTimeout(() => {
      if (homeRef.current) {
        homeRef.current.classList.add('animate-home');
      }
    }, 150 + 200); // 100 мс (логотип) + 200 мс (задержка)

    // 3) Ещё через 800 мс (примерно по завершению анимации логотипа), запускаем выезд остальных кнопок
    const buttonsTimer = setTimeout(() => {
      setButtonsAnimated(true);
    }, 100 + 800);

    return () => {
      clearTimeout(logoTimer);
      clearTimeout(homeTimer);
      clearTimeout(buttonsTimer);
    };
  }, []);

  // Функция обработки клика по любой кнопке (включая «Домой»)
  const handleClick = (e, path) => {
    // === ripple-эффект для кнопки (оставляем без изменений) ===
    if (e && e.currentTarget) {
      const btn = e.currentTarget;
      const circle = document.createElement('span');
      const diameter = Math.max(btn.clientWidth, btn.clientHeight);
      const radius = diameter / 2;
      circle.style.width  = circle.style.height = `${diameter}px`;
      circle.style.left   = `${e.clientX - btn.offsetLeft  - radius}px`;
      circle.style.top    = `${e.clientY - btn.offsetTop   - radius}px`;
      circle.classList.add('ripple');
      const oldRipple = btn.getElementsByClassName('ripple')[0];
      if (oldRipple) oldRipple.remove();
      btn.appendChild(circle);
    }

    // === Анимация «уезда» логотипа наверх ===
    if (logoRef.current) {
      logoRef.current.classList.remove('animate-logo');
      logoRef.current.classList.add('animate-logo-exit');
    }

    // === Анимация «уезда» кнопки «Домой» влево ===
    if (homeRef.current) {
      homeRef.current.classList.remove('animate-home');
      homeRef.current.classList.add('animate-home-exit');
    }

    // === Анимация «уезда» остальных кнопок (опросы) вниз по очереди ===
    buttonRefs.current.forEach((buttonElem, index) => {
      if (buttonElem) {
        const exitClass = `btn-exit${index + 1}`;
        buttonElem.classList.add('animate-exit', exitClass);
      }
    });

    // Ждём 800 мс, чтобы exit-анимации успели отработать, и переходим
    setTimeout(() => navigate(path), 800);
  };

  return (
    <div
      className="mainmenu-container"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      {/* 10 «subtle-dot» точек */}
      <div className="subtle-dot dot-1" />
      <div className="subtle-dot dot-2" />
      <div className="subtle-dot dot-3" />
      <div className="subtle-dot dot-4" />
      <div className="subtle-dot dot-5" />
      <div className="subtle-dot dot-6" />
      <div className="subtle-dot dot-7" />
      <div className="subtle-dot dot-8" />
      <div className="subtle-dot dot-9" />
      <div className="subtle-dot dot-10" />

      {/* π-иконка */}
      <div className="pi-wrapper">
        <img src={piImage} className="pi-fly" alt="Pi" />
      </div>

      <div className="mainmenu-overlay" />

      {/* === Кнопка «Домой» (будет «выезжать» с задержкой) === */}
      <button
        ref={homeRef}
        className="home-btn"
        onClick={(e) => handleClick(e, '/main-menu')}
        aria-label="Домой"
      >
        {/* SVG-иконка «дом» */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className="home-icon"
        >
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
        </svg>
      </button>

      {/* === Логотип (будет «выезжать» плавно вниз при появлении) === */}
      <div ref={logoRef} className="logo-wrapper">
        <img
          src={logoImage}
          alt="Логотип РГС Жизнь"
          className="logo-image"
        />
      </div>

      {/* === Кнопки «опросов» — выезжают после логотипа (buttonsAnimated=true) === */}
      <div className="button-container">
        {polls.map((p, index) => (
          <button
            key={p.path}
            ref={(el) => (buttonRefs.current[index] = el)}
            className={`btn-custom ${buttonsAnimated ? 'animate-btn' : ''}`}
            onClick={(e) => handleClick(e, p.path)}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}









































