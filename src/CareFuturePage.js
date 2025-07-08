// src/CareFuturePage.js - Приведенная к стилю MainMenu

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// Импортируем стили в правильном порядке
import './Styles/global.css';
import './Styles/background.css';
import './Styles/logo.css';
import './Styles/Buttons.css';
import './Styles/NextButton.css';  // Базовые стили для кнопки "Продолжить"
import './Styles/BackButton.css';  // Базовые стили для кнопки "Назад"
import './CareFuturePage.css';     // Наши дополнительные стили (должен быть последним!)

import logoImage from './components/logo.png';
import backgroundImage from './components/background.png';
import piImage from './components/pi.png';
import DateWheelPicker from './DateWheelPicker';

export default function CareFuturePage() {
  const navigate = useNavigate();
  
  // Стейт для анимаций
  const [logoAnimated, setLogoAnimated] = useState(false);
  const [buttonsAnimated, setButtonsAnimated] = useState(false);
  const [moveDuration, setMoveDuration] = useState('70s');
  const [rotateDuration, setRotateDuration] = useState('6s');

  // Стадии: 'email' → 'form' → 'processing' → 'result' → 'manager' → 'manager-sent'
  const [stage, setStage] = useState('email');

  // ===== Состояния для Email-шага =====
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const emailValid = email.toLowerCase().endsWith('@vtb.ru');

  // ===== Состояния для формы расчёта =====
  const [birthParts, setBirthParts] = useState({
    day: null,
    month: null,
    year: null
  });
  const [birthDate, setBirthDate] = useState(null);
  const [gender, setGender] = useState(null);
  const [programTerm, setProgramTerm] = useState(5);
  const [calcType, setCalcType] = useState(null);
  const [amountRaw, setAmountRaw] = useState('');
  const [amountDisplay, setAmountDisplay] = useState('');
  const [amountError, setAmountError] = useState('');

  // ===== Состояния Processing/Result =====
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [carouselIndex, setCarouselIndex] = useState(0);

  // ===== Состояния для «Связаться с менеджером» =====
  const [mgrSurname, setMgrSurname] = useState('');
  const [mgrName, setMgrName] = useState('');
  const [mgrCity, setMgrCity] = useState('');
  const [mgrError, setMgrError] = useState('');
  const [isSendingMgr, setIsSendingMgr] = useState(false);
  const [mgrSent, setMgrSent] = useState(false);

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
    if (!d) return 0;
    const today = new Date();
    const diff = today.getTime() - d.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  }

  // Форматирование суммы с пробелами
  function formatSum(str) {
    return str.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  // Инициализация анимаций
  useEffect(() => {
    const logoTimer = setTimeout(() => setLogoAnimated(true), 100);
    const btnTimer = setTimeout(() => setButtonsAnimated(true), 900);

    const rndMove = Math.random() * (90 - 50) + 50;
    const rndRot = Math.random() * (8 - 4) + 4;
    setMoveDuration(`${rndMove.toFixed(2)}s`);
    setRotateDuration(`${rndRot.toFixed(2)}s`);

    return () => {
      clearTimeout(logoTimer);
      clearTimeout(btnTimer);
    };
  }, []);

  // Обработчик клика для кнопок с ripple эффектом
  const handleButtonClick = (e, callback) => {
    const btn = e.currentTarget;
    
    // Создаем ripple эффект
    const circle = document.createElement('span');
    const diameter = Math.max(btn.clientWidth, btn.clientHeight);
    const radius = diameter / 2;
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${e.clientX - btn.offsetLeft - radius}px`;
    circle.style.top = `${e.clientY - btn.offsetTop - radius}px`;
    circle.classList.add('ripple');
    const oldRipple = btn.getElementsByClassName('ripple')[0];
    if (oldRipple) oldRipple.remove();
    btn.appendChild(circle);

    // Выполняем callback через небольшую задержку
    setTimeout(callback, 150);
  };

  // Логика для email валидации
  const handleEmailSubmit = () => {
    if (!emailValid) {
      setEmailError('Введите корректный email с доменом @vtb.ru');
      return;
    }
    setEmailError('');
    setStage('form');
  };

  // Обработчик возврата домой
  const handleHomeClick = () => {
    navigate('/employee');
  };

  // Логика расчета (упрощенная)
  const handleCalculate = async () => {
    if (!birthDate || !gender || !calcType || !amountRaw) {
      setAmountError('Заполните все поля');
      return;
    }

    setIsProcessing(true);
    setStage('processing');

    // Имитация расчета
    await new Promise(resolve => setTimeout(resolve, 2000));

    const amount = parseInt(amountRaw.replace(/\s/g, ''));
    const age = getAge(birthDate);

    // Простой расчет (в реальности будет API)
    const contribution = calcType === 'premium' ? amount : Math.floor(amount * 0.1);
    const totalContribution = contribution * programTerm;
    const accumulation = Math.floor(totalContribution * 1.3);
    const totalDeduction = Math.floor(totalContribution * 0.13);
    const delayedPayment = Math.floor(amount * 1.5);

    setResultData({
      contribution,
      totalContribution,
      accumulation,
      totalDeduction,
      delayedPayment
    });

    setIsProcessing(false);
    setStage('result');
  };

  // Отправка запроса менеджеру
  const handleManagerRequest = async () => {
    if (!mgrSurname || !mgrName || !mgrCity) {
      setMgrError('Заполните все поля');
      return;
    }

    setIsSendingMgr(true);
    
    // Имитация отправки
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSendingMgr(false);
    setMgrSent(true);
    setStage('manager-sent');
  };

  const logoClass = logoAnimated ? 'logo-wrapper animate-logo' : 'logo-wrapper';

  // --- Экран ввода email ---
  if (stage === 'email') {
    return (
      <div className="mainmenu-container" style={{ backgroundImage: `url(${backgroundImage})` }}>
        {/* Фоновые элементы */}
        {[1,2,3,4,5,6,7,8,9,10].map(n =>
          <div key={n} className={`subtle-dot dot-${n}`} />
        )}
        
        <div className="pi-wrapper" style={{ '--pi-move-duration': moveDuration }}>
          <img src={piImage} className="pi-fly" alt="Pi" style={{ '--pi-rotate-duration': rotateDuration }} />
        </div>

        <div className="mainmenu-overlay" />

        {/* Логотип */}
        <div className={logoClass}>
          <img src={logoImage} alt="Логотип РГС Жизнь" className="logo-image" />
        </div>

        {/* Заголовок */}
        <h2 className="page-title">Забота о будущем</h2>

        {/* Форма email */}
        <div className="form-container">
          <div className="email-section">
            <label className="section-label">Введите ваш корпоративный email:</label>
            <input
              type="email"
              className="form-input"
              placeholder="example@vtb.ru"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            {emailError && <div className="error-message">{emailError}</div>}
          </div>

          <div className="button-container">
            <button
              className={`next-btn ${buttonsAnimated ? 'animate-next' : ''}`}
              onClick={(e) => handleButtonClick(e, handleEmailSubmit)}
              disabled={!email}
            >
              <div className="shaker">
                <svg viewBox="0 0 24 24">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </button>
            <button
              className={`back-btn ${buttonsAnimated ? 'animate-home' : ''}`}
              onClick={(e) => handleButtonClick(e, handleHomeClick)}
            >
              <svg className="home-icon" viewBox="0 0 24 24">
                <path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1V11z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Форма расчета ---
  if (stage === 'form') {
    return (
      <div className="mainmenu-container" style={{ backgroundImage: `url(${backgroundImage})` }}>
        {/* Фоновые элементы */}
        {[1,2,3,4,5,6,7,8,9,10].map(n =>
          <div key={n} className={`subtle-dot dot-${n}`} />
        )}
        
        <div className="pi-wrapper" style={{ '--pi-move-duration': moveDuration }}>
          <img src={piImage} className="pi-fly" alt="Pi" style={{ '--pi-rotate-duration': rotateDuration }} />
        </div>

        <div className="mainmenu-overlay" />

        {/* Логотип */}
        <div className={logoClass}>
          <img src={logoImage} alt="Логотип РГС Жизнь" className="logo-image" />
        </div>

        {/* Заголовок */}
        <h2 className="page-title">Расчет программы</h2>

        {/* Форма */}
        <div className="form-container">
          {/* Дата рождения */}
          <div className="date-section">
            <label className="section-label">Дата рождения:</label>
            <DateWheelPicker
              value={birthParts}
              onChange={(val) => {
                setBirthParts(prev => ({
                  ...prev,
                  ...(val.day != null ? { day: String(val.day).padStart(2, '0') } : {}),
                  ...(val.month != null ? { month: String(val.month).padStart(2, '0') } : {}),
                  ...(val.year != null ? { year: String(val.year) } : {})
                }));
              }}
            />
          </div>

          {/* Срок программы */}
          <div className="date-section">
            <label className="section-label">Срок программы (лет):</label>
            <select
              className="form-select"
              value={programTerm}
              onChange={e => setProgramTerm(Number(e.target.value))}
            >
              {Array.from({ length: 16 }, (_, i) => 5 + i).map(v => (
                <option key={v} value={v}>{v} лет</option>
              ))}
            </select>
          </div>

          {/* Выбор пола */}
          <div className="gender-section">
            <div className="section-subtitle">Выберите пол:</div>
            <div className="option-buttons">
              <button
                className={`option-btn ${gender === 'мужской' ? 'selected' : ''}`}
                onClick={() => setGender('мужской')}
              >
                <div>Мужской</div>
                <div className="emoji">👨</div>
              </button>
              <button
                className={`option-btn ${gender === 'женский' ? 'selected' : ''}`}
                onClick={() => setGender('женский')}
              >
                <div>Женский</div>
                <div className="emoji">👩</div>
              </button>
            </div>
          </div>

          {/* Тип расчета */}
          <div className="calc-section">
            <div className="section-subtitle">Расчёт от:</div>
            <div className="option-buttons">
              <button
                className={`option-btn ${calcType === 'premium' ? 'selected' : ''}`}
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
                className={`option-btn ${calcType === 'sum' ? 'selected' : ''}`}
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
          </div>

          {/* Поле суммы */}
          {calcType && (
            <div className="sum-section">
              <div className="section-subtitle">Введите сумму в рублях:</div>
              <input
                type="text"
                className="form-input"
                placeholder="Минимум 100,000 ₽"
                value={amountDisplay}
                onChange={e => {
                  const raw = e.target.value.replace(/\D/g, '');
                  setAmountRaw(raw);
                  setAmountDisplay(raw.replace(/\B(?=(\d{3})+(?!\d))/g, ' '));
                }}
              />
              {amountError && <div className="error-message">{amountError}</div>}
            </div>
          )}

          <div className="button-container">
            <button
              className={`next-btn ${buttonsAnimated ? 'animate-next' : ''}`}
              onClick={(e) => handleButtonClick(e, handleCalculate)}
              disabled={!birthDate || !gender || !calcType || !amountRaw}
            >
              <div className="shaker">
                <svg viewBox="0 0 24 24">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </button>
            <button
              className={`back-btn ${buttonsAnimated ? 'animate-home' : ''}`}
              onClick={(e) => handleButtonClick(e, () => setStage('email'))}
            >
              <svg className="home-icon" viewBox="0 0 24 24">
                <path d="M15 18l-6-6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Обработка расчета ---
  if (stage === 'processing') {
    return (
      <div className="mainmenu-container" style={{ backgroundImage: `url(${backgroundImage})` }}>
        {/* Фоновые элементы */}
        {[1,2,3,4,5,6,7,8,9,10].map(n =>
          <div key={n} className={`subtle-dot dot-${n}`} />
        )}
        
        <div className="pi-wrapper" style={{ '--pi-move-duration': moveDuration }}>
          <img src={piImage} className="pi-fly" alt="Pi" style={{ '--pi-rotate-duration': rotateDuration }} />
        </div>

        <div className="mainmenu-overlay" />

        {/* Логотип */}
        <div className={logoClass}>
          <img src={logoImage} alt="Логотип РГС Жизнь" className="logo-image" />
        </div>

        {/* Процесс загрузки */}
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <h2 className="page-title">Выполняется расчет...</h2>
          <p>Подождите, мы рассчитываем лучшие условия для вас</p>
        </div>
      </div>
    );
  }

  // --- Результаты расчёта ---
  if (stage === 'result' && resultData) {
    return (
      <div className="mainmenu-container" style={{ backgroundImage: `url(${backgroundImage})` }}>
        {/* Фоновые элементы */}
        {[1,2,3,4,5,6,7,8,9,10].map(n =>
          <div key={n} className={`subtle-dot dot-${n}`} />
        )}
        
        <div className="pi-wrapper" style={{ '--pi-move-duration': moveDuration }}>
          <img src={piImage} className="pi-fly" alt="Pi" style={{ '--pi-rotate-duration': rotateDuration }} />
        </div>

        <div className="mainmenu-overlay" />

        {/* Логотип */}
        <div className={logoClass}>
          <img src={logoImage} alt="Логотип РГС Жизнь" className="logo-image" />
        </div>

        {/* Заголовок */}
        <h2 className="page-title">Результаты расчёта</h2>

        {/* Результаты */}
        <div className="results-container">
          {/* Параметры */}
          <div className="params-block">
            <h3>Параметры расчёта</h3>
            <p>Возраст: {getAge(birthDate)} лет</p>
            <p>Пол: {gender}</p>
            <p>Срок: {programTerm} лет</p>
          </div>

          {/* Карусель результатов */}
          <div className="carousel-container">
            <div className="carousel-indicators">
              <span className={carouselIndex === 0 ? 'active' : ''}></span>
              <span className={carouselIndex === 1 ? 'active' : ''}></span>
              <span className={carouselIndex === 2 ? 'active' : ''}></span>
            </div>

            <div className="carousel-clipper">
              <div
                className="carousel-wrapper"
                style={{ transform: `translateX(-${carouselIndex * 100}%)` }}
              >
                {/* Страница 1: Взносы */}
                <div className="carousel-page">
                  <div className="result-title">В течение {programTerm} лет</div>
                  <div className="result-subtitle">Вы вносите средства</div>
                  <div className="result-value">
                    {formatSum(String(resultData.contribution))} ₽
                  </div>
                  <div className="result-subtitle">Ежегодно</div>
                  <div className="result-value">
                    {formatSum(String(resultData.totalContribution))} ₽
                  </div>
                  <div className="result-footer">Сумма ваших взносов</div>
                </div>

                {/* Страница 2: Накопления */}
                <div className="carousel-page">
                  <div className="result-title">Вы накопите</div>
                  <div className="result-subtitle">с учётом фиксированного дохода</div>
                  <div className="result-value">
                    {formatSum(String(resultData.accumulation))} ₽
                  </div>
                  <div className="result-subtitle">сумма вычета за весь срок</div>
                  <div className="result-value">
                    {formatSum(String(resultData.totalDeduction))} ₽
                  </div>
                </div>

                {/* Страница 3: Защита */}
                <div className="carousel-page">
                  <div className="result-title">Финансовая защита</div>
                  <div className="result-subtitle">
                    Уход из жизни (любая причина) – отложенная выплата
                  </div>
                  <div className="result-value">
                    {formatSum(String(resultData.delayedPayment))} ₽
                  </div>
                  <div className="result-subtitle">
                    Единовременная выплата
                  </div>
                  <div className="result-value">100% совершенных взносов</div>
                </div>
              </div>
            </div>

            {/* Кнопки навигации */}
            <button
              className="carousel-control prev"
              onClick={() => setCarouselIndex(idx => Math.max(0, idx - 1))}
              disabled={carouselIndex === 0}
            >
              ‹
            </button>
            <button
              className="carousel-control next"
              onClick={() => setCarouselIndex(idx => Math.min(2, idx + 1))}
              disabled={carouselIndex === 2}
            >
              ›
            </button>
          </div>

          <div className="button-container">
            <button
              className={`next-btn ${buttonsAnimated ? 'animate-next' : ''}`}
              onClick={(e) => handleButtonClick(e, () => setStage('manager'))}
            >
              <div className="shaker">
                <svg viewBox="0 0 24 24">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </button>
            <button
              className={`back-btn ${buttonsAnimated ? 'animate-home' : ''}`}
              onClick={(e) => handleButtonClick(e, () => {
                setStage('form');
                setResultData(null);
              })}
            >
              <svg className="home-icon" viewBox="0 0 24 24">
                <path d="M15 18l-6-6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Форма связи с менеджером ---
  if (stage === 'manager') {
    return (
      <div className="mainmenu-container" style={{ backgroundImage: `url(${backgroundImage})` }}>
        {/* Фоновые элементы */}
        {[1,2,3,4,5,6,7,8,9,10].map(n =>
          <div key={n} className={`subtle-dot dot-${n}`} />
        )}
        
        <div className="pi-wrapper" style={{ '--pi-move-duration': moveDuration }}>
          <img src={piImage} className="pi-fly" alt="Pi" style={{ '--pi-rotate-duration': rotateDuration }} />
        </div>

        <div className="mainmenu-overlay" />

        {/* Логотип */}
        <div className={logoClass}>
          <img src={logoImage} alt="Логотип РГС Жизнь" className="logo-image" />
        </div>

        {/* Заголовок */}
        <h2 className="page-title">Связь с менеджером</h2>

        {/* Форма */}
        <div className="form-container">
          <div className="form-section">
            <label className="section-label">Фамилия:</label>
            <input
              type="text"
              className="form-input"
              value={mgrSurname}
              onChange={e => setMgrSurname(e.target.value)}
            />
          </div>

          <div className="form-section">
            <label className="section-label">Имя:</label>
            <input
              type="text"
              className="form-input"
              value={mgrName}
              onChange={e => setMgrName(e.target.value)}
            />
          </div>

          <div className="form-section">
            <label className="section-label">Город:</label>
            <input
              type="text"
              className="form-input"
              value={mgrCity}
              onChange={e => setMgrCity(e.target.value)}
            />
          </div>

          {mgrError && <div className="error-message">{mgrError}</div>}

          <div className="button-container">
            <button
              className={`next-btn ${buttonsAnimated ? 'animate-next' : ''}`}
              onClick={(e) => handleButtonClick(e, handleManagerRequest)}
              disabled={isSendingMgr || !mgrSurname || !mgrName || !mgrCity}
            >
              <div className="shaker">
                <svg viewBox="0 0 24 24">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </button>
            <button
              className={`back-btn ${buttonsAnimated ? 'animate-home' : ''}`}
              onClick={(e) => handleButtonClick(e, () => setStage('result'))}
            >
              <svg className="home-icon" viewBox="0 0 24 24">
                <path d="M15 18l-6-6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Успешная отправка ---
  if (stage === 'manager-sent') {
    return (
      <div className="mainmenu-container" style={{ backgroundImage: `url(${backgroundImage})` }}>
        {/* Фоновые элементы */}
        {[1,2,3,4,5,6,7,8,9,10].map(n =>
          <div key={n} className={`subtle-dot dot-${n}`} />
        )}
        
        <div className="pi-wrapper" style={{ '--pi-move-duration': moveDuration }}>
          <img src={piImage} className="pi-fly" alt="Pi" style={{ '--pi-rotate-duration': rotateDuration }} />
        </div>

        <div className="mainmenu-overlay" />

        {/* Логотип */}
        <div className={logoClass}>
          <img src={logoImage} alt="Логотип РГС Жизнь" className="logo-image" />
        </div>

        {/* Заголовок */}
        <h2 className="page-title">Заявка отправлена</h2>

        {/* Сообщение */}
        <div className="success-container">
          <div className="success-icon">✅</div>
          <h3>Спасибо за обращение!</h3>
          <p>Наш менеджер свяжется с вами в ближайшее время для обсуждения программы "Забота о будущем".</p>
          
          <div className="button-container">
            <button
              className={`back-btn ${buttonsAnimated ? 'animate-home' : ''}`}
              onClick={handleHomeClick}
            >
              <svg className="home-icon" viewBox="0 0 24 24">
                <path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1V11z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}













































