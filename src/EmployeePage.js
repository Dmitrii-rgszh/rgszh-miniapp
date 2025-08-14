// EmployeePage.js - С КНОПКАМИ ИНФОРМАЦИИ И МОДАЛЬНЫМИ ОКНАМИ
// ✅ Добавлены квадратные кнопки с иконкой "?"
// ✅ Модальные окна с описанием калькуляторов

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logoImage from './components/logo.png';

import './Styles/logo.css';
import './Styles/BackButton.css';
import './Styles/QRStyles.css'; // Для стилей квадратных кнопок
import './Styles/containers.css';
import './Styles/buttons.css';

const EmployeePage = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({});

  // ===== ДАННЫЕ ПРОДУКТОВ =====
  const products = [
    { 
      to: '/justincase', 
      label: 'На всякий случай', 
      type: 'primary',
      description: {
        title: 'На всякий случай',
        content: 'Накопительное страхование жизни для создания финансовой подушки безопасности. Позволяет накопить капитал и получить страховую защиту от несчастных случаев и болезней.'
      }
    },
    { 
      to: '/snp', 
      label: 'Стратегия на пять.Гарант', 
      type: 'primary',
      description: {
        title: 'Стратегия на пять.Гарант',
        content: 'Инвестиционное страхование жизни с гарантированной доходностью. Позволяет накопить капитал с защитой от инфляции и получить дополнительный доход от инвестиций.'
      }
    },
    { 
      to: '/care-future', 
      label: 'Забота о будущем', 
      type: 'primary',
      description: {
        title: 'Забота о будущем',
        content: 'Накопительное страхование жизни для долгосрочного планирования. Идеально подходит для создания пенсионного капитала или обеспечения будущего детей.'
      }
    }
  ];

  // ===== ОБРАБОТКА КЛИКА ПО КНОПКЕ =====
  const handleClick = (path) => {
    navigate(path);
  };

  // ===== ОБРАБОТКА КНОПКИ "НАЗАД" =====
  const handleBack = () => {
    navigate('/main-menu');
  };

  // ===== ОБРАБОТКА КНОПКИ ИНФОРМАЦИИ =====
  const handleInfoClick = (e, product) => {
    e.stopPropagation();
    setModalContent(product.description);
    setShowModal(true);
  };

  // ===== ЗАКРЫТИЕ МОДАЛЬНОГО ОКНА =====
  const closeModal = () => {
    setShowModal(false);
    setModalContent({});
  };

  // ===== ИНЛАЙН СТИЛИ ДЛЯ МОДАЛЬНОГО ОКНА =====
  const modalStyles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.4)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    },
    content: {
      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.9) 100%)',
      backdropFilter: 'blur(20px)',
      borderRadius: '20px',
      border: '1px solid rgba(255, 255, 255, 0.4)',
      maxWidth: '600px',
      width: '100%',
      maxHeight: '80vh',
      overflowY: 'auto',
      boxShadow: '0 25px 50px rgba(0, 0, 0, 0.2)'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '24px 28px 20px',
      borderBottom: '1px solid rgba(183, 28, 58, 0.15)'
    },
    title: {
      margin: 0,
      color: '#B71C3A',
      fontSize: '24px',
      fontWeight: '700',
      textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
    },
    closeButton: {
      background: 'rgba(183, 28, 58, 0.1)',
      border: 'none',
      fontSize: '28px',
      color: '#B71C3A',
      cursor: 'pointer',
      padding: 0,
      width: '40px',
      height: '40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '50%',
      transition: 'all 0.3s ease',
      fontWeight: 'bold'
    },
    body: {
      padding: '24px 28px 28px'
    },
    text: {
      margin: 0,
      color: '#2c2c2c',
      lineHeight: 1.6,
      fontSize: '18px',
      fontWeight: 400
    }
  };

  return (
    <div className="main-container">
      {/* Логотип */}
      <div className="logo-wrapper animate-logo">
        <img
          src={logoImage}
          alt="Логотип РГС Жизнь"
          className="logo-image"
        />
      </div>
      
      {/* Заголовок и кнопки */}
      <div className="button-container with-logo">
        <h1 className="text-h1 text-center text-white">Выберите продукт для расчета</h1>
        
        {products.map((product) => (
          <div key={product.to} className="poll-row animated">
            {/* Основная кнопка продукта */}
            <button
              className={`btn-universal btn-${product.type} btn-large btn-shadow button-animated`}
              onClick={() => handleClick(product.to)}
            >
              {product.label}
            </button>

            {/* Кнопка информации */}
            <button
              onClick={(e) => handleInfoClick(e, product)}
              className="qr-button info-button"
              title={`Информация о ${product.label}`}
            >
              ?
            </button>
          </div>
        ))}
      </div>

      {/* Модальное окно */}
      {showModal && (
        <div style={modalStyles.overlay} onClick={closeModal}>
          <div style={modalStyles.content} onClick={(e) => e.stopPropagation()}>
            <div style={modalStyles.header}>
              <h2 style={modalStyles.title}>{modalContent.title}</h2>
              <button 
                style={modalStyles.closeButton} 
                onClick={closeModal}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(183, 28, 58, 0.2)';
                  e.target.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(183, 28, 58, 0.1)';
                  e.target.style.transform = 'scale(1)';
                }}
              >
                ×
              </button>
            </div>
            <div style={modalStyles.body}>
              <p style={modalStyles.text}>{modalContent.content}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeePage;
