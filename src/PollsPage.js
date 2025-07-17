// PollsPage.js - Точная копия стилей MainMenu с классами
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Styles/logo.css';       // Лого, анимации (уезжает наверх)
import './Styles/Buttons.css';    // Стили кнопок (включая exit-анимации)
import logoImage       from './components/logo.png';

export default function PollsPage() {
  const navigate    = useNavigate();
  const logoRef     = useRef(null);
  const homeRef     = useRef(null);
  const buttonRefs  = useRef([]);

  const [logoAnimated, setLogoAnimated] = useState(false);
  const [buttonsAnimated, setButtonsAnimated] = useState(false);
  const [qrData, setQrData] = useState({ open: false, path: '', label: '' });

  // Генерация случайных длительностей для π-иконки
  const [moveDuration, setMoveDuration] = useState('70s');
  const [rotateDuration, setRotateDuration] = useState('6s');

  const polls = [
    { path: '/assessment',   label: 'Оценка кандидата' },
    { path: '/feedback',     label: 'Обратная связь'   },
    { path: '/marzapoll',    label: 'Маржа продаж'     },
  ];

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

  // Обработчик клика по основной кнопке опроса
  const handleClick = (e, path) => {
    const btn = e.currentTarget;
    // Риппл-эффект (точно как в MainMenu)
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

    // 1. Запускаем exit-анимацию логотипа: добавляем класс animate-logo-exit
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
    setTimeout(() => navigate(path), 1000);
  };

  // Обработчик клика по QR кнопке
  const handleQrClick = (e, poll) => {
    e.stopPropagation();
    setQrData({ open: true, path: poll.path, label: poll.label });
  };

  const closeQr = () => setQrData({ open: false, path: '', label: '' });

  const qrUrl = qrData.path ? `${window.location.origin}${qrData.path}` : '';

  const handleHomeClick = (e) => {
    const btn = e.currentTarget;
    // Риппл-эффект
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

    // Exit анимации
    const logoElem = document.querySelector('.logo-wrapper');
    if (logoElem) {
      logoElem.classList.add('animate-logo-exit');
    }

    const allButtons = document.querySelectorAll('.btn-custom');
    allButtons.forEach((buttonElem, index) => {
      const exitClass = `btn-exit${index + 1}`;
      buttonElem.classList.add('animate-exit', exitClass);
    });

    setTimeout(() => navigate('/main-menu'), 1000);
  };

  // Если logoAnimated=true, то добавляем класс animate-logo (появление)
  const logoClass = logoAnimated ? 'logo-wrapper animate-logo' : 'logo-wrapper';

  return (
    <>
      <div
        className="mainmenu-container"
        style={{ 
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Оверлей с точно таким же градиентом как в MainMenu */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, rgba(147, 39, 143, 0.85) 0%, rgba(71, 125, 191, 0.85) 100%)',
          zIndex: 1
        }} />
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

        {/* Кнопка "Домой" с точными стилями из HomeButton.css */}
        <button
          ref={homeRef}
          onClick={handleHomeClick}
          className="home-btn animate-home"
          style={{
            position: 'absolute',
            top: '150px',
            left: '70px',
            width: '80px',
            height: '80px',
            background: 'rgba(255, 255, 255, 0.10)',
            backdropFilter: 'blur(8px)',
            border: '1.5px solid rgba(255,255,255,0.17)',
            borderRadius: '16px',
            zIndex: 5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: 'translateX(-200%)',
            opacity: 0,
            transition: 'transform 0.8s cubic-bezier(0.22,1,0.36,1) 0.1s, opacity 0.5s ease 0.1s',
            cursor: 'pointer'
          }}
        >
          <svg 
            className="home-icon"
            style={{
              width: '36px',
              height: '36px',
              fill: '#ffffff',
              opacity: 0,
              transition: 'opacity 0.4s ease 0.3s'
            }}
            viewBox="0 0 24 24"
          >
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
          </svg>
        </button>

        {/* Кнопки (выезжают изнизу при загрузке и уезжают вниз при exit) */}
        <div className="button-container">
          {polls.map((poll, idx) => (
            <div
              key={poll.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                width: '100%'
              }}
            >
              {/* Основная кнопка опроса - ТОЧНО КАК В MAINMENU */}
              <button
                ref={el => buttonRefs.current[idx] = el}
                className={`btn-custom ${buttonsAnimated ? 'animate-btn' : ''}`}
                onClick={(e) => handleClick(e, poll.path)}
              >
                {poll.label}
              </button>
              
              {/* QR кнопка */}
              <button
                onClick={e => handleQrClick(e, poll)}
                style={{
                  width: '48px',
                  height: '48px',
                  minWidth: '48px',
                  background: 'linear-gradient(135deg, #9370DB 0%, #6A5ACD 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(147, 112, 219, 0.3)',
                  zIndex: 10
                }}
                title={`Получить QR-код для ${poll.label}`}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  style={{ width: '24px', height: '24px' }}
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
            animation: 'modal-fade-in 0.3s ease-out',
            padding: '20px'
          }}
          onClick={closeQr}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%)',
              backdropFilter: 'blur(20px)',
              borderRadius: '16px',
              padding: '30px',
              maxWidth: '90vw',
              maxHeight: '90vh',
              textAlign: 'center',
              position: 'relative',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              animation: 'modal-slide-up 0.3s ease-out',
              color: 'white',
              fontFamily: '"Montserrat", sans-serif'
            }}
            onClick={e => e.stopPropagation()}
          >
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
            
            <h3 style={{ margin: '0 0 10px 0', fontSize: '20px', fontWeight: '600' }}>
              QR-код для опроса
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '16px', opacity: 0.8 }}>
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
            
            <div>
              <button
                onClick={(e) => {
                  navigator.clipboard.writeText(qrUrl).then(() => {
                    const btn = e.target;
                    const originalText = btn.textContent;
                    btn.textContent = '✓ Скопировано!';
                    btn.style.background = 'rgba(76, 175, 80, 0.8)';
                    setTimeout(() => {
                      btn.textContent = originalText;
                      btn.style.background = 'rgba(33, 150, 243, 0.8)';
                    }, 2000);
                  });
                }}
                style={{
                  background: 'rgba(33, 150, 243, 0.8)',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontFamily: '"Montserrat", sans-serif',
                  fontWeight: '500'
                }}
              >
                Скопировать ссылку
              </button>
            </div>
          </div>
        </div>
      )}

      /* Инлайн стили для правильного позиционирования */
      <style>{`
        /* Скрываем шарики чтобы фон был чистый как в MainMenu */
        .mainmenu-container .subtle-dot {
          display: none !important;
        }

        /* Анимации кнопки домой из HomeButton.css */
        .home-btn.animate-home {
          transform: translateX(0) !important;
          opacity: 1 !important;
        }

        .home-btn.animate-home .home-icon {
          opacity: 1 !important;
        }

        .home-btn.animate-home-exit {
          transform: translateX(-200%) !important;
          opacity: 0 !important;
          transition: transform 0.7s cubic-bezier(0.65,0.05,0.36,1) 0.1s, opacity 0.4s ease 0.1s !important;
        }

        /* Мобильная версия */
        @media (max-width: 768px) {
          .home-btn {
            top: 160px !important;
            left: 60px !important;
            width: 64px !important;
            height: 64px !important;
            border-radius: 12px !important;
          }
          .home-btn .home-icon {
            width: 32px !important;
            height: 32px !important;
          }
        }

        /* Переопределяем position button-container для PollsPage */
        .mainmenu-container .button-container {
          position: absolute;
          top: 300px !important;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 20px;
          width: 100%;
          max-width: 400px;
          z-index: 10;
          padding: 0 20px;
          box-sizing: border-box;
        }

        /* Логотип точно как в MainMenu */
        .mainmenu-container .logo-wrapper {
          position: absolute;
          top: 110px;
          left: 50%;
          transform: translateX(-50%);
          width: 160px !important;
          height: 160px !important;
          backgroundColor: rgba(255, 255, 255, 0.10);
          backdropFilter: blur(8px);
          borderRadius: 20px;
          boxShadow: 0 10px 25px rgba(0, 0, 0, 0.25);
          zIndex: 3;
          display: flex;
          alignItems: center;
          justifyContent: center;
        }

        .mainmenu-container .logo-image {
          width: 120px !important;
          height: 120px !important;
          objectFit: contain;
        }

        /* Стили кнопок точно как в MainMenu */
        .mainmenu-container .btn-custom {
          background: linear-gradient(135deg, #9370DB 0%, #6A5ACD 100%) !important;
          color: white !important;
          padding: 12px 24px !important;
          borderRadius: 8px !important;
          border: none !important;
          fontSize: 18px !important;
          fontWeight: 300 !important;
          cursor: pointer !important;
          position: relative !important;
          overflow: hidden !important;
          minWidth: 280px !important;
          maxWidth: 400px !important;
          width: 100% !important;
          boxShadow: 0 4px 15px rgba(147, 112, 219, 0.3) !important;
          transition: transform 0.3s ease, box-shadow 0.3s ease !important;
          textAlign: center !important;
          fontFamily: 'Montserrat', sans-serif !important;
          minHeight: auto !important;
          lineHeight: 1.2 !important;
        }

        /* Импорт шрифта Montserrat если еще не подключен */
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap');

        @keyframes modal-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes modal-slide-up {
          from {
            opacity: 0;
            transform: translateY(50px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .animate-home {
          opacity: 1 !important;
          transform: translateX(0) !important;
        }

        .home-btn {
          opacity: 0;
          transform: translateX(-100px);
          transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
      `}</style>
    </>
  );
}