import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import './Styles/global.css';     // Монстерат, сбросы
import './Styles/background.css'; // Градиент, шум, subtle-dot и pi
import './Styles/logo.css';       // Лого, анимации (уезжает наверх)
import './Styles/Buttons.css';    // Стили кнопок (включая exit-анимации)

import backgroundImage from './components/background.png';
import logoImage       from './components/logo.png';
import piImage         from './components/pi.png';

export default function MainMenu() {
  const navigate = useNavigate();
  const [logoAnimated, setLogoAnimated] = useState(false);
  const [buttonsAnimated, setButtonsAnimated] = useState(false);

  // Генерация случайных длительностей для π-иконки
  const [moveDuration, setMoveDuration]     = useState('70s');
  const [rotateDuration, setRotateDuration] = useState('6s');

  useEffect(() => {
    // Запускаем анимацию появления логотипа через 100ms (чтобы background уже был рендерен)
    const logoTimer = setTimeout(() => setLogoAnimated(true), 100);

    // После того как логотип «съедет» вниз (около 800ms), запускаем появление кнопок
    const btnTimer = setTimeout(() => setButtonsAnimated(true), 900);

    // Генерация длительностей для π-иконки (движение и вращение)
    const rndMove = Math.random() * (90 - 50) + 50; // диапазон [50,90]
    const rndRot  = Math.random() * (8 - 4)  + 4;  // диапазон [4,8]
    setMoveDuration(`${rndMove.toFixed(2)}s`);
    setRotateDuration(`${rndRot.toFixed(2)}s`);

    return () => {
      clearTimeout(logoTimer);
      clearTimeout(btnTimer);
    };
  }, []);

  const handleClick = (e, route) => {
    const btn = e.currentTarget;
    // Риппл-эффект (оставляем без изменений)
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

    // 1. Запускаем exit-анимацию логотипа: добавляем класс animate-logo-exit (если нужно)
    const logoElem = document.querySelector('.logo-wrapper');
    if (logoElem) {
      logoElem.classList.add('animate-logo-exit');
    }

    // 2. Запускаем exit-анимацию **только у кнопок**:
    //    добавляем каждому элементу .btn-custom классы animate-exit и btn-exit{index}
    const allButtons = document.querySelectorAll('.btn-custom');
    allButtons.forEach((buttonElem, index) => {
      // index начинается с 0, нам нужен порядковый номер с 1
      const exitClass = `btn-exit${index + 1}`;
      buttonElem.classList.add('animate-exit', exitClass);
    });

    // 3. Ждём 0.8–1 секунду (чтобы exit-анимации отработали) и переходим по route
    setTimeout(() => navigate(route), 1000);
  };

  const buttons = [
    { to: '/polls',    label: 'Опросы'    },
    { to: '/employee', label: 'Сотруднику' },
    // Добавьте при необходимости ещё
  ];

  // Если logoAnimated=true, то добавляем класс animate-logo (появление)
  const logoClass = logoAnimated ? 'logo-wrapper animate-logo' : 'logo-wrapper';

  return (
    <div
      className="mainmenu-container"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      {/* 10 «едва заметных» шариков — задаются через background.css */}
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

      {/* π-иконка в фоне, плывёт и покачивается */}
      <div
        className="pi-wrapper"
        style={{ '--pi-move-duration': moveDuration }}
      >
        <img
          src={piImage}
          className="pi-fly"
          alt="Pi"
          style={{ '--pi-rotate-duration': rotateDuration }}
        />
      </div>

      <div className="mainmenu-overlay" />

      {/* Логотип (появляется плавным «скольжением вниз» и скрывается при exit) */}
      <div className={logoClass}>
        <img
          src={logoImage}
          alt="Логотип РГС Жизнь"
          className="logo-image"
        />
      </div>

      {/* Кнопки (выезжают изнизу при загрузке и уезжают вниз при exit) */}
      <div className="button-container">
        {buttons.map((btn, idx) => (
          <button
            key={btn.to}
            className={`btn-custom ${buttonsAnimated ? 'animate-btn' : ''}`}
            onClick={(e) => handleClick(e, btn.to)}
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
}















































