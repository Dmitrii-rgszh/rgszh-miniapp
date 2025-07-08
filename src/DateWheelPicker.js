// ИСПРАВЛЕННЫЙ DateWheelPicker.js
// Замените полностью содержимое файла src/DateWheelPicker.js

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

  // ИСПРАВЛЕННЫЕ СТИЛИ - теперь с темным текстом на светлом фоне
  const selectStyle = {
    flex: '1',
    padding: '12px 8px',
    backgroundColor: 'white', // ✅ ИСПРАВЛЕНИЕ: белый фон вместо прозрачного
    border: '2px solid #e1e5e9', // ✅ ИСПРАВЛЕНИЕ: такая же рамка как у других полей
    borderRadius: '8px',
    color: '#333', // ✅ ИСПРАВЛЕНИЕ: темный текст вместо белого
    fontSize: '16px', // ✅ ИСПРАВЛЕНИЕ: увеличили размер шрифта
    cursor: 'pointer',
    minHeight: '48px',
    appearance: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    // ✅ ИСПРАВЛЕНИЕ: темная стрелка вместо белой
    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23333' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 8px center',
    backgroundSize: '12px',
    paddingRight: '28px',
    textAlign: 'center',
    outline: 'none', // ✅ ДОБАВЛЕНО: убираем outline при фокусе
    transition: 'border-color 0.3s ease', // ✅ ДОБАВЛЕНО: плавная анимация
    boxSizing: 'border-box'
  };

  // ✅ ДОБАВЛЕНО: стиль для фокуса
  const selectFocusStyle = {
    borderColor: '#9370DB'
  };

  // ✅ ИСПРАВЛЕНИЕ: темные опции вместо светлых
  const optionStyle = {
    backgroundColor: 'white',
    color: '#333',
    padding: '12px'
  };

  return (
    <div 
      className="date-wheel-picker"
      style={{
        display: 'flex',
        flexDirection: 'row',
        gap: '8px',
        width: '100%'
      }}
    >
      {/* День */}
      <select
        value={value.day || '01'}
        onChange={handleChange('day')}
        style={selectStyle}
        onFocus={(e) => e.target.style.borderColor = '#9370DB'}
        onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
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
        onFocus={(e) => e.target.style.borderColor = '#9370DB'}
        onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
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
        onFocus={(e) => e.target.style.borderColor = '#9370DB'}
        onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
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



