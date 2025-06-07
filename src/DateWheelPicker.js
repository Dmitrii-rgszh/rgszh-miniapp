// src/DateWheelPicker.js
import React from 'react';

const DateWheelPicker = ({
  // value — объект { day, month, year }, по умолчанию текущий год и 01/01
  value = {
    day:   '01',
    month: '01',
    year:  `${new Date().getFullYear()}`
  },
  onChange
}) => {
  // Массивы дней, месяцев, лет
  const days = Array.from({ length: 31 }, (_, i) =>
    (i + 1).toString().padStart(2, '0')
  );
  const months = Array.from({ length: 12 }, (_, i) =>
    (i + 1).toString().padStart(2, '0')
  );
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) =>
    (currentYear - i).toString()
  );

  const handleChange = () => {
    const day   = document.getElementById('wheel-day').value;
    const month = document.getElementById('wheel-month').value;
    const year  = document.getElementById('wheel-year').value;
    // Передаём объект с отдельными полями
    onChange({ day, month, year });
  };

  return (
    <div className="date-wheel-picker">
      <select
        id="wheel-day"
        value={value.day}
        onChange={handleChange}
      >
        {days.map(d => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>

      <select
        id="wheel-month"
        value={value.month}
        onChange={handleChange}
      >
        {months.map(m => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>

      <select
        id="wheel-year"
        value={value.year}
        onChange={handleChange}
      >
        {years.map(y => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
};

export default DateWheelPicker;



