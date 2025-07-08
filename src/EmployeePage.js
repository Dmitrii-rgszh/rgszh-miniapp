// EmployeePage.js - ВЕРСИЯ С ПОЛНЫМИ ИНЛАЙН СТИЛЯМИ

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';

import backgroundImage from './components/background.png';
import logoImage from './components/logo.png';
import piImage from './components/pi.png';

const EmployeePage = () => {
  const navigate = useNavigate();
  
  // Состояния анимаций
  const [logoAnimated, setLogoAnimated] = useState(false);
  const [titleAnimated, setTitleAnimated] = useState(false);
  const [buttonsAnimated, setButtonsAnimated] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  
  // Длительности анимаций Pi
  const [moveDuration] = useState('70s');
  const [rotateDuration] = useState('6s');

  // ===== СТИЛИ =====

  // Основной контейнер
  const mainContainerStyle = {
    position: 'relative',
    width: '100%',
    height: '100vh',
    backgroundImage: `url(${backgroundImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  };

  // Оверлей с градиентом
  const overlayStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, rgba(147, 39, 143, 0.85) 0%, rgba(71, 125, 191, 0.85) 100%)',
    zIndex: 1
  };

  // Логотип с анимацией
  const logoStyle = {
    position: 'absolute',
    top: logoAnimated && !isExiting ? '80px' : isExiting ? '-200px' : '-200px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '160px',
    height: '160px',
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    backdropFilter: 'blur(8px)',
    borderRadius: '20px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.25)',
    opacity: logoAnimated && !isExiting ? 1 : 0,
    zIndex: 3,
    transition: 'all 0.8s ease-out',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const logoImageStyle = {
    width: '120px',
    height: '120px',
    objectFit: 'contain'
  };

  // Заголовок страницы
  const titleStyle = {
    position: 'absolute',
    top: titleAnimated && !isExiting ? '260px' : isExiting ? '400px' : '200px',
    left: '50%',
    transform: 'translateX(-50%)',
    fontSize: '24px',
    fontWeight: 'bold',
    color: 'white',
    textShadow: '2px 2px 8px rgba(0, 0, 0, 0.5)',
    zIndex: 3,
    opacity: titleAnimated && !isExiting ? 1 : 0,
    transition: 'all 0.8s ease-out',
    whiteSpace: 'nowrap'
  };

  // Контейнер кнопок - под заголовком
  const buttonContainerStyle = {
    position: 'absolute',
    top: buttonsAnimated ? '320px' : '420px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    maxWidth: '400px',
    zIndex: 3,
    paddingLeft: '20px',
    paddingRight: '20px',
    boxSizing: 'border-box',
    opacity: buttonsAnimated ? 1 : 0,
    transition: 'all 0.8s ease-out'
  };

  // Базовый стиль кнопки
  const getButtonStyle = () => ({
    background: 'linear-gradient(135deg, #9370DB 0%, #6A5ACD 100%)',
    color: 'white',
    padding: '18px 40px',
    borderRadius: '12px',
    border: 'none',
    fontSize: '18px',
    fontWeight: '600',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    minWidth: '280px',
    maxWidth: '400px',
    width: '100%',
    boxShadow: '0 4px 15px rgba(147, 112, 219, 0.3)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease'
  });

  // Точки фона
  const dotStyle = (index) => ({
    position: 'absolute',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.2)',
    zIndex: 1,
    animation: `dotPulse${(index % 3) + 1} ${4 + (index % 3)}s ease-in-out infinite`,
    ...(index === 1 && { top: '10%', left: '10%' }),
    ...(index === 2 && { top: '20%', right: '15%' }),
    ...(index === 3 && { top: '30%', left: '25%' }),
    ...(index === 4 && { bottom: '15%', left: '15%' }),
    ...(index === 5 && { top: '5%', right: '20%' }),
    ...(index === 6 && { bottom: '25%', right: '10%' }),
    ...(index === 7 && { top: '45%', left: '5%' }),
    ...(index === 8 && { bottom: '5%', right: '30%' }),
    ...(index === 9 && { top: '60%', right: '25%' }),
    ...(index === 10 && { bottom: '40%', left: '30%' })
  });

  // Pi элемент с космической анимацией
  const piWrapperStyle = {
    position: 'absolute',
    top: '0',
    left: '0',
    zIndex: 2,
    opacity: 0.4,
    animation: `piFloatAround ${moveDuration} ease-in-out infinite`
  };

  const piImageStyle = {
    width: '40px',
    height: '40px',
    opacity: 0.8,
    animation: `piRotate ${rotateDuration} linear infinite`
  };

  // ===== ЛОГИКА =====

  useEffect(() => {
    // Запускаем анимации появления с задержками
    const logoTimer = setTimeout(() => setLogoAnimated(true), 100);
    const titleTimer = setTimeout(() => setTitleAnimated(true), 600);
    const buttonsTimer = setTimeout(() => setButtonsAnimated(true), 1100);

    return () => {
      clearTimeout(logoTimer);
      clearTimeout(titleTimer);
      clearTimeout(buttonsTimer);
    };
  }, []);

  // Обработчик клика с риппл-эффектом и анимацией выхода
  const handleClick = (e, route) => {
    const btn = e.currentTarget;
    
    // Риппл-эффект
    const circle = document.createElement('span');
    const diameter = Math.max(btn.clientWidth, btn.clientHeight);
    const radius = diameter / 2;
    
    circle.style.cssText = `
      position: absolute;
      width: ${diameter}px;
      height: ${diameter}px;
      left: ${e.clientX - btn.offsetLeft - radius}px;
      top: ${e.clientY - btn.offsetTop - radius}px;
      background: rgba(255, 255, 255, 0.6);
      border-radius: 50%;
      transform: scale(0);
      animation: ripple 0.6s linear;
      pointer-events: none;
    `;
    
    // Удаляем предыдущий риппл
    const oldRipple = btn.querySelector('.ripple');
    if (oldRipple) oldRipple.remove();
    
    circle.className = 'ripple';
    btn.appendChild(circle);

    // Запускаем анимацию выхода
    setIsExiting(true);

    // Переходим на новую страницу
    setTimeout(() => navigate(route), 1000);
  };

  // Swipe обработчик для возврата
  const swipeHandlers = useSwipeable({
    onSwipedRight: () => navigate('/main-menu'),
    preventDefaultTouchmoveEvent: true,
    trackMouse: true,
  });

  // Продукты для сотрудника
  const products = [
    { to: '/justincase', label: 'На всякий случай' },
    { to: '/snp', label: 'Стратегия на пять. Гарант' },
    { to: '/carefuture', label: 'Забота о будущем' }
  ];

  // ===== РЕНДЕРИНГ =====

  // CSS анимации
  const animations = (
    <style>
      {`
        @keyframes piRotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes piFloatAround {
          0% { 
            left: 10%; 
            top: 10%; 
            transform: scale(1); 
          }
          12.5% { 
            left: 80%; 
            top: 15%; 
            transform: scale(1.2); 
          }
          25% { 
            left: 85%; 
            top: 40%; 
            transform: scale(0.8); 
          }
          37.5% { 
            left: 70%; 
            top: 70%; 
            transform: scale(1.1); 
          }
          50% { 
            left: 40%; 
            top: 80%; 
            transform: scale(0.9); 
          }
          62.5% { 
            left: 15%; 
            top: 75%; 
            transform: scale(1.3); 
          }
          75% { 
            left: 5%; 
            top: 50%; 
            transform: scale(0.7); 
          }
          87.5% { 
            left: 20%; 
            top: 25%; 
            transform: scale(1.1); 
          }
          100% { 
            left: 10%; 
            top: 10%; 
            transform: scale(1); 
          }
        }

        @keyframes ripple {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }

        @keyframes dotPulse1 {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.5); }
        }
        @keyframes dotPulse2 {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.3); }
        }
        @keyframes dotPulse3 {
          0%, 100% { opacity: 0.1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.8); }
        }

        /* Hover эффекты для кнопок */
        .employee-button:hover {
          transform: translateY(-3px) !important;
          box-shadow: 0 8px 25px rgba(147, 112, 219, 0.4) !important;
        }

        .employee-button:active {
          transform: translateY(0) scale(0.98) !important;
        }

        .employee-button:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.3);
        }

        /* Адаптивность */
        @media (max-width: 768px) {
          .employee-button {
            min-width: 260px !important;
            padding: 16px 32px !important;
            font-size: 16px !important;
          }
        }

        @media (max-width: 480px) {
          .employee-button {
            min-width: 240px !important;
            padding: 14px 28px !important;
            font-size: 15px !important;
          }
        }
      `}
    </style>
  );

  return (
    <div style={mainContainerStyle} {...swipeHandlers}>
      {animations}

      {/* Фоновые точки с пульсирующими анимациями */}
      {[1,2,3,4,5,6,7,8,9,10].map(n => (
        <div key={n} style={dotStyle(n)} />
      ))}

      {/* Pi элемент с космической анимацией */}
      <div style={piWrapperStyle}>
        <img src={piImage} style={piImageStyle} alt="Pi" />
      </div>

      {/* Оверлей */}
      <div style={overlayStyle} />

      {/* Логотип */}
      <div style={logoStyle}>
        <img
          src={logoImage}
          alt="Логотип РГС Жизнь"
          style={logoImageStyle}
        />
      </div>

      {/* Заголовок страницы */}
      <h2 style={titleStyle}>
        Страница сотрудника
      </h2>

      {/* Кнопки продуктов */}
      <div style={buttonContainerStyle}>
        {products.map((product, index) => (
          <button
            key={product.to}
            className="employee-button"
            style={getButtonStyle()}
            onClick={(e) => handleClick(e, product.to)}
            onMouseEnter={(e) => {
              if (!isExiting) {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(147, 112, 219, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isExiting) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(147, 112, 219, 0.3)';
              }
            }}
          >
            {product.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default EmployeePage;