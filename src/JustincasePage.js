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

/**
 * Вычисляет рекомендованную страховую сумму и срок страхования
 * на основе данных из формы, повторяя логику Excel.
 *
 * @param {Object} params
 * @param {string|null} params.birthDate Дата рождения в формате ISO (YYYY-MM-DD) или null
 * @param {string|null} params.hasJob Статус занятости (yes, no, student)
 * @param {string} params.income2022 Доход за 2022 год (строка с пробелами/точками)
 * @param {string} params.income2023 Доход за 2023 год (строка с пробелами/точками)
 * @param {string} params.income2024 Доход за 2024 год (строка с пробелами/точками)
 * @param {string} params.scholarship Стипендия (строка)
 * @param {string} params.unsecuredLoans Незастрахованные кредиты (строка)
 * @param {string|null} params.breadwinnerStatus Статус кормильца (yes, no)
 * @param {string} params.incomeShare Доля дохода в семейном бюджете
 * @param {string} params.childrenCount Количество детей
 * @param {string|null} params.specialCareRelatives Родственники, требующие ухода (yes, no)
 * @returns {{recommendedSum: number, recommendedTerm: number}} Рекомендованная сумма и срок
 */
function computeRecommended({
  birthDate,
  hasJob,
  income2022,
  income2023,
  income2024,
  scholarship,
  unsecuredLoans,
  breadwinnerStatus,
  incomeShare,
  childrenCount,
  specialCareRelatives
}) {
  // Вспомогательная функция: преобразовать строку с точками/пробелами в число
  const toNumber = (v) => {
    if (!v) return null;
    const cleaned = v.toString().replace(/[.\s]/g, '');
    const num = parseInt(cleaned, 10);
    return Number.isNaN(num) ? null : num;
  };

  // Определяем возраст
  let age = null;
  if (birthDate) {
    const today = new Date();
    const bd = new Date(birthDate);
    age = today.getFullYear() - bd.getFullYear();
    const m = today.getMonth() - bd.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) {
      age--;
    }
  }

  // Среднегодовой доход: берём непустые значения
  const incomeVals = [income2022, income2023, income2024, scholarship]
    .map(toNumber)
    .filter((n) => typeof n === 'number');
  const avgIncome = incomeVals.length ? incomeVals.reduce((a, b) => a + b, 0) / incomeVals.length : 0;

  // Коэффициент за долю дохода в семье
  const normalizeShare = (s) => {
    if (!s) return '';
    return s
      .toString()
      .replace(/\s+/g, '')
      .replace(/–/g, '-')
      .replace(/%-/g, '-')
      .replace(/%/g, '%');
  };
  const shareKey = normalizeShare(incomeShare);
  const shareMap = {
    'до10%': 1,
    'до10%': 1, // поддержка различных вариаций
    'до10%': 1,
    '10-24%': 1.4,
    '10–24%': 1.4,
    '25-49%': 1.8,
    '25–49%': 1.8,
    '50-74%': 2.2,
    '50–74%': 2.2,
    '75-89%': 2.6,
    '75–89%': 2.6,
    '75%-89%': 2.6,
    'более90%': 3,
    'более90%': 3,
    'Более90%': 3,
    'Более90%': 3
  };
  let breadwinnerCoeff = 1;
  if (breadwinnerStatus === 'yes') {
    breadwinnerCoeff = 3;
  } else if (breadwinnerStatus === 'no') {
    breadwinnerCoeff = shareMap[shareKey] ?? 1;
  }

  // Коэффициент по количеству детей
  const normalizeChildren = (s) => {
    if (!s) return '';
    return s
      .toString()
      .trim()
      .replace(/\s+/g, '')
      .replace('обильнее', '3 и более');
  };
  const childrenKey = normalizeChildren(childrenCount);
  const childrenMap = {
    '0': 1,
    '1': 1.25,
    '2': 1.40625,
    '3иболее': 1.523438,
    '3ибольше': 1.523438,
    '3иболее': 1.523438,
    '3ибольше': 1.523438,
    '3иБолее': 1.523438,
    '3иБольше': 1.523438,
    '3иболее': 1.523438,
    '3иБолее': 1.523438
  };
  let childrenCoeff = childrenMap[childrenKey] ?? 1;

  // Коэффициент за родственников, требующих ухода
  const specialCoeff = specialCareRelatives === 'yes' ? 1.3 : 1;

  const productCoeff = breadwinnerCoeff * childrenCoeff * specialCoeff;

  // Кредиты
  const loans = toNumber(unsecuredLoans) || 0;

  // Возрастной коэффициент F5
  let f5 = 3;
  if (typeof age === 'number') {
    if (age <= 34) {
      f5 = 10;
    } else if (age <= 44) {
      f5 = 8;
    } else if (age <= 49) {
      f5 = 7;
    } else if (age <= 54) {
      f5 = 6;
    } else if (age <= 59) {
      f5 = 5;
    } else {
      f5 = 3;
    }
  }

  // Максимальная страховая сумма
  let maxSum;
  if (hasJob === 'yes') {
    maxSum = avgIncome * f5;
  } else if (hasJob === 'student') {
    maxSum = avgIncome * 10;
  } else {
    maxSum = 1_000_000;
  }

  // Базовая рекомендуемая сумма
  let baseSum;
  if (hasJob === 'no') {
    baseSum = 1_000_000;
  } else {
    baseSum = avgIncome * productCoeff + loans;
  }

  // Итоговая рекомендованная сумма (минимум из базовой и максимальной)
  let recommendedSum = Math.min(baseSum, maxSum);
  // Округляем до 100 000
  recommendedSum = Math.round(recommendedSum / 100000) * 100000;

  // Срок страхования
  let recommendedTerm = 0;
  if (typeof age === 'number') {
    if (age > 70) {
      recommendedTerm = Math.max(75 - age, 0);
    } else {
      recommendedTerm = Math.min(Math.max(5, 60 - age), 15);
    }
  }
  return { recommendedSum, recommendedTerm };
}

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
  const [income2022, setIncome2022] = useState('');
  const [income2023, setIncome2023] = useState('');
  const [income2024, setIncome2024] = useState('');
  const [scholarship, setScholarship] = useState('');
  const [unsecuredLoans, setUnsecuredLoans] = useState('0');

  const [breadwinnerStatus, setBreadwinnerStatus] = useState(null);
  const [incomeShare, setIncomeShare] = useState('');
  const [childrenCount, setChildrenCount] = useState('');
  const [specialCareRelatives, setSpecialCareRelatives] = useState(null);

  // Новые состояния для рекомендованной суммы
  const [recommendedSum, setRecommendedSum] = useState('');
  const [isCalculatingRecommended, setIsCalculatingRecommended] = useState(false);
  const [showRecommendedSum, setShowRecommendedSum] = useState(false);

  const [managerSurname, setManagerSurname] = useState('');
  const [managerName, setManagerName] = useState('');
  const [managerCity, setManagerCity] = useState('');
  const [managerError, setManagerError] = useState('');
  const [isSendingManager, setIsSendingManager] = useState(false);
  const [managerSent, setManagerSent] = useState(false);
  const [resultPage, setResultPage] = useState(0);

  // Шаги
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultData, setResultData] = useState(null);

  // Функция для расчета возраста из даты рождения
  const calculateAge = (birthDate) => {
    if (!birthDate) return null; // Не устанавливаем значение по умолчанию
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

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
  const handleIncome2022Change = e => setIncome2022(formatSum(e.target.value));
  const handleIncome2023Change = e => setIncome2023(formatSum(e.target.value));
  const handleIncome2024Change = e => setIncome2024(formatSum(e.target.value));
  const handleScholarshipChange = e => setScholarship(formatSum(e.target.value));
  const handleUnsecuredLoansChange = e => setUnsecuredLoans(formatSum(e.target.value));

  // Функция расчета рекомендованной суммы и срока на клиенте
  const calculateRecommendedSum = async () => {
    setIsCalculatingRecommended(true);
    try {
      const { recommendedSum, recommendedTerm } = computeRecommended({
        birthDate: birthDate ? birthDate.toISOString().split('T')[0] : null,
        hasJob,
        income2022,
        income2023,
        income2024,
        scholarship,
        unsecuredLoans,
        breadwinnerStatus,
        incomeShare,
        childrenCount,
        specialCareRelatives
      });
      // Обновляем состояния
      setRecommendedSum(formatSum(String(recommendedSum)));
      setInsuranceSum(formatSum(String(recommendedSum)));
      setInsuranceTerm(String(recommendedTerm));
      setShowRecommendedSum(true);
      setStage('recommended');
    } catch (error) {
      console.error('❌ Ошибка расчета рекомендованной суммы:', error);
      alert('Ошибка при расчете рекомендованной суммы');
      // При ошибке устанавливаем стандартное значение
      setInsuranceSum('1.000.000');
      setStage('recommended');
    } finally {
      setIsCalculatingRecommended(false);
    }
  };

  // Функция форматирования чисел для отображения
  const formatNumber = (value) => {
    if (!value) return '0';
    
    // Преобразуем в число, если это строка с десятичной частью
    let numValue = parseFloat(value);
    if (isNaN(numValue)) return '0';
    
    // Округляем до целого числа (премии в рублях обычно целые)
    numValue = Math.round(numValue);
    
    // Форматируем с пробелами как разделителями тысяч
    return numValue.toString().replace(/(\d)(?=(\d{3})+$)/g, '$1 ');
  };

  // Функция очистки пользовательского ввода суммы
  const parseUserSum = (value) => {
    if (!value) return '';
    // Удаляем точки и пробелы, оставляем только цифры
    const cleanValue = value.toString().replace(/[.\s]/g, '');
    return cleanValue;
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
        : (hasJob && income2022 && income2023 && income2024 && (hasJob !== 'student' || scholarship));
    }
    if (stage === 'form3') {
      if (insuranceInfo === 'yes') {
        return accidentPackage && criticalPackage && (criticalPackage === 'no' || treatmentRegion) && sportPackage;
      } else {
        return breadwinnerStatus &&
               (breadwinnerStatus === 'yes' || breadwinnerStatus === 'not_breadwinner' || incomeShare) &&
               childrenCount &&
               specialCareRelatives;
      }
    }
    if (stage === 'recommended') {
      return insuranceSum && insuranceTerm && insuranceFrequency;
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
      if (insuranceInfo === 'no') {
        // Рассчитываем рекомендованную сумму
        calculateRecommendedSum();
      } else {
        doCalculation();
      }
    } else if (stage === 'recommended') {
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
      case 'recommended':
        setStage('form3');
        break;
      case 'result':
        setStage(insuranceInfo === 'no' ? 'recommended' : 'form3');
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
    setHasJob(null); setIncome2022(''); setIncome2023(''); setIncome2024('');
    setScholarship(''); setUnsecuredLoans('0');
    setBreadwinnerStatus(null); setIncomeShare(''); setChildrenCount(''); setSpecialCareRelatives(null);
    setResultData(null); setIsProcessing(false); setStage('form1');
    setRecommendedSum(''); setShowRecommendedSum(false);
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
      // Рассчитываем возраст из даты рождения
      const calculateAge = (birthDate) => {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
          age--;
        }
        
        return age;
      };

      const age = birthDate ? calculateAge(birthDate) : null;

      const payload = {
        age: age,
        gender: gender === 'Мужской' ? 'm' : 'f',
        term_years: parseInt(insuranceTerm),
        sum_insured: parseFloat(insuranceSum ? insuranceSum.replace(/\./g, '') : '0'),
        include_accident: accidentPackage === 'yes',
        include_critical_illness: criticalPackage === 'yes',
        critical_illness_type: treatmentRegion === 'abroad' ? 'abroad' : 'rf',
        payment_frequency: insuranceFrequency === 'Раз в год' ? 'annual' : 
                          insuranceFrequency === 'Раз в полгода' ? 'semi_annual' :
                          insuranceFrequency === 'Раз в квартал' ? 'quarterly' : 'monthly'
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
      
      console.log('🔍 ОТЛАДКА: Полученные данные от API:', data);
      
      if (data.success && data.calculation_result) {
        const calc = data.calculation_result;
        
        console.log('📊 ОТЛАДКА: calculation_result:', calc);
        console.log('💰 ОТЛАДКА: criticalPremium:', calc.criticalPremium);
        console.log('💰 ОТЛАДКА: totalPremium:', calc.totalPremium);
        console.log('💰 ОТЛАДКА: deathPremium:', calc.deathPremium);
        
        processedData = {
          success: true,
          calculationDate: new Date().toLocaleDateString('ru-RU'),
          clientAge: calc.clientAge,
          clientGender: calc.clientGender || (gender === 'Мужской' ? 'Мужской' : 'Женский'),
          insuranceTerm: calc.insuranceTerm || insuranceTerm,
          baseInsuranceSum: formatNumber(calc.baseInsuranceSum || calc.insuranceSum || insuranceSum),
          basePremium: formatNumber(calc.basePremium || calc.basePremiumAmount || calc.annualPremium || '0'),
          basePremiumRaw: calc.basePremium || calc.basePremiumAmount || calc.annualPremium || 0, // Сырое значение для расчетов
          
          // Основные премии
          deathPremium: calc.deathPremium || 0,
          disabilityPremium: calc.disabilityPremium || 0,
          
          // Несчастный случай
          accidentPackageIncluded: accidentPackage === 'yes',  // Используем локальное значение
          accidentInsuranceSum: formatNumber(calc.accidentInsuranceSum || calc.accidentDetails?.insuranceSum || insuranceSum),
          accidentPremium: formatNumber(calc.accidentPremium || calc.accidentDetails?.premium || '0'),
          accidentDeathPremium: calc.accidentDeathPremium || 0,
          trafficDeathPremium: calc.trafficDeathPremium || 0,
          injuryPremium: calc.injuryPremium || 0,
          
          // Критические заболевания
          criticalPackageIncluded: criticalPackage === 'yes',  // Используем локальное значение
          criticalInsuranceSum: formatNumber(calc.criticalInsuranceSum || calc.criticalDetails?.insuranceSum || '60 000 000'),
          criticalPremium: calc.criticalPremium || calc.criticalDetails?.premium || 0,
          criticalRehabilitationSum: calc.criticalRehabilitationSum || 0,
          
          totalPremium: calc.totalPremium || calc.annualPremium || 0,
          treatmentRegion: treatmentRegion || calc.treatmentRegion,  // Используем локальное значение
          sportPackage: sportPackage === 'yes',  // Используем локальное значение
          calculationId: calc.calculationId || data.calculation_id || 'unknown',
          calculator: data.calculator || 'JustincaseCalculatorComplete',
          version: data.version || '2.0.0'
        };
        
        console.log('💰 ОТЛАДКА: processedData.totalPremium:', processedData.totalPremium);
        console.log('💰 ОТЛАДКА: processedData.criticalPremium:', processedData.criticalPremium);
      } else if (data.success) {
        processedData = {
          ...data,
          clientAge: data.clientAge,
          clientGender: data.clientGender || (gender === 'Мужской' ? 'Мужской' : 'Женский'),
          insuranceTerm: data.insuranceTerm || insuranceTerm,
          baseInsuranceSum: formatNumber(data.baseInsuranceSum || insuranceSum),
          basePremium: formatNumber(data.basePremium || '0'),
          basePremiumRaw: data.basePremium || 0, // Сырое значение для расчетов
          
          // Основные премии
          deathPremium: data.deathPremium || 0,
          disabilityPremium: data.disabilityPremium || 0,
          
          // Несчастный случай
          totalPremium: data.totalPremium || 0,
          accidentPackageIncluded: accidentPackage === 'yes',  // Используем локальное значение
          accidentInsuranceSum: formatNumber(data.accidentInsuranceSum || insuranceSum),
          accidentPremium: formatNumber(data.accidentPremium || '0'),
          accidentDeathPremium: data.accidentDeathPremium || 0,
          trafficDeathPremium: data.trafficDeathPremium || 0,
          injuryPremium: data.injuryPremium || 0,
          
          // Критические заболевания
          criticalPackageIncluded: criticalPackage === 'yes',  // Используем локальное значение
          criticalPremium: data.criticalPremium || 0,
          criticalRehabilitationSum: data.criticalRehabilitationSum || 0,
          
          treatmentRegion: treatmentRegion,  // Используем локальное значение
          sportPackage: sportPackage === 'yes'  // Используем локальное значение
        };
      } else {
        throw new Error(data.error || 'Неизвестная ошибка расчета');
      }
      
      console.log('✅ Обработанные данные:', processedData);
      console.log('📊 Флаги включения пакетов в результате:', {
        accidentPackageIncluded: processedData.accidentPackageIncluded,
        criticalPackageIncluded: processedData.criticalPackageIncluded,
        treatmentRegion: processedData.treatmentRegion,
        sportPackage: processedData.sportPackage
      });
      
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

    if (stage === 'processing' || isCalculatingRecommended) {
      return (
        <div className={`card-container card-positioned ${contentAnimated ? 'animated' : ''}`}>
          <h2 className="text-h2 text-center">
            {isCalculatingRecommended 
              ? 'Рассчитываем оптимальную сумму страхования...'
              : `Идёт расчёт на основе введенных параметров...`
            }
          </h2>
          <div className="progress-indicator-wrapper">
            <div className="assessment-spinner" />
          </div>
        </div>
      );
    }

    // Экран с рекомендованной суммой
    if (stage === 'recommended') {
      return (
        <div className={`card-container card-positioned scrollable ${contentAnimated ? 'animated' : ''}`}>
          <div className="card-content">
            <h2 className="text-h2">Расчет по программе <br/>"На всякий случай"</h2>
            <p className="text-body-dark text-center">
              На основе ваших данных мы рассчитали оптимальную сумму страхования
            </p>
            
            <div className="recommended-sum-display">
              <p className="text-label-large">Рекомендованная сумма:</p>
              <p className="text-h1-dark">{recommendedSum} руб.</p>
            </div>

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
              <p className="text-small text-center" style={{marginTop: '8px'}}>
                Вы можете изменить рекомендованную сумму
              </p>
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
          </div>
        </div>
      );
    }

    // Шаг результатов
    if (stage === 'result' && resultData) {
      
      // Компонент итоговой стоимости для отображения внизу каждой страницы
      const TotalCostBlock = () => (
        <div className="total-cost-block">
          <div className="result-divider"></div>
          <div className="result-item-split highlight">
            <span className="result-label-left"><strong>Итоговая стоимость полиса:</strong></span>
            <span className="result-value-right">
              <strong>{(typeof resultData.totalPremium === 'string' ? resultData.totalPremium : Number(resultData.totalPremium || 0).toLocaleString('ru-RU'))} руб.</strong>
            </span>
          </div>
        </div>
      );

      // Создаем массив страниц карусели динамически
      const carouselPages = [];
      
      // Страница 1: Основные риски (всегда показываем)
      carouselPages.push(
        <div key="main-risks">
          <h2 className="text-h2 text-center">
            Ваша программа <br/>«На всякий случай»
          </h2>
          <p className="text-small text-center">
            (расчет от {resultData.calculationDate || new Date().toLocaleDateString('ru-RU')})
          </p>

          {/* Основные параметры */}
          <div className="result-section">
            <h3 className="text-h3 text-center">Основные параметры</h3>
            <div className="result-item-split" style={{marginBottom: '8px'}}>
              <span className="result-label-left">Возраст:</span>
              <span className="result-value-right">{resultData.clientAge} лет</span>
            </div>
            <div className="result-item-split" style={{marginBottom: '8px'}}>
              <span className="result-label-left">Пол:</span>
              <span className="result-value-right">{resultData.clientGender}</span>
            </div>
            <div className="result-item-split" style={{marginBottom: '8px'}}>
              <span className="result-label-left">Срок страхования:</span>
              <span className="result-value-right">{resultData.insuranceTerm} лет</span>
            </div>
            <div className="result-item-split" style={{marginBottom: '8px'}}>
              <span className="result-label-left">Порядок оплаты премии:</span>
              <span className="result-value-right">{insuranceFrequency || 'Ежегодно'}</span>
            </div>
          </div>

          <div className="result-section">
            <h3 className="text-h3 text-center">Основная программа</h3>
            <p className="text-small text-center">
              Страхование на случай ухода из жизни и инвалидности I и II группы по любой причине
            </p>

            {/* Страховая сумма */}
            <div className="result-item-split" style={{marginBottom: '8px'}}>
              <span className="result-label-left">Страховая сумма:</span>
              <span className="result-value-right">
                {(resultData.baseInsuranceSum || parseUserSum(resultData.insuranceSum))} руб.
              </span>
            </div>

            <h4 className="text-h4 text-center">Страховая премия по рискам:</h4>

            {/* Смерть ЛП */}
            <div className="result-item-split" style={{marginBottom: '8px'}}>
              <span className="result-label-left">Смерть ЛП:</span>
              <span className="result-value-right">
                {formatNumber(Math.round(resultData.deathPremium || 0))} руб.
              </span>
            </div>

            {/* Инвалидность */}
            <div className="result-item-split" style={{marginBottom: '8px'}}>
              <span className="result-label-left">Инвалидность 1,2 гр.:</span>
              <span className="result-value-right">
                {formatNumber(Math.round(resultData.disabilityPremium || 0))} руб.
              </span>
            </div>
          </div>
          
          {/* Итоговая стоимость внизу страницы */}
          <TotalCostBlock />
        </div>
      );

      // Страница 2: Дополнительные риски (показываем только если есть дополнительные пакеты)
      const hasAdditionalPackages = resultData.accidentPackageIncluded || resultData.criticalPackageIncluded || resultData.sportPackage;
      
      if (hasAdditionalPackages) {
        carouselPages.push(
          <div key="additional-risks">
            <h2 className="text-h2 text-center">Дополнительные риски</h2>
            <div className="result-section">

              {/* Пакет "Несчастный случай" */}
              {resultData.accidentPackageIncluded ? (
                <>
                  <h4 className="text-h4">Пакет «Несчастный случай»</h4>
                  <div className="result-item-split">
                    <span className="result-label-left">• Смерть НС:</span>
                    <span className="result-value-right">
                      {formatNumber(Math.round(resultData.accidentDeathPremium || (resultData.accidentPremium * 0.4) || 0))} руб.
                    </span>
                  </div>
                  <div className="result-item-split">
                    <span className="result-label-left">• Смерть ДТП:</span>
                    <span className="result-value-right">
                      {formatNumber(Math.round(resultData.trafficDeathPremium || (resultData.accidentPremium * 0.3) || 0))} руб.
                    </span>
                  </div>
                  <div className="result-item-split">
                    <span className="result-label-left">• Травмы:</span>
                    <span className="result-value-right">
                      {formatNumber(Math.round(resultData.injuryPremium || (resultData.accidentPremium * 0.3) || 0))} руб.
                    </span>
                  </div>
                  <div className="result-item-split">
                    <span className="result-label-left">Страховая сумма НС:</span>
                    <span className="result-value-right">
                      {(resultData.accidentInsuranceSum || parseUserSum(resultData.insuranceSum))} руб.
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-small">Пакет «Несчастный случай» не включён</p>
              )}

              <div className="result-divider"></div>

              {/* Пакет "Критические заболевания" */}
              {resultData.criticalPackageIncluded ? (
                <>
                  <h4 className="text-h4">
                    Пакет «Критические заболевания
                    {resultData.treatmentRegion === 'russia' ? ' (лечение в РФ)' : ' (лечение за рубежом)'}»
                  </h4>
                  <div className="result-item-split">
                    <span className="result-label-left">• Стоимость защиты:</span>
                    <span className="result-value-right">
                      {(typeof resultData.criticalPremium === 'string' ? resultData.criticalPremium : Number(resultData.criticalPremium || 0).toLocaleString('ru-RU'))} руб.
                    </span>
                  </div>
                  <div className="result-item-split">
                    <span className="result-label-left">• Защита:</span>
                    <span className="result-value-right">
                      60 000 000 руб.
                    </span>
                  </div>
                  <div className="result-item-split">
                    <span className="result-label-left">• Реабилитация:</span>
                    <span className="result-value-right">
                      400 000 руб.
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-small">Пакет «Критические заболевания» не включён</p>
              )}

              <div className="result-divider"></div>

              {/* Опция "Любительский спорт" - показываем только если выбрана */}
              {resultData.sportPackage && (
                <>
                  <h4 className="text-h4">Опция «Любительский спорт»</h4>
                  <p className="text-small">
                    ✅ Включена (учтена в расчете премий НС)
                  </p>
                </>
              )}
            </div>
            
            {/* Итоговая стоимость внизу страницы */}
            <TotalCostBlock />
          </div>
        );
      }

  return (
    <div className={`card-container card-positioned card-results scrollable ${contentAnimated ? 'animated' : ''}`}>
      {carouselPages[resultPage]}
      
      {/* Навигация карусели */}
      <div className="carousel-navigation-bottom">
        {resultPage > 0 ? (
          <button
            type="button"
            className="carousel-arrow carousel-arrow-left"
            onClick={() => setResultPage(resultPage - 1)}
            aria-label="Назад"
          >
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path d="M15 18l-6-6 6-6" stroke="#7B7B7B" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        ) : (
          <span className="carousel-arrow-placeholder" />
        )}

        {/* Индикаторы страниц */}
        <div className="page-indicators">
          {carouselPages.map((_, index) => (
            <button
              key={index}
              className={`page-indicator ${index === resultPage ? 'active' : ''}`}
              onClick={() => setResultPage(index)}
              aria-label={`Страница ${index + 1}`}
            />
          ))}
        </div>

        {resultPage < carouselPages.length - 1 ? (
          <button
            type="button"
            className="carousel-arrow carousel-arrow-right"
            onClick={() => setResultPage(resultPage + 1)}
            aria-label="Вперёд"
          >
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path d="M9 18l6-6-6-6" stroke="#7B7B7B" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        ) : (
          <span className="carousel-arrow-placeholder" />
        )}
      </div>
      <div className="button-group">
        <button 
          className="btn-universal btn-primary btn-medium" 
          onClick={() => setStage('manager')}
        >
          Связаться с менеджером
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
        <div className={`card-container card-positioned scrollable ${contentAnimated ? 'animated' : ''}`}>
          <div className="card-content">
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
                  <select
                    className="form-input"
                    value={hasJob || ''}
                    onChange={(e) => setHasJob(e.target.value)}
                  >
                    <option value="">Выберите вариант</option>
                    <option value="yes">Да</option>
                    <option value="no">Нет</option>
                    <option value="student">Работающий студент</option>
                  </select>
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

                <div className="form-group">
                  <label className="form-label">Доходы 2024 г. (руб.)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={income2024}
                    onChange={handleIncome2024Change}
                    placeholder="Введите сумму"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Есть ли незащищенные (незастрахованные) кредиты? (руб.)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={unsecuredLoans}
                    onChange={handleUnsecuredLoansChange}
                    placeholder="Введите 0 если кредитов нет"
                  />
                </div>

                {hasJob === 'student' && (
                  <div className="form-group">
                    <label className="form-label">Размер стипендии за предыдущий год (руб.)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={scholarship}
                      onChange={handleScholarshipChange}
                      placeholder="Введите размер стипендии"
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      );
    }

    // Шаг 3 - дополнительные опции
    if (stage === 'form3') {
      return (
        <div className={`card-container card-positioned scrollable ${contentAnimated ? 'animated' : ''}`}>
          <div className="card-content">
            <h2 className="text-h2">
              {insuranceInfo === 'yes' ? 'Дополнительные пакеты' : 'Дополнительная информация'}
            </h2>
            <p className="text-small text-center">Шаг 3 из 3</p>
            
            {insuranceInfo === 'yes' ? (
              <>
                <div className="form-group">
                  <label className="form-label">Пакет «Несчастный случай»</label>
                  <div className="option-buttons horizontal-always">
                    <button
                      className={`option-button ${accidentPackage === 'yes' ? 'selected' : ''}`}
                      onClick={() => setAccidentPackage('yes')}
                    >
                      Включить
                    </button>
                    <button
                      className={`option-button ${accidentPackage === 'no' ? 'selected' : ''}`}
                      onClick={() => setAccidentPackage('no')}
                    >
                      Не включать
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Пакет «Критические заболевания»</label>
                  <div className="option-buttons horizontal-always">
                    <button
                      className={`option-button ${criticalPackage === 'yes' ? 'selected' : ''}`}
                      onClick={() => setCriticalPackage('yes')}
                    >
                      Включить
                    </button>
                    <button
                      className={`option-button ${criticalPackage === 'no' ? 'selected' : ''}`}
                      onClick={() => setCriticalPackage('no')}
                    >
                      Не включать
                    </button>
                  </div>
                </div>

                {criticalPackage === 'yes' && (
                  <div className="form-group">
                    <label className="form-label">Регион лечения</label>
                    <div className="option-buttons horizontal-always">
                      <button
                        className={`option-button ${treatmentRegion === 'russia' ? 'selected' : ''}`}
                        onClick={() => setTreatmentRegion('russia')}
                      >
                        Россия
                      </button>
                      <button
                        className={`option-button ${treatmentRegion === 'abroad' ? 'selected' : ''}`}
                        onClick={() => setTreatmentRegion('abroad')}
                      >
                        За рубежом
                      </button>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Любительский спорт</label>
                  <div className="option-buttons horizontal-always">
                    <button
                      className={`option-button ${sportPackage === 'yes' ? 'selected' : ''}`}
                      onClick={() => setSportPackage('yes')}
                    >
                      Включить
                    </button>
                    <button
                      className={`option-button ${sportPackage === 'no' ? 'selected' : ''}`}
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
                  <label className="form-label">Вы единственный кормилец в семье?</label>
                  <select
                    className="form-input"
                    value={breadwinnerStatus || ''}
                    onChange={(e) => setBreadwinnerStatus(e.target.value)}
                  >
                    <option value="">Выберите вариант</option>
                    <option value="yes">Да</option>
                    <option value="no">Нет</option>
                    <option value="not_breadwinner">Не являюсь кормильцем</option>
                  </select>
                </div>

                {breadwinnerStatus === 'no' && (
                  <div className="form-group">
                    <label className="form-label">Доля вашего дохода в семейном бюджете (%)</label>
                    <select
                      className="form-input"
                      value={incomeShare}
                      onChange={(e) => setIncomeShare(e.target.value)}
                    >
                      <option value="">Выберите долю дохода</option>
                      <option value="до 10%">до 10%</option>
                      <option value="10-24%">10-24%</option>
                      <option value="25-49%">25-49%</option>
                      <option value="50-74%">50-74%</option>
                      <option value="75-89%">75-89%</option>
                      <option value="Более 90%">Более 90%</option>
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Количество детей</label>
                  <select
                    className="form-input"
                    value={childrenCount}
                    onChange={(e) => setChildrenCount(e.target.value)}
                  >
                    <option value="">Выберите количество</option>
                    <option value="0">0</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3 и более">3 и более</option>
                  </select>
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
        </div>
      );
    }

    // Форма связи с менеджером
    if (stage === 'manager') {
      return (
        <div className={`card-container card-positioned ${contentAnimated ? 'animated' : ''}`}>
          <h2 className="text-h2">Введите Ваши данные</h2>
          <p className="text-small text-center">
            Для связи с менеджером заполните форму ниже
          </p>
          
          <div className="form-group">
            <label className="form-label">Фамилия</label>
            <input
              type="text"
              className={`form-input ${managerError && !managerSurname.trim() ? 'error' : ''}`}
              value={managerSurname}
              onChange={(e) => {
                setManagerSurname(e.target.value);
                if (managerError) setManagerError('');
              }}
              placeholder="Введите фамилию"
              disabled={isSendingManager}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Имя</label>
            <input
              type="text"
              className={`form-input ${managerError && !managerName.trim() ? 'error' : ''}`}
              value={managerName}
              onChange={(e) => {
                setManagerName(e.target.value);
                if (managerError) setManagerError('');
              }}
              placeholder="Введите имя"
              disabled={isSendingManager}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Город работы</label>
            <input
              type="text"
              className={`form-input ${managerError && !managerCity.trim() ? 'error' : ''}`}
              value={managerCity}
              onChange={(e) => {
                setManagerCity(e.target.value);
                if (managerError) setManagerError('');
              }}
              placeholder="Введите город"
              disabled={isSendingManager}
            />
          </div>

          {managerError && <div className="form-error">{managerError}</div>}

          <div className="button-group">
            <button 
              className="btn-universal btn-secondary btn-medium" 
              onClick={() => setStage('result')}
              disabled={isSendingManager}
            >
              Назад
            </button>
            <button 
              className="btn-universal btn-primary btn-medium" 
              onClick={sendManagerData}
              disabled={isSendingManager}
            >
              {isSendingManager ? 'Отправляем...' : 'Отправить запрос'}
            </button>
          </div>
        </div>
      );
    }

    // Сообщение об успешной отправке
    if (stage === 'sent') {
      return (
        <div className={`card-container card-positioned ${contentAnimated ? 'animated' : ''}`}>
          <h2 className="text-h2">Запрос отправлен!</h2>
          <p className="text-body-dark text-center">
            Ваш запрос успешно отправлен менеджеру. 
            В ближайшее время с Вами свяжутся для консультации.
          </p>
          
          <div className="button-group">
            <button 
              className="btn-universal btn-primary btn-medium" 
              onClick={() => setStage('result')}
            >
              Вернуться к результатам
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  // Функция отправки данных менеджера (используем тот же endpoint что и CareFuture)
  const sendManagerData = async () => {
    // Валидация полей
    if (!managerSurname.trim() || !managerName.trim() || !managerCity.trim()) {
      setManagerError('Пожалуйста, заполните все поля формы');
      return;
    }

    setIsSendingManager(true);
    setManagerError('');

    try {
      const apiUrl = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:4000/api/contact-manager'
        : `${window.location.origin}/api/contact-manager`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          surname: managerSurname.trim(),
          name: managerName.trim(),
          city: managerCity.trim(),
          email: email,
          page: 'justincase',
          // Можно добавить данные расчета если нужно
          additionalData: {
            insuranceSum: insuranceSum,
            insuranceTerm: insuranceTerm,
            insuranceFrequency: insuranceFrequency,
            accidentPackage: accidentPackage,
            criticalPackage: criticalPackage,
            treatmentRegion: treatmentRegion,
            sportPackage: sportPackage,
            totalPremium: resultData?.totalPremium
          }
        })
      });

      const result = await response.json();
      console.log('📧 Ответ от API contact-manager:', result);

      if (!response.ok) {
        throw new Error(result.message || `Ошибка сервера: ${response.status}`);
      }

      if (result.success) {
        console.log('✅ Запрос успешно отправлен менеджеру');
        setManagerSent(true);
        setStage('sent');

        // Очищаем форму
        setManagerSurname('');
        setManagerName('');
        setManagerCity('');
      } else {
        throw new Error(result.message || 'Ошибка при отправке запроса');
      }

    } catch (error) {
      console.error('❌ Ошибка при отправке запроса менеджеру:', error);
      setManagerError('Ошибка при отправке запроса. Попробуйте еще раз.');
    } finally {
      setIsSendingManager(false);
    }
  };

  return (
    <div className={`main-container ${isExiting ? 'exiting' : ''}`}>
      {/* Кнопка "Назад" для всех нужных этапов, кроме result */}
      {(stage === 'form2' || stage === 'form3' || stage === 'recommended') && (
        <button className="back-btn animate-home" onClick={handlePrev}>
          <svg viewBox="0 0 24 24">
            <path d="M15 18l-6-6 6-6" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}
      
      {/* Для результатов - кнопка "Назад" с другим позиционированием */}
      {stage === 'result' && (
        <button className="back-btn animate-home" style={{ left: '20px' }} onClick={handlePrev}>
          <svg viewBox="0 0 24 24">
            <path d="M15 18l-6-6 6-6" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}
      
      {/* Логотип */}
      <div className={`logo-wrapper ${logoAnimated ? 'animated' : ''}`}>
        <img src={logoImage} alt="Logo" className="logo-image" />
      </div>
      
      {/* Кнопка "Повторить расчет" только для результатов */}
      {stage === 'result' && (
        <button
          className="next-btn repeat-btn"
          style={{ right: '20px', left: 'auto' }}
          onClick={repeatCalculation}
          title="Повторить расчет"
        >
          {/* SVG recycle icon */}
          <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
            <path
              d="M4.93 19.07A10 10 0 1 1 21 12"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <polyline
              points="22 4 22 12 14 12"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </button>
      )}

      {/* Контент */}
      {renderStep()}

      {/* Кнопки навигации для других этапов убраны, так как уже есть выше */}

      {stage === 'email' && (
        <button className="home-button" onClick={goToMenu}>
          <svg viewBox="0 0 24 24">
            <path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1V11z" stroke="white" strokeWidth="2" fill="none"/>
          </svg>
        </button>
      )}

      {(stage === 'email' || stage === 'form1' || stage === 'form2' || stage === 'form3' || stage === 'recommended') && !isProcessing && !isCalculatingRecommended && (
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








































/* Force rebuild 08/09/2025 20:01:19 */
