// AssessmentPage.js - Обновленная версия с простым сообщением благодарности

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Autosuggest from 'react-autosuggest';
import { useNavigate } from 'react-router-dom';
import { apiCall } from './config';

// Стили
import './Styles/logo.css';
import './Styles/Buttons.css';
import './Styles/background.css';
import './Styles/BackButton.css';
import './Styles/NextButton.css';
import './Styles/OptionButton.css';
import './FeedbackPage.css';
import './AssessmentPage.css';
import './Styles/mobile-responsive.css';

// Ресурсы
import backgroundImage from './components/background.png';
import logoImage from './components/logo.png';
import piImage from './components/pi.png';

// JSON-файлы с ФИО
import surnames from './components/autosuggest/surname.json';
import firstnames from './components/autosuggest/firstname.json';
import patronymics from './components/autosuggest/lastname.json';

export default function AssessmentPage() {
  const navigate = useNavigate();
  const logoRef = useRef(null);
  const startTimeRef = useRef(null);

  // ===== Состояния =====
  const [currentStep, setCurrentStep] = useState(1); // 1: инструкция, 2: ФИО, 3: вопросы, 4: результат
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

  // Данные опросника (загружаются из БД)
  const [questionnaire, setQuestionnaire] = useState(null);
  const [questions, setQuestions] = useState([]);

  // Статичный порядок ответов для каждого вопроса (исправление пункта 5)
  const [shuffledQuestions, setShuffledQuestions] = useState([]);

  // ID опросника по умолчанию (основной Assessment опросник)
  const MAIN_QUESTIONNAIRE_ID = 1;

  // Обработанные данные для автосаджестов
  const surnameList = surnames.map(item => item.male || item.female);
  const firstNameList = firstnames.map(item =>
    typeof item === 'string' ? item : (item.firstName || item.name)
  );
  const patronymicList = patronymics.map(item =>
    typeof item === 'string' ? item : (item.patronymic || item.name)
  );

  // Функция для рандомизации порядка ответов (исправление пункта 5)
  const shuffleOptions = (options) => {
    const shuffled = [...options];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // ===== Загрузка опросника при монтировании компонента =====
  useEffect(() => {
    const loadQuestionnaire = async () => {
      try {
        setIsLoading(true);
        setErrorMessage('');
    
        console.log('🔄 Loading questionnaire...', MAIN_QUESTIONNAIRE_ID);
    
        const data = await apiCall(`/api/questionnaire/${MAIN_QUESTIONNAIRE_ID}?include_questions=true`);
    
        console.log('📋 Received data:', data);
    
        // ИСПРАВЛЕНИЕ: правильное извлечение данных
        setQuestionnaire(data); // data уже содержит questionnaire
        const loadedQuestions = data.questions || [];
    
        console.log('❓ Loaded questions:', loadedQuestions.length);
    
        if (loadedQuestions.length === 0) {
          throw new Error('No questions found in questionnaire');
        }
    
        setQuestions(loadedQuestions);
    
        // Предварительно перемешиваем ответы для каждого вопроса только один раз
        const questionsWithShuffledOptions = loadedQuestions.map(question => ({
          ...question,
          shuffledOptions: shuffleOptions(question.options || []) /// ИСПРАВЛЕНО: перемешиваем варианты ответов!
        }));
        setShuffledQuestions(questionsWithShuffledOptions);
    
        console.log('✅ Questionnaire loaded successfully');
        console.log('📊 Questions with options:', questionsWithShuffledOptions);
    
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
      console.log('🎲 Reshuffled for new user:', freshShuffledQuestions);
  
      setCurrentStep(3);
    } else if (currentStep === 3) {
      // Обработка ответа на вопрос
      if (!selectedAnswer) {
        setErrorMessage('Выберите один из вариантов ответа');
        return;
      }

      setErrorMessage('');
      
      // Сохраняем ответ
      const existingAnswerIndex = userAnswers.findIndex(ans => ans.question_id === questions[currentQuestion].id);

      let updatedAnswers;
      if (existingAnswerIndex >= 0) {
        // Заменяем существующий ответ
        updatedAnswers = [...userAnswers];
        updatedAnswers[existingAnswerIndex] = {
          question_id: questions[currentQuestion].id,
          answer_text: selectedAnswer,
          answer_index: shuffledQuestions[currentQuestion].shuffledOptions.findIndex(opt => opt.text === selectedAnswer)
        };
      } else {
        // Добавляем новый ответ
        updatedAnswers = [...userAnswers, {
          question_id: questions[currentQuestion].id,
          answer_text: selectedAnswer,
          answer_index: shuffledQuestions[currentQuestion].shuffledOptions.findIndex(opt => opt.text === selectedAnswer)
        }];
      }
      setUserAnswers(updatedAnswers);

      // Проверяем, последний ли это вопрос
      if (currentQuestion === questions.length - 1) {
        // Завершаем тестирование
        finishAssessment(updatedAnswers);
      } else {
        // Переходим к следующему вопросу
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
          // Восстанавливаем предыдущий ответ
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

      // Ограничиваем 25 ответами и убираем дубли
      const uniqueAnswers = answers.slice(0, 25);
      const answersTextArray = uniqueAnswers.map(answer => answer.answer_text);

      // ПРОВЕРКА:
      console.log('🔍 Final check before sending:');
      console.log('  - Unique answers count:', uniqueAnswers.length);
      console.log('  - Should be exactly 25:', uniqueAnswers.length === 25);
    
      if (uniqueAnswers.length !== 25) {
        throw new Error(`Expected 25 answers, got ${uniqueAnswers.length}`);
      }

      const sessionData = {
        questionnaireId: 1,
        surname: surname.trim(),                 
        firstName: firstName.trim(),             
        patronymic: patronymic.trim(),           
        answers: answersTextArray,               
        completionTime: Math.max(1, Math.round((Date.now() - startTimeRef.current) / 60000)) // минимум 1 минута
      };

      console.log('📤 Sending session data:', sessionData);
      console.log('📝 Answers array:', answersTextArray);
      console.log('📊 Session data details:');
      console.log('  - surname:', sessionData.surname);
      console.log('  - firstName:', sessionData.firstName); 
      console.log('  - patronymic:', sessionData.patronymic);
      console.log('  - answers length:', sessionData.answers.length);
      console.log('  - first few answers:', sessionData.answers.slice(0, 3));

      console.log('📤 Sending session data:', sessionData);
      const response = await apiCall('/api/assessment/save', {  
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData)
      });

      console.log('✅ Assessment completed:', response);
      
      // Сохраняем результат для показа простого сообщения
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
          <div className="completion-message">
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
          <div className="step-container fade-in-up">
            <h2>Психологическая оценка</h2>
            <p className="instruction-text large-text">
              Пройдите короткий тест для определения вашего типа личности.
              {questionnaire?.description && ` ${questionnaire.description}`}
            </p>
            <p className="instruction-subtext large-text">
              {questionnaire?.instructions || 
               'Здесь нет «правильных» или «неправильных» ответов — важно лишь понять ваш естественный стиль работы и взаимодействия.'}
            </p>
            {questionnaire && (
              <div className="questionnaire-info">
                <p><strong>Опросник:</strong> {questionnaire.title}</p>
                <p><strong>Количество вопросов:</strong> {questionnaire.questions_count}</p>
                {questionnaire.max_time_minutes && (
                  <p><strong>Примерное время:</strong> {questionnaire.max_time_minutes} минут</p>
                )}
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="step-container fade-in-up">
            <h2>Введите ваши ФИО</h2>
            {errorMessage && <div className="error-message">{errorMessage}</div>}
            
            <div className="form-fields">
              <div className="autosuggest-container">
                <label>Фамилия</label>
                {renderAutosuggest(
                  surname, setSurname, 
                  surnameSuggestions, setSurnameSuggestions, 
                  surnameList, 'Введите фамилию'
                )}
              </div>
              
              <div className="autosuggest-container">
                <label>Имя</label>
                {renderAutosuggest(
                  firstName, setFirstName, 
                  firstNameSuggestions, setFirstNameSuggestions, 
                  firstNameList, 'Введите имя'
                )}
              </div>
              
              <div className="autosuggest-container">
                <label>Отчество</label>
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
          <div className={`step-container ${fadeTransition ? 'fade-out' : 'fade-in'}`}>
            <div className="question-header">
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

            <div className="question-content">
              <h2 className="question-title">{currentQuestionData.question_text || currentQuestionData.text || 'Вопрос'}</h2>
              {errorMessage && <div className="error-message">{errorMessage}</div>}
            </div>

            <div className="options-container">
              {currentQuestionData.shuffledOptions.map((option, idx) => (
                <button
                  key={idx}
                  className={`option-button ${selectedAnswer === option.text ? 'selected' : ''}`}
                  onClick={() => setSelectedAnswer(option.text)}
                >
                  {option.text}
                </button>
              ))}
            </div>

            {currentQuestionData.description && (
              <div className="question-description">
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
    <div className="mainmenu-container feedback-container" style={{ backgroundImage: `url(${backgroundImage})` }}>
      {/* Фоновые элементы */}
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

      {/* Кнопка "Назад" */}
      {(currentStep > 1 || (currentStep === 3 && currentQuestion > 0)) && !isFinished && !isLoading && (
        <button className="back-btn" onClick={handleBack}>
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}

      {/* Кнопка "Далее" */}
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

      {/* Основной контент */}
      <div className="content-wrapper">
        {renderStepContent()}
      </div>
    </div>
  );
}