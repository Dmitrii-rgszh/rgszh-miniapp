import React, { useState, useEffect } from 'react';
import Autosuggest from 'react-autosuggest';

// JSON-файлы с ФИО
import surnames from './components/autosuggest/surname.json';
import firstnames from './components/autosuggest/firstname.json';
import patronymics from './components/autosuggest/lastname.json';

// Фон и логотип
import backgroundImage from './components/background.png';
import logo from './components/logo.png';

function AssessmentPage() {
  // 1) Состояния для ФИО
  const [surnameValue, setSurnameValue] = useState('');
  const [surnameSuggestions, setSurnameSuggestions] = useState([]);
  const surnameList = surnames.map(item => item.male || item.female);

  const [firstNameValue, setFirstNameValue] = useState('');
  const [firstNameSuggestions, setFirstNameSuggestions] = useState([]);
  const firstNameList = firstnames.map(item =>
    typeof item === 'string' ? item : (item.firstName || item.name)
  );

  const [patronymicValue, setPatronymicValue] = useState('');
  const [patronymicSuggestions, setPatronymicSuggestions] = useState([]);
  const patronymicList = patronymics.map(item =>
    typeof item === 'string' ? item : (item.patronymic || item.name)
  );

  // 2) Autosuggest logic
  const getSurnameSuggestions = (value) => {
    const trimmed = value.trim().toLowerCase();
    if (trimmed.length < 2) return [];
    return surnameList.filter(s => s.toLowerCase().startsWith(trimmed));
  };
  const getFirstNameSuggestions = (value) => {
    const trimmed = value.trim().toLowerCase();
    if (trimmed.length < 2) return [];
    return firstNameList.filter(s => s.toLowerCase().startsWith(trimmed));
  };
  const getPatronymicSuggestions = (value) => {
    const trimmed = value.trim().toLowerCase();
    if (trimmed.length < 2) return [];
    return patronymicList.filter(s => s.toLowerCase().startsWith(trimmed));
  };

  const surnameInputProps = {
    placeholder: 'Введите фамилию',
    value: surnameValue,
    onChange: (e, { newValue }) =>
      setSurnameValue(newValue.charAt(0).toUpperCase() + newValue.slice(1).toLowerCase()),
    autoComplete: 'off'
  };
  const firstNameInputProps = {
    placeholder: 'Введите имя',
    value: firstNameValue,
    onChange: (e, { newValue }) =>
      setFirstNameValue(newValue.charAt(0).toUpperCase() + newValue.slice(1).toLowerCase()),
    autoComplete: 'off'
  };
  const patronymicInputProps = {
    placeholder: 'Введите отчество',
    value: patronymicValue,
    onChange: (e, { newValue }) =>
      setPatronymicValue(newValue.charAt(0).toUpperCase() + newValue.slice(1).toLowerCase()),
    autoComplete: 'off'
  };

  // 3) Логика опроса и инструкции
  const [isStarted, setIsStarted] = useState(false);
  const [showInstruction, setShowInstruction] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const handleInstructionNext = () => {
    setShowInstruction(false);
  };

  const handleStart = () => {
    if (!surnameValue.trim() || !firstNameValue.trim() || !patronymicValue.trim()) {
      setErrorMessage('Пожалуйста, заполните все поля.');
      return;
    }
    setErrorMessage('');
    setIsStarted(true);
  };

  // 4) Массив вопросов (25 вопросов)
  const questions = [
    {
      question: "1. Какой формат работы вам ближе?",
      answers: [
        "Когда можно детально разобраться в процессах и построить устойчивую систему",
        "Когда задачи достаточно разнообразны и требуют гибкого подхода",
        "Когда есть чёткий алгоритм действий и понятный конечный результат"
      ],
    },
    {
      question: "2. Если коллега допустил серьёзную ошибку, что для вас логичнее сделать?",
      answers: [
        "Понять, что пошло не так, и вместе найти пути исправления",
        "В первую очередь скорректировать свои планы с учётом возникших проблем",
        "Сделать выводы для себя и минимизировать влияние на мою работу"
      ],
    },
    {
      question: "3. В команде нарастает напряжение, которое влияет на общий процесс. Как вы реагируете?",
      answers: [
        "Стараюсь выяснить причину и предложить возможные решения, учитывая интересы всех",
        "Наблюдаю за развитием ситуации и при необходимости высказываю своё мнение",
        "Предпочитаю не вовлекаться, если это напрямую не затрагивает мою зону ответственности"
      ],
    },
    {
      question: "4. Как относитесь к комментариям по вашей работе?",
      answers: [
        "Считаю их возможностью для развития, если они аргументированы",
        "Выслушиваю, но меняю подход только при реальной необходимости",
        "Если работа выполнена по стандартам, дополнительные замечания не критичны"
      ],
    },
    {
      question: "5. Клиент или партнер выражает недовольство результатом. Как поступаете?",
      answers: [
        "Пытаюсь понять, где возникли расхождения, и найти приемлемое решение",
        "Сначала оцениваю обоснованность претензий, при необходимости уточняю детали",
        "Если всё сделано согласно договорённостям, считаю, что моя задача выполнена"
      ],
    },
    {
      question: "6. Какой рабочий стиль для вас комфортнее?",
      answers: [
        "Выстраивать системные процессы, учитывая интересы всех сторон надолго вперёд",
        "Следовать намеченному плану, при необходимости поддерживая взаимодействие",
        "Сосредотачиваться на своих задачах, минимизируя отвлечения на внешние факторы"
      ],
    },
    {
      question: "7. Как вы относитесь к идее поддерживать контакт с бывшими клиентами или коллегами, чтобы в будущем возможно было сотрудничество?",
      answers: [
        "Считаю это важным для выстраивания долгосрочных отношений",
        "Можно поддерживать связь, если в этом есть очевидная практическая выгода",
        "Предпочитаю фокусироваться на текущих проектах, не распыляясь на прошлое"
      ],
    },
    {
      question: "8. Если приходится выбирать между краткосрочной выгодой и построением долгосрочных отношений, что окажется важнее?",
      answers: [
        "Долгосрочная перспектива, даже если сейчас придётся чем-то пожертвовать",
        "Зависит от ситуации — оцениваю риски, возможности и совокупную пользу",
        "Скорее выберу краткосрочную выгоду, ведь будущее сложно прогнозировать"
      ],
    },
    {
      question: "9. Насколько вы готовы вкладываться в общее развитие и успехи команды?",
      answers: [
        "Считаю важным делиться опытом, помогать коллегам и укреплять общий результат",
        "Поддерживаю такие инициативы, если они не мешают моей продуктивности",
        "Сосредотачиваюсь на своей зоне ответственности, дополнительные усилия — опциональны"
      ],
    },
    {
      question: "10. Как относитесь к идее регулярных встреч или мозговых штурмов с коллегами для совершенствования общего процесса?",
      answers: [
        "Считаю это ценным инструментом для укрепления взаимопонимания и улучшения результата",
        "Участвую, если уверен(а), что это оправдано и не перегружает рабочее время",
        "Предпочитаю решать задачи в индивидуальном порядке, без лишних обсуждений"
      ],
    },
    {
      question: "11. Как относитесь к повышению квалификации?",
      answers: [
        "Постоянно осваиваю новые инструменты и технологии, чтобы быть в курсе трендов",
        "Изучаю что-то новое, когда это действительно нужно для выполнения задач",
        "Считаю, что уже имеющихся знаний обычно достаточно для базовых процессов"
      ],
    },
    {
      question: "12. Как реагируете, когда сталкиваетесь с незнакомой задачей?",
      answers: [
        "С радостью вижу шанс изучить новую область и расширить компетенции",
        "Изучаю столько, сколько требуется, чтобы качественно решить задачу",
        "Предпочитаю применять проверенные методы, если они дают нужный результат"
      ],
    },
    {
      question: "13. Как относитесь к обмену знаниями в команде?",
      answers: [
        "Считаю, что это взаимовыгодный процесс: чем больше делимся, тем сильнее команда",
        "Готов(а) поделиться опытом, если вижу, что это действительно кому-то полезно",
        "Каждый занимается своей областью, делиться или нет — решение сугубо личное"
      ],
    },
    {
      question: "14. Что делаете, если замечаете, что используемый процесс устарел?",
      answers: [
        "Изучаю, как его можно обновить, и вношу конкретные предложения",
        "Предлагаю альтернативы, если вижу в этом реальную пользу",
        "Если процесс пока работает, значит, радикальные изменения не обязательны"
      ],
    },
    {
      question: "15. Насколько важно для вас идти в ногу с новыми трендами в своей сфере?",
      answers: [
        "Постоянно ищу и пробую инновационные подходы, слежу за профессиональными сообществами",
        "Изучаю новинки по мере необходимости, когда они могут пригодиться в работе",
        "Ориентируюсь в основном на проверенные временем технологии"
      ],
    },
    {
      question: "16. Как подходите к решению сложных задач?",
      answers: [
        "Стараюсь рассмотреть задачу под разными углами и привлекаю экспертов при необходимости",
        "Опираюсь на имеющиеся знания, обращаясь за поддержкой только если это действительно нужно",
        "Использую знакомые шаблоны, которые уже доказали свою эффективность"
      ],
    },
    {
      question: "17. Как относитесь к критическому анализу своих профессиональных методов?",
      answers: [
        "Считаю, что это естественный путь к росту экспертизы и поиску новых решений",
        "Прислушиваюсь, если замечания выглядят обоснованными и практичными",
        "Если метод работает, то лишний анализ может только замедлить процесс"
      ],
    },
    {
      question: "18. Какой тип задач для вас наиболее интересен?",
      answers: [
        "Когда можно глубоко вникнуть и довести методику до высокого уровня",
        "Когда нужно сочетать проверенные подходы и что-то новое",
        "Когда есть чёткая инструкция и предсказуемый результат, без лишних экспериментов"
      ],
    },
    {
      question: "19. Как оцениваете качество выполненной работы?",
      answers: [
        "Если результат заметно превосходит обычные ожидания и удивляет заказчика/коллег",
        "Если всё сделано надёжно, в срок и соответствует ключевым целям",
        "Если задача решена строго по заданным критериям и нет существенных нареканий"
      ],
    },
    {
      question: "20. Как относитесь к инициативе, выходящей за рамки поставленных задач?",
      answers: [
        "Часто предлагаю идеи, которые могут сделать итог действительно впечатляющим",
        "Высказываю предложения, когда вижу, что это принесёт реальную пользу",
        "Предпочитаю не выходить за рамки инструкции, чтобы не рисковать понапрасну"
      ],
    },
    {
      question: "21. Как воспринимаете нестандартные решения?",
      answers: [
        "Это шанс получить новый опыт и порадовать команду или клиентов",
        "Готов(а) их рассмотреть, если они оправданы и не слишком рискованны",
        "Предпочитаю проверенные пути, чтобы избежать лишних экспериментов"
      ],
    },
    {
      question: "22. Какую обратную связь по работе вам приятнее всего получать?",
      answers: [
        "Когда говорят, что всё получилось даже лучше, чем ожидали",
        "Когда отмечают аккуратное, качественное выполнение без ошибок",
        "Когда просто подтверждают, что всё соответствует заранее установленным требованиям"
      ],
    },
    {
      question: "23. Если видите возможность улучшить процесс, что делаете?",
      answers: [
        "Инициирую изменения, стремясь поднять планку качества и удивить результатом",
        "Оцениваю плюсы и минусы, предлагаю улучшения, если они действительно востребованы",
        "Если текущая схема работает стабильно, глобальных перемен обычно не вношу"
      ],
    },
    {
      question: "24. Как относитесь к деталям в работе?",
      answers: [
        "Считаю, что именно нюансы придают результату яркость и особое качество",
        "Уделяю им внимание, когда это влияет на общее впечатление и удовлетворённость клиентов",
        "Главное — выполнить работу по основным критериям, не вдаваясь в мелочи"
      ],
    },
    {
      question: "25. Как воспринимаете конечных пользователей или клиентов вашей работы?",
      answers: [
        "Стараюсь удивить их качеством и оригинальностью, чтобы оставить сильное впечатление",
        "Важно, чтобы они получили то, что нужно, и остались довольны",
        "Главное — соответствие техническим требованиям и срокам, без лишних нюансов"
      ],
    },
  ];

  // 5) Логика шагов опроса
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [userAnswers, setUserAnswers] = useState([]);
  const [isFinished, setIsFinished] = useState(false);
  const [fadeTransition, setFadeTransition] = useState(false);
  const [offsetY, setOffsetY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setOffsetY(window.pageYOffset);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const [shuffledAnswers, setShuffledAnswers] = useState([]);

  useEffect(() => {
    if (isStarted && currentQuestion < questions.length) {
      const newShuffled = [...questions[currentQuestion].answers].sort(() => Math.random() - 0.5);
      setShuffledAnswers(newShuffled);
      setSelectedAnswer('');
    }
  }, [currentQuestion, isStarted]);

  const handlePrevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
      setUserAnswers(prev => prev.slice(0, -1));
      setSelectedAnswer('');
    }
  };

  const handleNextQuestion = () => {
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
      } else {
        handleFinish(updatedAnswers);
      }
      setFadeTransition(false);
    }, 400);
  };

  // handleFinish получает уже полный массив ответов
  const handleFinish = async (finalAnswers) => {
    setIsFinished(true);
    console.log('Ответы пользователя:', finalAnswers);
    const dataToSave = {
      surname: surnameValue,
      firstName: firstNameValue,
      patronymic: patronymicValue,
      dateTime: new Date().toISOString(),
      answers: finalAnswers
    };
    try {
      const response = await fetch('/api/proxy/assessment/candidate/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave),
      });
      if (!response.ok) {
        console.error('Ошибка при сохранении данных в XLSX');
      }
    } catch (error) {
      console.error('Ошибка при отправке данных:', error);
    }
  };

  // 6) Рендер основного контента
  const renderMainContent = () => {
    if (isFinished) {
      return (
        <div className="ap-finish-container">
          <h2 className="ap-finish-title">Спасибо за прохождение опроса, {firstNameValue}!</h2>
          <p className="ap-finish-text">Мы обязательно с вами свяжемся</p>
        </div>
      );
    } else if (!isStarted) {
      // Если опрос ещё не начат: показываем инструкцию, если она активна, иначе форму ФИО
      if (showInstruction) {
        return (
          <div className="ap-instruction-container">
            <h2 className="ap-instruction-title">Инструкция</h2>
            <p className="ap-instruction-text">
              Прочитайте вопросы и выберите вариант ответа (1 из 3 в каждом вопросе), который кажется вам наиболее близким. Здесь нет «правильных» или «неправильных» ответов — важно лишь понять ваш естественный стиль работы и взаимодействия.
            </p>
            {/* Стрелка «Далее» выводится через .ap-top-btn-container */}
          </div>
        );
      } else {
        return (
          <div>
            <h2 className="ap-fio-title">Введите ваши ФИО</h2>
            {errorMessage && <p className="ap-error-message">{errorMessage}</p>}
            <form className="ap-name-form">
              <div className="ap-input-container autosuggest-container">
                <label>Фамилия</label>
                <Autosuggest
                  suggestions={surnameSuggestions}
                  onSuggestionsFetchRequested={({ value }) => setSurnameSuggestions(getSurnameSuggestions(value))}
                  onSuggestionsClearRequested={() => setSurnameSuggestions([])}
                  getSuggestionValue={s => s}
                  renderSuggestion={s => <div>{s}</div>}
                  inputProps={surnameInputProps}
                />
              </div>
              <div className="ap-input-container autosuggest-container">
                <label>Имя</label>
                <Autosuggest
                  suggestions={firstNameSuggestions}
                  onSuggestionsFetchRequested={({ value }) => setFirstNameSuggestions(getFirstNameSuggestions(value))}
                  onSuggestionsClearRequested={() => setFirstNameSuggestions([])}
                  getSuggestionValue={s => s}
                  renderSuggestion={s => <div>{s}</div>}
                  inputProps={firstNameInputProps}
                />
              </div>
              <div className="ap-input-container autosuggest-container">
                <label>Отчество</label>
                <Autosuggest
                  suggestions={patronymicSuggestions}
                  onSuggestionsFetchRequested={({ value }) => setPatronymicSuggestions(getPatronymicSuggestions(value))}
                  onSuggestionsClearRequested={() => setPatronymicSuggestions([])}
                  getSuggestionValue={s => s}
                  renderSuggestion={s => <div>{s}</div>}
                  inputProps={patronymicInputProps}
                />
              </div>
            </form>
            {/* Стрелка «Далее» выводится через .ap-top-btn-container */}
          </div>
        );
      }
    } else {
      // Если опрос начат, показываем блок вопросов
      return (
        <div
          className="ap-question-block"
          style={{ opacity: fadeTransition ? 0 : 1, transition: 'opacity 0.4s' }}
        >
          <h2 className="ap-question-text">
            {questions[currentQuestion].question.replace(/^\d+\.\s*/, '')}
          </h2>
          {/* Прогресс-бар и счётчик сверху */}
          <div className="ap-progress-bar-container">
            <div className="ap-progress-bar">
              <div
                className="ap-progress-bar-filled"
                style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
              ></div>
            </div>
            <div className="ap-progress-counter">
              {`${currentQuestion + 1} / ${questions.length}`}
            </div>
          </div>
          <div className="ap-answers-block">
            {shuffledAnswers.map((answer, idx) => (
              <button
                key={idx}
                className={`ap-answer-btn ${selectedAnswer === answer ? 'ap-answer-selected' : ''}`}
                onClick={() => setSelectedAnswer(answer)}
              >
                {answer}
              </button>
            ))}
          </div>
          {errorMessage && <p className="ap-error-message">{errorMessage}</p>}
        </div>
      );
    }
  };

  return (
    <div
      className="ap-container"
      style={{ backgroundImage: `url(${backgroundImage})`, backgroundPositionY: `${offsetY * 0.5}px` }}
    >
      {/* === ЛОГОТИП (абсолютное позиционирование) === */}
      <div className="logo-wrapper animate-logo">
        <img className="poll-logo" src={logo} alt="Логотип" />
      </div>

      {/* === Основной контент (инструкция → ФИО → вопросы → благодарность) === */}
      <div className="ap-content-wrapper">
        {renderMainContent()}
      </div>

      {/* === ФИКСИРОВАННЫЕ КНОПКИ === */}
      {/* Кнопка «Назад» (только когда isStarted=true и текущий вопрос > 0) */}
      {isStarted && currentQuestion > 0 && (
        <div className="ap-back-btn-container">
          <button className="ap-back-btn" onClick={handlePrevQuestion}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
              <path
                d="M12 20l-8-8 8-8"
                fill="none"
                stroke="#fff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Кнопка «Далее» / «Завершить» / «Инструкция→ФИО» */}
      <div className="ap-top-btn-container">
        {/* Если ещё не начали (инструкция) */}
        {!isStarted && showInstruction && (
          <button className="ap-next-btn" onClick={handleInstructionNext}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
              <path
                d="M12 4l8 8-8 8"
                fill="none"
                stroke="#fff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
        {/* Если ФИО-форма */}
        {!isStarted && !showInstruction && (
          <button className="ap-next-btn" onClick={handleStart}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
              <path
                d="M12 4l8 8-8 8"
                fill="none"
                stroke="#fff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
        {/* Когда уже идёт опрос (isStarted=true): либо «Далее» → следующий вопрос, либо «Завершить» */}
        {isStarted && (
          currentQuestion < questions.length - 1 ? (
            <button
              className="ap-next-btn"
              onClick={handleNextQuestion}
              disabled={!selectedAnswer}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                <path
                  d="M12 4l8 8-8 8"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          ) : (
            <button
              className="ap-next-btn finish-btn"
              onClick={() => handleFinish([...userAnswers, selectedAnswer])}
              disabled={!selectedAnswer}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path d="M9 16.17L4.83 12 3.41 13.41 9 19 20 7 18.59 5.59 9 16.17 z" />
              </svg>
            </button>
          )
        )}
      </div>
    </div>
  );
}

export default AssessmentPage;










