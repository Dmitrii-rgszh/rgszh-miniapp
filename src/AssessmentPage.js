// AssessmentPage.js - С УНИФИЦИРОВАННЫМИ МОДУЛЬНЫМИ СТИЛЯМИ
// ✅ Использует существующие CSS модули: containers.css, logo.css, text.css, buttons.css
// ✅ Унифицированное позиционирование кнопок через CSS переменные
// ✅ Корпоративные цвета и шрифты из модульной системы

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Autosuggest from 'react-autosuggest';
import { useNavigate } from 'react-router-dom';
import { apiCall } from './config';
import logoImage from './components/logo.png';

// Подключаем модульные CSS файлы
import './Styles/containers.css';   // Контейнеры и позиционирование
import './Styles/logo.css';         // Логотип с анимациями
import './Styles/text.css';         // Типографика
import './Styles/buttons.css';      // Универсальные кнопки
import './Styles/NextButton.css';   // Кнопка "Далее"
import './Styles/BackButton.css';   // Кнопка "Назад"
import './Styles/HomeButton.css';   // Кнопка "Домой"

// JSON-файлы с ФИО
import surnames from './components/autosuggest/surname.json';
import firstnames from './components/autosuggest/firstname.json';
import patronymics from './components/autosuggest/lastname.json';

export default function AssessmentPage() {
  const navigate = useNavigate();
  const startTimeRef = useRef(null);
  const backRef = useRef(null);
  const homeRef = useRef(null);
  const logoRef = useRef(null);
  const contentRef = useRef(null);

  // ===== АДАПТИВНОСТЬ =====
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Обработчик изменения размера окна
  useEffect(() => {
    const handleResize = () => {
      setWindowHeight(window.innerHeight);
      setWindowWidth(window.innerWidth);
      setTimeout(() => {
        setWindowHeight(window.innerHeight);
        setWindowWidth(window.innerWidth);
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    const checkMobile = () => {
      if (windowWidth < 768) {
        handleResize();
      }
    };
    
    setTimeout(checkMobile, 300);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [windowWidth]);

  // ===== АДАПТИВНЫЕ ПАРАМЕТРЫ =====
  const isSmallScreen = windowHeight < 700 || windowWidth < 375;
  const isMobileWidth = windowWidth < 768;
  const isMediumScreen = windowHeight >= 700 && windowHeight < 900;
  
  // Адаптивные значения для логотипа
  const logoSize = isSmallScreen ? 96 : 128;
  const logoTop = isSmallScreen ? 80 : 110;
  const logoImageSize = isSmallScreen ? 72 : 96;
  const contentTop = isSmallScreen ? 200 : (isMediumScreen ? 240 : 268);
  
  // Расчет позиций для кнопок
  const buttonSize = 64;
  const buttonTop = logoTop + (logoSize - buttonSize) / 2;
  const buttonDistance = 30;

  // ===== СОСТОЯНИЯ АНИМАЦИЙ =====
  const [logoAnimated, setLogoAnimated] = useState(false);
  const [contentAnimated, setContentAnimated] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // ===== ОСНОВНЫЕ СОСТОЯНИЯ =====
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

  // ===== УСТАНОВКА CSS ПЕРЕМЕННЫХ ДЛЯ ПОЗИЦИОНИРОВАНИЯ =====
  useEffect(() => {
    // Устанавливаем CSS переменные для кнопки "Назад" 
    if (backRef.current) {
      const top = buttonTop;
      const left = windowWidth < 375 
        ? 'max(env(safe-area-inset-left, 20px), 20px)'
        : `calc(50% - ${logoSize/2}px - ${buttonDistance}px - ${buttonSize}px)`;
      
      backRef.current.style.setProperty('--back-button-top', `${top}px`);
      backRef.current.style.setProperty('--back-button-left', left);
      backRef.current.style.setProperty('--back-button-size', `${buttonSize}px`);
    }

    // Устанавливаем CSS переменные для кнопки "Домой"
    if (homeRef.current) {
      const top = buttonTop;
      const left = windowWidth < 375 
        ? 'max(env(safe-area-inset-left, 20px), 20px)'
        : `max(calc(50% - ${logoSize/2}px - ${buttonDistance}px - ${buttonSize}px), env(safe-area-inset-left, 20px))`;
      
      homeRef.current.style.setProperty('--home-button-top', `${top}px`);
      homeRef.current.style.setProperty('--home-button-left', left);
      homeRef.current.style.setProperty('--home-button-size', `${buttonSize}px`);
    }
  }, [logoSize, logoTop, buttonTop, buttonDistance, buttonSize, windowWidth, windowHeight, contentTop, logoImageSize]);

  // ===== АНИМАЦИЯ ВХОДА =====
  useEffect(() => {
    if (!isLoading) {
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
    }
  }, [isLoading]);

  // ===== ФУНКЦИИ ЛОГИКИ =====

  // Определение возможности перехода далее
  const canGoNext = () => {
    if (currentStep === 1) return true;
    if (currentStep === 2) return surname.trim() && firstName.trim() && patronymic.trim();
    if (currentStep === 3) return selectedAnswer;
    return false;
  };

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

  // Загрузка опросника
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

  // Автосаджест функции
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
      renderSuggestion={suggestion => <div style={{ padding: '10px' }}>{suggestion}</div>}
      inputProps={{
        placeholder,
        value,
        onChange: (_, { newValue }) => setValue(newValue),
        style: {
          width: '100%',
          padding: isSmallScreen ? '14px 18px' : '16px 20px',
          fontSize: isSmallScreen ? '18px' : '20px',
          fontFamily: '"Segoe UI", sans-serif',
          textAlign: 'center',
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '12px',
          color: 'white',
          marginBottom: '15px',
          transition: 'all 0.3s ease',
          outline: 'none',
          boxSizing: 'border-box'
        }
      }}
      theme={{
        container: { position: 'relative', width: '100%' },
        suggestionsContainer: {
          position: 'absolute',
          top: '100%',
          width: '100%',
          background: 'rgba(0, 0, 0, 0.9)',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          marginTop: '5px',
          maxHeight: '200px',
          overflowY: 'auto',
          zIndex: 1000
        },
        suggestion: {
          padding: '12px 20px',
          cursor: 'pointer',
          color: 'white',
          transition: 'background 0.2s ease'
        },
        suggestionHighlighted: {
          background: 'rgba(180, 0, 55, 0.5)'
        }
      }}
    />
  );

  // Обработчики навигации
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
  }, [currentStep, surname, firstName, patronymic, selectedAnswer, currentQuestion, questions, userAnswers, shuffledQuestions]);

  const handleBack = useCallback(() => {
    if (currentStep === 2) {
      setCurrentStep(1);
    } else if (currentStep === 3) {
      if (currentQuestion > 0) {
        setFadeTransition(true);
        setTimeout(() => {
          setCurrentQuestion(currentQuestion - 1);
          const prevAnswer = userAnswers.find(ans => ans.question_id === questions[currentQuestion - 1].id);
          if (prevAnswer) {
            setSelectedAnswer(prevAnswer.answer_text);
          }
          setFadeTransition(false);
        }, 300);
      } else {
        setCurrentStep(2);
      }
    }
  }, [currentStep, currentQuestion, userAnswers, questions]);

  // Завершение тестирования
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
    setIsExiting(true);
    if (logoRef.current) {
      logoRef.current.classList.add('animate-logo-exit');
    }
    setTimeout(() => navigate('/'), 800);
  };

  // ===== РЕНДЕР КОНТЕНТА =====
  const renderStepContent = () => {
    if (isLoading) {
      return (
        <div className="content-container centered" style={{ top: contentTop + 'px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '3px solid rgba(255, 255, 255, 0.3)',
            borderTopColor: 'white',
            borderRadius: '50%',
            margin: '0 auto 30px',
            animation: 'spin 1s linear infinite'
          }} />
          <div className="text-h2">Загрузка опросника...</div>
          <div className="text-body">Подготавливаем вопросы для оценки</div>
        </div>
      );
    }

    if (isProcessing) {
      return (
        <div className="content-container centered" style={{ top: contentTop + 'px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '3px solid rgba(255, 255, 255, 0.3)',
            borderTopColor: 'white',
            borderRadius: '50%',
            margin: '0 auto 20px',
            animation: 'spin 1s linear infinite'
          }} />
          <div className="text-h2">Обработка результатов...</div>
          <div className="text-body">Анализируем ваши ответы</div>
        </div>
      );
    }

    if (isFinished && result) {
      return (
        <div 
          className={`content-container centered ${contentAnimated ? 'animated' : ''}`} 
          style={{ top: contentTop + 'px' }}
        >
          <h2 className="text-h2 text-center">Спасибо за прохождение!</h2>
          <p className="text-body text-center">
            {firstName}, благодарим за прохождение опроса.<br/>
            Свяжемся с вами в ближайшее время.<br/>
            Отличного дня!
          </p>
        </div>
      );
    }

    switch (currentStep) {
      case 1:
        return (
          <div 
            className={`content-container centered ${contentAnimated ? 'animated' : ''}`} 
            style={{ top: contentTop + 'px' }}
          >
            <h2 className="text-h2 text-center">Психологическая оценка</h2>
            <p className="text-body text-center">
              Пройдите короткий тест для определения ваших корпоративных ценностей.
              {questionnaire?.description && ` ${questionnaire.description}`}
            </p>
            <p className="text-body text-center" style={{ fontSize: isSmallScreen ? '14px' : '16px', opacity: 0.9 }}>
              {questionnaire?.instructions || 
               'Здесь нет «правильных» или «неправильных» ответов — важно лишь понять ваш естественный стиль работы и взаимодействия.'}
            </p>
            {questionnaire && (
              <div className="card-container" style={{ marginTop: '20px' }}>
                <p className="text-body text-center" style={{ margin: '10px 0', fontSize: isSmallScreen ? '14px' : '16px' }}>
                  <strong>Опросник:</strong> {questionnaire.title}
                </p>
                <p className="text-body text-center" style={{ margin: '10px 0', fontSize: isSmallScreen ? '14px' : '16px' }}>
                  <strong>Количество вопросов:</strong> {questionnaire.questions_count}
                </p>
                {questionnaire.max_time_minutes && (
                  <p className="text-body text-center" style={{ margin: '10px 0', fontSize: isSmallScreen ? '14px' : '16px' }}>
                    <strong>Примерное время:</strong> {questionnaire.max_time_minutes} минут
                  </p>
                )}
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div 
            className={`content-container centered ${contentAnimated ? 'animated' : ''}`} 
            style={{ top: contentTop + 'px' }}
          >
            <h2 className="text-h2 text-center">Введите ваши ФИО</h2>
            {errorMessage && (
              <div style={{
                background: 'rgba(255, 0, 0, 0.2)',
                border: '1px solid rgba(255, 0, 0, 0.5)',
                borderRadius: '8px',
                padding: '10px',
                marginBottom: '20px',
                color: 'white',
                textAlign: 'center'
              }}>
                {errorMessage}
              </div>
            )}
            
            <div className="form-container">
              <label className="text-body text-center" style={{ fontSize: isSmallScreen ? '18px' : '20px', marginBottom: '5px', display: 'block' }}>
                Фамилия
              </label>
              {renderAutosuggest(
                surname, setSurname, 
                surnameSuggestions, setSurnameSuggestions, 
                surnameList, 'Введите фамилию'
              )}
  
              <label className="text-body text-center" style={{ fontSize: isSmallScreen ? '18px' : '20px', marginBottom: '5px', display: 'block' }}>
                Имя
              </label>
              {renderAutosuggest(
                firstName, setFirstName, 
                firstNameSuggestions, setFirstNameSuggestions, 
                firstNameList, 'Введите имя'
              )}
  
              <label className="text-body text-center" style={{ fontSize: isSmallScreen ? '18px' : '20px', marginBottom: '5px', display: 'block' }}>
                Отчество
              </label>
              {renderAutosuggest(
                patronymic, setPatronymic, 
                patronymicSuggestions, setPatronymicSuggestions, 
                patronymicList, 'Введите отчество'
              )}
            </div>
          </div>
        );

      case 3:
        if (!questions.length || !shuffledQuestions.length) {
          return (
            <div 
              className={`content-container centered ${contentAnimated ? 'animated' : ''}`} 
              style={{ top: contentTop + 'px' }}
            >
              <div style={{
                background: 'rgba(255, 0, 0, 0.2)',
                border: '1px solid rgba(255, 0, 0, 0.5)',
                borderRadius: '8px',
                padding: '20px',
                color: 'white',
                textAlign: 'center'
              }}>
                Не удалось загрузить вопросы опросника
              </div>
            </div>
          );
        }

        const currentQuestionData = shuffledQuestions[currentQuestion];
        return (
          <div 
            className={`content-container centered ${contentAnimated ? 'animated' : ''} ${fadeTransition ? '' : 'visible'}`}
            style={{ 
              top: contentTop + 'px',
              opacity: fadeTransition ? 0 : 1,
              transition: 'opacity 0.3s ease'
            }}
          >
            {/* Прогресс индикатор */}
            <div style={{
              width: '100%',
              maxWidth: isMobileWidth ? '80%' : '500px',
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '20px'
            }}>
              <div style={{
                display: 'flex',
                gap: isSmallScreen ? '6px' : '8px',
              }}>
                {questions.map((_, idx) => (
                  <div 
                    key={idx} 
                    style={{
                      width: isMobileWidth ? '6px' : '8px',
                      height: isMobileWidth ? '6px' : '8px',
                      borderRadius: '50%',
                      background: idx < currentQuestion ? 'rgba(180, 0, 55, 0.9)' : 
                                 idx === currentQuestion ? 'white' : 
                                 'rgba(255, 255, 255, 0.3)',
                      transition: 'all 0.3s ease'
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="text-body text-center" style={{
              fontSize: isMobileWidth ? '16px' : '18px',
              marginBottom: '20px',
              opacity: 0.8
            }}>
              Вопрос: {currentQuestion + 1} из {questions.length}
            </div>

            <h2 className="text-h2 text-center" style={{ fontSize: isMobileWidth ? '20px' : '24px', marginBottom: '30px' }}>
              {currentQuestionData.question_text || currentQuestionData.text || 'Вопрос'}
            </h2>

            {errorMessage && (
              <div style={{
                background: 'rgba(255, 0, 0, 0.2)',
                border: '1px solid rgba(255, 0, 0, 0.5)',
                borderRadius: '8px',
                padding: '10px',
                marginBottom: '20px',
                color: 'white',
                textAlign: 'center'
              }}>
                {errorMessage}
              </div>
            )}

            <div style={{ width: '100%', maxWidth: isMobileWidth ? '80%' : '500px' }}>
              {currentQuestionData.shuffledOptions.map((option, idx) => (
                <button
                  key={idx}
                  className={`btn-universal ${selectedAnswer === option.text ? 'btn-primary' : ''}`}
                  style={{
                    width: '100%',
                    background: selectedAnswer === option.text 
                      ? 'linear-gradient(135deg, rgba(180, 0, 55, 0.9) 0%, rgba(0, 40, 130, 0.9) 100%)'
                      : 'rgba(255, 255, 255, 0.15)',
                    backdropFilter: 'blur(10px)',
                    color: 'white',
                    border: selectedAnswer === option.text ? '2px solid rgba(255, 255, 255, 0.8)' : '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '12px',
                    padding: isSmallScreen ? '14px 20px' : '16px 24px',
                    fontSize: isSmallScreen ? '16px' : '18px',
                    fontWeight: selectedAnswer === option.text ? '600' : '400',
                    marginBottom: '12px',
                    transition: 'all 0.3s ease',
                    boxShadow: selectedAnswer === option.text ? '0 6px 20px rgba(0, 0, 0, 0.3)' : '0 4px 15px rgba(0, 0, 0, 0.2)',
                    transform: selectedAnswer === option.text ? 'scale(1.02)' : 'scale(1)',
                    textAlign: 'left'
                  }}
                  onClick={() => setSelectedAnswer(option.text)}
                >
                  {option.text}
                </button>
              ))}
            </div>

            {currentQuestionData.description && (
              <div className="text-small text-center" style={{
                fontSize: isSmallScreen ? '12px' : '14px',
                marginTop: '20px',
                opacity: 0.7
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

  // ===== ОСНОВНОЙ РЕНДЕР =====
  return (
    <div className="main-container" style={{ height: windowHeight + 'px' }}>
      {/* CSS анимации */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>

      {/* Логотип */}
      <div 
        className="logo-wrapper"
        ref={logoRef}
        style={{
          width: `${logoSize}px`,
          height: `${logoSize}px`,
          top: logoAnimated && !isExiting ? `${logoTop}px` : '-200px',
          opacity: logoAnimated && !isExiting ? 1 : 0
        }}
      >
        <img
          src={logoImage}
          alt="Логотип РГС Жизнь"
          className="logo-image"
          style={{
            width: `${logoImageSize}px`,
            height: `${logoImageSize}px`
          }}
        />
      </div>

      {/* Кнопка "Назад" */}
      {(currentStep > 1 || (currentStep === 3 && currentQuestion > 0)) && !isFinished && !isLoading && !isProcessing && (
        <button 
          ref={backRef}
          className={`back-btn ${contentAnimated ? 'animate-home' : ''} ${isExiting ? 'animate-home-exit' : ''}`}
          onClick={handleBack}
        >
          <svg viewBox="0 0 24 24">
            <path d="M15 18l-6-6 6-6" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}

      {/* Кнопка "Далее" */}
      {(currentStep <= 3 && !isProcessing && !isFinished && !isLoading) && (
        <button 
          className={`next-btn ${contentAnimated ? 'animate-next' : ''} ${isExiting ? 'animate-next-exit' : ''} ${!canGoNext() ? 'disabled' : ''}`}
          onClick={canGoNext() ? handleNext : undefined}
          disabled={!canGoNext()}
        >
          <div className={
            canGoNext() 
              ? (currentStep === 3 && currentQuestion === questions.length - 1 ? 'shaker pop-btn' : 'shaker shake-btn')
              : 'shaker'
          }>
            {currentStep === 3 && currentQuestion === questions.length - 1 ? (
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M9 18l6-6-6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
        </button>
      )}

      {/* Кнопка домой для финального экрана */}
      {isFinished && result && (
        <button 
          ref={homeRef}
          className={`home-button ${contentAnimated ? 'animate-in' : ''} ${isExiting ? 'animate-out' : ''}`}
          onClick={goHome}
        >
          <svg viewBox="0 0 24 24" fill="white">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </button>
      )}

      {/* Основной контент */}
      {renderStepContent()}
    </div>
  );
}