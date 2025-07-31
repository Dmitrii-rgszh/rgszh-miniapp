import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logoImage from './components/logo.png';
import DateWheelPicker from './DateWheelPicker';

// Подключаем CSS файлы
import './Styles/logo.css';
import './Styles/cards.css';
import './Styles/text.css';
import './Styles/buttons.css';
import './Styles/BackButton.css';
import './Styles/HomeButton.css';
import './Styles/containers.css';
import './Styles/ProgressIndicator.css';
import './Styles/NextButton.css';

const JustincasePage = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');

  // Состояние анимаций
  const [logoAnimated, setLogoAnimated] = useState(false);
  const [contentAnimated, setContentAnimated] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // ===== СОСТОЯНИЯ EMAIL =====
  const [stage, setStage] = useState('email');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  // Состояния формы
  const [birthDate, setBirthDate] = useState(null);
  const [gender, setGender] = useState(null);
  const [insuranceInfo, setInsuranceInfo] = useState(null);
  const [insuranceTerm, setInsuranceTerm] = useState('1');
  const [insuranceSum, setInsuranceSum] = useState('');
  const [insuranceFrequency, setInsuranceFrequency] = useState('');

  const [accidentPackage, setAccidentPackage] = useState(null);
  const [criticalPackage, setCriticalPackage] = useState(null);
  const [treatmentRegion, setTreatmentRegion] = useState(null);
  const [sportPackage, setSportPackage] = useState(null);

  // Дополнительные поля для ветки "не знает сумму"
  const [hasJob, setHasJob] = useState(null);
  const [income2021, setIncome2021] = useState('');
  const [income2022, setIncome2022] = useState('');
  const [income2023, setIncome2023] = useState('');
  const [scholarship, setScholarship] = useState('');
  const [unsecuredLoans, setUnsecuredLoans] = useState('');

  const [breadwinnerStatus, setBreadwinnerStatus] = useState(null);
  const [incomeShare, setIncomeShare] = useState('');
  const [childrenCount, setChildrenCount] = useState('0');
  const [specialCareRelatives, setSpecialCareRelatives] = useState(null);

  // Шаги
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultData, setResultData] = useState(null);

  // Инициализация
  useEffect(() => {
    const storedName = localStorage.getItem('userName');
    setUserName(storedName || 'Гость');

    // Анимации
    setTimeout(() => setLogoAnimated(true), 100);
    setTimeout(() => setContentAnimated(true), 600);
  }, []);

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
    setStage('form1');
  };

  // Форматтер для полей-сумм
  const formatSum = raw => {
    let digits = raw.replace(/\D/g, '');
    if (!digits) return '';
    let out = '';
    while (digits.length > 3) {
      out = '.' + digits.slice(-3) + out;
      digits = digits.slice(0, -3);
    }
    return digits + out;
  };

  const handleSumChange = e => setInsuranceSum(formatSum(e.target.value));
  const handleIncome2021Change = e => setIncome2021(formatSum(e.target.value));
  const handleIncome2022Change = e => setIncome2022(formatSum(e.target.value));
  const handleIncome2023Change = e => setIncome2023(formatSum(e.target.value));
  const handleScholarshipChange = e => setScholarship(formatSum(e.target.value));
  const handleUnsecuredLoansChange = e => setUnsecuredLoans(formatSum(e.target.value));

  // Функция форматирования чисел для отображения
  const formatNumber = (value) => {
    if (!value) return '0';
    
    // Убираем все нецифровые символы
    const cleanValue = value.toString().replace(/[^\d]/g, '');
    
    // Форматируем с пробелами
    return cleanValue.replace(/(\d)(?=(\d{3})+$)/g, '$1 ');
  };

  // Проверка возможности перехода
  const canGoNext = () => {
    if (stage === 'email') {
      return email && email.length >= 3;
    }
    if (stage === 'form1') {
      return birthDate && gender && insuranceInfo;
    }
    if (stage === 'form2') {
      return insuranceInfo === 'yes'
        ? (insuranceTerm && insuranceSum && insuranceFrequency)
        : (hasJob && income2021 && income2022 && income2023);
    }
    if (stage === 'form3') {
      if (insuranceInfo === 'yes') {
        return accidentPackage && criticalPackage && (criticalPackage === 'no' || treatmentRegion) && sportPackage;
      } else {
        return breadwinnerStatus &&
               (breadwinnerStatus === 'yes' || incomeShare) &&
               childrenCount !== '' &&
               specialCareRelatives;
      }
    }
    return true;
  };

  // Переход вперёд
  const handleNext = () => {
    if (!canGoNext()) {
      alert('Не выполнены условия для перехода');
      return;
    }

    if (stage === 'email') {
      handleEmailSubmit();
    } else if (stage === 'form1') {
      setStage('form2');
    } else if (stage === 'form2') {
      setStage('form3');
    } else if (stage === 'form3') {
      doCalculation();
    }
  };

  // Переход назад
  const handlePrev = () => {
    switch (stage) {
      case 'email':
        navigate('/main-menu');
        break;
      case 'form1':
        setStage('email');
        break;
      case 'form2':
        setStage('form1');
        break;
      case 'form3':
        setStage('form2');
        break;
      case 'result':
        setStage('form3');
        break;
      default:
        navigate('/main-menu');
    }
  };

  // Сброс и повторный расчёт
  const repeatCalculation = () => {
    setBirthDate(null); setGender(null); setInsuranceInfo(null);
    setInsuranceTerm('1'); setInsuranceSum(''); setInsuranceFrequency('');
    setAccidentPackage(null); setCriticalPackage(null); setTreatmentRegion(null); setSportPackage(null);
    setHasJob(null); setIncome2021(''); setIncome2022(''); setIncome2023('');
    setScholarship(''); setUnsecuredLoans('');
    setBreadwinnerStatus(null); setIncomeShare(''); setChildrenCount('0'); setSpecialCareRelatives(null);
    setResultData(null); setIsProcessing(false); setStage('form1');
  };

  // Переход в меню
  const goToMenu = () => {
    setIsExiting(true);
    setTimeout(() => {
      navigate('/main-menu');
    }, 700);
  };

  // Отправка данных на бэкенд
  const doCalculation = async () => {
    setIsProcessing(true);
    setStage('processing');
  
    try {
      const payload = {
        email: email,
        birthDate: birthDate ? birthDate.toISOString().split('T')[0] : null,
        gender: gender === 'Мужской' ? 'male' : 'female',
        insuranceInfo,
        insuranceTerm: parseInt(insuranceTerm),
        insuranceSum: insuranceSum ? insuranceSum.replace(/\./g, '') : '',
        insuranceFrequency,
        accidentPackage,
        criticalPackage,
        treatmentRegion,
        sportPackage,
        hasJob,
        income2021,
        income2022,
        income2023,
        scholarship,
        unsecuredLoans,
        breadwinnerStatus,
        incomeShare,
        childrenCount,
        specialCareRelatives
      };

      console.log('📤 Отправляем данные на расчет:', payload);

      const apiUrl = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:4000/api/proxy/calculator/save'
        : `${window.location.origin}/api/proxy/calculator/save`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      console.log('📥 Получен ответ:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка расчёта');
      }

      let processedData;
      
      if (data.success && data.calculation_result) {
        const calc = data.calculation_result;
        
        processedData = {
          success: true,
          calculationDate: new Date().toLocaleDateString('ru-RU'),
          clientAge: calc.clientAge || 35,
          clientGender: calc.clientGender || (gender === 'Мужской' ? 'Мужской' : 'Женский'),
          insuranceTerm: calc.insuranceTerm || insuranceTerm,
          baseInsuranceSum: formatNumber(calc.baseInsuranceSum || calc.insuranceSum || insuranceSum),
          basePremium: formatNumber(calc.basePremium || calc.basePremiumAmount || calc.annualPremium || '0'),
          accidentPackageIncluded: calc.accidentPackageIncluded || false,
          accidentInsuranceSum: formatNumber(calc.accidentInsuranceSum || calc.accidentDetails?.insuranceSum || insuranceSum),
          accidentPremium: formatNumber(calc.accidentPremium || calc.accidentDetails?.premium || '0'),
          criticalPackageIncluded: calc.criticalPackageIncluded || false,
          criticalInsuranceSum: formatNumber(calc.criticalInsuranceSum || calc.criticalDetails?.insuranceSum || '60 000 000'),
          criticalPremium: formatNumber(calc.criticalPremium || calc.criticalDetails?.premium || '0'),
          totalPremium: formatNumber(calc.totalPremium || calc.annualPremium || '0'),
          treatmentRegion: calc.treatmentRegion || treatmentRegion,
          sportPackage: calc.sportPackage || (sportPackage === 'yes'),
          calculationId: calc.calculationId || data.calculation_id || 'unknown',
          calculator: data.calculator || 'JustincaseCalculatorComplete',
          version: data.version || '2.0.0'
        };
      } else if (data.success) {
        processedData = {
          ...data,
          clientAge: data.clientAge || 35,
          clientGender: data.clientGender || (gender === 'Мужской' ? 'Мужской' : 'Женский'),
          insuranceTerm: data.insuranceTerm || insuranceTerm,
          baseInsuranceSum: formatNumber(data.baseInsuranceSum || insuranceSum),
          basePremium: formatNumber(data.basePremium || '0'),
          totalPremium: formatNumber(data.totalPremium || '0'),
          accidentPackageIncluded: data.accidentPackageIncluded || false,
          accidentInsuranceSum: formatNumber(data.accidentInsuranceSum || '0'),
          accidentPremium: formatNumber(data.accidentPremium || '0'),
          criticalPackageIncluded: data.criticalPackageIncluded || false,
          criticalPremium: formatNumber(data.criticalPremium || '0')
        };
      } else {
        throw new Error(data.error || 'Неизвестная ошибка расчета');
      }
      
      console.log('✅ Обработанные данные:', processedData);
      
      setResultData(processedData);
      setStage('result');
    } catch (error) {
      console.error('❌ Ошибка расчета:', error);
      alert(`Ошибка при расчете: ${error.message}`);
      setStage('form3');
    } finally {
      setIsProcessing(false);
    }
  };

  // Рендер контента шага
  const renderStep = () => {
    // Email этап
    if (stage === 'email') {
      return (
        <div className={`card-container card-positioned ${contentAnimated ? 'animated' : ''}`}>
          <div className="card-header">
            <h1 className="text-h1-dark text-center">На всякий случай</h1>
            <p className="text-body-dark text-center">
              Страхование жизни и дополнительная защита от рисков
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
              placeholder="example@vtb.ru"
            />
            {emailError && <span className="form-error">{emailError}</span>}
          </div>
        </div>
      );
    }

    if (stage === 'processing') {
      return (
        <div className={`card-container card-positioned ${contentAnimated ? 'animated' : ''}`}>
          <h2 className="text-h2 text-center">
            {userName}, идёт расчёт...
          </h2>
          <div className="progress-indicator-wrapper">
            <div className="assessment-spinner" />
          </div>
        </div>
      );
    }

    // Шаг результатов
    if (stage === 'result' && resultData) {
      return (
        <div className={`card-container card-positioned card-results ${contentAnimated ? 'animated' : ''}`}>
          <h2 className="text-h2 text-center">
            Ваша программа «На всякий случай»
          </h2>
          <p className="text-small text-center">
            (расчет от {resultData.calculationDate || new Date().toLocaleDateString('ru-RU')})
          </p>
          
          <div className="result-section">
            <div className="result-item">
              <span className="result-label">Возраст клиента:</span>
              <span className="result-value">{resultData.clientAge} лет</span>
            </div>
            <div className="result-item">
              <span className="result-label">Пол клиента:</span>
              <span className="result-value">{resultData.clientGender}</span>
            </div>
            <div className="result-item">
              <span className="result-label">Срок страхования:</span>
              <span className="result-value">{resultData.insuranceTerm} лет</span>
            </div>
            
            <div className="result-divider"></div>
            
            <h3 className="text-h3">Основная программа</h3>
            <p className="text-small">
              (страхование на случай ухода из жизни и инвалидности I и II группы по любой причине)
            </p>
            
            <div className="result-item">
              <span className="result-label">• Страховая сумма:</span>
              <span className="result-value">{formatNumber(resultData.baseInsuranceSum || resultData.insuranceSum)} руб.</span>
            </div>
            <div className="result-item">
              <span className="result-label">• Страховая премия:</span>
              <span className="result-value">{formatNumber(resultData.basePremium)} руб.</span>
            </div>
            
            {resultData.accidentPackageIncluded && (
              <>
                <div className="result-divider"></div>
                <h3 className="text-h3">Пакет «Несчастный случай»</h3>
                <div className="result-item">
                  <span className="result-label">• Страховая сумма:</span>
                  <span className="result-value">{formatNumber(resultData.accidentInsuranceSum)} руб.</span>
                </div>
                <div className="result-item">
                  <span className="result-label">• Страховая премия:</span>
                  <span className="result-value">{formatNumber(resultData.accidentPremium)} руб.</span>
                </div>
              </>
            )}
            
            {resultData.criticalPackageIncluded && (
              <>
                <div className="result-divider"></div>
                <h3 className="text-h3">
                  {resultData.treatmentRegion === 'russia' ? 
                    'Пакет «Критические заболевания (лечение в РФ)»' : 
                    'Пакет «Критические заболевания (лечение за рубежом)»'
                  }
                </h3>
                <div className="result-item">
                  <span className="result-label">• Максимальная страховая сумма:</span>
                  <span className="result-value">
                    60 000 000 рублей,<br/>
                    дополнительно по реабилитации – 100 000 рублей
                  </span>
                </div>
                <div className="result-item">
                  <span className="result-label">• Страховая премия:</span>
                  <span className="result-value">{formatNumber(resultData.criticalPremium)} руб.</span>
                </div>
              </>
            )}
            
            {resultData.sportPackage && (
              <>
                <div className="result-divider"></div>
                <h3 className="text-h3">Опция «Любительский спорт»</h3>
                <p className="text-small">(учтена в расчете премий НС)</p>
              </>
            )}
            
            <div className="result-divider result-divider-primary"></div>
            
            <div className="result-item result-item-total">
              <span className="result-label-total">Итого страховая премия:</span>
              <span className="result-value-total">{formatNumber(resultData.totalPremium || resultData.annualPremium)} руб.</span>
            </div>
            <div className="result-item">
              <span className="result-label">Порядок оплаты премии:</span>
              <span className="result-value">{insuranceFrequency || 'Ежегодно'}</span>
            </div>
          </div>
          
          <div className="button-group">
            <button className="button button-secondary" onClick={goToMenu}>
              Главное меню
            </button>
            <button className="button button-primary" onClick={repeatCalculation}>
              Повторить расчёт
            </button>
          </div>
        </div>
      );
    }

    // Шаг 1 - основная информация
    if (stage === 'form1') {
      return (
        <div className={`card-container card-positioned ${contentAnimated ? 'animated' : ''}`}>
          <h2 className="text-h2">Расчёт по программе "На всякий случай"</h2>
          <p className="text-small text-center">Шаг 1 из 3</p>
          
          <div className="form-group">
            <label className="form-label">Дата рождения</label>
            <DateWheelPicker
              value={{
                day: birthDate ? birthDate.getDate().toString().padStart(2, '0') : '01',
                month: birthDate ? (birthDate.getMonth() + 1).toString().padStart(2, '0') : '01',
                year: birthDate ? birthDate.getFullYear().toString() : new Date().getFullYear().toString()
              }}
              onChange={(val) => {
                if (val?.day && val?.month && val?.year) {
                  const date = new Date(parseInt(val.year), parseInt(val.month) - 1, parseInt(val.day));
                  setBirthDate(date);
                }
              }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Пол</label>
            <div className="option-buttons horizontal-always">
              <button
                className={`option-button ${gender === 'Мужской' ? 'selected' : ''}`}
                onClick={() => setGender('Мужской')}
              >
                Мужской
              </button>
              <button
                className={`option-button ${gender === 'Женский' ? 'selected' : ''}`}
                onClick={() => setGender('Женский')}
              >
                Женский
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Знаете ли вы необходимую сумму страхования?</label>
            <div className="option-buttons horizontal-always">
              <button
                className={`option-button ${insuranceInfo === 'yes' ? 'selected' : ''}`}
                onClick={() => setInsuranceInfo('yes')}
              >
                Да
              </button>
              <button
                className={`option-button ${insuranceInfo === 'no' ? 'selected' : ''}`}
                onClick={() => setInsuranceInfo('no')}
              >
                Нет
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Шаг 2 - параметры страхования
    if (stage === 'form2') {
      return (
        <div className={`card-container card-positioned ${contentAnimated ? 'animated' : ''}`}>
          <h2 className="text-h2">
            {insuranceInfo === 'yes' ? 'Параметры страхования' : 'Расчёт суммы страхования'}
          </h2>
          <p className="text-small text-center">Шаг 2 из 3</p>
          
          {insuranceInfo === 'yes' ? (
            <>
              <div className="form-group">
                <label className="form-label">
                  Срок страхования: <span className="form-value-highlight">{insuranceTerm} лет</span>
                </label>
                <div className="range-container">
                  <input
                    type="range"
                    min="1"
                    max="30"
                    value={insuranceTerm}
                    onChange={(e) => setInsuranceTerm(e.target.value)}
                    className="range-input"
                    style={{'--range-progress': `${((insuranceTerm - 1) / 29) * 100}%`}}
                  />
                  <span className="range-value">{insuranceTerm}</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Страховая сумма (руб.)</label>
                <input
                  type="text"
                  className="form-input"
                  value={insuranceSum}
                  onChange={handleSumChange}
                  placeholder="Минимум 1.000.000"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Периодичность оплаты</label>
                <div className="option-buttons horizontal-always">
                  <button
                    className={`option-button ${insuranceFrequency === 'Ежегодно' ? 'selected' : ''}`}
                    onClick={() => setInsuranceFrequency('Ежегодно')}
                  >
                    Ежегодно
                  </button>
                  <button
                    className={`option-button ${insuranceFrequency === 'Ежемесячно' ? 'selected' : ''}`}
                    onClick={() => setInsuranceFrequency('Ежемесячно')}
                  >
                    Ежемесячно
                  </button>
                </div>
                <div className="option-buttons horizontal-always">
                  <button
                    className={`option-button ${insuranceFrequency === 'Поквартально' ? 'selected' : ''}`}
                    onClick={() => setInsuranceFrequency('Поквартально')}
                  >
                    Ежеквартально
                  </button>
                  <button
                    className={`option-button ${insuranceFrequency === 'Полугодие' ? 'selected' : ''}`}
                    onClick={() => setInsuranceFrequency('Полугодие')}
                  >
                    Раз в пол года
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label">Есть ли у вас работа?</label>
                <div className="option-buttons horizontal-always">
                  <button
                    className={`option-button ${hasJob === 'yes' ? 'selected' : ''}`}
                    onClick={() => setHasJob('yes')}
                  >
                    Да
                  </button>
                  <button
                    className={`option-button ${hasJob === 'no' ? 'selected' : ''}`}
                    onClick={() => setHasJob('no')}
                  >
                    Нет
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Доходы 2021 г. (руб.)</label>
                <input
                  type="text"
                  className="form-input"
                  value={income2021}
                  onChange={handleIncome2021Change}
                  placeholder="Введите сумму"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Доходы 2022 г. (руб.)</label>
                <input
                  type="text"
                  className="form-input"
                  value={income2022}
                  onChange={handleIncome2022Change}
                  placeholder="Введите сумму"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Доходы 2023 г. (руб.)</label>
                <input
                  type="text"
                  className="form-input"
                  value={income2023}
                  onChange={handleIncome2023Change}
                  placeholder="Введите сумму"
                />
              </div>
            </>
          )}
        </div>
      );
    }

    // Шаг 3 - дополнительные опции
    if (stage === 'form3') {
      return (
        <div className={`card-container card-positioned ${contentAnimated ? 'animated' : ''}`}>
          <h2 className="text-h2">
            {insuranceInfo === 'yes' ? 'Дополнительные пакеты' : 'Дополнительная информация'}
          </h2>
          <p className="text-small text-center">Шаг 3 из 3</p>
          
          {insuranceInfo === 'yes' ? (
            <>
              <div className="form-group">
                <label className="form-label">Пакет «Несчастный случай»</label>
                <div className="button-group-options">
                  <button
                    className={`button-option ${accidentPackage === 'yes' ? 'selected' : ''}`}
                    onClick={() => setAccidentPackage('yes')}
                  >
                    Включить
                  </button>
                  <button
                    className={`button-option ${accidentPackage === 'no' ? 'selected' : ''}`}
                    onClick={() => setAccidentPackage('no')}
                  >
                    Не включать
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Пакет «Критические заболевания»</label>
                <div className="button-group-options">
                  <button
                    className={`button-option ${criticalPackage === 'yes' ? 'selected' : ''}`}
                    onClick={() => setCriticalPackage('yes')}
                  >
                    Включить
                  </button>
                  <button
                    className={`button-option ${criticalPackage === 'no' ? 'selected' : ''}`}
                    onClick={() => setCriticalPackage('no')}
                  >
                    Не включать
                  </button>
                </div>
              </div>

              {criticalPackage === 'yes' && (
                <div className="form-group">
                  <label className="form-label">Регион лечения</label>
                  <div className="button-group-options">
                    <button
                      className={`button-option ${treatmentRegion === 'russia' ? 'selected' : ''}`}
                      onClick={() => setTreatmentRegion('russia')}
                    >
                      Россия
                    </button>
                    <button
                      className={`button-option ${treatmentRegion === 'abroad' ? 'selected' : ''}`}
                      onClick={() => setTreatmentRegion('abroad')}
                    >
                      За рубежом
                    </button>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Любительский спорт</label>
                <div className="button-group-options">
                  <button
                    className={`button-option ${sportPackage === 'yes' ? 'selected' : ''}`}
                    onClick={() => setSportPackage('yes')}
                  >
                    Включить
                  </button>
                  <button
                    className={`button-option ${sportPackage === 'no' ? 'selected' : ''}`}
                    onClick={() => setSportPackage('no')}
                  >
                    Не включать
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label">Являетесь ли вы основным кормильцем?</label>
                <div className="button-group-options">
                  <button
                    className={`button-option ${breadwinnerStatus === 'yes' ? 'selected' : ''}`}
                    onClick={() => setBreadwinnerStatus('yes')}
                  >
                    Да
                  </button>
                  <button
                    className={`button-option ${breadwinnerStatus === 'no' ? 'selected' : ''}`}
                    onClick={() => setBreadwinnerStatus('no')}
                  >
                    Нет
                  </button>
                </div>
              </div>

              {breadwinnerStatus === 'no' && (
                <div className="form-group">
                  <label className="form-label">Доля вашего дохода в семейном бюджете (%)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={incomeShare}
                    onChange={(e) => setIncomeShare(e.target.value)}
                    min="0"
                    max="100"
                    placeholder="Введите процент"
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Количество детей</label>
                <input
                  type="number"
                  className="form-input"
                  value={childrenCount}
                  onChange={(e) => setChildrenCount(e.target.value)}
                  min="0"
                  placeholder="Введите количество"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Есть ли родственники, нуждающиеся в особом уходе?</label>
                <div className="option-buttons horizontal-always">
                  <button
                    className={`option-button ${specialCareRelatives === 'yes' ? 'selected' : ''}`}
                    onClick={() => setSpecialCareRelatives('yes')}
                  >
                    Да
                  </button>
                  <button
                    className={`option-button ${specialCareRelatives === 'no' ? 'selected' : ''}`}
                    onClick={() => setSpecialCareRelatives('no')}
                  >
                    Нет
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className={`main-container ${isExiting ? 'exiting' : ''}`}>
      {/* Логотип */}
      <div className={`logo-wrapper ${logoAnimated ? 'animated' : ''}`}>
        <img src={logoImage} alt="Logo" className="logo-image" />
      </div>

      {/* Контент */}
      {renderStep()}

      {/* Кнопки навигации */}
      {(stage === 'form2' || stage === 'form3') && (
        <button className="back-btn animate-home" onClick={handlePrev}>
          <svg viewBox="0 0 24 24">
            <path d="M15 18l-6-6 6-6" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}

      {stage === 'email' && (
        <button className="home-button" onClick={goToMenu}>
          <svg viewBox="0 0 24 24">
            <path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1V11z" stroke="white" strokeWidth="2" fill="none"/>
          </svg>
        </button>
      )}

      {(stage === 'email' || stage === 'form1' || stage === 'form2' || stage === 'form3') && !isProcessing && (
        <button 
          className={`next-btn ${contentAnimated && canGoNext() ? 'animate-next' : ''} ${isExiting ? 'animate-next-exit' : ''} ${!canGoNext() ? 'disabled' : ''}`} 
          onClick={handleNext} 
          disabled={!canGoNext()}
        >
          <div className={`shaker ${contentAnimated && canGoNext() && !isExiting ? 'shake-btn' : ''}`}>
            <svg viewBox="0 0 24 24">
              <path d="M9 18l6-6-6-6" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </button>
      )}
    </div>
  );
};

export default JustincasePage;








































