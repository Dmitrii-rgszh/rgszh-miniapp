import React, { useState, useRef, useEffect } from 'react';
import { useNavigate }                from 'react-router-dom';
import io                             from 'socket.io-client';

import './Styles/global.css';
import './Styles/background.css';
import './Styles/logo.css';
import './Styles/Buttons.css';
import './Styles/HomeButton.css';
import './Styles/ResetButton.css';
import './Styles/TelegramPolls.css';

import backgroundImage from './components/background.png';
import logoImage       from './components/logo.png';
import piImage         from './components/pi.png';

export default function MarzaPollPage() {
  const navigate  = useNavigate();
  const logoRef   = useRef(null);
  const homeRef   = useRef(null);
  const resetRef  = useRef(null);
  const socketRef = useRef(null);

  const initialOptions = [
    { text: 'Чтобы отстал руководитель', votes: 0 },
    { text: 'Чтобы перевыполнить план и заработать много деняк', votes: 0 },
    { text: 'Чтобы победить в конкурсе и полетать на самолёте', votes: 0 },
    { text: 'Чтобы клиент меня любил сильнее, чем маму', votes: 0 },
    { text: 'Какого ещё маржа? Я не в курсе', votes: 0 },
  ];
  const [options, setOptions]   = useState(initialOptions);
  const [selected, setSelected] = useState(null);
  const [voted, setVoted]       = useState(false);

  useEffect(() => {
    socketRef.current = io();
    socketRef.current.on('pollResults', ({ options: srv }) => {
      setOptions(srv);
    });
    socketRef.current.emit('joinPoll');

    setTimeout(() => logoRef.current?.classList.add('animate-logo'), 100);
    setTimeout(() => homeRef.current?.classList.add('animate-home'), 300);
    setTimeout(() => resetRef.current?.classList.add('animate-reset'), 500);

    return () => socketRef.current.disconnect();
  }, []);

  function selectOption(idx) {
    if (voted) return;
    setSelected(idx);
    socketRef.current.emit('newVote', idx);
    setVoted(true);
  }

  function handleReset(e) {
    e.stopPropagation();
    if (!window.confirm('Вы точно хотите сбросить результаты опроса?')) return;

    resetRef.current.classList.replace('animate-reset','animate-reset-exit');
    socketRef.current.emit('resetPoll');

    setOptions(initialOptions);
    setSelected(null);
    setVoted(false);

    setTimeout(() => {
      resetRef.current.classList.replace('animate-reset-exit','animate-reset');
    }, 600);
  }

  function handleHome() {
    logoRef.current?.classList.replace('animate-logo','animate-logo-exit');
    homeRef.current?.classList.replace('animate-home','animate-home-exit');
    resetRef.current?.classList.replace('animate-reset','animate-reset-exit');
    setTimeout(() => navigate('/polls'), 700);
  }

  return (
    <div className="mainmenu-container" style={{ backgroundImage: `url(${backgroundImage})` }}>
      {Array.from({ length: 10 }, (_, i) => (
        <div key={i} className={`subtle-dot dot-${i+1}`} />
      ))}
      <div className="pi-wrapper"><img src={piImage} alt="Pi" className="pi-fly"/></div>
      <div className="mainmenu-overlay"/>

      <button ref={homeRef} className="home-btn" onClick={handleHome} aria-label="Домой">
        <svg viewBox="0 0 24 24" className="home-icon">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
        </svg>
      </button>

      <div ref={logoRef} className="logo-wrapper">
        <img src={logoImage} alt="Логотип" className="logo-image"/>
      </div>

      <button ref={resetRef} className="reset-btn" onClick={handleReset} aria-label="Сбросить опрос">
        <svg viewBox="0 0 24 24" className="reset-icon">
          <path d="M12 4V1L8 5l4 4V6a6 6 0 016 6 6 6 0 01-6 6 6 6 0 01-6-6H4a8 8 0 008 8 8 8 0 008-8 8 8 0 00-8-8z"/>
        </svg>
      </button>

      <div className="poll-container">
        <h2 className="poll-title">Зачем продавать маржа?</h2>
        <div className="telegram-poll-options">
          {options.map((opt, idx) => (
            <label
              key={idx}
              className="telegram-poll-option"
              onClick={() => selectOption(idx)}
              style={{ '--vote-percentage': `${opt.votes}%` }}
            >
              <input
                type="radio"
                name="marzaPoll"
                checked={selected === idx}
                readOnly
                disabled={voted}
              />
              <span className="option-text">{opt.text}</span>
              {voted && <span className="vote-count">{opt.votes}%</span>}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}




























