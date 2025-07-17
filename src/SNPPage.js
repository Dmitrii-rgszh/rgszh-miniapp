// src/SNPPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logoImage       from './components/logo.png';
import DateWheelPicker from './DateWheelPicker';

export default function SNPPage() {
  const navigate = useNavigate();

  // ===== Состояния =====
  const [step, setStep]                   = useState(1);
  const [email, setEmail]                 = useState('');
  const [emailError, setEmailError]       = useState('');
  const [birthDate, setBirthDate]         = useState(new Date());
  const [gender, setGender]               = useState(null);    // 'мужской' | 'женский' | null
  const [calcType, setCalcType]           = useState(null);    // 'premium' | 'sum' | null
  const [amountRaw, setAmountRaw]         = useState('');      // чистые цифры (например "60000")
  const [amountDisplay, setAmountDisplay] = useState('');      // с точками (например "60.000")
  const [amountError, setAmountError]     = useState('');
  const [isProcessing, setIsProcessing]   = useState(false);
  const [resultData, setResultData]       = useState(null);

  const [carouselIndex, setCarouselIndex] = useState(0);       // текущая страница карусели (0,1,2)
  const [contactMode, setContactMode]     = useState(false);   // показывать ли форму «Связаться с менеджером»
  const [contactSending, setContactSending] = useState(false);
  const [contactSent, setContactSent]     = useState(false);

  // Поля формы «Связаться с менеджером»
  const [lastName, setLastName]           = useState('');
  const [firstName, setFirstName]         = useState('');
  const [middleName, setMiddleName]       = useState('');
  const [workCity, setWorkCity]           = useState('');

  // Email валидность: ок, если заканчивается на "@vtb.ru"
  const emailValid = email.toLowerCase().endsWith('@vtb.ru');

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
    return (
      step === 2 &&
      getAge(birthDate) >= 18 &&
      gender &&
      calcType &&
      amountRaw &&
      isAmountValid()
    );
  }

  // ===== Обработчик: Шаг 1 → Шаг 2 =====
  function handleEmailNext() {
    if (!emailValid) {
      setEmailError('Используйте корпоративную почту домена @vtb.ru');
      return;
    }
    setEmailError('');
    // Сброс скрытых полей перед вторым шагом
    setGender(null);
    setCalcType(null);
    setAmountRaw('');
    setAmountDisplay('');
    setAmountError('');
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

  // ===== Обработчик: Шаг 2 → Отправка на сервер =====
  async function handleNext() {
    if (!canGoNext()) return;
    setIsProcessing(true);

    const dateStr = birthDate.toLocaleDateString('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
    const payload = {
      email,
      birthdate: dateStr,
      age:        getAge(birthDate),
      gender,
      payment:    calcType === 'premium' ? 'Страхового взноса' : 'Страховой суммы',
      sum:        parseInt(amountRaw, 10)
    };

    try {
      const res = await fetch('/api/proxy/snp/save', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload)
      });
      if (!res.ok) {
        console.error('Ошибка сервера', res.status, await res.text());
        alert(`Ошибка ${res.status}: смотрите консоль`);
      } else {
        const data = await res.json();
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
        setCarouselIndex(0);
      }
    } catch (err) {
      console.error('Ошибка запроса:', err);
      alert('Не удалось выполнить запрос');
    } finally {
      setIsProcessing(false);
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

    // Составляем тему и тело письма
    const fullName = `${lastName.trim()} ${firstName.trim()} ${middleName.trim()}`;
    const subject = `Заявка на полис "Стратегия на пять. Гарант" – ${fullName}`;
    const bodyLines = [
      'Добрый день, коллега!',
      '',
      'К Вам поступила заявка на рассмотрение возможности оформления полиса "Стратегия на пять. Гарант"',
      '',
      `ФИО сотрудника: ${fullName}`,
      `Пол: ${gender}`,
      `Дата рождения: ${birthDate.toLocaleDateString('ru-RU', { day:'2-digit', month:'2-digit', year:'numeric' })}`,
      `Возраст: ${getAge(birthDate)}`,
      `Почта сотрудника: ${email}`,
      `Город работы: ${workCity.trim()}`,
      '',
      `Размер взноса: ${amountDisplay} ₽`
    ];
    const body = bodyLines.join('\r\n');

    const payload = {
      subject,
      body
    };

    try {
      // Отправляем сначала на прокси, а затем на внутренний endpoint
      const res = await fetch('/api/proxy/snp/send_manager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        console.error('Ошибка сервера при отправке менеджеру:', res.status, await res.text());
        alert(`Ошибка при отправке запроса менеджеру: ${res.status}`);
        setContactSending(false);
      } else {
        setContactSending(false);
        setContactSent(true);
        // Через 4 секунды возвращаем на предыдущую страницу
        setTimeout(() => navigate(-1), 4000);
      }
    } catch (err) {
      console.error('Ошибка при запросе менеджеру:', err);
      alert('Не удалось отправить запрос менеджеру');
      setContactSending(false);
    }
  }

  // ===== Экран «Выполняется расчёт…» =====
  if (isProcessing) {
    return (
      <div className="processing-screen">
        <div className="logo-wrapper animate-logo">
          <img className="poll-logo" src={logoImage} alt="Логотип" />
        </div>
        <p className="processing-title">
          Выполняется расчёт по программе «Стратегия на пять. Гарант»
        </p>
        <div className="arrow-animation">→</div>
      </div>
    );
  }

  // ===== Экран «Отправляется запрос менеджеру…» =====
  if (contactSending) {
    return (
      <div className="processing-screen">
        <div className="logo-wrapper animate-logo">
          <img className="poll-logo" src={logoImage} alt="Логотип" />
        </div>
        <p className="processing-title">
          Отправляются параметры расчёта менеджеру...
        </p>
        <div className="arrow-animation">→</div>
      </div>
    );
  }

  // ===== Экран «Успех отправки менеджеру» =====
  if (contactSent) {
    const fullName = `${lastName.trim()} ${firstName.trim()} ${middleName.trim()}`;
    return (
      <div className="processing-screen">
        <div className="logo-wrapper animate-logo">
          <img className="poll-logo" src={logoImage} alt="Логотип" />
        </div>
        <p className="processing-title">
          {fullName}, наш эксперт свяжется с Вами в ближайшее время!<br/>Отличного дня, коллега!
        </p>
      </div>
    );
  }

  // ===== Если resultData есть — показываем карточку с результатами + карусель или форму контактов =====
  if (resultData) {
    // Сегодняшняя дата
    const todayStr = new Date().toLocaleDateString('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });

    const {
      gender:            resGender,
      payment:           resPayment,
      contribution,      // C13
      totalContribution, // C16
      accrualPercent,    // H12 (0.44)
      accrualAmount,     // H13
      totalAccrual,      // H16
      finalAnnual,       // M13
      finalTotal         // M16
    } = resultData;

    // Процент из 0.44 → 44
    const accrualPercentDisplay = Math.round(Number(accrualPercent) * 100);

    // Форматтер «100000» → «100 000»
    function fmt(number) {
      return Number(number).toLocaleString('ru-RU', { minimumFractionDigits: 0 });
    }

    // ===== Если contactMode=true, показываем форму «Введите Ваши данные» =====
    if (contactMode) {
      return (
        <div className="snp-container">
          <div className="polls-header">
            <button className="back-btn" onClick={goHome}>
              <svg viewBox="0 0 24 24">
                <path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1V11z" />
              </svg>
            </button>
            <div className="logo-wrapper animate-logo">
              <img className="poll-logo" src={logoImage} alt="Логотип" />
            </div>
            <button
              className="forward-btn"
              onClick={() => setContactMode(false)}
            >
              <span className="arrow-icon">←</span>
            </button>
          </div>

          <div className="content-wrapper">
            <h2 className="contact-title">
              Введите Ваши данные:
            </h2>
            <div className="contact-form">
              <label>Фамилия:</label>
              <input
                type="text"
                placeholder="Введите фамилию"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
              />

              <label>Имя:</label>
              <input
                type="text"
                placeholder="Введите имя"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
              />

              <label>Отчество:</label>
              <input
                type="text"
                placeholder="Введите отчество"
                value={middleName}
                onChange={e => setMiddleName(e.target.value)}
              />

              <label>Город работы:</label>
              <input
                type="text"
                placeholder="Введите город"
                value={workCity}
                onChange={e => setWorkCity(e.target.value)}
              />
            </div>

            <button
              className="contact-btn"
              onClick={handleSendToManager}
            >
              Отправить запрос
            </button>
          </div>
        </div>
      );
    }

    // ===== Иначе (contactMode=false) — показываем результаты + карусель =====
    return (
      <div className="snp-container">
        <div className="polls-header">
          <button className="back-btn" onClick={goHome}>
            <svg viewBox="0 0 24 24">
              <path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1V11z" />
            </svg>
          </button>
          <div className="logo-wrapper animate-logo">
            <img className="poll-logo" src={logoImage} alt="Логотип" />
          </div>
          <button
            className="repeat-btn"
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
            Расчёт по программе «Стратегия на пять. Гарант»
          </h1>

          <div className="params-container">
            <h2>Параметры</h2>
            <p>Дата расчёта: {todayStr}</p>
            <p>Возраст: {getAge(birthDate)} лет</p>
            <p>Пол: {resGender}</p>
            <p>Расчёт от: {resPayment}</p>
          </div>

          {/* ==== КАРУСЕЛЬ ==== */}
          <div className="carousel-container">
            {/* Индикаторы */}
            <div className="carousel-indicators">
              <span className={carouselIndex === 0 ? 'active' : ''}></span>
              <span className={carouselIndex === 1 ? 'active' : ''}></span>
              <span className={carouselIndex === 2 ? 'active' : ''}></span>
            </div>

            {/* Обрезающее окно */}
            <div className="carousel-clipper">
              <div
                className="carousel-wrapper"
                style={{ transform: `translateX(-${carouselIndex * 100}%)` }}
              >
                {/* Страница 1 */}
                <div className="carousel-page">
                  <div className="first-line">В течение 5 лет</div>
                  <div className="unit">Вы вносите средства в программу</div>
                  <div className="value">{fmt(contribution)} ₽</div>
                  <div className="unit">Ежегодно</div>
                  <div className="value">{fmt(totalContribution)} ₽</div>
                  <div className="footer-label">Сумма ваших взносов</div>
                </div>

                {/* Страница 2 */}
                <div className="carousel-page">
                  <div className="first-line">Начисляем дополнительно</div>
                  <div className="unit">{accrualPercentDisplay}% от каждого взноса</div>
                  <div className="value">{fmt(accrualAmount)} ₽</div>
                  <div className="unit">Ежегодно</div>
                  <div className="value">{fmt(totalAccrual)} ₽</div>
                  <div className="footer-label">Общая сумма начислений</div>
                </div>

                {/* Страница 3 */}
                <div className="carousel-page">
                  <div className="first-line">Итоговая годовая выплата</div>
                  <div className="unit">Сумма с начислениями</div>
                  <div className="value">{fmt(finalAnnual)} ₽</div>
                  <div className="unit">Сумма за 5 лет</div>
                  <div className="value">{fmt(finalTotal)} ₽</div>
                  <div className="footer-label">Ваш капитал через 5 лет</div>
                </div>
              </div>
            </div>

            {/* Кнопки навигации карусели */}
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
          {/* ==== конец КАРУСЕЛИ ==== */}

          {/* Кнопка «Связаться с менеджером» */}
          <button
            className="contact-btn"
            onClick={() => setContactMode(true)}
          >
            Связаться с менеджером
          </button>
        </div>
      </div>
    );
  }

  // ===== ОСНОВНОЙ UI (Шаг 1 и Шаг 2) =====
  return (
    <div className="snp-container">
      <div className="polls-header">
        <button className="back-btn" onClick={goHome}>
          <svg viewBox="0 0 24 24">
            <path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1V11z" />
          </svg>
        </button>
        <div className="logo-wrapper animate-logo">
          <img className="poll-logo" src={logoImage} alt="Логотип" />
        </div>
        <button
          className="forward-btn"
          onClick={step === 1 ? handleEmailNext : handleNext}
          disabled={step === 1 ? !emailValid : !canGoNext()}
        >
          <span className="arrow-icon">→</span>
        </button>
      </div>

      <div className="content-wrapper">
        {/* ===== Шаг 1: Ввод корпоративной почты ===== */}
        {step === 1 && (
          <>
            <div className="email-step">
              <label className="email-label">Корпоративная почта ВТБ:</label>
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck="false"
                placeholder="example@vtb.ru"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            {emailError && <div className="input-error">{emailError}</div>}

            <button
              className="polls-btn btn1"
              onClick={handleEmailNext}
              disabled={!emailValid}
            >
              Продолжить
            </button>
          </>
        )}

        {/* ===== Шаг 2: Ввод данных пользователя ===== */}
        {step === 2 && (
          <>
            <h1 className="polls-title">
              Расчёт по программе «Стратегия на пять. Гарант»
            </h1>

            <div className="date-section">
              <label className="section-label">Дата рождения:</label>
              <DateWheelPicker
                value={birthDate}
                onChange={val => {
                  if (val instanceof Date) {
                    setBirthDate(val);
                  } else if (val?.day) {
                    setBirthDate(new Date(val.year, val.month - 1, val.day));
                  }
                }}
              />
            </div>

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

            <div className="section-subtitle">Расчёт от…</div>
            <div className="insurance-options">
              <button
                className={`insurance-btn ${calcType === 'premium' ? 'selected' : ''}`}
                onClick={() => setCalcType('premium')}
              >
                <div>Страхового</div>
                <div>взноса</div>
              </button>
              <button
                className={`insurance-btn ${calcType === 'sum' ? 'selected' : ''}`}
                onClick={() => setCalcType('sum')}
              >
                <div>Страховой</div>
                <div>суммы</div>
              </button>
            </div>

            {calcType && (
              <>
                <div className="section-subtitle">Сумма (₽):</div>
                <div className="sum-section">
                  <input
                    type="text"
                    placeholder={calcType === 'premium' ? 'Мин. 60 000' : 'Мин. 450 000'}
                    value={amountDisplay}
                    onChange={onAmountChange}
                  />
                </div>
                {amountError && <div className="input-error">{amountError}</div>}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
















































































































