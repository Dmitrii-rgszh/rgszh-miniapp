// src/MarzaPollPage.js
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate }                      from 'react-router-dom';
import io                                   from 'socket.io-client';

import './Styles/global.css';
import './Styles/background.css';
import './Styles/logo.css';
import './Styles/TelegramPolls.css';
import './Styles/Buttons.css';
import './Styles/HomeButton.css';
import './Styles/ResetButton.css';


import backgroundImage from './components/background.png';
import logoImage       from './components/logo.png';
import piImage         from './components/pi.png';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || window.location.origin;

export default function MarzaPollPage() {
  const navigate    = useNavigate();
  const logoRef     = useRef(null);
  const homeRef     = useRef(null);
  const resetRef    = useRef(null);
  const socketRef   = useRef(null);

  const initialOptions = [
    { text: 'Чтобы отстал руководитель',                        votes: 0 },
    { text: 'Чтобы перевыполнить план и заработать много деняк', votes: 0 },
    { text: 'Чтобы победить в конкурсе и полетать на самолёте',   votes: 0 },
    { text: 'Чтобы клиент меня любил сильнее, чем маму',          votes: 0 },
    { text: 'Какого ещё маржа? Я не в курсе',                    votes: 0 },
  ];

  const [options,     setOptions]     = useState(initialOptions);
  const [selected,    setSelected]    = useState(null);
  const [hasVoted,    setHasVoted]    = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      path:      '/socket.io',
      transports:['websocket']
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('joinPoll');
    });
    socket.on('pollResults', newOpts => {
      const opts = Array.isArray(newOpts)
        ? newOpts
        : (newOpts && Array.isArray(newOpts.options) ? newOpts.options : initialOptions);
      setOptions(opts);
      setShowResults(true);
    });
    socket.on('pollReset', () => {
      setShowResults(false);
      setHasVoted(false);
      setSelected(null);
      setOptions(initialOptions);
    });
    socket.on('connect_error', err => {
      console.error('Socket error:', err);
    });

    fetch(`${window.location.origin}/api/poll`)
      .then(r => r.json())
      .then(data => {
        const arr = Array.isArray(data)
          ? data
          : (data && Array.isArray(data.options) ? data.options : initialOptions);
        setOptions(arr);
      })
      .catch(err => console.error('Fetch /api/poll error:', err));

    setTimeout(() => logoRef.current?.classList.add('animate-logo'), 100);
    setTimeout(() => homeRef.current?.classList.add('animate-home'), 300);
    setTimeout(() => resetRef.current?.classList.add('animate-reset'), 500);

    return () => socket.disconnect();
  }, []);

  const totalVotes = options.reduce((sum, o) => sum + o.votes, 0);

  function selectOption(idx) {
    if (hasVoted) return;
    setSelected(idx);
    setHasVoted(true);
    socketRef.current.emit('newVote', { index: idx });
  }

  function handleReset(e) {
    e.stopPropagation();
    if (!window.confirm('Сбросить результаты опроса?')) return;
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
        <svg className="home-icon" viewBox="0 0 24 24">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
        </svg>
      </button>

      <div ref={logoRef} className="logo-wrapper">
        <img src={logoImage} alt="Логотип" className="logo-image" />
      </div>

      <button ref={resetRef} className="reset-btn" onClick={handleReset} aria-label="Сбросить">
        <svg className="reset-icon" viewBox="0 0 24 24">
          <path d="M6 6l12 12M6 18L18 6" stroke="white" strokeWidth="2" />
        </svg>
      </button>

      {/* --- ВОССТАНОВЛЕНО: плавающие точки из background.css --- */}
      {[1,2,3,4,5,6,7,8,9,10].map(n =>
        <div key={n} className={`subtle-dot dot-${n}`} />
      )}

      {/* --- ВОССТАНОВЛЕНО: π-символ --- */}
      <div
        className="pi-wrapper"
        style={{
          '--pi-move-duration':   `${50 + Math.random()*40}s`,
          '--pi-rotate-duration': `${4  + Math.random()*4 }s`
        }}
      >
        <img src={piImage} className="pi-fly" alt="π" />
      </div>

      <div className="poll-container">
        <h2 className="poll-title">Зачем продавать маржа?</h2>

        {!showResults ? (
          <div className="telegram-poll-options">
            {options.map((opt, i) => (
              <label
                key={i}
                className="telegram-poll-option"
                onClick={() => selectOption(i)}
                style={{ '--vote-percentage': `${(opt.votes/totalVotes)*100 || 0}%` }}
              >
                <input
                  type="radio"
                  name="marzaPoll"
                  checked={selected === i}
                  readOnly
                />
                <span className="option-text">{opt.text}</span>
              </label>
            ))}
          </div>
        ) : (
          <div className="telegram-poll-results">
            {options.map((opt, i) => (
              <div key={i} className="telegram-result-row">
                <span className="telegram-result-text">
                  {opt.text} — {opt.votes} голос(ов)
                </span>
                <div className="telegram-progress-bar">
                  <div
                    className="telegram-progress-filled"
                    style={{ width: `${(opt.votes/totalVotes)*100 || 0}%` }}
                  />
                </div>
                <span className="telegram-result-percent">
                  {totalVotes
                    ? ((opt.votes/totalVotes)*100).toFixed(1) + '%'
                    : '0%'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}













































