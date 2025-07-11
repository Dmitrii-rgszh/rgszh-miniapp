// CareFuturePage.js - ИСПРАВЛЕННАЯ ВЕРСИЯ с правильным синтаксисом

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Импортируем только изображения
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

  // Стадии: 'email' → 'form' → 'processing' → 'result' → 'manager' → 'manager-sent'
  const [stage, setStage] = useState('email');

  // ===== Состояния для Email-шага =====
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  // ===== Состояния для формы расчёта =====
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

  // ===== Состояния Processing/Result =====
  const [resultData, setResultData] = useState(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [calculationId, setCalculationId] = useState(null);

  // ===== Состояния для «Связаться с менеджером» =====
  const [mgrSurname, setMgrSurname] = useState('');
  const [mgrName, setMgrName] = useState('');
  const [mgrCity, setMgrCity] = useState('');
  const [mgrError, setMgrError] = useState('');
  const [isSendingMgr, setIsSendingMgr] = useState(false);

  // ===== API и валидация =====
  const [apiConfig, setApiConfig] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  // ===== СТИЛИ =====
  
  // Основной контейнер
  const mainContainerStyle = {
    position: 'relative',
    width: '100%',
    height: window.innerHeight + 'px',
    minHeight: '100vh',
    backgroundImage: `url(${backgroundImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  };

  // Оверлей с градиентом
  const overlayStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, rgba(147, 39, 143, 0.85) 0%, rgba(71, 125, 191, 0.85) 100%)',
    zIndex: 1
  };

  // Логотип
  const logoStyle = {
    position: 'absolute',
    top: logoAnimated ? '80px' : '-200px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '160px',
    height: '160px',
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    backdropFilter: 'blur(8px)',
    borderRadius: '20px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.25)',
    opacity: logoAnimated ? 1 : 0,
    zIndex: 3,
    transition: 'all 0.8s ease-out',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const logoImageStyle = {
    width: '120px',
    height: '120px',
    objectFit: 'contain'
  };

  // Контейнер кнопок/контента - ПОДНИМАЕМ К ЛОГОТИПУ
  const buttonsContainerStyle = {
    position: 'absolute',
    top: buttonsAnimated ? '280px' : '500px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '90%',
    maxWidth: '400px',
    zIndex: 3,
    textAlign: 'center',
    opacity: buttonsAnimated ? 1 : 0,
    transition: 'all 0.8s ease-out'
  };

  // Форма в центре экрана
  const formContainerStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90%',
    maxWidth: '500px',
    maxHeight: '80vh',
    overflowY: 'auto',
    zIndex: 3,
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '16px',
    padding: '30px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)'
  };

  // Заголовки - УБИРАЕМ ЛИШНИЙ ОТСТУП
  const titleStyle = {
    fontSize: '28px',
    fontWeight: 'bold',
    color: 'white',
    margin: '0 0 15px 0',
    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)',
    lineHeight: '1.2'
  };

  const subtitleStyle = {
    fontSize: '16px',
    color: 'rgba(255, 255, 255, 0.9)',
    margin: '0 0 30px 0',
    textShadow: '1px 1px 2px rgba(0, 0, 0, 0.3)',
    lineHeight: '1.4'
  };

  const formTitleStyle = {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333',
    margin: '0 0 20px 0',
    textAlign: 'center'
  };

  // Email форма
  const emailFormStyle = {
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '16px',
    padding: '30px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)'
  };

  // Инпуты
  const inputStyle = {
    width: '100%',
    padding: '15px',
    fontSize: '16px',
    borderRadius: '8px',
    border: '2px solid #e1e5e9',
    marginBottom: '10px',
    outline: 'none',
    transition: 'border-color 0.3s ease',
    boxSizing: 'border-box'
  };

  const inputErrorStyle = {
    ...inputStyle,
    borderColor: '#ff4757'
  };

  // Кнопки
  const primaryButtonStyle = {
    background: 'linear-gradient(135deg, #9370DB 0%, #7B68EE 100%)',
    color: 'white',
    border: 'none',
    padding: '15px 24px', // ✅ ИСПРАВЛЕНИЕ 3: Такой же padding
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    minHeight: '54px', // ✅ ИСПРАВЛЕНИЕ 3: Одинаковая высота
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
    flex: '1'
  };

  const secondaryButtonStyle = {
    background: 'transparent',
    color: '#9370DB',
    border: '2px solid #9370DB',
    padding: '15px 24px', // ✅ ИСПРАВЛЕНИЕ 3: Увеличили padding
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    minHeight: '54px', // ✅ ИСПРАВЛЕНИЕ 3: Одинаковая высота
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
    flex: '0 0 auto'
  };

  const disabledButtonStyle = {
    ...primaryButtonStyle,
    opacity: 0.6,
    cursor: 'not-allowed',
    background: 'linear-gradient(135deg, #cccccc 0%, #999999 100%)'
  };

  // Группы форм
  const formGroupStyle = {
    marginBottom: '20px'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '600',
    color: '#333',
    fontSize: '14px'
  };

  // Опции (радио-кнопки)
  const optionGroupStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginBottom: '20px'
  };

  const optionButtonStyle = {
    padding: '15px 12px',
    border: '2px solid #e1e5e9',
    borderRadius: '8px',
    background: 'white',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'all 0.3s ease',
    fontWeight: '500',
    fontSize: '16px',
    color: '#333', // ✅ ИСПРАВЛЕНИЕ 1: Явно указываем цвет текста
    minHeight: '54px', // ✅ ИСПРАВЛЕНИЕ 2: Одинаковая высота
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box'
  };

  const optionButtonSelectedStyle = {
    ...optionButtonStyle,
    borderColor: '#9370DB',
    background: 'rgba(147, 112, 219, 0.1)',
    color: '#9370DB',
    fontWeight: '600'
  };

  // Группа кнопок
  const buttonGroupStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '15px',
    marginTop: '25px'
  };

  // Ошибки
  const errorMessageStyle = {
    background: '#ff4757',
    color: 'white',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '15px',
    fontSize: '14px',
    textAlign: 'center'
  };

  // Результаты
  const resultsContainerStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90%',
    maxWidth: '600px',
    zIndex: 3
  };

  const resultCardStyle = {
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '16px',
    padding: '30px',
    marginBottom: '20px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)'
  };

  const resultItemStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid #f0f0f0'
  };

  const resultLabelStyle = {
    fontWeight: '500',
    color: '#666'
  };

  const resultValueStyle = {
    fontWeight: '600',
    color: '#333',
    fontSize: '16px'
  };

  const resultValueHighlightStyle = {
    ...resultValueStyle,
    color: '#9370DB',
    fontSize: '18px'
  };

  // Процессинг
  const processingContainerStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    textAlign: 'center',
    zIndex: 3
  };

  const spinnerStyle = {
    width: '60px',
    height: '60px',
    border: '4px solid rgba(255, 255, 255, 0.3)',
    borderTop: '4px solid white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 20px'
  };

  const processingTextStyle = {
    color: 'white',
    fontSize: '18px',
    marginBottom: '10px'
  };

  const processingSubtextStyle = {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: '14px'
  };

  // Успех
  const successMessageStyle = {
    textAlign: 'center',
    color: 'white',
    zIndex: 3,
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90%',
    maxWidth: '500px'
  };

  const successIconStyle = {
    fontSize: '64px',
    color: '#2ecc71',
    marginBottom: '20px'
  };

  const contactInfoStyle = {
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '12px',
    padding: '20px',
    margin: '20px 0',
    color: '#333',
    textAlign: 'left'
  };

  // Точки фона
  const dotStyle = (index) => ({
    position: 'absolute',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.2)',
    ...(index === 1 && { top: '10%', left: '10%' }),
    ...(index === 2 && { top: '20%', right: '15%' }),
    ...(index === 3 && { top: '30%', left: '25%' }),
    ...(index === 4 && { bottom: '15%', left: '15%' }),
    ...(index === 5 && { top: '5%', right: '20%' }),
    ...(index === 6 && { bottom: '25%', right: '10%' }),
    ...(index === 7 && { top: '45%', left: '5%' }),
    ...(index === 8 && { bottom: '5%', right: '30%' }),
    ...(index === 9 && { top: '60%', right: '25%' }),
    ...(index === 10 && { bottom: '40%', left: '30%' })
  });

  // Pi элемент - НОВАЯ АНИМАЦИЯ ПОЛЕТА ПО ЭКРАНУ
  const piWrapperStyle = {
    position: 'absolute',
    top: '0',
    left: '0',
    zIndex: 2,
    opacity: 0.4,
    animation: `piFloatAround ${moveDuration} ease-in-out infinite`
  };

  const piImageStyle = {
    width: '40px',
    height: '40px',
    opacity: 0.8,
    animation: `piRotate ${rotateDuration} linear infinite`
  };

  // ===== HELPERS =====

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

  useEffect(() => {
    loadApiConfig();
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

  // ===== API ФУНКЦИИ =====

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

  // ===== ОБРАБОТЧИКИ СОБЫТИЙ =====

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
      const response = await fetch('/api/proxy/carefuture/send_manager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: 'Заявка на консультацию - Калькулятор НСЖ',
          body: `
Новая заявка на консультацию по программе "Забота о будущем Ультра":

👤 Контактные данные:
• Фамилия: ${mgrSurname}
• Имя: ${mgrName}  
• Город: ${mgrCity}
• Email: ${email}

📊 Параметры расчета:
• Возраст: ${resultData?.inputParams?.age || 'Не указан'}
• Пол: ${resultData?.inputParams?.gender || 'Не указан'}
• Срок программы: ${resultData?.inputParams?.term || 'Не указан'} лет

💰 Результаты расчета:
• Страховой взнос: ${resultData?.results?.premiumAmount ? formatSum(resultData.results.premiumAmount.toString()) + ' руб.' : 'Не рассчитан'}
• Страховая сумма: ${resultData?.results?.insuranceSum ? formatSum(resultData.results.insuranceSum.toString()) + ' руб.' : 'Не рассчитана'}
• Накопленный капитал: ${resultData?.results?.accumulatedCapital ? formatSum(resultData.results.accumulatedCapital.toString()) + ' руб.' : 'Не рассчитан'}
• Доход по программе: ${resultData?.results?.programIncome ? formatSum(resultData.results.programIncome.toString()) + ' руб.' : 'Не рассчитан'}

🆔 ID расчета: ${calculationId || 'Отсутствует'}

Отправлено через калькулятор НСЖ на сайте.
          `
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

  function handleAmountChange(value) {
    const cleanValue = value.replace(/[^\d]/g, '');
    setAmountRaw(cleanValue);
    setAmountDisplay(formatSum(cleanValue));
  }

  // ===== РЕНДЕРИНГ =====

  // CSS анимации в стиле - ДОБАВЛЯЕМ НОВЫЕ АНИМАЦИИ ДЛЯ PI
  const animations = (
    <style>
      {`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes piRotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes piFloatAround {
          0% { 
            left: 10%; 
            top: 10%; 
            transform: scale(1); 
          }
          12.5% { 
            left: 80%; 
            top: 15%; 
            transform: scale(1.2); 
          }
          25% { 
            left: 85%; 
            top: 40%; 
            transform: scale(0.8); 
          }
          37.5% { 
            left: 70%; 
            top: 70%; 
            transform: scale(1.1); 
          }
          50% { 
            left: 40%; 
            top: 80%; 
            transform: scale(0.9); 
          }
          62.5% { 
            left: 15%; 
            top: 75%; 
            transform: scale(1.3); 
          }
          75% { 
            left: 5%; 
            top: 50%; 
            transform: scale(0.7); 
          }
          87.5% { 
            left: 20%; 
            top: 25%; 
            transform: scale(1.1); 
          }
          100% { 
            left: 10%; 
            top: 10%; 
            transform: scale(1); 
          }
        }
      `}
    </style>
  );

  // Страница ввода email
  if (stage === 'email') {
    return (
      <div style={mainContainerStyle}>
        {animations}
        
        {/* Фоновые точки */}
        {[1,2,3,4,5,6,7,8,9,10].map(n => (
          <div key={n} style={dotStyle(n)} />
        ))}
        
        {/* Pi элемент - НОВАЯ АНИМАЦИЯ */}
        <div style={piWrapperStyle}>
          <img src={piImage} style={piImageStyle} alt="Pi" />
        </div>
        
        <div style={overlayStyle} />
        
        {/* Логотип */}
        <div style={logoStyle}>
          <img src={logoImage} alt="Логотип РГС Жизнь" style={logoImageStyle} />
        </div>
        
        {/* Контент */}
        <div style={buttonsContainerStyle}>
          <h2 style={titleStyle}>
            Калькулятор НСЖ<br />
            «Забота о будущем Ультра»
          </h2>
          <p style={subtitleStyle}>
            Рассчитайте персональные условия накопительного страхования жизни
          </p>
          
          <div style={emailFormStyle}>
            <input
              type="email"
              placeholder="Введите ваш email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={emailError ? inputErrorStyle : inputStyle}
            />
            {emailError && <div style={errorMessageStyle}>{emailError}</div>}
            <button style={primaryButtonStyle} onClick={handleEmailSubmit}>
              Продолжить
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Форма параметров расчета
  if (stage === 'form') {
    return (
      <div style={mainContainerStyle}>
        {animations}
        
        {[1,2,3,4,5,6,7,8,9,10].map(n => (
          <div key={n} style={dotStyle(n)} />
        ))}
        
        <div style={piWrapperStyle}>
          <img src={piImage} style={piImageStyle} alt="Pi" />
        </div>
        
        <div style={overlayStyle} />
        
        <div style={logoStyle}>
          <img src={logoImage} alt="Логотип РГС Жизнь" style={logoImageStyle} />
        </div>
        
        <div style={formContainerStyle}>
          <h2 style={formTitleStyle}>Параметры расчёта</h2>
          
          {validationErrors.general && (
            <div style={errorMessageStyle}>{validationErrors.general}</div>
          )}
          
          {/* Дата рождения */}
          <div style={formGroupStyle}>
            <label style={labelStyle}>Дата рождения</label>
            <DateWheelPicker
              value={birthParts}
              onChange={(parts) => setBirthParts(parts)}
            />
            {validationErrors.birthDate && (
              <div style={errorMessageStyle}>{validationErrors.birthDate}</div>
            )}
          </div>

          {/* Пол */}
          <div style={formGroupStyle}>
            <label style={labelStyle}>Пол</label>
            <div style={optionGroupStyle}>
              <div 
                style={gender === 'мужской' ? optionButtonSelectedStyle : optionButtonStyle}
                onClick={() => setGender('мужской')}
              >
                Мужской
              </div>
              <div 
                style={gender === 'женский' ? optionButtonSelectedStyle : optionButtonStyle}
                onClick={() => setGender('женский')}
              >
                Женский
              </div>
            </div>
            {validationErrors.gender && (
              <div style={errorMessageStyle}>{validationErrors.gender}</div>
            )}
          </div>

          {/* Срок программы */}
          <div style={formGroupStyle}>
            <label style={labelStyle}>Срок программы (лет)</label>
            <select 
              value={programTerm} 
              onChange={(e) => setProgramTerm(Number(e.target.value))}
              style={inputStyle}
            >
              {[5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20].map(year => (
                <option key={year} value={year}>{year} лет</option>
              ))}
            </select>
          </div>

          {/* Тип расчета */}
          <div style={formGroupStyle}>
            <label style={labelStyle}>Тип расчета</label>
            <div style={optionGroupStyle}>
              <div 
                style={calcType === 'premium' ? optionButtonSelectedStyle : optionButtonStyle}
                onClick={() => setCalcType('premium')}
              >
                От взноса
              </div>
              <div 
                style={calcType === 'sum' ? optionButtonSelectedStyle : optionButtonStyle}
                onClick={() => setCalcType('sum')}
              >
                От страх. суммы
              </div>
            </div>
            {validationErrors.calcType && (
              <div style={errorMessageStyle}>{validationErrors.calcType}</div>
            )}
          </div>

          {/* Сумма */}
          <div style={formGroupStyle}>
            <label style={labelStyle}>
              {calcType === 'premium' ? 'Годовой страховой взнос (руб.)' : 'Страховая сумма (руб.)'}
            </label>
            <input
              type="text"
              placeholder={calcType === 'premium' ? 'Например: 960 000' : 'Например: 6 000 000'}
              value={amountDisplay}
              onChange={(e) => handleAmountChange(e.target.value)}
              style={validationErrors.amount ? inputErrorStyle : inputStyle}
            />
            {validationErrors.amount && (
              <div style={errorMessageStyle}>{validationErrors.amount}</div>
            )}
          </div>

          <div style={buttonGroupStyle}>
            <button style={secondaryButtonStyle} onClick={() => setStage('email')}>
              Назад
            </button>
            <button 
              style={(!birthDate || !gender || !calcType || !amountRaw.trim()) ? disabledButtonStyle : primaryButtonStyle}
              onClick={handleCalculate}
              disabled={!birthDate || !gender || !calcType || !amountRaw.trim()}
            >
              Рассчитать
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Обработка расчета
  if (stage === 'processing') {
    return (
      <div style={mainContainerStyle}>
        {animations}
        
        {[1,2,3,4,5,6,7,8,9,10].map(n => (
          <div key={n} style={dotStyle(n)} />
        ))}
        
        <div style={piWrapperStyle}>
          <img src={piImage} style={piImageStyle} alt="Pi" />
        </div>
        
        <div style={overlayStyle} />
        
        <div style={logoStyle}>
          <img src={logoImage} alt="Логотип РГС Жизнь" style={logoImageStyle} />
        </div>

        <div style={processingContainerStyle}>
          <div style={spinnerStyle}></div>
          <div style={processingTextStyle}>Выполняется расчет...</div>
          <div style={processingSubtextStyle}>Анализируем ваши параметры</div>
        </div>
      </div>
    );
  }

  // Результаты расчета
  if (stage === 'result') {
    if (!resultData) {
      return (
        <div style={mainContainerStyle}>
          <div style={errorMessageStyle}>Нет данных для отображения</div>
        </div>
      );
    }

    const carouselData = [
      {
        title: 'Основные результаты',
        items: [
          { label: 'Годовой взнос', value: `${formatSum(resultData.results.premiumAmount.toString())} руб.`, highlight: true },
          { label: 'Страховая сумма', value: `${formatSum(resultData.results.insuranceSum.toString())} руб.`, highlight: true },
          { label: 'Накопленный капитал', value: `${formatSum(resultData.results.accumulatedCapital.toString())} руб.` },
          { label: 'Доход по программе', value: `${formatSum(resultData.results.programIncome.toString())} руб.` },
          { label: 'Налоговый вычет', value: `${formatSum(resultData.results.taxDeduction.toString())} руб.` }
        ]
      },
      {
        title: 'Выкупные суммы',
        items: resultData.redemptionValues.slice(0, 5).map(item => ({
          label: `${item.year} год`,
          value: `${formatSum(item.redemption_amount.toString())} руб.`
        }))
      }
    ];

    return (
      <div style={mainContainerStyle}>
        {animations}
        
        {[1,2,3,4,5,6,7,8,9,10].map(n => (
          <div key={n} style={dotStyle(n)} />
        ))}
        
        <div style={piWrapperStyle}>
          <img src={piImage} style={piImageStyle} alt="Pi" />
        </div>
        
        <div style={overlayStyle} />
        
        <div style={logoStyle}>
          <img src={logoImage} alt="Логотип РГС Жизнь" style={logoImageStyle} />
        </div>

        <div style={resultsContainerStyle}>
          <div style={resultCardStyle}>
            <div style={formTitleStyle}>{carouselData[carouselIndex].title}</div>
            
            {carouselData[carouselIndex].items.map((item, idx) => (
              <div key={idx} style={{...resultItemStyle, borderBottom: idx === carouselData[carouselIndex].items.length - 1 ? 'none' : '1px solid #f0f0f0'}}>
                <div style={resultLabelStyle}>{item.label}</div>
                <div style={item.highlight ? resultValueHighlightStyle : resultValueStyle}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          {carouselData.length > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
              {carouselData.map((_, idx) => (
                <div 
                  key={idx}
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: carouselIndex === idx ? '#9370DB' : 'rgba(147, 112, 219, 0.3)',
                    cursor: 'pointer',
                    transition: 'background 0.3s ease'
                  }}
                  onClick={() => setCarouselIndex(idx)}
                />
              ))}
            </div>
          )}

          <div style={buttonGroupStyle}>
            <button style={secondaryButtonStyle} onClick={() => setStage('form')}>
              Изменить параметры
            </button>
            <button style={primaryButtonStyle} onClick={() => setStage('manager')}>
              Связаться с менеджером
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Форма связи с менеджером
  if (stage === 'manager') {
    return (
      <div style={mainContainerStyle}>
        {animations}
        
        {[1,2,3,4,5,6,7,8,9,10].map(n => (
          <div key={n} style={dotStyle(n)} />
        ))}
        
        <div style={piWrapperStyle}>
          <img src={piImage} style={piImageStyle} alt="Pi" />
        </div>
        
        <div style={overlayStyle} />
        
        <div style={logoStyle}>
          <img src={logoImage} alt="Логотип РГС Жизнь" style={logoImageStyle} />
        </div>

        <div style={formContainerStyle}>
          <h2 style={formTitleStyle}>Связаться с менеджером</h2>
          <p style={{ ...subtitleStyle, color: '#666', textShadow: 'none' }}>
            Наш специалист свяжется с вами для консультации
          </p>

          <div style={formGroupStyle}>
            <input 
              type="text" 
              placeholder="Фамилия" 
              value={mgrSurname} 
              onChange={(e) => setMgrSurname(e.target.value)}
              style={inputStyle}
            />
          </div>
          
          <div style={formGroupStyle}>
            <input 
              type="text" 
              placeholder="Имя" 
              value={mgrName} 
              onChange={(e) => setMgrName(e.target.value)}
              style={inputStyle}
            />
          </div>
          
          <div style={formGroupStyle}>
            <input 
              type="text" 
              placeholder="Город" 
              value={mgrCity} 
              onChange={(e) => setMgrCity(e.target.value)}
              style={inputStyle}
            />
          </div>

          {mgrError && <div style={errorMessageStyle}>{mgrError}</div>}

          <div style={buttonGroupStyle}>
            <button 
              style={isSendingMgr ? disabledButtonStyle : secondaryButtonStyle} 
              onClick={() => setStage('result')} 
              disabled={isSendingMgr}
            >
              Назад
            </button>
            <button 
              style={(isSendingMgr || !mgrSurname.trim() || !mgrName.trim() || !mgrCity.trim()) ? disabledButtonStyle : primaryButtonStyle}
              onClick={handleManagerSubmit} 
              disabled={isSendingMgr || !mgrSurname.trim() || !mgrName.trim() || !mgrCity.trim()}
            >
              {isSendingMgr ? 'Отправляем...' : 'Отправить'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Успешная отправка заявки
  if (stage === 'manager-sent') {
    return (
      <div style={mainContainerStyle}>
        {animations}
        
        {[1,2,3,4,5,6,7,8,9,10].map(n => (
          <div key={n} style={dotStyle(n)} />
        ))}
        
        <div style={piWrapperStyle}>
          <img src={piImage} style={piImageStyle} alt="Pi" />
        </div>
        
        <div style={overlayStyle} />
        
        <div style={logoStyle}>
          <img src={logoImage} alt="Логотип РГС Жизнь" style={logoImageStyle} />
        </div>

        <div style={successMessageStyle}>
          <div style={successIconStyle}>✓</div>
          <h2 style={titleStyle}>Заявка отправлена!</h2>
          <p style={subtitleStyle}>
            Наш менеджер свяжется с вами в ближайшее время для консультации по программе 
            «Забота о будущем Ультра»
          </p>
          
          <div style={contactInfoStyle}>
            <p><strong>Ваши данные:</strong></p>
            <p>{mgrSurname} {mgrName}</p>
            <p>Город: {mgrCity}</p>
            <p>Email: {email}</p>
            {calculationId && <p>ID расчёта: {calculationId.slice(0, 8)}...</p>}
          </div>

          <div style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
            <button style={primaryButtonStyle} onClick={() => navigate('/')}>
              На главную
            </button>
            <button style={secondaryButtonStyle} onClick={() => {
              // Сброс всех состояний для нового расчета
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
              setEmailError('');
              setMgrError('');
            }}>
              Новый расчёт
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Fallback на случай ошибки
  return (
    <div style={mainContainerStyle}>
      <div style={errorMessageStyle}>
        Произошла ошибка. Попробуйте обновить страницу.
      </div>
    </div>
  );
}












































