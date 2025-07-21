// AssessmentPage.js - С УНИФИЦИРОВАННЫМИ МОДУЛЬНЫМИ СТИЛЯМИ КАК В PollsPage
// ✅ Точно следует структуре PollsPage.js
// ✅ Использует те же CSS классы и подходы

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Autosuggest from 'react-autosuggest';
import { useNavigate } from 'react-router-dom';
import { apiCall } from './config';
import logoImage from './components/logo.png';


// Подключаем модульные CSS файлы КАК В PollsPage
import './Styles/containers.css';    // Универсальные контейнеры
import './Styles/buttons.css';       // Универсальные кнопки
import './Styles/logo.css';          // Логотип
import './Styles/NextButton.css';    // Кнопка "Далее"
import './Styles/BackButton.css';    // Кнопка "Назад"
import './Styles/HomeButton.css';    // Кнопка "Домой"
import './Styles/ProgressIndicator.css';
import './Styles/Autosuggest.css';

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

  // ===== СОСТОЯНИЯ КАК В PollsPage =====
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

  // ===== АНИМАЦИЯ ВХОДА КАК В PollsPage =====
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

  // ===== УДАЛЕНИЕ СЕРЫХ ЛИНИЙ =====
  useEffect(() => {
    if (currentStep === 2) {
      const removeLines = () => {
        // Удаляем все HR элементы
        document.querySelectorAll('hr').forEach(hr => hr.remove());
        
        // Добавляем агрессивные стили
        const style = document.createElement('style');
        style.setAttribute('data-remove-lines', 'true');
        style.innerHTML = `
          /* УДАЛЯЕМ ВСЕ ЛИНИИ В ФОРМЕ */
          .form-container hr,
          .form-container .divider,
          .form-container .separator,
          .form-container > div:empty,
          .form-container > div[style*="border"],
          .form-container > div[style*="height: 1px"],
          .form-container > div[style*="height:1px"] {
            display: none !important;
            visibility: hidden !important;
            height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          /* Убираем псевдоэлементы которые могут быть линиями */
          .form-container > *::before,
          .form-container > *::after,
          .autosuggest-wrapper::before,
          .autosuggest-wrapper::after,
          .autosuggest-container::before,
          .autosuggest-container::after {
            display: none !important;
            content: none !important;
          }
          
          /* Убираем границы у всех элементов кроме input */
          .form-container * {
            border-top: none !important;
            border-bottom: none !important;
          }
          
          /* Восстанавливаем границы только для input */
          .autosuggest-input,
          .react-autosuggest__input {
            border: 1px solid rgba(255, 255, 255, 0.25) !important;
          }
          
          /* Убираем отступы между wrapper'ами которые могут создавать линии */
          .autosuggest-wrapper + * {
            margin-top: 0 !important;
          }
          
          .autosuggest-wrapper {
            margin-bottom: 24px !important;
          }
          
          .autosuggest-wrapper:last-child {
            margin-bottom: 0 !important;
          }
        `;
        document.head.appendChild(style);
      };
      
      // Запускаем сразу
      removeLines();
      
      // И еще раз через небольшую задержку
      const timeout = setTimeout(removeLines, 100);
      
      // Cleanup
      return () => {
        clearTimeout(timeout);
        document.querySelectorAll('style[data-remove-lines]').forEach(s => s.remove());
      };
    }
  }, [currentStep]);

  // ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
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

  // Автосаджест функции
  const getSuggestions = (value, list) => {
    const inputValue = value.trim().toLowerCase();
    const inputLength = inputValue.length;
    return inputLength === 0 ? [] : list.filter(item => 
      item.toLowerCase().slice(0, inputLength) === inputValue
    );
  };

  // Обновленная функция renderAutosuggest с улучшенными стилями
  const renderAutosuggest = (value, setValue, suggestions, setSuggestions, list, placeholder) => (
    <div className="autosuggest-container">
      <Autosuggest
        suggestions={suggestions}
        onSuggestionsFetchRequested={({ value }) => setSuggestions(getSuggestions(value, list))}
        onSuggestionsClearRequested={() => setSuggestions([])}
        getSuggestionValue={suggestion => suggestion}
        renderSuggestion={suggestion => (
          <div className="autosuggest-suggestion">
            {suggestion}
          </div>
        )}
        inputProps={{
          className: 'autosuggest-input',
          placeholder,
          value,
          onChange: (_, { newValue }) => setValue(newValue)
        }}
        theme={{
          container: 'autosuggest-container',
          suggestionsContainer: 'autosuggest-suggestions-container',
          suggestionsList: 'autosuggest-suggestions-list',
          suggestion: 'autosuggest-suggestion',
          suggestionHighlighted: 'autosuggest-suggestion--highlighted',
          input: 'autosuggest-input'
        }}
      />
    </div>
  );

  // ===== ОБРАБОТЧИКИ КАК В PollsPage =====
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

  const goHome = () => {
    if (isExiting) return;
    
    setIsExiting(true);
    
    if (logoRef.current) {
      logoRef.current.classList.add('animate-logo-exit');
    }
    
    setTimeout(() => navigate('/'), 800);
  };

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

      // ✅ ПРИНУДИТЕЛЬНО УСТАНАВЛИВАЕМ СОСТОЯНИЯ
      console.log('✅ Assessment saved successfully, setting finished state');
      setResult({ success: true });
      setIsFinished(true);
      setIsProcessing(false); // ← ДОБАВЛЕНО: убираем processing сразу после успеха
    
    } catch (error) {
      console.error('❌ Error submitting assessment:', error);
      setErrorMessage('Ошибка при отправке результатов. Попробуйте еще раз.');
      setIsProcessing(false);
    }
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

  // ===== КЛАССЫ ДЛЯ ЭЛЕМЕНТОВ КАК В PollsPage =====
  const getContainerClasses = () => [
    'main-container',
    isExiting ? 'exiting' : ''
  ].filter(Boolean).join(' ');

  const getLogoClasses = () => [
    'logo-wrapper',
    logoAnimated ? 'animated' : '',
    isExiting ? 'exiting' : ''
  ].filter(Boolean).join(' ');

  const getHomeButtonClasses = () => [
    'home-button',
    contentAnimated ? 'animate-in' : '',
    isExiting ? 'animate-out' : ''
  ].filter(Boolean).join(' ');

  // ===== РЕНДЕР КОНТЕНТА =====
  const renderStepContent = () => {
    if (isLoading) {
      return (
        <div className="welcome-text-container">
          <div className="assessment-spinner" />
          <h2 className="text-h2 text-center">Загрузка опросника...</h2>
          <p className="text-body text-center">Подготавливаем вопросы для оценки</p>
        </div>
      );
    }

    if (isProcessing) {
      return (
        <div className="welcome-text-container">
          <div className="assessment-spinner" />
          <h2 className="text-h2 text-center">Обработка результатов...</h2>
          <p className="text-body text-center">Анализируем ваши ответы</p>
        </div>
      );
    }

    if (isFinished) {
      return (
        <div className={`welcome-text-container ${contentAnimated ? 'animated' : ''}`}>
          <h2 className="text-thank-you-title">Спасибо за прохождение!</h2>
          <p className="text-thank-you-body">
            {firstName}, благодарим за прохождение опроса.<br/>
            Свяжемся с вами в ближайшее время.<br/>
            Отличного дня!
          </p>
        </div>
      );
    }

    // Рендер контента по шагам
    switch (currentStep) {
      case 1:
        return (
          <div className={`welcome-text-container ${contentAnimated ? 'animated' : ''}`}>
            <h2 className="text-h2 text-center">Психологическая оценка</h2>
            <p className="text-body text-center">
              Пройдите короткий тест для определения ваших корпоративных ценностей.
              {questionnaire?.description && ` ${questionnaire.description}`}
            </p>
            <p className="text-small text-center" style={{ opacity: 0.9, marginBottom: '30px' }}>
              {questionnaire?.instructions || 
               'Здесь нет «правильных» или «неправильных» ответов — важно лишь понять ваш естественный стиль работы и взаимодействия.'}
            </p>
            {questionnaire && (
              <div className="card-container">
                <p className="text-body text-center">
                  <strong>Опросник:</strong> {questionnaire.title}
                </p>
                <p className="text-body text-center">
                  <strong>Количество вопросов:</strong> {questionnaire.questions_count}
                </p>
                {questionnaire.max_time_minutes && (
                  <p className="text-body text-center">
                    <strong>Примерное время:</strong> {questionnaire.max_time_minutes} минут
                  </p>
                )}
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className={`welcome-text-container ${contentAnimated ? 'animated' : ''}`}>
            <h2 className="text-h2 text-center">Введите ваши ФИО</h2>
            {errorMessage && (
              <div className="assessment-error">
                {errorMessage}
              </div>
            )}
      
            <div className="form-container">
              <div className="autosuggest-wrapper">
                <label className="form-label">
                  Фамилия
                </label>
                {renderAutosuggest(
                  surname, setSurname, 
                  surnameSuggestions, setSurnameSuggestions, 
                  surnameList, 'Введите фамилию'
                )}
              </div>

              <div className="autosuggest-wrapper">
                <label className="form-label">
                  Имя
                </label>
                {renderAutosuggest(
                  firstName, setFirstName, 
                  firstNameSuggestions, setFirstNameSuggestions, 
                  firstNameList, 'Введите имя'
                )}
              </div>

              <div className="autosuggest-wrapper">
                <label className="form-label">
                  Отчество
                </label>
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
            <div className={`welcome-text-container ${contentAnimated ? 'animated' : ''}`}>
              <div className="assessment-error">
                Не удалось загрузить вопросы опросника
              </div>
            </div>
          );
        }

        const currentQuestionData = shuffledQuestions[currentQuestion];
        return (
          <div className={`welcome-text-container ${contentAnimated && !fadeTransition ? 'animated' : ''}`}>
            {/* Прогресс индикатор */}
            <div className="progress-indicator-wrapper">
              <div className="progress-indicator">
                {questions.map((_, idx) => (
                  <div 
                    key={idx} 
                    className={`progress-dot ${
                      idx < currentQuestion ? 'completed' : 
                      idx === currentQuestion ? 'current' : 
                      'pending'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="text-small text-center" style={{ marginBottom: '0px', opacity: 0.8 }}>
              Вопрос: {currentQuestion + 1} из {questions.length}
            </div>

            <h2 className="text-h2 text-center" style={{ marginBottom: '10px' }}>
              {currentQuestionData.question_text || currentQuestionData.text || 'Вопрос'}
            </h2>

            {errorMessage && (
              <div className="assessment-error">
                {errorMessage}
              </div>
            )}

            <div style={{ width: '100%', maxWidth: '500px' }}>
              {currentQuestionData.shuffledOptions.map((option, idx) => (
                <button
                  key={idx}
                  className={`answer-option ${selectedAnswer === option.text ? 'selected' : ''}`}
                  onClick={() => setSelectedAnswer(option.text)}
                >
                  {option.text}
                </button>
              ))}
            </div>

            {currentQuestionData.description && (
              <div className="text-small text-center" style={{ marginTop: '20px', opacity: 0.7 }}>
                {currentQuestionData.description}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // ===== ОСНОВНОЙ РЕНДЕР КАК В PollsPage =====
  return (
    <div className={getContainerClasses()}>
      {/* CSS анимации */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          .assessment-spinner {
            width: 60px;
            height: 60px;
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-top-color: white;
            border-radius: 50%;
            margin: 0 auto 30px;
            animation: spin 1s linear infinite;
          }
          
          .assessment-error {
            background: rgba(255, 0, 0, 0.2);
            border: 1px solid rgba(255, 0, 0, 0.5);
            border-radius: 8px;
            padding: 10px;
            margin-bottom: 20px;
            color: white;
            text-align: center;
            font-family: "Segoe UI", sans-serif;
          }
        `}
      </style>
      
      {/* НОВЫЙ БЛОК СТИЛЕЙ ДЛЯ УДАЛЕНИЯ ПОЛОСОК */}
      <style>
        {`
          /* Глобальное удаление всех горизонтальных линий */
          hr {
            display: none !important;
          }
          
          /* Удаляем границы между элементами react-autosuggest */
          .react-autosuggest__container,
          .react-autosuggest__input,
          .react-autosuggest__suggestions-container {
            border-top: none !important;
            border-bottom: none !important;
          }
          
          /* Убираем любые псевдоэлементы, создающие линии */
          .form-container *::before,
          .form-container *::after {
            height: auto !important;
            border: none !important;
            background: transparent !important;
          }
          
          /* Исключение для placeholder */
          .autosuggest-input::placeholder {
            background: transparent !important;
          }
          
          /* Убираем margin между автосаджестами */
          .autosuggest-container {
            margin-bottom: 0 !important;
          }
          
          /* Настройка размеров шрифтов через переменные */
          :root {
            --label-font-size-desktop: 20px;
            --label-font-size-tablet: 18px;
            --label-font-size-mobile: 16px;
            
            --input-font-size-desktop: 22px;
            --input-font-size-tablet: 20px;
            --input-font-size-mobile: 18px;
            
            --placeholder-font-size-desktop: 20px;
            --placeholder-font-size-tablet: 18px;
            --placeholder-font-size-mobile: 16px;
          }
        `}
      </style>

      {/* ===== ЛОГОТИП КАК В PollsPage ===== */}
      <div 
        ref={logoRef} 
        className={getLogoClasses()}
      >
        <img
          src={logoImage}
          alt="Логотип РГС Жизнь"
          className="logo-image"
        />
      </div>

      {/* ===== КНОПКА "НАЗАД" ===== */}
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

      {/* ===== КНОПКА "ДАЛЕЕ" ===== */}
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

      {/* ===== ОСНОВНОЙ КОНТЕНТ ===== */}
      {renderStepContent()}
    </div>
  );
}