// AssessmentPage.js - Упрощенная версия с загрузкой вопросов из БД

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Autosuggest from 'react-autosuggest';
import { useNavigate } from 'react-router-dom';

// Стили
import './Styles/logo.css';
import './Styles/Buttons.css';
import './Styles/background.css';
import './Styles/BackButton.css';
import './Styles/NextButton.css';
import './Styles/OptionButton.css';
import './FeedbackPage.css';
import './AssessmentPage.css';

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

  // ===== Загрузка опросника из БД =====
  useEffect(() => {
    loadQuestionnaire();
    startTimeRef.current = Date.now();
    setTimeout(() => logoRef.current?.classList.add('animate-logo'), 100);
  }, []);

  const loadQuestionnaire = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/questionnaire/${MAIN_QUESTIONNAIRE_ID}?include_questions=true`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      setQuestionnaire(data);
      setQuestions(data.questions || []);
      
      console.log(`✅ Loaded questionnaire: ${data.title} with ${data.questions?.length || 0} questions`);
      
    } catch (error) {
      console.error('❌ Error loading questionnaire:', error);
      setErrorMessage('Не удалось загрузить опросник. Попробуйте перезагрузить страницу.');
    } finally {
      setIsLoading(false);
    }
  };

  // ===== Функции для автосаджестов =====
  const getSuggestions = useCallback((value, list) => {
    const trimmed = value.trim().toLowerCase();
    if (trimmed.length < 2) return [];
    return list.filter(s => s.toLowerCase().startsWith(trimmed)).slice(0, 10);
  }, []);

  const renderAutosuggest = useCallback((value, setValue, suggestions, setSuggestions, list, placeholder) => (
    <Autosuggest
      suggestions={suggestions}
      onSuggestionsFetchRequested={({ value }) => setSuggestions(getSuggestions(value, list))}
      onSuggestionsClearRequested={() => setSuggestions([])}
      getSuggestionValue={s => s}
      renderSuggestion={s => <div>{s}</div>}
      inputProps={{
        placeholder,
        value,
        onChange: (e, { newValue }) => setValue(newValue.charAt(0).toUpperCase() + newValue.slice(1).toLowerCase()),
        autoComplete: 'off'
      }}
    />
  ), [getSuggestions]);

  // ===== Обработчики =====
  const handleNext = useCallback(() => {
    if (currentStep === 1) {
      // Переход от инструкции к форме ФИО
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Переход от формы ФИО к вопросам
      if (!surname.trim() || !firstName.trim() || !patronymic.trim()) {
        setErrorMessage('Пожалуйста, заполните все поля.');
        return;
      }
      setErrorMessage('');
      setCurrentStep(3);
    } else if (currentStep === 3) {
      // Обработка ответа на вопрос
      if (!selectedAnswer) {
        setErrorMessage('Выберите один из вариантов');
        return;
      }
      setErrorMessage('');
      
      const updatedAnswers = [...userAnswers, selectedAnswer];
      setUserAnswers(updatedAnswers);
      
      setFadeTransition(true);
      setTimeout(() => {
        if (currentQuestion < questions.length - 1) {
          setCurrentQuestion(prev => prev + 1);
          setSelectedAnswer('');
        } else {
          handleFinish(updatedAnswers);
        }
        setFadeTransition(false);
      }, 400);
    }
  }, [currentStep, surname, firstName, patronymic, selectedAnswer, userAnswers, currentQuestion, questions.length]);

  const handleBack = useCallback(() => {
    if (currentStep === 3 && currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
      setUserAnswers(prev => prev.slice(0, -1));
      setSelectedAnswer('');
      setErrorMessage('');
    } else if (currentStep === 3 && currentQuestion === 0) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(1);
    }
  }, [currentStep, currentQuestion]);

  const handleFinish = async (finalAnswers) => {
    setIsProcessing(true);
    
    try {
      const completionTime = Math.round((Date.now() - startTimeRef.current) / 60000); // в минутах
      
      const dataToSave = {
        surname: surname.trim(),
        firstName: firstName.trim(),
        patronymic: patronymic.trim(),
        answers: finalAnswers,
        completionTimeMinutes: completionTime,
        sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        questionnaireId: questionnaire?.id || MAIN_QUESTIONNAIRE_ID
      };

      const response = await fetch('/api/assessment/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setResult(result.candidate);
      setIsFinished(true);
      setCurrentStep(4);
      
    } catch (error) {
      console.error('Ошибка при сохранении данных:', error);
      setErrorMessage('Произошла ошибка при сохранении данных. Попробуйте еще раз.');
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
      const typeNames = {
        'innovator': 'Новатор',
        'optimizer': 'Оптимизатор',
        'executor': 'Исполнитель'
      };

      return (
        <div className="step-container result-appear">
          <h2 className="result-title">Результаты оценки</h2>
          <div className="result-card">
            <h3>{firstName}, ваш тип личности:</h3>
            
            <div className="dominant-type-card">
              <div className="type-badge">{typeNames[result.dominant_type]}</div>
              <div className="type-title">{typeNames[result.dominant_type]}</div>
              <div className="type-percentage">{result.dominant_percentage.toFixed(1)}%</div>
            </div>
            
            <div className="scores-summary">
              <div className={`score-card ${result.dominant_type === 'innovator' ? 'dominant' : ''}`}>
                <span className="score-label">Новатор</span>
                <span className="score-number">{result.scores.innovator}</span>
                <span className="score-total">из {questions.length}</span>
              </div>
              <div className={`score-card ${result.dominant_type === 'optimizer' ? 'dominant' : ''}`}>
                <span className="score-label">Оптимизатор</span>
                <span className="score-number">{result.scores.optimizer}</span>
                <span className="score-total">из {questions.length}</span>
              </div>
              <div className={`score-card ${result.dominant_type === 'executor' ? 'dominant' : ''}`}>
                <span className="score-label">Исполнитель</span>
                <span className="score-number">{result.scores.executor}</span>
                <span className="score-total">из {questions.length}</span>
              </div>
            </div>

            {result.type_description && (
              <div className="type-description">
                <p className="type-description-text">{result.type_description.description}</p>
                {result.type_description.traits && (
                  <div className="traits-list">
                    <h4 className="traits-title">Ключевые качества</h4>
                    <div className="traits-grid">
                      {result.type_description.traits.map((trait, idx) => (
                        <div key={idx} className="trait-item">
                          <div className="trait-icon">✓</div>
                          <span className="trait-text">{trait}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="result-actions">
            <button className="action-button primary" onClick={goHome}>
              Вернуться в меню
            </button>
          </div>
        </div>
      );
    }

    switch (currentStep) {
      case 1:
        return (
          <div className="step-container fade-in-up">
            <h2>Инструкция</h2>
            <p className="instruction-text">
              {questionnaire?.description || 
                'Прочитайте вопросы и выберите вариант ответа, который кажется вам наиболее близким. Здесь нет «правильных» или «неправильных» ответов — важно лишь понять ваш естественный стиль работы и взаимодействия.'}
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
        if (!questions.length) {
          return (
            <div className="step-container">
              <div className="error-message">
                Не удалось загрузить вопросы опросника
              </div>
            </div>
          );
        }

        const currentQuestionData = questions[currentQuestion];
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
              <span className="question-counter">
                {currentQuestion + 1} / {questions.length}
              </span>
            </div>
            
            <h2 className="question-text">{currentQuestionData.text}</h2>
            
            {errorMessage && <div className="error-message">{errorMessage}</div>}
            
            <div className="answers-grid">
              {currentQuestionData.options?.map((option, index) => (
                <button
                  key={option.id || index}
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
      {(currentStep > 1 && !isFinished && !isLoading) && (
        <button className="back-btn" onClick={handleBack}>
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}

      {/* Кнопка "Домой" (только на экране результатов) */}
      {isFinished && (
        <button className="back-btn" onClick={goHome}>
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1V11z" stroke="white" strokeWidth="2" fill="none"/>
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










