// MarzaPollPage.js

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

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || window.location.origin;

export default function MarzaPollPage() {
  const navigate   = useNavigate();
  const logoRef    = useRef(null);
  const homeRef    = useRef(null);
  const resetRef   = useRef(null);
  const socketRef  = useRef(null);

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
    console.log('MarzaPollPage: connecting to socket at', SOCKET_URL);
    const socket = io(SOCKET_URL, {
      path: '/socket.io',
      transports: ['websocket']
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('MarzaPollPage: socket connected, id =', socket.id);
    });
    socket.on('connect_error', err => {
      console.error('MarzaPollPage: socket connect error', err);
    });

    // Обработка обновления результатов
    socket.on('pollResults', newOptions => {
      console.log('MarzaPollPage: received pollResults', newOptions);
      setOptions(newOptions);
    });

    // Сброс флага voted у всех клиентов
    socket.on('pollReset', () => {
      console.log('MarzaPollPage: received pollReset');
      setVoted(false);
      setSelected(null);
    });

    // Начальная загрузка
    fetch(`${window.location.origin}/api/poll`)
      .then(r => r.json())
      .then(data => setOptions(data))
      .catch(err => console.error('Ошибка при fetch /api/poll:', err));

    // Анимации
    setTimeout(() => logoRef.current?.classList.add('animate-logo'), 100);
    setTimeout(() => homeRef.current?.classList.add('animate-home'), 300);
    setTimeout(() => resetRef.current?.classList.add('animate-reset'), 500);

    return () => {
      socket.off('pollResults');
      socket.off('pollReset');
      socket.disconnect();
    };
  }, []);

  function selectOption(idx) {
    if (voted) return;
    console.log('MarzaPollPage: selecting option', idx);
    setSelected(idx);
    setVoted(true);
    socketRef.current.emit('newVote', idx);
  }

  function handleReset(e) {
    e.stopPropagation();
    if (!window.confirm('Вы точно хотите сбросить результаты опроса?')) return;
    console.log('MarzaPollPage: emitting resetPoll');
    socketRef.current.emit('resetPoll');
  }

  function handleHome() {
    logoRef.current?.classList.replace('animate-logo','animate-logo-exit');
    homeRef.current?.classList.replace('animate-home','animate-home-exit');
    resetRef.current?.classList.replace('animate-reset','animate-reset-exit');
    setTimeout(() => navigate('/polls'), 700);
  }

  return (
    <div className="mainmenu-container" style={{ backgroundImage: `url(${backgroundImage})` }}>
      <button ref={homeRef} className="home-btn" onClick={handleHome} aria-label="Домой">
        <svg viewBox="0 0 24 24" className="home-icon">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
        </svg>
      </button>

      <div ref={logoRef} className="logo-wrapper">
        <img src={logoImage} alt="Логотип" className="logo-image" />
      </div>

      <button ref={resetRef} className="reset-btn" onClick={handleReset} aria-label="Сбросить опрос">
        <svg viewBox="0 0 24 24" className="reset-icon">
          <path d="M12 4V1L8 5l4 4V6a6 6 0 016 6 6 6 0 01-6 6 6 6 0 01-6-6H4a8 8 0 008 8 8 8 0 008-8 8 8 0 00-8-8z" />
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































