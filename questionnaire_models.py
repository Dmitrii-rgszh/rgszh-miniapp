# questionnaire_models.py - Модели БД для гибкой системы опросников

import os
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy import Index, text, JSON
from flask_sqlalchemy import SQLAlchemy

logger = logging.getLogger("questionnaire_models")

# Используем существующий db экземпляр из db_saver
from db_saver import db

class Questionnaire(db.Model):
    """Модель для опросников (можно создавать разные типы опросов)"""
    __tablename__ = "questionnaires"
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    
    # Основная информация
    title = db.Column(db.String(200), nullable=False)  # "Оценка кандидата", "Опрос клиентов"
    description = db.Column(db.Text, nullable=True)
    category = db.Column(db.String(50), nullable=False, default='assessment')  # assessment, survey, feedback
    
    # Настройки
    is_active = db.Column(db.Boolean, default=True, index=True)
    version = db.Column(db.String(20), default='1.0')
    max_time_minutes = db.Column(db.Integer, nullable=True)  # максимальное время прохождения
    randomize_questions = db.Column(db.Boolean, default=False)  # перемешивать вопросы
    randomize_options = db.Column(db.Boolean, default=False)   # перемешивать варианты ответов
    
    # Метаданные
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = db.Column(db.String(100), nullable=True)  # кто создал
    
    # Связи
    questions = db.relationship('Question', backref='questionnaire', lazy=True, cascade='all, delete-orphan', order_by='Question.order_index')
    # Убираем проблемную связь responses пока
    
    def to_dict(self, include_questions=False) -> Dict[str, Any]:
        """Преобразование в словарь для API"""
        result = {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'category': self.category,
            'is_active': self.is_active,
            'version': self.version,
            'max_time_minutes': self.max_time_minutes,
            'randomize_questions': self.randomize_questions,
            'randomize_options': self.randomize_options,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'created_by': self.created_by,
            'questions_count': len(self.questions)
        }
        
        if include_questions:
            result['questions'] = [q.to_dict(include_options=True) for q in self.questions]
            
        return result

    def __repr__(self):
        return f'<Questionnaire {self.title} v{self.version}>'

class Question(db.Model):
    """Модель для вопросов"""
    __tablename__ = "questions"
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    questionnaire_id = db.Column(db.Integer, db.ForeignKey('questionnaires.id'), nullable=False, index=True)
    
    # Содержание вопроса
    text = db.Column(db.Text, nullable=False)  # текст вопроса
    description = db.Column(db.Text, nullable=True)  # дополнительное описание
    order_index = db.Column(db.Integer, nullable=False, index=True)  # порядок показа (1, 2, 3...)
    
    # Тип вопроса и настройки
    question_type = db.Column(db.String(30), default='single_choice')  # single_choice, multiple_choice, scale, text
    is_required = db.Column(db.Boolean, default=True)
    
    # Метаданные
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Связи
    options = db.relationship('QuestionOption', backref='question', lazy=True, cascade='all, delete-orphan', order_by='QuestionOption.order_index')
    
    # Индексы
    __table_args__ = (
        Index('idx_question_questionnaire_order', 'questionnaire_id', 'order_index'),
    )
    
    def to_dict(self, include_options=False) -> Dict[str, Any]:
        """Преобразование в словарь для API"""
        result = {
            'id': self.id,
            'questionnaire_id': self.questionnaire_id,
            'text': self.text,
            'description': self.description,
            'order_index': self.order_index,
            'question_type': self.question_type,
            'is_required': self.is_required,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'options_count': len(self.options)
        }
        
        if include_options:
            result['options'] = [opt.to_dict() for opt in self.options]
            
        return result

    def __repr__(self):
        return f'<Question {self.order_index}: {self.text[:50]}...>'

class QuestionOption(db.Model):
    """Модель для вариантов ответов на вопросы"""
    __tablename__ = "question_options"
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    question_id = db.Column(db.Integer, db.ForeignKey('questions.id'), nullable=False, index=True)
    
    # Содержание варианта ответа
    text = db.Column(db.Text, nullable=False)  # текст варианта ответа
    order_index = db.Column(db.Integer, nullable=False)  # порядок показа (0, 1, 2...)
    
    # Настройки для подсчета баллов
    score_type = db.Column(db.String(20), nullable=False)  # 'innovator', 'optimizer', 'executor'
    score_value = db.Column(db.Integer, default=1)  # количество баллов за выбор этого варианта
    
    # Метаданные
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Индексы
    __table_args__ = (
        Index('idx_option_question_order', 'question_id', 'order_index'),
        Index('idx_option_score_type', 'score_type'),
    )
    
    def to_dict(self) -> Dict[str, Any]:
        """Преобразование в словарь для API"""
        return {
            'id': self.id,
            'question_id': self.question_id,
            'text': self.text,
            'order_index': self.order_index,
            'score_type': self.score_type,
            'score_value': self.score_value,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    def __repr__(self):
        return f'<QuestionOption {self.order_index}: {self.text[:30]}... ({self.score_type})>'

# Обновим модель AssessmentCandidate для связи с опросником
def update_assessment_candidate_model():
    """Добавляет связь с опросником в существующую модель AssessmentCandidate"""
    from assessment_models import AssessmentCandidate
    
    # Добавляем поле questionnaire_id в AssessmentCandidate
    # Это нужно сделать через миграцию, но для упрощения добавим здесь
    try:
        # Проверяем, есть ли уже поле questionnaire_id
        if not hasattr(AssessmentCandidate, 'questionnaire_id'):
            AssessmentCandidate.questionnaire_id = db.Column(
                db.Integer, 
                db.ForeignKey('questionnaires.id'), 
                nullable=True,  # делаем nullable для совместимости с существующими записями
                index=True
            )
    except Exception as e:
        logger.warning(f"Could not update AssessmentCandidate model: {e}")

class QuestionnaireStats(db.Model):
    """Модель для хранения статистики по опросникам"""
    __tablename__ = "questionnaire_stats"
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    questionnaire_id = db.Column(db.Integer, db.ForeignKey('questionnaires.id'), nullable=False, index=True)
    
    # Статистика
    total_responses = db.Column(db.Integer, default=0)
    avg_completion_time = db.Column(db.Float, nullable=True)  # среднее время прохождения в минутах
    completion_rate = db.Column(db.Float, nullable=True)  # процент завершенных опросов
    
    # Статистика по типам личности (для assessment опросников)
    innovator_count = db.Column(db.Integer, default=0)
    optimizer_count = db.Column(db.Integer, default=0)
    executor_count = db.Column(db.Integer, default=0)
    
    # Обновление статистики
    last_updated = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, index=True)
    
    def to_dict(self) -> Dict[str, Any]:
        """Преобразование в словарь для API"""
        total = self.total_responses or 1  # избегаем деления на ноль
        
        return {
            'questionnaire_id': self.questionnaire_id,
            'total_responses': self.total_responses,
            'avg_completion_time': self.avg_completion_time,
            'completion_rate': self.completion_rate,
            'type_distribution': {
                'innovator': {
                    'count': self.innovator_count,
                    'percentage': round((self.innovator_count / total) * 100, 1)
                },
                'optimizer': {
                    'count': self.optimizer_count,
                    'percentage': round((self.optimizer_count / total) * 100, 1)
                },
                'executor': {
                    'count': self.executor_count,
                    'percentage': round((self.executor_count / total) * 100, 1)
                }
            },
            'last_updated': self.last_updated.isoformat() if self.last_updated else None
        }

# Функции для работы с опросниками
def create_questionnaire(
    title: str,
    description: str = None,
    category: str = 'assessment',
    created_by: str = None,
    **kwargs
) -> Questionnaire:
    """Создает новый опросник"""
    try:
        questionnaire = Questionnaire(
            title=title,
            description=description,
            category=category,
            created_by=created_by,
            **kwargs
        )
        
        db.session.add(questionnaire)
        db.session.flush()  # получаем ID
        
        # Создаем запись статистики
        stats = QuestionnaireStats(questionnaire_id=questionnaire.id)
        db.session.add(stats)
        
        db.session.commit()
        logger.info(f"Created questionnaire: {questionnaire.title}")
        return questionnaire
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating questionnaire: {e}")
        raise

def add_question_to_questionnaire(
    questionnaire_id: int,
    text: str,
    options: List[Dict[str, Any]],
    order_index: int = None,
    question_type: str = 'single_choice',
    **kwargs
) -> Question:
    """Добавляет вопрос с вариантами ответов в опросник"""
    try:
        if order_index is None:
            # Автоматически определяем порядковый номер
            max_order = db.session.query(db.func.max(Question.order_index))\
                .filter_by(questionnaire_id=questionnaire_id).scalar() or 0
            order_index = max_order + 1
        
        question = Question(
            questionnaire_id=questionnaire_id,
            text=text,
            order_index=order_index,
            question_type=question_type,
            **kwargs
        )
        
        db.session.add(question)
        db.session.flush()  # получаем ID вопроса
        
        # Добавляем варианты ответов
        for i, option_data in enumerate(options):
            option = QuestionOption(
                question_id=question.id,
                text=option_data['text'],
                order_index=i,
                score_type=option_data.get('score_type', 'executor'),
                score_value=option_data.get('score_value', 1)
            )
            db.session.add(option)
        
        db.session.commit()
        logger.info(f"Added question {order_index} to questionnaire {questionnaire_id}")
        return question
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error adding question: {e}")
        raise

def get_questionnaire_with_questions(questionnaire_id: int) -> Optional[Dict[str, Any]]:
    """Получает опросник со всеми вопросами и вариантами ответов"""
    try:
        questionnaire = db.session.query(Questionnaire)\
            .filter_by(id=questionnaire_id, is_active=True)\
            .first()
        
        if not questionnaire:
            return None
        
        result = questionnaire.to_dict(include_questions=True)
        
        # Применяем рандомизацию если нужно
        if questionnaire.randomize_questions:
            import random
            random.shuffle(result['questions'])
        
        if questionnaire.randomize_options:
            import random
            for question in result['questions']:
                if 'options' in question:
                    random.shuffle(question['options'])
        
        return result
        
    except Exception as e:
        logger.error(f"Error getting questionnaire {questionnaire_id}: {e}")
        return None

def update_questionnaire_stats(questionnaire_id: int):
    """Обновляет статистику опросника"""
    try:
        # Импортируем здесь, чтобы избежать циклических импортов
        from assessment_models import AssessmentCandidate
        
        # Получаем статистику ответов
        responses = db.session.query(AssessmentCandidate)\
            .filter_by(questionnaire_id=questionnaire_id).all()
        
        total_responses = len(responses)
        if total_responses == 0:
            return
        
        # Считаем среднее время и распределение типов
        total_time = sum(r.completion_time_minutes for r in responses if r.completion_time_minutes)
        avg_time = total_time / len([r for r in responses if r.completion_time_minutes]) if total_time > 0 else None
        
        type_counts = {
            'innovator': len([r for r in responses if r.dominant_type == 'innovator']),
            'optimizer': len([r for r in responses if r.dominant_type == 'optimizer']),
            'executor': len([r for r in responses if r.dominant_type == 'executor'])
        }
        
        # Обновляем или создаем статистику
        stats = db.session.query(QuestionnaireStats)\
            .filter_by(questionnaire_id=questionnaire_id).first()
        
        if not stats:
            stats = QuestionnaireStats(questionnaire_id=questionnaire_id)
            db.session.add(stats)
        
        stats.total_responses = total_responses
        stats.avg_completion_time = avg_time
        stats.completion_rate = 100.0  # пока считаем что все завершают
        stats.innovator_count = type_counts['innovator']
        stats.optimizer_count = type_counts['optimizer']
        stats.executor_count = type_counts['executor']
        
        db.session.commit()
        logger.info(f"Updated stats for questionnaire {questionnaire_id}")
        
    except Exception as e:
        logger.error(f"Error updating questionnaire stats: {e}")
        db.session.rollback()