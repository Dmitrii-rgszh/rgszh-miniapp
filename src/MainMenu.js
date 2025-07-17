// MainMenu.js - ОБНОВЛЕННАЯ ВЕРСИЯ БЕЗ ЛОГИКИ ФОНОВ
// ✅ Вся логика фонов перенесена в MainApp.js
// ✅ Применены корпоративные цвета: R:180 G:0 B:55, R:152 G:164 B:174, R:0 G:40 B:130
// ✅ Семейство шрифтов: Segoe UI Bold для заголовков, Segoe UI Regular для текста
// ✅ Инлайн стили как основной подход
// ✅ Убраны импорты фонов - управление в MainApp.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// УПРОЩЕННЫЕ ИМПОРТЫ - убран backgroundImage
import logoImage from './components/logo.png';
import piImage from './components/pi.png';

export default function MainMenu() {
  const navigate = useNavigate();
  
  // Состояния анимаций
  const [logoAnimated, setLogoAnimated] = useState(false);
  const [buttonsAnimated, setButtonsAnimated] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  
  // Длительности анимаций Pi
  const [moveDuration] = useState('70s');
  const [rotateDuration] = useState('6s');

  // ===== СТИЛИ =====

  // Основной контейнер - БЕЗ ФОНА (фон управляется в MainApp.js)
  const mainContainerStyle = {
    position: 'relative',
    width: '100%',
    height: '100vh',
    minHeight: '100vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: '"Segoe UI", sans-serif',
    zIndex: 2, // Поверх фона из MainApp.js
    
    // Адаптивность для мобильных браузеров
    '@supports (-webkit-touch-callout: none)': {
      height: '-webkit-fill-available',
      minHeight: '-webkit-fill-available'
    }
  };

  // Оверлей с корпоративным градиентом поверх фона из MainApp.js
  const overlayStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: `linear-gradient(135deg, 
      rgba(180, 0, 55, 0.1) 0%,     /* Легкий красный оверлей */
      rgba(152, 164, 174, 0.05) 50%, /* Легкий серый оверлей */
      rgba(0, 40, 130, 0.1) 100%     /* Легкий синий оверлей */
    )`,
    zIndex: 1
  };

  // Логотип с анимацией
  const logoStyle = {
    position: 'absolute',
    top: logoAnimated && !isExiting ? '110px' : isExiting ? '-200px' : '-200px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '160px',
    height: '160px',
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    backdropFilter: 'blur(8px)',
    borderRadius: '20px',
    boxShadow: `
      0 10px 25px rgba(0, 0, 0, 0.25),
      0 5px 15px rgba(180, 0, 55, 0.2)
    `,
    opacity: logoAnimated && !isExiting ? 1 : 0,
    zIndex: 3,
    transition: 'all 0.8s ease-out',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(255, 255, 255, 0.2)'
  };

  const logoImageStyle = {
    width: '120px',
    height: '120px',
    objectFit: 'contain'
  };

  // Контейнер кнопок - ПОЗИЦИОНИРУЕМ ПОД ЛОГОТИПОМ
  const buttonContainerStyle = {
    position: 'absolute',
    top: buttonsAnimated ? '300px' : '400px', // Под логотипом
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

  // Базовый стиль кнопки с корпоративными цветами
  const baseButtonStyle = {
    width: '100%',
    padding: '15px 25px',
    fontSize: '16px',
    fontFamily: '"Segoe UI", sans-serif',
    fontWeight: 'bold',
    color: 'white',
    background: `linear-gradient(135deg, 
      rgba(180, 0, 55, 0.9) 0%, 
      rgba(153, 0, 55, 1) 100%
    )`,
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    textAlign: 'center',
    textDecoration: 'none',
    display: 'block',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(10px)',
    boxShadow: `
      0 4px 15px rgba(180, 0, 55, 0.3),
      0 2px 8px rgba(0, 0, 0, 0.2)
    `,
    border: '1px solid rgba(255, 255, 255, 0.1)'
  };

  // Hover эффект для кнопок
  const buttonHoverStyle = {
    ...baseButtonStyle,
    background: `linear-gradient(135deg, 
      rgba(152, 164, 174, 0.9) 0%, 
      rgba(118, 143, 146, 1) 100%
    )`,
    transform: 'translateY(-2px)',
    boxShadow: `
      0 6px 20px rgba(152, 164, 174, 0.4),
      0 3px 10px rgba(0, 0, 0, 0.3)
    `
  };

  // Pi элемент
  const piStyle = {
    position: 'absolute',
    width: '40px',
    height: '40px',
    opacity: 0.4,
    zIndex: 2,
    animation: `piMove ${moveDuration} linear infinite, piRotate ${rotateDuration} linear infinite`
  };

  // ===== АНИМАЦИИ =====

  // CSS-в-JS для анимации Pi
  const keyframesStyle = `
    @keyframes piMove {
      0% { top: 100%; left: -50px; }
      25% { top: -50px; left: 25%; }
      50% { top: 100%; left: 50%; }
      75% { top: -50px; left: 75%; }
      100% { top: 100%; left: calc(100% + 50px); }
    }
    
    @keyframes piRotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;

  // Добавляем анимации в head
  useEffect(() => {
    const styleId = 'mainmenu-animations';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = keyframesStyle;
      document.head.appendChild(style);
    }
  }, []);

  // Последовательные анимации
  useEffect(() => {
    const logoTimer = setTimeout(() => {
      setLogoAnimated(true);
    }, 300);

    const buttonsTimer = setTimeout(() => {
      setButtonsAnimated(true);
    }, 800);

    return () => {
      clearTimeout(logoTimer);
      clearTimeout(buttonsTimer);
    };
  }, []);

  // Навигация с анимацией выхода
  const handleNavigation = (path) => {
    setIsExiting(true);
    setTimeout(() => {
      navigate(path);
    }, 500);
  };

  return (
    <div style={mainContainerStyle}>
      {/* Оверлей поверх фона из MainApp.js */}
      <div style={overlayStyle} />

      {/* Логотип */}
      <div style={logoStyle}>
        <img src={logoImage} alt="Логотип" style={logoImageStyle} />
      </div>

      {/* Контейнер кнопок */}
      <div style={buttonContainerStyle}>
        <button
          style={baseButtonStyle}
          onClick={() => handleNavigation('/polls')}
          onMouseEnter={(e) => Object.assign(e.target.style, buttonHoverStyle)}
          onMouseLeave={(e) => Object.assign(e.target.style, baseButtonStyle)}
        >
          📊 Опросы
        </button>

        <button
          style={baseButtonStyle}
          onClick={() => handleNavigation('/snp')}
          onMouseEnter={(e) => Object.assign(e.target.style, buttonHoverStyle)}
          onMouseLeave={(e) => Object.assign(e.target.style, baseButtonStyle)}
        >
          🎯 SNP Анализ
        </button>

        <button
          style={baseButtonStyle}
          onClick={() => handleNavigation('/employee')}
          onMouseEnter={(e) => Object.assign(e.target.style, buttonHoverStyle)}
          onMouseLeave={(e) => Object.assign(e.target.style, baseButtonStyle)}
        >
          👥 Сотрудники
        </button>

        <button
          style={baseButtonStyle}
          onClick={() => handleNavigation('/assessment')}
          onMouseEnter={(e) => Object.assign(e.target.style, buttonHoverStyle)}
          onMouseLeave={(e) => Object.assign(e.target.style, baseButtonStyle)}
        >
          📝 Оценка
        </button>

        <button
          style={baseButtonStyle}
          onClick={() => handleNavigation('/carefuture')}
          onMouseEnter={(e) => Object.assign(e.target.style, buttonHoverStyle)}
          onMouseLeave={(e) => Object.assign(e.target.style, baseButtonStyle)}
        >
          💼 НСЖ Калькулятор
        </button>

        <button
          style={baseButtonStyle}
          onClick={() => handleNavigation('/marzapoll')}
          onMouseEnter={(e) => Object.assign(e.target.style, buttonHoverStyle)}
          onMouseLeave={(e) => Object.assign(e.target.style, baseButtonStyle)}
        >
          💰 Маржа Опрос
        </button>
      </div>

      {/* Pi элемент */}
      <img src={piImage} alt="Pi" style={piStyle} />
    </div>
  );
}















































