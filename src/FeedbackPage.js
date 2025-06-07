// src/FeedbackPage.js

import React, { useState, useEffect, useRef } from 'react';
import Autosuggest          from 'react-autosuggest';
import { useSwipeable }     from 'react-swipeable';
import { useNavigate }      from 'react-router-dom';

import './Styles/logo.css';         // стили и анимации логотипа
import './Styles/Buttons.css';      // базовые стили кнопок
import './FeedbackPage.css'; // правки специфичные для FeedbackPage (контент, next-btn и т.д.)
import './Styles/background.css';
import './Styles/BackButton.css';
import './Styles/NextButton.css';

import backgroundImage from './components/background.png';
import logoImage       from './components/logo.png';
import piImage         from './components/pi.png';

import partners      from './components/autosuggest/partners.json';
import speakersData  from './components/autosuggest/speakers.json';

export default function FeedbackPage() {
  // ---------------------------------------------
  // 1) useRef для логотипа и кнопки «Далее»
  // ---------------------------------------------
  const logoRef = useRef(null);
  const nextRef = useRef(null);
  const navigate = useNavigate();
  const [rippleArray, setRippleArray] = useState([]);
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

  // Шаг 9: NPS (рекомендация)
  const [recommendation, setRecommendation] = useState(null);

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
    if (additionalSelections.includes('Мне всего хватает')) return;

    if (!additionalSelections.includes(option) && additionalSelections.length >= 3) {
      alert('Можно выбрать не более 3 вариантов');
      return;
    }
    if (additionalSelections.includes(option)) {
      // Снимаем выбор
      setAdditionalSelections(prev => prev.filter(x => x !== option));
      if (option === 'Статистических данных') {
        setStatsDetails('');
      }
    } else {
      // Добавляем выбор
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
  // 11) Swipeable для перелистывания шагов
  // ---------------------------------------------
  const swipeHandlers = useSwipeable({
    onSwipedLeft:  () => { if (currentStep < 9) handleNext(); },
    onSwipedRight: () => { if (currentStep > 1) handlePrev(); },
    preventDefault: true
  });

  // ---------------------------------------------
  // 12) Проверка canGoNext (условия перехода вперёд)
  // ---------------------------------------------
  const canGoNext = () => {
    switch (currentStep) {
      case 1:
        return partner.trim() !== '' && partners.includes(partner);
      case 2:
        return speakersList.every(s => s.fullName.trim() !== '' && speakersData.includes(s.fullName));
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
        return additionalSelections.length > 0;
      case 7:
        return mood.trim() !== '';
      case 8:
        return impression.trim() !== '';
      case 9:
        return recommendation !== null;
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
      const response = await fetch('https://rgszh-miniapp.org/api/proxy/feedback/save', {
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

  // ---------------------------------------------
  // 18) renderSuggestion для Autosuggest
  // ---------------------------------------------
  const renderSuggestion = suggestion => <div>{suggestion}</div>;

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
                {speakersList.length > 1 && (
                  <button
                    type="button"
                    className="delete-speaker-btn"
                    onClick={() => handleRemoveSpeaker(index)}
                  >
                    Удалить
                  </button>
                )}
              </div>
            ))}
            <button type="button" className="add-speaker-btn" onClick={handleAddSpeaker}>
              <span className="add-speaker-symbol">+</span>
            </button>
          </div>
        );

      case 3:
        return (
          <div>
            <h2>Оцените качества спикера</h2>
            <h3>{speakersList[currentSpeakerIndex].fullName || 'Спикер'}</h3>
            {qualityRows.map((row, idx) => {
              const currentValue = speakerQualities[currentSpeakerIndex]?.[idx];
              return (
                <div key={idx} className="quality-row">
                  <button
                    type="button"
                    className={`quality-option-btn ${currentValue === row.positive ? 'positive-selected' : ''}`}
                    onClick={() => handleQualitySelectForSpeaker(idx, 'positive')}
                  >
                    {row.positive}
                  </button>
                  <button
                    type="button"
                    className={`quality-option-btn ${currentValue === row.negative ? 'negative-selected' : ''}`}
                    onClick={() => handleQualitySelectForSpeaker(idx, 'negative')}
                  >
                    {row.negative}
                  </button>
                </div>
              );
            })}
            {countSelectedQualities() < 3 && <p className="quality-warning">Выберите минимум 3 качества</p>}
          </div>
        );

      case 4:
        return (
          <div>
            <h2>Оцените полезность информации</h2>
            <div className="usefulness-container">
              <button
                type="button"
                className={`usefulness-btn ${
                  usefulness === 'Полезно в работе (буду применять на практике)' ? 'positive-selected' : ''
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
                className={`usefulness-btn ${
                  usefulness === 'Бесполезно в работе (с моими клиентами это не работает)' ? 'negative-selected' : ''
                }`}
                onClick={() => setUsefulness('Бесполезно в работе (с моими клиентами это не работает)')}
              >
                Бесполезно в работе (с моими клиентами это не работает)
              </button>
            </div>
            {usefulness === 'Бесполезно в работе (с моими клиентами это не работает)' && (
              <div className="useless-argument-container">
                <p className="useless-argument-label">Аргументируйте свой ответ:</p>
                <textarea
                  className="useless-argument-textarea"
                  value={uselessArgument}
                  onChange={(e) => setUselessArgument(e.target.value)}
                />
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div>
            <h2>Поделитесь самыми яркими впечатлениями о мероприятии</h2>
            <textarea
              className="bright-thoughts-textarea"
              value={brightThoughts}
              onChange={(e) => setBrightThoughts(e.target.value)}
            />
          </div>
        );

      case 6:
        return (
          <div>
            <h2>Что хотелось бы добавить к мероприятию?</h2>
            {additionalOptions.map(option => {
              const isSelected = additionalSelections.includes(option);

              if (option === 'Мне всего хватает') {
                return (
                  <button
                    key={option}
                    type="button"
                    className={`add-option-btn ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleAdditionalSelection(option)}
                  >
                    {option}
                  </button>
                );
              }

              if (option === 'Статистических данных') {
                return (
                  <React.Fragment key={option}>
                    <button
                      type="button"
                      className={`add-option-btn ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleAdditionalSelection(option)}
                    >
                      {option}
                    </button>
                    {isSelected && (
                      <div className="stats-details-container">
                        <input
                          type="text"
                          className="stats-details-input"
                          placeholder="Уточните, какие именно статистические данные"
                          value={statsDetails}
                          onChange={(e) => setStatsDetails(e.target.value)}
                        />
                      </div>
                    )}
                  </React.Fragment>
                );
              }

              return (
                <button
                  key={option}
                  type="button"
                  className={`add-option-btn ${isSelected ? 'selected' : ''}`}
                  onClick={() => toggleAdditionalSelection(option)}
                >
                  {option}
                </button>
              );
            })}
          </div>
        );

      case 7:
        return (
          <div>
            <h2>Я чувствовал себя на мероприятии...</h2>
            <div className="mood-container">
              <button
                className={`mood-btn ${mood === 'happy' ? 'selected' : ''}`}
                style={{ fontSize: '60px' }}
                onClick={() => setMood('happy')}
              >
                😃
              </button>
              <button
                className={`mood-btn ${mood === 'neutral' ? 'selected' : ''}`}
                style={{ fontSize: '60px' }}
                onClick={() => setMood('neutral')}
              >
                😐
              </button>
              <button
                className={`mood-btn ${mood === 'sad' ? 'selected' : ''}`}
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
          <div>
            <h2>Общее впечатление от тренинга</h2>
            <div className="impression-container">
              <button
                className={`impression-btn ${impression === 'happy' ? 'selected' : ''}`}
                style={{ fontSize: '60px' }}
                onClick={() => setImpression('happy')}
              >
                😃
              </button>
              <button
                className={`impression-btn ${impression === 'neutral' ? 'selected' : ''}`}
                style={{ fontSize: '60px' }}
                onClick={() => setImpression('neutral')}
              >
                😐
              </button>
              <button
                className={`impression-btn ${impression === 'sad' ? 'selected' : ''}`}
                style={{ fontSize: '60px' }}
                onClick={() => setImpression('sad')}
              >
                ☹️
              </button>
            </div>
          </div>
        );

      case 9:
        return (
          <div>
            <h2>Насколько вы готовы рекомендовать тренинг?</h2>
            <p>Оцените по шкале от 1 до 5</p>
            <div className="recommendation-slider-container">
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={recommendation !== null ? recommendation : 3}
                onChange={(e) => setRecommendation(parseInt(e.target.value, 10))}
                className="recommendation-slider"
              />
              <div
                className="recommendation-value"
                style={{ color: getRecommendationColor(recommendation !== null ? recommendation : 3) }}
              >
                {recommendation !== null ? recommendation : 3}
              </div>
              <div className="recommendation-label">
                {getRecommendationLabel(recommendation !== null ? recommendation : 3)}
              </div>
            </div>
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
      <div className="thank-you-message" style={{ backgroundImage: `url(${backgroundImage})` }}>
        {/* Логотип */}
        <div ref={logoRef} className="logo-wrapper">
          <img src={logoImage} alt="Логотип" className="logo-image" />
        </div>
        {/* Кнопка «Назад» */}
        <div className="back-btn-container">
          <button className="back-btn" onClick={() => navigate('/main-menu')}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 20l-8-8 8-8"
                stroke="white"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
        <h2 className="thank-you-text">
          Спасибо за прохождение оценки мероприятия{userName ? `, ${userName}` : ''}!
        </h2>
      </div>
    );
  }

  return (
    <div
      className="mainmenu-container feedback-container"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      {/* Фоновые точки, Pi, overlay */}
      <div className="subtle-dot dot-1" />
      <div className="subtle-dot dot-2" />
      <div className="subtle-dot dot-3" />
      <div className="subtle-dot dot-4" />
      <div className="subtle-dot dot-5" />
      <div className="subtle-dot dot-6" />
      <div className="subtle-dot dot-7" />
      <div className="subtle-dot dot-8" />
      <div className="subtle-dot dot-9" />
      <div className="subtle-dot dot-10" />
      <div className="pi-wrapper">
        <img src={piImage} className="pi-fly" alt="Pi" />
      </div>
      <div className="mainmenu-overlay" />

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

      {/* Кнопка «Далее» — справа от логотипа, только на шаге 1 */}
      {currentStep === 1 && (
        <button
          ref={nextRef}
          className={"next-btn" + (nextButtonExit ? " animate-next-exit" : "")}
          onClick={(e) => { handleNextRipple(e); handleNext(e); }}
          disabled={!canGoNext()}
        >
          {rippleArray.map(r => (
            <span key={r.key} className="ripple" style={r.style} />
          ))}
          <span className={"shaker" + (canGoNext() && !nextButtonExit ? " shake-btn" : "")}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="24"
              stroke="white"
              fill="white"
              height="24"
            >
              <path
                d="M12 4l8 8-8 8"
                stroke="white"
                strokeWidth="1"
                fill="white"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </button>
      )}

      {/* ====== Контент шага ====== */}
      <div className="content-wrapper" {...swipeHandlers}>
        {renderStep()}
        {/* Кнопки «Вперёд» и «Готово» для шагов > 1 (как есть) */}
        {currentStep > 1 && (
          <div className="top-btn-container">
            {currentStep < 9 ? (
              <button className="top-btn" onClick={handleNext} disabled={!canGoNext()}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 4l8 8-8 8"
                    stroke="white"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            ) : (
              <button className="top-btn finish-btn" onClick={handleFinish} disabled={!canGoNext()}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19l10-10-1.41-1.41z" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}









































































































