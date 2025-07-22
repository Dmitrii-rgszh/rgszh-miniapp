// AssessmentPage.js - ИСПРАВЛЕНА ПРОБЛЕМА С ПУСТЫМ ЭКРАНОМ
// ✅ Добавлен класс animated для состояний загрузки
// ✅ Обеспечена видимость логотипа во время загрузки
// ✅ Исправлены состояния анимации

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Autosuggest from 'react-autosuggest';
import { useNavigate } from 'react-router-dom';
import { apiCall } from './config';
import logoImage from './components/logo.png';

// Подключаем модульные CSS файлы
import './Styles/containers.css';
import './Styles/buttons.css';
import './Styles/logo.css';
import './Styles/NextButton.css';
import './Styles/BackButton.css';
import './Styles/HomeButton.css';
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

  // ===== СОСТОЯНИЯ =====
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

  // ===== СБРОС СОСТОЯНИЯ ПРИ МОНТИРОВАНИИ =====
  useEffect(() => {
    setIsExiting(false);
  }, []);

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

  // ===== ИСПРАВЛЕНИЕ INPUT ПОЛЕЙ =====
  useEffect(() => {
    const fixInputs = () => {
      const inputs = document.querySelectorAll('.autosuggest-input, .react-autosuggest__input, input[type="text"]');
      
      inputs.forEach((input) => {
        if (input.dataset.inputFixed) return;
        
        // Принудительные стили для input
        Object.assign(input.style, {
          userSelect: 'auto',
          WebkitUserSelect: 'auto',
          pointerEvents: 'auto',
          cursor: 'text',
          touchAction: 'manipulation',
          WebkitTouchCallout: 'auto',
          WebkitTapHighlightColor: 'rgba(255, 255, 255, 0.1)',
          outline: 'none',
          border: '1px solid rgba(255, 255, 255, 0.25)'
        });
        
        // Удаляем любые блокирующие атрибуты
        input.removeAttribute('readonly');
        input.removeAttribute('disabled');
        
        // Обработчики для мобильных устройств
        input.addEventListener('touchstart', (e) => {
          e.stopPropagation();
        }, { passive: true });
        
        input.addEventListener('touchend', (e) => {
          e.stopPropagation();
          setTimeout(() => {
            if (!input.matches(':focus')) {
              input.focus();
            }
          }, 10);
        }, { passive: false });
        
        input.addEventListener('click', (e) => {
          e.stopPropagation();
          setTimeout(() => {
            if (!input.matches(':focus')) {
              input.focus();
            }
          }, 10);
        });
        
        // Принудительно делаем поле редактируемым
        input.contentEditable = false; // отключаем contentEditable если есть
        input.readOnly = false;
        input.disabled = false;
        
        input.dataset.inputFixed = 'true';
      });
    };
    
    // Множественные попытки исправления
    const timer1 = setTimeout(fixInputs, 100);
    const timer2 = setTimeout(fixInputs, 500);
    const timer3 = setTimeout(fixInputs, 1000);
    const interval = setInterval(fixInputs, 2000);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearInterval(interval);
    };
  }, [currentStep]);

  // ===== TOUCH ОБРАБОТЧИКИ =====
  const handleTouchStart = (e) => {
    // Touch start handler
  };

  const handleTouchEnd = (e, callback) => {
    e.preventDefault();
    if (callback) callback();
  };

  // ===== УДАЛЕНИЕ СЕРЫХ ЛИНИЙ =====
  useEffect(() => {
    if (currentStep === 2) {
      const removeLines = () => {
        document.querySelectorAll('hr').forEach(hr => hr.remove());
        
        const style = document.createElement('style');
        style.setAttribute('data-remove-lines', 'true');
        style.innerHTML = `
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
          
          .form-container > *::before,
          .form-container > *::after,
          .autosuggest-wrapper::before,
          .autosuggest-wrapper::after,
          .autosuggest-container::before,
          .autosuggest-container::after {
            display: none !important;
            content: none !important;
          }
          
          .form-container * {
            border-top: none !important;
            border-bottom: none !important;
          }
          
          .autosuggest-input,
          .react-autosuggest__input {
            border: 1px solid rgba(255, 255, 255, 0.25) !important;
          }
          
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
      
      removeLines();
      const timeout = setTimeout(removeLines, 100);
      
      return () => {
        clearTimeout(timeout);
        document.querySelectorAll('style[data-remove-lines]').forEach(s => s.remove());
      };
    }
  }, [currentStep]);

  // ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
  const canGoNext = () => {
    if (currentStep === 1) return true;
    if (currentStep === 2) return surname.trim() && firstName.trim() && patronymic.trim();
    if (currentStep === 3) return selectedAnswer;
    return false;
  };

  const surnameList = surnames.map(item => item.male || item.female);
  const firstNameList = firstnames.map(item =>
    typeof item === 'string' ? item : (item.firstName || item.name)
  );
  const patronymicList = patronymics.map(item =>
    typeof item === 'string' ? item : (item.patronymic || item.name)
  );

  const shuffleOptions = (options) => {
    const shuffled = [...options];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const getSuggestions = (value, list) => {
    const inputValue = value.trim().toLowerCase();
    const inputLength = inputValue.length;
    return inputLength === 0 ? [] : list.filter(item => 
      item.toLowerCase().slice(0, inputLength) === inputValue
    );
  };

  const renderAutosuggest = (value, setValue, suggestions, setSuggestions, list, placeholder) => {
    // Обработчики для принудительного фокуса
    const handleInputClick = (e) => {
      e.stopPropagation();
      const input = e.target;
      setTimeout(() => {
        if (!input.matches(':focus')) {
          input.focus();
          input.click();
        }
      }, 10);
    };

    const handleInputTouch = (e) => {
      e.stopPropagation();
      const input = e.target;
      setTimeout(() => {
        if (!input.matches(':focus')) {
          input.focus();
        }
      }, 10);
    };

    return (
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
            onChange: (_, { newValue }) => setValue(newValue),
            onFocus: (e) => {
              e.stopPropagation();
            },
            onClick: handleInputClick,
            onTouchEnd: handleInputTouch,
            onTouchStart: (e) => {
              e.stopPropagation();
            },
            style: {
              userSelect: 'auto',
              WebkitUserSelect: 'auto',
              pointerEvents: 'auto',
              cursor: 'text',
              touchAction: 'manipulation',
              WebkitTouchCallout: 'auto'
            }
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
  };

  // ===== ОБРАБОТЧИКИ =====
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

  // Обработчик выбора ответа
  const handleAnswerSelect = (answerText) => {
    setSelectedAnswer(answerText);
  };

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

      // ✅ ПОКАЗЫВАЕМ СПИННЕР МИНИМУМ 2 СЕКУНДЫ для UX
      setTimeout(() => {
        setResult({ success: true });
        setIsFinished(true);
        setIsProcessing(false);
      }, 2000); // 2 секунды показываем "Обработка результатов..."
    
    } catch (error) {
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
        setErrorMessage(`Ошибка загрузки опросника: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadQuestionnaire();
    startTimeRef.current = Date.now();
  }, []);

  // ===== КЛАССЫ ДЛЯ ЭЛЕМЕНТОВ =====
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
        <div className="welcome-text-container animated">
          <div className="assessment-spinner" />
          <h2 className="text-h2 text-center">Загрузка опросника...</h2>
          <p className="text-body text-center">Подготавливаем вопросы для оценки</p>
        </div>
      );
    }

    if (isProcessing) {
      return (
        <div className="welcome-text-container animated">
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
                <label 
                  className="form-label"
                  onClick={() => {
                    const input = document.querySelector('.autosuggest-wrapper:nth-of-type(1) .autosuggest-input');
                    if (input) {
                      setTimeout(() => input.focus(), 10);
                    }
                  }}
                >
                  Фамилия
                </label>
                {renderAutosuggest(
                  surname, setSurname, 
                  surnameSuggestions, setSurnameSuggestions, 
                  surnameList, 'Введите фамилию'
                )}
              </div>

              <div className="autosuggest-wrapper">
                <label 
                  className="form-label"
                  onClick={() => {
                    const input = document.querySelector('.autosuggest-wrapper:nth-of-type(2) .autosuggest-input');
                    if (input) {
                      setTimeout(() => input.focus(), 10);
                    }
                  }}
                >
                  Имя
                </label>
                {renderAutosuggest(
                  firstName, setFirstName, 
                  firstNameSuggestions, setFirstNameSuggestions, 
                  firstNameList, 'Введите имя'
                )}
              </div>

              <div className="autosuggest-wrapper">
                <label 
                  className="form-label"
                  onClick={() => {
                    const input = document.querySelector('.autosuggest-wrapper:nth-of-type(3) .autosuggest-input');
                    if (input) {
                      setTimeout(() => input.focus(), 10);
                    }
                  }}
                >
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
                  onClick={() => handleAnswerSelect(option.text)}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={(e) => handleTouchEnd(e, () => handleAnswerSelect(option.text))}
                  style={{
                    userSelect: 'auto',
                    WebkitUserSelect: 'auto',
                    pointerEvents: 'auto',
                    cursor: 'pointer',
                    touchAction: 'manipulation'
                  }}
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
          
          /* Обеспечиваем видимость логотипа во время загрузки */
          .logo-wrapper:not(.animated) {
            opacity: 1 !important;
            transform: none !important;
          }
        `}
      </style>
      
      <style>
        {`
          hr {
            display: none !important;
          }
          
          .react-autosuggest__container,
          .react-autosuggest__input,
          .react-autosuggest__suggestions-container {
            border-top: none !important;
            border-bottom: none !important;
          }
          
          /* КРИТИЧНО: Обеспечиваем кликабельность autosuggest полей */
          .autosuggest-input,
          .react-autosuggest__input,
          input[type="text"] {
            user-select: auto !important;
            -webkit-user-select: auto !important;
            -moz-user-select: auto !important;
            pointer-events: auto !important;
            cursor: text !important;
            touch-action: manipulation !important;
            -webkit-touch-callout: auto !important;
            -webkit-tap-highlight-color: rgba(255, 255, 255, 0.1) !important;
            outline: none !important;
            border: 1px solid rgba(255, 255, 255, 0.25) !important;
            background-color: rgba(255, 255, 255, 0.05) !important;
            color: white !important;
            z-index: 10 !important;
            position: relative !important;
          }
          
          /* Focus состояние для input полей */
          .autosuggest-input:focus,
          .react-autosuggest__input:focus,
          input[type="text"]:focus {
            border-color: rgba(255, 255, 255, 0.6) !important;
            background-color: rgba(255, 255, 255, 0.1) !important;
            outline: none !important;
            box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.2) !important;
          }
          
          /* Hover состояние для input полей */
          .autosuggest-input:hover,
          .react-autosuggest__input:hover,
          input[type="text"]:hover {
            border-color: rgba(255, 255, 255, 0.4) !important;
            background-color: rgba(255, 255, 255, 0.08) !important;
          }
          
          /* Активное состояние для input полей */
          .autosuggest-input:active,
          .react-autosuggest__input:active,
          input[type="text"]:active {
            border-color: rgba(255, 255, 255, 0.8) !important;
            background-color: rgba(255, 255, 255, 0.15) !important;
          }
          
          .form-container *::before,
          .form-container *::after {
            height: auto !important;
            border: none !important;
            background: transparent !important;
          }
          
          .autosuggest-input::placeholder {
            background: transparent !important;
          }
          
          .autosuggest-container {
            margin-bottom: 0 !important;
          }
          
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

      {/* ===== ЛОГОТИП ===== */}
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
          onTouchStart={handleTouchStart}
          onTouchEnd={(e) => handleTouchEnd(e, handleBack)}
          style={{
            userSelect: 'auto',
            WebkitUserSelect: 'auto',
            pointerEvents: 'auto',
            cursor: 'pointer',
            touchAction: 'manipulation'
          }}
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
          onTouchStart={handleTouchStart}
          onTouchEnd={canGoNext() ? (e) => handleTouchEnd(e, handleNext) : undefined}
          disabled={!canGoNext()}
          style={{
            userSelect: 'auto',
            WebkitUserSelect: 'auto',
            pointerEvents: 'auto',
            cursor: canGoNext() ? 'pointer' : 'not-allowed',
            touchAction: 'manipulation'
          }}
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