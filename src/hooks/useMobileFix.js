// useMobileFix.js - React Hook для исправления проблем с кликами на мобильных
// Создайте этот файл в src/hooks/useMobileFix.js

import { useEffect } from 'react';

export default function useMobileFix() {
  useEffect(() => {
    // Определяем мобильное устройство
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    if (!isMobile) return;

    console.log('🔧 Mobile fix activated');

    // 1. Фикс для iOS - предотвращаем двойной тап zoom
    let lastTouchEnd = 0;
    const preventDoubleTapZoom = (e) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    };

    // 2. Улучшаем отзывчивость кликов
    const improveClickResponsiveness = (e) => {
      const target = e.target;
      
      // Проверяем, является ли элемент кнопкой
      if (target.matches('button, .btn-universal, .next-btn, .back-btn, .option-button, [role="button"]')) {
        e.stopPropagation();
        
        // Добавляем визуальный фидбек
        target.style.opacity = '0.7';
        setTimeout(() => {
          target.style.opacity = '';
        }, 100);
        
        // Логируем для отладки
        console.log('📱 Touch on button:', target.className);
      }
    };

    // 3. Фиксим проблемы с z-index
    const fixZIndexIssues = () => {
      const buttons = document.querySelectorAll('.next-btn, .back-btn');
      
      buttons.forEach(btn => {
        if (btn) {
          // Принудительно поднимаем кнопки наверх
          btn.style.setProperty('z-index', '999999', 'important');
          btn.style.setProperty('position', 'fixed', 'important');
          btn.style.setProperty('pointer-events', 'auto', 'important');
          
          // Добавляем обработчик для отладки
          const debugClick = (e) => {
            console.log('🎯 Button clicked:', btn.className);
            // Не останавливаем распространение, чтобы React обработчики сработали
          };
          
          btn.addEventListener('click', debugClick, true);
          btn.addEventListener('touchend', debugClick, true);
          
          // Визуальная индикация для отладки
          if (window.location.href.includes('debug=true')) {
            btn.style.border = '3px solid red';
          }
        }
      });
    };

    // 4. Обработчик для всех touch событий
    const globalTouchHandler = (e) => {
      const touch = e.touches[0] || e.changedTouches[0];
      if (!touch) return;

      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      
      if (element && element.matches('button, .btn-universal, .next-btn, .back-btn, .option-button')) {
        console.log('🔍 Touch detected on:', element.className);
        
        // Для iOS симулируем клик
        if (isIOS && e.type === 'touchend') {
          setTimeout(() => {
            const clickEvent = new MouseEvent('click', {
              bubbles: true,
              cancelable: true,
              view: window
            });
            element.dispatchEvent(clickEvent);
          }, 0);
        }
      }
    };

    // 5. Применяем фиксы
    document.addEventListener('touchend', preventDoubleTapZoom, { passive: false });
    document.addEventListener('touchstart', improveClickResponsiveness, { passive: true });
    document.addEventListener('touchstart', globalTouchHandler, { passive: true });
    document.addEventListener('touchend', globalTouchHandler, { passive: true });

    // Применяем z-index фиксы с задержкой
    setTimeout(fixZIndexIssues, 100);
    setTimeout(fixZIndexIssues, 500);
    setTimeout(fixZIndexIssues, 1000);

    // 6. Фикс для Telegram WebApp
    if (window.Telegram?.WebApp) {
      console.log('📱 Telegram WebApp detected');
      
      // Отключаем свайпы Telegram
      window.Telegram.WebApp.disableVerticalSwipes();
      
      // Расширяем приложение
      window.Telegram.WebApp.expand();
    }

    // 7. Отладочная информация
    console.log('📱 Mobile Debug Info:', {
      userAgent: navigator.userAgent,
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
      touchPoints: navigator.maxTouchPoints
    });

    // Cleanup
    return () => {
      document.removeEventListener('touchend', preventDoubleTapZoom);
      document.removeEventListener('touchstart', improveClickResponsiveness);
      document.removeEventListener('touchstart', globalTouchHandler);
      document.removeEventListener('touchend', globalTouchHandler);
    };
  }, []);
}

// Дополнительная функция для ручной проверки
export function debugButtons() {
  const buttons = document.querySelectorAll('button, .next-btn, .back-btn');
  
  buttons.forEach((btn, index) => {
    const rect = btn.getBoundingClientRect();
    const styles = window.getComputedStyle(btn);
    
    console.log(`Button ${index} (${btn.className}):`, {
      visible: rect.width > 0 && rect.height > 0,
      position: { x: rect.left, y: rect.top },
      size: { width: rect.width, height: rect.height },
      clickable: styles.pointerEvents !== 'none',
      zIndex: styles.zIndex,
      opacity: styles.opacity
    });
    
    // Подсветка для визуальной проверки
    btn.style.outline = '3px solid red';
    btn.style.outlineOffset = '2px';
  });
}