// TestButtons.js - ТЕСТОВЫЙ КОМПОНЕНТ
// Создайте этот файл и временно используйте вместо CareFuturePage
// Это поможет изолировать проблему

import React from 'react';

export default function TestButtons() {
  const handleClick = (name) => {
    alert(`Кнопка ${name} работает!`);
    console.log(`Clicked: ${name}`);
  };

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100vh',
      background: 'linear-gradient(135deg, #b40037 0%, #002882 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '20px',
      padding: '20px'
    }}>
      <h1 style={{ color: 'white', marginBottom: '40px' }}>Тест кнопок</h1>
      
      {/* Тест 1: Обычная кнопка */}
      <button
        onClick={() => handleClick('Обычная')}
        style={{
          padding: '10px 20px',
          background: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        Обычная кнопка
      </button>

      {/* Тест 2: Кнопка с position absolute */}
      <button
        onClick={() => handleClick('Absolute')}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          padding: '10px 20px',
          background: 'rgba(255,255,255,0.2)',
          border: '1px solid white',
          borderRadius: '8px',
          cursor: 'pointer',
          color: 'white',
          fontSize: '16px'
        }}
      >
        Position Absolute
      </button>

      {/* Тест 3: Кнопка с классами */}
      <button
        className="next-btn"
        onClick={() => handleClick('С классом')}
        style={{
          padding: '10px 20px',
          background: 'rgba(255,255,255,0.2)',
          border: '1px solid white',
          borderRadius: '8px',
          cursor: 'pointer',
          color: 'white',
          fontSize: '16px'
        }}
      >
        Кнопка с классом
      </button>

      {/* Тест 4: Кнопка внутри карточки */}
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
      }}>
        <h3 style={{ marginBottom: '10px' }}>Карточка</h3>
        <button
          onClick={() => handleClick('В карточке')}
          style={{
            padding: '10px 20px',
            background: '#b40037',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            color: 'white',
            fontSize: '16px'
          }}
        >
          Кнопка в карточке
        </button>
      </div>

      {/* Тест 5: Input поле */}
      <input
        type="text"
        placeholder="Тест input"
        style={{
          padding: '10px',
          fontSize: '16px',
          borderRadius: '8px',
          border: '1px solid white',
          background: 'rgba(255,255,255,0.9)'
        }}
        onChange={(e) => console.log('Input:', e.target.value)}
      />

      {/* Информация об устройстве */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        color: 'white',
        fontSize: '12px',
        opacity: '0.7'
      }}>
        <div>User Agent: {navigator.userAgent.slice(0, 50)}...</div>
        <div>Touch: {('ontouchstart' in window) ? 'Да' : 'Нет'}</div>
        <div>Ширина: {window.innerWidth}px</div>
      </div>
    </div>
  );
}