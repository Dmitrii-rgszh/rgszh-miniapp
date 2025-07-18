// MagneticButton.js - МАГНИТНЫЕ КНОПКИ
// Кнопки притягивают курсор и создают живые интерактивные эффекты

import React, { useRef, useEffect, useState } from 'react';

const MagneticButton = ({ 
  children, 
  onClick, 
  className = '', 
  style = {},
  magnetStrength = 0.3,
  magnetDistance = 100,
  enableRipple = true,
  enableGlow = true,
  ...props 
}) => {
  const buttonRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 });
  const [ripples, setRipples] = useState([]);

  // Магнитный эффект
  const handleMouseMove = (e) => {
    if (!buttonRef.current) return;

    const button = buttonRef.current;
    const rect = button.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    
    const deltaX = mouseX - centerX;
    const deltaY = mouseY - centerY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    setMousePosition({ x: mouseX, y: mouseY });
    
    if (distance < magnetDistance) {
      // Магнитное притяжение
      const force = (magnetDistance - distance) / magnetDistance;
      const moveX = deltaX * force * magnetStrength;
      const moveY = deltaY * force * magnetStrength;
      
      setButtonPosition({ x: moveX, y: moveY });
      setIsHovered(true);
    } else {
      // Возвращение в исходное положение
      setButtonPosition({ x: 0, y: 0 });
      setIsHovered(false);
    }
  };

  // Обработчик клика с рипплом
  const handleClick = (e) => {
    if (enableRipple) {
      createRipple(e);
    }
    
    if (onClick) {
      onClick(e);
    }
  };

  // Создание риппл эффекта
  const createRipple = (e) => {
    if (!buttonRef.current) return;

    const button = buttonRef.current;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    const newRipple = {
      id: Date.now(),
      x,
      y,
      size
    };
    
    setRipples(prev => [...prev, newRipple]);
    
    // Удаляем рипл через время анимации
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, 600);
  };

  // Обработчик покидания области
  const handleMouseLeave = () => {
    setIsHovered(false);
    setButtonPosition({ x: 0, y: 0 });
  };

  // Подключение глобальных событий мыши
  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Стили кнопки
  const buttonStyle = {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '18px 36px',
    fontSize: '18px',
    fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, sans-serif',
    fontWeight: '600',
    color: 'white',
    background: 'linear-gradient(135deg, rgba(180, 0, 55, 0.9) 0%, rgba(153, 0, 55, 0.9) 50%, rgba(0, 40, 130, 0.9) 100%)',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    overflow: 'hidden',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    transform: `translate(${buttonPosition.x}px, ${buttonPosition.y}px) scale(${isHovered ? 1.05 : 1})`,
    boxShadow: isHovered 
      ? `0 8px 25px rgba(180, 0, 55, 0.4), ${enableGlow ? '0 0 40px rgba(180, 0, 55, 0.3)' : ''}`
      : '0 4px 15px rgba(147, 112, 219, 0.3)',
    ...style
  };

  // Стили для рипплов
  const rippleElements = ripples.map(ripple => (
    <span
      key={ripple.id}
      style={{
        position: 'absolute',
        left: `${ripple.x}px`,
        top: `${ripple.y}px`,
        width: `${ripple.size}px`,
        height: `${ripple.size}px`,
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.6)',
        transform: 'scale(0)',
        animation: 'magnetic-ripple 600ms linear forwards',
        pointerEvents: 'none'
      }}
    />
  ));

  return (
    <>
      {/* CSS анимации */}
      <style>
        {`
          @keyframes magnetic-ripple {
            to {
              transform: scale(4);
              opacity: 0;
            }
          }
          
          @keyframes magnetic-glow {
            0%, 100% { 
              box-shadow: 0 0 20px rgba(180, 0, 55, 0.3);
            }
            50% { 
              box-shadow: 0 0 40px rgba(180, 0, 55, 0.6);
            }
          }
          
          .magnetic-button:hover {
            animation: ${enableGlow ? 'magnetic-glow 2s ease-in-out infinite' : 'none'};
          }
          
          .magnetic-button:active {
            transform: ${`translate(${buttonPosition.x}px, ${buttonPosition.y}px) scale(0.98)`} !important;
          }
          
          /* Адаптивность */
          @media (max-width: 768px) {
            .magnetic-button {
              padding: 16px 32px !important;
              font-size: 16px !important;
            }
          }
          
          @media (max-width: 480px) {
            .magnetic-button {
              padding: 14px 28px !important;
              font-size: 18px !important;
            }
          }
        `}
      </style>
      
      <button
        ref={buttonRef}
        className={`magnetic-button ${className}`}
        style={buttonStyle}
        onClick={handleClick}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        {children}
        {rippleElements}
      </button>
    </>
  );
};

export default MagneticButton;