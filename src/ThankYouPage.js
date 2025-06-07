import React from 'react';
import logo from './components/logo.png';

const ThankYouPage = () => {
  return (
    <div className="thankyou-container">
      <img src={logo} alt="Логотип" className="thankyou-logo" />
      <h1 className="thankyou-title">Спасибо за участие!</h1>
      <p className="thankyou-message">
        Мы благодарны за ваше время и усилия. Ваши ответы помогут нам улучшить качество наших услуг.
      </p>
    </div>
  );
};

export default ThankYouPage;
