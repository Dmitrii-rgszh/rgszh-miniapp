import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // 🔹 добавлено
import mainmenuIcon from './components/icons/mainmenu.png';
import logoImage from './components/logo.png';
import backgroundImage from './components/background.png';
import DateWheelPicker from './DateWheelPicker';

const JustincasePage = () => {
  const navigate = useNavigate(); // 🔹 подключение навигатора
  const [userName, setUserName] = useState('');
  useEffect(() => {
    const storedName = localStorage.getItem('userName');
    setUserName(storedName || 'Гость');
  }, []);

  // === состояния формы ===
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

  // дополнительные поля для ветки no (не знает сумму)
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

  // шаги
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultData, setResultData] = useState(null);

  // форматтер для полей-сумм
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

  // проверка возможности перехода
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
        return accidentPackage && criticalPackage && (criticalPackage==='no' || treatmentRegion) && sportPackage;
      } else {
        return breadwinnerStatus &&
               (breadwinnerStatus==='yes' || incomeShare) &&
               childrenCount !== '' &&
               specialCareRelatives;
      }
    }
    if (currentStep === 4) {
      // расчётная страница
      return accidentPackage && criticalPackage && (criticalPackage==='no' || treatmentRegion) && sportPackage;
    }
    return true;
  };

  // переход вперёд
  const handleNext = () => {
    if (!canGoNext()) {
      alert('Не выполнены условия для перехода');
      return;
    }
    if (currentStep < 3) {
      setCurrentStep(s => s + 1);
    } else if (currentStep === 3) {
      insuranceInfo==='yes' ? doCalculation() : setCurrentStep(4);
    } else if (currentStep === 4) {
      doCalculation();
    }
  };

  // переход назад
  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(s => s - 1);
  };

  // сброс и повторный расчёт
  const repeatCalculation = () => {
    setBirthDate(null); setGender(null); setInsuranceInfo(null);
    setInsuranceTerm('1'); setInsuranceSum(''); setInsuranceFrequency('');
    setAccidentPackage(null); setCriticalPackage(null); setTreatmentRegion(null); setSportPackage(null);
    setHasJob(null); setIncome2021(''); setIncome2022(''); setIncome2023('');
    setScholarship(''); setUnsecuredLoans('');
    setBreadwinnerStatus(null); setIncomeShare(''); setChildrenCount('0'); setSpecialCareRelatives(null);
    setResultData(null); setIsProcessing(false); setCurrentStep(1);
  };

  // переход в меню
  const goToMenu = () => {
    navigate('/Main-Menu');
  };

  // отправка данных на бэкенд и приём результата
  const doCalculation = () => {
    setIsProcessing(true);
    const payload = {
      birthDate, gender, insuranceInfo,
      insuranceTerm, insuranceSum, insuranceFrequency,
      accidentPackage, criticalPackage, treatmentRegion, sportPackage,
      hasJob, income2021, income2022, income2023, scholarship, unsecuredLoans,
      breadwinnerStatus, incomeShare, childrenCount, specialCareRelatives
    };
    fetch('/api/proxy/calculator/save', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      credentials: 'include',
      body: JSON.stringify(payload)
    })
      .then(res => {
        if (!res.ok) return res.json().then(err=>{throw new Error(err.error||'Ошибка расчёта')});
        return res.json();
      })
      .then(data => {
        setResultData(data);
        setIsProcessing(false);
        setCurrentStep(5);
      })
      .catch(err => {
        setIsProcessing(false);
        alert(err.message);
      });
  };

  // рендер контента шага
  const renderStep = () => {
    if (isProcessing) {
      return (
        <div className="processing-container">
          <h2>{userName}, идёт расчёт…</h2>
          <div className="loading-spinner"/>
        </div>
      );
    }

    // Шаг 5 — результаты
    if (currentStep === 5 && resultData) {
      return (
        <div className="result-container">
          <h2>
            Ваша программа «На всякий случай» (расчет от {resultData.calculationDate})
          </h2>
          <p>Возраст клиента: {resultData.clientAge} лет</p>
          <p>Пол клиента: {resultData.clientGender}</p>
          <p>Срок страхования: {resultData.insuranceTerm} лет</p>
          <hr/>

          <h3>
            Основная программа (уход из жизни и инвалидность I и II группы):
          </h3>
          <p>Страховая сумма: {resultData.baseInsuranceSum}</p>
          <p>Страховая премия: {resultData.basePremium} руб.</p>

          {resultData.accidentPackageIncluded && (
            <>
              <hr/>
              <h3>Пакет «Несчастный случай»:</h3>
              <p>Страховая сумма: {resultData.accidentInsuranceSum}</p>
              <p>Страховая премия: {resultData.accidentPremium} руб.</p>
            </>
          )}

          {resultData.criticalPackageIncluded && (
            <>
              <hr/>
              <h3>Пакет «Критические заболевания»:</h3>
              <p>
                • Максимальная страховая сумма 60 000 000 ₽,
                дополнительно по реабилитации – 100 000 ₽.
              </p>
              <p>Страховая премия: {resultData.criticalPremium} руб.</p>
            </>
          )}

          {resultData.sportOptionIncluded && (
            <>
              <hr/>
              <h3>Опция «Любительский спорт»:</h3>
              <p>Включено</p>
            </>
          )}

          <hr/>
          <p><strong>Итого страховая премия:</strong> {resultData.totalPremium} руб.</p>
          <p>
            <strong>Порядок оплаты премии:</strong> {resultData.paymentMethod}
          </p>
          <hr/>
          <p>
            Для оформления свяжитесь:&nbsp;
            <a href="/contact">Наш менеджер</a>
          </p>
        </div>
      );
    }

    // === Шаг 1 ===
    if (currentStep === 1) {
      return (
        <>
          <div className="form-group">
            <label className="form-label">Дата рождения:</label>
            <DateWheelPicker onChange={setBirthDate}/>
          </div>
          <div className="form-group">
            <label className="form-label">Пол:</label>
            <div className="gender-selector">
              {['male','female'].map(g => (
                <div
                  key={g}
                  className={`gender-option ${gender===g?'selected':''}`}
                  onClick={()=>setGender(g)}
                >
                  <div className="gender-label">
                    {g==='male'?'Мужской':'Женский'}
                  </div>
                  <div className="gender-icon">
                    {g==='male'?'👨':'👩'}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">
              Знаете ли Вы на какой срок и сумму оформлять полис?
            </label>
            <div className="insurance-options">
              {['yes','no'].map(val => (
                <button
                  key={val}
                  className={`insurance-btn ${insuranceInfo===val?'selected':''}`}
                  onClick={()=>setInsuranceInfo(val)}
                >
                  {val==='yes'?'Да':'Нет'}
                </button>
              ))}
            </div>
          </div>
        </>
      );
    }

    // === Шаг 2 ===
    if (currentStep === 2) {
      if (insuranceInfo==='yes') {
        return (
          <>
            <div className="form-group">
              <label className="form-label">Срок страхования (лет):</label>
              <select
                className="insurance-term-select"
                value={insuranceTerm}
                onChange={e=>setInsuranceTerm(e.target.value)}
              >
                {Array.from({length:30},(_,i)=>(i+1)).map(y=>(
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Сумма (от 1 млн):</label>
              <input
                type="text"
                className="insurance-sum-input"
                placeholder="1.000.000"
                value={insuranceSum}
                onChange={handleSumChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Периодичность оплаты:</label>
              <select
                className="insurance-frequency-select"
                value={insuranceFrequency}
                onChange={e=>setInsuranceFrequency(e.target.value)}
              >
                <option value="">Выберите период</option>
                {["Ежемесячно","Ежегодно","Раз в полгода","Ежеквартально"].map(o=>(
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
          </>
        );
      } else {
        // ветка no
        return (
          <>
            <div className="form-group">
              <label className="form-label">Есть работа?</label>
              <div className="insurance-options">
                {['yes','no'].map(v=>(
                  <button
                    key={v}
                    className={`insurance-btn ${hasJob===v?'selected':''}`}
                    onClick={()=>setHasJob(v)}
                  >
                    {v==='yes'?'Да':'Нет'}
                  </button>
                ))}
              </div>
            </div>
            {[
              {label:"Доход 2021, руб.",    value:income2021,   onChange:handleIncome2021Change},
              {label:"Доход 2022, руб.",    value:income2022,   onChange:handleIncome2022Change},
              {label:"Доход 2023, руб.",    value:income2023,   onChange:handleIncome2023Change},
              {label:"Стипендия 2023, руб.",value:scholarship,  onChange:handleScholarshipChange},
              {label:"Кредиты, руб.",       value:unsecuredLoans,onChange:handleUnsecuredLoansChange},
            ].map(({label,value,onChange})=>(
              <div className="form-group inline-group" key={label}>
                <label className="inline-label">{label}</label>
                <input
                  type="text"
                  className="inline-input"
                  placeholder="Введите"
                  value={value}
                  onChange={onChange}
                />
              </div>
            ))}
          </>
        );
      }
    }

    // === Шаг 3 ===
    if (currentStep === 3) {
      if (insuranceInfo==='yes') {
        return (
          <>
            {/* Несчастный случай */}
            <div className="form-group">
              <label className="form-label">Пакет «Несчастный случай»?</label>
              <div className="insurance-options">
                {['yes','no'].map(v=>(
                  <button
                    key={v}
                    className={`insurance-btn ${accidentPackage===v?'selected':''}`}
                    onClick={()=>setAccidentPackage(v)}
                  >
                    {v==='yes'?'Да':'Нет'}
                  </button>
                ))}
              </div>
            </div>
            {/* Критические заболевания */}
            <div className="form-group">
              <label className="form-label">Пакет «Критические заболевания»?</label>
              <div className="insurance-options">
                {['yes','no'].map(v=>(
                  <button
                    key={v}
                    className={`insurance-btn ${criticalPackage===v?'selected':''}`}
                    onClick={()=>setCriticalPackage(v)}
                  >
                    {v==='yes'?'Да':'Нет'}
                  </button>
                ))}
              </div>
            </div>
            {/* Регион лечения */}
            {criticalPackage==='yes' && (
              <div className="form-group">
                <label className="form-label">Регион лечения:</label>
                <div className="insurance-options">
                  <button
                    className={`insurance-btn ${treatmentRegion==='russia'?'selected':''}`}
                    onClick={()=>setTreatmentRegion('russia')}
                  >
                    Лечение в РФ
                  </button>
                  <button
                    className={`insurance-btn ${treatmentRegion==='abroad'?'selected':''}`}
                    onClick={()=>setTreatmentRegion('abroad')}
                  >
                    За рубежом
                  </button>
                </div>
              </div>
            )}
            {/* Любительский спорт */}
            <div className="form-group">
              <label className="form-label">Опция «Любительский спорт»?</label>
              <div className="insurance-options">
                {['yes','no'].map(v=>(
                  <button
                    key={v}
                    className={`insurance-btn ${sportPackage===v?'selected':''}`}
                    onClick={()=>setSportPackage(v)}
                  >
                    {v==='yes'?'Да':'Нет'}
                  </button>
                ))}
              </div>
            </div>
          </>
        );
      } else {
        // ветка no: кормилец и т. д.
        return (
          <>
            <div className="form-group">
              <label className="form-label">Вы единственный кормилец?</label>
              <div className="insurance-options">
                {['yes','no','notMe'].map(v=>(
                  <button
                    key={v}
                    className={`insurance-btn ${breadwinnerStatus===v?'selected':''}`}
                    onClick={()=>setBreadwinnerStatus(v)}
                  >
                    {v==='yes'?'Да':v==='no'?'Нет':'Не являюсь'}
                  </button>
                ))}
              </div>
            </div>
            {breadwinnerStatus!=='yes' && (
              <div className="form-group">
                <label className="form-label">
                  Доля вашего дохода в семейном бюджете:
                </label>
                <select
                  className="insurance-term-select"
                  value={incomeShare}
                  onChange={e=>setIncomeShare(e.target.value)}
                >
                  <option value="">Выберите</option>
                  {[
                    "до 10%","10–24%","25–49%","50–74%","75–89%","Более 90%"
                  ].map(o=>(
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Количество детей на иждивении?</label>
              <select
                className="insurance-term-select"
                value={childrenCount}
                onChange={e=>setChildrenCount(e.target.value)}
              >
                {["0","1","2","3 и более"].map(o=>(
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Есть родственники, требующие ухода?</label>
              <div className="insurance-options">
                {['yes','no'].map(v=>(
                  <button
                    key={v}
                    className={`insurance-btn ${specialCareRelatives===v?'selected':''}`}
                    onClick={()=>setSpecialCareRelatives(v)}
                  >
                    {v==='yes'?'Да':'Нет'}
                  </button>
                ))}
              </div>
            </div>
          </>
        );
      }
    }

    // === Шаг 4 (расчёт) ===
    if (currentStep === 4) {
      return (
        <div className="processing-container">
          <h2>{userName}, готовимся к расчёту…</h2>
          <div className="loading-spinner" />
        </div>
      );
    }

    return null;
  };

  return (
    <div className="justincase-container" style={{ backgroundImage: `url(${backgroundImage})` }}>
      {/* логотип */}
      {currentStep !== 5
        ? <div className="logo-container"><img src={logoImage} alt="Logo" className="logo-image"/></div>
        : <div className="logo-container logo-container-final"><img src={logoImage} alt="Logo" className="logo-image"/></div>
      }

      {/* заголовок */}
      {currentStep !== 5 && (
        <h1 className="justincase-title">
          Расчёт по программе "На всякий случай" для сотрудника
        </h1>
      )}

      <div className="justincase-form">
        {renderStep()}
      </div>

      {/* 🔺 Кнопка назад (главное меню или шаг назад) */}
      {currentStep === 1 && (
        <div className="back-btn-container">
          <button className="back-btn mainmenu-btn" onClick={goToMenu}>
            <img src={mainmenuIcon} alt="Menu" />
          </button>
        </div>
      )}
      {currentStep > 1 && currentStep < 5 && (
        <div className="back-btn-container">
          <button className="back-btn" onClick={handlePrev}>
            <svg viewBox="0 0 24 24"><path d="M12 20l-8-8 8-8"/></svg>
          </button>
        </div>
      )}

      {/* кнопка «Далее» */}
      {currentStep < 5 && (
        <div className="top-btn-container">
          <button className="top-btn" onClick={handleNext} disabled={!canGoNext()}>
            <svg viewBox="0 0 24 24"><path d="M12 4l8 8-8 8"/></svg>
          </button>
        </div>
      )}

      {/* Шаг 5: кнопки «Домой» и «Повторить» */}
      {currentStep === 5 && (
        <>
          <div className="back-btn-container">
            <button className="back-btn mainmenu-btn" onClick={goToMenu}>
              <img src={mainmenuIcon} alt="Menu" />
            </button>
          </div>
          <div className="top-btn-container">
            <button className="top-btn" onClick={repeatCalculation}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.65 6.35A7.95 7.95 0 0012 4a8 8 0 00-8 8h2.08
                         a5.92 5.92 0 015.92-6 6 6 0 015.65 3.65L13 11h7V4
                         l-2.35 2.35zM6.35 17.65A7.95 7.95 0 0012 20a8 8
                         0 008-8h-2.08a5.92 5.92 0 01-5.92 6 6 6 0
                         01-5.65-3.65L3.41 16.3 2 17.71l2.35-2.35z"/>
              </svg>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default JustincasePage;









































