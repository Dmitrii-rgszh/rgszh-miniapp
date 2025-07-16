// CareFuturePage_updated.js - ОБНОВЛЕННАЯ ВЕРСИЯ с исправленной логикой расчетов НСЖ

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Импортируем только изображения
import logoImage from './components/logo.png';
import backgroundImage from './components/background.png';
import piImage from './components/pi.png';
import DateWheelPicker from './DateWheelPicker';

const getViewportHeight = () => {
  // Используем реальную высоту окна вместо 100vh
  return window.innerHeight;
};

// Функция определения мобильного браузера
const isMobile = () => {
  return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export default function CareFuturePage() {
  const navigate = useNavigate();

  // Стейт для анимаций
  const [logoAnimated, setLogoAnimated] = useState(false);
  const [buttonsAnimated, setButtonsAnimated] = useState(false);
  const [moveDuration] = useState('70s');
  const [rotateDuration] = useState('6s');
  const [isExiting, setIsExiting] = useState(false);

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
  const [validationErrors, setValidationErrors] = useState({});

  // ===== Состояния для «Связаться с менеджером» =====
  const [mgrSurname, setMgrSurname] = useState('');
  const [mgrName, setMgrName] = useState('');
  const [mgrCity, setMgrCity] = useState('');
  const [mgrError, setMgrError] = useState('');
  const [isSendingMgr, setIsSendingMgr] = useState(false);

  // ===== Конфигурация и настройки =====
  const [apiConfig, setApiConfig] = useState(null);

  // CSS-анимации как строки
  const animationsStyle = `
    @keyframes fadeInDown {
      from {
        opacity: 0;
        transform: translate3d(0, -100%, 0);
      }
      to {
        opacity: 1;
        transform: translate3d(0, 0, 0);
      }
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateX(-50%) translateY(100px);
      }
      to {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
    }

    @keyframes piFloatAround {
      0% { transform: translate(0px, 0px) rotate(0deg); }
      25% { transform: translate(150px, 50px) rotate(90deg); }
      50% { transform: translate(50px, 150px) rotate(180deg); }
      75% { transform: translate(-50px, 100px) rotate(270deg); }
      100% { transform: translate(0px, 0px) rotate(360deg); }
    }

    @keyframes piRotate {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;

  const animations = (
    <style>{animationsStyle}</style>
  );

  // ===== СТИЛИ =====

  // Основной контейнер
  const mainContainerStyle = {
    position: 'relative',
    width: '100%',
    // ИСПРАВЛЕНО: фиксированная высота экрана
    minHeight: '100vh',
    height: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    overflow: 'auto',
    overflowX: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'Montserrat, sans-serif',
    backgroundAttachment: 'local',
    ...(isMobile() && {
      WebkitOverflowScrolling: 'touch',
      overscrollBehavior: 'none'
    })
  };

  // Оверлей
  const overlayStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(102, 126, 234, 0.7)',
    zIndex: 1
  };

  // Логотип
  const logoStyle = {
    position: 'absolute',
    top: logoAnimated && !isExiting ? '110px' : isExiting ? '-200px' : '-200px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '112px',
    height: '112px',
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    backdropFilter: 'blur(8px)',
    borderRadius: '20px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.25)',
    opacity: logoAnimated && !isExiting ? 1 : 0,
    zIndex: 3,
    transition: 'all 0.8s ease-out',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const logoImageStyle = {
    width: '84px',
    height: '84px',
    objectFit: 'contain'
  };

  // Контейнер формы
  const formContainerStyle = {
    position: 'absolute',
    top: (stage === 'email' || stage === 'result' || stage === 'manager' || stage === 'manager-sent')
      ? '242px'  // С логотипом: 110px + 112px + 20px = 242px
      : '90px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '20px',
    padding: '30px',
    width: '85%',
    maxWidth: '500px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    zIndex: 3,
    animation: buttonsAnimated ? 'fadeInUp 0.8s ease-out' : 'none'
  };

  // Заголовки
  const formTitleStyle = {
    fontSize: '24px',
    fontWeight: '700',
    color: '#333',
    marginBottom: '10px',
    textAlign: 'center'
  };

  const subtitleStyle = {
    fontSize: '168x',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: '20px',
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
  };

  // Группа полей
  const formGroupStyle = {
    marginBottom: '20px'
  };

  // Поля ввода
  const inputStyle = {
    width: '100%',
    padding: '15px',
    border: '2px solid #e1e8ed',
    borderRadius: '12px',
    fontSize: '18px',
    transition: 'all 0.3s ease',
    backgroundColor: '#f8f9fa',
    outline: 'none',
    fontFamily: 'inherit',
    textAlign: 'center' // ← ДОБАВИТЬ ЭТУ СТРОКУ
  };

  const inputErrorStyle = {
    ...inputStyle,
    borderColor: '#e74c3c',
    backgroundColor: '#fdf2f2'
  };

  // Кнопки
  const primaryButtonStyle = {
    width: '100%',
    padding: '15px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '18px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
    fontFamily: 'inherit'
  };

  const secondaryButtonStyle = {
    width: '100%',
    padding: '15px',
    background: 'transparent',
    color: '#667eea',
    border: '2px solid #667eea',
    borderRadius: '12px',
    fontSize: '18px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontFamily: 'inherit'
  };

  const disabledButtonStyle = {
    ...primaryButtonStyle,
    background: '#bdc3c7',
    cursor: 'not-allowed',
    boxShadow: 'none'
  };

  // Группа кнопок
  const buttonGroupStyle = {
    display: 'flex',
    gap: '15px',
    marginTop: '30px',
    marginBottom: '0px',
  };

  // Сообщения об ошибках
  const errorMessageStyle = {
    color: '#e74c3c',
    fontSize: '14px',
    marginTop: '5px',
    textAlign: 'center'
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

  // Pi элемент - анимация полета по экрану
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

  // Стили результатов
  const resultsContainerStyle = {
    position: 'absolute',
    top: '242px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '85%',
    maxWidth: '600px',
    zIndex: 3,
    paddingBottom: '20px'
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
    color: '#666',
    fontSize: '16px'
  };

  const resultValueStyle = {
    fontWeight: '600',
    color: '#333',
    fontSize: '16px',
    textAlign: 'right'
  };

  const resultValueHighlightStyle = {
    ...resultValueStyle,
    color: '#9370DB',
    fontSize: '18px',
    textAlign: 'right'
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
    fontSize: '20px',
    marginBottom: '10px'
  };

  const processingSubtextStyle = {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: '16px'
  };

  // Лейблы форм (УВЕЛИЧИВАЕМ)
  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '500',
    color: '#333',
    fontSize: '16px' // ДОБАВЛЯЕМ 16px (было без указания, по умолчанию ~14px)
  };

  // Описания и подсказки (УВЕЛИЧИВАЕМ)
  const hintStyle = {
    fontSize: '14px', // БЫЛО 12px → СТАЛО 14px
    color: '#999',
    marginTop: '5px'
  };

  // Кнопки выбора (пол, тип расчета) (УВЕЛИЧИВАЕМ)
  const optionButtonStyle = {
    flex: 1,
    padding: '12px',
    fontSize: '16px', // БЫЛО 14px → СТАЛО 16px
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  };

  // Информационные блоки (УВЕЛИЧИВАЕМ)
  const infoTextStyle = {
    margin: '5px 0',
    color: '#666',
    fontSize: '16px' // БЫЛО без указания (~14px) → СТАЛО 16px
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

  async function loadApiConfig() {
    try {
      const response = await fetch('/api/care-future/config');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setApiConfig(data.config);
          console.log('📊 Конфигурация API загружена:', data.config);
        }
      }
    } catch (error) {
      console.error('❌ Ошибка загрузки конфигурации:', error);
    }
  }

  useEffect(() => {
    loadApiConfig();
    const timer1 = setTimeout(() => setLogoAnimated(true), 100);
    const timer2 = setTimeout(() => setButtonsAnimated(true), 600);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const containers = document.querySelectorAll('.care-future-container-fix');
      containers.forEach(container => {
        if (container) {
          container.style.height = `${getViewportHeight()}px`;
          container.style.minHeight = `${getViewportHeight()}px`;
        }
      });
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
  
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

    function getAge(d) {
      if (!d) return 0;
      const today = new Date();
      const diff = today.getTime() - d.getTime();
      return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    }

    function formatSum(str) {
      // Убираем все нечисловые символы кроме точки и запятой (десятичные разделители)
      const cleanStr = str.toString().replace(/[^\d.,]/g, '').replace(',', '.');
  
      // Преобразуем в число и округляем до целого рубля
      const num = Math.round(parseFloat(cleanStr) || 0);
  
      // Форматируем с пробелами для удобства чтения
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    }

    async function performCalculation() {
      try {
        console.log('🧮 Начинаем расчет с исправленной логикой...');

        const calculationData = {
          email: email,
          birthDate: birthDate.toISOString().split('T')[0],
          gender: gender === 'Мужской' ? 'male' : 'female',
          contractTerm: programTerm,
          calculationType: calcType === 'premium' ? 'from_premium' : 'from_sum',
          inputAmount: parseInt(amountRaw.replace(/\s/g, ''))
        };

        console.log('📤 Отправляем данные:', calculationData);

        const response = await fetch('/api/care-future/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(calculationData)
        });

        const data = await response.json();
        console.log('📥 Получен ответ:', data);

        if (!response.ok) throw new Error(data.error || 'Ошибка сервера');

        if (data.success) {
          setCalculationId(data.calculationId);

          // Обновленная структура данных с исправленной логикой
          setResultData({
            inputParams: {
              age: data.inputParameters.ageAtStart,
              gender: gender,
              term: data.inputParameters.contractTerm
            },
            results: data.results,
            redemptionValues: data.redemptionValues || [],
            version: data.version || 'v1.0'
          });

          console.log('✅ Расчет выполнен успешно:', {
            premiumAmount: data.results.premiumAmount,
            insuranceSum: data.results.insuranceSum,
            programIncome: data.results.programIncome,
            taxDeduction: data.results.taxDeduction
          });

          return true;
        }
      } catch (error) {
        console.error('❌ Ошибка расчета:', error);
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
        } else if (calcType === 'premium' && (cleanAmount < 100000 )) {
          errors.amount = 'Взнос должен быть от 100,000 руб.';
        } else if (calcType === 'sum' && (cleanAmount < 670000 )) {
          errors.amount = 'Страховая сумма должна быть от 670,000 руб.';
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
      // Проверяем заполненность полей
      if (!mgrSurname.trim() || !mgrName.trim() || !mgrCity.trim()) {
        setMgrError('Заполните все поля');
        return;
      }

      setIsSendingMgr(true);
      setMgrError('');

      console.log('🚀 Отправляем заявку менеджеру...');
      console.log('📧 Email данные:', { mgrSurname, mgrName, mgrCity, email });

      try {
        const requestBody = {
          subject: 'Заявка на консультацию - расчет по программе "Забота о будущем" для сотрудника ВТБ',
          body: `

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
• Налоговый вычет: ${resultData?.results?.taxDeduction ? formatSum(resultData.results.taxDeduction.toString()) + ' руб.' : 'Не рассчитан'}



Отправлено через MiniApp "РГСЖ"
      `
        };

        // ПРЯМОЕ ОБРАЩЕНИЕ К FLASK СЕРВЕРУ (обход проблемного прокси)
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const apiUrl = isLocal ? 'http://localhost:4000' : '';
        const fullUrl = `${apiUrl}/api/proxy/carefuture/send_manager`;

        console.log('🌐 Среда:', isLocal ? 'Локальная разработка' : 'Продакшн');
        console.log('🔗 API URL:', fullUrl);
        console.log('📦 Данные запроса:', requestBody);

        const response = await fetch(fullUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });

        console.log('📡 Статус ответа:', response.status);
        console.log('📡 Заголовки ответа:', Object.fromEntries(response.headers.entries()));

        if (response.ok) {
          const result = await response.json();
          console.log('✅ Заявка отправлена успешно:', result);
          setStage('manager-sent');
        } else {
          let errorMessage = `HTTP ${response.status}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch (parseError) {
            const errorText = await response.text();
            console.error('❌ Ошибка парсинга ответа:', parseError);
            console.error('❌ Текст ответа:', errorText.substring(0, 200));
            errorMessage = 'Ошибка сервера';
          }
          throw new Error(errorMessage);
        }
      } catch (error) {
        console.error('❌ Ошибка отправки заявки:', error);
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
          setMgrError('Ошибка соединения с сервером. Убедитесь что Flask сервер запущен на порту 4000.');
        } else {
          setMgrError(`Ошибка отправки: ${error.message}. Попробуйте еще раз.`);
        }
      } finally {
        setIsSendingMgr(false);
      }
    }

    // ===== RENDER ФУНКЦИИ =====

    // Email шаг
    if (stage === 'email') {
      return (
        <div style={mainContainerStyle} className="care-future-container-fix">

          {/* ДОБАВЬТЕ ЭТУ СТРОКУ */}
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            zIndex: -1
          }} />
          {animations}

          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
            <div key={n} style={dotStyle(n)} />
          ))}

          <div style={piWrapperStyle}>
            <img src={piImage} style={piImageStyle} alt="Pi" />
          </div>


          {(stage === 'email' || stage === 'result') && (
            <div style={logoStyle}>
              <img src={logoImage} alt="Логотип РГС Жизнь" style={logoImageStyle} />
            </div>
          )}

          <div style={formContainerStyle}>
            <h2 style={formTitleStyle}>Калькулятор НСЖ</h2>
            <p style={{ ...subtitleStyle, color: '#666', textShadow: 'none' }}>
              Расчет по программе «Забота о будущем» для сотрудника ВТБ<br />
            </p>

            <div style={formGroupStyle}>
              <input
                type="email"
                placeholder="Введите ваш email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={emailError ? inputErrorStyle : inputStyle}
              />
              {emailError && <div style={errorMessageStyle}>{emailError}</div>}
            </div>

            <button
              style={primaryButtonStyle}
              onClick={handleEmailSubmit}
            >
              Продолжить
            </button>
          </div>
        </div>
      );
    }

    // Форма расчета
    if (stage === 'form') {
      return (
        <div style={mainContainerStyle} className="care-future-container-fix">

          {/* ДОБАВЬТЕ ЭТУ СТРОКУ */}
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            zIndex: -1
          }} />
          {animations}

          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
            <div key={n} style={dotStyle(n)} />
          ))}

          <div style={piWrapperStyle}>
            <img src={piImage} style={piImageStyle} alt="Pi" />
          </div>

          <div style={formContainerStyle}>
            <h2 style={formTitleStyle}>Параметры расчета</h2>

            {validationErrors.general && (
              <div style={errorMessageStyle}>{validationErrors.general}</div>
            )}

            {/* Дата рождения */}
            <div style={formGroupStyle}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '18px', textAlign: 'center' }}>
                Дата рождения
              </label>
              <DateWheelPicker
                value={birthParts}
                onChange={setBirthParts}
                style={validationErrors.birthDate ? inputErrorStyle : inputStyle}
              />
              {validationErrors.birthDate && (
                <div style={errorMessageStyle}>{validationErrors.birthDate}</div>
              )}
            </div>

            {/* Пол */}
            <div style={formGroupStyle}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '18px', textAlign: 'center' }}>
                Пол
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                {['Мужской', 'Женский'].map(option => (
                  <button
                    key={option}
                    style={{
                      flex: 1,
                      padding: '12px',
                      border: gender === option ? '2px solid #667eea' : '2px solid #e1e8ed',
                      borderRadius: '8px',
                      background: gender === option ? '#f0f4ff' : '#f8f9fa',
                      color: gender === option ? '#667eea' : '#666',
                      fontSize: '18px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onClick={() => setGender(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
              {validationErrors.gender && (
                <div style={errorMessageStyle}>{validationErrors.gender}</div>
              )}
            </div>

            {/* Срок программы */}
            <div style={formGroupStyle}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '18px', textAlign: 'center' }}>
                Срок программы: {programTerm} лет
              </label>
              <input
                type="range"
                min="5"
                max="20"
                value={programTerm}
                onChange={(e) => setProgramTerm(Number(e.target.value))}
                style={{
                  width: '100%',
                  height: '6px',
                  borderRadius: '3px',
                  background: '#e1e8ed',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', color: '#999', marginTop: '5px' }}>
                <span>5 лет</span>
                <span>20 лет</span>
              </div>
            </div>

            {/* Тип расчета */}
            <div style={formGroupStyle}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '18px', textAlign: 'center' }}>
                Тип расчета
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                {[
                  { key: 'premium', label: 'От взноса' },
                  { key: 'sum', label: 'От суммы' }
                ].map(option => (
                  <button
                    key={option.key}
                    style={{
                      flex: 1,
                      padding: '12px',
                      border: calcType === option.key ? '2px solid #667eea' : '2px solid #e1e8ed',
                      borderRadius: '8px',
                      background: calcType === option.key ? '#f0f4ff' : '#f8f9fa',
                      color: calcType === option.key ? '#667eea' : '#666',
                      fontSize: '18px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onClick={() => setCalcType(option.key)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {validationErrors.calcType && (
                <div style={errorMessageStyle}>{validationErrors.calcType}</div>
              )}
            </div>

            {/* Сумма */}
            <div style={formGroupStyle}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '18px', textAlign: 'center' }}>
                {calcType === 'premium' ? 'Страховой взнос' : 'Страховая сумма'} (руб.)
              </label>
              <input
                type="text"
                placeholder={calcType === 'premium' ? 'Введите размер взноса' : 'Введите страховую сумму'}
                value={amountDisplay}
                onChange={(e) => {
                  const value = e.target.value.replace(/\s/g, '');
                  if (/^\d*$/.test(value)) {
                    setAmountRaw(value);
                    setAmountDisplay(formatSum(value));
                  }
                }}
                style={validationErrors.amount ? inputErrorStyle : inputStyle}
              />
              {validationErrors.amount && (
                <div style={errorMessageStyle}>{validationErrors.amount}</div>
              )}
              <div style={{ fontSize: '14px', color: '#999', marginTop: '5px', textAlign: 'center' }}>
                {calcType === 'premium'
                  ? 'Минимум: 100,000 руб.'
                  : 'Минимум: 670,000 руб.'}
              </div>
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
        <div style={mainContainerStyle} className="care-future-container-fix">

          {/* ДОБАВЬТЕ ЭТУ СТРОКУ */}
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            zIndex: -1
          }} />
          {animations}

          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
            <div key={n} style={dotStyle(n)} />
          ))}

          <div style={piWrapperStyle}>
            <img src={piImage} style={piImageStyle} alt="Pi" />
          </div>

          <div style={logoStyle}>
            <img src={logoImage} alt="Логотип РГС Жизнь" style={logoImageStyle} />
          </div>

          <div style={processingContainerStyle}>
            <div style={spinnerStyle}></div>
            <div style={processingTextStyle}>Выполняется расчет...</div>
            <div style={processingSubtextStyle}>Обработка данных...</div>
          </div>
        </div>
      );
    }

    // Результаты расчета
    if (stage === 'result') {
      if (!resultData) {
        return (
          <div style={mainContainerStyle} className="care-future-container-fix">
            {/* ДОБАВЬТЕ ЭТУ СТРОКУ */}
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              zIndex: -1
            }} />
            <div style={errorMessageStyle}>Нет данных для отображения</div>
          </div>
        );
      }

      // Подготавливаем данные для карусели
      const carouselData = [
        // 1. Основные результаты
        {
          title: 'Основные результаты',
          items: [
            { label: 'Возраст клиента', value: `${resultData.inputParams.age} лет` },
            { label: 'Пол', value: gender === 'Мужской' ? 'Мужской' : 'Женский' },
            { label: 'Срок программы', value: `${resultData.inputParams.term} лет` },
            { label: 'Годовой взнос', value: `${formatSum(resultData.results.premiumAmount.toString())} руб.`, highlight: true },
            { label: 'Страховая сумма', value: `${formatSum(resultData.results.insuranceSum.toString())} руб.`, highlight: true },
            { label: 'Накопленный капитал', value: `${formatSum(resultData.results.accumulatedCapital.toString())} руб.` },
            { label: 'Доход по программе', value: `${formatSum(resultData.results.programIncome.toString())} руб.` },
            { label: 'Налоговый вычет', value: `${formatSum(resultData.results.taxDeduction.toString())} руб.` }
          ]
        },

        // 2. Страховые риски (новая страница)
        {
          title: 'Страховое покрытие',
          items: [
            {
              label: 'Дожитие до окончания срока',
              value: `${formatSum(resultData.results.insuranceSum.toString())} руб.`,
              highlight: true
            },
            {
              label: 'Смерть ЛП (с отложенной выплатой)',
              value: `${formatSum(resultData.results.insuranceSum.toString())} руб.`
            },
            {
              label: 'Смерть по любой причине (выплата в моменте)',
              value: 'Возврат 100% взносов'
            },
            {
              label: 'Инвалидность(I,II) по любой причине',
              value: 'Освобождение от уплаты взносов'
            }
          ]
        },
        // 3. Дополнительные сервисы (новая страница)
        {
          title: 'Дополнительные сервисы',
          isServicePage: true,
          services: [
            {
              icon: '💰',
              title: 'Налоговый вычет',
              description: 'Удобный сервис для получения социального налогового вычета онлайн не выходя из дома'
            },
            {
              icon: '🧬',
              title: 'ПРО Генетику',
              description: 'Исследование генома ребенка, которое позволяет раскрыть потенциал его развития'
            },
            {
              icon: '🎓',
              title: 'Образовательный консьерж',
              description: 'Информационная поддержка и помощь в получении образовательных и развивающих услуг'
            }
          ]
        }
      ];

      // Добавляем выкупные суммы если есть
      // Добавляем выкупные суммы если есть
      /*
      if (resultData.redemptionValues && resultData.redemptionValues.length > 0) {
        console.log('🔍 ОТЛАДКА: Срок программы:', resultData.inputParams.term);
        console.log('🔍 ОТЛАДКА: Данные с сервера:', resultData.redemptionValues);
        console.log('🔍 ОТЛАДКА: Количество записей:', resultData.redemptionValues.length);

        // Показываем что есть в данных по годам
        for (let year = 1; year <= resultData.inputParams.term; year++) {
          const found = resultData.redemptionValues.find(item => item.year === year);
          if (found) {
            console.log(`✅ Год ${year}: ${found.amount} руб.`);
          } else {
            console.log(`❌ Год ${year}: НЕТ ДАННЫХ`);
          }
        }

        const redemptionItems = [];

        // ЛОГИКА: 1-2 годы показываем всегда (даже если 0), остальные - только если > 0
        // Показываем выкупные суммы для всех лет
        for (let year = 1; year <= resultData.inputParams.term; year++) {
          const existingData = resultData.redemptionValues.find(item => item.year === year);
          const amount = existingData ? existingData.amount : 0;

          redemptionItems.push({
            label: `${year} год`,
            value: amount > 0 ? `${formatSum(amount.toString())} руб.` : '0 руб.'
          });
          console.log(`➕ ДОБАВЛЕН год ${year}: ${amount > 0 ? formatSum(amount.toString()) + ' руб.' : '0 руб.'}`);
        }

        console.log('🎯 ИТОГО в интерфейсе будет показано лет:', redemptionItems.length);

        if (redemptionItems.length > 0) {
          carouselData.push({
            title: `Выкупные суммы (${redemptionItems.length} из ${resultData.inputParams.term} лет)`,
            items: redemptionItems
          });
          console.log('✅ Страница выкупных сумм ДОБАВЛЕНА в карусель');
        } else {
          console.log('⚠️ Страница выкупных сумм НЕ добавлена - нет данных');
        }
      } else {
        console.log('❌ resultData.redemptionValues пустой или отсутствует');
        console.log('❌ resultData:', resultData);
      }
      */
      return (
        <div style={mainContainerStyle} className="care-future-container-fix">

          {/* ДОБАВЬТЕ ЭТУ СТРОКУ */}
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            zIndex: -1
          }} />
          {animations}

          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
            <div key={n} style={dotStyle(n)} />
          ))}

          <div style={piWrapperStyle}>
            <img src={piImage} style={piImageStyle} alt="Pi" />
          </div>

          <div style={logoStyle}>
            <img src={logoImage} alt="Логотип РГС Жизнь" style={logoImageStyle} />
          </div>

          <div style={resultsContainerStyle}>
            <div style={{ ...resultCardStyle, position: 'relative' }}>
              {/* Стрелка влево */}
              {carouselIndex > 0 && (
                <button
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '-25px',
                    transform: 'translateY(-50%)',
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    background: 'rgba(102, 126, 234, 1.1)',
                    border: 'none',
                    color: 'white',
                    fontSize: '20px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 4,
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
                  }}
                  onClick={() => setCarouselIndex(prev => prev - 1)}
                  onMouseEnter={(e) => e.target.style.background = 'rgba(102, 126, 234, 1)'}
                  onMouseLeave={(e) => e.target.style.background = 'rgba(102, 126, 234, 0.8)'}
                >
                  ←
                </button>
              )}

              <div style={formTitleStyle}>
                {carouselData[carouselIndex].title}
                <br />
              </div>

              {/* Обычная страница с таблицей */}
              {!carouselData[carouselIndex].isServicePage && carouselData[carouselIndex].items && (
                <>
                  {carouselData[carouselIndex].items.map((item, idx) => (
                    <div key={idx} style={{ ...resultItemStyle, borderBottom: idx === carouselData[carouselIndex].items.length - 1 ? 'none' : '1px solid #f0f0f0' }}>
                      <div style={resultLabelStyle}>{item.label}</div>
                      <div style={item.highlight ? resultValueHighlightStyle : resultValueStyle}>
                        {item.value}
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* Страница дополнительных сервисов */}
              {carouselData[carouselIndex].isServicePage && carouselData[carouselIndex].services && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
                  {carouselData[carouselIndex].services.map((service, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '15px',
                      padding: '15px',
                      background: 'rgba(102, 126, 234, 0.05)',
                      borderRadius: '12px',
                      border: '1px solid rgba(102, 126, 234, 0.1)'
                    }}>
                      <div style={{
                        fontSize: '40px',
                        flexShrink: 0,
                        marginBottom: '15px'
                      }}>
                        {service.icon}
                      </div>
                      <div>
                        <div style={{
                          fontWeight: '600',
                          color: '#667eea',
                          fontSize: '16px',
                          marginBottom: '8px'
                        }}>
                          {service.title}
                        </div>
                        <div style={{
                          color: '#666',
                          fontSize: '14px',
                          lineHeight: '1.4'
                        }}>
                          {service.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Стрелка вправо */}
              {carouselIndex < carouselData.length - 1 && (
                <button
                  style={{
                    position: 'absolute',
                    top: '50%',
                    right: '-25px',
                    transform: 'translateY(-50%)',
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    background: 'rgba(102, 126, 234, 1.0)',
                    border: 'none',
                    color: 'white',
                    fontSize: '20px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 4,
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
                  }}
                  onClick={() => setCarouselIndex(prev => prev + 1)}
                  onMouseEnter={(e) => e.target.style.background = 'rgba(102, 126, 234, 1)'}
                  onMouseLeave={(e) => e.target.style.background = 'rgba(102, 126, 234, 1)'}
                >
                  →
                </button>
              )}
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
                      background: carouselIndex === idx ? '#667eea' : 'rgba(102, 126, 234, 0.3)',
                      cursor: 'pointer',
                      transition: 'background 0.3s ease'
                    }}
                    onClick={() => setCarouselIndex(idx)}
                  />
                ))}
              </div>
            )}

            <div style={buttonGroupStyle}>
              <button 
                style={{
                ...secondaryButtonStyle,
                color: 'white',
                border: '2px solid white'
                }} 
                onClick={() => {
                  setStage('form');
                  setCarouselIndex(0); // СБРАСЫВАЕМ НА ПЕРВУЮ СТРАНИЦУ
                }}
              >
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
        <div style={mainContainerStyle} className="care-future-container-fix">

          {/* ДОБАВЬТЕ ЭТУ СТРОКУ */}
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            zIndex: -1
          }} />
          {animations}

          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
            <div key={n} style={dotStyle(n)} />
          ))}

          <div style={piWrapperStyle}>
            <img src={piImage} style={piImageStyle} alt="Pi" />
          </div>

          {(stage === 'email' || stage === 'result' || stage === 'manager' || stage === 'manager-sent') && (
            <div style={logoStyle}>
              <img src={logoImage} alt="Логотип РГС Жизнь" style={logoImageStyle} />
            </div>
          )}

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
              <button style={secondaryButtonStyle} onClick={() => setStage('result')}>
                Назад к результатам
              </button>
              <button
                style={isSendingMgr ? disabledButtonStyle : primaryButtonStyle}
                onClick={handleManagerSubmit}
                disabled={isSendingMgr}
              >
                {isSendingMgr ? 'Отправка...' : 'Отправить заявку'}
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Успешная отправка
    if (stage === 'manager-sent') {
      return (
        <div style={mainContainerStyle} className="care-future-container-fix">
          {/* ДОБАВЬТЕ ЭТУ СТРОКУ */}
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            zIndex: -1
          }} />
          {animations}

          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
            <div key={n} style={dotStyle(n)} />
          ))}

          <div style={piWrapperStyle}>
            <img src={piImage} style={piImageStyle} alt="Pi" />
          </div>

          {(stage === 'email' || stage === 'result' || stage === 'manager-sent') && (
            <div style={logoStyle}>
              <img src={logoImage} alt="Логотип РГС Жизнь" style={logoImageStyle} />
            </div>
          )}

          <div style={formContainerStyle}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '64px', color: '#2ecc71', marginBottom: '20px' }}>✅</div>
              <h2 style={formTitleStyle}>Заявка отправлена!</h2>
              <p style={{ color: '#666', marginBottom: '30px' }}>
                Наш менеджер свяжется с вами в ближайшее время для консультации по программе «Забота о будущем» для сотрудников ВТБ.
              </p>

              <div style={{ background: '#f8f9fa', borderRadius: '12px', padding: '20px', marginBottom: '30px', textAlign: 'left' }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>Контактная информация:</h4>
                <p style={{ margin: '5px 0', color: '#666', fontSize: '16px' }}>📧 Email: {email}</p>
                <p style={{ margin: '5px 0', color: '#666', fontSize: '16px' }}>👤 Имя: {mgrName} {mgrSurname}</p>
                <p style={{ margin: '5px 0', color: '#666', fontSize: '16px' }}>🏙️ Город: {mgrCity}</p>
              </div>

              <button
                style={primaryButtonStyle}
                onClick={() => navigate('/Main-Menu')}
              >
                Вернуться в меню
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Ошибка
    return (
      <div style={mainContainerStyle} className="care-future-container-fix">
        {/* ДОБАВЬТЕ ЭТУ СТРОКУ */}
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            zIndex: -1
          }} />
        <div style={errorMessageStyle}>
          Произошла ошибка. Попробуйте обновить страницу.
        </div>
      </div>
    );
}