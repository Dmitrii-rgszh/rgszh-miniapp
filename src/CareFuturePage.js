// CareFuturePage.js - ИСПРАВЛЕННАЯ НАВИГАЦИЯ
// ✅ Добавлено поле выбора дохода в год
// ✅ Логика расчета налогового вычета по доходам
// ✅ Новая страница карусели с покрытиями между существующими
// ✅ ИСПРАВЛЕНА НАВИГАЦИЯ - БЕЗ ПРОСКАКИВАНИЯ СТРАНИЦ

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
import './Styles/ProgressIndicator.css';
import './Styles/cards.css';

export default function CareFuturePage() {
  const navigate = useNavigate();
  const logoRef = useRef(null);
  const nextRef = useRef(null);
  const emailInputRef = useRef(null);
  
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
  
  // Состояние для дохода в год
  const [yearlyIncome, setYearlyIncome] = useState('');
  
  // Результаты
  const [resultData, setResultData] = useState(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [calculationId, setCalculationId] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  
  // Состояние для предотвращения быстрых кликов по карусели
  const [carouselNavigating, setCarouselNavigating] = useState(false);
  
  // Данные менеджера
  const [mgrSurname, setMgrSurname] = useState('');
  const [mgrName, setMgrName] = useState('');
  const [mgrCity, setMgrCity] = useState('');
  const [mgrError, setMgrError] = useState('');
  const [isSendingMgr, setIsSendingMgr] = useState(false);
  const [hasCalculated, setHasCalculated] = useState(false);

  // ===== НОВЫЕ СОСТОЯНИЯ ДЛЯ ЗАЩИТЫ НАВИГАЦИИ =====
  const [isNavigating, setIsNavigating] = useState(false);
  const [stageHistory, setStageHistory] = useState(['email']);

  // ===== ЗАЩИЩЕННАЯ ФУНКЦИЯ ИЗМЕНЕНИЯ STAGE =====
  const setStageProtected = (newStage, source = 'unknown') => {
    console.log(`🔄 Stage change: ${stage} → ${newStage} (source: ${source})`);
    
    // Предотвращаем быстрые переключения
    if (isNavigating) {
      console.warn('⚠️ Navigation blocked - already navigating');
      return;
    }
    
    setIsNavigating(true);
    setStage(newStage);
    
    // Обновляем историю переходов
    setStageHistory(prev => [...prev, newStage].slice(-5));
    
    // Разблокируем навигацию через 300ms
    setTimeout(() => {
      setIsNavigating(false);
    }, 300);
  };

  // ===== СБРОС СОСТОЯНИЯ ПРИ МОНТИРОВАНИИ =====
  useEffect(() => {
    setIsExiting(false);
    setCarouselNavigating(false);
    setIsNavigating(false);
  }, []);

  // ===== СБРОС НАВИГАЦИИ КАРУСЕЛИ ПРИ СМЕНЕ STAGE =====
  useEffect(() => {
    if (stage !== 'result') {
      setCarouselNavigating(false);
      setCarouselIndex(0);
    }
  }, [stage]);

  // ===== ОТЛАДОЧНЫЙ useEffect ДЛЯ МОНИТОРИНГА ИЗМЕНЕНИЙ STAGE =====
  useEffect(() => {
    console.log(`🎯 Stage changed to: ${stage}`);
    console.log('Navigation state:', { isNavigating, isExiting, hasCalculated });
    console.log('Data state:', { 
      hasResultData: !!resultData, 
      hasEmail: !!email, 
      hasBirthDate: !!birthDate,
      hasGender: !!gender
    });
  }, [stage, isNavigating, isExiting, hasCalculated, resultData, email, birthDate, gender]);

  // ===== АГРЕССИВНОЕ ИСПРАВЛЕНИЕ INPUT ПОЛЕЙ =====
  useEffect(() => {
    const aggressiveInputFix = () => {
      const cardInputs = document.querySelectorAll('.card-container input[type="email"], .card-container input[type="text"], .card-container input[type="password"], .card-container select');
      
      cardInputs.forEach((input) => {
        Object.assign(input.style, {
          position: 'relative',
          zIndex: '9999',
          pointerEvents: 'auto',
          cursor: input.tagName === 'SELECT' ? 'pointer' : 'text',
          userSelect: 'auto',
          WebkitUserSelect: 'auto',
          touchAction: 'manipulation',
          WebkitTouchCallout: 'auto',
          display: 'block',
          width: '100%',
          height: 'auto',
          minHeight: '32px',
          opacity: '1',
          visibility: 'visible',
          fontSize: '14px',
          transform: 'scale(1)',
          transformOrigin: 'center',
          background: '#f0f2f5',
          border: '1px solid #e3e7ee',
          borderRadius: '8px',
          padding: '6px 10px',
          color: '#333',
          textAlign: 'center',
          fontFamily: '"Segoe UI", sans-serif',
          lineHeight: '1.4',
          boxSizing: 'border-box',
          outline: 'none',
          WebkitAppearance: 'none',
          appearance: 'none'
        });
        
        const forceClickHandler = (e) => {
          e.stopPropagation();
          input.focus();
        };
        
        const forceFocusHandler = (e) => {
          Object.assign(input.style, {
            borderColor: 'rgb(180, 0, 55)',
            boxShadow: '0 0 0 3px rgba(180, 0, 55, 0.1)',
            background: 'white'
          });
        };
        
        const forceBlurHandler = (e) => {
          Object.assign(input.style, {
            borderColor: '#e3e7ee',
            boxShadow: 'none',
            background: '#f5f7fa'
          });
        };
        
        input.removeEventListener('click', forceClickHandler);
        input.removeEventListener('focus', forceFocusHandler);
        input.removeEventListener('blur', forceBlurHandler);
        
        input.addEventListener('click', forceClickHandler, { passive: false });
        input.addEventListener('focus', forceFocusHandler, { passive: false });
        input.addEventListener('blur', forceBlurHandler, { passive: false });
        input.addEventListener('touchstart', forceClickHandler, { passive: false });
        input.addEventListener('pointerdown', forceClickHandler, { passive: false });
      });
    };
    
    const timer1 = setTimeout(aggressiveInputFix, 100);
    const timer2 = setTimeout(aggressiveInputFix, 500);
    const timer3 = setTimeout(aggressiveInputFix, 1000);
    
    const observer = new MutationObserver(() => {
      setTimeout(aggressiveInputFix, 50);
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      observer.disconnect();
    };
  }, [stage]);

  // ===== ДОПОЛНИТЕЛЬНОЕ ИСПРАВЛЕНИЕ ДЛЯ EMAIL ПОЛЯ =====
  useEffect(() => {
    if (stage === 'email' && emailInputRef.current) {
      const emailInput = emailInputRef.current;
      
      const forceEmailClickability = () => {
        Object.assign(emailInput.style, {
          position: 'relative',
          zIndex: '99999',
          pointerEvents: 'auto',
          cursor: 'text',
          userSelect: 'auto',
          WebkitUserSelect: 'auto',
          touchAction: 'manipulation',
          display: 'block',
          width: '100%',
          height: '32px',
          fontSize: '14px',
          transform: 'scale(1)',
          opacity: '1',
          visibility: 'visible'
        });
      };
      
      forceEmailClickability();
      
      const handleEmailClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        emailInput.focus();
        emailInput.click();
      };
      
      emailInput.addEventListener('touchstart', handleEmailClick, { passive: false });
      emailInput.addEventListener('mousedown', handleEmailClick, { passive: false });
      emailInput.addEventListener('pointerdown', handleEmailClick, { passive: false });
      
      return () => {
        emailInput.removeEventListener('touchstart', handleEmailClick);
        emailInput.removeEventListener('mousedown', handleEmailClick);
        emailInput.removeEventListener('pointerdown', handleEmailClick);
      };
    }
  }, [stage]);

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

  // ===== НАВИГАЦИЯ ПО КАРУСЕЛИ =====
  const navigateCarousel = (direction) => {
    if (carouselNavigating) return;

    setCarouselNavigating(true);
    
    const carouselData = getCarouselData();
    const currentIndex = carouselIndex;
    
    let newIndex;
    if (direction === 'next') {
      newIndex = Math.min(carouselData.length - 1, currentIndex + 1);
    } else {
      newIndex = Math.max(0, currentIndex - 1);
    }
    
    if (newIndex !== currentIndex) {
      setCarouselIndex(newIndex);
    }
    
    setTimeout(() => {
      setCarouselNavigating(false);
    }, 500);
  };

  const goToCarouselSlide = (index) => {
    if (carouselNavigating) return;

    const carouselData = getCarouselData();
    const safeIndex = Math.max(0, Math.min(carouselData.length - 1, index));
    
    if (safeIndex !== carouselIndex) {
      setCarouselNavigating(true);
      setCarouselIndex(safeIndex);
      
      setTimeout(() => {
        setCarouselNavigating(false);
      }, 500);
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

  // ===== ВАЛИДАЦИЯ EMAIL =====
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return false;
    }
    
    const lowerEmail = email.toLowerCase();
    const isVtbEmail = lowerEmail.endsWith('@vtb.ru');
    const isRgslEmail = lowerEmail.endsWith('@rgsl.ru');
    
    return isVtbEmail || isRgslEmail;
  };

  // ===== ВАЛИДАЦИЯ ФОРМЫ =====
  const validateForm = () => {
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
      return validateEmail(email);
    } else if (stage === 'form') {
      return birthDate && gender && calcType && amountRaw && parseInt(amountRaw) > 0 && yearlyIncome;
    }
    return false;
  };

  // ===== ПРОСТАЯ И НАДЕЖНАЯ ФУНКЦИЯ handleBack =====
  const handleBack = () => {
    console.log('🔙 handleBack clicked, current stage:', stage);
    
    if (isExiting || isNavigating) {
      console.log('⚠️ Navigation blocked');
      return;
    }
    
    // ✅ ПРОСТАЯ ЛОГИКА БЕЗ УСЛОВИЙ
    switch (stage) {
      case 'email':
        console.log('📧 Email → Employee page');
        setIsExiting(true);
        if (logoRef.current) {
          logoRef.current.classList.add('animate-logo-exit');
        }
        setTimeout(() => navigate('/employee'), 800);
        break;
        
      case 'form':
        console.log('📝 Form → Email');
        setStageProtected('email', 'handleBack-form');
        break;
        
      case 'result':
        console.log('📊 Result → Form');
        setStageProtected('form', 'handleBack-result');
        setCarouselIndex(0);
        setCarouselNavigating(false);
        break;
        
      case 'manager':
        console.log('👤 Manager → Result');
        setStageProtected('result', 'handleBack-manager');
        setMgrError('');
        break;
        
      case 'manager-sent':
        console.log('✅ Manager-sent → Result');
        setStageProtected('result', 'handleBack-manager-sent');
        break;
        
      default:
        console.log('❓ Unknown stage → Employee page');
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
    
    console.log('📧 Email submit clicked');
    
    if (isNavigating) {
      console.log('⚠️ Email submit blocked - already navigating');
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
    console.log('📧 Email → Form');
    setStageProtected('form', 'handleEmailSubmit');
  };

  // ===== РАСЧЕТ =====
  const handleCalculate = async () => {
    console.log('🧮 Calculate clicked');
    
    if (isNavigating) {
      console.log('⚠️ Calculate blocked - already navigating');
      return;
    }
    
    if (!birthDate) {
      console.error('birthDate is null!');
      setValidationErrors({ birthDate: 'Укажите дату рождения' });
      return;
    }
    
    if (!validateForm()) return;

    setStageProtected('processing', 'handleCalculate-start');

    try {
      const formattedDate = birthDate instanceof Date 
        ? birthDate.toISOString().split('T')[0]
        : new Date(birthDate).toISOString().split('T')[0];
      
      const requestData = {
        birthDate: formattedDate,
        gender: gender,
        contractTerm: programTerm,
        calculationType: calcType,
        inputAmount: parseInt(amountRaw),
        email: email,
        yearlyIncome: yearlyIncome
      };

      console.log('🧮 Отправляем данные на сервер для расчета НСЖ:', requestData);

      const data = await apiCall('/api/care-future/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      console.log('✅ Ответ сервера получен:', data);

      if (data.success) {
        const customTaxDeduction = calculateTaxDeduction(
          data.results.premiumAmount,
          data.inputParameters.contractTerm,
          yearlyIncome
        );

        const processedResultData = {
          insurance_amount_formatted: data.results.insuranceSum.toLocaleString('ru-RU') + ' ₽',
          single_premium_formatted: data.results.premiumAmount.toLocaleString('ru-RU') + ' ₽',
          contract_term: data.inputParameters.contractTerm,
          age: data.inputParameters.ageAtStart,
          accumulated_capital: data.results.accumulatedCapital,
          program_income: data.results.programIncome,
          tax_deduction: customTaxDeduction,
          premium_amount: data.results.premiumAmount,
          insurance_sum: data.results.insuranceSum
        };

        setResultData(processedResultData);
        setCalculationId(data.calculationId);
        setHasCalculated(true); // ✅ ВАЖНО!
        
        setCarouselIndex(0);
        setCarouselNavigating(false);
        
        console.log('✅ Данные результата обработаны и сохранены:', processedResultData);
        console.log('✅ Флаг hasCalculated установлен в true');
        
        setTimeout(() => {
          console.log('🧮 Processing → Result');
          setStageProtected('result', 'handleCalculate-success');
        }, 2000);
        
      } else {
        throw new Error(data.error || 'Ошибка расчета');
      }
    } catch (error) {
      console.error('❌ Ошибка расчета НСЖ:', error);
      
      if (error.message.includes('400')) {
        setValidationErrors({ general: 'Минимальный взнос ниже допустимого' });
      } else if (error.message.includes('500')) {
        setValidationErrors({ general: 'Ошибка сервера. Попробуйте позже.' });
      } else {
        setValidationErrors({ general: error.message || 'Ошибка при выполнении расчета' });
      }
      
      console.log('❌ Processing → Form (error)');
      setStageProtected('form', 'handleCalculate-error');
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

      console.log('Ответ сервера:', data);

      if (data && data.success) {
        setStageProtected('manager-sent', 'handleManagerSubmit-success');
      } else {
        throw new Error(data?.message || 'Ошибка отправки');
      }
    } catch (error) {
      console.error('Ошибка отправки заявки:', error);
      
      if (error.message && error.message.includes('json is not a function')) {
        console.warn('Ошибка обработки ответа. Заявка была отправлена.');
        setStageProtected('manager-sent', 'handleManagerSubmit-json-error');
        return;
      }
      
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
            value: resultData.tax_deduction.toLocaleString('ru-RU') + ' ₽'
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
            value: 'в размере уплаченных взносов на дату страхового случая'
          },
          { 
            label: 'Инвалидность I,II по ЛП:', 
            value: 'освобождение от уплаты взносов'
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
    'card-positioned',
    contentAnimated ? 'animated' : '',
    isExiting ? 'exiting' : ''
  ].filter(Boolean).join(' ');

  const getNextButtonClasses = () => {
    const canProceed = isNextButtonReady();
    
    return [
      'next-btn',
      canProceed && contentAnimated ? 'animate-next' : '',
      isExiting ? 'animate-next-exit' : '',
      !canProceed ? 'disabled' : ''
    ].filter(Boolean).join(' ');
  };

  const getShakerClasses = () => {
    const isReady = isNextButtonReady();
    
    return [
      'shaker',
      isReady && contentAnimated ? 'shake-btn' : ''
    ].filter(Boolean).join(' ');
  };

  // ===== СТИЛИ ДЛЯ INPUT =====
  const getInputStyle = (isEmail = false) => ({
    position: 'relative',
    zIndex: isEmail ? '99999' : '9999',
    pointerEvents: 'auto',
    cursor: 'text',
    userSelect: 'auto',
    WebkitUserSelect: 'auto',
    touchAction: 'manipulation',
    WebkitTouchCallout: 'auto',
    WebkitTapHighlightColor: 'rgba(180, 0, 55, 0.2)',
    display: 'block',
    width: '100%',
    height: '32px',
    minHeight: '32px',
    opacity: '1',
    visibility: 'visible',
    fontSize: '14px',
    transform: 'scale(1)',
    transformOrigin: 'center',
    background: '#f0f2f5',
    border: '1px solid #e3e7ee',
    borderRadius: '8px',
    padding: '6px 10px',
    color: '#333',
    textAlign: 'center',
    fontFamily: '"Segoe UI", sans-serif',
    lineHeight: '1.4',
    boxSizing: 'border-box',
    outline: 'none',
    WebkitAppearance: 'none',
    appearance: 'none',
    transition: 'all 0.3s ease'
  });

  const getSelectStyle = () => ({
    ...getInputStyle(),
    cursor: 'pointer',
    backgroundImage: 'url("data:image/svg+xml;utf8,<svg fill=\'%23333\' height=\'20\' viewBox=\'0 0 24 24\' width=\'20\' xmlns=\'http://www.w3.org/2000/svg\'><path d=\'M7 10l5 5 5-5z\'/></svg>")',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 6px center',
    backgroundSize: '14px',
    paddingRight: '28px'
  });

  // ===== РЕНДЕР КОНТЕНТА =====
  const renderContent = () => {
    console.log(`🎨 Rendering content for stage: ${stage}`);
    
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
                ref={emailInputRef}
                type="email"
                className={`form-input ${emailError ? 'error' : ''}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@mail.ru"
                style={getInputStyle(true)}
                onFocus={(e) => {
                  Object.assign(e.target.style, {
                    borderColor: 'rgb(180, 0, 55)',
                    boxShadow: '0 0 0 3px rgba(180, 0, 55, 0.1)',
                    background: 'white'
                  });
                }}
                onBlur={(e) => {
                  Object.assign(e.target.style, {
                    borderColor: '#e3e7ee',
                    boxShadow: 'none',
                    background: '#f0f2f5'
                  });
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  e.target.focus();
                }}
                onTouchStart={(e) => {
                  e.stopPropagation();
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
              <div className="form-group" style={{ marginBottom: '8px' }}>
                <label className="form-label text-label" style={{ marginBottom: '4px' }}>
                  Дата рождения
                </label>
                <DateWheelPicker 
                  value={birthParts}
                  onChange={setBirthParts}
                />
                {validationErrors.birthDate && (
                  <span className="form-error">{validationErrors.birthDate}</span>
                )}
              </div>

              {/* Пол */}
              <div className="form-group" style={{ marginBottom: '8px' }}>
                <label className="form-label text-label">Пол</label>
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  justifyContent: 'center',
                  width: '100%',
                  marginTop: '2px'
                }}>
                  <button
                    type="button"
                    style={{
                      padding: '8px 16px',
                      minHeight: '36px',
                      border: gender === 'male' ? '2px solid rgb(180, 0, 55)' : '2px solid rgb(152, 164, 174)',
                      borderRadius: '8px',
                      background: gender === 'male' ? 'rgb(180, 0, 55)' : 'white',
                      color: gender === 'male' ? 'white' : 'rgb(152, 164, 174)',
                      fontFamily: 'Segoe UI, sans-serif',
                      fontSize: '15px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      flex: '1',
                      outline: 'none'
                    }}
                    onClick={() => setGender('male')}
                  >
                    Мужской
                  </button>
                  <button
                    type="button"
                    style={{
                      padding: '8px 16px',
                      minHeight: '36px',
                      border: gender === 'female' ? '2px solid rgb(180, 0, 55)' : '2px solid rgb(152, 164, 174)',
                      borderRadius: '8px',
                      background: gender === 'female' ? 'rgb(180, 0, 55)' : 'white',
                      color: gender === 'female' ? 'white' : 'rgb(152, 164, 174)',
                      fontFamily: 'Segoe UI, sans-serif',
                      fontSize: '15px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      flex: '1',
                      outline: 'none'
                    }}
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
              <div className="form-group" style={{ marginBottom: '8px' }}>
                <label className="form-label text-label">Срок программы (лет)</label>
                <div style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  marginTop: '4px',
                  padding: '4px 0'
                }}>
                  <div style={{
                    position: 'relative',
                    flex: '1',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <input
                      type="range"
                      min="5"
                      max="30"
                      step="1"
                      value={programTerm}
                      onChange={(e) => {
                        console.log('Slider changed to:', e.target.value);
                        setProgramTerm(parseInt(e.target.value));
                      }}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                      }}
                      onTouchMove={(e) => {
                        e.stopPropagation();
                      }}
                      style={{
                        width: '100%',
                        height: '8px',
                        borderRadius: '4px',
                        background: `linear-gradient(to right, rgb(180, 0, 55) 0%, rgb(180, 0, 55) ${((programTerm - 5) / 25) * 100}%, #e5e5e5 ${((programTerm - 5) / 25) * 100}%, #e5e5e5 100%)`,
                        outline: 'none',
                        cursor: 'pointer',
                        WebkitAppearance: 'none',
                        appearance: 'none',
                        position: 'relative',
                        zIndex: '1000',
                        touchAction: 'none',
                        userSelect: 'none',
                        WebkitUserSelect: 'none'
                      }}
                    />
                  </div>
                  <div style={{
                    padding: '6px 12px',
                    background: 'rgb(180, 0, 55)',
                    color: 'white',
                    borderRadius: '16px',
                    fontSize: '14px',
                    fontWeight: '600',
                    fontFamily: 'Segoe UI, sans-serif',
                    minWidth: '40px',
                    textAlign: 'center',
                    flexShrink: 0
                  }}>
                    {programTerm}
                  </div>
                </div>
              </div>

              {/* Тип расчёта */}
              <div className="form-group" style={{ marginBottom: '4px' }}>
                <label className="form-label text-label" style={{ marginBottom: '4px' }}>Тип расчёта</label>
                <div style={{
                  display: 'flex',
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: '8px',
                  width: '100%',
                  marginTop: '2px'
                }}>
                  <button
                    type="button"
                    style={{
                      padding: '8px 12px',
                      minHeight: '44px',
                      border: calcType === 'from_premium' ? '2px solid rgb(180, 0, 55)' : '2px solid rgb(152, 164, 174)',
                      borderRadius: '8px',
                      background: calcType === 'from_premium' ? 'rgb(180, 0, 55)' : 'white',
                      color: calcType === 'from_premium' ? 'white' : 'rgb(152, 164, 174)',
                      fontFamily: 'Segoe UI, sans-serif',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      outline: 'none',
                      textAlign: 'center',
                      flex: '1',
                      minWidth: '140px',
                      whiteSpace: 'normal',
                      wordWrap: 'break-word',
                      lineHeight: '1.2'
                    }}
                    onClick={() => setCalcType('from_premium')}
                  >
                    Рассчитать по размеру взноса
                  </button>
                  <button
                    type="button"
                    style={{
                      padding: '8px 12px',
                      minHeight: '44px',
                      border: calcType === 'from_sum' ? '2px solid rgb(180, 0, 55)' : '2px solid rgb(152, 164, 174)',
                      borderRadius: '8px',
                      background: calcType === 'from_sum' ? 'rgb(180, 0, 55)' : 'white',
                      color: calcType === 'from_sum' ? 'white' : 'rgb(152, 164, 174)',
                      fontFamily: 'Segoe UI, sans-serif',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      outline: 'none',
                      textAlign: 'center',
                      flex: '1',
                      minWidth: '140px',
                      whiteSpace: 'normal',
                      wordWrap: 'break-word',
                      lineHeight: '1.2'
                    }}
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
              <div className="form-group" style={{ marginBottom: '8px' }}>
                <label className="form-label text-label" style={{ marginBottom: '4px' }}>
                  {calcType === 'from_premium' ? 'Размер взноса' : 'Страховая сумма'} (₽)
                </label>
                <input
                  type="text"
                  className={`form-input ${validationErrors.amount ? 'error' : ''}`}
                  value={amountDisplay}
                  onChange={handleAmountChange}
                  placeholder={
                    calcType === 'from_premium' 
                      ? 'от 100 000 рублей' 
                      : calcType === 'from_sum' 
                        ? 'Введите сумму'
                        : '1 000 000'
                  }
                  style={{
                    ...getInputStyle(),
                    marginTop: '4px'
                  }}
                />
                {validationErrors.amount && (
                  <span className="form-error">{validationErrors.amount}</span>
                )}
              </div>

              {/* Доход в год */}
              <div className="form-group" style={{ marginBottom: '8px' }}>
                <label className="form-label text-label" style={{ marginBottom: '4px' }}>
                  Мой доход в год:
                </label>
                <select
                  className={`form-input ${validationErrors.yearlyIncome ? 'error' : ''}`}
                  value={yearlyIncome}
                  onChange={(e) => setYearlyIncome(e.target.value)}
                  style={{
                    ...getSelectStyle(),
                    marginTop: '4px'
                  }}
                  onFocus={(e) => {
                    Object.assign(e.target.style, {
                      borderColor: 'rgb(180, 0, 55)',
                      boxShadow: '0 0 0 3px rgba(180, 0, 55, 0.1)',
                      background: 'white'
                    });
                  }}
                  onBlur={(e) => {
                    Object.assign(e.target.style, {
                      borderColor: '#e3e7ee',
                      boxShadow: 'none',
                      background: '#f0f2f5'
                    });
                  }}
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
        
        if (!carouselData || carouselData.length === 0) {
          return (
            <div className={getCardClasses()}>
              <div className="processing-container">
                <h2 className="text-h2">Загрузка результатов...</h2>
              </div>
            </div>
          );
        }
        
        const safeCarouselIndex = Math.min(carouselIndex, carouselData.length - 1);
        const currentSlide = carouselData[safeCarouselIndex];
        
        if (!currentSlide) {
          return (
            <div className={getCardClasses()}>
              <div className="processing-container">
                <h2 className="text-h2">Ошибка загрузки данных</h2>
              </div>
            </div>
          );
        }
        
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
              <div className="carousel-navigation-bottom">
                {safeCarouselIndex > 0 && (
                  <button 
                    type="button"
                    className={`carousel-arrow carousel-arrow-left ${carouselNavigating ? 'disabled' : ''}`}
                    onClick={() => navigateCarousel('prev')}
                    disabled={carouselNavigating}
                    aria-label="Предыдущий слайд"
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
                )}
                
                <div className="carousel-dots">
                  {carouselData.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`carousel-dot ${idx === safeCarouselIndex ? 'active' : ''} ${carouselNavigating ? 'disabled' : ''}`}
                      onClick={() => goToCarouselSlide(idx)}
                      disabled={carouselNavigating}
                      aria-label={`Слайд ${idx + 1}`}
                    />
                  ))}
                </div>
                
                {safeCarouselIndex < carouselData.length - 1 && (
                  <button 
                    type="button"
                    className={`carousel-arrow carousel-arrow-right ${carouselNavigating ? 'disabled' : ''}`}
                    onClick={() => navigateCarousel('next')}
                    disabled={carouselNavigating}
                    aria-label="Следующий слайд"
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
                )}
              </div>
            </div>

            <div className="card-footer">
              <button
                type="button"
                className="btn-universal btn-primary btn-large btn-fullwidth"
                onClick={(e) => {
                  createRipple(e);
                  setStageProtected('manager', 'contact-manager-button');
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
                  style={getInputStyle()}
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
                  style={getInputStyle()}
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
                  style={getInputStyle()}
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
      {/* Логотип */}
      <div ref={logoRef} className={getLogoClasses()}>
        <img
          src={logoImage}
          alt="Логотип РГС Жизнь"
          className="logo-image"
        />
      </div>

      {/* Кнопка "Назад" */}
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

      {/* Кнопка "Далее" */}
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
          disabled={!isNextButtonReady()}
        >
          <div className={getShakerClasses()}>
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