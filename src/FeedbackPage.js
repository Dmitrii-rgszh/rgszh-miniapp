// src/FeedbackPage.js

import React, { useState, useEffect, useRef } from 'react';
import Autosuggest          from 'react-autosuggest';
import { useNavigate }      from 'react-router-dom';

import './Styles/logo.css';         // стили и анимации логотипа
import './Styles/Buttons.css';      // базовые стили кнопок
 // правки специфичные для FeedbackPage (контент, next-btn и т.д.)
import './Styles/BackButton.css';
import './Styles/OptionButton.css';
import './Styles/NextButton.css';
import logoImage       from './components/logo.png';

import partners      from './components/autosuggest/partners.json';
import speakersData  from './components/autosuggest/speakers.json';

export default function FeedbackPage() {
  // ---------------------------------------------
  // ДОБАВЛЕНО: Функция определения Safari и получения высоты
  // ---------------------------------------------
  const isSafari = () => {
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent) ||
           /iPad|iPhone|iPod/.test(navigator.userAgent);
  };

  const getViewportHeight = () => {
    if (isSafari()) {
      return window.innerHeight;
    }
    return '100vh';
  };

  // ---------------------------------------------
  // 1) useRef для логотипа и кнопки «Далее»
  // ---------------------------------------------
  const logoRef = useRef(null);
  const nextRef = useRef(null);
  const navigate = useNavigate();
  const [rippleArray, setRippleArray] = useState([]);

  // вычисляем корень API в зависимости от окружения
  const getApiBase = () => {
    const { hostname, port, protocol } = window.location;
    // если мы в React‑dev‑server (localhost:3000) — зовём бэкенд на 5000
    if ((hostname === 'localhost' || hostname === '127.0.0.1') && port === '3000') {
      return `${protocol}//${hostname}:4000`;
    }
    // во всех остальных случаях (prod‑сборка, когда Flask раздаёт статику)
    // оставляем относительный путь:
    return '';
  };

const API_BASE_URL = getApiBase();


  // ---------------------------------------------
  // 2) Состояние имени пользователя (localStorage)
  // ---------------------------------------------
  const [userName, setUserName] = useState('');
  useEffect(() => {
    const storedName = localStorage.getItem('userName');
    setUserName(storedName || 'Гость');
  }, []);

  // ---------------------------------------------
  // 3) Состояние шагов и флаг «завершён»
  // ---------------------------------------------
  const [currentStep, setCurrentStep] = useState(1);
  const [nextButtonExit, setNextButtonExit] = useState(false);
  const [isFinished, setIsFinished]   = useState(false);
  const [step1Exiting, setStep1Exiting] = useState(false);

  // ---------------------------------------------
  // 4) Состояние данных для каждого шага опроса
  // ---------------------------------------------
  // Шаг 1: партнёр
  const [partner, setPartner]                       = useState('');
  const [partnerSuggestions, setPartnerSuggestions] = useState([]);

  // Шаги 2–3: спикеры и качества
  const [speakersList, setSpeakersList]               = useState([{ fullName: '', id: 1 }]);
  const [speakersSuggestions, setSpeakersSuggestions] = useState([]);
  const [speakerQualities, setSpeakerQualities]       = useState([]);
  const [currentSpeakerIndex, setCurrentSpeakerIndex] = useState(0);
  const handleNextRipple = (e) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const newRipple = {
      key: Date.now(),
      style: {
        width: size,
        height: size,
        left: x,
        top: y,
      }
    };
    setRippleArray((old) => [...old, newRipple]);
  };

  useEffect(() => {
    if (rippleArray.length > 0) {
      const timer = setTimeout(() => {
        setRippleArray([]);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [rippleArray]);

  // Шаг 4: полезность
  const [usefulness, setUsefulness]           = useState('');
  const [uselessArgument, setUselessArgument] = useState('');

  // Шаг 5: яркие мысли
  const [brightThoughts, setBrightThoughts] = useState('');

  // Шаг 6: дополнительные опции
  const additionalOptions = [
    'Мне всего хватает',
    'Практики',
    'Клиентских историй',
    'Статистических данных',
    'Фишек продаж',
    'Сравнение с конкурентами',
    'Детальный разбор параметров продукта'
  ];
  const [additionalSelections, setAdditionalSelections] = useState([]);
  const [statsDetails, setStatsDetails]               = useState('');

  // Шаг 7: настроение
  const [mood, setMood] = useState('');

  // Шаг 8: общее впечатление
  const [impression, setImpression] = useState('');

  // ---------------------------------------------
  // ДОБАВЛЕНО: useEffect для обработки изменения размера окна в Safari
  // ---------------------------------------------
  useEffect(() => {
    const handleResize = () => {
      if (isSafari()) {
        // Обновляем высоту контейнера при изменении размера окна
        const containers = document.querySelectorAll('.mainmenu-container, .feedback-container');
        containers.forEach(container => {
          if (container) {
            container.style.height = `${getViewportHeight()}px`;
            container.style.minHeight = `${getViewportHeight()}px`;
          }
        });
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // ---------------------------------------------
  // 5) При изменении списка спикеров пересоздаём качества
  // ---------------------------------------------
  useEffect(() => {
    setSpeakerQualities(speakersList.map(() => Array(5).fill(null)));
  }, [speakersList]);

  // ---------------------------------------------
  // 6) Бұл Autocomplete партнёров
  // ---------------------------------------------
  const handleFocus = () => { document.body.style.overflow = 'hidden'; };
  const handleBlur  = () => { document.body.style.overflow = ''; };

  const getPartnerSuggestions = (value) => {
    const inputValue = (value || '').trim().toLowerCase();
    if (inputValue.length < 2) return [];
    return partners.filter(p => p.toLowerCase().includes(inputValue));
  };

  // ---------------------------------------------
  // 7) Autocomplete спикеров
  // ---------------------------------------------
  const getSpeakerSuggestions = (value) => {
    const inputValue = (value || '').trim().toLowerCase();
    if (inputValue.length < 2) return [];
    return speakersData.filter(s => s.toLowerCase().includes(inputValue));
  };

  const handleAddSpeaker = () => {
    setSpeakersList(prev => [...prev, { fullName: '', id: prev.length + 1 }]);
  };
  const handleRemoveSpeaker = (index) => {
    setSpeakersList(prev => prev.filter((_, i) => i !== index));
  };
  const handleSpeakerChange = (index, e, { newValue }) => {
    const updated = [...speakersList];
    updated[index].fullName = newValue;
    setSpeakersList(updated);
  };

  // ---------------------------------------------
  // 8) Оценка качеств спикера
  // ---------------------------------------------
  const qualityRows = [
    { positive: 'Экспертный', negative: 'Некомпетентный' },
    { positive: 'Энергичный', negative: 'Пассивный' },
    { positive: 'Мотивирующий', negative: 'Невдохновляющий' },
    { positive: 'Харизматичный', negative: 'Душный' },
    { positive: 'Доступно доносит информацию', negative: 'Говорит сложными терминами' }
  ];

  const handleQualitySelectForSpeaker = (rowIndex, type) => {
    const updated = [...speakerQualities];
    const selectedText = qualityRows[rowIndex][type];
    updated[currentSpeakerIndex][rowIndex] =
      updated[currentSpeakerIndex][rowIndex] === selectedText ? null : selectedText;
    setSpeakerQualities(updated);
  };

  const countSelectedQualities = () => {
    if (!speakerQualities[currentSpeakerIndex]) return 0;
    return speakerQualities[currentSpeakerIndex].filter(q => q !== null).length;
  };

  // ---------------------------------------------
  // 9) Дополнительные опции (шаг 6)
  // ---------------------------------------------
  const toggleAdditionalSelection = (option) => {
    // 1) «Мне всего хватает» — эксклюзивно
    if (option === 'Мне всего хватает') {
      if (additionalSelections.includes(option)) {
        setAdditionalSelections([]);
        setStatsDetails('');
      } else {
        setAdditionalSelections([option]);
        setStatsDetails('');
      }
      return;
    }

    // 2) Если ранее стояло «Мне всего хватает» — сбрасываем его и сразу ставим новый выбор
    if (additionalSelections.includes('Мне всего хватает')) {
      setAdditionalSelections([option]);
      if (option !== 'Статистических данных') setStatsDetails('');
      return;
    }

    // 3) Ограничение в 3 варианта
    if (!additionalSelections.includes(option) && additionalSelections.length >= 3) {
      alert('Можно выбрать не более 3 вариантов');
      return;
    }

    // 4) Обычное переключение
    if (additionalSelections.includes(option)) {
      // снимаем выбор
      setAdditionalSelections(prev => prev.filter(x => x !== option));
      if (option === 'Статистических данных') setStatsDetails('');
    } else {
      // добавляем выбор
      setAdditionalSelections(prev => [...prev, option]);
    }
  };

  // ---------------------------------------------
  // 10) Помощники «NPS» (шаг 9)
  // ---------------------------------------------
  const getRecommendationColor = (value) => {
    if (value <= 3) return 'red';
    if (value === 4) return 'yellow';
    return 'green';
  };
  const getRecommendationLabel = (value) => {
    switch (value) {
      case 1: return 'Никогда и никому';
      case 2: return 'Возможно, врагу';
      case 3: return 'Если только кто-то спросит';
      case 4: return 'При возможности расскажу знакомым и друзьям';
      case 5: return 'Огонь! Всем и всегда!';
      default: return '';
    }
  };
  
  // ---------------------------------------------
  // 12) Проверка canGoNext (условия перехода вперёд)
  // ---------------------------------------------
  const canGoNext = () => {
    switch (currentStep) {
      case 1:
        return partner.trim() !== '' && partners.includes(partner);
      case 2:
        return speakersList.some(s => s.fullName.trim() !== '' && speakersData.includes(s.fullName));
      case 3:
        return countSelectedQualities() >= 3;
      case 4:
        if (usefulness === 'Полезно в работе (буду применять на практике)') {
          return true;
        } else if (usefulness === 'Бесполезно в работе (с моими клиентами это не работает)') {
          return uselessArgument.trim().length >= 15;
        }
        return false;
      case 5:
        return brightThoughts.trim().length >= 5;
      case 6:
        // Если выбрали «Статистических данных» — требуется ввод ≥ 5 символов
        if (additionalSelections.includes('Статистических данных')) {
          return statsDetails.trim().length >= 5;
        }
        // Иначе достаточно хотя бы одного выбора
        return additionalSelections.length > 0;
      case 7:
        return mood.trim() !== '';
      case 8:
        return impression.trim() !== '';
      case 9:
        return hasChangedRating;
      default:
        return true;
    }
  };

  // ---------------------------------------------
  // 13) handleNext: при клике «Далее» (на шаге 1) – animate-exit, затем nextStep
  // ---------------------------------------------
  const handleNext = () => {
    if (!canGoNext()) {
      alert('Заполните корректно поле с партнёром!');
      return;
    }

  // Анимация выезда кнопки только на первом шаге
    if (currentStep === 1) {
      setNextButtonExit(true);
      setTimeout(() => {
        setCurrentStep(2);
        setNextButtonExit(false);
      }, 400); // 0.4s — как в CSS
      return;
    }

  // На шаге спикеров: если есть ещё спикеры, только листаем их, не переходим на следующий шаг
    if (currentStep === 3) {
      if (currentSpeakerIndex < speakersList.length - 1) {
        setCurrentSpeakerIndex(idx => idx + 1);
        return;
      }
    // иначе — уже последний спикер, двигаемся дальше по шагам
    }

    setCurrentStep((s) => s + 1);
  };

  // ---------------------------------------------
  // 14) handlePrev: при возврате с шага 2 → 1 – animate-enter «Далее»
  // ---------------------------------------------
  const handlePrev = () => {
    // Если на первом шаге — уходим на главную
    if (currentStep === 1) {
      navigate('/polls');
      return;
    }
    // Если на шаге 2 — анимация кнопки "Далее"
    if (currentStep === 2) {
      if (nextRef.current) {
        nextRef.current.classList.remove('animate-next-exit');
        setTimeout(() => {
          nextRef.current.classList.add('animate-next');
        }, 100);
      }
    }
    // Если на шаге 3 и не первый спикер – листаем к предыдущему спикеру
    if (currentStep === 3 && currentSpeakerIndex > 0) {
      setCurrentSpeakerIndex(prev => prev - 1);
      return;
    }
    // На шагах 2 и выше — обычный переход назад
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // ---------------------------------------------
  // 15) handleMainMenu: возвращает на главный экран
  // ---------------------------------------------
  const handleMainMenu = () => {
    navigate('/main-menu');
  };

  // ---------------------------------------------
  // 16) handleFinish: собираем и отправляем данные, затем показываем «Спасибо»
  // ---------------------------------------------
  const handleFinish = async () => {
    if (!canGoNext()) {
      alert('Не выполнены условия для завершения опроса');
      return;
    }
    setIsFinished(true);

    const commonAnswers =
      usefulness === 'Бесполезно в работе (с моими клиентами это не работает)'
        ? {
            usefulness,
            uselessArgument: uselessArgument.trim(),
            brightThoughts,
            additionalSuggestions: additionalSelections.join(', '),
            mood,
            impression,
            recommendation,
            statsDetails: additionalSelections.includes('Статистических данных') ? statsDetails : '',
          }
        : {
            usefulness,
            brightThoughts,
            additionalSuggestions: additionalSelections.join(', '),
            mood,
            impression,
            recommendation,
            statsDetails: additionalSelections.includes('Статистических данных') ? statsDetails : '',
          };

    const data = {
      partner,
      dateTime: new Date().toISOString(),
      commonAnswers,
      speakersFeedback: speakersList.map((speaker, i) => ({
        fullName: speaker.fullName,
        qualities: speakerQualities[i],
      })),
    };

    try {
      const response = await fetch('/api/feedback/save', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(data),
                          credentials: 'include',
                        });
      if (!response.ok) {
        alert('Ошибка при сохранении данных');
      }
    } catch (error) {
      console.error('Ошибка при отправке данных:', error);
      alert('Ошибка соединения с сервером');
    }
  };

  // ---------------------------------------------
  // 17) useEffect для «въезда» кнопки next-btn на шаге 1
  //     (ранее он стоял после условного return, что и вызывало ошибку)
  // ---------------------------------------------
  useEffect(() => {
    if (currentStep === 1 && nextRef.current) {
      // В PollsPage logo анимируется 100 мс, home-btn 350 мс – здесь даём 450 мс
      const timer = setTimeout(() => {
        nextRef.current.classList.add('animate-next');
      }, 450);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  useEffect(() => {
  if ((currentStep === 2 || currentStep === 3) && nextRef.current) {
    nextRef.current.classList.add('animate-next');
  }
  }, [currentStep]);

  // ---------------------------------------------
  // 18) renderSuggestion для Autosuggest
  // ---------------------------------------------
  const renderSuggestion = suggestion => <div>{suggestion}</div>;
  const titleRef = useRef(null);
  const inputRef = useRef(null);
  
  // Шаг 9: рекомендация
  const [recommendation, setRecommendation] = useState(3);
const [hasChangedRating, setHasChangedRating] = useState(false);

useEffect(() => {
  if (recommendation !== 3) {
    setHasChangedRating(true);
  }
}, [recommendation]);

  // Функция для текста под слайдером
  function getCommentForRating(val) {
    switch (val) {
      case 1: return 'Очень плохо';
      case 2: return 'Могло быть лучше';
      case 3: return 'Нормально';
      case 4: return 'Хорошо';
      case 5: return 'Огонь! Всем и всегда!';
      default: return '';
    }
  }
  
  // ---------------------------------------------
  // 19) renderStep: рендерим контент по текущему шагу
  // ---------------------------------------------
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="autosuggest-container">
            <h2>Введите название партнера</h2>
            <Autosuggest
              suggestions={partnerSuggestions}
              onSuggestionsFetchRequested={({ value }) => setPartnerSuggestions(getPartnerSuggestions(value))}
              onSuggestionsClearRequested={() => setPartnerSuggestions([])}
              getSuggestionValue={s => s}
              renderSuggestion={renderSuggestion}
              inputProps={{
                placeholder: 'Название партнёра',
                value: partner,
                onChange: (e, { newValue }) => setPartner(newValue),
                onFocus: handleFocus,
                onBlur: handleBlur,
              }}
            />
          </div>
        );

      case 2:
        return (
          <div>
            <h2>Введите ФИО спикера(ов)</h2>

            {speakersList.map((speaker, index) => (
              <div key={speaker.id} style={{ marginBottom: '10px', textAlign: 'center' }}>
                <div className="autosuggest-container">
                  <Autosuggest
                    suggestions={speakersSuggestions}
                    onSuggestionsFetchRequested={({ value }) => setSpeakersSuggestions(getSpeakerSuggestions(value))}
                    onSuggestionsClearRequested={() => setSpeakersSuggestions([])}
                    getSuggestionValue={s => s}
                    renderSuggestion={renderSuggestion}
                    inputProps={{
                      placeholder: 'Фамилия и имя',
                      value: speaker.fullName,
                      onChange: (e, { newValue }) => handleSpeakerChange(index, e, { newValue }),
                      onFocus: handleFocus,
                      onBlur: handleBlur,
                    }}
                  />
                </div>

                {/* Кнопки под последним полем */}
                {index === speakersList.length - 1 && (
                  <div style={{
                    display: 'inline-flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '12px',
                    margin: '0px auto'
                  }}>
                    {/* Всегда: Добавить спикера */}
                    <button
                      type="button"
                      className="add-speaker-btn"
                      onClick={handleAddSpeaker}
                    >
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                        <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </button>

                    {/* Удалить: только если спикеров больше одного */}
                    {speakersList.length > 1 && (
                      <button
                        type="button"
                        className="delete-speaker-btn"
                        onClick={() => handleRemoveSpeaker(index)}
                      >
                        <svg width="24" height="24" viewBox="0 0 20 20" fill="none">
                          <path d="M3 6h18" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                          <path d="M8 6V4h8v2" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                          <path d="M19 6l-1 14H6L5 6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                          <path d="M10 11v6M14 11v6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        );

      case 3:
        return (
          <div className="step3-container">
            <h2>Оцените качества спикера</h2>
            <h3>{speakersList[currentSpeakerIndex].fullName || 'Спикер'}</h3>

            <div className="qualities-wrapper">
              {qualityRows.map((row, idx) => {
                const selected = speakerQualities[currentSpeakerIndex]?.[idx];
                return (
                  <div key={idx} className="quality-row">
                    <button
                      type="button"
                      className={`option-button ${selected === row.positive ? 'selected' : ''}`}
                      onClick={() => handleQualitySelectForSpeaker(idx, 'positive')}
                    >
                      {row.positive}
                    </button>
                    <button
                      type="button"
                      className={`option-button ${selected === row.negative ? 'selected' : ''}`}
                      onClick={() => handleQualitySelectForSpeaker(idx, 'negative')}
                    >
                      {row.negative}
                    </button>
                  </div>
                );
              })}
            </div>

            {countSelectedQualities() < 3 && (
              <p className="quality-warning">Выберите минимум 3 качества</p>
            )}
          </div>
        );

      case 4:
        return (
          <div className="step4-container">
            <h2>Оцените полезность информации</h2>

            <div className="usefulness-container">
              <button
                type="button"
                className={`option-button ${
                  usefulness === 'Полезно в работе (буду применять на практике)'
                    ? 'selected'
                    : ''
                }`}
                onClick={() => {
                  setUsefulness('Полезно в работе (буду применять на практике)');
                  setUselessArgument('');
                }}
              >
                Полезно в работе (буду применять на практике)
              </button>

              <button
                type="button"
                className={`option-button ${
                  usefulness ===
                  'Бесполезно в работе (с моими клиентами это не работает)'
                    ? 'selected'
                    : ''
                }`}
                onClick={() =>
                  setUsefulness(
                    'Бесполезно в работе (с моими клиентами это не работает)'
                  )
                }
              >
                Бесполезно в работе (с моими клиентами это не работает)
              </button>
            </div>

            {usefulness ===
              'Бесполезно в работе (с моими клиентами это не работает)' && (
              <div className="argument-container">
                <input
                  type="text"
                  className="argument-input"
                  placeholder="Аргументация (минимум 30 символов)"
                  value={uselessArgument}
                  onChange={e => setUselessArgument(e.target.value)}
                />
              </div>
            )}
          </div>
        );
      
        case 5:
         return (
           <div className="step5-container">
             <h2>Поделитесь самыми яркими впечатлениями о мероприятии</h2>
             <textarea
               className="bright-thoughts-input"
               placeholder="Не менее 5 символов"
               value={brightThoughts}
               onChange={e => setBrightThoughts(e.target.value)}
               rows={4}
             />
           </div>
         );

      case 6:
        return (
          <div className="step6-container">
            <h2>Чего хотелось бы добавить к мероприятию?</h2>
            <div className="additional-options">
              {additionalOptions.map(option => {
                const isAllSelected = additionalSelections.includes('Мне всего хватает');
                const isSelected   = additionalSelections.includes(option);

                return (
                  <div key={option} className="option-item">
                    <button
                      type="button"
                      className={`option-button ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleAdditionalSelection(option)}
                    >
                      {option}
                    </button>

                    {/* Рендерим инпут прямо под кнопкой «Статистических данных» */}
                    {option === 'Статистических данных' && isSelected && (
                      <input
                        type="text"
                        className="stats-details-input"
                        placeholder="Каких именно?"
                        value={statsDetails}
                        onChange={e => setStatsDetails(e.target.value)}
                        minLength={5}
                        required
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );

      {/* Шаг 7: Настроение пользователя после тренинга */}
      case 7:
        return (
          <div className="step7-container">
            <h2>Ваше настроение после тренинга</h2>
            <div className="impression-container">
              <button
                className={`impression-btn ${mood === 'happy' ? 'selected' : ''}`}
                style={{ fontSize: '60px' }}
                onClick={() => setMood('happy')}
              >
                😃
              </button>
              <button
                className={`impression-btn ${mood === 'neutral' ? 'selected' : ''}`}
                style={{ fontSize: '60px' }}
                onClick={() => setMood('neutral')}
              >
                😐
              </button>
              <button
                className={`impression-btn ${mood === 'sad' ? 'selected' : ''}`}
                style={{ fontSize: '60px' }}
                onClick={() => setMood('sad')}
              >
                ☹️
              </button>
            </div>
          </div>
        );
  
      case 8:
        return (
          <div className="step8-container">
            <h2>Общее впечатление от тренинга</h2>
            <div className="impression-container">
              <button
                className={`impression-btn ${impression === 'happy' ? 'selected' : ''}`}
                onClick={() => setImpression('happy')}
                style={{ fontSize: '60px' }}
              >😃</button>
              <button
                className={`impression-btn ${impression === 'neutral' ? 'selected' : ''}`}
                onClick={() => setImpression('neutral')}
                style={{ fontSize: '60px' }}
              >😐</button>
              <button
                className={`impression-btn ${impression === 'sad' ? 'selected' : ''}`}
                onClick={() => setImpression('sad')}
                style={{ fontSize: '60px' }}
              >☹️</button>
            </div>
          </div>
        );


      case 9:
        return (
          <div className="step9-container">
            <h2>Насколько вы готовы рекомендовать тренинг?</h2>
            <p className="step9-subtitle">Оцените по шкале от 1 до 5</p>

            <input
              type="range"
              min="1"
              max="5"
              value={recommendation}
              className="rating-slider"
              onChange={e => setRecommendation(+e.target.value)}
              // динамически меняем backgroundSize, чтобы заполнение шло вправо
              style={{ backgroundSize: `${((recommendation - 1) / 4) * 100}% 100%` }}
            />

            <span className="rating-value">{recommendation}</span>
            <p className="rating-comment">{getCommentForRating(recommendation)}</p>
          </div>
        );

      default:
        return null;
    }
  };

  // ---------------------------------------------
  // 20) Условный return: если опрос завершён – экран «Спасибо»
  // ---------------------------------------------
  if (isFinished) {
    return (
      <div
        className="mainmenu-container feedback-container"
        style={{ 
          height: isSafari() ? `${getViewportHeight()}px` : '100vh',
          minHeight: '100vh'
        }}
      >

        {/* Логотип (анимация «въезда») */}
        <div ref={logoRef} className="logo-wrapper animate-logo">
          <img src={logoImage} alt="Логотип" className="logo-image" />
        </div>

        {/* Центрированный текст благодарности */}
        <div className="content-wrapper">
          <h2 className="thank-you-text">
            Спасибо за прохождение оценки мероприятия! Отличных продаж!
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div
      className="mainmenu-container feedback-container"
      style={{ 
        height: isSafari() ? `${getViewportHeight()}px` : '100vh',
        minHeight: '100vh'
      }}
    >
      {/* Логотип */}
      <div ref={logoRef} className="logo-wrapper">
        <img src={logoImage} alt="Логотип" className="logo-image" />
      </div>

      {/* Кнопка «Назад» — СЛЕВА от логотипа, ВСЕГДА (кроме isFinished) */}
      {currentStep >= 1 && !isFinished && (
        <button className="back-btn animate-home" onClick={handlePrev}>
          <svg xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="24"
              stroke="white"
              fill="white"
              height="24"
          >
            <path
              d="M12 20l-8-8 8-8"
              stroke="white"
              strokeWidth="1"
              fill="white"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}

      {/* Кнопка «Далее» (1–9 шаг) */}
      {(currentStep >= 1 && currentStep <= 9) && (
        <button
          ref={nextRef}
          className={
            "next-btn" +
            ( nextButtonExit
                ? " animate-next-exit"
                : canGoNext()
                  ? " animate-next"
                  : ""
            )
          }
          onClick={e => {
            handleNextRipple(e);
            currentStep < 9 ? handleNext() : handleFinish();
          }}
          disabled={!canGoNext()}
        >
          {/* ripple-эффект */}
          {rippleArray.map(r => (
            <span key={r.key} className="ripple" style={r.style} />
          ))}

          {/* иконка внутри «шейкера» */}
          <span
            className={
              "shaker" +
              ( !nextButtonExit && canGoNext()
                ? (currentStep < 9 ? " shake-btn" : " pop-btn")
                : ""
              )
            }
          >
            {currentStep < 9 ? (
              <>
                {/* закрашенная белым стрелка вправо */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                  stroke="none"
                  fill="none"
                >
                  <polygon
                    points="9,5 17,12 9,19"
                    fill="white"
                    stroke="none"
                  />
                </svg>
              </>
            ) : (
              <>
                {/* галочка — конец опроса */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                  fill="white"
                  stroke="none"
                >
                  <path
                    d="M5 13l4 4L19 7"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </>
            )}
          </span>
        </button>
      )}
      
      <div className="content-wrapper">
        {renderStep()}  
      </div>
    </div>
  );
}