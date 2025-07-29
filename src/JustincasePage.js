import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logoImage from './components/logo.png';
import DateWheelPicker from './DateWheelPicker';

const JustincasePage = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const [viewportHeight, setViewportHeight] = useState(getViewportHeight());

  // Состояние анимаций
  const [logoAnimated, setLogoAnimated] = useState(false);
  const [buttonsAnimated, setButtonsAnimated] = useState(false);
  const [moveDuration] = useState('70s');
  const [rotateDuration] = useState('6s');
  const [isExiting, setIsExiting] = useState(false);

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
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultData, setResultData] = useState(null);

  // Инициализация
  useEffect(() => {
    const storedName = localStorage.getItem('userName');
    setUserName(storedName || 'Гость');

    // Анимации
    setTimeout(() => setLogoAnimated(true), 100);
    setTimeout(() => setButtonsAnimated(true), 600);

    // Обработчики изменения размера окна
    const handleResize = () => {
      setViewportHeight(getViewportHeight());
    };

    const handleOrientationChange = () => {
      setTimeout(() => {
        setViewportHeight(getViewportHeight());
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

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
    if (currentStep === 1) {
      return birthDate && gender && insuranceInfo;
    }
    if (currentStep === 2) {
      return insuranceInfo === 'yes'
        ? (insuranceTerm && insuranceSum && insuranceFrequency)
        : (hasJob && income2021 && income2022 && income2023);
    }
    if (currentStep === 3) {
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
    if (currentStep < 3) {
      setCurrentStep(s => s + 1);
    } else if (currentStep === 3) {
      doCalculation();
    }
  };

  // Переход назад
  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(s => s - 1);
  };

  // Сброс и повторный расчёт
  const repeatCalculation = () => {
    setBirthDate(null); setGender(null); setInsuranceInfo(null);
    setInsuranceTerm('1'); setInsuranceSum(''); setInsuranceFrequency('');
    setAccidentPackage(null); setCriticalPackage(null); setTreatmentRegion(null); setSportPackage(null);
    setHasJob(null); setIncome2021(''); setIncome2022(''); setIncome2023('');
    setScholarship(''); setUnsecuredLoans('');
    setBreadwinnerStatus(null); setIncomeShare(''); setChildrenCount('0'); setSpecialCareRelatives(null);
    setResultData(null); setIsProcessing(false); setCurrentStep(1);
  };

  // Переход в меню
  const goToMenu = () => {
    setIsExiting(true);
    setTimeout(() => {
      navigate('/Main-Menu');
    }, 700);
  };

  // ИСПРАВЛЕННАЯ отправка данных на бэкенд и приём результата
  const doCalculation = async () => {
    setIsProcessing(true);
  
    try {
      // Подготовка данных для расчета в формате, который ожидает сервер
      const payload = {
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
        ? 'http://localhost:4000/api/proxy/calculator/save'  // Для разработки
        : `${window.location.origin}/api/proxy/calculator/save`;  // Для продакшена

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

      // ИСПРАВЛЕННАЯ обработка ответа
      let processedData;
      
      if (data.success && data.calculation_result) {
        // Новый формат ответа от полного калькулятора
        const calc = data.calculation_result;
        
        processedData = {
          success: true,
          calculationDate: new Date().toLocaleDateString('ru-RU'),
          clientAge: calc.clientAge || 35,
          clientGender: calc.clientGender || (gender === 'Мужской' ? 'Мужской' : 'Женский'),
          insuranceTerm: calc.insuranceTerm || insuranceTerm,
          
          // Основная программа
          baseInsuranceSum: formatNumber(calc.baseInsuranceSum || calc.insuranceSum || insuranceSum),
          basePremium: formatNumber(calc.basePremium || calc.basePremiumAmount || calc.annualPremium || '0'),
          
          // Пакет НС
          accidentPackageIncluded: calc.accidentPackageIncluded || false,
          accidentInsuranceSum: formatNumber(calc.accidentInsuranceSum || calc.accidentDetails?.insuranceSum || insuranceSum),
          accidentPremium: formatNumber(calc.accidentPremium || calc.accidentDetails?.premium || '0'),
          
          // Пакет КЗ
          criticalPackageIncluded: calc.criticalPackageIncluded || false,
          criticalInsuranceSum: formatNumber(calc.criticalInsuranceSum || calc.criticalDetails?.insuranceSum || '60 000 000'),
          criticalPremium: formatNumber(calc.criticalPremium || calc.criticalDetails?.premium || '0'),
          
          // Итого
          totalPremium: formatNumber(calc.totalPremium || calc.annualPremium || '0'),
          
          // Дополнительная информация
          treatmentRegion: calc.treatmentRegion || treatmentRegion,
          sportPackage: calc.sportPackage || (sportPackage === 'yes'),
          
          // Служебная информация
          calculationId: calc.calculationId || data.calculation_id || 'unknown',
          calculator: data.calculator || 'JustincaseCalculatorComplete',
          version: data.version || '2.0.0'
        };
      } else if (data.success) {
        // Старый формат ответа (временный калькулятор)
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
      setCurrentStep(4);
    } catch (error) {
      console.error('❌ Ошибка расчета:', error);
      alert(`Ошибка при расчете: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Стили (скопированы из CareFuturePage.js)
  const mainContainerStyle = {
    position: 'relative',
    width: '100%',
    minHeight: typeof viewportHeight === 'number' ? `${viewportHeight}px` : viewportHeight,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    overflowX: 'hidden',      // ← Только горизонтальный скролл запрещен
    overflowY: 'auto',        // ← Вертикальный скролл разрешен
    fontFamily: '"Montserrat", sans-serif',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingBottom: '50px'     // ← Добавим отступ снизу
  };

  const logoContainerStyle = {
    position: 'absolute',
    top: '30px',
    left: '50%',
    transform: logoAnimated ? 'translateX(-50%) scale(1)' : 'translateX(-50%) scale(0.8)',
    opacity: logoAnimated ? 1 : 0,
    transition: 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    zIndex: 3
  };

  const logoImageStyle = {
    width: isMobile() ? '80px' : '110px',
    height: 'auto',
    filter: 'drop-shadow(0 4px 20px rgba(0, 0, 0, 0.15))'
  };

  const titleStyle = {
    fontSize: isMobile() ? '20px' : '28px',
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    marginTop: '140px',
    marginBottom: '30px',
    textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
    opacity: buttonsAnimated ? 1 : 0,
    transform: buttonsAnimated ? 'translateY(0)' : 'translateY(20px)',
    transition: 'all 0.8s ease-out 0.2s'
  };

  const formContainerStyle = {
    position: 'absolute',
    top: currentStep !== 4 ? '200px' : '140px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '20px',
    padding: '30px',
    maxHeight: currentStep === 4 ? '80vh' : 'auto',  // ← Ограничим высоту для результатов
    overflowY: currentStep === 4 ? 'auto' : 'visible', // ← Скролл для результатов
    width: '85%',
    maxWidth: '500px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    zIndex: 3,
    animation: buttonsAnimated ? 'fadeInUp 0.8s ease-out' : 'none'
  };

  const formTitleStyle = {
    fontSize: '24px',
    fontWeight: '700',
    color: '#333',
    marginBottom: '20px',
    textAlign: 'center'
  };

  const formGroupStyle = {
    marginBottom: '20px'
  };

  const inputStyle = {
    width: '100%',
    padding: '15px',
    border: '2px solid #e1e8ed',
    borderRadius: '12px',
    fontSize: '16px',
    transition: 'all 0.3s ease',
    backgroundColor: '#f8f9fa',
    outline: 'none',
    fontFamily: 'inherit',
    textAlign: 'center'
  };

  const primaryButtonStyle = {
    width: '100%',
    padding: '15px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
    fontFamily: 'inherit',
    marginBottom: '10px'
  };

  const secondaryButtonStyle = {
    width: '100%',
    padding: '15px',
    background: 'transparent',
    color: '#667eea',
    border: '2px solid #667eea',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontFamily: 'inherit',
    marginBottom: '10px'
  };

  const buttonGroupStyle = {
    display: 'flex',
    gap: '15px',
    marginTop: '20px'
  };

  const optionButtonStyle = (selected) => ({
    flex: 1,
    padding: '12px 15px',
    border: selected ? '2px solid #667eea' : '2px solid #e1e8ed',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    backgroundColor: selected ? '#667eea' : '#f8f9fa',
    color: selected ? 'white' : '#333',
    fontFamily: 'inherit'
  });

  const navigationButtonStyle = {
    position: 'absolute',
    bottom: '30px',
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    color: 'white',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
    zIndex: 4
  };

  const backButtonStyle = {
    ...navigationButtonStyle,
    left: '30px',
    background: 'linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)'
  };

  const nextButtonStyle = {
    ...navigationButtonStyle,
    right: '30px',
    background: canGoNext() ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(189, 195, 199, 0.8)',
    cursor: canGoNext() ? 'pointer' : 'not-allowed'
  };

  // Результаты
  const resultContainerStyle = {
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
    fontSize: '14px'
  };

  const resultValueStyle = {
    fontWeight: '600',
    color: '#333',
    fontSize: '14px'
  };

  // Рендер контента шага
  const renderStep = () => {
    if (isProcessing) {
      return (
        <div style={formContainerStyle}>
          <div style={formTitleStyle}>
            {userName}, идёт расчёт...
          </div>
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #667eea',
              borderRadius: '50%',
              animation: 'spin 2s linear infinite',
              margin: '0 auto'
            }} />
          </div>
        </div>
      );
    }

    // Шаг 4 - результаты (ИСПРАВЛЕННЫЙ БЛОК)
  if (currentStep === 4 && resultData) {
    return (
      <div style={formContainerStyle}>
        <div style={formTitleStyle}>
          Ваша программа «На всякий случай»
        </div>
        <div style={{...formTitleStyle, fontSize: '14px', color: '#666', marginBottom: '20px'}}>
          (расчет от {resultData.calculationDate || new Date().toLocaleDateString('ru-RU')})
        </div>
        
        <div style={resultContainerStyle}>
          {/* Основная информация */}
          <div style={resultItemStyle}>
            <span style={resultLabelStyle}>Возраст клиента:</span>
            <span style={resultValueStyle}>{resultData.clientAge} лет</span>
          </div>
          <div style={resultItemStyle}>
            <span style={resultLabelStyle}>Пол клиента:</span>
            <span style={resultValueStyle}>{resultData.clientGender}</span>
          </div>
          <div style={resultItemStyle}>
            <span style={resultLabelStyle}>Срок страхования:</span>
            <span style={resultValueStyle}>{resultData.insuranceTerm} лет</span>
          </div>
          
          {/* Разделитель */}
          <div style={{borderTop: '2px solid #e0e0e0', margin: '15px 0'}}></div>
          
          {/* Основная программа */}
          <div style={{...resultLabelStyle, fontWeight: '700', fontSize: '16px', marginBottom: '10px', color: '#333'}}>
            Основная программа (страхование на случай ухода из жизни и инвалидности I и II группы по любой причине):
          </div>
          <div style={resultItemStyle}>
            <span style={resultLabelStyle}>• Страховая сумма:</span>
            <span style={resultValueStyle}>{formatNumber(resultData.baseInsuranceSum || resultData.insuranceSum)} руб.</span>
          </div>
          <div style={resultItemStyle}>
            <span style={resultLabelStyle}>• Страховая премия:</span>
            <span style={resultValueStyle}>{formatNumber(resultData.basePremium)} руб.</span>
          </div>
          
          {/* Пакет НС (только если выбран) */}
          {resultData.accidentPackageIncluded && (
            <>
              <div style={{borderTop: '1px solid #e0e0e0', margin: '15px 0'}}></div>
              <div style={{...resultLabelStyle, fontWeight: '700', fontSize: '16px', marginBottom: '10px', color: '#333'}}>
                Пакет «Несчастный случай»:
              </div>
              <div style={resultItemStyle}>
                <span style={resultLabelStyle}>• Страховая сумма:</span>
                <span style={resultValueStyle}>{formatNumber(resultData.accidentInsuranceSum)} руб.</span>
              </div>
              <div style={resultItemStyle}>
                <span style={resultLabelStyle}>• Страховая премия:</span>
                <span style={resultValueStyle}>{formatNumber(resultData.accidentPremium)} руб.</span>
              </div>
            </>
          )}
          
          {/* Пакет КЗ (только если выбран) */}
          {resultData.criticalPackageIncluded && (
            <>
              <div style={{borderTop: '1px solid #e0e0e0', margin: '15px 0'}}></div>
              <div style={{...resultLabelStyle, fontWeight: '700', fontSize: '16px', marginBottom: '10px', color: '#333'}}>
                {resultData.treatmentRegion === 'russia' ? 
                  'Пакет «Критические заболевания (лечение в РФ)»:' : 
                  'Пакет «Критические заболевания (лечение за рубежом)»:'
                }
              </div>
              <div style={{...resultItemStyle, alignItems: 'flex-start'}}>
                <span style={resultLabelStyle}>• Максимальная страховая сумма:</span>
                <span style={resultValueStyle}>
                  60 000 000 рублей,<br/>
                  дополнительно по реабилитации – 100 000 рублей
                </span>
              </div>
              <div style={resultItemStyle}>
                <span style={resultLabelStyle}>• Страховая премия:</span>
                <span style={resultValueStyle}>{formatNumber(resultData.criticalPremium)} руб.</span>
              </div>
            </>
          )}
          
          {/* Опция спорт (только если выбрана) */}
          {resultData.sportPackage && (
            <>
              <div style={{borderTop: '1px solid #e0e0e0', margin: '15px 0'}}></div>
              <div style={{...resultLabelStyle, fontWeight: '700', fontSize: '16px', marginBottom: '10px', color: '#333'}}>
                Опция «Любительский спорт»
              </div>
              <div style={{...resultItemStyle, paddingLeft: '15px'}}>
                <span style={{...resultLabelStyle, fontStyle: 'italic'}}>
                  (учтена в расчете премий НС)
                </span>
              </div>
            </>
          )}
          
          {/* Итого */}
          <div style={{borderTop: '2px solid #667eea', margin: '20px 0 10px 0', paddingTop: '15px'}}>
            <div style={resultItemStyle}>
              <span style={{...resultLabelStyle, fontWeight: '700', color: '#333', fontSize: '16px'}}>
                Итого страховая премия:
              </span>
              <span style={{...resultValueStyle, fontWeight: '700', color: '#667eea', fontSize: '18px'}}>
                {formatNumber(resultData.totalPremium || resultData.annualPremium)} руб.
              </span>
            </div>
            <div style={resultItemStyle}>
              <span style={{...resultLabelStyle, fontWeight: '600', color: '#333'}}>
                Порядок оплаты премии:
              </span>
              <span style={{...resultValueStyle, fontWeight: '600'}}>
                {insuranceFrequency || 'Ежегодно'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Дополнительная информация */}
        {resultData.calculator && (
          <div style={{marginTop: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px', fontSize: '12px', color: '#666'}}>
            <div>Калькулятор: {resultData.calculator}</div>
            <div>Версия: {resultData.version}</div>
            <div>ID расчета: {resultData.calculationId}</div>
          </div>
        )}
        
        <div style={buttonGroupStyle}>
          <button style={secondaryButtonStyle} onClick={goToMenu}>
            Главное меню
          </button>
          <button style={primaryButtonStyle} onClick={repeatCalculation}>
            Повторить расчёт
          </button>
        </div>
      </div>
    );
  }

    // Шаг 1 - основная информация
    if (currentStep === 1) {
      return (
        <div style={formContainerStyle}>
          <div style={formTitleStyle}>Основная информация</div>
          
          <div style={formGroupStyle}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
              Дата рождения
            </label>
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

          <div style={formGroupStyle}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
              Пол
            </label>
            <div style={buttonGroupStyle}>
              <button
                style={optionButtonStyle(gender === 'Мужской')}
                onClick={() => setGender('Мужской')}
              >
                Мужской
              </button>
              <button
                style={optionButtonStyle(gender === 'Женский')}
                onClick={() => setGender('Женский')}
              >
                Женский
              </button>
            </div>
          </div>

          <div style={formGroupStyle}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
              Знаете ли вы необходимую сумму страхования?
            </label>
            <div style={buttonGroupStyle}>
              <button
                style={optionButtonStyle(insuranceInfo === 'yes')}
                onClick={() => setInsuranceInfo('yes')}
              >
                Да
              </button>
              <button
                style={optionButtonStyle(insuranceInfo === 'no')}
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
    if (currentStep === 2) {
      return (
        <div style={formContainerStyle}>
          <div style={formTitleStyle}>
            {insuranceInfo === 'yes' ? 'Параметры страхования' : 'Расчёт суммы страхования'}
          </div>
          
          {insuranceInfo === 'yes' ? (
            <>
              <div style={formGroupStyle}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                  Срок страхования: <span style={{fontWeight: '700', color: '#667eea'}}>{insuranceTerm} лет</span>
                </label>
                <div style={{position: 'relative', margin: '20px 0'}}>
                  <input
                    type="range"
                    min="1"
                    max="30"
                    value={insuranceTerm}
                    onChange={(e) => setInsuranceTerm(e.target.value)}
                    style={{
                      width: '100%',
                      height: '8px',
                      borderRadius: '5px',
                      background: `linear-gradient(to right, #667eea 0%, #667eea ${((insuranceTerm - 1) / 29) * 100}%, #e1e8ed ${((insuranceTerm - 1) / 29) * 100}%, #e1e8ed 100%)`,
                      outline: 'none',
                      WebkitAppearance: 'none',
                      cursor: 'pointer'
                    }}
                  />
                  <style jsx>{`
                    input[type="range"]::-webkit-slider-thumb {
                      -webkit-appearance: none;
                      appearance: none;
                      width: 24px;
                      height: 24px;
                      border-radius: 50%;
                      background: #667eea;
                      cursor: pointer;
                      box-shadow: 0 2px 6px rgba(102, 126, 234, 0.3);
                      border: 3px solid white;
                    }
      
                    input[type="range"]::-moz-range-thumb {
                      width: 24px;
                      height: 24px;
                      border-radius: 50%;
                      background: #667eea;
                      cursor: pointer;
                      box-shadow: 0 2px 6px rgba(102, 126, 234, 0.3);
                      border: 3px solid white;
                    }
                  `}</style>
    
                  {/* Подписи под ползунком */}
                  <div style={{
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    marginTop: '10px',
                    fontSize: '12px',
                    color: '#666'
                  }}>
                    <span>1 год</span>
                    <span>15 лет</span>
                    <span>30 лет</span>
                  </div>
                </div>
              </div>

              <div style={formGroupStyle}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                  Страховая сумма (руб.)
                </label>
                <input
                  type="text"
                  style={inputStyle}
                  value={insuranceSum}
                  onChange={handleSumChange}
                  placeholder="Минимум 1.000.000"
                />
              </div>

              <div style={formGroupStyle}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                  Периодичность оплаты
                </label>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px'}}>
                  <button
                    style={optionButtonStyle(insuranceFrequency === 'Ежегодно')}
                    onClick={() => setInsuranceFrequency('Ежегодно')}
                  >
                    Ежегодно
                  </button>
                  <button
                    style={optionButtonStyle(insuranceFrequency === 'Ежемесячно')}
                    onClick={() => setInsuranceFrequency('Ежемесячно')}
                  >
                    Ежемесячно
                  </button>
                </div>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'}}>
                  <button
                    style={optionButtonStyle(insuranceFrequency === 'Поквартально')}
                    onClick={() => setInsuranceFrequency('Поквартально')}
                  >
                    Ежеквартально
                  </button>
                  <button
                    style={optionButtonStyle(insuranceFrequency === 'Полугодие')}
                    onClick={() => setInsuranceFrequency('Полугодие')}
                  >
                    Раз в пол года
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div style={formGroupStyle}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                  Есть ли у вас работа?
                </label>
                <div style={buttonGroupStyle}>
                  <button
                    style={optionButtonStyle(hasJob === 'yes')}
                    onClick={() => setHasJob('yes')}
                  >
                    Да
                  </button>
                  <button
                    style={optionButtonStyle(hasJob === 'no')}
                    onClick={() => setHasJob('no')}
                  >
                    Нет
                  </button>
                </div>
              </div>

              <div style={formGroupStyle}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                  Доходы 2021 г. (руб.)
                </label>
                <input
                  type="text"
                  style={inputStyle}
                  value={income2021}
                  onChange={handleIncome2021Change}
                  placeholder="Введите сумму"
                />
              </div>

              <div style={formGroupStyle}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                  Доходы 2022 г. (руб.)
                </label>
                <input
                  type="text"
                  style={inputStyle}
                  value={income2022}
                  onChange={handleIncome2022Change}
                  placeholder="Введите сумму"
                />
              </div>

              <div style={formGroupStyle}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                  Доходы 2023 г. (руб.)
                </label>
                <input
                  type="text"
                  style={inputStyle}
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
    if (currentStep === 3) {
      return (
        <div style={formContainerStyle}>
          <div style={formTitleStyle}>
            {insuranceInfo === 'yes' ? 'Дополнительные пакеты' : 'Дополнительная информация'}
          </div>
          
          {insuranceInfo === 'yes' ? (
            <>
              <div style={formGroupStyle}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                  Пакет «Несчастный случай»
                </label>
                <div style={buttonGroupStyle}>
                  <button
                    style={optionButtonStyle(accidentPackage === 'yes')}
                    onClick={() => setAccidentPackage('yes')}
                  >
                    Включить
                  </button>
                  <button
                    style={optionButtonStyle(accidentPackage === 'no')}
                    onClick={() => setAccidentPackage('no')}
                  >
                    Не включать
                  </button>
                </div>
              </div>

              <div style={formGroupStyle}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                  Пакет «Критические заболевания»
                </label>
                <div style={buttonGroupStyle}>
                  <button
                    style={optionButtonStyle(criticalPackage === 'yes')}
                    onClick={() => setCriticalPackage('yes')}
                  >
                    Включить
                  </button>
                  <button
                    style={optionButtonStyle(criticalPackage === 'no')}
                    onClick={() => setCriticalPackage('no')}
                  >
                    Не включать
                  </button>
                </div>
              </div>

              {criticalPackage === 'yes' && (
                <div style={formGroupStyle}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                    Регион лечения
                  </label>
                  <div style={buttonGroupStyle}>
                    <button
                      style={optionButtonStyle(treatmentRegion === 'russia')}
                      onClick={() => setTreatmentRegion('russia')}
                    >
                      Россия
                    </button>
                    <button
                      style={optionButtonStyle(treatmentRegion === 'abroad')}
                      onClick={() => setTreatmentRegion('abroad')}
                    >
                      За рубежом
                    </button>
                  </div>
                </div>
              )}

              <div style={formGroupStyle}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                  Любительский спорт
                </label>
                <div style={buttonGroupStyle}>
                  <button
                    style={optionButtonStyle(sportPackage === 'yes')}
                    onClick={() => setSportPackage('yes')}
                  >
                    Включить
                  </button>
                  <button
                    style={optionButtonStyle(sportPackage === 'no')}
                    onClick={() => setSportPackage('no')}
                  >
                    Не включать
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div style={formGroupStyle}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                  Являетесь ли вы основным кормильцем?
                </label>
                <div style={buttonGroupStyle}>
                  <button
                    style={optionButtonStyle(breadwinnerStatus === 'yes')}
                    onClick={() => setBreadwinnerStatus('yes')}
                  >
                    Да
                  </button>
                  <button
                    style={optionButtonStyle(breadwinnerStatus === 'no')}
                    onClick={() => setBreadwinnerStatus('no')}
                  >
                    Нет
                  </button>
                </div>
              </div>

              {breadwinnerStatus === 'no' && (
                <div style={formGroupStyle}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                    Доля вашего дохода в семейном бюджете (%)
                  </label>
                  <input
                    type="number"
                    style={inputStyle}
                    value={incomeShare}
                    onChange={(e) => setIncomeShare(e.target.value)}
                    min="0"
                    max="100"
                    placeholder="Введите процент"
                  />
                </div>
              )}

              <div style={formGroupStyle}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                  Количество детей
                </label>
                <input
                  type="number"
                  style={inputStyle}
                  value={childrenCount}
                  onChange={(e) => setChildrenCount(e.target.value)}
                  min="0"
                  placeholder="Введите количество"
                />
              </div>

              <div style={formGroupStyle}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                  Есть ли родственники, нуждающиеся в особом уходе?
                </label>
                <div style={buttonGroupStyle}>
                  <button
                    style={optionButtonStyle(specialCareRelatives === 'yes')}
                    onClick={() => setSpecialCareRelatives('yes')}
                  >
                    Да
                  </button>
                  <button
                    style={optionButtonStyle(specialCareRelatives === 'no')}
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
    <div style={mainContainerStyle} className={isExiting ? 'exiting' : ''}>
      {/* Логотип */}
      <div style={logoContainerStyle}>
        <img src={logoImage} alt="Logo" style={logoImageStyle} />
      </div>

      {/* Заголовок */}
      {currentStep !== 4 && (
        <div style={titleStyle}>
          Расчёт по программе "На всякий случай"
        </div>
      )}

      {/* Контент */}
      {renderStep()}

      {/* Кнопки навигации */}
      {currentStep > 1 && currentStep < 4 && (
        <button style={backButtonStyle} onClick={handlePrev}>
          ←
        </button>
      )}

      {currentStep === 1 && (
        <button style={backButtonStyle} onClick={goToMenu}>
          🏠
        </button>
      )}

      {currentStep < 4 && !isProcessing && (
        <button style={nextButtonStyle} onClick={handleNext} disabled={!canGoNext()}>
          →
        </button>
      )}

      {/* Стили для анимаций */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes piFloatAround {
          0% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(80vw, 20vh) rotate(90deg); }
          50% { transform: translate(60vw, 80vh) rotate(180deg); }
          75% { transform: translate(10vw, 70vh) rotate(270deg); }
          100% { transform: translate(0, 0) rotate(360deg); }
        }

        @keyframes piRotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .exiting {
          animation: fadeOut 0.7s ease-out forwards;
        }

        @keyframes fadeOut {
          to {
            opacity: 0;
            transform: scale(0.95);
          }
        }
      `}</style>
    </div>
  );
};

export default JustincasePage;








































