import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import backgroundImage from './components/background.png';
import logo from './components/logo.png';

const SERVER_URL = 'https://rgszh-miniapp.org';
const socket = io(SERVER_URL);

const MarzaPollPage = () => {
  const navigate = useNavigate();

  const pollQuestion = "Зачем продавать маржа?";
  const initialOptions = [
    { text: "Чтобы отстал руководитель", votes: 0 },
    { text: "Чтобы перевыполнить план и заработать много деняк", votes: 0 },
    { text: "Чтобы победить в конкурсе и полетать на самолёте", votes: 0 },
    { text: "Чтобы клиент меня любил сильнее, чем маму", votes: 0 },
    { text: "Какого ещё маржа? Я не в курсе", votes: 0 }
  ];

  const [options, setOptions] = useState(initialOptions);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [isVoted, setIsVoted] = useState(false);

  useEffect(() => {
    socket.on('connect', () => {
      console.log("Socket connected:", socket.id);
    });
    socket.on('connect_error', (err) => {
      console.error("Socket connection error:", err);
    });
    socket.on('pollResults', (results) => {
      setOptions(results);
    });

    fetch(`${SERVER_URL}/api/poll`)
      .then(response => response.json())
      .then(data => setOptions(data))
      .catch(err => console.error('Ошибка при fetch /api/poll:', err));

    return () => {
      socket.off('pollResults');
    };
  }, []);

  const totalVotes = options.reduce((sum, opt) => sum + opt.votes, 0);

  const handleOptionSelect = (index) => {
    if (isVoted) return;
    setSelectedIndex(index);

    fetch(`${SERVER_URL}/api/poll/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ index }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setIsVoted(true);
        }
      })
      .catch(err => console.error('Ошибка при отправке голоса:', err));
  };

  const handleResetResults = () => {
    fetch(`${SERVER_URL}/api/poll/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setOptions(initialOptions);
          setIsVoted(false);
          setSelectedIndex(null);
        }
      })
      .catch(err => console.error('Ошибка при сбросе результатов:', err));
  };

  const handleBack = () => {
    navigate('/polls');
  };

  return (
    <div className="marza-container" style={{ backgroundImage: `url(${backgroundImage})` }}>
      <div className="marza-logo-container">
        <img src={logo} alt="Logo" className="marza-logo" />
      </div>

      <div className="back-btn-container">
        <button className="back-btn" onClick={handleBack}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M15 18l-6-6 6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none" />
          </svg>
        </button>
      </div>

      <div className="reset-btn-container">
        <button className="reset-btn" onClick={handleResetResults}>
          <span className="reset-btn-icon">✖</span>
        </button>
      </div>

      <div className="marza-content-wrapper">
        <h2 className="marza-title">{pollQuestion}</h2>
        <div className="marza-votes-counter">
          {totalVotes > 0 ? `Всего голосов: ${totalVotes}` : 'Нет голосов'}
        </div>

        {!isVoted ? (
          <div className="marza-options-container">
            {options.map((option, idx) => (
              <label key={idx} className="marza-option-label">
                <input
                  type="radio"
                  name="marzaPoll"
                  value={idx}
                  checked={selectedIndex === idx}
                  onChange={() => handleOptionSelect(idx)}
                />
                <span className="marza-option-text">{option.text}</span>
              </label>
            ))}
          </div>
        ) : (
          <div className="marza-results">
            {options.map((option, idx) => {
              const percent = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
              return (
                <div key={idx} className="marza-result-row">
                  <div className="marza-result-text">
                    {option.text} — {option.votes} голос(ов)
                  </div>
                  <div className="marza-progress-bar">
                    <div
                      className="marza-progress-bar-filled"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="marza-result-percent">
                    {percent.toFixed(1)}%
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MarzaPollPage;














