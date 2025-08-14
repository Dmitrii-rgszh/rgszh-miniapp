// src/SNPPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logoImage       from './components/logo.png';
import DateWheelPicker from './DateWheelPicker';

// Подключаем CSS файлы для единого стиля
import './Styles/logo.css';
import './Styles/cards.css';
import './Styles/text.css';
import './Styles/buttons.css';
import './Styles/BackButton.css';
import './Styles/HomeButton.css';
import './Styles/containers.css';
import './Styles/ProgressIndicator.css';
import './Styles/NextButton.css';
import './Styles/ios-safari-fixes.css';

export default function SNPPage() {
  const navigate = useNavigate();

  // ===== Состояния =====
  const [step, setStep]                   = useState(1);
  const [email, setEmail]                 = useState('');
  const [emailError, setEmailError]       = useState('');
  const [birthParts, setBirthParts]       = useState({
    day: '01',
    month: '01',
    year: new Date().getFullYear().toString()
  });
  const [birthDate, setBirthDate]         = useState(new Date());
  const [ageError, setAgeError]           = useState('');
  const [gender, setGender]               = useState(null);    // 'мужской' | 'женский' | null
  const [calcType, setCalcType]           = useState(null);    // 'premium' | 'sum' | null
  const [amountRaw, setAmountRaw]         = useState('');      // чистые цифры (например "60000")
  const [amountDisplay, setAmountDisplay] = useState('');      // с точками (например "60.000")
  const [amountError, setAmountError]     = useState('');
  const [resultData, setResultData]       = useState(null);
  
  // Анимации
  const [contentAnimated, setContentAnimated] = useState(false);
  const [logoAnimated, setLogoAnimated] = useState(false);

  const [contactMode, setContactMode]     = useState(false);   // показывать ли форму «Связаться с менеджером»
  const [contactSending, setContactSending] = useState(false);
  const [contactSent, setContactSent]     = useState(false);

  // Поля формы «Связаться с менеджером»
  const [lastName, setLastName]           = useState('');
  const [firstName, setFirstName]         = useState('');
  const [middleName, setMiddleName]       = useState('');
  const [workCity, setWorkCity]           = useState('');

  // Email валидность: проверяем формат и домен @vtb.ru
  const isValidEmailFormat = email.includes('@') && email.includes('.') && email.length > 5;
  const emailValid = email.toLowerCase().endsWith('@vtb.ru') && isValidEmailFormat;

  // ===== useEffect для анимации =====
  useEffect(() => {
    // Анимация логотипа
    setTimeout(() => setLogoAnimated(true), 300);
    // Анимация контента
    setTimeout(() => setContentAnimated(true), 600);
  }, []);

  // ===== Вспомогательные функции =====
  function getAge(d) {
    if (!(d instanceof Date)) return 0;
    const today = new Date();
    let age = today.getFullYear() - d.getFullYear();
    if (
      today.getMonth() < d.getMonth() ||
      (today.getMonth() === d.getMonth() && today.getDate() < d.getDate())
    ) {
      age--;
    }
    return age;
  }

  function isAmountValid() {
    const n = parseInt(amountRaw, 10) || 0;
    return (calcType === 'premium' && n >= 60000) ||
           (calcType === 'sum'     && n >= 450000);
  }

  function canGoNext() {
    if (step === 1) {
      return emailValid;
    }
    if (step === 2) {
      return (
        getAge(birthDate) >= 18 &&
        !ageError &&
        gender &&
        calcType &&
        amountRaw &&
        isAmountValid()
      );
    }
    return false;
  }

  // ===== Обработчик: Шаг 1 → Шаг 2 =====
  function handleEmailNext() {
    if (!emailValid) {
      setEmailError('Введите корпоративную почту ВТБ (@vtb.ru)');
      return;
    }
    setEmailError('');
    // Сброс данных при переходе к шагу 2
    setBirthDate(new Date());
    setGender(null);
    setCalcType(null);
    setAmountRaw('');
    setAmountDisplay('');
    setAmountError('');
    setAgeError('');
    setStep(2);
  }

  // ===== Обработчик изменения суммы: форматируем с точками =====
  function onAmountChange(e) {
    const raw = e.target.value.replace(/\D/g, ''); // оставляем только цифры
    setAmountRaw(raw);
    // Форматируем display с разделением тысяч через точку
    let d = raw, o = '';
    while (d.length > 3) {
      o = '.' + d.slice(-3) + o;
      d = d.slice(0, -3);
    }
    setAmountDisplay(d + o);

    const n = parseInt(raw, 10) || 0;
    if (calcType === 'premium' && n < 60000) {
      setAmountError('Мин. 60 000 ₽');
    } else if (calcType === 'sum' && n < 450000) {
      setAmountError('Мин. 450 000 ₽');
    } else {
      setAmountError('');
    }
  }

  // ===== Обработчик: «Выполнить расчёт» =====
  async function handleNext() {
    if (!canGoNext()) {
      if (getAge(birthDate) < 18) {
        setAgeError('Возраст должен быть не менее 18 лет');
      }
      return;
    }

    const payload = {
      email:      email,
      birthdate:  birthDate.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      age:        getAge(birthDate),
      gender:     gender,
      payment:    calcType === 'premium' ? 'Страхового взноса' : 'Страховой суммы',
      sum:        parseInt(amountRaw, 10)
    };

    console.log('🚀 SNP CALCULATION DEBUG:');
    console.log('📍 Current URL:', window.location.href);
    console.log('📡 Request URL:', 'http://localhost:4000/api/proxy/snp/calculate');
    console.log('📋 Payload:', payload);

    try {
      console.log('📤 Sending POST request...');
      const res = await fetch('http://localhost:4000/api/proxy/snp/calculate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload)
      });

      console.log('📥 Response received:');
      console.log('   - Status:', res.status);
      console.log('   - Status Text:', res.statusText);

      if (!res.ok) {
        const errorText = await res.text();
        console.error('❌ Server error:', res.status, errorText);
        alert(`Ошибка ${res.status}: смотрите консоль`);
      } else {
        const data = await res.json();
        console.log('✅ Response:', data);
        /*
          Ожидаемый ответ:
          {
            calculationDate: "...",
            gender: "...",
            age: ...,
            payment: "...",
            contribution: rv("C13"),            // C13
            totalContribution: rv("C16"),       // C16
            accrualPercent: rv("H12"),          // H12 (например 0.44)
            accrualAmount: rv("H13"),           // H13
            totalAccrual: rv("H16"),            // H16
            finalAnnual: rv("M13"),             // M13
            finalTotal: rv("M16")               // M16
          }
        */
        setResultData(data);
        setStep(3); // Переходим к результатам
      }
    } catch (error) {
      console.error('🚨 Network error:', error);
      alert('Ошибка сети');
    }
  }

  function goHome() {
    navigate(-1);
  }

  // ===== Обработчик: «Отправить запрос менеджеру» =====
  async function handleSendToManager() {
    // Валидируем поля
    if (!lastName.trim() || !firstName.trim() || !workCity.trim()) {
      alert('Заполните, пожалуйста, все поля формы.');
      return;
    }
    setContactSending(true);

    // Составляем тему и тело письма с результатами расчета
    const fullName = `${lastName.trim()} ${firstName.trim()} ${middleName.trim()}`;
    const subject = `Результаты расчета "Стратегия на пять. Гарант" – ${fullName}`;
    
    // Получаем результаты из resultData
    const {
      contribution,
      totalContribution,
      accrualPercent,
      accrualAmount,
      totalAccrual,
      finalAnnual,
      finalTotal
    } = resultData;
    
    const fmt = num => Number(num || 0).toLocaleString('ru-RU');
    const accrualPercentDisplay = Math.round(Number(accrualPercent) * 100);
    const todayStr = new Date().toLocaleDateString('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });

    const bodyLines = [
      'Добрый день!',
      '',
      'Ваши результаты расчета по программе "Стратегия на пять. Гарант":',
      '',
      '=== ВАШИ ДАННЫЕ ===',
      `ФИО: ${fullName}`,
      `Пол: ${gender}`,
      `Дата рождения: ${birthDate.toLocaleDateString('ru-RU', { day:'2-digit', month:'2-digit', year:'numeric' })}`,
      `Возраст: ${getAge(birthDate)} лет`,
      `Город работы: ${workCity.trim()}`,
      `Дата расчета: ${todayStr}`,
      '',
      '=== РЕЗУЛЬТАТЫ РАСЧЕТА ===',
      `Ежегодный взнос: ${fmt(contribution)} ₽`,
      `Общая сумма взносов (5 лет): ${fmt(totalContribution)} ₽`,
      `Процент начисления: ${accrualPercentDisplay}% годовых`,
      `Годовые начисления: ${fmt(accrualAmount)} ₽`,
      `Общие начисления (5 лет): ${fmt(totalAccrual)} ₽`,
      `Итого к получению ежегодно: ${fmt(finalAnnual)} ₽`,
      `Итого к получению за 5 лет: ${fmt(finalTotal)} ₽`,
      '',
      'Для оформления полиса обратитесь к вашему менеджеру.',
      '',
      'С уважением,',
      'Команда ВТБ Страхование'
    ];
    
    const body = bodyLines.join('\r\n');

    const payload = {
      to_email: email, // Отправляем на почту пользователя
      subject,
      body,
      user_data: {
        full_name: fullName,
        email: email,
        city: workCity.trim(),
        calculation_results: resultData
      }
    };

    try {
      // Отправляем результаты расчета пользователю
      const res = await fetch('http://localhost:4000/api/proxy/snp/send_results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        console.error('Ошибка сервера при отправке результатов:', res.status, await res.text());
        alert(`Ошибка при отправке результатов: ${res.status}`);
        setContactSending(false);
      } else {
        setContactSending(false);
        setContactSent(true);
        // Через 4 секунды возвращаем на предыдущую страницу
        setTimeout(() => navigate(-1), 4000);
      }
    } catch (err) {
      console.error('Ошибка при отправке результатов:', err);
      alert('Не удалось отправить результаты расчета');
      setContactSending(false);
    }
  }

  // ===== Экран «Отправляется запрос менеджеру…» =====
  if (contactSending) {
    return (
      <div className="processing-screen">
        <div className="logo-wrapper animate-logo">
          <img className="poll-logo" src={logoImage} alt="Логотип" />
        </div>
        <p className="processing-title">
          Отправляются результаты расчета на вашу почту...
        </p>
        <div className="arrow-animation">→</div>
      </div>
    );
  }

  // ===== Экран «Успех отправки менеджеру» =====
  if (contactSent) {
    const fullName = `${firstName} ${lastName}`.trim();
    return (
      <div className="processing-screen">
        <div className="logo-wrapper animate-logo">
          <img className="poll-logo" src={logoImage} alt="Логотип" />
        </div>
        <p className="processing-title">
          {fullName}, результаты расчета отправлены на вашу почту {email}!<br/>Отличного дня, коллега!
        </p>
      </div>
    );
  }

  // ===== Если resultData есть — показываем карточку с результатами + форму контактов =====
  if (resultData) {
    // Переменные для отображения
    const { 
      contribution, 
      totalContribution,
      accrualPercent,
      accrualAmount,
      totalAccrual,
      finalAnnual,
      finalTotal
    } = resultData;

    const fmt = num => Number(num || 0).toLocaleString('ru-RU');
    const resGender = gender === 'мужской' ? 'Мужской' : 'Женский';
    const resPayment = calcType === 'premium' ? 'Страхового взноса' : 'Страховой суммы';
    const accrualPercentDisplay = Math.round(Number(accrualPercent) * 100);
    const todayStr = new Date().toLocaleDateString('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });

    // ===== Если contactMode=true, показываем форму «Введите Ваши данные» =====
    if (contactMode) {
      return (
        <div className="main-container">
          {/* Кнопка "Назад" */}
          <button className="back-btn animate-home" onClick={goHome}>
            <svg viewBox="0 0 24 24">
              <path d="M15 18l-6-6 6-6" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          
          {/* Логотип */}
          <div className={`logo-wrapper ${logoAnimated ? 'animated' : ''}`}>
            <img src={logoImage} alt="Logo" className="logo-image" />
          </div>
          
          {/* Кнопка "Назад к результатам" */}
          <button className="next-btn animate-next" onClick={() => setContactMode(false)}>
            <svg viewBox="0 0 24 24">
              <path d="M15 18l-6-6 6-6" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <div className="form-container">
            <div className={`card-container card-positioned scrollable ${contentAnimated ? 'animated' : ''}`}>
              <div className="card-content">
                <h1 className="text-h1-dark text-center">Введите Ваши данные</h1>
                
                <div className="form-group">
                  <label className="text-label" style={{ color: '#1f4e79' }}>Фамилия:</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Введите фамилию"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="text-label" style={{ color: '#1f4e79' }}>Имя:</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Введите имя"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="text-label" style={{ color: '#1f4e79' }}>Отчество:</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Введите отчество"
                    value={middleName}
                    onChange={e => setMiddleName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="text-label" style={{ color: '#1f4e79' }}>Город работы:</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Введите город"
                    value={workCity}
                    onChange={e => setWorkCity(e.target.value)}
                  />
                </div>

                <button
                  className="btn-universal btn-primary btn-large btn-fullwidth"
                  onClick={handleSendToManager}
                >
                  Отправить результаты на почту
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // ===== Иначе (contactMode=false) — показываем результаты =====
    return (
      <div className="main-container">
        {/* Кнопка "Назад" */}
        <button className="back-btn animate-home" onClick={goHome}>
          <svg viewBox="0 0 24 24">
            <path d="M15 18l-6-6 6-6" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        
        {/* Логотип */}
        <div className={`logo-wrapper ${logoAnimated ? 'animated' : ''}`}>
          <img src={logoImage} alt="Logo" className="logo-image" />
        </div>
        
        {/* Кнопка "Повторить расчет" */}
        <button
          className="next-btn repeat-btn"
          onClick={() => {
            // Сброс к шагу 2
            setResultData(null);
            setGender(null);
            setCalcType(null);
            setAmountRaw('');
            setAmountDisplay('');
            setAmountError('');
            setStep(2);
            setContactMode(false);
          }}
        >
          {/* SVG recycle icon */}
          <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
            <path
              d="M4.93 19.07A10 10 0 1 1 21 12"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="m21 12-4-4 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <div className="form-container">
          <div className={`card-container card-positioned animated`}>
            <div className="card-content">
              <h2 className="text-h2 text-center">Расчёт по программе «Стратегия на пять. Гарант»</h2>
              
              {/* Параметры расчета */}
              <div className="result-items">
                <div className="result-item-split">
                  <span className="result-label-left">Дата расчёта:</span>
                  <span className="result-value-right">{todayStr}</span>
                </div>
                <div className="result-item-split">
                  <span className="result-label-left">Возраст:</span>
                  <span className="result-value-right">{getAge(birthDate)} лет</span>
                </div>
                <div className="result-item-split">
                  <span className="result-label-left">Пол:</span>
                  <span className="result-value-right">{resGender}</span>
                </div>
                <div className="result-item-split">
                  <span className="result-label-left">Расчёт от:</span>
                  <span className="result-value-right">{resPayment}</span>
                </div>
              </div>

              {/* Основные результаты */}
              <div className="result-items" style={{ marginTop: '20px' }}>
                <div className="result-item-split highlight">
                  <span className="result-label-left">Ежегодный взнос:</span>
                  <span className="result-value-right">{fmt(contribution)} ₽</span>
                </div>
                <div className="result-item-split">
                  <span className="result-label-left">Общая сумма взносов (5 лет):</span>
                  <span className="result-value-right">{fmt(totalContribution)} ₽</span>
                </div>
                <div className="result-item-split highlight">
                  <span className="result-label-left">Процент начисления:</span>
                  <span className="result-value-right">{accrualPercentDisplay}% годовых</span>
                </div>
                <div className="result-item-split">
                  <span className="result-label-left">Годовые начисления:</span>
                  <span className="result-value-right">{fmt(accrualAmount)} ₽</span>
                </div>
                <div className="result-item-split">
                  <span className="result-label-left">Общие начисления (5 лет):</span>
                  <span className="result-value-right">{fmt(totalAccrual)} ₽</span>
                </div>
                <div className="result-item-split highlight">
                  <span className="result-label-left">Итого к получению ежегодно:</span>
                  <span className="result-value-right">{fmt(finalAnnual)} ₽</span>
                </div>
                <div className="result-item-split highlight">
                  <span className="result-label-left">Итого к получению за 5 лет:</span>
                  <span className="result-value-right">{fmt(finalTotal)} ₽</span>
                </div>
              </div>

              <div className="card-footer" style={{ marginTop: '20px' }}>
                <button
                  type="button"
                  className="btn-universal btn-primary btn-large btn-fullwidth"
                  onClick={() => setContactMode(true)}
                >
                  Связаться с менеджером
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===== ОСНОВНОЙ UI (Шаг 1 и Шаг 2) =====
  return (
    <div className={`main-container ${step === 3 || contactMode ? 'snp-page-wrapper' : ''}`}>
      {/* Кнопка "Назад" */}
      <button className="back-btn animate-home" onClick={goHome}>
        <svg viewBox="0 0 24 24">
          <path d="M15 18l-6-6 6-6" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      
      {/* Логотип */}
      <div className={`logo-wrapper ${logoAnimated ? 'animated' : ''}`}>
        <img src={logoImage} alt="Logo" className="logo-image" />
      </div>
      
      {/* Кнопка "Далее" */}
      <button
        className={`next-btn ${contentAnimated && canGoNext() ? 'animate-next' : ''} ${!canGoNext() ? 'disabled' : ''}`}
        onClick={step === 1 ? handleEmailNext : handleNext}
        disabled={!canGoNext()}
      >
        <div className={`shaker ${contentAnimated && canGoNext() ? 'shake-btn' : ''}`}>
          <svg viewBox="0 0 24 24">
            <path d="M9 6l6 6-6 6" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </button>

      <div className="form-container">
        {/* ===== Шаг 1: Ввод корпоративной почты ===== */}
        {step === 1 && (
          <div className={`card-container card-positioned ${contentAnimated ? 'animated' : ''}`}>
            <div className="card-header">
              <h1 className="text-h1-dark text-center">Стратегия на пять. Гарант</h1>
              <p className="text-body-dark text-center">
                Программа накопительного страхования жизни с фиксированным доходом
              </p>
            </div>
            
            <div className="form-group">
              <label className="form-label text-label-large" style={{ color: '#1f4e79' }}>Введите ваш корпоративный email для индивидуального расчета</label>
              <input
                type="email"
                className={`form-input ${emailError ? 'error' : ''}`}
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck="false"
                placeholder="example@vtb.ru"
                value={email}
                onChange={e => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError('');
                }}
              />
              {emailError && <span className="form-error">{emailError}</span>}
            </div>
          </div>
        )}

        {/* ===== Шаг 2: Ввод данных пользователя ===== */}
        {step === 2 && (
          <div className={`card-container card-positioned scrollable ${contentAnimated ? 'animated' : ''}`}>
            <div className="card-content">
              <h1 className="text-h1-dark text-center">Введите ваши данные для расчета</h1>
              
              <div className="form-group">
                <label className="text-label" style={{ color: '#1f4e79' }}>Дата рождения:</label>
                <DateWheelPicker
                  value={birthParts}
                  onChange={(newParts) => {
                    setBirthParts(newParts);
                    // Сразу обновляем birthDate
                    const { day, month, year } = newParts;
                    if (day && month && year) {
                      const d = Number(day);
                      const m = Number(month);
                      const y = Number(year);
                      const dt = new Date(y, m - 1, d);
                      if (!isNaN(dt.getTime()) && 
                          dt.getDate() === d && 
                          dt.getMonth() + 1 === m && 
                          dt.getFullYear() === y) {
                        
                        // Проверяем возраст (минимум 18 лет)
                        const today = new Date();
                        const age = today.getFullYear() - dt.getFullYear() - 
                          ((today.getMonth() < dt.getMonth() || 
                            (today.getMonth() === dt.getMonth() && today.getDate() < dt.getDate())) ? 1 : 0);
                        
                        if (age < 18) {
                          setAgeError('Возраст должен быть не менее 18 лет');
                          setBirthDate(new Date()); // Устанавливаем дефолтную дату
                        } else {
                          setAgeError('');
                          setBirthDate(dt);
                        }
                      }
                    }
                  }}
                />
                {ageError && <span className="form-error" style={{ color: '#B71C3A' }}>{ageError}</span>}
              </div>

              <div className="form-group">
                <label className="text-label" style={{ color: '#1f4e79' }}>Выберите пол:</label>
                <div className="option-buttons horizontal-always">
                  <button
                    type="button"
                    className={`option-button ${gender === 'мужской' ? 'selected' : ''}`}
                    onClick={() => setGender('мужской')}
                  >
                    Мужской
                  </button>
                  <button
                    type="button"
                    className={`option-button ${gender === 'женский' ? 'selected' : ''}`}
                    onClick={() => setGender('женский')}
                  >
                    Женский
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="text-label" style={{ color: '#1f4e79' }}>Расчёт от…</label>
                <div className="option-buttons horizontal-always">
                  <button
                    type="button"
                    className={`option-button ${calcType === 'premium' ? 'selected' : ''}`}
                    onClick={() => setCalcType('premium')}
                  >
                    Страхового взноса
                  </button>
                  <button
                    type="button"
                    className={`option-button ${calcType === 'sum' ? 'selected' : ''}`}
                    onClick={() => setCalcType('sum')}
                  >
                    Страховой суммы
                  </button>
                </div>
              </div>

              {calcType && (
                <div className="form-group">
                  <label className="text-label" style={{ color: '#1f4e79' }}>Сумма (₽):</label>
                  <input
                    type="text"
                    className={`form-input ${amountError ? 'error' : ''}`}
                    placeholder={calcType === 'premium' ? 'Мин. 60 000' : 'Мин. 450 000'}
                    value={amountDisplay}
                    onChange={onAmountChange}
                  />
                  {amountError && <span className="form-error">{amountError}</span>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== Страница результатов (step 3) ===== */}
        {step === 3 && resultData && (
          <div className="card-container card-positioned scrollable snp-results animated">
            <div className="card-content">
              <h1 className="text-h1-dark text-center">Результаты расчёта</h1>
              <p className="text-body-dark text-center">Программа "Стратегия на пять. Гарант"</p>
              
              {/* Основные результаты */}
              <div className="result-items">
                <div className="result-item-split">
                  <span className="result-label-left">Ежегодный взнос:</span>
                  <span className="result-value-right">{Number(resultData.contribution || 0).toLocaleString('ru-RU')} ₽</span>
                </div>
                
                <div className="result-item-split">
                  <span className="result-label-left">Общая сумма взносов:</span>
                  <span className="result-value-right">{Number(resultData.totalContribution || 0).toLocaleString('ru-RU')} ₽</span>
                </div>
                
                <div className="result-item-split">
                  <span className="result-label-left">Процент начислений:</span>
                  <span className="result-value-right">{Math.round(Number(resultData.accrualPercent) * 100)}%</span>
                </div>
                
                <div className="result-item-split">
                  <span className="result-label-left">Ежегодные начисления:</span>
                  <span className="result-value-right">{Number(resultData.accrualAmount || 0).toLocaleString('ru-RU')} ₽</span>
                </div>
                
                <div className="result-item-split">
                  <span className="result-label-left">Общие начисления:</span>
                  <span className="result-value-right">{Number(resultData.totalAccrual || 0).toLocaleString('ru-RU')} ₽</span>
                </div>
                
                <div className="result-item-split highlight" style={{ marginTop: '20px', paddingTop: '20px', borderTop: '2px solid #e0e0e0' }}>
                  <span className="result-label-left">Итоговая сумма к получению:</span>
                  <span className="result-value-right">
                    {Number(resultData.finalTotal || 0).toLocaleString('ru-RU')} ₽
                  </span>
                </div>
              </div>

              {/* Кнопка "Отправить результаты на почту" */}
              <div className="form-group" style={{ marginTop: '30px' }}>
                <button 
                  className="btn-universal btn-primary btn-large btn-fullwidth"
                  onClick={() => setContactMode(true)}
                >
                  Связаться с менеджером
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== Форма "Связаться с менеджером" ===== */}
        {contactMode && resultData && (
          <div className="card-container card-positioned scrollable snp-results animated">
            <div className="card-content">
              <h1 className="text-h1-dark text-center">Введите ваши данные</h1>
              <p className="text-body-dark text-center">Результаты расчёта будут отправлены на вашу почту</p>
              
              <div className="form-group">
                <label className="text-label">Фамилия *</label>
                <input
                  type="text"
                  className="form-input"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Введите фамилию"
                />
              </div>

              <div className="form-group">
                <label className="text-label">Имя *</label>
                <input
                  type="text"
                  className="form-input"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Введите имя"
                />
              </div>

              <div className="form-group">
                <label className="text-label">Отчество</label>
                <input
                  type="text"
                  className="form-input"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  placeholder="Введите отчество (необязательно)"
                />
              </div>

              <div className="form-group">
                <label className="text-label">Город работы *</label>
                <input
                  type="text"
                  className="form-input"
                  value={workCity}
                  onChange={(e) => setWorkCity(e.target.value)}
                  placeholder="Введите город"
                />
              </div>

              <div className="form-group">
                <button 
                  className={`btn-universal btn-primary btn-large btn-fullwidth ${contactSending ? 'btn-loading' : ''}`}
                  onClick={handleSendToManager}
                  disabled={contactSending}
                >
                  {contactSending ? 'Отправка...' : 'Отправить результаты на почту'}
                </button>
              </div>

              <div className="form-group">
                <button 
                  className="btn-universal btn-secondary btn-large btn-fullwidth"
                  onClick={() => setContactMode(false)}
                  disabled={contactSending}
                >
                  Назад к результатам
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== Страница успешной отправки ===== */}
        {contactSent && (
          <div className="card-container card-positioned animated">
            <div className="success-container">
              <div className="success-icon">✅</div>
              <h2 className="text-h2-dark">Спасибо!</h2>
              <p className="text-body-dark text-center">
                {lastName} {firstName}, результаты расчета отправлены на вашу почту {email}!<br/>
                Отличного дня, коллега!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
















































































































