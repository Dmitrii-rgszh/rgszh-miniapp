# assessment_models.py - Модели БД для оценки кандидатов

import os
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy import Index, text
from flask_sqlalchemy import SQLAlchemy

logger = logging.getLogger("assessment_models")

# Используем существующий db экземпляр из db_saver
from db_saver import db

class AssessmentCandidate(db.Model):
    """Модель для хранения результатов оценки кандидатов"""
    __tablename__ = "assessment_candidates"
    
    # Основные поля
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    
    # Персональные данные
    surname = db.Column(db.String(100), nullable=False, index=True)
    first_name = db.Column(db.String(100), nullable=False)
    patronymic = db.Column(db.String(100), nullable=True)
    full_name = db.Column(db.String(300), nullable=False, index=True)  # для поиска
    
    # Время прохождения
    assessment_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, index=True)
    completion_time_minutes = db.Column(db.Integer, nullable=True)  # время прохождения в минутах
    
    # Результаты по типам личности (баллы от 0 до 25)
    innovator_score = db.Column(db.Integer, nullable=False, default=0)  # Новатор
    optimizer_score = db.Column(db.Integer, nullable=False, default=0)  # Оптимизатор  
    executor_score = db.Column(db.Integer, nullable=False, default=0)   # Исполнитель
    
    # Доминирующий тип личности
    dominant_type = db.Column(db.String(20), nullable=False, index=True)  # 'innovator', 'optimizer', 'executor'
    dominant_percentage = db.Column(db.Float, nullable=False)  # процент доминирующего типа
    
    # Метаданные
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    session_id = db.Column(db.String(128), index=True)  # для группировки сессий
    user_agent = db.Column(db.Text, nullable=True)  # информация о браузере
    ip_address = db.Column(db.String(45), nullable=True)  # IP адрес
    
    # Связь с опросником (добавляем поле)
    questionnaire_id = db.Column(db.Integer, nullable=True, index=True)  # связь с опросником
    
    # Индексы для частых запросов
    __table_args__ = (
        Index('idx_candidate_date_type', 'assessment_date', 'dominant_type'),
        Index('idx_candidate_scores', 'innovator_score', 'optimizer_score', 'executor_score'),
        Index('idx_candidate_name_date', 'full_name', 'assessment_date'),
    )

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Автоматически формируем полное имя
        if self.surname and self.first_name:
            parts = [self.surname, self.first_name]
            if self.patronymic:
                parts.append(self.patronymic)
            self.full_name = ' '.join(parts)

    def to_dict(self) -> Dict[str, Any]:
        """Преобразование в словарь для API"""
        return {
            'id': self.id,
            'surname': self.surname,
            'first_name': self.first_name,
            'patronymic': self.patronymic,
            'full_name': self.full_name,
            'assessment_date': self.assessment_date.isoformat() if self.assessment_date else None,
            'completion_time_minutes': self.completion_time_minutes,
            'scores': {
                'innovator': self.innovator_score,
                'optimizer': self.optimizer_score,
                'executor': self.executor_score
            },
            'dominant_type': self.dominant_type,
            'dominant_percentage': self.dominant_percentage,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'session_id': self.session_id
        }

    def __repr__(self):
        return f'<AssessmentCandidate {self.full_name}: {self.dominant_type} ({self.dominant_percentage:.1f}%)>'

class AssessmentAnswer(db.Model):
    """Модель для хранения ответов на вопросы"""
    __tablename__ = "assessment_answers"
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    candidate_id = db.Column(db.Integer, db.ForeignKey('assessment_candidates.id'), nullable=False, index=True)
    
    # Информация о вопросе и ответе
    question_number = db.Column(db.Integer, nullable=False)  # номер вопроса (1-25)
    question_text = db.Column(db.Text, nullable=False)  # текст вопроса
    answer_text = db.Column(db.Text, nullable=False)  # выбранный ответ
    answer_type = db.Column(db.String(20), nullable=False)  # 'innovator', 'optimizer', 'executor'
    
    # Время ответа
    response_time_seconds = db.Column(db.Float, nullable=True)  # время на ответ в секундах
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Связь с кандидатом
    candidate = db.relationship('AssessmentCandidate', backref=db.backref('answers', lazy=True, cascade='all, delete-orphan'))
    
    # Индексы
    __table_args__ = (
        Index('idx_answer_candidate_question', 'candidate_id', 'question_number'),
        Index('idx_answer_type_date', 'answer_type', 'created_at'),
    )

    def to_dict(self) -> Dict[str, Any]:
        """Преобразование в словарь для API"""
        return {
            'id': self.id,
            'question_number': self.question_number,
            'question_text': self.question_text,
            'answer_text': self.answer_text,
            'answer_type': self.answer_type,
            'response_time_seconds': self.response_time_seconds,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

# Функции для работы с оценками
class AssessmentCalculator:
    """Класс для расчета результатов оценки"""
    
    # Соответствие ответов типам личности
    ANSWER_TYPE_MAPPING = {
        # Первый ответ - Новатор (Innovator) 
        0: 'innovator',
        # Второй ответ - Оптимизатор (Optimizer)
        1: 'optimizer', 
        # Третий ответ - Исполнитель (Executor)
        2: 'executor'
    }
    
    TYPE_NAMES = {
        'innovator': 'Новатор',
        'optimizer': 'Оптимизатор', 
        'executor': 'Исполнитель'
    }
    
    @staticmethod
    def determine_answer_type(question_answers: List[str], selected_answer: str) -> str:
        """Определяет тип ответа на основе позиции в массиве вариантов"""
        try:
            answer_index = question_answers.index(selected_answer)
            return AssessmentCalculator.ANSWER_TYPE_MAPPING.get(answer_index, 'executor')
        except ValueError:
            logger.warning(f"Answer '{selected_answer}' not found in options: {question_answers}")
            return 'executor'  # по умолчанию
    
    @staticmethod
    def calculate_scores(answers: List[str], questions_data: List[Dict]) -> Dict[str, int]:
        """Рассчитывает баллы по типам личности"""
        scores = {'innovator': 0, 'optimizer': 0, 'executor': 0}
        
        for i, answer in enumerate(answers):
            if i < len(questions_data):
                question = questions_data[i]
                answer_type = AssessmentCalculator.determine_answer_type(
                    question.get('answers', []), answer
                )
                scores[answer_type] += 1
        
        return scores
    
    @staticmethod
    def determine_dominant_type(scores: Dict[str, int]) -> tuple:
        """Определяет доминирующий тип личности и его процент"""
        total_score = sum(scores.values())
        if total_score == 0:
            return 'executor', 0.0
        
        dominant_type = max(scores.keys(), key=lambda k: scores[k])
        dominant_score = scores[dominant_type]
        dominant_percentage = (dominant_score / total_score) * 100
        
        return dominant_type, dominant_percentage
    
    @staticmethod
    def get_type_description(type_name: str, percentage: float) -> Dict[str, str]:
        """Возвращает описание типа личности"""
        descriptions = {
            'innovator': {
                'title': 'Новатор',
                'description': 'Вы стремитесь к новшествам и творческим решениям. Любите экспериментировать и искать нестандартные подходы.',
                'traits': ['Креативность', 'Инициативность', 'Готовность к риску', 'Стремление к совершенству']
            },
            'optimizer': {
                'title': 'Оптимизатор', 
                'description': 'Вы фокусируетесь на улучшении существующих процессов и поиске баланса между новизной и стабильностью.',
                'traits': ['Аналитическое мышление', 'Практичность', 'Системный подход', 'Гибкость']
            },
            'executor': {
                'title': 'Исполнитель',
                'description': 'Вы цените стабильность, четкие процедуры и качественное выполнение поставленных задач.',
                'traits': ['Надежность', 'Дисциплинированность', 'Внимание к деталям', 'Ответственность']
            }
        }
        
        result = descriptions.get(type_name, descriptions['executor'])
        result['percentage'] = percentage
        return result

def save_assessment_to_db(
    surname: str,
    first_name: str, 
    patronymic: str,
    answers: List[str],
    questions_data: List[Dict],
    session_id: Optional[str] = None,
    completion_time: Optional[int] = None,
    user_agent: Optional[str] = None,
    ip_address: Optional[str] = None,
    questionnaire_id: Optional[int] = None
) -> AssessmentCandidate:
    """
    Сохраняет результаты оценки в БД
    
    Args:
        surname: Фамилия
        first_name: Имя  
        patronymic: Отчество
        answers: Список ответов пользователя
        questions_data: Данные вопросов с вариантами ответов
        session_id: ID сессии
        completion_time: Время прохождения в минутах
        user_agent: User agent браузера
        ip_address: IP адрес
        
    Returns:
        AssessmentCandidate: Созданная запись кандидата
    """
    try:
        # Рассчитываем баллы
        scores = AssessmentCalculator.calculate_scores(answers, questions_data)
        dominant_type, dominant_percentage = AssessmentCalculator.determine_dominant_type(scores)
        
        # Создаем запись кандидата
        candidate = AssessmentCandidate(
            surname=surname.strip(),
            first_name=first_name.strip(),
            patronymic=patronymic.strip() if patronymic else None,
            assessment_date=datetime.utcnow(),
            completion_time_minutes=completion_time,
            innovator_score=scores['innovator'],
            optimizer_score=scores['optimizer'], 
            executor_score=scores['executor'],
            dominant_type=dominant_type,
            dominant_percentage=dominant_percentage,
            session_id=session_id,
            user_agent=user_agent,
            ip_address=ip_address,
            questionnaire_id=questionnaire_id  # добавляем связь с опросником
        )
        
        db.session.add(candidate)
        db.session.flush()  # Получаем ID кандидата
        
        # Сохраняем ответы
        for i, answer in enumerate(answers):
            if i < len(questions_data):
                question = questions_data[i]
                answer_type = AssessmentCalculator.determine_answer_type(
                    question.get('answers', []), answer
                )
                
                assessment_answer = AssessmentAnswer(
                    candidate_id=candidate.id,
                    question_number=i + 1,
                    question_text=question.get('question', ''),
                    answer_text=answer,
                    answer_type=answer_type
                )
                db.session.add(assessment_answer)
        
        db.session.commit()
        logger.info(f"Assessment saved for {candidate.full_name}: {dominant_type} ({dominant_percentage:.1f}%)")
        return candidate
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error saving assessment: {e}", exc_info=True)
        raise

def get_assessment_stats() -> Dict[str, Any]:
    """Получение статистики по оценкам"""
    try:
        total_count = db.session.query(AssessmentCandidate).count()
        
        # Статистика по типам
        type_stats = db.session.query(
            AssessmentCandidate.dominant_type,
            db.func.count(AssessmentCandidate.id).label('count'),
            db.func.avg(AssessmentCandidate.dominant_percentage).label('avg_percentage')
        ).group_by(AssessmentCandidate.dominant_type).all()
        
        # Средние баллы
        avg_scores = db.session.query(
            db.func.avg(AssessmentCandidate.innovator_score).label('avg_innovator'),
            db.func.avg(AssessmentCandidate.optimizer_score).label('avg_optimizer'),
            db.func.avg(AssessmentCandidate.executor_score).label('avg_executor')
        ).first()
        
        return {
            'total_assessments': total_count,
            'type_distribution': [
                {
                    'type': stat.dominant_type,
                    'count': stat.count,
                    'percentage': (stat.count / total_count * 100) if total_count > 0 else 0,
                    'avg_dominance': round(stat.avg_percentage, 2) if stat.avg_percentage else 0
                }
                for stat in type_stats
            ],
            'average_scores': {
                'innovator': round(avg_scores.avg_innovator, 2) if avg_scores.avg_innovator else 0,
                'optimizer': round(avg_scores.avg_optimizer, 2) if avg_scores.avg_optimizer else 0,
                'executor': round(avg_scores.avg_executor, 2) if avg_scores.avg_executor else 0
            }
        }
    except Exception as e:
        logger.error(f"Error getting assessment stats: {e}")
        return {'error': str(e)}