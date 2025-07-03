// PollsPage.js
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import './Styles/HomeButton.css';
import './Styles/background.css';
import './Styles/logo.css';
import './Styles/Buttons.css';

import backgroundImage from './components/background.png';
import logoImage       from './components/logo.png';
import piImage         from './components/pi.png';

export default function PollsPage() {
  const navigate    = useNavigate();
  const logoRef     = useRef(null);
  const homeRef     = useRef(null);
  const buttonRefs  = useRef([]);

  const [buttonsAnimated, setButtonsAnimated] = useState(false);

  // Новый стейт для QR‑модалки
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

  // общий ripple + exit + навигация
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

  // обработчик для QR‑кнопки
  const handleQrClick = (e, poll) => {
    e.stopPropagation();
    // ripple по QR‑кнопке
    const btn = e.currentTarget;
    const circle = document.createElement('span');
    const d = Math.max(btn.clientWidth, btn.clientHeight), r = d/2;
    circle.style.width = circle.style.height = `${d}px`;
    circle.style.left  = `${e.clientX - btn.offsetLeft  - r}px`;
    circle.style.top   = `${e.clientY - btn.offsetTop   - r}px`;
    circle.className = 'ripple';
    btn.querySelector('.ripple')?.remove();
    btn.appendChild(circle);

    // открываем модалку со всеми данными
    setQrData({ open: true, path: poll.path, label: poll.label });
  };

  // закрыть модалку
  const closeQr = () => setQrData({ open: false, path: '', label: '' });

  // URL, который кодируем
  const qrUrl = qrData.open
    ? `${window.location.origin}${qrData.path}`
    : '';

  return (
    <>
      <div
        className="mainmenu-container"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        {/* точки */}
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} className={`subtle-dot dot-${i+1}`} />
        ))}
        {/* π */}
        <div className="pi-wrapper">
          <img src={piImage} className="pi-fly" alt="Pi" />
        </div>
        <div className="mainmenu-overlay"/>

        {/* Домой */}
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

        {/* Пары «опрос + QR» */}
        <div className="button-container">
          {polls.map((p, idx) => (
            <div
              key={p.path}
              className={`poll-row ${buttonsAnimated ? 'animate-row' : ''}`}
              style={{animationDelay: `${idx * 0.15}s`}}
            >
              <button
                ref={el => buttonRefs.current[idx] = el}
                className="btn-custom"
                onClick={e => handleClick(e, p.path)}
              >
                {p.label}
              </button>
              
              {/* QR‑кнопка справа от основной кнопки */}
              <button
                className="qr-btn"
                onClick={e => handleQrClick(e, p)}
                aria-label={`QR-код для ${p.label}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="qr-icon">
                  <rect x="3" y="3" width="7" height="7" fill="white"/>
                  <rect x="14" y="3" width="7" height="7" fill="white"/>
                  <rect x="3" y="14" width="7" height="7" fill="white"/>
                  <rect x="5" y="5" width="3" height="3" fill="black"/>
                  <rect x="16" y="5" width="3" height="3" fill="black"/>
                  <rect x="5" y="16" width="3" height="3" fill="black"/>
                  <rect x="14" y="14" width="2" height="2" fill="white"/>
                  <rect x="17" y="14" width="2" height="2" fill="white"/>
                  <rect x="19" y="16" width="2" height="2" fill="white"/>
                  <rect x="14" y="17" width="2" height="2" fill="white"/>
                  <rect x="16" y="19" width="2" height="2" fill="white"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* QR‑модалка */}
      {qrData.open && (
        <div className="qr-modal" onClick={closeQr}>
          <div className="qr-modal-content" onClick={e => e.stopPropagation()}>
            <button className="qr-close" onClick={closeQr}>×</button>
            <h3>QR-код для опроса</h3>
            <p>«{qrData.label}»</p>
            
            {/* QR-код (используем внешний сервис) */}
            <div className="qr-code-container">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}`}
                alt="QR Code"
                className="qr-code-image"
              />
            </div>
            
            <p className="qr-url">{qrUrl}</p>
            
            <div className="qr-actions">
              <button
                className="qr-copy-btn"
                onClick={() => {
                  navigator.clipboard.writeText(qrUrl);
                  alert('Ссылка скопирована!');
                }}
              >
                Копировать ссылку
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}











































