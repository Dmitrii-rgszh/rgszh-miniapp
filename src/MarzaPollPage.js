// src/MarzaPollPage.js - ИСПРАВЛЕННАЯ ВЕРСИЯ
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';

// Убираем CSS импорты и используем только inline стили

import backgroundImage from './components/background.png';
import logoImage from './components/logo.png';
import piImage from './components/pi.png';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || window.location.origin;

export default function MarzaPollPage() {
  const navigate = useNavigate();
  const logoRef = useRef(null);
  const homeRef = useRef(null);
  const resetRef = useRef(null);
  const socketRef = useRef(null);

  const initialOptions = [
    { text: 'Чтобы отстал руководитель', votes: 0 },
    { text: 'Чтобы перевыполнить план и заработать много деняк', votes: 0 },
    { text: 'Чтобы победить в конкурсе и полетать на самолёте', votes: 0 },
    { text: 'Чтобы клиент меня любил сильнее, чем маму', votes: 0 },
    { text: 'Какого ещё маржа? Я не в курсе', votes: 0 },
  ];

  const [options, setOptions] = useState(initialOptions);
  const [selected, setSelected] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // ===== ИНЛАЙН СТИЛИ =====
  
  const mainContainerStyle = {
    position: 'relative',
    width: '100%',
    height: '100vh',
    backgroundImage: `url(${backgroundImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  };

  const overlayStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, rgba(147, 39, 143, 0.85) 0%, rgba(71, 125, 191, 0.85) 100%)',
    zIndex: 1
  };

  const homeBtnStyle = {
    position: 'fixed',
    top: '20px',
    left: '20px',
    zIndex: 1000,
    width: '50px',
    height: '50px',
    border: 'none',
    borderRadius: '8px',
    backgroundColor: 'rgba(248, 5, 62, 0.8)',
    color: 'white',
    fontSize: '24px',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const resetBtnStyle = {
    position: 'fixed',
    top: '20px',
    right: '20px',
    zIndex: 1000,
    width: '50px',
    height: '50px',
    border: 'none',
    borderRadius: '8px',
    backgroundColor: 'rgba(248, 5, 62, 0.8)',
    color: 'white',
    fontSize: '24px',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const logoWrapperStyle = {
    position: 'relative',
    marginBottom: '40px',
    width: '120px',
    height: '120px',
    overflow: 'hidden',
    zIndex: 3
  };

  const logoImageStyle = {
    width: '100%',
    height: 'auto',
    objectFit: 'contain'
  };

  const statusIndicatorStyle = {
    position: 'fixed',
    top: '80px',
    right: '20px',
    background: isConnected ? '#4caf50' : '#f44336',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    zIndex: 1000
  };

  const pollContainerStyle = {
    width: '100%',
    maxWidth: '480px',
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '16px',
    padding: '30px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    zIndex: 3
  };

  const pollTitleStyle = {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333',
    margin: '0 0 20px 0',
    textAlign: 'center'
  };

  const optionsListStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  };

  const optionLabelStyle = (disabled, isSelected) => ({
    display: 'flex',
    alignItems: 'center',
    background: isSelected ? 'rgba(147, 112, 219, 0.1)' : '#f5f5f5',
    border: `2px solid ${isSelected ? '#9370DB' : '#e1e5e9'}`,
    borderRadius: '8px',
    padding: '15px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    transition: 'all 0.3s ease',
    fontWeight: isSelected ? '600' : '500'
  });

  const optionInputStyle = {
    marginRight: '12px',
    transform: 'scale(1.2)'
  };

  const optionTextStyle = {
    fontSize: '16px',
    color: '#333'
  };

  const resultsListStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  };

  const totalVotesStyle = {
    fontSize: '18px',
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: '12px'
  };

  const resultRowStyle = {
    display: 'flex',
    flexDirection: 'column'
  };

  const resultTextStyle = (isSelected) => ({
    fontSize: '16px',
    fontWeight: isSelected ? 'bold' : 'normal',
    color: isSelected ? '#4caf50' : '#333',
    marginBottom: '4px'
  });

  const progressBarStyle = {
    width: '100%',
    height: '12px',
    background: '#ddd',
    borderRadius: '6px',
    overflow: 'hidden',
    marginBottom: '4px'
  };

  const progressFilledStyle = (percentage, isSelected) => ({
    height: '100%',
    width: `${percentage}%`,
    background: isSelected ? '#4caf50' : '#2196f3',
    transition: 'width 0.3s ease'
  });

  const resultPercentStyle = {
    fontSize: '14px',
    color: '#666',
    textAlign: 'right'
  };

  const backButtonStyle = {
    marginTop: '20px',
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #9370DB 0%, #6A5ACD 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    width: '100%'
  };

  // Стили для точек (упрощенные)
  const dotStyle = (index) => ({
    position: 'absolute',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.2)',
    zIndex: 1,
    ...(index === 1 && { top: '10%', left: '10%' }),
    ...(index === 2 && { top: '20%', right: '15%' }),
    ...(index === 3 && { top: '30%', left: '25%' }),
    ...(index === 4 && { bottom: '15%', left: '15%' }),
    ...(index === 5 && { top: '5%', right: '20%' }),
    ...(index === 6 && { bottom: '25%', right: '10%' }),
    ...(index === 7 && { top: '45%', left: '5%' }),
    ...(index === 8 && { bottom: '5%', right: '30%' }),
    ...(index === 9 && { top: '60%', right: '25%' }),
    ...(index === 10 && { bottom: '40%', left: '30%' })
  });

  const piWrapperStyle = {
    position: 'absolute',
    top: '0',
    left: '0',
    zIndex: 2,
    opacity: 0.4,
    animation: 'piFloatAround 70s ease-in-out infinite'
  };

  const piImageStyle = {
    width: '40px',
    height: '40px',
    opacity: 0.8,
    animation: 'piRotate 6s linear infinite'
  };

  useEffect(() => {
    console.log('🔄 Инициализация Socket.IO соединения...');
    
    const socket = io(SOCKET_URL, {
      path: '/socket.io',
      transports: ['websocket', 'polling'], // ✅ Добавляем fallback на polling
      timeout: 10000, // ✅ Уменьшаем timeout
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      forceNew: true
    });
    
    socketRef.current = socket;

    // ✅ ИСПРАВЛЕНО: Обработчики соединения
    socket.on('connect', () => {
      console.log('✅ Socket подключен:', socket.id);
      setIsConnected(true);
      socket.emit('joinPoll');
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket отключен');
      setIsConnected(false);
    });

    // ✅ ИСПРАВЛЕНО: Обработка результатов голосования
    socket.on('pollResults', (data) => {
      console.log('📊 Получены результаты голосования:', data);
      
      let newOptions;
      if (Array.isArray(data)) {
        newOptions = data;
      } else if (data && Array.isArray(data.options)) {
        newOptions = data.options;
      } else {
        console.warn('⚠️ Неверный формат данных pollResults:', data);
        return;
      }
      
      // ✅ ПРИНУДИТЕЛЬНО обновляем состояние
      setOptions([...newOptions]); // Создаем новый массив для React
      
      // ✅ НЕ блокируем показ результатов если есть голоса
      const totalVotes = newOptions.reduce((sum, opt) => sum + (opt.votes || 0), 0);
      if (totalVotes > 0) {
        setShowResults(true);
      }
      
      console.log('✅ Состояние обновлено:', newOptions);
    });

    // ✅ УБИРАЕМ обработчик newVote - используем только pollResults
    // Это избегает дублирования обновлений

    // ✅ ИСПРАВЛЕНО: Сброс опроса
    socket.on('pollReset', () => {
      console.log('🔄 Сброс опроса');
      setShowResults(false);
      setHasVoted(false);
      setSelected(null);
      setOptions([...initialOptions]); // Создаем новый массив
    });

    socket.on('connect_error', (err) => {
      console.error('❌ Ошибка Socket соединения:', err);
      setIsConnected(false);
      
      // ✅ FALLBACK: Если Socket не работает, разрешаем локальное голосование
      setTimeout(() => {
        if (!socket.connected) {
          console.log('🔄 Включаем локальный режим голосования');
          setIsConnected(true); // Разрешаем голосование в локальном режиме
        }
      }, 3000);
    });

    socket.on('reconnect', () => {
      console.log('🔄 Socket переподключен');
      setIsConnected(true);
    });

    // ✅ ИСПРАВЛЕНО: Загрузка текущего состояния
    const loadCurrentPoll = async () => {
      try {
        console.log('📥 Загрузка текущего состояния опроса...');
        const response = await fetch(`${window.location.origin}/api/poll`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📊 Текущее состояние опроса:', data);
        
        let currentOptions;
        if (Array.isArray(data)) {
          currentOptions = data;
        } else if (data && Array.isArray(data.options)) {
          currentOptions = data.options;
        } else {
          console.warn('⚠️ Нет данных опроса, используем начальные');
          currentOptions = initialOptions;
        }
        
        setOptions([...currentOptions]);
        
        // Показываем результаты если есть голоса
        const totalVotes = currentOptions.reduce((sum, opt) => sum + (opt.votes || 0), 0);
        if (totalVotes > 0) {
          setShowResults(true);
        }
        
      } catch (err) {
        console.error('❌ Ошибка загрузки состояния опроса:', err);
        setOptions([...initialOptions]);
        
        // ✅ FALLBACK: Разрешаем локальное голосование если API не работает
        console.log('🔄 API недоступен, включаем локальный режим');
        setIsConnected(true);
      }
    };

    loadCurrentPoll();

    // Анимации
    setTimeout(() => logoRef.current?.classList.add('animate-logo'), 100);
    setTimeout(() => homeRef.current?.classList.add('animate-home'), 300);
    setTimeout(() => resetRef.current?.classList.add('animate-reset'), 500);

    return () => {
      console.log('🔌 Отключение Socket.IO');
      socket.disconnect();
    };
  }, []);

  const totalVotes = options.reduce((sum, o) => sum + (o.votes || 0), 0);

  // ✅ ИСПРАВЛЕНО: Функция голосования с правильной логикой
  function selectOption(idx) {
    console.log('🗳️ Попытка голосования:', { idx, hasVoted });
    
    if (hasVoted) {
      console.warn('⚠️ Голосование заблокировано: уже проголосовал');
      return;
    }
    
    console.log('🗳️ Голосуем за опцию:', idx);
    
    setSelected(idx);
    setHasVoted(true);
    
    // ✅ НЕ обновляем локальное состояние сразу - ждем ответа от сервера
    // Это обеспечивает синхронизацию между всеми клиентами
    
    // ✅ Отправляем голос на сервер
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('newVote', { index: idx });
      console.log('📤 Голос отправлен на сервер через Socket');
    } else {
      // ✅ FALLBACK: Отправляем через HTTP API
      console.log('🔄 Socket недоступен, пробуем HTTP API...');
      
      fetch(`${window.location.origin}/api/poll/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ index: idx })
      })
      .then(response => response.json())
      .then(data => {
        if (data.success && data.options) {
          console.log('📤 Голос отправлен через HTTP API');
          // Обновляем состояние из ответа сервера
          setOptions([...data.options]);
          setShowResults(true);
        } else {
          console.warn('⚠️ HTTP API ошибка:', data);
          // Откатываем голосование
          setHasVoted(false);
          setSelected(null);
        }
      })
      .catch(err => {
        console.warn('⚠️ HTTP API недоступен:', err);
        // Откатываем голосование
        setHasVoted(false);
        setSelected(null);
      });
    }
  }

  function handleReset(e) {
    e.stopPropagation();
    if (!window.confirm('Сбросить результаты опроса?')) return;
    
    console.log('🔄 Сброс опроса');
    
    // ✅ НЕ сбрасываем локальное состояние сразу - ждем ответа от сервера
    
    // ✅ Отправляем сброс на сервер
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('resetPoll');
      console.log('📤 Сброс отправлен через Socket');
    } else {
      // ✅ FALLBACK: Отправляем через HTTP API
      console.log('🔄 Socket недоступен, пробуем HTTP API...');
      
      fetch(`${window.location.origin}/api/poll/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .then(response => {
        if (response.ok) {
          console.log('📤 Сброс отправлен через HTTP API');
          // Выполняем локальный сброс
          setShowResults(false);
          setHasVoted(false);
          setSelected(null);
          setOptions([...initialOptions]);
        } else {
          console.warn('⚠️ HTTP API недоступен');
        }
      })
      .catch(err => {
        console.warn('⚠️ HTTP API ошибка:', err);
      });
    }
  }

  function handleHome() {
    logoRef.current?.classList.replace('animate-logo', 'animate-logo-exit');
    homeRef.current?.classList.replace('animate-home', 'animate-home-exit');
    resetRef.current?.classList.replace('animate-reset', 'animate-reset-exit');
    setTimeout(() => navigate('/polls'), 700);
  }

  return (
    <div style={mainContainerStyle}>
      {/* Оверлей с градиентом */}
      <div style={overlayStyle} />
      
      {/* Кнопка Домой */}
      <button 
        ref={homeRef} 
        style={homeBtnStyle}
        onClick={handleHome} 
        aria-label="Домой"
        onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(248, 5, 62, 1)'}
        onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(248, 5, 62, 0.8)'}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
        </svg>
      </button>

      {/* Логотип */}
      <div ref={logoRef} style={logoWrapperStyle}>
        <img src={logoImage} alt="Логотип" style={logoImageStyle} />
      </div>

      {/* Кнопка Сбросить */}
      <button 
        ref={resetRef} 
        style={resetBtnStyle}
        onClick={handleReset} 
        aria-label="Сбросить"
        onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(248, 5, 62, 1)'}
        onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(248, 5, 62, 0.8)'}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 6l12 12M6 18L18 6" />
        </svg>
      </button>

      {/* Статус соединения */}
      <div style={{
        ...statusIndicatorStyle,
        background: isConnected ? '#4caf50' : '#ff9800' // Оранжевый вместо красного для fallback режима
      }}>
        {socketRef.current?.connected ? '🟢 Online' : '🟡 Offline'}
      </div>

      {/* Плавающие точки */}
      {[1,2,3,4,5,6,7,8,9,10].map(n => (
        <div key={n} style={dotStyle(n)} />
      ))}

      {/* π-символ */}
      <div style={piWrapperStyle}>
        <img src={piImage} style={piImageStyle} alt="π" />
      </div>

      {/* Основной контент */}
      <div style={pollContainerStyle}>
        <h2 style={pollTitleStyle}>Зачем продавать маржа?</h2>

        {!showResults ? (
          // Форма голосования
          <div style={optionsListStyle}>
            {options.map((option, idx) => (
              <label
                key={idx}
                style={optionLabelStyle(hasVoted, selected === idx)} // ✅ Убираем проверку isConnected
                onClick={() => selectOption(idx)}
              >
                <input
                  type="radio"
                  name="poll"
                  value={idx}
                  checked={selected === idx}
                  onChange={() => {}} // Управляется через onClick
                  disabled={hasVoted} // ✅ Убираем проверку isConnected
                  style={optionInputStyle}
                />
                <span style={optionTextStyle}>{option.text}</span>
              </label>
            ))}
          </div>
        ) : (
          // Результаты голосования
          <div style={resultsListStyle}>
            <div style={totalVotesStyle}>
              Всего голосов: {totalVotes}
            </div>
            {options.map((option, idx) => {
              const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
              const isSelected = selected === idx;
              
              return (
                <div key={idx} style={resultRowStyle}>
                  <div style={resultTextStyle(isSelected)}>
                    {option.text} {isSelected && '✓'}
                  </div>
                  <div style={progressBarStyle}>
                    <div style={progressFilledStyle(percentage, isSelected)} />
                  </div>
                  <div style={resultPercentStyle}>
                    {option.votes} голосов ({percentage}%)
                  </div>
                </div>
              );
            })}
            
            {/* Кнопка для повторного голосования */}
            <button
              onClick={() => {
                setShowResults(false);
                setHasVoted(false);
                setSelected(null);
              }}
              style={backButtonStyle}
              onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
            >
              Посмотреть форму голосования
            </button>
          </div>
        )}
      </div>

      {/* CSS анимации в style теге */}
      <style>{`
        @keyframes piFloatAround {
          0%   { transform: translate(0, 0) rotate(0deg); }
          25%  { transform: translate(100vw, 25vh) rotate(90deg); }
          50%  { transform: translate(50vw, 100vh) rotate(180deg); }
          75%  { transform: translate(-20vw, 75vh) rotate(270deg); }
          100% { transform: translate(0, 0) rotate(360deg); }
        }
        
        @keyframes piRotate {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}












































