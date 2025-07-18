// AssessmentPage.js - ИСПРАВЛЕННАЯ ВЕРСИЯ
// ✅ Исправлена ошибка "Cannot access 'currentStep' before initialization"
// ✅ Правильный порядок объявления состояний
// ✅ Приближена кнопка "Далее" к логотипу в десктопе
// ✅ Добавлен отступ от логотипа
// ✅ Центрированы все элементы в десктопе

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Autosuggest from 'react-autosuggest';
import { useNavigate } from 'react-router-dom';
import { apiCall } from './config';

// Стили
import './Styles/logo.css';
import './Styles/Buttons.css';
import './Styles/BackButton.css';
import './Styles/NextButton.css';
import './Styles/OptionButton.css';
import './FeedbackPage.css';
import './AssessmentPage.css';
import './Styles/mobile-responsive.css';
import logoImage from './components/logo.png';

// JSON-файлы с ФИО
import surnames from './components/autosuggest/surname.json';
import firstnames from './components/autosuggest/firstname.json';
import patronymics from './components/autosuggest/lastname.json';

export default function AssessmentPage() {
  const navigate = useNavigate();
  const logoRef = useRef(null);
  const startTimeRef = useRef(null);
  const containerRef = useRef(null);
  const scrollableContentRef = useRef(null);

  // ===== СОСТОЯНИЯ (В ПРАВИЛЬНОМ ПОРЯДКЕ) =====
  const [containerHeight, setContainerHeight] = useState(window.innerHeight);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  
  // Основные состояния приложения
  const [currentStep, setCurrentStep] = useState(1);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [userAnswers, setUserAnswers] = useState([]);
  const [isFinished, setIsFinished] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [fadeTransition, setFadeTransition] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Данные пользователя
  const [surname, setSurname] = useState('');
  const [firstName, setFirstName] = useState('');
  const [patronymic, setPatronymic] = useState('');
  const [surnameSuggestions, setSurnameSuggestions] = useState([]);
  const [firstNameSuggestions, setFirstNameSuggestions] = useState([]);
  const [patronymicSuggestions, setPatronymicSuggestions] = useState([]);

  // Данные опросника
  const [questionnaire, setQuestionnaire] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [shuffledQuestions, setShuffledQuestions] = useState([]);

  const MAIN_QUESTIONNAIRE_ID = 1;

  // ===== ФУНКЦИЯ ОБНОВЛЕНИЯ ВЫСОТЫ И ОПРЕДЕЛЕНИЯ УСТРОЙСТВА =====
  const updateContainerHeight = useCallback(() => {
    const newHeight = window.innerHeight;
    const newWidth = window.innerWidth;
    
    setContainerHeight(newHeight);
    setIsDesktop(newWidth >= 1024);
    
    // Дополнительно обновляем стиль контейнера напрямую
    if (containerRef.current) {
      containerRef.current.style.height = `${newHeight}px`;
      containerRef.current.style.minHeight = `${newHeight}px`;
    }
  }, []);

  // ===== ОБРАБОТЧИК ИЗМЕНЕНИЯ РАЗМЕРА ОКНА =====
  useEffect(() => {
    // Начальная установка высоты
    updateContainerHeight();
    
    // Добавляем слушатели событий
    window.addEventListener('resize', updateContainerHeight);
    window.addEventListener('orientationchange', updateContainerHeight);
    
    // Дополнительная проверка через таймаут для orientationchange
    const handleOrientationChange = () => {
      setTimeout(updateContainerHeight, 100);
    };
    
    window.addEventListener('orientationchange', handleOrientationChange);
    
    return () => {
      window.removeEventListener('resize', updateContainerHeight);
      window.removeEventListener('orientationchange', updateContainerHeight);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [updateContainerHeight]);

  // ===== СКРОЛЛ В НАЧАЛО ПРИ СМЕНЕ ШАГА (ТЕПЕРЬ ПОСЛЕ ОБЪЯВЛЕНИЯ СОСТОЯНИЙ) =====
  useEffect(() => {
    if (scrollableContentRef.current) {
      scrollableContentRef.current.scrollTop = 0;
    }
  }, [currentStep, currentQuestion]);

  // Обработанные данные для автосаджестов
  const surnameList = surnames.map(item => item.male || item.female);
  const firstNameList = firstnames.map(item =>
    typeof item === 'string' ? item : (item.firstName || item.name)
  );
  const patronymicList = patronymics.map(item =>
    typeof item === 'string' ? item : (item.patronymic || item.name)
  );

  // Функция для рандомизации порядка ответов
  const shuffleOptions = (options) => {
    const shuffled = [...options];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // ===== Загрузка опросника =====
  useEffect(() => {
    const loadQuestionnaire = async () => {
      try {
        setIsLoading(true);
        setErrorMessage('');
        
        const data = await apiCall(`/api/questionnaire/${MAIN_QUESTIONNAIRE_ID}?include_questions=true`);
        
        setQuestionnaire(data);
        const loadedQuestions = data.questions || [];
        
        if (loadedQuestions.length === 0) {
          throw new Error('No questions found in questionnaire');
        }
        
        setQuestions(loadedQuestions);
        
        const questionsWithShuffledOptions = loadedQuestions.map(question => ({
          ...question,
          shuffledOptions: shuffleOptions(question.options || [])
        }));
        setShuffledQuestions(questionsWithShuffledOptions);
        
      } catch (error) {
        console.error('❌ Error loading questionnaire:', error);
        setErrorMessage(`Ошибка загрузки опросника: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadQuestionnaire();
    startTimeRef.current = Date.now();
  }, []);

  // ===== Автосаджест функции =====
  const getSuggestions = (value, list) => {
    const inputValue = value.trim().toLowerCase();
    const inputLength = inputValue.length;
    return inputLength === 0 ? [] : list.filter(item => 
      item.toLowerCase().slice(0, inputLength) === inputValue
    );
  };

  const renderAutosuggest = (value, setValue, suggestions, setSuggestions, list, placeholder) => (
    <Autosuggest
      suggestions={suggestions}
      onSuggestionsFetchRequested={({ value }) => setSuggestions(getSuggestions(value, list))}
      onSuggestionsClearRequested={() => setSuggestions([])}
      getSuggestionValue={suggestion => suggestion}
      renderSuggestion={suggestion => <div>{suggestion}</div>}
      inputProps={{
        placeholder,
        value,
        onChange: (_, { newValue }) => setValue(newValue)
      }}
    />
  );

  // ===== Обработчики навигации =====
  const handleNext = useCallback(() => {
    if (currentStep === 1) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!surname.trim() || !firstName.trim() || !patronymic.trim()) {
        setErrorMessage('Заполните все поля ФИО');
        return;
      }
      setErrorMessage('');

      const freshShuffledQuestions = questions.map(question => ({
        ...question,
        shuffledOptions: shuffleOptions([...question.options])
      }));
      setShuffledQuestions(freshShuffledQuestions);
      
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (!selectedAnswer) {
        setErrorMessage('Выберите один из вариантов ответа');
        return;
      }

      setErrorMessage('');
      
      // Сохраняем ответ
      const existingAnswerIndex = userAnswers.findIndex(ans => ans.question_id === questions[currentQuestion].id);

      let updatedAnswers;
      if (existingAnswerIndex >= 0) {
        updatedAnswers = [...userAnswers];
        updatedAnswers[existingAnswerIndex] = {
          question_id: questions[currentQuestion].id,
          answer_text: selectedAnswer,
          answer_index: shuffledQuestions[currentQuestion].shuffledOptions.findIndex(opt => opt.text === selectedAnswer)
        };
      } else {
        updatedAnswers = [...userAnswers, {
          question_id: questions[currentQuestion].id,
          answer_text: selectedAnswer,
          answer_index: shuffledQuestions[currentQuestion].shuffledOptions.findIndex(opt => opt.text === selectedAnswer)
        }];
      }
      setUserAnswers(updatedAnswers);

      if (currentQuestion === questions.length - 1) {
        finishAssessment(updatedAnswers);
      } else {
        setFadeTransition(true);
        setTimeout(() => {
          setCurrentQuestion(currentQuestion + 1);
          setSelectedAnswer('');
          setFadeTransition(false);
        }, 300);
      }
    }
  }, [currentStep, surname, firstName, patronymic, selectedAnswer, currentQuestion, questions, userAnswers]);

  const handleBack = useCallback(() => {
    if (currentStep === 2) {
      setCurrentStep(1);
    } else if (currentStep === 3) {
      if (currentQuestion > 0) {
        setFadeTransition(true);
        setTimeout(() => {
          setCurrentQuestion(currentQuestion - 1);
          if (userAnswers[currentQuestion - 1]) {
            setSelectedAnswer(userAnswers[currentQuestion - 1].answer_text);
          }
          setFadeTransition(false);
        }, 300);
      } else {
        setCurrentStep(2);
      }
    }
  }, [currentStep, currentQuestion, userAnswers]);

  // ===== Завершение тестирования =====
  const finishAssessment = async (answers) => {
    try {
      setIsProcessing(true);
      setErrorMessage('');

      const uniqueAnswers = answers.slice(0, 25);
      const answersTextArray = uniqueAnswers.map(answer => answer.answer_text);
      
      if (uniqueAnswers.length !== 25) {
        throw new Error(`Expected 25 answers, got ${uniqueAnswers.length}`);
      }

      const sessionData = {
        questionnaireId: 1,
        surname: surname.trim(),
        firstName: firstName.trim(),
        patronymic: patronymic.trim(),
        answers: answersTextArray,
        completionTime: Math.max(1, Math.round((Date.now() - startTimeRef.current) / 60000))
      };

      const response = await apiCall('/api/assessment/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData)
      });

      setResult({ success: true });
      setIsFinished(true);
    } catch (error) {
      console.error('❌ Error submitting assessment:', error);
      setErrorMessage('Ошибка при отправке результатов. Попробуйте еще раз.');
    } finally {
      setIsProcessing(false);
    }
  };

  const goHome = () => {
    logoRef.current?.classList.replace('animate-logo', 'animate-logo-exit');
    setTimeout(() => navigate('/'), 400);
  };

  // ===== Определение состояния кнопки Далее =====
  const canGoNext = () => {
    if (currentStep === 1) return true;
    if (currentStep === 2) return surname.trim() && firstName.trim() && patronymic.trim();
    if (currentStep === 3) return selectedAnswer;
    return false;
  };

  const getButtonIcon = () => {
    if (currentStep === 3 && currentQuestion === questions.length - 1) {
      return (
        <svg viewBox="0 0 24 24" width="36" height="36">
          <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    }
    return (
      <svg viewBox="0 0 24 24" width="36" height="36">
        <path d="M12 4l8 8-8 8" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  };

  // ===== ИСПРАВЛЕННЫЕ СТИЛИ ДЛЯ ДЕСКТОПА =====
  const containerStyle = {
    position: 'relative',
    width: '100%',
    height: `${containerHeight}px`,
    minHeight: `${containerHeight}px`,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, sans-serif',
    WebkitOverflowScrolling: 'touch',
    overscrollBehavior: 'none',
    // УБИРАЕМ: background, backgroundImage - фон теперь только в MainApp.js
  };

  // ИСПРАВЛЕНИЕ 1: Фиксированный логотип с правильными отступами
  const logoContainerStyle = {
    position: 'absolute',
    top: '0',
    left: '0',
    right: '0',
    zIndex: 1000,
    display: 'flex',
    justifyContent: 'center',
    paddingTop: isDesktop ? '30px' : '40px',
    paddingBottom: isDesktop ? '15px' : '20px',
    background: 'transparent'
  };

  // ИСПРАВЛЕНИЕ 2: Увеличенный отступ от логотипа + центрирование для десктопа
  const scrollableContentStyle = {
    position: 'absolute',
    top: isDesktop ? '200px' : '205px', // Меньший отступ для десктопа
    left: '0',
    right: '0',
    bottom: '0',
    overflowY: 'auto',
    overflowX: 'hidden',
    paddingLeft: isDesktop ? '40px' : '15px',
    paddingRight: isDesktop ? '40px' : '15px',
    paddingBottom: isDesktop ? '120px' : '100px',
    zIndex: 2,
    display: 'flex',
    justifyContent: 'center',  // ЦЕНТРИРОВАНИЕ ДЛЯ ДЕСКТОПА
    alignItems: isDesktop ? 'flex-start' : 'stretch'
  };

  // ИСПРАВЛЕНИЕ 3: Контейнер с центрированием для десктопа
  const contentWrapperStyle = {
    width: '100%',
    maxWidth: isDesktop ? '700px' : '100%', // Ограничение ширины для десктопа
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center' // ЦЕНТРИРОВАНИЕ ТЕКСТА
  };

  // ===== Рендер контента =====
  const renderStepContent = () => {
    if (isLoading) {
      return (
        <div className="step-container">
          <div className="assessment-loading">
            <div className="loading-spinner"></div>
            <div className="loading-text">Загрузка опросника...</div>
            <div className="loading-subtext">Подготавливаем вопросы для оценки</div>
          </div>
        </div>
      );
    }

    if (isProcessing) {
      return (
        <div className="step-container">
          <div className="assessment-loading">
            <div className="loading-spinner"></div>
            <div className="loading-text">Обработка результатов...</div>
            <div className="loading-subtext">Анализируем ваши ответы</div>
          </div>
        </div>
      );
    }

    if (isFinished && result) {
      return (
        <div className="step-container result-appear">
          <div className="completion-message" style={{ textAlign: 'center' }}>
            <h2>Спасибо за прохождение!</h2>
            <p>
              {firstName}, благодарим за прохождение опроса.<br/>
              Свяжемся с вами в ближайшее время.<br/>
              Отличного дня!
            </p>
            <button 
              className="home-button"
              onClick={goHome}
              style={{
                marginTop: '30px',
                padding: '12px 24px',
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                borderRadius: '8px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              На главную
            </button>
          </div>
        </div>
      );
    }

    switch (currentStep) {
      case 1:
        return (
          <div className="step-container fade-in-up" style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: isDesktop ? '28px' : '22px', marginBottom: '25px' }}>
              Психологическая оценка
            </h2>
            <p className="instruction-text large-text" style={{ 
              fontSize: isDesktop ? '20px' : '18px',
              lineHeight: '1.6',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              Пройдите короткий тест для определения ваших корпоративных ценностей.
              {questionnaire?.description && ` ${questionnaire.description}`}
            </p>
            <p className="instruction-subtext large-text" style={{
              fontSize: isDesktop ? '18px' : '16px',
              lineHeight: '1.5',
              marginBottom: '25px',
              textAlign: 'center',
              color: 'rgba(255, 255, 255, 0.9)'
            }}>
              {questionnaire?.instructions || 
               'Здесь нет «правильных» или «неправильных» ответов — важно лишь понять ваш естественный стиль работы и взаимодействия.'}
            </p>
            {questionnaire && (
              <div className="questionnaire-info" style={{
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: isDesktop ? '25px' : '15px',
                marginTop: '25px',
                textAlign: 'center',
                maxWidth: isDesktop ? '500px' : '100%',
                margin: '25px auto 0'
              }}>
                <p style={{ margin: '10px 0', fontSize: isDesktop ? '16px' : '14px' }}>
                  <strong>Опросник:</strong> {questionnaire.title}
                </p>
                <p style={{ margin: '10px 0', fontSize: isDesktop ? '16px' : '14px' }}>
                  <strong>Количество вопросов:</strong> {questionnaire.questions_count}
                </p>
                {questionnaire.max_time_minutes && (
                  <p style={{ margin: '10px 0', fontSize: isDesktop ? '16px' : '14px' }}>
                    <strong>Примерное время:</strong> {questionnaire.max_time_minutes} минут
                  </p>
                )}
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="step-container fade-in-up" style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: isDesktop ? '26px' : '22px', marginBottom: '25px' }}>
              Введите ваши ФИО
            </h2>
            {errorMessage && <div className="error-message">{errorMessage}</div>}
            
            <div className="form-fields" style={{
              maxWidth: isDesktop ? '500px' : '400px',
              margin: '0 auto',
              textAlign: 'left'
            }}>
              <div className="autosuggest-container">
                <label style={{ fontSize: isDesktop ? '18px' : '16px' }}>Фамилия</label>
                {renderAutosuggest(
                  surname, setSurname, 
                  surnameSuggestions, setSurnameSuggestions, 
                  surnameList, 'Введите фамилию'
                )}
              </div>
              
              <div className="autosuggest-container">
                <label style={{ fontSize: isDesktop ? '18px' : '16px' }}>Имя</label>
                {renderAutosuggest(
                  firstName, setFirstName, 
                  firstNameSuggestions, setFirstNameSuggestions, 
                  firstNameList, 'Введите имя'
                )}
              </div>
              
              <div className="autosuggest-container">
                <label style={{ fontSize: isDesktop ? '18px' : '16px' }}>Отчество</label>
                {renderAutosuggest(
                  patronymic, setPatronymic, 
                  patronymicSuggestions, setPatronymicSuggestions, 
                  patronymicList, 'Введите отчество'
                )}
              </div>
            </div>
          </div>
        );

      case 3:
        if (!questions.length || !shuffledQuestions.length) {
          return (
            <div className="step-container">
              <div className="error-message">
                Не удалось загрузить вопросы опросника
              </div>
            </div>
          );
        }

        const currentQuestionData = shuffledQuestions[currentQuestion];
        return (
          <div className={`step-container ${fadeTransition ? 'fade-out' : 'fade-in'}`} style={{ textAlign: 'center' }}>
            <div className="question-header" style={{ textAlign: 'center' }}>
              <div className="progress-indicator">
                {questions.map((_, idx) => (
                  <div 
                    key={idx} 
                    className={`progress-dot ${
                      idx < currentQuestion ? 'completed' : 
                      idx === currentQuestion ? 'active' : ''
                    }`}
                  />
                ))}
              </div>
              <div className="question-counter">
                {currentQuestion + 1} / {questions.length}
              </div>
            </div>

            <div className="question-content" style={{ textAlign: 'center' }}>
              <h2 className="question-title" style={{ 
                fontSize: isDesktop ? '24px' : '22px',
                textAlign: 'center',
                maxWidth: isDesktop ? '600px' : '100%',
                margin: '20px auto 30px'
              }}>
                {currentQuestionData.question_text || currentQuestionData.text || 'Вопрос'}
              </h2>
              {errorMessage && <div className="error-message">{errorMessage}</div>}
            </div>

            <div className="options-container" style={{ 
              overflow: 'visible', 
              padding: '15px 10px',
              maxWidth: isDesktop ? '600px' : '350px',
              margin: '0 auto'
            }}>
              {currentQuestionData.shuffledOptions.map((option, idx) => (
                <button
                  key={idx}
                  className={`option-button ${selectedAnswer === option.text ? 'selected' : ''}`}
                  onClick={() => setSelectedAnswer(option.text)}
                  style={{
                    margin: '8px 0',
                    overflow: 'visible',
                    width: '100%',
                    padding: isDesktop ? '16px 24px' : '14px 20px',
                    fontSize: isDesktop ? '17px' : '16px',
                    textAlign: 'center',
                    ...(selectedAnswer === option.text ? {
                      animation: 'selectedPulse 1.5s ease-in-out infinite',
                      background: 'rgba(255, 255, 255, 0.35)',
                      border: '2px solid rgba(255, 255, 255, 0.9)',
                      boxShadow: '0 0 10px rgba(255, 255, 255, 0.7)',
                      filter: 'brightness(1.2)'
                    } : {})
                  }}
                >
                  {option.text}
                </button>
              ))}
           </div>

            {currentQuestionData.description && (
              <div className="question-description" style={{
                textAlign: 'center',
                maxWidth: isDesktop ? '500px' : '100%',
                margin: '20px auto',
                fontSize: isDesktop ? '16px' : '14px'
              }}>
                {currentQuestionData.description}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // ===== Основной рендер =====
  return (
    <div 
      ref={containerRef}
      style={containerStyle}
    >
      {/* Встроенные CSS стили для адаптивности */}
      <style>
        {`
          .assessment-container-fixed {
            -webkit-backface-visibility: hidden;
            backface-visibility: hidden;
            -webkit-transform: translate3d(0, 0, 0);
            transform: translate3d(0, 0, 0);
          }

          @supports (-webkit-touch-callout: none) {
            .assessment-container-fixed {
              height: -webkit-fill-available !important;
              min-height: -webkit-fill-available !important;
            }
          }

          /* Кастомизация скроллбара */
          .scrollable-content::-webkit-scrollbar {
            width: ${isDesktop ? '6px' : '4px'};
          }
          .scrollable-content::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 3px;
          }
          .scrollable-content::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.3);
            border-radius: 3px;
          }
          .scrollable-content::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.5);
          }

          /* Адаптивные стили для кнопок */
          .next-btn {
            width: ${isDesktop ? '72px' : '64px'} !important;
            height: ${isDesktop ? '72px' : '64px'} !important;
            top: ${isDesktop ? '140px' : '180px'} !important;
            right: ${isDesktop ? '40px' : '70px'} !important;
          }

          .back-btn {
            width: ${isDesktop ? '50px' : '44px'} !important;
            height: ${isDesktop ? '50px' : '44px'} !important;
            top: ${isDesktop ? '145px' : '125px'} !important;
            left: ${isDesktop ? '40px' : '20px'} !important;
          }

          /* Адаптивные размеры для полей ввода */
          .autosuggest-container .react-autosuggest__input {
            font-size: ${isDesktop ? '18px' : '16px'} !important;
            padding: ${isDesktop ? '14px 18px' : '12px 16px'} !important;
          }
        `}
      </style>

      {/* ФИКСИРОВАННЫЙ ЛОГОТИП ВВЕРХУ */}
      <div style={logoContainerStyle}>
        <div ref={logoRef} className="logo-wrapper">
          <img 
            src={logoImage} 
            alt="Логотип" 
            className="logo-image"
            style={{
              width: isDesktop ? '140px' : '120px',
              height: isDesktop ? '140px' : '120px'
            }}
          />
        </div>
      </div>

      {/* Кнопка "Назад" с адаптивным позиционированием */}
      {(currentStep > 1 || (currentStep === 3 && currentQuestion > 0)) && !isFinished && !isLoading && (
        <button 
          className="back-btn" 
          onClick={handleBack}
        >
          <svg viewBox="0 0 24 24" width={isDesktop ? '28' : '24'} height={isDesktop ? '28' : '24'}>
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}

      {/* Кнопка "Далее" с адаптивным позиционированием */}
      {(currentStep <= 3 && !isProcessing && !isFinished && !isLoading) && (
        <button 
          className={`next-btn ${canGoNext() ? 'animate-next' : ''}`}
          onClick={handleNext}
          disabled={!canGoNext()}
        >
          <div className={`shaker ${canGoNext() ? (currentStep === 3 && currentQuestion === questions.length - 1 ? 'pop-btn' : 'shake-btn') : ''}`}>
            {getButtonIcon()}
          </div>
        </button>
      )}

      {/* СКРОЛЛИРУЕМЫЙ КОНТЕНТ С ЦЕНТРИРОВАНИЕМ */}
      <div 
        ref={scrollableContentRef}
        className="scrollable-content"
        style={scrollableContentStyle}
      >
        <div style={contentWrapperStyle}>
          {renderStepContent()}
        </div>
      </div>
    </div>
  );
}