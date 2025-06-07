import React, { useState, useEffect, useRef } from 'react';

const IconButton = ({ onClick, src, alt, playHoverSound }) => {
  const [hovered, setHovered] = useState(false);
  const [reset, setReset] = useState(false);
  const timerRef = useRef(null);

  const handleMouseEnter = () => {
    setHovered(true);
    if (playHoverSound) {
      playHoverSound();
    }
    // Если кнопка остается в наведении 3 секунды, запускаем сброс (reset)
    timerRef.current = setTimeout(() => {
      setReset(true);
    }, 3000);
  };

  const handleMouseLeave = () => {
    setHovered(false);
    setReset(false);
    clearTimeout(timerRef.current);
  };

  useEffect(() => {
    let timeout;
    if (reset) {
      // После установки reset, через 1 секунду сбрасываем состояние
      timeout = setTimeout(() => {
        setReset(false);
      }, 1000);
    }
    return () => clearTimeout(timeout);
  }, [reset]);

  let className = "tech-support-btn";
  if (hovered && !reset) {
    className += " hovered";
  }
  if (reset) {
    className += " reset";
  }

  return (
    <button
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
    >
      <img src={src} alt={alt} className="tech-support-icon" />
    </button>
  );
};

export default IconButton;
