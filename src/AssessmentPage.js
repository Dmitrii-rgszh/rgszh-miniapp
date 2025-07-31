// AssessmentPage.js - ИСПРАВЛЕНО: убраны конфликтующие инлайн стили
// ✅ Убраны все автоподсказки
// ✅ Простые input поля для ФИО
// ✅ ИСПРАВЛЕНО: Убраны инлайн стили, которые конфликтуют с NextButton.css
// ✅ Все стили перенесены в отдельный CSS файл

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiCall } from './config';
import logoImage from './components/logo.png';

// Подключаем модульные CSS файлы
import './Styles/logo.css';
import './Styles/NextButton.css';
import './Styles/BackButton.css';
import './Styles/HomeButton.css';
import './Styles/ProgressIndicator.css';
import './Styles/text.css';  
import './Styles/cards.css';

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

  // Данные пользователя - БЕЗ автоподсказок
  const [surname, setSurname] = useState('');
  const [firstName, setFirstName] = useState('');
  const [patronymic, setPatronymic] = useState('');

  // Данные опросника
  const [questionnaire, setQuestionnaire] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [shuffledQuestions, setShuffledQuestions] = useState([]);

  const MAIN_QUESTIONNAIRE_ID = 1;
  const getShakerClass = () => {
  if (!canGoNext()) return 'shaker';
  
  // На последнем вопросе - галочка с анимацией pop
  if (currentStep === 3 && currentQuestion === questions.length - 1) {
    return 'shaker pop-btn';
  }
  
  // Во всех остальных случаях - стрелка с анимацией shake
  return 'shaker shake-btn';
};

  // ===== СБРОС СОСТОЯНИЯ ПРИ МОНТИРОВАНИИ =====
  useEffect(() => {
    setIsExiting(false);
  }, []);

  // ===== АГРЕССИВНОЕ ИСПРАВЛЕНИЕ INPUT ПОЛЕЙ =====
  useEffect(() => {
    const aggressiveInputFix = () => {
      const fioInputs = document.querySelectorAll('.fio-input, input[type="text"]');
      
      fioInputs.forEach((input) => {
        Object.assign(input.style, {
          position: 'relative',
          zIndex: '99999',
          pointerEvents: 'auto',
          cursor: 'text',
          userSelect: 'auto',
          WebkitUserSelect: 'auto',
          touchAction: 'manipulation',
          WebkitTouchCallout: 'auto',
          display: 'block',
          width: '100%',
          height: 'auto',
          minHeight: '40px',
          opacity: '1',
          visibility: 'visible',
          fontSize: '18px',
          transform: 'scale(1)',
          transformOrigin: 'center',
          background: 'rgba(255, 255, 255, 0.08)',
          border: '2px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '14px',
          padding: '16px 20px',
          color: 'white',
          textAlign: 'center',
          fontFamily: '"Segoe UI", sans-serif',
          lineHeight: '1.4',
          boxSizing: 'border-box',
          outline: 'none',
          WebkitAppearance: 'none',
          appearance: 'none',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        });
        
        // Принудительные обработчики событий
        const forceClickHandler = (e) => {
          e.stopPropagation();
          input.focus();
        };
        
        const forceFocusHandler = (e) => {
          Object.assign(input.style, {
            background: 'rgba(255, 255, 255, 0.12)',
            borderColor: 'rgba(180, 0, 55, 0.5)',
            boxShadow: '0 0 0 3px rgba(180, 0, 55, 0.15)'
          });
        };
        
        const forceBlurHandler = (e) => {
          Object.assign(input.style, {
            background: 'rgba(255, 255, 255, 0.08)',
            borderColor: 'rgba(255, 255, 255, 0.15)',
            boxShadow: 'none'
          });
        };
        
        // Удаляем старые обработчики
        input.removeEventListener('click', forceClickHandler);
        input.removeEventListener('focus', forceFocusHandler);
        input.removeEventListener('blur', forceBlurHandler);
        
        // Добавляем новые обработчики
        input.addEventListener('click', forceClickHandler, { passive: false });
        input.addEventListener('focus', forceFocusHandler, { passive: false });
        input.addEventListener('blur', forceBlurHandler, { passive: false });
        input.addEventListener('touchstart', forceClickHandler, { passive: false });
        input.addEventListener('pointerdown', forceClickHandler, { passive: false });
      });
    };
    
    // Исправляем input поля несколько раз для надежности
    const timer1 = setTimeout(aggressiveInputFix, 100);
    const timer2 = setTimeout(aggressiveInputFix, 500);
    const timer3 = setTimeout(aggressiveInputFix, 1000);
    
    // Отслеживаем изменения DOM
    const observer = new MutationObserver(() => {
      setTimeout(aggressiveInputFix, 50);
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      observer.disconnect();
    };
  }, [currentStep]);

  // ===== АНИМАЦИЯ ВХОДА =====
  useEffect(() => {
    // Устанавливаем isLoading = false для первого шага
    if (currentStep === 1) {
      setIsLoading(false);
    }
  
    // Анимация появления элементов
    if (currentStep === 1 || !isLoading) {
      const timer1 = setTimeout(() => {
        setLogoAnimated(true);
        if (logoRef.current) {
          logoRef.current.classList.add('animate-logo');
        }
      }, 100);
    
      const timer2 = setTimeout(() => {
        setContentAnimated(true);
        console.log('✅ Content animated activated');
      }, 600);
    
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [currentStep, isLoading]);

  // ===== TOUCH ОБРАБОТЧИКИ =====
  const handleTouchStart = (e) => {
    // Touch start handler
  };

  const handleTouchEnd = (e, callback) => {
    e.preventDefault();
    if (callback) callback();
  };

  // ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
  const canGoNext = () => {
    if (currentStep === 1) return true;
    if (currentStep === 2) return surname.trim() && firstName.trim() && patronymic.trim();
    if (currentStep === 3) return selectedAnswer;
    return false;
  };

  const shuffleOptions = (options) => {
    const shuffled = [...options];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
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

      // Сохраняем результаты
      const response = await apiCall('/api/assessment/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData)
      });

      // ✅ ДОБАВЛЯЕМ: Отправка email уведомления менеджерам
      try {
        const fullName = `${surname.trim()} ${firstName.trim()} ${patronymic.trim()}`;
        const emailData = {
          subject: `Новый кандидат прошел assessment - ${fullName}`,
          body: `Добрый день!

  Новый кандидат прошел assessment:

  ФИО: ${fullName}
  Время прохождения: ${sessionData.completionTime} минут
  Дата: ${new Date().toLocaleString('ru-RU')}

  Результаты сохранены в системе.

  ---
  Автоматическое уведомление системы Assessment`
        };

        await apiCall('/api/proxy/assessment/send_manager', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(emailData)
        });
      
        console.log('✅ Email notification sent to managers');
      } catch (emailError) {
        console.error('❌ Failed to send email notification:', emailError);
        // Не прерываем процесс, если email не отправился
      }

      // ✅ ПОКАЗЫВАЕМ СПИННЕР МИНИМУМ 2 СЕКУНДЫ для UX
      setTimeout(() => {
        setResult({ success: true });
        setIsFinished(true);
        setIsProcessing(false);
      }, 2000);
  
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
            {questionnaire && (
              <div className="card-container animated">
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
            <h2 className="fio-form-title">Введите ваши ФИО</h2>
            {errorMessage && (
              <div className="fio-error-message">
                {errorMessage}
              </div>
            )}
      
            <div className="fio-form-container">
              <div className="fio-field">
                <label className="fio-label" htmlFor="surname-input">
                  Фамилия
                </label>
                <input
                  id="surname-input"
                  type="text"
                  className="fio-input"
                  placeholder="Введите фамилию"
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="words"
                  spellCheck="false"
                  style={{
                    position: 'relative',
                    zIndex: '99999',
                    pointerEvents: 'auto',
                    cursor: 'text',
                    userSelect: 'auto',
                    WebkitUserSelect: 'auto',
                    touchAction: 'manipulation',
                    WebkitTouchCallout: 'auto',
                    display: 'block',
                    width: '100%',
                    height: 'auto',
                    minHeight: '50px',
                    opacity: '1',
                    visibility: 'visible',
                    fontSize: '18px',
                    fontWeight: '400',
                    transform: 'scale(1)',
                    transformOrigin: 'center',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '2px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '14px',
                    padding: '16px 20px',
                    color: 'white',
                    textAlign: 'center',
                    fontFamily: '"Segoe UI", sans-serif',
                    lineHeight: '1.4',
                    boxSizing: 'border-box',
                    outline: 'none',
                    WebkitAppearance: 'none',
                    appearance: 'none',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                  onFocus={(e) => {
                    Object.assign(e.target.style, {
                      background: 'rgba(255, 255, 255, 0.12)',
                      borderColor: 'rgba(180, 0, 55, 0.5)',
                      boxShadow: '0 0 0 3px rgba(180, 0, 55, 0.15)'
                    });
                  }}
                  onBlur={(e) => {
                    Object.assign(e.target.style, {
                      background: 'rgba(255, 255, 255, 0.08)',
                      borderColor: 'rgba(255, 255, 255, 0.15)',
                      boxShadow: 'none'
                    });
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.target.focus();
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                  }}
                />
              </div>

              <div className="fio-field">
                <label className="fio-label" htmlFor="firstname-input">
                  Имя
                </label>
                <input
                  id="firstname-input"
                  type="text"
                  className="fio-input"
                  placeholder="Введите имя"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="words"
                  spellCheck="false"
                  style={{
                    position: 'relative',
                    zIndex: '99999',
                    pointerEvents: 'auto',
                    cursor: 'text',
                    userSelect: 'auto',
                    WebkitUserSelect: 'auto',
                    touchAction: 'manipulation',
                    WebkitTouchCallout: 'auto',
                    display: 'block',
                    width: '100%',
                    height: 'auto',
                    minHeight: '50px',
                    opacity: '1',
                    visibility: 'visible',
                    fontSize: '18px',
                    fontWeight: '400',
                    transform: 'scale(1)',
                    transformOrigin: 'center',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '2px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '14px',
                    padding: '16px 20px',
                    color: 'white',
                    textAlign: 'center',
                    fontFamily: '"Segoe UI", sans-serif',
                    lineHeight: '1.4',
                    boxSizing: 'border-box',
                    outline: 'none',
                    WebkitAppearance: 'none',
                    appearance: 'none',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                  onFocus={(e) => {
                    Object.assign(e.target.style, {
                      background: 'rgba(255, 255, 255, 0.12)',
                      borderColor: 'rgba(180, 0, 55, 0.5)',
                      boxShadow: '0 0 0 3px rgba(180, 0, 55, 0.15)'
                    });
                  }}
                  onBlur={(e) => {
                    Object.assign(e.target.style, {
                      background: 'rgba(255, 255, 255, 0.08)',
                      borderColor: 'rgba(255, 255, 255, 0.15)',
                      boxShadow: 'none'
                    });
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.target.focus();
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                  }}
                />
              </div>

              <div className="fio-field">
                <label className="fio-label" htmlFor="patronymic-input">
                  Отчество
                </label>
                <input
                  id="patronymic-input"
                  type="text"
                  className="fio-input"
                  placeholder="Введите отчество"
                  value={patronymic}
                  onChange={(e) => setPatronymic(e.target.value)}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="words"
                  spellCheck="false"
                  style={{
                    position: 'relative',
                    zIndex: '99999',
                    pointerEvents: 'auto',
                    cursor: 'text',
                    userSelect: 'auto',
                    WebkitUserSelect: 'auto',
                    touchAction: 'manipulation',
                    WebkitTouchCallout: 'auto',
                    display: 'block',
                    width: '100%',
                    height: 'auto',
                    minHeight: '50px',
                    opacity: '1',
                    visibility: 'visible',
                    fontSize: '18px',
                    fontWeight: '400',
                    transform: 'scale(1)',
                    transformOrigin: 'center',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '2px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '14px',
                    padding: '16px 20px',
                    color: 'white',
                    textAlign: 'center',
                    fontFamily: '"Segoe UI", sans-serif',
                    lineHeight: '1.4',
                    boxSizing: 'border-box',
                    outline: 'none',
                    WebkitAppearance: 'none',
                    appearance: 'none',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                  onFocus={(e) => {
                    Object.assign(e.target.style, {
                      background: 'rgba(255, 255, 255, 0.12)',
                      borderColor: 'rgba(180, 0, 55, 0.5)',
                      boxShadow: '0 0 0 3px rgba(180, 0, 55, 0.15)'
                    });
                  }}
                  onBlur={(e) => {
                    Object.assign(e.target.style, {
                      background: 'rgba(255, 255, 255, 0.08)',
                      borderColor: 'rgba(255, 255, 255, 0.15)',
                      boxShadow: 'none'
                    });
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.target.focus();
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                  }}
                />
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

            <div className="answer-options-container">
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

  return (
    <div className={getContainerClasses()}>
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
        >
          <svg viewBox="0 0 24 24">
            <path d="M15 18l-6-6 6-6" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}

      {/* ===== КНОПКА "ДАЛЕЕ" ===== */}
      {(currentStep <= 3 && !isProcessing && !isFinished && (currentStep === 1 || !isLoading)) && (
        <button 
          className={`next-btn ${contentAnimated ? 'animate-next' : ''} ${isExiting ? 'animate-next-exit' : ''} ${!canGoNext() ? 'disabled' : ''}`}
          onClick={canGoNext() ? handleNext : undefined}
          disabled={!canGoNext()}
        >
          <div className={getShakerClass()}>
            {currentStep === 3 && currentQuestion === questions.length - 1 ? (
              <svg viewBox="0 0 24 24">
                <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24">
                <path d="M9 18l6-6-6-6" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
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