// CareFuturePage.js - МАКСИМАЛЬНО УПРОЩЕННАЯ ВЕРСИЯ
// ✅ УДАЛЕНЫ ВСЕ ИНЛАЙН СТИЛИ
// ✅ УДАЛЕНЫ ВСЕ useEffect
// ✅ ТОЛЬКО БАЗОВЫЕ СОСТОЯНИЯ И ЛОГИКА

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiCall } from './config';
import logoImage from './components/logo.png';
import DateWheelPicker from './DateWheelPicker';

import './Styles/containers.css';
import './Styles/cards.css';
import './Styles/text.css';
import './Styles/buttons.css';
import './Styles/logo.css';
import './Styles/BackButton.css';
import './Styles/NextButton.css';
import './Styles/ProgressIndicator.css';

export default function CareFuturePage() {
  const navigate = useNavigate();
  const logoRef = useRef(null);
  
  // ===== СОСТОЯНИЯ ФОРМЫ =====
  const [stage, setStage] = useState('email');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  
  // Данные формы расчёта
  const [birthParts, setBirthParts] = useState({
    day: '01',
    month: '01',
    year: new Date().getFullYear().toString()
  });
  const [birthDate, setBirthDate] = useState(null);
  const [gender, setGender] = useState(null);
  const [programTerm, setProgramTerm] = useState(5);
  const [calcType, setCalcType] = useState(null);
  const [amountRaw, setAmountRaw] = useState('');
  const [amountDisplay, setAmountDisplay] = useState('');
  const [yearlyIncome, setYearlyIncome] = useState('');
  
  // Результаты
  const [resultData, setResultData] = useState(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [calculationId, setCalculationId] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  
  // Данные менеджера
  const [mgrSurname, setMgrSurname] = useState('');
  const [mgrName, setMgrName] = useState('');
  const [mgrCity, setMgrCity] = useState('');
  const [mgrError, setMgrError] = useState('');
  const [isSendingMgr, setIsSendingMgr] = useState(false);

  // ===== ФОРМАТИРОВАНИЕ СУММЫ =====
  const formatAmount = (value) => {
    const cleanValue = value.replace(/\s/g, '');
    if (!cleanValue) return '';
    
    const numValue = parseInt(cleanValue, 10);
    if (isNaN(numValue)) return '';
    
    return numValue.toLocaleString('ru-RU');
  };

  const handleAmountChange = (e) => {
    const rawValue = e.target.value.replace(/\s/g, '');
    if (rawValue === '' || /^\d+$/.test(rawValue)) {
      setAmountRaw(rawValue);
      setAmountDisplay(formatAmount(rawValue));
    }
  };

  // ===== ОБНОВЛЕНИЕ ДАТЫ РОЖДЕНИЯ =====
  const updateBirthDate = () => {
    const { day, month, year } = birthParts;
    
    if (day && month && year) {
      const d = Number(day);
      const m = Number(month);
      const y = Number(year);
      
      const dt = new Date(y, m - 1, d);
      
      if (!isNaN(dt.getTime()) && 
          dt.getDate() === d && 
          dt.getMonth() + 1 === m && 
          dt.getFullYear() === y) {
        
        setBirthDate(dt);
        
        if (validationErrors.birthDate) {
          setValidationErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.birthDate;
            return newErrors;
          });
        }
      } else {
        setBirthDate(null);
      }
    } else {
      setBirthDate(null);
    }
  };

  // ===== НАВИГАЦИЯ =====
  const handleBack = () => {
    switch (stage) {
      case 'email':
        navigate('/employee');
        break;
      case 'form':
        setStage('email');
        break;
      case 'result':
        setStage('form');
        setCarouselIndex(0);
        break;
      case 'manager':
        setStage('result');
        setMgrError('');
        break;
      case 'manager-sent':
        setStage('result');
        break;
      default:
        navigate('/employee');
    }
  };

  const handleHome = () => {
    navigate('/main-menu');
  };

  // ===== ВАЛИДАЦИЯ EMAIL =====
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return false;
    }
    
    const lowerEmail = email.toLowerCase();
    return lowerEmail.endsWith('@vtb.ru') || lowerEmail.endsWith('@rgsl.ru');
  };

  const handleEmailSubmit = () => {
    if (!email) {
      setEmailError('Введите email');
      return;
    }
    
    if (!validateEmail(email)) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setEmailError('Введите корректный email');
      } else {
        setEmailError('Используйте корпоративную почту (@vtb.ru или @rgsl.ru)');
      }
      return;
    }
    
    setEmailError('');
    setStage('form');
  };

  // ===== ВАЛИДАЦИЯ ФОРМЫ =====
  const validateForm = () => {
    updateBirthDate(); // Обновляем дату перед валидацией
    
    const errors = {};

    if (!birthDate) {
      errors.birthDate = 'Укажите дату рождения';
    } else {
      const age = new Date().getFullYear() - birthDate.getFullYear();
      if (age < 18 || age > 65) {
        errors.birthDate = 'Возраст должен быть от 18 до 65 лет';
      }
    }

    if (!gender) {
      errors.gender = 'Выберите пол';
    }

    if (!calcType) {
      errors.calcType = 'Выберите тип расчёта';
    }

    if (!amountRaw || parseInt(amountRaw) <= 0) {
      errors.amount = 'Укажите сумму';
    } else {
      const amount = parseInt(amountRaw);
      
      if (calcType === 'from_premium' && amount < 100000) {
        errors.amount = 'Минимальный взнос 100 000 рублей';
      }
      
      if (amount > 100000000) {
        errors.amount = 'Максимальная сумма 100 000 000 рублей';
      }
    }

    if (!yearlyIncome) {
      errors.yearlyIncome = 'Выберите уровень дохода';
    }

    setValidationErrors(errors);
    
    return Object.keys(errors).length === 0;
  };

  // ===== ПРОВЕРКА ГОТОВНОСТИ КНОПКИ =====
  const isNextButtonReady = () => {
    if (stage === 'email') {
      return email && email.length >= 3;
    } else if (stage === 'form') {
      return birthDate && gender && calcType && amountRaw && parseInt(amountRaw) > 0 && yearlyIncome;
    }
    return false;
  };

  // ===== РАСЧЕТ =====
  const handleCalculate = async () => {
    if (!validateForm()) return;

    setStage('processing');

    try {
      const formattedDate = birthDate instanceof Date 
        ? `${birthDate.getFullYear()}-${String(birthDate.getMonth() + 1).padStart(2, '0')}-${String(birthDate.getDate()).padStart(2, '0')}`
        : new Date(birthDate).toLocaleDateString('sv-SE');
      
      const requestData = {
        birthDate: formattedDate,
        gender: gender,
        contractTerm: programTerm,
        calculationType: calcType,
        inputAmount: parseInt(amountRaw),
        email: email,
        yearlyIncome: yearlyIncome
      };

      const data = await apiCall('/care-future/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      if (data.success) {
        const processedResultData = {
          insurance_amount_formatted: data.results.insuranceSum.toLocaleString('ru-RU') + ' ₽',
          single_premium_formatted: data.results.premiumAmount.toLocaleString('ru-RU') + ' ₽',
          contract_term: data.inputParameters.contractTerm,
          age: data.inputParameters.ageAtStart,
          accumulated_capital: data.results.accumulatedCapital,
          program_income: data.results.programIncome,
          tax_deduction: calculateTaxDeduction(
            data.results.premiumAmount,
            data.inputParameters.contractTerm,
            yearlyIncome
          ),
          premium_amount: data.results.premiumAmount,
          insurance_sum: data.results.insuranceSum
        };

        setResultData(processedResultData);
        setCalculationId(data.calculationId);
        
        setTimeout(() => {
          setStage('result');
        }, 2000);
        
      } else {
        throw new Error(data.error || 'Ошибка расчета');
      }
    } catch (error) {
      console.error('Ошибка расчета:', error);
      setValidationErrors({ general: error.message || 'Ошибка при выполнении расчета' });
      setStage('form');
    }
  };

  // ===== РАСЧЕТ НАЛОГОВОГО ВЫЧЕТА =====
  const calculateTaxDeduction = (premiumAmount, contractTerm, incomeLevel) => {
    if (!incomeLevel || !premiumAmount || !contractTerm) return 0;

    const incomeConfig = {
      'up_to_2_4': { rate: 0.13, maxPerYear: 19500 },
      'over_2_4': { rate: 0.15, maxPerYear: 22500 },
      'over_5': { rate: 0.18, maxPerYear: 27000 },
      'over_20': { rate: 0.20, maxPerYear: 30000 },
      'over_50': { rate: 0.22, maxPerYear: 33000 }
    };

    const config = incomeConfig[incomeLevel];
    if (!config) return 0;

    const annualDeduction = Math.min(
      premiumAmount * config.rate,
      config.maxPerYear
    );

    return Math.round(annualDeduction * contractTerm);
  };

  // ===== ОТПРАВКА ЗАЯВКИ МЕНЕДЖЕРУ =====
  const handleManagerSubmit = async (e) => {
    e.preventDefault();
    
    if (!mgrSurname.trim() || !mgrName.trim() || !mgrCity.trim()) {
      setMgrError('Заполните все поля');
      return;
    }

    setIsSendingMgr(true);
    setMgrError('');

    try {
      const data = await apiCall('/api/contact-manager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surname: mgrSurname,
          name: mgrName,
          city: mgrCity,
          email: email,
          page: 'care-future',
          calculationId: calculationId
        })
      });

      if (data && data.success) {
        setStage('manager-sent');
      } else {
        throw new Error(data?.message || 'Ошибка отправки');
      }
    } catch (error) {
      console.error('Ошибка отправки заявки:', error);
      setMgrError('Не удалось отправить заявку. Попробуйте позже.');
    } finally {
      setIsSendingMgr(false);
    }
  };

  // ===== ПОДГОТОВКА ДАННЫХ ДЛЯ КАРУСЕЛИ - ИСПРАВЛЕНО =====
  const getCarouselData = () => {
    if (!resultData) return [];

    return [
      {
        title: 'Ваш расчет "Забота о будущем"',
        items: [
          { 
            label: 'Ваш возраст:',
            value: `${resultData.age} лет`
          },
          { 
            label: 'Срок программы:',
            value: `${resultData.contract_term} лет`
          },
          { 
            label: 'Ежегодный взнос:',
            value: resultData.single_premium_formatted
          },
          { 
            label: 'Сумма возврата налогов:',
            value: `${resultData.tax_deduction.toLocaleString('ru-RU')} ₽`
          },
          { 
            label: 'Страховая сумма:',
            value: resultData.insurance_amount_formatted,
            highlight: true
          }
        ]
      },
      {
        title: 'Покрытия и выплаты',
        items: [
          { 
            label: 'Дожитие ЗЛ до окончания срока страхования:',
            value: resultData.insurance_amount_formatted
          },
          { 
            label: 'Уход по ЛП с отложенной выплатой:',
            value: resultData.insurance_amount_formatted
          },
          { 
            label: 'Уход по ЛП (выплата в моменте):',
            value: 'возврат взносов'
          },
          { 
            label: 'Инвалидность I,II по ЛП:',
            value: 'освобождение от<br/>уплаты взносов'
          }
        ]
      },
      {
        title: 'Дополнительные сервисы',
        isServicePage: true,
        services: [
          {
            icon: '🏥',
            title: 'Телемедицина',
            description: 'Круглосуточные онлайн-консультации с врачами'
          },
          {
            icon: '💊',
            title: 'Доставка лекарств',
            description: 'Бесплатная доставка из аптек-партнёров'
          },
          {
            icon: '🔬',
            title: 'Check-up',
            description: 'Ежегодное комплексное обследование'
          }
        ]
      }
    ];
  };

  // ===== РЕНДЕР КОНТЕНТА =====
  const renderContent = () => {
    switch (stage) {
      case 'email':
        return (
          <div className="card-container card-positioned animated">
            <div className="card-header">
              <h1 className="text-h1-dark text-center">Забота о будущем</h1>
              <p className="text-body-dark text-center">
                Накопительное страхование жизни с дополнительными сервисами
              </p>
            </div>
            
            <div className="form-group">
              <label className="form-label text-label-large">Введите ваш email</label>
              <input
                type="email"
                className={`form-input ${emailError ? 'error' : ''}`}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError('');
                }}
                placeholder="example@mail.ru"
              />
              {emailError && <span className="form-error">{emailError}</span>}
            </div>
          </div>
        );

      case 'form':
        return (
          <div className="card-container card-positioned scrollable animated">
            <div className="card-header">
              <h2 className="text-h2-dark text-center">Параметры расчёта</h2>
            </div>
            
            <div className="card-content">
              {/* Дата рождения */}
              <div className="form-group">
                <label className="form-label text-label">Дата рождения</label>
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
                        setBirthDate(dt);
                      }
                    }
                  }}
                />
                {validationErrors.birthDate && (
                  <span className="form-error">{validationErrors.birthDate}</span>
                )}
              </div>

              {/* Пол */}
              <div className="form-group">
                <label className="form-label text-label">Пол</label>
                <div className="option-buttons horizontal-always">
                  <button
                    type="button"
                    className={`option-button ${gender === 'male' ? 'selected' : ''}`}
                    onClick={() => setGender('male')}
                  >
                    Мужской
                  </button>
                  <button
                    type="button"
                    className={`option-button ${gender === 'female' ? 'selected' : ''}`}
                    onClick={() => setGender('female')}
                  >
                    Женский
                  </button>
                </div>
                {validationErrors.gender && (
                  <span className="form-error">{validationErrors.gender}</span>
                )}
              </div>

              {/* Срок программы */}
              <div className="form-group">
                <label className="form-label text-label">Срок программы (лет)</label>
                <div className="range-container">
                  <input
                    type="range"
                    className="range-input"
                    min="5"
                    max="30"
                    step="1"
                    value={programTerm}
                    onChange={(e) => setProgramTerm(parseInt(e.target.value))}
                  />
                  <div className="range-value">
                    {programTerm}
                  </div>
                </div>
              </div>

              {/* Тип расчёта */}
              <div className="form-group">
                <label className="form-label text-label">Тип расчёта</label>
                <div className="option-buttons horizontal-always">
                  <button
                    type="button"
                    className={`option-button ${calcType === 'from_premium' ? 'selected' : ''}`}
                    onClick={() => setCalcType('from_premium')}
                  >
                    Рассчитать по размеру взноса
                  </button>
                  <button
                    type="button"
                    className={`option-button ${calcType === 'from_sum' ? 'selected' : ''}`}
                    onClick={() => setCalcType('from_sum')}
                  >
                    Рассчитать по страховой сумме
                  </button>
                </div>
                {validationErrors.calcType && (
                  <span className="form-error">{validationErrors.calcType}</span>
                )}
              </div>

              {/* Сумма */}
              <div className="form-group">
                <label className="form-label text-label">
                  {calcType === 'from_premium' ? 'Размер взноса' : 'Страховая сумма'} (₽)
                </label>
                <input
                  type="text"
                  className={`form-input form-input-narrow ${validationErrors.amount ? 'error' : ''}`}
                  value={amountDisplay}
                  onChange={handleAmountChange}
                  placeholder={calcType === 'from_premium' ? 'от 100 000 рублей' : 'Введите сумму'}
                />
                {validationErrors.amount && (
                  <span className="form-error">{validationErrors.amount}</span>
                )}
              </div>

              {/* Доход в год */}
              <div className="form-group">
                <label className="form-label text-label">Мой доход в год:</label>
                <select
                  className={`form-input form-input-narrow ${validationErrors.yearlyIncome ? 'error' : ''}`}
                  value={yearlyIncome}
                  onChange={(e) => setYearlyIncome(e.target.value)}
                >
                  <option value="">Выберите уровень дохода</option>
                  <option value="up_to_2_4">До 2,4 млн</option>
                  <option value="over_2_4">Свыше 2,4 млн</option>
                  <option value="over_5">Свыше 5 млн</option>
                  <option value="over_20">Свыше 20 млн</option>
                  <option value="over_50">Свыше 50 млн</option>
                </select>
                {validationErrors.yearlyIncome && (
                  <span className="form-error">{validationErrors.yearlyIncome}</span>
                )}
              </div>

              {validationErrors.general && (
                <div className="form-error-block">{validationErrors.general}</div>
              )}
            </div>
          </div>
        );

      case 'processing':
        return (
          <div className="card-container card-positioned animated">
            <div className="processing-container">
              <div className="progress-spinner"></div>
              <h2 className="text-h2">Выполняем расчёт...</h2>
              <p className="text-body">Это займёт несколько секунд</p>
            </div>
          </div>
        );

      case 'result':
        const carouselData = getCarouselData();
        const currentSlide = carouselData[carouselIndex] || carouselData[0];
        
        return (
          <div className="card-container card-positioned animated">
            <div className="carousel-container">
              <h2 className="text-h2 text-center">{currentSlide.title}</h2>
              
              {currentSlide.items && (
                <div className="result-items">
                  {currentSlide.items.map((item, idx) => (
                    <div key={idx} className={`result-item-split ${item.highlight ? 'highlight' : ''}`}>
                      <span className="result-label-left">{item.label}</span>
                      <span 
                        className="result-value-right"
                        dangerouslySetInnerHTML={{ __html: item.value }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {currentSlide.isServicePage && currentSlide.services && (
                <div className="services-list">
                  {currentSlide.services.map((service, idx) => (
                    <div key={idx} className="service-item">
                      <div className="service-icon">{service.icon}</div>
                      <div className="service-content">
                        <h3 className="service-title">{service.title}</h3>
                        <p className="service-description">{service.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Навигация карусели */}
              <div className="carousel-navigation-bottom">
                {/* Кнопка "Назад" - по левому краю */}
                <button 
                  type="button"
                  className={`carousel-arrow ${carouselIndex === 0 ? 'hidden' : ''}`}
                  onClick={() => setCarouselIndex(prev => Math.max(0, prev - 1))}
                >
                  <svg viewBox="0 0 24 24" width="20" height="20">
                    <path 
                      d="M15 18l-6-6 6-6" 
                      stroke="currentColor" 
                      strokeWidth="2.5" 
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                
                {/* Индикаторы - по центру */}
                <div className="carousel-dots">
                  {carouselData.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`carousel-dot ${idx === carouselIndex ? 'active' : ''}`}
                      onClick={() => setCarouselIndex(idx)}
                    />
                  ))}
                </div>

                {/* Кнопка "Далее" - по правому краю */}
                <button 
                  type="button"
                  className={`carousel-arrow ${carouselIndex === carouselData.length - 1 ? 'hidden' : ''}`}
                  onClick={() => setCarouselIndex(prev => Math.min(carouselData.length - 1, prev + 1))}
                >
                  <svg viewBox="0 0 24 24" width="20" height="20">
                    <path 
                      d="M9 18l6-6-6-6" 
                      stroke="currentColor" 
                      strokeWidth="2.5" 
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="card-footer">
              <button
                type="button"
                className="btn-universal btn-primary btn-large btn-fullwidth"
                onClick={() => setStage('manager')}
              >
                Связаться с менеджером
              </button>
            </div>
          </div>
        );

      case 'manager':
        return (
          <div className="card-container card-positioned animated">
            <div className="card-header">
              <h2 className="text-h2 text-center">Оставить заявку</h2>
              <p className="text-body text-center">
                Наш менеджер свяжется с вами в ближайшее время
              </p>
            </div>

            <form onSubmit={handleManagerSubmit}>
              <div className="form-group">
                <label className="form-label text-label">Фамилия</label>
                <input
                  type="text"
                  className="form-input"
                  value={mgrSurname}
                  onChange={(e) => setMgrSurname(e.target.value)}
                  placeholder="Иванов"
                />
              </div>

              <div className="form-group">
                <label className="form-label text-label">Имя</label>
                <input
                  type="text"
                  className="form-input"
                  value={mgrName}
                  onChange={(e) => setMgrName(e.target.value)}
                  placeholder="Иван"
                />
              </div>

              <div className="form-group">
                <label className="form-label text-label">Город</label>
                <input
                  type="text"
                  className="form-input"
                  value={mgrCity}
                  onChange={(e) => setMgrCity(e.target.value)}
                  placeholder="Москва"
                />
              </div>

              {mgrError && <div className="form-error-block">{mgrError}</div>}

              <button
                type="submit"
                className={`btn-universal btn-primary btn-large btn-fullwidth ${isSendingMgr ? 'btn-loading' : ''}`}
                disabled={isSendingMgr}
              >
                {isSendingMgr ? '' : 'Отправить заявку'}
              </button>
            </form>
          </div>
        );

      case 'manager-sent':
        return (
          <div className="card-container card-positioned animated">
            <div className="success-container">
              <div className="success-icon">✓</div>
              <h2 className="text-h2 text-center">Заявка отправлена!</h2>
              <p className="text-body text-center">
                Мы свяжемся с вами в ближайшее время
              </p>
              <button
                className="btn-universal btn-primary btn-large btn-fullwidth"
                onClick={handleHome}
              >
                На главную
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="main-container">
      {/* Логотип */}
      <div ref={logoRef} className="logo-wrapper animated">
        <img
          src={logoImage}
          alt="Логотип РГС Жизнь"
          className="logo-image"
        />
      </div>

      {/* Кнопка "Назад" */}
      <button 
        className="back-btn animate-home"
        onClick={handleBack}
        aria-label="Назад"
      >
        <svg viewBox="0 0 24 24">
          <path 
            d="M15 18l-6-6 6-6" 
            stroke="white" 
            strokeWidth="2.5" 
            fill="none" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Кнопка "Далее" */}
      {(stage === 'email' || stage === 'form') && (
        <button
          className={`next-btn animate-next ${!isNextButtonReady() ? 'disabled' : ''}`}
          onClick={() => {
            if (stage === 'email') {
              handleEmailSubmit();
            } else if (stage === 'form') {
              handleCalculate();
            }
          }}
        >
          <div className={isNextButtonReady() ? 'shaker shake-btn' : 'shaker'}>
            <svg viewBox="0 0 24 24">
              <path 
                d="M9 18l6-6-6-6" 
                stroke="white" 
                strokeWidth="3" 
                fill="none" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </button>
      )}

    {/* Контент */}
    {renderContent()}
  </div>
);
}