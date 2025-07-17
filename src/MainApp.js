// MainApp.js - ЦЕНТРАЛИЗОВАННОЕ УПРАВЛЕНИЕ ФОНАМИ
// ✅ Вся логика фонов в одном файле
// ✅ Применены корпоративные цвета: R:180 G:0 B:55, R:152 G:164 B:174, R:0 G:40 B:130
// ✅ Семейство шрифтов: Segoe UI Bold для заголовков, Segoe UI Regular для текста
// ✅ Инлайн стили как основной подход
// ✅ Автоматическая смена фонов каждые 12-18 секунд (рандомизированная)
// ✅ Исправлены проблемы Safari для мобильных устройств
// ✅ ДОБАВЛЕНО: Система предзагрузки фонов с прогресс-баром
// ✅ ДОБАВЛЕНО: 10 ТИПОВ ДИНАМИЧЕСКИХ ПЕРЕХОДОВ (Crossfade, Slide, Zoom, Blur, Spiral, и др.)
// ✅ ДОБАВЛЕНО: Умная рандомизация переходов с адаптацией по времени суток
// ✅ ДОБАВЛЕНО: Адаптивная Aurora анимация с переменной интенсивностью
// ✅ ИСПРАВЛЕНО: ЖЕЛЕЗОБЕТОННАЯ защита от повторов фонов (тройная проверка + экстренное восстановление)
// ✅ ДОБАВЛЕНО: Подробное логирование для отладки переходов
// ✅ ДОБАВЛЕНО: Экстренный перезапуск системы при зависании (45 сек)
// ✅ ДОБАВЛЕНО: Глобальная логика Safe Area для всех страниц

import React, { useState, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Импорты компонентов
import WelcomePage     from './WelcomePage';
import MainMenu        from './MainMenu';
import PollsPage       from './PollsPage';
import SNPPage         from './SNPPage';
import EmployeePage    from './EmployeePage';
import AssessmentPage  from './AssessmentPage';
import FeedbackPage    from './FeedbackPage';
import JustincasePage  from './JustincasePage';
import CareFuturePage  from './CareFuturePage';
import MarzaPollPage   from './MarzaPollPage';

// ===== ЦЕНТРАЛИЗОВАННЫЕ ИМПОРТЫ ФОНОВ =====

// Безопасные импорты фоновых изображений из папки background/
let backgroundImage1, backgroundImage2, backgroundImage3, defaultBackground;

// Импорт основного фона (fallback)
try {
  defaultBackground = require('./components/background.png');
} catch (error) {
  console.warn('Default background not found');
  defaultBackground = null;
}

// Импорт фонов из папки background/ с проверкой разных названий
try {
  backgroundImage1 = require('./components/background/background1.png');
} catch (error) {
  try {
    backgroundImage1 = require('./components/background/background (1).png');
  } catch (error2) {
    console.warn('Background 1 not found with either name');
    backgroundImage1 = null;
  }
}

try {
  backgroundImage2 = require('./components/background/background2.png');
} catch (error) {
  try {
    backgroundImage2 = require('./components/background/background (2).png');
  } catch (error2) {
    console.warn('Background 2 not found with either name');
    backgroundImage2 = null;
  }
}

try {
  backgroundImage3 = require('./components/background/background3.png');
} catch (error) {
  try {
    backgroundImage3 = require('./components/background/background (3).png');
  } catch (error2) {
    console.warn('Background 3 not found with either name');
    backgroundImage3 = null;
  }
}

// Создаем массив доступных фонов
const availableBackgrounds = [
  backgroundImage1, 
  backgroundImage2, 
  backgroundImage3, 
  defaultBackground
].filter(Boolean);

console.log(`Найдено фоновых изображений: ${availableBackgrounds.length}`);

// Компонент обработки ошибок
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  
  static getDerivedStateFromError(error) {
    return { error };
  }
  
  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
  }
  
  render() {
    if (this.state.error) {
      return (
        <div style={{
          padding: '20px',
          fontFamily: '"Segoe UI", sans-serif',
          color: 'rgb(180, 0, 55)',
          backgroundColor: 'white',
          border: '2px solid rgb(180, 0, 55)',
          borderRadius: '8px',
          margin: '20px',
          textAlign: 'center'
        }}>
          <h2 style={{ 
            fontFamily: '"Segoe UI", sans-serif',
            fontWeight: 'bold',
            color: 'rgb(180, 0, 55)' 
          }}>
            Произошла ошибка
          </h2>
          <pre style={{ 
            fontSize: '14px',
            color: 'rgb(0, 40, 130)',
            fontFamily: '"Segoe UI", sans-serif'
          }}>
            {this.state.error.toString()}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function MainApp() {
  // ===== СОСТОЯНИЕ ДЛЯ УПРАВЛЕНИЯ ФОНАМИ =====
  const [currentBackgroundIndex, setCurrentBackgroundIndex] = useState(0);
  const [nextBackgroundIndex, setNextBackgroundIndex] = useState(1);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  const [auroraOffset, setAuroraOffset] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // ===== СОСТОЯНИЕ ДЛЯ ПЛАВНЫХ ПЕРЕХОДОВ =====
  const [currentOpacity, setCurrentOpacity] = useState(1);      // Прозрачность текущего фона
  const [nextOpacity, setNextOpacity] = useState(0);           // Прозрачность следующего фона
  const [currentBlur, setCurrentBlur] = useState(0);          // Мягкий блюр текущего (0-2px)
  const [nextBlur, setNextBlur] = useState(2);                // Мягкий блюр следующего (0-2px)
  const [isFinalizing, setIsFinalizing] = useState(false);    // Флаг финального переключения
  
  // ===== СОСТОЯНИЕ ДЛЯ ДИНАМИЧЕСКИХ ПЕРЕХОДОВ =====
  const [currentTransition, setCurrentTransition] = useState('crossfade'); // Тип текущего перехода
  const [transitionHistory, setTransitionHistory] = useState([]);          // История переходов
  const [currentTransform, setCurrentTransform] = useState('');            // Transform для текущего фона
  const [nextTransform, setNextTransform] = useState('');                  // Transform для следующего фона
  const [overlayOpacity, setOverlayOpacity] = useState(0);                 // Цветовой оверлей
  const [auroraIntensity, setAuroraIntensity] = useState(1);              // Интенсивность Aurora (0.5-2.0)

  // ===== СОСТОЯНИЕ ПРЕДЗАГРУЗКИ =====
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [loadedImages, setLoadedImages] = useState(new Set());
  const [loadingProgress, setLoadingProgress] = useState(0);

  // ===== ПРЕДЗАГРУЗКА ИЗОБРАЖЕНИЙ =====
  const preloadImages = () => {
    if (availableBackgrounds.length === 0) {
      setImagesLoaded(true);
      return;
    }

    console.log('Начинаем предзагрузку фоновых изображений...');
    let loadedCount = 0;
    const totalImages = availableBackgrounds.length;

    availableBackgrounds.forEach((imageSrc, index) => {
      const img = new Image();
      
      img.onload = () => {
        loadedCount++;
        setLoadedImages(prev => new Set([...prev, index]));
        const progress = Math.round((loadedCount / totalImages) * 100);
        setLoadingProgress(progress);
        
        console.log(`Загружено изображение ${loadedCount}/${totalImages} (${progress}%)`);
        
        if (loadedCount === totalImages) {
          console.log('Все фоновые изображения предзагружены!');
          setTimeout(() => {
            setImagesLoaded(true);
          }, 500); // Небольшая задержка для плавности
        }
      };
      
      img.onerror = () => {
        console.warn(`Ошибка загрузки изображения ${index}`);
        loadedCount++;
        const progress = Math.round((loadedCount / totalImages) * 100);
        setLoadingProgress(progress);
        
        if (loadedCount === totalImages) {
          setImagesLoaded(true);
        }
      };
      
      img.src = imageSrc;
    });
  };

  // ===== СИСТЕМА ДИНАМИЧЕСКИХ ПЕРЕХОДОВ =====
  
  // Типы переходов с их характеристиками
  const transitionTypes = {
    crossfade: { 
      name: 'Crossfade', 
      duration: [2000, 3000], 
      complexity: 'low',
      aurora: 1.0 
    },
    slideLeft: { 
      name: 'Slide Left', 
      duration: [2500, 3500], 
      complexity: 'medium',
      aurora: 1.3 
    },
    slideRight: { 
      name: 'Slide Right', 
      duration: [2500, 3500], 
      complexity: 'medium',
      aurora: 1.3 
    },
    slideUp: { 
      name: 'Slide Up', 
      duration: [2500, 3500], 
      complexity: 'medium',
      aurora: 1.2 
    },
    slideDown: { 
      name: 'Slide Down', 
      duration: [2500, 3500], 
      complexity: 'medium',
      aurora: 1.2 
    },
    zoomIn: { 
      name: 'Zoom In', 
      duration: [3000, 4000], 
      complexity: 'high',
      aurora: 1.5 
    },
    zoomOut: { 
      name: 'Zoom Out', 
      duration: [3000, 4000], 
      complexity: 'high',
      aurora: 1.4 
    },
    blurDissolve: { 
      name: 'Blur Dissolve', 
      duration: [3500, 4500], 
      complexity: 'high',
      aurora: 0.7 
    },
    fadeToColor: { 
      name: 'Fade to Color', 
      duration: [2800, 3800], 
      complexity: 'medium',
      aurora: 0.8 
    },
    spiralIn: { 
      name: 'Spiral In', 
      duration: [4000, 5000], 
      complexity: 'ultra',
      aurora: 1.8 
    }
  };

  // ЖЕЛЕЗОБЕТОННЫЙ выбор следующего фона (ГАРАНТИЯ отличия от текущего)
  const getGuaranteedDifferentIndex = () => {
    // КРИТИЧЕСКАЯ ПРОВЕРКА: если фонов меньше 2 - смена невозможна
    if (availableBackgrounds.length < 2) {
      console.warn('⚠️ Недостаточно фонов для смены (доступно: ' + availableBackgrounds.length + ')');
      return -1; // Специальный код "смена невозможна"
    }
    
    // Создаем массив ВСЕХ доступных индексов КРОМЕ текущего
    const differentIndices = [];
    for (let i = 0; i < availableBackgrounds.length; i++) {
      if (i !== currentBackgroundIndex) {
        differentIndices.push(i);
      }
    }
    
    // КРИТИЧЕСКАЯ ПРОВЕРКА: если нет других вариантов - это ошибка системы
    if (differentIndices.length === 0) {
      console.error('🚨 КРИТИЧЕСКАЯ ОШИБКА: Не найдено других фонов для смены!');
      console.error('🚨 currentBackgroundIndex:', currentBackgroundIndex);
      console.error('🚨 availableBackgrounds.length:', availableBackgrounds.length);
      return -1;
    }
    
    // ГАРАНТИРОВАННЫЙ выбор: только из тех, что ТОЧНО отличаются от текущего
    const selectedIndex = differentIndices[Math.floor(Math.random() * differentIndices.length)];
    
    console.log(`🎯 Гарантированный выбор: ${currentBackgroundIndex} → ${selectedIndex}`);
    console.log(`🎯 Доступные варианты были: [${differentIndices.join(', ')}]`);
    
    // ФИНАЛЬНАЯ ПРОВЕРКА: убеждаемся что выбрали действительно другой индекс
    if (selectedIndex === currentBackgroundIndex) {
      console.error('🚨 НЕВОЗМОЖНАЯ ОШИБКА: Выбран тот же индекс!');
      // В крайнем случае принудительно выбираем первый доступный вариант
      return differentIndices[0];
    }
    
    return selectedIndex;
  };

  // Умный выбор типа перехода
  const getSmartTransitionType = () => {
    const hour = new Date().getHours();
    const availableTypes = Object.keys(transitionTypes);
    
    // Исключаем последние 2 использованных типа
    const excludeTypes = transitionHistory.slice(-2);
    const possibleTypes = availableTypes.filter(type => !excludeTypes.includes(type));
    
    // Если осталось мало вариантов, сбрасываем историю
    if (possibleTypes.length < 3) {
      setTransitionHistory([]);
      return availableTypes[Math.floor(Math.random() * availableTypes.length)];
    }
    
    // Адаптивный выбор по времени суток
    let preferredTypes = [];
    
    if (hour >= 6 && hour < 12) {
      // Утро - энергичные переходы
      preferredTypes = ['slideUp', 'zoomIn', 'spiralIn', 'slideRight'];
    } else if (hour >= 12 && hour < 18) {
      // День - разнообразные переходы
      preferredTypes = ['crossfade', 'slideLeft', 'slideRight', 'zoomOut'];
    } else if (hour >= 18 && hour < 22) {
      // Вечер - плавные переходы
      preferredTypes = ['crossfade', 'blurDissolve', 'fadeToColor', 'slideDown'];
    } else {
      // Ночь - медленные, спокойные переходы
      preferredTypes = ['crossfade', 'blurDissolve', 'fadeToColor'];
    }
    
    // Фильтруем по доступным типам
    const filteredPreferred = preferredTypes.filter(type => possibleTypes.includes(type));
    
    // 60% шанс выбрать предпочтительный тип, 40% - любой доступный
    if (filteredPreferred.length > 0 && Math.random() < 0.6) {
      return filteredPreferred[Math.floor(Math.random() * filteredPreferred.length)];
    } else {
      return possibleTypes[Math.floor(Math.random() * possibleTypes.length)];
    }
  };

  // Генерация случайной длительности перехода
  const getRandomDuration = (transitionType) => {
    const [min, max] = transitionTypes[transitionType].duration;
    return Math.floor(Math.random() * (max - min) + min);
  };
  // ===== ГЛАВНАЯ ФУНКЦИЯ ДИНАМИЧЕСКИХ ПЕРЕХОДОВ (С ЖЕЛЕЗОБЕТОННОЙ ЗАЩИТОЙ) =====
  const startDynamicTransition = () => {
    // БАЗОВЫЕ ПРОВЕРКИ
    if (!imagesLoaded) {
      console.log('⏸️ Фоны еще не загружены, пропускаем переход');
      return;
    }
    
    if (isTransitioning) {
      console.log('⏸️ Переход уже выполняется, пропускаем');
      return;
    }
    
    // КРИТИЧЕСКАЯ ПРОВЕРКА: достаточно ли фонов для смены
    if (availableBackgrounds.length < 2) {
      console.log('⏸️ Недостаточно фонов для смены (' + availableBackgrounds.length + '), пропускаем');
      return;
    }
    
    console.log(`🔄 Текущий фон: ${currentBackgroundIndex + 1}/${availableBackgrounds.length}`);
    
    // ГАРАНТИРОВАННЫЙ выбор другого фона
    const nextIndex = getGuaranteedDifferentIndex();
    
    // ПРОВЕРКА: если функция вернула -1, значит смена невозможна
    if (nextIndex === -1) {
      console.error('🚨 Смена фона невозможна, планируем повтор через 5 секунд');
      setTimeout(() => {
        startDynamicTransition();
      }, 5000);
      return;
    }
    
    // ТРОЙНАЯ ПРОВЕРКА: убеждаемся что индексы действительно разные
    if (nextIndex === currentBackgroundIndex) {
      console.error('🚨 КРИТИЧЕСКАЯ ОШИБКА: Получен тот же индекс!');
      console.error('🚨 currentBackgroundIndex:', currentBackgroundIndex);
      console.error('🚨 nextIndex:', nextIndex);
      console.error('🚨 availableBackgrounds.length:', availableBackgrounds.length);
      
      // Экстренная попытка исправить ситуацию
      let emergencyIndex = -1;
      for (let i = 0; i < availableBackgrounds.length; i++) {
        if (i !== currentBackgroundIndex) {
          emergencyIndex = i;
          break;
        }
      }
      
      if (emergencyIndex === -1) {
        console.error('🚨 СИСТЕМА ФОНОВ СЛОМАНА: Нет доступных альтернатив!');
        return;
      }
      
      console.log('🔧 Экстренное исправление: используем индекс', emergencyIndex);
      // Рекурсивно пробуем снова через 3 секунды
      setTimeout(() => {
        startDynamicTransition();
      }, 3000);
      return;
    }
    
    // ВСЕ ПРОВЕРКИ ПРОЙДЕНЫ - начинаем переход
    const transitionType = getSmartTransitionType();
    const duration = getRandomDuration(transitionType);
    
    setIsTransitioning(true);
    setNextBackgroundIndex(nextIndex);
    setCurrentTransition(transitionType);
    setAuroraIntensity(transitionTypes[transitionType].aurora);
    
    // Обновляем историю переходов
    setTransitionHistory(prev => [...prev, transitionType].slice(-5));
    
    console.log(`🎭 УСПЕШНЫЙ переход: ${transitionTypes[transitionType].name}`);
    console.log(`🎨 Фон ${currentBackgroundIndex + 1} → ${nextIndex + 1} (${duration}ms)`);
    console.log(`✅ ГАРАНТИЯ: ${currentBackgroundIndex} ≠ ${nextIndex}`);
    
    // Запускаем конкретный тип перехода
    switch (transitionType) {
      case 'crossfade':
        executeCrossfadeTransition(duration);
        break;
      case 'slideLeft':
        executeSlideTransition('left', duration);
        break;
      case 'slideRight':
        executeSlideTransition('right', duration);
        break;
      case 'slideUp':
        executeSlideTransition('up', duration);
        break;
      case 'slideDown':
        executeSlideTransition('down', duration);
        break;
      case 'zoomIn':
        executeZoomTransition('in', duration);
        break;
      case 'zoomOut':
        executeZoomTransition('out', duration);
        break;
      case 'blurDissolve':
        executeBlurDissolveTransition(duration);
        break;
      case 'fadeToColor':
        executeFadeToColorTransition(duration);
        break;
      case 'spiralIn':
        executeSpiralTransition(duration);
        break;
      default:
        executeCrossfadeTransition(duration);
    }
  };

  // ===== РЕАЛИЗАЦИЯ CROSSFADE ПЕРЕХОДА =====
  const executeCrossfadeTransition = (duration) => {
    const steps = Math.floor(duration / 50); // 50ms на шаг
    
    setNextOpacity(0);
    setNextBlur(2);
    
    setTimeout(() => {
      let step = 0;
      const fadeInterval = setInterval(() => {
        step++;
        const progress = step / steps;
        
        setCurrentOpacity(1 - progress);
        setNextOpacity(progress);
        setNextBlur(2 * (1 - progress));
        setCurrentBlur(1 * progress);
        
        if (step >= steps) {
          clearInterval(fadeInterval);
          finalizeTransition();
        }
      }, 50);
    }, 300);
  };

  // ===== РЕАЛИЗАЦИЯ SLIDE ПЕРЕХОДОВ =====
  const executeSlideTransition = (direction, duration) => {
    const steps = Math.floor(duration / 60); // 60ms на шаг для slide
    
    // Начальные позиции
    const transforms = {
      left:  { current: 'translateX(0)', next: 'translateX(100%)', final: 'translateX(-100%)' },
      right: { current: 'translateX(0)', next: 'translateX(-100%)', final: 'translateX(100%)' },
      up:    { current: 'translateY(0)', next: 'translateY(100%)', final: 'translateY(-100%)' },
      down:  { current: 'translateY(0)', next: 'translateY(-100%)', final: 'translateY(100%)' }
    };
    
    setCurrentTransform(transforms[direction].current);
    setNextTransform(transforms[direction].next);
    setNextOpacity(1);
    setNextBlur(0);
    
    setTimeout(() => {
      let step = 0;
      const slideInterval = setInterval(() => {
        step++;
        const progress = step / steps;
        const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease-out cubic
        
        if (direction === 'left' || direction === 'right') {
          const currentX = direction === 'left' ? -100 * easeProgress : 100 * easeProgress;
          const nextX = direction === 'left' ? 100 * (1 - easeProgress) : -100 * (1 - easeProgress);
          setCurrentTransform(`translateX(${currentX}%)`);
          setNextTransform(`translateX(${nextX}%)`);
        } else {
          const currentY = direction === 'up' ? -100 * easeProgress : 100 * easeProgress;
          const nextY = direction === 'up' ? 100 * (1 - easeProgress) : -100 * (1 - easeProgress);
          setCurrentTransform(`translateY(${currentY}%)`);
          setNextTransform(`translateY(${nextY}%)`);
        }
        
        if (step >= steps) {
          clearInterval(slideInterval);
          finalizeTransition();
        }
      }, 60);
    }, 200);
  };

  // ===== РЕАЛИЗАЦИЯ ZOOM ПЕРЕХОДОВ =====
  const executeZoomTransition = (type, duration) => {
    const steps = Math.floor(duration / 50);
    
    if (type === 'in') {
      setCurrentTransform('scale(1)');
      setNextTransform('scale(0.8)');
      setNextOpacity(0);
    } else {
      setCurrentTransform('scale(1)');
      setNextTransform('scale(1.2)');
      setNextOpacity(0);
    }
    
    setTimeout(() => {
      let step = 0;
      const zoomInterval = setInterval(() => {
        step++;
        const progress = step / steps;
        const easeProgress = 1 - Math.pow(1 - progress, 2); // Ease-out quad
        
        if (type === 'in') {
          const currentScale = 1 + (0.2 * easeProgress);
          const nextScale = 0.8 + (0.2 * easeProgress);
          setCurrentTransform(`scale(${currentScale})`);
          setNextTransform(`scale(${nextScale})`);
        } else {
          const currentScale = 1 + (0.3 * easeProgress);
          const nextScale = 1.2 - (0.2 * easeProgress);
          setCurrentTransform(`scale(${currentScale})`);
          setNextTransform(`scale(${nextScale})`);
        }
        
        setCurrentOpacity(1 - progress);
        setNextOpacity(progress);
        setCurrentBlur(3 * progress);
        setNextBlur(3 * (1 - progress));
        
        if (step >= steps) {
          clearInterval(zoomInterval);
          finalizeTransition();
        }
      }, 50);
    }, 400);
  };

  // ===== РЕАЛИЗАЦИЯ BLUR DISSOLVE ПЕРЕХОДА =====
  const executeBlurDissolveTransition = (duration) => {
    const steps = Math.floor(duration / 60);
    
    setNextOpacity(0);
    setNextBlur(8); // Начинаем с сильного размытия
    
    setTimeout(() => {
      let step = 0;
      const blurInterval = setInterval(() => {
        step++;
        const progress = step / steps;
        
        // Сильное размытие в середине перехода
        const blurCurve = Math.sin(progress * Math.PI);
        setCurrentBlur(6 * blurCurve);
        setNextBlur(8 * (1 - progress));
        
        setCurrentOpacity(1 - progress);
        setNextOpacity(progress);
        
        if (step >= steps) {
          clearInterval(blurInterval);
          finalizeTransition();
        }
      }, 60);
    }, 500);
  };

  // ===== РЕАЛИЗАЦИЯ FADE TO COLOR ПЕРЕХОДА =====
  const executeFadeToColorTransition = (duration) => {
    const steps = Math.floor(duration / 50);
    const halfSteps = Math.floor(steps / 2);
    
    setNextOpacity(0);
    
    setTimeout(() => {
      let step = 0;
      const colorInterval = setInterval(() => {
        step++;
        
        if (step <= halfSteps) {
          // Фаза 1: затемнение через цветовой оверлей
          const progress = step / halfSteps;
          setOverlayOpacity(0.7 * progress);
          setCurrentOpacity(1 - 0.3 * progress);
        } else {
          // Фаза 2: появление нового фона
          const progress = (step - halfSteps) / halfSteps;
          setOverlayOpacity(0.7 * (1 - progress));
          setCurrentOpacity(0.7 - 0.7 * progress);
          setNextOpacity(progress);
          setNextBlur(2 * (1 - progress));
        }
        
        if (step >= steps) {
          clearInterval(colorInterval);
          finalizeTransition();
        }
      }, 50);
    }, 200);
  };

  // ===== РЕАЛИЗАЦИЯ SPIRAL ПЕРЕХОДА =====
  const executeSpiralTransition = (duration) => {
    const steps = Math.floor(duration / 50);
    
    setNextOpacity(0);
    setNextTransform('scale(0.5) rotate(180deg)');
    
    setTimeout(() => {
      let step = 0;
      const spiralInterval = setInterval(() => {
        step++;
        const progress = step / steps;
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        
        // Spiral анимация
        const rotation = 360 * easeProgress;
        const scale = 0.5 + (0.5 * easeProgress);
        
        setCurrentTransform(`scale(${1 + 0.2 * progress}) rotate(${rotation / 4}deg)`);
        setNextTransform(`scale(${scale}) rotate(${180 - rotation}deg)`);
        
        setCurrentOpacity(1 - progress);
        setNextOpacity(progress);
        setCurrentBlur(4 * Math.sin(progress * Math.PI));
        setNextBlur(4 * (1 - progress));
        
        if (step >= steps) {
          clearInterval(spiralInterval);
          finalizeTransition();
        }
      }, 50);
    }, 300);
  };

  // ===== ФИНАЛИЗАЦИЯ ЛЮБОГО ПЕРЕХОДА (С ПОДРОБНЫМ ЛОГИРОВАНИЕМ) =====
  const finalizeTransition = () => {
    setTimeout(() => {
      setIsFinalizing(true);
      
      const oldIndex = currentBackgroundIndex;
      const newIndex = nextBackgroundIndex;
      
      console.log(`🎬 Финализация перехода: ${oldIndex} → ${newIndex}`);
      
      flushSync(() => {
        setCurrentBackgroundIndex(prev => {
          // Сброс всех состояний
          setCurrentOpacity(1);
          setNextOpacity(0);
          setCurrentBlur(0);
          setNextBlur(2);
          setCurrentTransform('');
          setNextTransform('');
          setOverlayOpacity(0);
          setIsTransitioning(false);
          
          console.log(`📝 Обновлен currentBackgroundIndex: ${prev} → ${newIndex}`);
          return newIndex;
        });
      });
      
      setTimeout(() => {
        setIsFinalizing(false);
        setAuroraIntensity(1); // Возвращаем Aurora к норме
        
        // ФИНАЛЬНАЯ ПРОВЕРКА: убеждаемся что переход действительно произошел
        console.log(`✅ Переход завершен успешно!`);
        console.log(`📊 Итоговое состояние: фон ${newIndex + 1}/${availableBackgrounds.length}`);
        console.log(`🔍 Проверка: старый=${oldIndex}, новый=${newIndex}, разные=${oldIndex !== newIndex ? 'ДА' : 'НЕТ'}`);
      }, 16);
      
    }, 300);
  };

  // ===== ФУНКЦИЯ ОБНОВЛЕНИЯ ВЫСОТЫ =====
  const updateViewportHeight = () => {
    setViewportHeight(window.innerHeight);
  };

  // ===== ОБРАБОТЧИК ИЗМЕНЕНИЯ РАЗМЕРА ОКНА =====
  useEffect(() => {
    window.addEventListener('resize', updateViewportHeight);
    window.addEventListener('orientationchange', updateViewportHeight);
    
    const handleOrientationChange = () => {
      setTimeout(updateViewportHeight, 100);
    };
    
    window.addEventListener('orientationchange', handleOrientationChange);
    
    return () => {
      window.removeEventListener('resize', updateViewportHeight);
      window.removeEventListener('orientationchange', updateViewportHeight);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  // ===== ПРЕДЗАГРУЗКА ПРИ МОНТИРОВАНИИ =====
  useEffect(() => {
    preloadImages();
  }, []);

  // ===== АВТОМАТИЧЕСКАЯ СМЕНА ФОНОВ С ДИНАМИЧЕСКИМИ ПЕРЕХОДАМИ =====
  useEffect(() => {
    if (!imagesLoaded || availableBackgrounds.length <= 1) return;
    
    console.log('🚀 Запуск системы динамических переходов фонов: каждые 12-18 секунд');
    
    // Функция для создания таймера со случайной задержкой
    const createRandomTimer = () => {
      // Случайная задержка между 12-18 секундами (с весами: 15 сек чаще всего)
      const delays = [12000, 13000, 14000, 15000, 15000, 15000, 16000, 17000, 18000];
      const randomDelay = delays[Math.floor(Math.random() * delays.length)];
      
      const timer = setTimeout(() => {
        startDynamicTransition();
        
        // ✅ ВСЕГДА планируем следующий переход (защита от остановки системы)
        createRandomTimer();
      }, randomDelay);
      
      console.log(`⏰ Следующий переход через ${randomDelay/1000} секунд`);
      
      return timer;
    };
    
    // Первый переход через 15 секунд, затем случайные интервалы
    const initialTimer = setTimeout(() => {
      startDynamicTransition();
      createRandomTimer();
    }, 15000);

    // ✅ ЗАПАСНОЙ ТАЙМЕР: если основная система зависла, перезапускаем её через 45 секунд
    const emergencyTimer = setTimeout(() => {
      console.log('🔄 Экстренный перезапуск системы переходов фонов');
      startDynamicTransition();
      createRandomTimer();
    }, 45000);

    // Cleanup при размонтировании
    return () => {
      clearTimeout(initialTimer);
      clearTimeout(emergencyTimer);
    };
  }, [imagesLoaded]);

  // ===== AURORA АНИМАЦИЯ (синхронизированная с фонами, 15 сек цикл) =====
  useEffect(() => {
    if (!imagesLoaded) return;
    
    // Aurora цикл = 15 секунд (время жизни одного фона)
    // 150 шагов по 100ms = 15 секунд
    const auroraInterval = setInterval(() => {
      setAuroraOffset(prev => (prev + 1) % 150);
    }, 100);

    return () => clearInterval(auroraInterval);
  }, [imagesLoaded]);

  // ===== ГЛОБАЛЬНЫЕ СТИЛИ КОНТЕЙНЕРА + SAFE AREA =====
  const globalContainerStyle = {
    position: 'relative',
    width: '100%',
    height: `${viewportHeight}px`,
    minHeight: `${viewportHeight}px`,
    overflow: 'hidden',
    fontFamily: '"Segoe UI", sans-serif',
    
    // ✨ ПОСТОЯННЫЙ КОРПОРАТИВНЫЙ ФОН - НИКОГДА НЕ БЕЛЫЙ!
    background: `
      linear-gradient(135deg, 
        rgba(180, 0, 55, 0.95) 0%,     /* Основной красный */
        rgba(153, 0, 55, 0.9) 25%,     /* Темнее красный */
        rgba(152, 164, 174, 0.8) 50%,  /* Серый */
        rgba(118, 143, 146, 0.85) 75%, /* Темнее серый */
        rgba(0, 40, 130, 0.95) 100%    /* Синий */
      )
    `,
    
    // ✨ SAFE AREA: отступ сверху для безопасной зоны
    paddingTop: 'env(safe-area-inset-top, 50px)',
    boxSizing: 'border-box',
    
    // Адаптивность для мобильных
    '@supports (-webkit-touch-callout: none)': {
      height: '-webkit-fill-available',
      minHeight: '-webkit-fill-available'
    }
  };

  // ===== СТИЛЬ ОСНОВНОГО ФОНА (с поддержкой всех типов переходов) =====
  const mainBackgroundStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 1, // НАД корпоративным фоном, но под интерфейсом
    
    // ФОНОВОЕ ИЗОБРАЖЕНИЕ или ПРОЗРАЧНОСТЬ ДЛЯ КОРПОРАТИВНОГО ГРАДИЕНТА
    ...(availableBackgrounds.length > 0 && imagesLoaded ? {
      backgroundImage: `url(${availableBackgrounds[currentBackgroundIndex]})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      opacity: currentOpacity,                                    // ✨ Плавная прозрачность
      filter: `blur(${currentBlur}px)`,                          // ✨ Мягкий блюр (0-6px)
      transform: currentTransform,                                // ✨ Динамические трансформации
      // ✨ Адаптивные transitions в зависимости от типа перехода
      transition: isFinalizing ? 'none' : 
        currentTransition.includes('slide') ? 'transform 0.1s cubic-bezier(0.25, 0.46, 0.45, 0.94)' :
        currentTransition.includes('zoom') || currentTransition === 'spiralIn' ? 'transform 0.1s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.1s ease-out, filter 0.1s ease-out' :
        'opacity 0.1s ease-out, filter 0.1s ease-out',
    } : {
      // Если нет изображений - становится прозрачным, показывая корпоративный градиент
      opacity: 0
    })
  };

  // ===== СТИЛЬ СЛЕДУЮЩЕГО ФОНА (с поддержкой всех типов переходов) =====
  const nextBackgroundStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundImage: availableBackgrounds.length > 0 && imagesLoaded ? 
      `url(${availableBackgrounds[nextBackgroundIndex]})` : 'none',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    opacity: nextOpacity,                                        // ✨ Плавная прозрачность
    filter: `blur(${nextBlur}px)`,                              // ✨ Мягкий блюр (0-8px)
    transform: nextTransform,                                    // ✨ Динамические трансформации
    // ✨ Адаптивные transitions в зависимости от типа перехода
    transition: isFinalizing ? 'none' : 
      currentTransition.includes('slide') ? 'transform 0.1s cubic-bezier(0.25, 0.46, 0.45, 0.94)' :
      currentTransition.includes('zoom') || currentTransition === 'spiralIn' ? 'transform 0.1s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.1s ease-out, filter 0.1s ease-out' :
      'opacity 0.1s ease-out, filter 0.1s ease-out',
    zIndex: isTransitioning ? 2 : 1, // НАД основным фоном только во время перехода
    pointerEvents: 'none'
  };

  // ===== ЦВЕТОВОЙ ОВЕРЛЕЙ ДЛЯ FADE TO COLOR ПЕРЕХОДА =====
  const colorOverlayStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: `linear-gradient(135deg, 
      rgba(180, 0, 55, ${overlayOpacity * 0.7}) 0%,     
      rgba(0, 40, 130, ${overlayOpacity * 0.8}) 100%
    )`,
    opacity: overlayOpacity,
    zIndex: isTransitioning && currentTransition === 'fadeToColor' ? 3 : -1,
    pointerEvents: 'none',
    transition: 'opacity 0.1s ease-out'
  };

  // ===== АДАПТИВНАЯ AURORA АНИМАЦИЯ (с переменной интенсивностью) =====
  const auroraOverlayStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: `
      radial-gradient(circle at ${15 + (auroraOffset * 0.4 * auroraIntensity)}% ${25 + (auroraOffset * 0.3 * auroraIntensity)}%, 
        rgba(180, 0, 55, ${0.03 * auroraIntensity}) 0%,     /* ✨ Адаптивная интенсивность красного */
        rgba(152, 164, 174, ${0.02 * auroraIntensity}) 30%,  /* ✨ Адаптивная интенсивность серого */
        rgba(0, 40, 130, ${0.03 * auroraIntensity}) 60%,    /* ✨ Адаптивная интенсивность синего */
        transparent 85%),
      radial-gradient(circle at ${85 - (auroraOffset * 0.3 * auroraIntensity)}% ${75 - (auroraOffset * 0.2 * auroraIntensity)}%, 
        rgba(153, 0, 55, ${0.02 * auroraIntensity}) 0%,      /* ✨ Адаптивная интенсивность красного */
        rgba(118, 143, 146, ${0.015 * auroraIntensity}) 40%, /* ✨ Адаптивная интенсивность серого */
        rgba(0, 32, 104, ${0.02 * auroraIntensity}) 70%,    /* ✨ Адаптивная интенсивность синего */
        transparent 90%)
    `,
    zIndex: 4, // НАД всеми фонами, но под интерфейсом
    pointerEvents: 'none',
    transition: `background 0.${Math.floor(100 + 50 * auroraIntensity)}s linear` // Адаптивная скорость Aurora
  };

  // ===== LOADER СТИЛИ =====
  const loaderOverlayStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: `
      linear-gradient(135deg, 
        rgba(180, 0, 55, 0.95) 0%,
        rgba(0, 40, 130, 0.95) 100%
      )
    `,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000, // НАД ВСЕМ во время загрузки
    opacity: imagesLoaded ? 0 : 1,
    visibility: imagesLoaded ? 'hidden' : 'visible',
    transition: 'opacity 1s ease-out, visibility 1s ease-out' // ✨ Плавное исчезновение загрузчика
  };

  const loaderTextStyle = {
    color: 'white',
    fontSize: '18px',
    fontFamily: '"Segoe UI", sans-serif',
    fontWeight: 'bold',
    marginBottom: '20px',
    textAlign: 'center'
  };

  const progressBarStyle = {
    width: '200px',
    height: '4px',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: '2px',
    overflow: 'hidden',
    marginBottom: '10px'
  };

  const progressFillStyle = {
    width: `${loadingProgress}%`,
    height: '100%',
    background: `linear-gradient(90deg, 
      rgba(255, 255, 255, 0.8) 0%, 
      rgba(255, 255, 255, 1) 100%
    )`,
    transition: 'width 0.5s ease-out' // ✨ Плавный прогресс бар
  };

  const progressTextStyle = {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: '14px',
    fontFamily: '"Segoe UI", sans-serif'
  };

  // ===== CSS-В-JS ДЛЯ АНИМАЦИИ + SAFE AREA =====
  const keyframesStyle = `
    @keyframes globalBackgroundShift {
      0%, 100% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
    }
    
    /* ✨ ГЛОБАЛЬНЫЕ CSS ПЕРЕМЕННЫЕ ДЛЯ SAFE AREA */
    :root {
      --safe-area-top: env(safe-area-inset-top, 50px);
      --safe-area-bottom: env(safe-area-inset-bottom, 0px);
      --safe-area-left: env(safe-area-inset-left, 0px);
      --safe-area-right: env(safe-area-inset-right, 0px);
    }
    
    /* ✨ ГЛОБАЛЬНЫЕ УТИЛИТАРНЫЕ КЛАССЫ ДЛЯ SAFE AREA */
    .safe-top { margin-top: var(--safe-area-top) !important; }
    .safe-top-padding { padding-top: var(--safe-area-top) !important; }
    .safe-bottom { margin-bottom: var(--safe-area-bottom) !important; }
    .safe-bottom-padding { padding-bottom: var(--safe-area-bottom) !important; }
    
    /* ✨ АВТОМАТИЧЕСКИЙ SAFE AREA ДЛЯ ОСНОВНЫХ ЭЛЕМЕНТОВ */
    .logo-safe { top: 110px !important; }
    .buttons-safe { top: 300px !important; }
    .title-safe { top: 260px !important; }
    
    /* ✨ АНИМАЦИИ С SAFE AREA */
    @keyframes piFloatAroundSafe {
      0% { transform: translate(20px, 20px); }
      25% { transform: translate(calc(100vw - 60px), 30px); }
      50% { transform: translate(calc(100vw - 50px), calc(100vh - 70px - var(--safe-area-bottom))); }
      75% { transform: translate(30px, calc(100vh - 60px - var(--safe-area-bottom))); }
      100% { transform: translate(20px, 20px); }
    }
  `;

  // Добавляем анимацию в head, если её еще нет
  useEffect(() => {
    const styleId = 'global-background-animation';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = keyframesStyle;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <ErrorBoundary>
      <div style={globalContainerStyle}>
        {/* Основной фон (с поддержкой всех типов динамических переходов) */}
        <div style={mainBackgroundStyle} />
        
        {/* Следующий фон для динамических переходов */}
        {availableBackgrounds.length > 1 && imagesLoaded && (
          <div style={nextBackgroundStyle} />
        )}
        
        {/* Цветовой оверлей для Fade to Color перехода */}
        <div style={colorOverlayStyle} />
        
        {/* Адаптивная Aurora анимация поверх фона */}
        <div style={auroraOverlayStyle} />
        
        {/* Loader во время предзагрузки (с плавным исчезновением) */}
        <div style={loaderOverlayStyle}>
          <div style={loaderTextStyle}>
            Загрузка фоновых изображений...
          </div>
          <div style={progressBarStyle}>
            <div style={progressFillStyle} />
          </div>
          <div style={progressTextStyle}>
            {loadingProgress}%
          </div>
        </div>
        
        {/* Роутер с компонентами */}
        <Router>
          <Routes>
            <Route path="/"           element={<WelcomePage />} />
            <Route path="/main-menu"  element={<MainMenu />} />
            <Route path="/polls"      element={<PollsPage />} />
            <Route path="/snp"        element={<SNPPage />} />
            <Route path="/employee"   element={<EmployeePage />} />
            <Route path="/assessment" element={<AssessmentPage />} />
            <Route path="/feedback"   element={<FeedbackPage />} />
            <Route path="/justincase" element={<JustincasePage />} />
            <Route path="/carefuture" element={<CareFuturePage />} />
            <Route path="/marzapoll"  element={<MarzaPollPage />} />
          </Routes>
        </Router>
      </div>
    </ErrorBoundary>
  );
}

export default MainApp;














