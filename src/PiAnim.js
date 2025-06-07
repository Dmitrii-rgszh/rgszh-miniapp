// PiAnim.js
import React, { useEffect, useState } from 'react';
import piImage from './components/pi.png';
import './Styles/background.css';
// Убедитесь, что в background.css определены стили для .pi-wrapper и .pi-fly (position, @keyframes и т.д.)

export default function PiAnim() {
  const [moveDuration, setMoveDuration]     = useState('70s');
  const [rotateDuration, setRotateDuration] = useState('6s');

  useEffect(() => {
    // Генерируем случайные длительности (50–90s и 4–8s) при первом монтировании
    const rndMove = Math.random() * (90 - 50) + 50;
    const rndRot  = Math.random() * (8 - 4)  + 4;
    setMoveDuration(`${rndMove.toFixed(2)}s`);
    setRotateDuration(`${rndRot.toFixed(2)}s`);
  }, []);

  return (
    <div
      className="pi-wrapper"
      style={{ '--pi-move-duration': moveDuration }}
    >
      <img
        src={piImage}
        className="pi-fly"
        alt="Pi"
        style={{ '--pi-rotate-duration': rotateDuration }}
      />
    </div>
  );
}
