// src/CareFuturePage.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import logoImage       from './components/logo.png';
import backgroundImage from './components/background.png';
import DateWheelPicker from './DateWheelPicker';

export default function CareFuturePage() {
  const navigate = useNavigate();

  // Стадии: 'email' → 'form' → 'processing' → 'result' → 'manager' → 'manager-sent'
  const [stage, setStage] = useState('email');

  // ===== Состояния для Email-шага =====
  const [email, setEmail]         = useState('');
  const [emailError, setEmailError] = useState('');
  const emailValid = email.toLowerCase().endsWith('@vtb.ru');

  // ===== Состояния для формы расчёта =====
  const [birthParts, setBirthParts] = useState({
    day: null,
    month: null,
    year: null
  });
  const [birthDate, setBirthDate]   = useState(null);
  const [gender, setGender]         = useState(null);         // 'мужской' | 'женский'
  const [programTerm, setProgramTerm] = useState(5);           // срок программы в годах (5–20)
  const [calcType, setCalcType]     = useState(null);         // 'premium' | 'sum'
  const [amountRaw, setAmountRaw]   = useState('');           // «100000»
  const [amountDisplay, setAmountDisplay] = useState('');     // «100.000»
  const [amountError, setAmountError]     = useState('');

  // ===== Состояния Processing/Result =====
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultData, setResultData]     = useState(null);
  const [carouselIndex, setCarouselIndex] = useState(0);

  // ===== Состояния для «Связаться с менеджером» =====
  const [mgrSurname, setMgrSurname]    = useState('');
  const [mgrName, setMgrName]          = useState('');
  const [mgrCity, setMgrCity]          = useState('');
  const [mgrError, setMgrError]        = useState('');
  const [isSendingMgr, setIsSendingMgr]  = useState(false);
  const [mgrSent, setMgrSent]            = useState(false);

  // ===== HELPERS =====

  // Собираем Date-объект из birthParts
  useEffect(() => {
    const { day, month, year } = birthParts;
    if (day && month && year) {
      const d = Number(day), m = Number(month), y = Number(year);
      const dt = new Date(y, m - 1, d);
      if (
        !isNaN(dt.getTime()) &&
        dt.getDate() === d &&
        dt.getMonth() + 1 === m &&
        dt.getFullYear() === y
      ) {
        setBirthDate(dt);
      } else {
        setBirthDate(null);
      }
    } else {
      setBirthDate(null);
    }
  }, [birthParts]);

  // Вычисление возраста по дате рождения
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

  // Формат суммы: «100000» → «100.000»
  function formatSum(rawString) {
    const digits = rawString.replace(/\D/g, '');
    if (!digits) return '';
    let s = digits, out = '';
    while (s.length > 3) {
      out = '.' + s.slice(-3) + out;
      s = s.slice(0, -3);
    }
    return s + out;
  }

  // Валидация формы «form»
  function canGoNextForm() {
    if (!birthDate) return false;
    if (!gender) return false;
    if (!calcType) return false;
    if (!amountRaw) return false;
    if (amountError) return false;

    const age = getAge(birthDate);
    if (age < 18) return false;
    if (age + programTerm > 70) return false;
    return true;
  }

  // ===== Обработчики =====

  // Шаг «email» → «form»
  function handleEmailNext() {
    if (!emailValid) {
      setEmailError('Используйте корпоративную почту домена @vtb.ru');
      return;
    }
    setEmailError('');
    setStage('form');
  }

  // Изменение суммы: форматируем с «точками»
  function handleAmountChange(e) {
    const raw = e.target.value.replace(/\D/g, '');
    setAmountRaw(raw);
    const disp = formatSum(raw);
    setAmountDisplay(disp);

    const num = parseInt(raw, 10) || 0;
    if (num < 100000) {
      setAmountError('Введите сумму от 100 000 ₽');
    } else {
      setAmountError('');
    }
  }

  // Шаг «form» → отправка расчёта на сервер
  async function handleFormNext() {
    if (!canGoNextForm()) return;

    const dateRu = birthDate.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const payload = {
      email,
      birthdate: dateRu,
      age:        getAge(birthDate),
      gender,
      term:       programTerm,
      payment:    calcType === 'premium' ? 'Страхового взноса' : 'Страховой суммы',
      sum:        parseInt(amountRaw, 10)
    };

    setIsProcessing(true);
    setStage('processing');

    try {
      const res = await fetch('/api/proxy/carefuture/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        console.error('Ошибка расчёта:', res.status, await res.text());
        alert(`Ошибка расчёта: ${res.status}`);
        setIsProcessing(false);
        setStage('form');
        return;
      }

      const data = await res.json();
      /*
        Ожидаем, что в data будут поля:
          {
            contribution: <годовой взнос пользователя>,
            totalContribution: <годовой взнос * term>,
            accrualPercent: <H12>,
            accrualAmount: <H13>,
            totalAccrual: <H16>,
            finalAnnual: <M13>,
            finalTotal: <M16>,
            accumulation: <G13>,
            totalDeduction: <C22 в рублях>,
            delayedPayment: <G14 в рублях>
          }
      */
      setResultData(data);
      setCarouselIndex(0);
      setIsProcessing(false);
      setStage('result');
    } catch (err) {
      console.error('Ошибка сети при расчёте:', err);
      alert('Не удалось выполнить расчёт');
      setIsProcessing(false);
      setStage('form');
    }
  }

  // Шаг «Отправка менеджеру»
  async function handleManagerSubmit() {
    if (!mgrSurname.trim() || !mgrName.trim() || !mgrCity.trim()) {
      setMgrError('Заполните, пожалуйста, все поля');
      return;
    }
    setMgrError('');
    setIsSendingMgr(true);

    const fullName = `${mgrSurname.trim()} ${mgrName.trim()}`;
    const subject = `Заявка на полис "Забота о будущем" - ${fullName}`;
    const bodyLines = [
      'Добрый день, коллега!',
      '',
      'К Вам поступила заявка на полис "Забота о будущем".',
      '',
      `ФИО сотрудника: ${fullName}`,
      `Пол: ${gender}`,
      `Дата рождения: ${birthDate.toLocaleDateString('ru-RU', { day:'2-digit', month:'2-digit', year:'numeric' })}`,
      `Возраст: ${getAge(birthDate)}`,
      `Почта сотрудника: ${email}`,
      `Город работы: ${mgrCity.trim()}`,
      '',
      `Срок программы: ${programTerm} лет`,
      `Сумма взноса: ${formatSum(String(resultData.contribution))} ₽`,
      `Периодичность оплаты: ежегодно`
    ];
    const body = bodyLines.join('\r\n');

    const payload = { subject, body };

    try {
      const res = await fetch('/api/proxy/carefuture/send_manager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        console.error('Ошибка отправки менеджеру:', res.status, await res.text());
        setMgrError(`Ошибка отправки: ${res.status}`);
        setIsSendingMgr(false);
      } else {
        setIsSendingMgr(false);
        setMgrSent(true);
        setStage('manager-sent');
        // Через 4 секунды перенаправляем на главное меню
        setTimeout(() => navigate('/'), 4000);
      }
    } catch (err) {
      console.error('Ошибка сети при отправке менеджеру:', err);
      setMgrError('Не удалось отправить запрос менеджеру');
      setIsSendingMgr(false);
    }
  }

  // ===== Рендер разных экранов =====

  // --- «Выполняется расчёт…» (processing) ---
  if (stage === 'processing') {
    return (
      <div
        className="processing-screen"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        <div className="logo-wrapper animate-logo">
          <img className="poll-logo" src={logoImage} alt="Логотип" />
        </div>
        <p className="processing-title">Выполняется расчёт…</p>
        <div className="arrow-animation">→</div>
      </div>
    );
  }

  // --- «Успешная отправка менеджеру» (manager-sent) ---
  if (stage === 'manager-sent' && mgrSent) {
    const fullName = `${mgrSurname.trim()} ${mgrName.trim()}`;
    return (
      <div
        className="processing-screen"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        <div className="logo-wrapper animate-logo">
          <img className="poll-logo" src={logoImage} alt="Логотип" />
        </div>
        <p className="processing-title">
          {fullName}, наш эксперт свяжется с Вами в ближайшее время!<br />
          Отличного дня, коллега!
        </p>
      </div>
    );
  }

  // --- «Результаты расчёта» (result) ---
  if (stage === 'result' && resultData) {
    return (
      <div
        className="snp-container"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        <div className="polls-header">
          {/* Кнопка «Домой» */}
          <button className="back-btn" onClick={() => navigate('/')}>
            <svg viewBox="0 0 24 24">
              <path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1V11z" />
            </svg>
          </button>

          <div className="logo-wrapper animate-logo">
            <img className="poll-logo" src={logoImage} alt="Логотип" />
          </div>

          {/* Кнопка «Повторить расчёт» (сброс к форме) */}
          <button
            className="repeat-btn"
            onClick={() => {
              setStage('form');
              setResultData(null);
              setGender(null);
              setCalcType(null);
              setAmountRaw('');
              setAmountDisplay('');
              setAmountError('');
            }}
          >
            <svg viewBox="0 0 24 24">
              <path
                d="M12 4V1L8 5l4 4V6
                   c4.41 0 8 3.59 8 8
                   s-3.59 8-8 8-8-3.59-8-8h2
                   c0 3.31 2.69 6 6 6s6-2.69 6-6
                   -2.69-6-6-6v3l-4-4 4-4z"
                fill="#fff"
              />
            </svg>
          </button>
        </div>

        <div className="content-wrapper">
          <h1 className="polls-title">
            Результаты расчёта по программе "Забота о будущем"
          </h1>

          {/* Блок «Параметры» */}
          <div className="params-container">
            <h2>Параметры</h2>
            <p>Возраст: {getAge(birthDate)} лет</p>
            <p>Пол: {gender}</p>
            <p>Срок: {programTerm} лет</p>
            <p>Периодичность оплаты: ежегодно</p>
          </div>

          {/* КАРУСЕЛЬ */}
          <div className="carousel-container">
            {/* Индикаторы (три точки) */}
            <div className="carousel-indicators">
              <span className={carouselIndex === 0 ? 'active' : ''}></span>
              <span className={carouselIndex === 1 ? 'active' : ''}></span>
              <span className={carouselIndex === 2 ? 'active' : ''}></span>
            </div>

            {/* «Обрезающее окно» */}
            <div className="carousel-clipper">
              <div
                className="carousel-wrapper"
                style={{ transform: `translateX(-${carouselIndex * 100}%)` }}
              >
                {/* 1-я страница: «Сумма Ваших взносов» */}
                <div className="carousel-page">
                  <div className="first-line">
                    В течение {programTerm} лет
                  </div>
                  <div className="unit">Вы вносите средства</div>
                  <div className="value">
                    {formatSum(String(resultData.contribution))} ₽
                  </div>
                  <div className="unit">Ежегодно</div>
                  <div className="value">
                    {formatSum(String(resultData.totalContribution))} ₽
                  </div>
                  <div className="footer-label">Сумма ваших взносов</div>
                </div>

                {/* 2-я страница: «Вы накопите» */}
                <div className="carousel-page">
                  <div className="first-line">Вы накопите</div>
                  <div className="unit">с учётом фиксированного дохода</div>
                  <div className="value">
                    {formatSum(String(resultData.accumulation))} ₽
                  </div>
                  <div className="unit">сумма вычета за весь срок</div>
                  <div className="value">
                    {formatSum(String(resultData.totalDeduction))} ₽
                  </div>
                  <div className="footer-label"></div>
                </div>

                {/* 3-я страница: «Финансовая защита» */}
                <div className="carousel-page">
                  <div className="first-line">Финансовая защита</div>
                  <div className="unit">
                    Уход из жизни (любая причина) – отложенная выплата
                  </div>
                  <div className="value">
                    {formatSum(String(resultData.delayedPayment))} ₽
                  </div>
                  <div className="unit">
                    Уход из жизни (любая причина) – единовременная выплата
                  </div>
                  <div className="value">100% совершенных взносов</div>
                  <div className="footer-label"></div>
                </div>

                {/* 4-я страница: «Финансовая защита» */}
                <div className="carousel-page">
                  <div className="first-line">Финансовая защита</div>
                  <div className="unit">
                    Установление инвалидности I,II группы по любой причине
                  </div>
                  <div className="value">
                    {formatSum(String(resultData.delayedPayment))} ₽
                  </div>
                  <div className="unit">
                    Уход из жизни (любая причина) – единовременная выплата
                  </div>
                  <div className="value">100% совершенных взносов</div>
                  <div className="footer-label"></div>
                </div>
              </div>
            </div>

            {/* Кнопки перехода карусели */}
            <button
              className="carousel-control prev"
              onClick={() => setCarouselIndex(idx => idx - 1)}
              disabled={carouselIndex === 0}
            >
              ‹
            </button>
            <button
              className="carousel-control next"
              onClick={() => setCarouselIndex(idx => idx + 1)}
              disabled={carouselIndex === 2}
            >
              ›
            </button>
          </div>

          {/* Кнопка «Связаться с менеджером» */}
          <button
            className="contact-btn"
            onClick={() => setStage('manager')}
          >
            Связаться с менеджером
          </button>
        </div>
      </div>
    );
  }

  // --- Экран «Email» (stage='email') ---
  if (stage === 'email') {
    return (
      <div
        className="snp-container"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        <div className="polls-header">
          {/* Домой */}
          <button className="back-btn" onClick={() => navigate('/')}>
            <svg viewBox="0 0 24 24">
              <path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1V11z" />
            </svg>
          </button>
          {/* Логотип */}
          <div className="logo-wrapper animate-logo">
            <img className="poll-logo" src={logoImage} alt="Логотип" />
          </div>
          {/* Кнопка «Далее» (активна при валидном email) */}
          <button
            className="forward-btn"
            onClick={handleEmailNext}
            disabled={!emailValid}
          >
            <span className="arrow-icon">→</span>
          </button>
        </div>

        <div className="content-wrapper">
          <h1 className="polls-title">Забота о будущнем</h1>
          <div className="email-step">
            <label className="email-label">Корпоративная почта ВТБ:</label>
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck="false"
              placeholder="name@vtb.ru"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          {emailError && <div className="input-error">{emailError}</div>}

          <button
            className="polls-btn"
            onClick={handleEmailNext}
            disabled={!emailValid}
          >
            Продолжить
          </button>
        </div>
      </div>
    );
  }

  // --- Экран «Form» (stage='form') ---
  if (stage === 'form') {
    return (
      <div
        className="snp-container"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        <div className="polls-header">
          {/* Кнопка «Назад» (возвращает на email) */}
          <button className="back-btn" onClick={() => setStage('email')}>
            <svg viewBox="0 0 24 24">
              <path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1V11z" />
            </svg>
          </button>
          {/* Логотип */}
          <div className="logo-wrapper animate-logo">
            <img className="poll-logo" src={logoImage} alt="Логотип" />
          </div>
          {/* Кнопка «Далее» отображается, если форма заполнена корректно */}
          <button
            className="forward-btn"
            onClick={handleFormNext}
            disabled={!canGoNextForm()}
          >
            <span className="arrow-icon">→</span>
          </button>
        </div>

        <div className="content-wrapper">
          <h1 className="polls-title">Забота о будущем</h1>

          {/* Выбор даты рождения */}
          <div className="date-section">
            <label className="section-label">Дата рождения:</label>
            <DateWheelPicker
              value={birthParts}
              onChange={val => {
                if (val instanceof Date) {
                  setBirthParts({
                    day: String(val.getDate()).padStart(2, '0'),
                    month: String(val.getMonth() + 1).padStart(2, '0'),
                    year: String(val.getFullYear())
                  });
                } else if (typeof val === 'object') {
                  setBirthParts(prev => ({
                    ...prev,
                    ...(val.day   != null ? { day: String(val.day).padStart(2, '0') } : {}),
                    ...(val.month != null ? { month: String(val.month).padStart(2, '0') } : {}),
                    ...(val.year  != null ? { year: String(val.year) }                   : {})
                  }));
                }
              }}
            />
          </div>

          {/* Выбор срока программы */}
          <div className="date-section">
            <label className="section-label">Срок программы (лет):</label>
            <select
              className="date-picker-select"
              value={programTerm}
              onChange={e => setProgramTerm(Number(e.target.value))}
            >
              {Array.from({ length: 16 }, (_, i) => 5 + i).map(v => (
                <option key={v} value={v}>
                  {v} лет
                </option>
              ))}
            </select>
          </div>

          {/* Выбор пола */}
          <div className="section-subtitle">Выберите пол:</div>
          <div className="gender-section">
            <button
              className={`insurance-btn ${gender === 'мужской' ? 'selected' : ''}`}
              onClick={() => setGender('мужской')}
            >
              <div>Мужской</div>
              <div className="emoji">👨</div>
            </button>
            <button
              className={`insurance-btn ${gender === 'женский' ? 'selected' : ''}`}
              onClick={() => setGender('женский')}
            >
              <div>Женский</div>
              <div className="emoji">👩</div>
            </button>
          </div>

          {/* Выбор, от чего расчёт */}
          <div className="section-subtitle">Расчёт от…</div>
          <div className="insurance-options">
            <button
              className={`insurance-btn ${calcType === 'premium' ? 'selected' : ''}`}
              onClick={() => {
                setCalcType('premium');
                setAmountRaw('');
                setAmountDisplay('');
                setAmountError('');
              }}
            >
              <div>Страхового</div>
              <div>взноса</div>
            </button>
            <button
              className={`insurance-btn ${calcType === 'sum' ? 'selected' : ''}`}
              onClick={() => {
                setCalcType('sum');
                setAmountRaw('');
                setAmountDisplay('');
                setAmountError('');
              }}
            >
              <div>Страховой</div>
              <div>суммы</div>
            </button>
          </div>

          {/* Поле ввода суммы (активно, если calcType != null) */}
          {calcType && (
            <>
              <div className="section-subtitle">Введите сумму в рублях:</div>
              <div className="sum-section">
                <input
                  type="text"
                  placeholder="Мин. 100 000"
                  value={amountDisplay}
                  onChange={handleAmountChange}
                />
              </div>
              {amountError && <div className="input-error">{amountError}</div>}
            </>
          )}
        </div>
      </div>
    );
  }

  // --- Экран «Связаться с менеджером» (stage='manager') ---
  if (stage === 'manager') {
    return (
      <div
        className="snp-container"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        <div className="polls-header">
          {/* Кнопка «Назад» (возвращает на результат) */}
          <button className="back-btn" onClick={() => setStage('result')}>
            <svg viewBox="0 0 24 24">
              <path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1V11z" />
            </svg>
          </button>
          {/* Логотип */}
          <div className="logo-wrapper animate-logo">
            <img className="poll-logo" src={logoImage} alt="Логотип" />
          </div>
        </div>

        <div className="content-wrapper">
          <h2 className="contact-title">Введите Ваши данные:</h2>

          <div className="contact-form">
            <label>Фамилия:</label>
            <input
              type="text"
              placeholder="Введите фамилию"
              value={mgrSurname}
              onChange={e => setMgrSurname(e.target.value)}
            />

            <label>Имя:</label>
            <input
              type="text"
              placeholder="Введите имя"
              value={mgrName}
              onChange={e => setMgrName(e.target.value)}
            />

            <label>Город работы:</label>
            <input
              type="text"
              placeholder="Введите город"
              value={mgrCity}
              onChange={e => setMgrCity(e.target.value)}
            />
          </div>
          {mgrError && <div className="input-error">{mgrError}</div>}

          <button
            className="contact-btn"
            onClick={handleManagerSubmit}
            disabled={isSendingMgr}
          >
            Отправить запрос
          </button>
        </div>
      </div>
    );
  }

  // Если ни одна стадия не подошла — null
  return null;
}













































