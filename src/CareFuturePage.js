// CareFuturePage.js - Полная финальная версия с API интеграцией

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Импортируем стили
import './Styles/global.css';
import './Styles/background.css';
import './Styles/logo.css';
import './Styles/Buttons.css';
import './Styles/NextButton.css';
import './Styles/BackButton.css';
import './CareFuturePage.css';

// Импортируем изображения
import logoImage from './components/logo.png';
import backgroundImage from './components/background.png';
import piImage from './components/pi.png';
import DateWheelPicker from './DateWheelPicker';

export default function CareFuturePage() {
  const navigate = useNavigate();
  
  // Стейт для анимаций
  const [logoAnimated, setLogoAnimated] = useState(false);
  const [buttonsAnimated, setButtonsAnimated] = useState(false);
  const [moveDuration] = useState('70s');
  const [rotateDuration] = useState('6s');

  // Стадии
  const [stage, setStage] = useState('email');

  // Email
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  // Форма расчёта
  const [birthParts, setBirthParts] = useState({ day: null, month: null, year: null });
  const [birthDate, setBirthDate] = useState(null);
  const [gender, setGender] = useState(null);
  const [programTerm, setProgramTerm] = useState(5);
  const [calcType, setCalcType] = useState(null);
  const [amountRaw, setAmountRaw] = useState('');
  const [amountDisplay, setAmountDisplay] = useState('');

  // Результаты
  const [resultData, setResultData] = useState(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [calculationId, setCalculationId] = useState(null);

  // Менеджер
  const [mgrSurname, setMgrSurname] = useState('');
  const [mgrName, setMgrName] = useState('');
  const [mgrCity, setMgrCity] = useState('');
  const [mgrError, setMgrError] = useState('');
  const [isSendingMgr, setIsSendingMgr] = useState(false);

  // API
  const [apiConfig, setApiConfig] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  // ===== HELPERS =====

  useEffect(() => {
    const { day, month, year } = birthParts;
    if (day && month && year) {
      const d = Number(day), m = Number(month), y = Number(year);
      const dt = new Date(y, m - 1, d);
      if (!isNaN(dt.getTime()) && dt.getDate() === d && dt.getMonth() + 1 === m && dt.getFullYear() === y) {
        setBirthDate(dt);
      } else {
        setBirthDate(null);
      }
    } else {
      setBirthDate(null);
    }
  }, [birthParts]);

  useEffect(() => {
    loadApiConfig();
  }, []);

  useEffect(() => {
    const timer1 = setTimeout(() => setLogoAnimated(true), 100);
    const timer2 = setTimeout(() => setButtonsAnimated(true), 600);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  function getAge(d) {
    if (!d) return 0;
    const today = new Date();
    const diff = today.getTime() - d.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  }

  function formatSum(str) {
    return str.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  // ===== API =====

  async function loadApiConfig() {
    try {
      const response = await fetch('/api/care-future/config');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setApiConfig(data.config);
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки конфигурации:', error);
    }
  }

  async function performCalculation() {
    try {
      const calculationData = {
        email: email,
        birthDate: birthDate.toISOString().split('T')[0],
        gender: gender === 'мужской' ? 'male' : 'female',
        contractTerm: programTerm,
        calculationType: calcType === 'premium' ? 'from_premium' : 'from_sum',
        inputAmount: parseInt(amountRaw.replace(/\s/g, ''))
      };

      const response = await fetch('/api/care-future/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(calculationData)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Ошибка сервера');

      if (data.success) {
        setCalculationId(data.calculationId);
        setResultData({
          inputParams: {
            age: data.inputParameters.ageAtStart,
            gender: gender,
            term: data.inputParameters.contractTerm
          },
          results: data.results,
          redemptionValues: data.redemptionValues || []
        });
        return true;
      }
    } catch (error) {
      throw error;
    }
  }

  // ===== HANDLERS =====

  function validateEmail(value) {
    if (!value.trim()) return 'Введите email';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return 'Неверный формат email';
    return '';
  }

  async function handleEmailSubmit() {
    const error = validateEmail(email);
    if (error) {
      setEmailError(error);
      return;
    }
    setEmailError('');
    setStage('form');
  }

  async function handleCalculate() {
    const errors = {};

    if (!birthDate) {
      errors.birthDate = 'Выберите дату рождения';
    } else if (getAge(birthDate) < 18 || getAge(birthDate) > 63) {
      errors.birthDate = 'Возраст должен быть от 18 до 63 лет';
    }

    if (!gender) errors.gender = 'Выберите пол';
    if (!calcType) errors.calcType = 'Выберите тип расчета';
    
    if (!amountRaw.trim()) {
      errors.amount = 'Введите сумму';
    } else {
      const cleanAmount = parseInt(amountRaw.replace(/\s/g, ''));
      if (isNaN(cleanAmount) || cleanAmount <= 0) {
        errors.amount = 'Введите корректную сумму';
      } else if (calcType === 'premium' && (cleanAmount < 100000 || cleanAmount > 50000000)) {
        errors.amount = 'Взнос должен быть от 100,000 до 50,000,000 руб.';
      } else if (calcType === 'sum' && (cleanAmount < 500000 || cleanAmount > 100000000)) {
        errors.amount = 'Страховая сумма должна быть от 500,000 до 100,000,000 руб.';
      }
    }

    setValidationErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setStage('processing');
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await performCalculation();
      setStage('result');
    } catch (error) {
      setStage('form');
      setValidationErrors({ general: error.message || 'Произошла ошибка при расчете' });
    }
  }

  async function handleManagerSubmit() {
    if (!mgrSurname.trim() || !mgrName.trim() || !mgrCity.trim()) {
      setMgrError('Заполните все поля');
      return;
    }

    setIsSendingMgr(true);
    setMgrError('');

    try {
      const response = await fetch('/api/contact-manager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surname: mgrSurname,
          name: mgrName,
          city: mgrCity,
          email: email,
          calculationId: calculationId,
          page: 'care-future'
        })
      });

      if (response.ok) {
        setStage('manager-sent');
      } else {
        throw new Error('Ошибка отправки данных');
      }
    } catch (error) {
      setMgrError('Ошибка отправки. Попробуйте еще раз.');
    } finally {
      setIsSendingMgr(false);
    }
  }

  // ===== STYLES =====
  const logoClass = logoAnimated ? 'logo-container logo-animated' : 'logo-container';
  const buttonsClass = buttonsAnimated ? 'buttons-container buttons-animated' : 'buttons-container';

  // ===== RENDER =====

  if (stage === 'email') {
    return (
      <div className="mainmenu-container" style={{ backgroundImage: `url(${backgroundImage})` }}>
        {[1,2,3,4,5,6,7,8,9,10].map(n => <div key={n} className={`subtle-dot dot-${n}`} />)}
        <div className="pi-wrapper" style={{ '--pi-move-duration': moveDuration }}>
          <img src={piImage} className="pi-fly" alt="Pi" style={{ '--pi-rotate-duration': rotateDuration }} />
        </div>
        <div className="mainmenu-overlay" />
        <div className={logoClass}>
          <img src={logoImage} alt="Логотип РГС Жизнь" className="logo-image" />
        </div>
        <div className={buttonsClass}>
          <h2 className="page-title">Калькулятор НСЖ<br />«Забота о будущем Ультра»</h2>
          <p className="page-subtitle">Рассчитайте персональные условия накопительного страхования жизни</p>
          <div className="email-form">
            <input
              type="email"
              placeholder="Введите ваш email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%', padding: '15px', fontSize: '16px', borderRadius: '8px',
                border: emailError ? '2px solid #ff4444' : '1px solid #ccc',
                marginBottom: '10px', outline: 'none'
              }}
            />
            {emailError && <div className="error-message">{emailError}</div>}
            <button className="next-button" onClick={handleEmailSubmit} style={{ width: '100%', marginTop: '15px' }}>
              Продолжить
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (stage === 'form') {
    return (
      <div className="mainmenu-container" style={{ backgroundImage: `url(${backgroundImage})` }}>
        {[1,2,3,4,5,6,7,8,9,10].map(n => <div key={n} className={`subtle-dot dot-${n}`} />)}
        <div className="pi-wrapper" style={{ '--pi-move-duration': moveDuration }}>
          <img src={piImage} className="pi-fly" alt="Pi" style={{ '--pi-rotate-duration': rotateDuration }} />
        </div>
        <div className="mainmenu-overlay" />
        <div className={logoClass}>
          <img src={logoImage} alt="Логотип РГС Жизнь" className="logo-image" />
        </div>
        
        <div className="form-container">
          <h2 className="page-title">Параметры расчёта</h2>
          
          {validationErrors.general && (
            <div className="error-message" style={{ marginBottom: '20px', textAlign: 'center' }}>
              {validationErrors.general}
            </div>
          )}

          <div className="form-group">
            <label>Дата рождения</label>
            <DateWheelPicker value={birthParts} onChange={setBirthParts} />
            {validationErrors.birthDate && <div className="error-message">{validationErrors.birthDate}</div>}
            {birthDate && <div className="info-message">Возраст: {getAge(birthDate)} лет</div>}
          </div>

          <div className="form-group">
            <label>Пол</label>
            <div className="radio-group">
              {['мужской', 'женский'].map(option => (
                <label key={option} className="radio-label">
                  <input type="radio" name="gender" value={option} checked={gender === option} onChange={(e) => setGender(e.target.value)} />
                  <span className="radio-custom"></span>
                  {option}
                </label>
              ))}
            </div>
            {validationErrors.gender && <div className="error-message">{validationErrors.gender}</div>}
          </div>

          <div className="form-group">
            <label>Срок программы</label>
            <select value={programTerm} onChange={(e) => setProgramTerm(Number(e.target.value))} style={{ width: '100%', padding: '12px', fontSize: '16px', border: '1px solid #ccc', borderRadius: '8px' }}>
              {(apiConfig?.available_terms || [5,6,7,8,9,10]).map(term => (
                <option key={term} value={term}>{term} лет</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Расчёт от</label>
            <div className="radio-group">
              <label className="radio-label">
                <input type="radio" name="calcType" value="premium" checked={calcType === 'premium'} onChange={(e) => setCalcType(e.target.value)} />
                <span className="radio-custom"></span>
                Страхового взноса
              </label>
              <label className="radio-label">
                <input type="radio" name="calcType" value="sum" checked={calcType === 'sum'} onChange={(e) => setCalcType(e.target.value)} />
                <span className="radio-custom"></span>
                Страховой суммы
              </label>
            </div>
            {validationErrors.calcType && <div className="error-message">{validationErrors.calcType}</div>}
          </div>

          {calcType && (
            <div className="form-group">
              <label>{calcType === 'premium' ? 'Страховой взнос' : 'Страховая сумма'} (руб.)</label>
              <input
                type="text"
                placeholder="Введите сумму"
                value={amountDisplay}
                onChange={(e) => {
                  const value = e.target.value.replace(/\s/g, '');
                  if (/^\d*$/.test(value)) {
                    setAmountRaw(value);
                    setAmountDisplay(formatSum(value));
                  }
                }}
                style={{
                  width: '100%', padding: '12px', fontSize: '16px', borderRadius: '8px',
                  border: validationErrors.amount ? '2px solid #ff4444' : '1px solid #ccc', outline: 'none'
                }}
              />
              {validationErrors.amount && <div className="error-message">{validationErrors.amount}</div>}
            </div>
          )}

          <div className="button-group">
            <button className="back-button" onClick={() => setStage('email')}>Назад</button>
            <button className="next-button" onClick={handleCalculate} disabled={!birthDate || !gender || !calcType || !amountRaw.trim()}>
              Рассчитать
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (stage === 'processing') {
    return (
      <div className="mainmenu-container" style={{ backgroundImage: `url(${backgroundImage})` }}>
        {[1,2,3,4,5,6,7,8,9,10].map(n => <div key={n} className={`subtle-dot dot-${n}`} />)}
        <div className="pi-wrapper" style={{ '--pi-move-duration': moveDuration }}>
          <img src={piImage} className="pi-fly" alt="Pi" style={{ '--pi-rotate-duration': rotateDuration }} />
        </div>
        <div className="mainmenu-overlay" />
        <div className={logoClass}>
          <img src={logoImage} alt="Логотип РГС Жизнь" className="logo-image" />
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <h2 className="page-title">Выполняется расчет...</h2>
          <p>Подождите, мы рассчитываем лучшие условия для вас</p>
        </div>
      </div>
    );
  }

  if (stage === 'result' && resultData) {
    return (
      <div className="mainmenu-container" style={{ backgroundImage: `url(${backgroundImage})` }}>
        {[1,2,3,4,5,6,7,8,9,10].map(n => <div key={n} className={`subtle-dot dot-${n}`} />)}
        <div className="pi-wrapper" style={{ '--pi-move-duration': moveDuration }}>
          <img src={piImage} className="pi-fly" alt="Pi" style={{ '--pi-rotate-duration': rotateDuration }} />
        </div>
        <div className="mainmenu-overlay" />
        <div className={logoClass}>
          <img src={logoImage} alt="Логотип РГС Жизнь" className="logo-image" />
        </div>

        <h2 className="page-title">Результаты расчёта</h2>
        <div className="results-container">
          <div className="params-block">
            <h3>Параметры расчёта</h3>
            <p>Возраст: {resultData.inputParams.age} лет</p>
            <p>Пол: {resultData.inputParams.gender}</p>
            <p>Срок: {resultData.inputParams.term} лет</p>
            <p>Email: {email}</p>
          </div>

          <div className="carousel-container">
            <div className="carousel-indicators">
              <span className={carouselIndex === 0 ? 'active' : ''}></span>
              <span className={carouselIndex === 1 ? 'active' : ''}></span>
              <span className={carouselIndex === 2 ? 'active' : ''}></span>
            </div>

            <div className="carousel-content">
              {carouselIndex === 0 && (
                <div className="result-card">
                  <h3>Основные показатели</h3>
                  <div className="result-item">
                    <span>Страховой взнос:</span>
                    <strong>{formatSum(resultData.results.premiumAmount.toString())} ₽</strong>
                  </div>
                  <div className="result-item">
                    <span>Страховая сумма:</span>
                    <strong>{formatSum(resultData.results.insuranceSum.toString())} ₽</strong>
                  </div>
                  <div className="result-item">
                    <span>Накопленный капитал:</span>
                    <strong>{formatSum(resultData.results.accumulatedCapital.toString())} ₽</strong>
                  </div>
                </div>
              )}

              {carouselIndex === 1 && (
                <div className="result-card">
                  <h3>Доходность программы</h3>
                  <div className="result-item">
                    <span>Доход по программе:</span>
                    <strong>{formatSum(resultData.results.programIncome.toString())} ₽</strong>
                  </div>
                  <div className="result-item">
                    <span>Налоговый вычет:</span>
                    <strong>{formatSum(resultData.results.taxDeduction.toString())} ₽</strong>
                  </div>
                  <div className="result-item">
                    <span>Общая выгода:</span>
                    <strong>{formatSum((resultData.results.programIncome + resultData.results.taxDeduction).toString())} ₽</strong>
                  </div>
                </div>
              )}

              {carouselIndex === 2 && (
                <div className="result-card">
                  <h3>Выкупные суммы</h3>
                  <div className="redemption-table">
                    <div className="table-header">
                      <span>Год</span>
                      <span>Выкупная сумма</span>
                    </div>
                    {resultData.redemptionValues?.slice(0, 5).map((item, index) => (
                      <div key={index} className="table-row">
                        <span>{item.year}</span>
                        <span>{formatSum(item.redemption_amount?.toString() || '0')} ₽</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="carousel-nav">
              <button onClick={() => setCarouselIndex(Math.max(0, carouselIndex - 1))} disabled={carouselIndex === 0} className="carousel-btn">‹</button>
              <button onClick={() => setCarouselIndex(Math.min(2, carouselIndex + 1))} disabled={carouselIndex === 2} className="carousel-btn">›</button>
            </div>
          </div>

          <div className="action-buttons">
            <button className="secondary-button" onClick={() => setStage('form')}>Новый расчёт</button>
            <button className="primary-button" onClick={() => setStage('manager')}>Связаться с менеджером</button>
          </div>
        </div>
      </div>
    );
  }

  if (stage === 'manager') {
    return (
      <div className="mainmenu-container" style={{ backgroundImage: `url(${backgroundImage})` }}>
        {[1,2,3,4,5,6,7,8,9,10].map(n => <div key={n} className={`subtle-dot dot-${n}`} />)}
        <div className="pi-wrapper" style={{ '--pi-move-duration': moveDuration }}>
          <img src={piImage} className="pi-fly" alt="Pi" style={{ '--pi-rotate-duration': rotateDuration }} />
        </div>
        <div className="mainmenu-overlay" />
        <div className={logoClass}>
          <img src={logoImage} alt="Логотип РГС Жизнь" className="logo-image" />
        </div>

        <div className="manager-form">
          <h2 className="page-title">Связаться с менеджером</h2>
          <p className="page-subtitle">Наш специалист свяжется с вами для консультации</p>

          <div className="form-group">
            <input type="text" placeholder="Фамилия" value={mgrSurname} onChange={(e) => setMgrSurname(e.target.value)} style={{ width: '100%', padding: '15px', fontSize: '16px', borderRadius: '8px', border: '1px solid #ccc', marginBottom: '15px', outline: 'none' }} />
            <input type="text" placeholder="Имя" value={mgrName} onChange={(e) => setMgrName(e.target.value)} style={{ width: '100%', padding: '15px', fontSize: '16px', borderRadius: '8px', border: '1px solid #ccc', marginBottom: '15px', outline: 'none' }} />
            <input type="text" placeholder="Город" value={mgrCity} onChange={(e) => setMgrCity(e.target.value)} style={{ width: '100%', padding: '15px', fontSize: '16px', borderRadius: '8px', border: '1px solid #ccc', marginBottom: '15px', outline: 'none' }} />
          </div>

          {mgrError && <div className="error-message">{mgrError}</div>}

          <div className="button-group">
            <button className="back-button" onClick={() => setStage('result')} disabled={isSendingMgr}>Назад</button>
            <button className="next-button" onClick={handleManagerSubmit} disabled={isSendingMgr || !mgrSurname.trim() || !mgrName.trim() || !mgrCity.trim()}>
              {isSendingMgr ? 'Отправляем...' : 'Отправить'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (stage === 'manager-sent') {
    return (
      <div className="mainmenu-container" style={{ backgroundImage: `url(${backgroundImage})` }}>
        {[1,2,3,4,5,6,7,8,9,10].map(n => <div key={n} className={`subtle-dot dot-${n}`} />)}
        <div className="pi-wrapper" style={{ '--pi-move-duration': moveDuration }}>
          <img src={piImage} className="pi-fly" alt="Pi" style={{ '--pi-rotate-duration': rotateDuration }} />
        </div>
        <div className="mainmenu-overlay" />
        <div className={logoClass}>
          <img src={logoImage} alt="Логотип РГС Жизнь" className="logo-image" />
        </div>

        <div className="success-message">
          <div className="success-icon">✓</div>
          <h2 className="page-title">Заявка отправлена!</h2>
          <p className="page-subtitle">Наш менеджер свяжется с вами в ближайшее время для консультации по программе «Забота о будущем Ультра»</p>
          
          <div className="contact-info">
            <p><strong>Ваши данные:</strong></p>
            <p>{mgrSurname} {mgrName}</p>
            <p>Город: {mgrCity}</p>
            <p>Email: {email}</p>
            {calculationId && <p>ID расчёта: {calculationId.slice(0, 8)}...</p>}
          </div>

          <div className="final-buttons">
            <button className="primary-button" onClick={() => navigate('/')}>На главную</button>
            <button className="secondary-button" onClick={() => {
              setStage('email');
              setEmail('');
              setBirthParts({ day: null, month: null, year: null });
              setGender(null);
              setCalcType(null);
              setAmountRaw('');
              setAmountDisplay('');
              setResultData(null);
              setCalculationId(null);
              setMgrSurname('');
              setMgrName('');
              setMgrCity('');
              setValidationErrors({});
            }}>Новый расчёт</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mainmenu-container" style={{ backgroundImage: `url(${backgroundImage})` }}>
      <div className="error-message">Произошла ошибка. Попробуйте обновить страницу.</div>
    </div>
  );
}












































