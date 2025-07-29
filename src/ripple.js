// ripple.js - ПРОСТОЙ RIPPLE ЭФФЕКТ БЕЗ СОСТОЯНИЙ
// Подключите этот файл в index.js или App.js

// Функция для создания ripple эффекта
export function initRippleEffect() {
  // Добавляем обработчик на все кнопки с классом btn-universal
  document.addEventListener('click', function(e) {
    // Проверяем, что клик был по кнопке
    const button = e.target.closest('.btn-universal');
    if (!button) return;
    
    // Создаем ripple элемент
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    
    // Вычисляем размер и позицию
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    // Применяем стили
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    
    // Удаляем предыдущий ripple если есть
    const oldRipple = button.querySelector('.ripple');
    if (oldRipple) {
      oldRipple.remove();
    }
    
    // Добавляем новый ripple
    button.appendChild(ripple);
    
    // Удаляем ripple после анимации
    setTimeout(() => {
      ripple.remove();
    }, 600);
  });
}

// Альтернативный способ - добавить как метод к кнопкам
export function addRippleToButton(button) {
  button.addEventListener('click', function(e) {
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    
    const rect = this.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    
    const oldRipple = this.querySelector('.ripple');
    if (oldRipple) {
      oldRipple.remove();
    }
    
    this.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, 600);
  });
}

// Инициализация при загрузке страницы
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initRippleEffect);
} else {
  initRippleEffect();
}