import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './QuestionsPage.css';

// Пример массива вопросов (без явной нумерации в строках)
const questions = [
  "Как вы оцениваете качество обучения?",
  "Насколько понятны инструкции?",
  "Довольны ли вы материалами?",
  // … добавьте вопросы до 25
];

const QuestionsPage = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const navigate = useNavigate();
  const totalQuestions = 25; // Общее число вопросов

  const handleNextQuestion = () => {
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Если все вопросы пройдены, переходим на страницу благодарности
      navigate('/thankyou');
    }
  };

  return (
    <div className="questions-container">
      <div className="progress-indicator">
        {`${currentQuestion + 1} / ${totalQuestions}`}
      </div>
      <div className="question">
        <p>{questions[currentQuestion] || "Вопрос отсутствует"}</p>
      </div>
      <button onClick={handleNextQuestion} className="next-btn">
        Далее
      </button>
    </div>
  );
};

export default QuestionsPage;
