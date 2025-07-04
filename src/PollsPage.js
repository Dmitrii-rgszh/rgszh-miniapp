// PollsPage.js - Исправленная версия с QR кнопками
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import './Styles/HomeButton.css';
import './Styles/background.css';
import './Styles/logo.css';
import './Styles/Buttons.css';
import './Styles/QRStyles.css';

import backgroundImage from './components/background.png';
import logoImage       from './components/logo.png';
import piImage         from './components/pi.png';

export default function PollsPage() {
  const navigate    = useNavigate();
  const logoRef     = useRef(null);
  const homeRef     = useRef(null);
  const buttonRefs  = useRef([]);

  const [buttonsAnimated, setButtonsAnimated] = useState(false);
  const [qrData, setQrData] = useState({ open: false, path: '', label: '' });

  const polls = [
    { path: '/assessment',   label: 'Оценка кандидата' },
    { path: '/feedback',     label: 'Обратная связь'   },
    { path: '/marzapoll',    label: 'Маржа продаж'     },
  ];

  useEffect(() => {
    const logoTimer    = setTimeout(() => logoRef.current?.classList.add('animate-logo'), 100);
    const homeTimer    = setTimeout(() => homeRef.current?.classList.add('animate-home'), 300);
    const buttonsTimer = setTimeout(() => setButtonsAnimated(true), 900);
    return () => {
      clearTimeout(logoTimer);
      clearTimeout(homeTimer);
      clearTimeout(buttonsTimer);
    };
  }, []);

  // Обработчик клика по основной кнопке опроса
  const handleClick = (e, path) => {
    const btn = e.currentTarget;
    const circle = document.createElement('span');
    const d = Math.max(btn.clientWidth, btn.clientHeight), r = d/2;
    circle.style.width = circle.style.height = `${d}px`;
    circle.style.left  = `${e.clientX - btn.offsetLeft  - r}px`;
    circle.style.top   = `${e.clientY - btn.offsetTop   - r}px`;
    circle.className = 'ripple';
    btn.querySelector('.ripple')?.remove();
    btn.appendChild(circle);

    logoRef.current?.classList.replace('animate-logo', 'animate-logo-exit');
    homeRef.current?.classList.replace('animate-home', 'animate-home-exit');
    buttonRefs.current.forEach((el,i) => el?.classList.add('animate-exit', `btn-exit${i+1}`));

    setTimeout(() => navigate(path), 800);
  };

  // Обработчик клика по QR кнопке
  const handleQrClick = (e, poll) => {
    e.stopPropagation();
    
    // Ripple эффект для QR кнопки
    const btn = e.currentTarget;
    const circle = document.createElement('span');
    const d = Math.max(btn.clientWidth, btn.clientHeight), r = d/2;
    circle.style.width = circle.style.height = `${d}px`;
    circle.style.left  = `${e.clientX - btn.offsetLeft  - r}px`;
    circle.style.top   = `${e.clientY - btn.offsetTop   - r}px`;
    circle.className = 'ripple';
    btn.querySelector('.ripple')?.remove();
    btn.appendChild(circle);

    // Открываем модальное окно
    setQrData({ open: true, path: poll.path, label: poll.label });
  };

  // Закрытие модального окна
  const closeQr = () => setQrData({ open: false, path: '', label: '' });

  // URL для QR кода
  const qrUrl = qrData.open ? `${window.location.origin}${qrData.path}` : '';

  return (
    <>
      <div
        className="mainmenu-container"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        {/* Фоновые элементы */}
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} className={`subtle-dot dot-${i+1}`} />
        ))}
        
        {/* π символ */}
        <div className="pi-wrapper">
          <img src={piImage} className="pi-fly" alt="Pi" />
        </div>
        <div className="mainmenu-overlay"/>

        {/* Кнопка "Домой" */}
        <button
          ref={homeRef}
          className="home-btn"
          onClick={e => handleClick(e, '/main-menu')}
          aria-label="Домой"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="home-icon">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
        </button>

        {/* Логотип */}
        <div ref={logoRef} className="logo-wrapper">
          <img src={logoImage} alt="Логотип" className="logo-image" />
        </div>

        {/* Контейнер кнопок опросов */}
        <div className="button-container">
          {polls.map((poll, idx) => (
            <div
              key={poll.path}
              className={`poll-row ${buttonsAnimated ? 'animate-row' : ''}`}
              style={{animationDelay: `${idx * 0.15}s`}}
            >
              {/* Основная кнопка опроса */}
              <button
                ref={el => buttonRefs.current[idx] = el}
                className="btn-custom"
                onClick={e => handleClick(e, poll.path)}
              >
                {poll.label}
              </button>
              
              {/* QR кнопка */}
              <button
                className="qr-btn"
                onClick={e => handleQrClick(e, poll)}
                aria-label={`QR-код для ${poll.label}`}
                title={`Получить QR-код для ${poll.label}`}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  className="qr-icon"
                  fill="white"
                >
                  {/* QR код иконка */}
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
        <div className="qr-modal" onClick={closeQr}>
          <div className="qr-modal-content" onClick={e => e.stopPropagation()}>
            <button className="qr-close" onClick={closeQr} aria-label="Закрыть">
              ×
            </button>
            
            <h3>QR-код для опроса</h3>
            <p>«{qrData.label}»</p>
            
            {/* QR код */}
            <div className="qr-code-container">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}`}
                alt="QR Code"
                className="qr-code-image"
                loading="lazy"
              />
            </div>
            
            <div className="qr-url">{qrUrl}</div>
            
            <div className="qr-actions">
              <button
                className="qr-copy-btn"
                onClick={(e) => {
                  navigator.clipboard.writeText(qrUrl).then(() => {
                    // Показываем уведомление
                    const btn = e.target;
                    const originalText = btn.textContent;
                    btn.textContent = '✓ Скопировано!';
                    setTimeout(() => {
                      btn.textContent = originalText;
                    }, 1500);
                  });
                }}
              >
                Копировать ссылку
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        /* Встроенные стили для QR функциональности */
        .poll-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          margin-bottom: 16px;
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.6s ease, transform 0.6s ease;
          gap: 12px;
        }
        
        .poll-row.animate-row {
          opacity: 1;
          transform: translateY(0);
        }
        
        .poll-row .btn-custom {
          flex: 1;
          min-width: auto;
          max-width: none;
        }
        
        .qr-btn {
          width: 48px;
          height: 48px;
          min-width: 48px;
          background: linear-gradient(120deg, var(--bg-dark-start), var(--bg-dark-end));
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        
        .qr-btn:hover {
          background: linear-gradient(120deg, #1a3a8a, #b91c7c);
          border-color: rgba(255, 255, 255, 0.4);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
        }
        
        .qr-icon {
          width: 24px;
          height: 24px;
          transition: all 0.3s ease;
        }
        
        .qr-btn:hover .qr-icon {
          transform: scale(1.1);
        }
        
        .qr-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: modal-fade-in 0.3s ease;
        }
        
        .qr-modal-content {
          background: linear-gradient(135deg, var(--bg-dark-start), var(--bg-dark-end));
          border-radius: 16px;
          padding: 24px;
          max-width: 400px;
          width: 90%;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.1);
          position: relative;
          animation: modal-slide-up 0.3s ease;
          text-align: center;
        }
        
        .qr-close {
          position: absolute;
          top: 12px;
          right: 16px;
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.7);
          font-size: 24px;
          cursor: pointer;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.3s ease;
        }
        
        .qr-close:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          transform: scale(1.1);
        }
        
        .qr-modal h3 {
          color: white;
          font-size: 20px;
          font-weight: 600;
          margin: 0 0 8px 0;
          font-family: 'Montserrat', sans-serif;
        }
        
        .qr-modal p {
          color: rgba(255, 255, 255, 0.8);
          font-size: 16px;
          margin: 0 0 20px 0;
          font-weight: 300;
        }
        
        .qr-code-container {
          background: white;
          border-radius: 12px;
          padding: 16px;
          margin: 20px 0;
          display: inline-block;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        }
        
        .qr-code-image {
          display: block;
          width: 200px;
          height: 200px;
          border-radius: 8px;
        }
        
        .qr-url {
          color: rgba(255, 255, 255, 0.7);
          font-size: 12px;
          word-break: break-all;
          background: rgba(255, 255, 255, 0.1);
          padding: 8px 12px;
          border-radius: 6px;
          margin: 16px 0;
          font-family: monospace;
        }
        
        .qr-copy-btn {
          background: rgba(33, 150, 243, 0.8);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: 'Montserrat', sans-serif;
          font-weight: 500;
        }
        
        .qr-copy-btn:hover {
          background: rgba(33, 150, 243, 1);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(33, 150, 243, 0.4);
        }
        
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
        
        @media (max-width: 768px) {
          .poll-row { gap: 8px; }
          .qr-btn { width: 40px; height: 40px; min-width: 40px; }
          .qr-icon { width: 20px; height: 20px; }
          .qr-modal-content { padding: 20px; margin: 20px; }
          .qr-code-image { width: 180px; height: 180px; }
        }
      `}</style>
    </>
  );
}











































