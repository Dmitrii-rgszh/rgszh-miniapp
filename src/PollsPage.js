// PollsPage.js - ПРИВЕДЕН В СООТВЕТСТВИЕ С MAINMENU
// ✨ Инлайн стили + MagneticButton + Точное позиционирование как в MainMenu

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logoImage from './components/logo.png';
import MagneticButton from './MagneticButton'; // Используем тот же компонент что и в MainMenu

export default function PollsPage() {
  const navigate = useNavigate();
  const logoRef = useRef(null);
  const homeRef = useRef(null);

  // Состояния анимаций (точно как в MainMenu)
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

  // ===== СТИЛИ (ТОЧНО КАК В MAINMENU) =====

  // Основной контейнер (идентичен MainMenu)
  const mainContainerStyle = {
    position: 'relative',
    width: '100%',
    height: window.innerHeight + 'px',
    minHeight: '100vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, sans-serif'
  };

  // Логотип (точно как в MainMenu)
  const logoStyle = {
    position: 'absolute',
    top: logoAnimated && !isExiting ? '110px' : isExiting ? '-200px' : '-200px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '128px',
    height: '128px',
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

  // Изображение логотипа (точно как в MainMenu)
  const logoImageStyle = {
    width: '96px',
    height: '96px',
    objectFit: 'contain'
  };

  // Контейнер кнопок (точно как в MainMenu)
  const buttonContainerStyle = {
    position: 'absolute',
    top: buttonsAnimated ? '268px' : '368px', // Точно как в MainMenu
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
    transition: 'all 0.8s ease-out 0.2s'
  };

  // Кнопка "Домой" - позиционируется относительно логотипа
  const homeButtonStyle = {
    position: 'absolute',
    top: '110px', // На том же уровне что и логотип
    left: 'calc(50% - 128px/2 - 20px - 64px)', // Слева от логотипа с отступом 20px
    width: '64px',
    height: '64px',
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255,255,255,0.17)',
    borderRadius: '16px',
    zIndex: 5,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    transform: logoAnimated ? 'translateX(0)' : 'translateX(-100px)',
    opacity: logoAnimated ? 1 : 0
  };

  // Стиль для магнитных кнопок (точно как в MainMenu)
  const getMagneticButtonStyle = (index, animated) => ({
    minWidth: '280px',
    transform: animated && !isExiting ? 'translateY(0)' : isExiting ? 'translateY(100px)' : 'translateY(50px)',
    opacity: animated && !isExiting ? 1 : 0,
    transition: `all 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) ${0.1 + index * 0.15}s`,
    zIndex: 2
  });

  // Контейнер для кнопки опроса + QR кнопки
  const pollButtonContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    width: '100%'
  };

  // QR кнопка - квадратная
  const qrButtonStyle = {
    width: '64px', // Увеличена до квадратной формы
    height: '64px',
    minWidth: '64px',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255, 255, 255, 0.25)',
    borderRadius: '12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
    zIndex: 10
  };

  // ===== ЛОГИКА (ТОЧНО КАК В MAINMENU) =====

  // Анимация входа (точно как в MainMenu)
  useEffect(() => {
    const timer1 = setTimeout(() => setLogoAnimated(true), 100);
    const timer2 = setTimeout(() => setButtonsAnimated(true), 600);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  // Обработка клика по кнопке опроса (точно как в MainMenu)
  const handleClick = (path) => {
    if (isExiting) return;
    
    setIsExiting(true);
    
    setTimeout(() => {
      navigate(path);
    }, 800);
  };

  // Обработка клика по кнопке "Домой"
  const handleHomeClick = () => {
    if (isExiting) return;
    
    setIsExiting(true);
    
    setTimeout(() => {
      navigate('/main-menu');
    }, 800);
  };

  // Обработчик QR кнопки
  const handleQrClick = (e, poll) => {
    e.stopPropagation();
    setQrData({ open: true, path: poll.path, label: poll.label });
  };

  const closeQr = () => setQrData({ open: false, path: '', label: '' });
  const qrUrl = qrData.path ? `${window.location.origin}${qrData.path}` : '';

  return (
    <div style={mainContainerStyle}>
      {/* Логотип (точно как в MainMenu) */}
      <div ref={logoRef} style={logoStyle}>
        <img
          src={logoImage}
          alt="Логотип РГС Жизнь"
          style={logoImageStyle}
        />
      </div>

      {/* Кнопка "Домой" */}
      <button
        ref={homeRef}
        onClick={handleHomeClick}
        style={homeButtonStyle}
        title="Назад в главное меню"
      >
        <svg 
          style={{
            width: '28px', // Увеличен размер иконки
            height: '28px',
            fill: '#ffffff'
          }}
          viewBox="0 0 24 24"
        >
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
        </svg>
      </button>

      {/* Кнопки опросов (точно как в MainMenu с добавлением QR кнопок) */}
      <div style={buttonContainerStyle}>
        {polls.map((poll, index) => (
          <div key={poll.path} style={pollButtonContainerStyle}>
            {/* Основная кнопка опроса */}
            <MagneticButton
              style={getMagneticButtonStyle(index, buttonsAnimated)}
              onClick={() => handleClick(poll.path)}
              magnetStrength={0.8}
              magnetDistance={240}
              enableRipple={true}
              enableGlow={true}
            >
              {poll.label}
            </MagneticButton>

            {/* QR кнопка */}
            <button
              onClick={(e) => handleQrClick(e, poll)}
              style={qrButtonStyle}
              title={`QR-код для ${poll.label}`}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                style={{ width: '24px', height: '24px' }} // Увеличен размер иконки QR
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
              padding: '30px',
              maxWidth: '90vw',
              maxHeight: '90vh',
              textAlign: 'center',
              position: 'relative',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              color: 'white',
              fontFamily: '"Segoe UI", sans-serif'
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
              fontSize: '20px', 
              fontWeight: '700', // Segoe UI Bold
              fontFamily: '"Segoe UI", sans-serif'
            }}>
              QR-код для опроса
            </h3>
            
            <p style={{ 
              margin: '0 0 20px 0', 
              fontSize: '16px', 
              opacity: 0.8,
              fontWeight: '400' // Segoe UI Regular
            }}>
              «{qrData.label}»
            </p>
            
            {/* QR код */}
            <div
              style={{
                background: 'white',
                borderRadius: '12px',
                width: '200px',
                height: '200px',
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
                  width: '168px',
                  height: '168px',
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
                padding: '12px 24px',
                borderRadius: '12px',
                fontSize: '16px',
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