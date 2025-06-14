// PollsPage.js
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import './Styles/background.css';
import './Styles/logo.css';
import './Styles/Buttons.css';
import './Styles/HomeButton.css';

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
    { path: '/assessment', label: 'Оценка кандидата' },
    { path: '/feedback',   label: 'Обратная связь'   },
    { path: '/marzapoll',  label: 'Маржа продаж'     },
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
              ref={el => (buttonRefs.current[idx] = el)}
            >
              <button
                className="btn-custom"
                onClick={e => handleClick(e, p.path)}
              >
                {p.label}
              </button>
              <button
                className="btn-qr"
                onClick={e => handleQrClick(e, p)}
                aria-label="QR‑код"
              >
                <svg xmlns="http://www.w3.org/2000/svg"
                     viewBox="0 0 24 24"
                     width="20" height="20"
                     fill="white"
                     stroke="none"
                >
                  <rect x="3"  y="3"  width="4" height="4"/>
                  <rect x="3"  y="17" width="4" height="4"/>
                  <rect x="17" y="3"  width="4" height="4"/>
                  <rect x="9"  y="9"  width="6" height="6"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Модальное окно с QR */}
      {qrData.open && (
        <div className="qr-modal">
          <div className="qr-overlay" onClick={closeQr} />
          <div className="qr-box">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code?size=256x256&data=${encodeURIComponent(qrUrl)}`}
              alt="QR‑code"
            />
            <div className="qr-label">{qrData.label}</div>
            <button className="btn-custom btn-close" onClick={closeQr}>
              Закрыть
            </button>
          </div>
        </div>
      )}
    </>
  );
}











































