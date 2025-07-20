// AssessmentPage.js - СО СТИЛЕМ MainMenu
// ✅ Применены стили из MainMenu.js
// ✅ Анимация появления как в MainMenu
// ✅ Убраны все внешние CSS файлы
// ✅ Инлайн стили как в требованиях

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Autosuggest from 'react-autosuggest';
import { useNavigate } from 'react-router-dom';
import { apiCall } from './config';
import logoImage from './components/logo.png';

// JSON-файлы с ФИО
import surnames from './components/autosuggest/surname.json';
import firstnames from './components/autosuggest/firstname.json';
import patronymics from './components/autosuggest/lastname.json';

export default function AssessmentPage() {
  const navigate = useNavigate();
  const startTimeRef = useRef(null);

  // ===== СОСТОЯНИЯ АНИМАЦИЙ (как в MainMenu) =====
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

  // ===== ФУНКЦИИ И ЛОГИКА =====

  // Определение возможности перехода далее (перенесено выше)
  const canGoNext = () => {
    if (currentStep === 1) return true;
    if (currentStep === 2) return surname.trim() && firstName.trim() && patronymic.trim();
    if (currentStep === 3) return selectedAnswer;
    return false;
  };

  // ===== СТИЛИ (как в MainMenu) =====

  // Основной контейнер
  const mainContainerStyle = {
    position: 'relative',
    width: '100%',
    height: window.innerHeight + 'px',
    minHeight: '100vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, sans-serif'
  };

  // Логотип с анимацией (как в MainMenu)
  const logoStyle = {
    position: 'absolute',
    top: logoAnimated && !isExiting ? '60px' : isExiting ? '-200px' : '-200px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '128px',
    height: '128px',
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    backdropFilter: 'blur(8px)',
    borderRadius: '20px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.25)',
    opacity: logoAnimated && !isExiting ? 1 : 0,
    zIndex: 3,
    transition: 'all 0.8s ease-out',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  // Изображение логотипа
  const logoImageStyle = {
    width: '96px',
    height: '96px',
    objectFit: 'contain'
  };

  // Контейнер контента (адаптивный отступ от логотипа)
  const contentContainerStyle = {
    position: 'absolute',
    top: window.innerWidth < 768 ? '200px' : '200px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    maxWidth: '600px',
    paddingLeft: '20px',
    paddingRight: '20px',
    paddingBottom: '40px',
    boxSizing: 'border-box',
    opacity: contentAnimated ? 1 : 0,
    transition: 'all 0.8s ease-out 0.2s',
    overflowY: 'auto',
    maxHeight: `calc(${window.innerHeight}px - 220px)`
  };

  // Стиль заголовка
  const titleStyle = {
    fontSize: '28px',
    fontWeight: '700',
    fontFamily: '"Segoe UI", sans-serif',
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    marginBottom: '20px',
    textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
  };

  // Стиль текста
  const textStyle = {
    fontSize: '18px',
    fontWeight: '400',
    fontFamily: '"Segoe UI", sans-serif',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: '1.6',
    marginBottom: '30px',
    textShadow: '0 1px 5px rgba(0, 0, 0, 0.3)'
  };

  // Стиль для кнопки "Далее" (справа от логотипа)
  const nextButtonStyle = {
    position: 'absolute',
    top: '60px',
    right: '20px',
    width: '56px',
    height: '56px',
    background: 'linear-gradient(145deg, rgba(180, 0, 55, 0.95), rgba(0, 40, 130, 0.9))',
    borderRadius: '50%',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.3)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    zIndex: 10
  };

  // Стиль для кнопки "Назад" (слева от логотипа)
  const backButtonStyle = {
    position: 'absolute',
    top: '70px',
    left: '20px',
    width: '44px',
    height: '44px',
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    borderRadius: '50%',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
    transition: 'all 0.3s ease',
    zIndex: 10
  };

  // Стиль для кнопки (как в MainMenu)
  const buttonStyle = {
    minWidth: '280px',
    background: 'linear-gradient(135deg, rgba(180, 0, 55, 0.9) 0%, rgba(153, 0, 55, 0.85) 50%, rgba(0, 40, 130, 0.9) 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    padding: '18px 36px',
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
    fontSize: '20px',
    fontWeight: '600',
    fontFamily: '"Segoe UI", sans-serif',
    transition: 'all 0.3s ease',
    marginTop: '20px'
  };

  // Стиль для полей ввода (адаптированный под стиль MainMenu)
  const inputStyle = {
    width: '100%',
    padding: '16px 20px',
    fontSize: '18px',
    fontFamily: '"Segoe UI", sans-serif',
    background: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '12px',
    color: 'white',
    marginBottom: '15px',
    transition: 'all 0.3s ease',
    outline: 'none'
  };

  // Стиль для опций ответов (как кнопки в MainMenu)
  const optionButtonStyle = (isSelected) => ({
    width: '100%',
    background: isSelected 
      ? 'linear-gradient(135deg, rgba(180, 0, 55, 0.9) 0%, rgba(0, 40, 130, 0.9) 100%)'
      : 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(10px)',
    color: 'white',
    border: isSelected ? '2px solid rgba(255, 255, 255, 0.8)' : '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '12px',
    padding: '16px 24px',
    cursor: 'pointer',
    fontSize: '18px',
    fontWeight: isSelected ? '600' : '400',
    fontFamily: '"Segoe UI", sans-serif',
    marginBottom: '12px',
    transition: 'all 0.3s ease',
    boxShadow: isSelected ? '0 6px 20px rgba(0, 0, 0, 0.3)' : '0 4px 15px rgba(0, 0, 0, 0.2)',
    transform: isSelected ? 'scale(1.02)' : 'scale(1)'
  });

  // ===== АНИМАЦИЯ ВХОДА (как в MainMenu) =====
  useEffect(() => {
    if (!isLoading) {
      const timer1 = setTimeout(() => setLogoAnimated(true), 100);
      const timer2 = setTimeout(() => setContentAnimated(true), 600);
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [isLoading]);

  // ===== ФУНКЦИИ И ЛОГИКА =====

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
        style: inputStyle
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
    setTimeout(() => navigate('/'), 800);
  };

  // Hover эффекты (как в MainMenu)
  const handleMouseEnter = (e) => {
    e.target.style.transform = 'translateY(-2px) scale(1.02)';
    e.target.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.4)';
  };

  const handleMouseLeave = (e) => {
    if (!isExiting) {
      e.target.style.transform = 'translateY(0) scale(1)';
      e.target.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
    }
  };

  // ===== РЕНДЕР КОНТЕНТА =====
  const renderStepContent = () => {
    if (isLoading) {
      return (
        <div style={contentContainerStyle}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '60px',
              height: '60px',
              border: '3px solid rgba(255, 255, 255, 0.3)',
              borderTopColor: 'white',
              borderRadius: '50%',
              margin: '0 auto 30px',
              animation: 'spin 1s linear infinite'
            }} />
            <div style={titleStyle}>Загрузка опросника...</div>
            <div style={textStyle}>Подготавливаем вопросы для оценки</div>
          </div>
        </div>
      );
    }

    if (isProcessing) {
      return (
        <div style={contentContainerStyle}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '60px',
              height: '60px',
              border: '3px solid rgba(255, 255, 255, 0.3)',
              borderTopColor: 'white',
              borderRadius: '50%',
              margin: '0 auto 20px',
              animation: 'spin 1s linear infinite'
            }} />
            <div style={titleStyle}>Обработка результатов...</div>
            <div style={textStyle}>Анализируем ваши ответы</div>
          </div>
        </div>
      );
    }

    if (isFinished && result) {
      return (
        <div style={{...contentContainerStyle, opacity: 1}}>
          <div style={{ textAlign: 'center' }}>
            <h2 style={titleStyle}>Спасибо за прохождение!</h2>
            <p style={textStyle}>
              {firstName}, благодарим за прохождение опроса.<br/>
              Свяжемся с вами в ближайшее время.<br/>
              Отличного дня!
            </p>
            <button 
              style={buttonStyle}
              onClick={goHome}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
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
          <div style={contentContainerStyle}>
            <h2 style={titleStyle}>Психологическая оценка</h2>
            <p style={textStyle}>
              Пройдите короткий тест для определения ваших корпоративных ценностей.
              {questionnaire?.description && ` ${questionnaire.description}`}
            </p>
            <p style={{...textStyle, fontSize: '16px', opacity: 0.9}}>
              {questionnaire?.instructions || 
               'Здесь нет «правильных» или «неправильных» ответов — важно лишь понять ваш естественный стиль работы и взаимодействия.'}
            </p>
            {questionnaire && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: '12px',
                padding: '20px',
                marginTop: '20px',
                textAlign: 'center'
              }}>
                <p style={{ ...textStyle, margin: '10px 0', fontSize: '16px' }}>
                  <strong>Опросник:</strong> {questionnaire.title}
                </p>
                <p style={{ ...textStyle, margin: '10px 0', fontSize: '16px' }}>
                  <strong>Количество вопросов:</strong> {questionnaire.questions_count}
                </p>
                {questionnaire.max_time_minutes && (
                  <p style={{ ...textStyle, margin: '10px 0', fontSize: '16px' }}>
                    <strong>Примерное время:</strong> {questionnaire.max_time_minutes} минут
                  </p>
                )}
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div style={contentContainerStyle}>
            <h2 style={titleStyle}>Введите ваши ФИО</h2>
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
            
            <div style={{ width: '100%', maxWidth: '400px' }}>
              <label style={{ ...textStyle, fontSize: '16px', marginBottom: '5px', display: 'block', textAlign: 'left' }}>
                Фамилия
              </label>
              {renderAutosuggest(
                surname, setSurname, 
                surnameSuggestions, setSurnameSuggestions, 
                surnameList, 'Введите фамилию'
              )}
              
              <label style={{ ...textStyle, fontSize: '16px', marginBottom: '5px', display: 'block', textAlign: 'left' }}>
                Имя
              </label>
              {renderAutosuggest(
                firstName, setFirstName, 
                firstNameSuggestions, setFirstNameSuggestions, 
                firstNameList, 'Введите имя'
              )}
              
              <label style={{ ...textStyle, fontSize: '16px', marginBottom: '5px', display: 'block', textAlign: 'left' }}>
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
            <div style={contentContainerStyle}>
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
          <div style={{
            ...contentContainerStyle,
            opacity: fadeTransition ? 0 : 1,
            transition: 'opacity 0.3s ease'
          }}>
            {/* Прогресс индикатор */}
            <div style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '20px'
            }}>
              {questions.map((_, idx) => (
                <div 
                  key={idx} 
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: idx < currentQuestion ? 'rgba(180, 0, 55, 0.9)' : 
                               idx === currentQuestion ? 'white' : 
                               'rgba(255, 255, 255, 0.3)',
                    transition: 'all 0.3s ease'
                  }}
                />
              ))}
            </div>

            <div style={{
              ...textStyle,
              fontSize: '14px',
              marginBottom: '20px',
              opacity: 0.8
            }}>
              Вопрос {currentQuestion + 1} из {questions.length}
            </div>

            <h2 style={{...titleStyle, fontSize: '24px', marginBottom: '30px'}}>
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

            <div style={{ width: '100%', maxWidth: '500px' }}>
              {currentQuestionData.shuffledOptions.map((option, idx) => (
                <button
                  key={idx}
                  style={optionButtonStyle(selectedAnswer === option.text)}
                  onClick={() => setSelectedAnswer(option.text)}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'scale(1.02)';
                    e.target.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = selectedAnswer === option.text ? 'scale(1.02)' : 'scale(1)';
                    e.target.style.boxShadow = selectedAnswer === option.text ? 
                      '0 6px 20px rgba(0, 0, 0, 0.3)' : '0 4px 15px rgba(0, 0, 0, 0.2)';
                  }}
                >
                  {option.text}
                </button>
              ))}
            </div>

            {currentQuestionData.description && (
              <div style={{
                ...textStyle,
                fontSize: '14px',
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
    <div style={mainContainerStyle}>
      {/* CSS анимации */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          /* Скроллбар для контента */
          .assessment-content::-webkit-scrollbar {
            width: 4px;
          }
          .assessment-content::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.1);
          }
          .assessment-content::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.3);
            border-radius: 2px;
          }
          
          /* Адаптивные медиа запросы */
          @media (max-width: 768px) {
            .assessment-content {
              padding-top: 180px !important;
            }
          }
        `}
      </style>

      {/* Логотип */}
      <div style={logoStyle}>
        <img
          src={logoImage}
          alt="Логотип РГС Жизнь"
          style={logoImageStyle}
        />
      </div>

      {/* Кнопка "Назад" */}
      {(currentStep > 1 || (currentStep === 3 && currentQuestion > 0)) && !isFinished && !isLoading && !isProcessing && (
        <button 
          style={{
            ...backButtonStyle,
            top: window.innerWidth < 768 ? '70px' : '70px',
            left: window.innerWidth < 768 ? '15px' : '20px',
            width: window.innerWidth < 768 ? '40px' : '44px',
            height: window.innerWidth < 768 ? '40px' : '44px'
          }}
          onClick={handleBack}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.2)';
            e.target.style.transform = 'scale(1.1)';
            e.target.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.1)';
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2)';
          }}
        >
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path d="M15 18l-6-6 6-6" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}

      {/* Кнопка "Далее" справа от логотипа */}
      {(currentStep <= 3 && !isProcessing && !isFinished && !isLoading) && (
        <button 
          style={{
            ...nextButtonStyle,
            top: window.innerWidth < 768 ? '60px' : '60px',
            right: window.innerWidth < 768 ? '15px' : '20px',
            width: window.innerWidth < 768 ? '48px' : '56px',
            height: window.innerWidth < 768 ? '48px' : '56px',
            opacity: canGoNext() ? 1 : 0.5,
            transform: canGoNext() ? 'scale(1)' : 'scale(0.9)',
            pointerEvents: canGoNext() ? 'auto' : 'none'
          }}
          onClick={canGoNext() ? handleNext : undefined}
          disabled={!canGoNext()}
          onMouseEnter={(e) => {
            if (canGoNext()) {
              e.target.style.transform = 'scale(1.1)';
              e.target.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            if (canGoNext()) {
              e.target.style.transform = 'scale(1)';
              e.target.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.3)';
            }
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%'
          }}>
            {currentStep === 3 && currentQuestion === questions.length - 1 ? (
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path d="M9 18l6-6-6-6" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
        </button>
      )}

      {/* Основной контент */}
      {renderStepContent()}
    </div>
  );
}