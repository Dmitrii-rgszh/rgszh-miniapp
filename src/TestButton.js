// src/TestButton.js - С ПОДДЕРЖКОЙ TOUCH СОБЫТИЙ
import React, { useEffect } from 'react';

const TestButton = () => {
  const handleClick = () => {
    alert('✅ Кнопка работает! Клик сработал!');
    console.log('✅ ТЕСТ: Click событие сработал!');
  };

  const handleTouchStart = (e) => {
    console.log('👆 ТЕСТ: TouchStart сработал!');
    // Убираем preventDefault - он вызывает ошибку в passive listeners
  };

  const handleTouchEnd = (e) => {
    console.log('👆 ТЕСТ: TouchEnd сработал!');
    // Убираем preventDefault - он вызывает ошибку в passive listeners
    // Клик и так сработает автоматически после touch
  };

  const handleMouseDown = (e) => {
    console.log('🖱️ ТЕСТ: MouseDown сработал!');
  };

  // Проверяем элементы при загрузке
  useEffect(() => {
    const checkEvents = () => {
      console.log('🔍 Проверяем поддержку событий:');
      console.log('  - Touch поддерживается:', 'ontouchstart' in window);
      console.log('  - Pointer поддерживается:', 'onpointerdown' in window);
      console.log('  - Mouse поддерживается:', 'onmousedown' in window);
      console.log('  - User agent:', navigator.userAgent);
    };
    
    setTimeout(checkEvents, 1000);
  }, []);

  // АГРЕССИВНЫЕ СТИЛИ с !important и без user-select: none
  const aggressiveButtonStyle = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: '2147483647',
    padding: '30px 50px',
    backgroundColor: '#ff0000',
    color: '#ffffff',
    border: '5px solid #ffff00',
    borderRadius: '10px',
    fontSize: '20px',
    fontWeight: 'bold',
    cursor: 'pointer',
    minWidth: '250px',
    minHeight: '80px',
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
    userSelect: 'auto' // ← ВАЖНО: разрешаем selection
  };

  return (
    <>
      {/* Тестовая кнопка с ПОЛНОЙ поддержкой событий */}
      <button 
        className="aggressive-test-button"
        style={aggressiveButtonStyle}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseEnter={() => console.log('🖱️ ТЕСТ: MouseEnter сработал')}
        onPointerDown={() => console.log('👉 ТЕСТ: PointerDown сработал')}
      >
        🚨 ТЕСТ КЛИКА 🚨
      </button>
      
      {/* Стили с !important НО БЕЗ user-select: none */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .aggressive-test-button {
            position: fixed !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            z-index: 2147483647 !important;
            padding: 30px 50px !important;
            background-color: #ff0000 !important;
            color: #ffffff !important;
            border: 5px solid #ffff00 !important;
            border-radius: 10px !important;
            font-size: 20px !important;
            font-weight: bold !important;
            cursor: pointer !important;
            min-width: 250px !important;
            min-height: 80px !important;
            text-align: center !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            box-shadow: 0 10px 30px rgba(0,0,0,0.8) !important;
            pointer-events: auto !important;
            visibility: visible !important;
            opacity: 1 !important;
            user-select: auto !important;
            -webkit-user-select: auto !important;
            -webkit-touch-callout: auto !important;
            -webkit-tap-highlight-color: rgba(255,255,255,0.3) !important;
            touch-action: manipulation !important;
          }
          
          .aggressive-test-button:hover {
            background-color: #ff6666 !important;
            transform: translate(-50%, -50%) scale(1.05) !important;
          }

          .aggressive-test-button:active {
            background-color: #cc0000 !important;
            transform: translate(-50%, -50%) scale(0.98) !important;
          }
        `
      }} />
      
      {/* Информационный блок */}
      <div style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        background: 'black',
        color: 'yellow',
        padding: '15px',
        fontSize: '14px',
        zIndex: '2147483647',
        pointerEvents: 'none',
        border: '2px solid yellow',
        borderRadius: '4px',
        maxWidth: '350px',
        lineHeight: '1.4'
      }}>
        <strong>🔍 ИСПРАВЛЕННАЯ ДИАГНОСТИКА:</strong>
        <br />
        📍 Убран user-select: none
        <br />
        📍 Добавлены touch события  
        <br />
        📍 Разрешены tap события
        <br />
        📍 Проверьте Console → поддержка событий
      </div>
    </>
  );
};

export default TestButton;