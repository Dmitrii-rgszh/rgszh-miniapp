import React, { useLayoutEffect, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';

// Импортируем те же стили, что и в MainMenu и PollsPage
import './Styles/global.css';
import './Styles/background.css';
import './Styles/logo.css';
import './Styles/Buttons.css';
import './EmployeePage.css'; // Наши дополнительные стили

import backgroundImage from './components/background.png';
import logo from './components/logo.png';
import piImage from './components/pi.png';

const EmployeePage = () => {
  const navigate = useNavigate();
  const [logoAnimated, setLogoAnimated] = useState(false);
  const [buttonsAnimated, setButtonsAnimated] = useState(false);

  // Генерация случайных длительностей для π-иконки
  const [moveDuration, setMoveDuration] = useState('70s');
  const [rotateDuration, setRotateDuration] = useState('6s');

  const swipeHandlers = useSwipeable({
    onSwipedRight: () => navigate('/main-menu'),
    preventDefaultTouchmoveEvent: true,
    trackMouse: true,
  });

  const products = [
    { to: '/justincase', label: 'На всякий случай' },
    { to: '/snp', label: 'Стратегия на пять. Гарант' },
    { to: '/carefuture', label: 'Забота о будущем' },
  ];

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    // Запускаем анимацию появления логотипа через 100ms
    const logoTimer = setTimeout(() => setLogoAnimated(true), 100);

    // После того как логотип «съедет» вниз (около 800ms), запускаем появление кнопок
    const btnTimer = setTimeout(() => setButtonsAnimated(true), 900);

    // Генерация длительностей для π-иконки (движение и вращение)
    const rndMove = Math.random() * (90 - 50) + 50; // диапазон [50,90]
    const rndRot = Math.random() * (8 - 4) + 4;  // диапазон [4,8]
    setMoveDuration(`${rndMove.toFixed(2)}s`);
    setRotateDuration(`${rndRot.toFixed(2)}s`);

    return () => {
      clearTimeout(logoTimer);
      clearTimeout(btnTimer);
    };
  }, []);

  const handleClick = (e, route) => {
    const btn = e.currentTarget;
    
    // Риппл-эффект (точно как в MainMenu)
    const circle = document.createElement('span');
    const diameter = Math.max(btn.clientWidth, btn.clientHeight);
    const radius = diameter / 2;
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${e.clientX - btn.offsetLeft - radius}px`;
    circle.style.top = `${e.clientY - btn.offsetTop - radius}px`;
    circle.classList.add('ripple');
    const oldRipple = btn.getElementsByClassName('ripple')[0];
    if (oldRipple) oldRipple.remove();
    btn.appendChild(circle);

    // 1. Запускаем exit-анимацию логотипа
    const logoElem = document.querySelector('.logo-wrapper');
    if (logoElem) {
      logoElem.classList.add('animate-logo-exit');
    }

    // 2. Запускаем exit-анимацию заголовка
    const titleElem = document.querySelector('.page-title');
    if (titleElem) {
      titleElem.classList.add('animate-exit');
    }

    // 3. Запускаем exit-анимацию кнопок
    const allButtons = document.querySelectorAll('.btn-custom');
    allButtons.forEach((buttonElem, index) => {
      const exitClass = `btn-exit${index + 1}`;
      buttonElem.classList.add('animate-exit', exitClass);
    });

    // 4. Ждём 1 секунду и переходим по route
    setTimeout(() => navigate(route), 1000);
  };

  // Если logoAnimated=true, то добавляем класс animate-logo (появление)
  const logoClass = logoAnimated ? 'logo-wrapper animate-logo' : 'logo-wrapper';

  return (
    <div
      className="mainmenu-container"
      style={{ backgroundImage: `url(${backgroundImage})` }}
      {...swipeHandlers}
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
          src={logo}
          alt="Логотип РГС Жизнь"
          className="logo-image"
        />
      </div>

      {/* Заголовок страницы */}
      <h2 className="page-title">Страница сотрудника</h2>

      {/* Кнопки (выезжают изнизу при загрузке и уезжают вниз при exit) */}
      <div className="button-container">
        {products.map((product, idx) => (
          <button
            key={product.to}
            className={`btn-custom ${buttonsAnimated ? 'animate-btn' : ''}`}
            onClick={(e) => handleClick(e, product.to)}
          >
            {product.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default EmployeePage;