// CareFuturePage.js - С МОДУЛЬНЫМИ СТИЛЯМИ
// ✅ Использует модульную CSS архитектуру
// ✅ Анимации как в MainMenu и других страницах
// ✅ Правильная структура компонентов
// ✅ Карточка позиционируется напрямую без content-container

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiCall } from './config';
import logoImage from './components/logo.png';
import DateWheelPicker from './DateWheelPicker';

// Подключаем модульные CSS файлы
import './Styles/containers.css';
import './Styles/buttons.css';
import './Styles/logo.css';
import './Styles/text.css';
import './Styles/BackButton.css';
import './Styles/NextButton.css';
import './Styles/ProgressIndicator.css'; // Для индикаторов
import './Styles/cards.css'; // Для белых карточек

export default function CareFuturePage() {
  const navigate = useNavigate();
  const logoRef = useRef(null);
  const nextRef = useRef(null);
  
  // ===== СОСТОЯНИЯ АНИМАЦИЙ =====
  const [logoAnimated, setLogoAnimated] = useState(false);
  const [contentAnimated, setContentAnimated] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

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

  // ===== СБРОС СОСТОЯНИЯ ПРИ МОНТИРОВАНИИ =====
  useEffect(() => {
    setIsExiting(false);
  }, []);

  // ===== АНИМАЦИЯ ВХОДА =====
  useEffect(() => {
    const timer1 = setTimeout(() => {
      setLogoAnimated(true);
      if (logoRef.current) {
        logoRef.current.classList.add('animate-logo');
      }
    }, 100);
    
    const timer2 = setTimeout(() => {
      setContentAnimated(true);
    }, 600);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  // ===== ОБНОВЛЕНИЕ ДАТЫ РОЖДЕНИЯ =====
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

  // ===== ВАЛИДАЦИЯ EMAIL =====
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // ===== ОБРАБОТКА КНОПКИ "НАЗАД" =====
  const handleBack = () => {
    if (isExiting) return;
    
    if (stage === 'form') {
      setStage('email');
    } else if (stage === 'result' || stage === 'manager' || stage === 'manager-sent') {
      setStage('form');
      setResultData(null);
      setCarouselIndex(0);
    } else {
      setIsExiting(true);
      if (logoRef.current) {
        logoRef.current.classList.add('animate-logo-exit');
      }
      setTimeout(() => navigate('/employee'), 800);
    }
  };

  // ===== ОБРАБОТКА КНОПКИ "ДОМОЙ" =====
  const handleHome = () => {
    if (isExiting) return;
    
    setIsExiting(true);
    if (logoRef.current) {
      logoRef.current.classList.add('animate-logo-exit');
    }
    setTimeout(() => navigate('/main-menu'), 800);
  };

  // ===== ОБРАБОТКА EMAIL =====
  const handleEmailSubmit = (e) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      setEmailError('Введите корректный email');
      return;
    }
    
    setEmailError('');
    setStage('form');
  };

  // ===== ВАЛИДАЦИЯ ФОРМЫ =====
  const validateForm = () => {
    const errors = {};

    if (!birthDate) {
      errors.birthDate = 'Укажите дату рождения';
    }

    if (!gender) {
      errors.gender = 'Выберите пол';
    }

    if (!calcType) {
      errors.calcType = 'Выберите тип расчёта';
    }

    if (!amountRaw || parseInt(amountRaw) === 0) {
      errors.amount = 'Введите сумму';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ===== РАСЧЕТ =====
  const handleCalculate = async () => {
    if (!validateForm()) return;

    setStage('processing');

    try {
      const requestData = {
        birth_date: birthDate.toISOString().split('T')[0],
        gender: gender,
        contract_term: programTerm,
        calculation_type: calcType,
        input_amount: parseInt(amountRaw),
        email: email
      };

      const response = await apiCall('/api/care-future/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();

      if (data.success) {
        setResultData(data.results);
        setCalculationId(data.calculationId);
        setTimeout(() => setStage('result'), 2000);
      } else {
        throw new Error(data.error || 'Ошибка расчета');
      }
    } catch (error) {
      console.error('Ошибка:', error);
      setValidationErrors({ general: 'Ошибка при выполнении расчета' });
      setStage('form');
    }
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
      const response = await apiCall('/api/contact-manager', {
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

      const data = await response.json();

      if (data.success) {
        setStage('manager-sent');
      } else {
        throw new Error(data.message || 'Ошибка отправки');
      }
    } catch (error) {
      console.error('Ошибка:', error);
      setMgrError('Не удалось отправить заявку. Попробуйте позже.');
    } finally {
      setIsSendingMgr(false);
    }
  };

  // ===== ПОДГОТОВКА ДАННЫХ ДЛЯ КАРУСЕЛИ =====
  const getCarouselData = () => {
    if (!resultData) return [];

    return [
      {
        title: 'Ваш расчёт готов!',
        items: [
          { 
            label: 'Страховая сумма:', 
            value: resultData.insurance_amount_formatted,
            highlight: true
          },
          { 
            label: 'Единовременный взнос:', 
            value: resultData.single_premium_formatted 
          },
          { 
            label: 'Срок программы:', 
            value: `${resultData.contract_term} лет` 
          },
          { 
            label: 'Ваш возраст:', 
            value: `${resultData.age} лет` 
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

  // ===== RIPPLE ЭФФЕКТ =====
  const createRipple = (event) => {
    const button = event.currentTarget;
    const circle = document.createElement('span');
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;
    
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - button.offsetLeft - radius}px`;
    circle.style.top = `${event.clientY - button.offsetTop - radius}px`;
    circle.classList.add('ripple');
    
    const ripple = button.getElementsByClassName('ripple')[0];
    if (ripple) {
      ripple.remove();
    }
    
    button.appendChild(circle);
  };

  // ===== КЛАССЫ ДЛЯ ЭЛЕМЕНТОВ =====
  const getContainerClasses = () => [
    'main-container',
    isExiting ? 'exiting' : ''
  ].filter(Boolean).join(' ');

  const getLogoClasses = () => [
    'logo-wrapper',
    logoAnimated ? 'animated' : '',
    isExiting ? 'exiting' : ''
  ].filter(Boolean).join(' ');

  const getBackButtonClasses = () => [
    'back-btn',
    contentAnimated ? 'animate-home' : '',
    isExiting ? 'animate-home-exit' : ''
  ].filter(Boolean).join(' ');

  const getCardClasses = () => [
    'card-container',
    'card-positioned', // Новый класс для позиционирования
    contentAnimated ? 'animated' : '',
    isExiting ? 'exiting' : ''
  ].filter(Boolean).join(' ');

  const getNextButtonClasses = () => {
    const canProceed = stage === 'email' ? validateEmail(email) : 
                      stage === 'form' ? validateForm() : 
                      false;
    
    return [
      'next-btn',
      canProceed && contentAnimated ? 'animate-next' : '',
      isExiting ? 'animate-next-exit' : ''
    ].filter(Boolean).join(' ');
  };

  // ===== РЕНДЕР ПО СТАДИЯМ =====
  const renderContent = () => {
    switch (stage) {
      case 'email':
        return (
          <div className={getCardClasses()}>
            <div className="card-header">
              <h1 className="text-h1 text-center">Забота о будущем</h1>
              <p className="text-body text-center">
                Накопительное страхование жизни с дополнительными сервисами
              </p>
            </div>
            
            <div className="form-group">
              <label className="form-label text-label">Введите ваш email</label>
              <input
                type="email"
                className={`form-input ${emailError ? 'error' : ''}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@mail.ru"
                style={{ 
                  textAlign: 'center', 
                  position: 'relative', 
                  zIndex: 15,
                  userSelect: 'auto',
                  WebkitUserSelect: 'auto',
                  pointerEvents: 'auto',
                  cursor: 'text',
                  touchAction: 'manipulation'
                }}
              />
              {emailError && <span className="form-error">{emailError}</span>}
            </div>
          </div>
        );

      case 'form':
        return (
          <div className={`${getCardClasses()} scrollable`}>
            <div className="card-header">
              <h2 className="text-h2 text-center">Параметры расчёта</h2>
            </div>
            
            <div className="card-content">
              {/* Дата рождения */}
              <div className="form-group">
                <label className="form-label text-label">Дата рождения</label>
                <DateWheelPicker 
                  value={birthParts}
                  onChange={setBirthParts}
                />
                {validationErrors.birthDate && (
                  <span className="form-error">{validationErrors.birthDate}</span>
                )}
              </div>

              {/* Пол */}
              <div className="form-group">
                <label className="form-label text-label">Пол</label>
                <div className="option-buttons">
                  <button
                    className={`option-button ${gender === 'male' ? 'selected' : ''}`}
                    onClick={() => setGender('male')}
                  >
                    Мужской
                  </button>
                  <button
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
                <div className="slider-container">
                  <input
                    type="range"
                    className="form-slider"
                    min="5"
                    max="30"
                    step="1"
                    value={programTerm}
                    onChange={(e) => setProgramTerm(parseInt(e.target.value))}
                  />
                  <div className="slider-value">{programTerm}</div>
                </div>
              </div>

              {/* Тип расчёта */}
              <div className="form-group">
                <label className="form-label text-label">Тип расчёта</label>
                <div className="option-buttons vertical">
                  <button
                    className={`option-button ${calcType === 'from_premium' ? 'selected' : ''}`}
                    onClick={() => setCalcType('from_premium')}
                  >
                    Рассчитать по размеру взноса
                  </button>
                  <button
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
                  className={`form-input ${validationErrors.amount ? 'error' : ''}`}
                  value={amountDisplay}
                  onChange={handleAmountChange}
                  placeholder="1 000 000"
                />
                {validationErrors.amount && (
                  <span className="form-error">{validationErrors.amount}</span>
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
          <div className={getCardClasses()}>
            <div className="processing-container">
              <div className="progress-spinner"></div>
              <h2 className="text-h2">Выполняем расчёт...</h2>
              <p className="text-body">Это займёт несколько секунд</p>
            </div>
          </div>
        );

      case 'result':
        const carouselData = getCarouselData();
        const currentSlide = carouselData[carouselIndex];
        
        return (
          <div className={getCardClasses()}>
            <div className="carousel-container">
              <h2 className="text-h2 text-center">{currentSlide.title}</h2>
              
              {currentSlide.items && (
                <div className="result-items">
                  {currentSlide.items.map((item, idx) => (
                    <div key={idx} className={`result-item ${item.highlight ? 'highlight' : ''}`}>
                      <span className="result-label">{item.label}</span>
                      <span className="result-value">{item.value}</span>
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
              <div className="carousel-nav">
                {carouselIndex > 0 && (
                  <button 
                    className="carousel-btn prev"
                    onClick={() => setCarouselIndex(prev => prev - 1)}
                  >
                    <svg viewBox="0 0 24 24">
                      <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" fill="none"/>
                    </svg>
                  </button>
                )}
                
                {carouselIndex < carouselData.length - 1 && (
                  <button 
                    className="carousel-btn next"
                    onClick={() => setCarouselIndex(prev => prev + 1)}
                  >
                    <svg viewBox="0 0 24 24">
                      <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" fill="none"/>
                    </svg>
                  </button>
                )}
              </div>

              {/* Индикаторы */}
              <div className="carousel-dots">
                {carouselData.map((_, idx) => (
                  <div 
                    key={idx}
                    className={`carousel-dot ${idx === carouselIndex ? 'active' : ''}`}
                    onClick={() => setCarouselIndex(idx)}
                  />
                ))}
              </div>
            </div>

            <div className="card-footer">
              <button
                className="btn-universal btn-primary btn-large btn-fullwidth"
                onClick={(e) => {
                  createRipple(e);
                  setStage('manager');
                }}
              >
                Связаться с менеджером
              </button>
            </div>
          </div>
        );

      case 'manager':
        return (
          <div className={getCardClasses()}>
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
                onClick={createRipple}
              >
                {isSendingMgr ? '' : 'Отправить заявку'}
              </button>
            </form>
          </div>
        );

      case 'manager-sent':
        return (
          <div className={getCardClasses()}>
            <div className="success-container">
              <div className="success-icon">✓</div>
              <h2 className="text-h2 text-center">Заявка отправлена!</h2>
              <p className="text-body text-center">
                Мы свяжемся с вами в ближайшее время
              </p>
              <button
                className="btn-universal btn-primary btn-large btn-fullwidth"
                onClick={(e) => {
                  createRipple(e);
                  handleHome();
                }}
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
    <div className={getContainerClasses()}>
      {/* ===== ЛОГОТИП ===== */}
      <div ref={logoRef} className={getLogoClasses()}>
        <img
          src={logoImage}
          alt="Логотип РГС Жизнь"
          className="logo-image"
        />
      </div>

      {/* ===== КНОПКА "НАЗАД" ===== */}
      <button 
        className={getBackButtonClasses()}
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

      {/* ===== КНОПКА "ДАЛЕЕ" ===== */}
      {(stage === 'email' || stage === 'form') && (
        <button
          ref={nextRef}
          className={getNextButtonClasses()}
          onClick={() => {
            if (stage === 'email') {
              handleEmailSubmit({ preventDefault: () => {} });
            } else if (stage === 'form') {
              handleCalculate();
            }
          }}
          disabled={
            stage === 'email' ? !validateEmail(email) : 
            stage === 'form' ? !validateForm() : 
            false
          }
        >
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
        </button>
      )}

      {/* ===== КОНТЕНТ БЕЗ ОБЕРТКИ ===== */}
      {renderContent()}
    </div>
  );
}