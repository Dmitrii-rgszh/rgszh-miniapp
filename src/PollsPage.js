// PollsPage.js - АДАПТИВНАЯ ВЕРСИЯ
// ✨ Обычные кнопки с корпоративными стилями + Квадратные QR кнопки + Адаптивность

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logoImage from './components/logo.png';
import './Styles/HomeButton.css'; // Импортируем CSS для кнопки "Домой"

export default function PollsPage() {
  const navigate = useNavigate();
  const logoRef = useRef(null);
  const homeRef = useRef(null);
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Состояния анимаций
  const [logoAnimated, setLogoAnimated] = useState(false);
  const [buttonsAnimated, setButtonsAnimated] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [qrData, setQrData] = useState({ open: false, path: '', label: '' });

  // Список опросов
  const polls = [
    { path: '/assessment', label: 'Оценка кандидата' },
    { path: '/feedback', label: 'Обратная связь' },
    { path: '/marzapoll', label: 'Маржа продаж' },
  ];

  // Обработчик изменения размера окна
  useEffect(() => {
    const handleResize = () => {
      setWindowHeight(window.innerHeight);
      setWindowWidth(window.innerWidth);
      // Принудительно перерендерим компонент при изменении ориентации
      setTimeout(() => {
        setWindowHeight(window.innerHeight);
        setWindowWidth(window.innerWidth);
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    // Дополнительная проверка для мобильных браузеров
    const checkMobile = () => {
      if (window.innerWidth < 768) {
        handleResize();
      }
    };
    
    setTimeout(checkMobile, 300); // Задержка для корректной работы на мобильных
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // ===== АДАПТИВНЫЕ ПАРАМЕТРЫ =====

  // Определяем размеры в зависимости от размера экрана
  const isSmallScreen = windowHeight < 700 || windowWidth < 400;
  const isMobileWidth = windowWidth < 768;
  const isMediumScreen = windowHeight >= 700 && windowHeight < 900;
  
  // Адаптивные значения
  const logoSize = isSmallScreen ? 96 : 128;
  const logoTop = isSmallScreen ? 80 : 110;
  const logoImageSize = isSmallScreen ? 72 : 96;
  const qrButtonSize = isSmallScreen ? 48 : 56;
  const qrIconSize = isSmallScreen ? 20 : 24;
  const buttonsTop = isSmallScreen ? 200 : (isMediumScreen ? 240 : 268);
  const buttonContainerMaxWidth = isSmallScreen ? 340 : 400;
  const buttonContainerGap = isSmallScreen ? 16 : 20;
  const buttonContainerPadding = 20;

  // Состояния для анимации кнопки домой
  const [homeAnimated, setHomeAnimated] = useState(false);

  // ===== СТИЛИ =====

  // Основной контейнер
  const mainContainerStyle = {
    position: 'relative',
    width: '100%',
    height: windowHeight + 'px',
    minHeight: '100vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, sans-serif'
  };

  // Логотип - адаптивный размер
  const logoStyle = {
    position: 'absolute',
    top: logoAnimated && !isExiting ? `${logoTop}px` : isExiting ? '-200px' : '-200px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: `${logoSize}px`,
    height: `${logoSize}px`,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    backdropFilter: 'blur(8px)',
    borderRadius: isSmallScreen ? '16px' : '20px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.25)',
    opacity: logoAnimated && !isExiting ? 1 : 0,
    zIndex: 3,
    transition: 'all 0.8s ease-out',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  // Изображение логотипа - адаптивный размер
  const logoImageStyle = {
    width: `${logoImageSize}px`,
    height: `${logoImageSize}px`,
    objectFit: 'contain'
  };

  // Контейнер кнопок
  const buttonContainerStyle = {
    position: 'absolute',
    top: buttonsAnimated ? `${buttonsTop}px` : `${buttonsTop + 100}px`,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    flexDirection: 'column',
    gap: `${buttonContainerGap}px`,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    maxWidth: `${buttonContainerMaxWidth}px`,
    zIndex: 3,
    paddingLeft: `${buttonContainerPadding}px`,
    paddingRight: `${buttonContainerPadding}px`,
    boxSizing: 'border-box',
    opacity: buttonsAnimated ? 1 : 0,
    transition: 'all 0.8s ease-out 0.2s'
  };

  // Стиль для обычных кнопок
  const getButtonStyle = (index, animated) => ({
    minWidth: isSmallScreen ? '240px' : '280px',
    background: 'linear-gradient(135deg, rgba(180, 0, 55, 0.9) 0%, rgba(153, 0, 55, 0.85) 50%, rgba(0, 40, 130, 0.9) 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    padding: isSmallScreen ? '16px 28px' : '18px 36px',
    cursor: 'pointer',
    transform: animated && !isExiting ? 'translateY(0)' : isExiting ? 'translateY(100px)' : 'translateY(50px)',
    opacity: animated && !isExiting ? 1 : 0,
    transition: `all 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) ${0.1 + index * 0.15}s`,
    zIndex: 2,
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
    // ЗАЩИТА ОТ ПЕРЕОПРЕДЕЛЕНИЙ
    fontSize: isSmallScreen ? '18px' : '20px',
    fontWeight: '600',
    fontFamily: '"Segoe UI", sans-serif',
    boxSizing: 'border-box',
    outline: 'none',
    textDecoration: 'none'
  });

  // Контейнер для кнопки опроса + QR кнопки
  const pollButtonContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: isSmallScreen ? '10px' : '12px',
    width: '100%',
    flexWrap: 'nowrap'
  };

  // QR кнопка - УСИЛЕННЫЕ СТИЛИ ДЛЯ ГАРАНТИРОВАННОГО КВАДРАТА
  const qrButtonStyle = {
    // РАЗМЕРЫ - ЖЕСТКО ФИКСИРОВАННЫЕ
    width: `${qrButtonSize}px`,
    height: `${qrButtonSize}px`,
    minWidth: `${qrButtonSize}px`,
    maxWidth: `${qrButtonSize}px`,
    minHeight: `${qrButtonSize}px`,
    maxHeight: `${qrButtonSize}px`,
    
    // БАЗОВЫЕ СТИЛИ
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    border: '1px solid rgba(255, 255, 255, 0.25)',
    borderRadius: isSmallScreen ? '10px' : '12px',
    cursor: 'pointer',
    
    // FLEXBOX ДЛЯ ЦЕНТРИРОВАНИЯ
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    
    // КРИТИЧЕСКИ ВАЖНО - ЗАПРЕТ НА ИЗМЕНЕНИЕ РАЗМЕРА
    flexShrink: 0,
    flexGrow: 0,
    flex: '0 0 auto',
    
    // СБРОС ВСЕХ ОТСТУПОВ И ТЕКСТА
    padding: '0 !important',
    margin: '0 !important',
    fontSize: '0 !important',
    lineHeight: '0 !important',
    letterSpacing: '0 !important',
    textIndent: '0 !important',
    textTransform: 'none !important',
    whiteSpace: 'nowrap !important',
    wordSpacing: '0 !important',
    
    // ПРОЧИЕ СТИЛИ
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
    zIndex: 10,
    boxSizing: 'border-box',
    outline: 'none',
    textDecoration: 'none',
    verticalAlign: 'top',
    
    // ДОПОЛНИТЕЛЬНАЯ ЗАЩИТА
    aspectRatio: '1 / 1',
    overflow: 'hidden',
    position: 'relative'
  };

  // ===== ЛОГИКА =====

  // Эффект для установки CSS переменных для позиционирования кнопки "Домой"
  useEffect(() => {
    if (homeRef.current) {
      const homeButtonSize = isSmallScreen ? 48 : 64;
      const homeButtonGap = isSmallScreen ? 20 : 30;
      
      // Вычисляем позицию
      const top = logoTop + (logoSize - homeButtonSize) / 2;
      const left = windowWidth < 400 
        ? '20px'
        : `calc(50% - ${logoSize/2}px - ${homeButtonGap}px - ${homeButtonSize}px)`;
      
      // Устанавливаем CSS переменные
      homeRef.current.style.setProperty('--home-button-top', `${top}px`);
      homeRef.current.style.setProperty('--home-button-left', left);
      homeRef.current.style.setProperty('--home-button-size', `${homeButtonSize}px`);
    }
  }, [logoSize, logoTop, windowWidth, isSmallScreen]);

  // Эффект для принудительного квадрата QR кнопок
  useEffect(() => {
    const enforceSquareButtons = () => {
      const qrButtons = document.querySelectorAll('.qr-button-polls');
      qrButtons.forEach(button => {
        // ПРИНУДИТЕЛЬНО УСТАНАВЛИВАЕМ РАЗМЕРЫ
        const size = isSmallScreen ? '48px' : '56px';
        button.style.setProperty('width', size, 'important');
        button.style.setProperty('height', size, 'important');
        button.style.setProperty('min-width', size, 'important');
        button.style.setProperty('max-width', size, 'important');
        button.style.setProperty('min-height', size, 'important');
        button.style.setProperty('max-height', size, 'important');
        button.style.setProperty('flex-shrink', '0', 'important');
        button.style.setProperty('flex-grow', '0', 'important');
        button.style.setProperty('padding', '0', 'important');
        button.style.setProperty('margin', '0', 'important');
        button.style.setProperty('box-sizing', 'border-box', 'important');
      });
    };

    // Применяем НЕМЕДЛЕННО
    enforceSquareButtons();
    
    // И при любых изменениях
    const observer = new MutationObserver(enforceSquareButtons);
    observer.observe(document.body, { childList: true, subtree: true });
    
    window.addEventListener('resize', enforceSquareButtons);
    window.addEventListener('orientationchange', enforceSquareButtons);
    
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', enforceSquareButtons);
      window.removeEventListener('orientationchange', enforceSquareButtons);
    };
  }, [isSmallScreen]);

  // Анимация входа
  useEffect(() => {
    const timer1 = setTimeout(() => {
      setLogoAnimated(true);
      setHomeAnimated(true);
    }, 100);
    const timer2 = setTimeout(() => setButtonsAnimated(true), 600);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);
  
  const handleClick = (path) => {
    if (isExiting) return;
    setIsExiting(true);
    setTimeout(() => navigate(path), 800);
  };

  // Обработка клика по кнопке "Домой"
  const handleHomeClick = () => {
    if (isExiting) return;
    setIsExiting(true);
    setTimeout(() => navigate('/main-menu'), 800);
  };

  // Обработчик QR кнопки
  const handleQrClick = (e, poll) => {
    e.stopPropagation();
    setQrData({ open: true, path: poll.path, label: poll.label });
  };

  // Hover эффект для кнопок (JavaScript реализация)
  const handleMouseEnter = (e) => {
    if (!isExiting) {
      e.target.style.transform = e.target.style.transform.replace('translateY(0)', 'translateY(-2px)');
      e.target.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.3)';
    }
  };

  const handleMouseLeave = (e) => {
    if (!isExiting) {
      e.target.style.transform = e.target.style.transform.replace('translateY(-2px)', 'translateY(0)');
      e.target.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
    }
  };

  const closeQr = () => setQrData({ open: false, path: '', label: '' });
  const qrUrl = qrData.path ? `${window.location.origin}${qrData.path}` : '';

  return (
    <div style={mainContainerStyle}>
      {/* Логотип */}
      <div ref={logoRef} style={logoStyle}>
        <img
          src={logoImage}
          alt="Логотип РГС Жизнь"
          style={logoImageStyle}
        />
      </div>

      {/* Кнопка "Домой" (стили через CSS) */}
      <button
        ref={homeRef}
        onClick={handleHomeClick}
        className={`home-button-polls ${homeAnimated ? 'animate-home' : ''} ${isExiting ? 'animate-home-exit' : ''}`}
        title="Назад в главное меню"
      >
        <svg viewBox="0 0 24 24">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
        </svg>
      </button>

      {/* Кнопки опросов с КВАДРАТНЫМИ QR кнопками */}
      <div style={buttonContainerStyle}>
        {polls.map((poll, index) => (
          <div key={poll.path} style={pollButtonContainerStyle}>
            {/* Основная кнопка опроса */}
            <button
              style={getButtonStyle(index, buttonsAnimated)}
              onClick={() => handleClick(poll.path)}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              {poll.label}
            </button>

            {/* QR кнопка - С ИНЛАЙН СТИЛЯМИ ДЛЯ ГАРАНТИИ */}
            <button
              onClick={(e) => handleQrClick(e, poll)}
              style={{
                ...qrButtonStyle,
                // Дублируем критические стили прямо здесь
                width: `${qrButtonSize}px !important`,
                height: `${qrButtonSize}px !important`,
                minWidth: `${qrButtonSize}px !important`,
                maxWidth: `${qrButtonSize}px !important`,
                minHeight: `${qrButtonSize}px !important`,
                maxHeight: `${qrButtonSize}px !important`,
              }}
              title={`QR-код для ${poll.label}`}
              className="qr-button-polls"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                style={{ 
                  width: `${qrIconSize}px`, 
                  height: `${qrIconSize}px` 
                }}
                fill="white"
              >
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
                <rect x="5" y="5" width="3" height="3" fill="currentColor" />
                <rect x="16" y="5" width="3" height="3" fill="currentColor" />
                <rect x="5" y="16" width="3" height="3" fill="currentColor" />
                <rect x="14" y="14" width="2" height="2" />
                <rect x="17" y="14" width="2" height="2" />
                <rect x="19" y="16" width="2" height="2" />
                <rect x="14" y="17" width="2" height="2" />
                <rect x="16" y="19" width="2" height="2" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* QR модальное окно */}
      {qrData.open && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(5px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={closeQr}
        >
          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(20px)',
              borderRadius: '20px',
              padding: isSmallScreen ? '20px' : '30px',
              maxWidth: '90vw',
              maxHeight: '90vh',
              textAlign: 'center',
              position: 'relative',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              color: 'white',
              fontFamily: '"Segoe UI", sans-serif',
              overflow: 'auto'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Кнопка закрытия */}
            <button
              onClick={closeQr}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: 'none',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '5px',
                lineHeight: 1
              }}
            >
              ×
            </button>
            
            {/* Заголовок */}
            <h3 style={{ 
              margin: '0 0 10px 0', 
              fontSize: isSmallScreen ? '18px' : '20px', 
              fontWeight: '700',
              fontFamily: '"Segoe UI", sans-serif'
            }}>
              QR-код для опроса
            </h3>
            
            <p style={{ 
              margin: '0 0 20px 0', 
              fontSize: isSmallScreen ? '14px' : '16px', 
              opacity: 0.8,
              fontWeight: '400'
            }}>
              «{qrData.label}»
            </p>
            
            {/* QR код */}
            <div
              style={{
                background: 'white',
                borderRadius: '12px',
                width: isSmallScreen ? '160px' : '200px',
                height: isSmallScreen ? '160px' : '200px',
                padding: '16px',
                margin: '20px auto',
                display: 'inline-block',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
              }}
            >
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}`}
                alt="QR Code"
                style={{
                  display: 'block',
                  width: isSmallScreen ? '128px' : '168px',
                  height: isSmallScreen ? '128px' : '168px',
                  borderRadius: '8px'
                }}
                loading="lazy"
              />
            </div>
            
            {/* URL */}
            <div
              style={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '12px',
                wordBreak: 'break-all',
                background: 'rgba(255, 255, 255, 0.1)',
                padding: '8px 12px',
                borderRadius: '6px',
                margin: '16px 0',
                fontFamily: 'monospace'
              }}
            >
              {qrUrl}
            </div>
            
            {/* Кнопка копирования */}
            <button
              onClick={(e) => {
                navigator.clipboard.writeText(qrUrl).then(() => {
                  const btn = e.target;
                  const originalText = btn.textContent;
                  btn.textContent = '✓ Скопировано!';
                  btn.style.background = 'rgba(76, 175, 80, 0.8)';
                  setTimeout(() => {
                    btn.textContent = originalText;
                    btn.style.background = 'linear-gradient(135deg, rgba(180, 0, 55, 0.9) 0%, rgba(153, 0, 55, 0.85) 50%, rgba(0, 40, 130, 0.9) 100%)';
                  }, 2000);
                });
              }}
              style={{
                background: 'linear-gradient(135deg, rgba(180, 0, 55, 0.9) 0%, rgba(153, 0, 55, 0.85) 50%, rgba(0, 40, 130, 0.9) 100%)',
                color: 'white',
                border: 'none',
                padding: isSmallScreen ? '10px 20px' : '12px 24px',
                borderRadius: '12px',
                fontSize: isSmallScreen ? '14px' : '16px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontFamily: '"Segoe UI", sans-serif',
                fontWeight: '600'
              }}
            >
              Скопировать ссылку
            </button>
          </div>
        </div>
      )}
    </div>
  );
}