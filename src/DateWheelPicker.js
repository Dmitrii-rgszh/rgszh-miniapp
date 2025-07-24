// Обновленный DateWheelPicker.js с исправленной кликабельностью

import React from 'react';

const DateWheelPicker = ({
  value = {
    day: '01',
    month: '01',
    year: `${new Date().getFullYear()}`
  },
  onChange
}) => {
  const months = [
    { value: '01', label: 'Янв' },
    { value: '02', label: 'Фев' },
    { value: '03', label: 'Мар' },
    { value: '04', label: 'Апр' },
    { value: '05', label: 'Май' },
    { value: '06', label: 'Июн' },
    { value: '07', label: 'Июл' },
    { value: '08', label: 'Авг' },
    { value: '09', label: 'Сен' },
    { value: '10', label: 'Окт' },
    { value: '11', label: 'Ноя' },
    { value: '12', label: 'Дек' }
  ];

  const getDaysInMonth = (month, year) => {
    return new Date(year, month, 0).getDate();
  };

  const currentMonth = parseInt(value.month) || 1;
  const currentYearNum = parseInt(value.year) || new Date().getFullYear();
  const daysInCurrentMonth = getDaysInMonth(currentMonth, currentYearNum);
  
  const days = Array.from({ length: daysInCurrentMonth }, (_, i) => {
    const day = (i + 1).toString().padStart(2, '0');
    return { value: day, label: day };
  });

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => {
    const year = (currentYear - i).toString();
    return { value: year, label: year };
  });

  const handleChange = (field) => (e) => {
    const newValue = { ...value, [field]: e.target.value };
    
    // Если изменился месяц или год, проверяем корректность дня
    if (field === 'month' || field === 'year') {
      const daysInNewMonth = getDaysInMonth(
        parseInt(newValue.month) || 1, 
        parseInt(newValue.year) || new Date().getFullYear()
      );
      if (parseInt(newValue.day) > daysInNewMonth) {
        newValue.day = daysInNewMonth.toString().padStart(2, '0');
      }
    }
    
    onChange(newValue);
  };

  // КРИТИЧНО: Усиленные стили для максимальной кликабельности
  const selectStyle = {
    // Максимальный приоритет и кликабельность
    position: 'relative',
    zIndex: '9999',
    pointerEvents: 'auto',
    cursor: 'pointer',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    touchAction: 'manipulation',
    WebkitTouchCallout: 'default',
    WebkitTapHighlightColor: 'rgba(180, 0, 55, 0.2)',
    
    // Размеры и видимость
    flex: '1',
    padding: '12px 8px',
    minHeight: '48px',
    height: 'auto',
    opacity: '1',
    visibility: 'visible',
    display: 'block',
    
    // Предотвращение zoom на iOS
    fontSize: '16px',
    transform: 'scale(1)',
    transformOrigin: 'center',
    
    // Визуальные стили
    backgroundColor: '#f5f7fa',
    border: '1px solid #e3e7ee',
    borderRadius: '8px',
    color: '#333',
    fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif',
    fontWeight: '400',
    textAlign: 'center',
    textAlignLast: 'center',
    boxSizing: 'border-box',
    
    // Убираем стандартные стили браузера
    outline: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    appearance: 'none',
    
    // Кастомная стрелка
    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 8px center',
    backgroundSize: '16px',
    paddingRight: '32px',
    
    // Переходы
    transition: 'all 0.3s ease'
  };

  // Стили для option элементов
  const optionStyle = {
    backgroundColor: 'white',
    color: '#333',
    padding: '12px',
    fontSize: '16px'
  };

  // Обработчики событий для улучшения кликабельности
  const handleFocus = (e) => {
    Object.assign(e.target.style, {
      borderColor: 'rgb(180, 0, 55)',
      boxShadow: '0 0 0 3px rgba(180, 0, 55, 0.1)',
      backgroundColor: 'white'
    });
  };

  const handleBlur = (e) => {
    Object.assign(e.target.style, {
      borderColor: '#e3e7ee',
      boxShadow: 'none',
      backgroundColor: '#f5f7fa'
    });
  };

  const handleTouch = (e) => {
    e.stopPropagation();
    e.target.focus();
    // Для iOS - принудительно открываем select
    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      const mouseEvent = new MouseEvent('mousedown', {
        view: window,
        bubbles: true,
        cancelable: true
      });
      e.target.dispatchEvent(mouseEvent);
    }
  };

  return (
    <div 
      className="date-wheel-picker"
      style={{
        display: 'flex',
        flexDirection: 'row',
        gap: '8px',
        width: '100%',
        position: 'relative',
        zIndex: '100'
      }}
    >
      {/* День */}
      <select
        value={value.day || '01'}
        onChange={handleChange('day')}
        style={selectStyle}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onTouchStart={handleTouch}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {days.map(day => (
          <option key={day.value} value={day.value} style={optionStyle}>
            {day.label}
          </option>
        ))}
      </select>

      {/* Месяц */}
      <select
        value={value.month || '01'}
        onChange={handleChange('month')}
        style={selectStyle}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onTouchStart={handleTouch}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {months.map(month => (
          <option key={month.value} value={month.value} style={optionStyle}>
            {month.label}
          </option>
        ))}
      </select>

      {/* Год */}
      <select
        value={value.year || currentYear.toString()}
        onChange={handleChange('year')}
        style={selectStyle}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onTouchStart={handleTouch}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {years.map(year => (
          <option key={year.value} value={year.value} style={optionStyle}>
            {year.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default DateWheelPicker;



