#!/usr/bin/env python3
# simple_migrate.py - Упрощенная миграция вопросов в БД

import os
import sys
import logging
from flask import Flask

# Добавляем текущую директорию в sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from db_saver import init_db, db

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_tables():
    """Создает все необходимые таблицы"""
    app = Flask(__name__)
    init_db(app)
    
    with app.app_context():
        try:
            # Создаем таблицы
            db.create_all()
            logger.info("✅ All tables created successfully!")
            
            # Импортируем модели после создания таблиц
            from questionnaire_models import Questionnaire, Question, QuestionOption
            from assessment_models import AssessmentCandidate, AssessmentAnswer
            
            logger.info("✅ Models imported successfully!")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Error creating tables: {e}")
            return False

def create_assessment_questionnaire():
    """Создает основной опросник для Assessment"""
    app = Flask(__name__)
    init_db(app)
    
    with app.app_context():
        try:
            from questionnaire_models import Questionnaire, Question, QuestionOption
            
            # Проверяем, есть ли уже опросник
            existing = db.session.query(Questionnaire).filter_by(title="Оценка кандидата").first()
            if existing:
                logger.info(f"📋 Questionnaire already exists: {existing.title} (ID: {existing.id})")
                return existing.id
            
            # Создаем опросник
            questionnaire = Questionnaire(
                title="Оценка кандидата",
                description="Психологическая оценка личностных качеств кандидата",
                category="assessment",
                created_by="migration_script",
                max_time_minutes=30,
                randomize_questions=False,
                randomize_options=False
            )
            
            db.session.add(questionnaire)
            db.session.flush()  # получаем ID
            
            logger.info(f"✅ Created questionnaire: {questionnaire.title} (ID: {questionnaire.id})")
            
            # Данные 25 вопросов (сокращенная версия для тестирования)
            sample_questions = [
                {
                    "text": "1. Какой формат работы вам ближе?",
                    "options": [
                        {"text": "Когда можно детально разобраться в процессах и построить устойчивую систему", "score_type": "innovator"},
                        {"text": "Когда задачи достаточно разнообразны и требуют гибкого подхода", "score_type": "optimizer"},
                        {"text": "Когда есть чёткий алгоритм действий и понятный конечный результат", "score_type": "executor"}
                    ]
                },
                {
                    "text": "2. Если коллега допустил серьёзную ошибку, что для вас логичнее сделать?",
                    "options": [
                        {"text": "Предложить новый подход, который поможет избежать подобных проблем в будущем", "score_type": "innovator"},
                        {"text": "Помочь исправить ошибку и обсудить, как улучшить процесс", "score_type": "optimizer"},
                        {"text": "Указать на проблему и предложить воспользоваться проверенным решением", "score_type": "executor"}
                    ]
                },
                {
                    "text": "3. Какой тип обучения кажется вам наиболее эффективным?",
                    "options": [
                        {"text": "Экспериментальный — пробую разные методы и создаю собственные подходы", "score_type": "innovator"},
                        {"text": "Комбинированный — сочетаю изученные техники с практическими экспериментами", "score_type": "optimizer"},
                        {"text": "Структурированный — следую проверенным программам и методикам", "score_type": "executor"}
                    ]
                }
            ]
            
            # Добавляем вопросы (сначала только 3 для тестирования)
            for i, q_data in enumerate(sample_questions, 1):
                question = Question(
                    questionnaire_id=questionnaire.id,
                    text=q_data['text'],
                    order_index=i,
                    question_type='single_choice',
                    is_required=True
                )
                
                db.session.add(question)
                db.session.flush()  # получаем ID вопроса
                
                # Добавляем варианты ответов
                for j, option_data in enumerate(q_data['options']):
                    option = QuestionOption(
                        question_id=question.id,
                        text=option_data['text'],
                        order_index=j,
                        score_type=option_data['score_type'],
                        score_value=1
                    )
                    db.session.add(option)
                
                logger.info(f"✅ Added question {i}: {q_data['text'][:50]}...")
            
            db.session.commit()
            logger.info(f"🎉 Successfully created questionnaire with {len(sample_questions)} questions!")
            
            return questionnaire.id
            
        except Exception as e:
            logger.error(f"❌ Error creating questionnaire: {e}")
            db.session.rollback()
            raise

def main():
    """Главная функция"""
    logger.info("🚀 Starting simple migration...")
    
    try:
        # Создаем таблицы
        if not create_tables():
            sys.exit(1)
        
        # Создаем опросник
        questionnaire_id = create_assessment_questionnaire()
        
        logger.info("✅ Migration completed successfully!")
        logger.info(f"🎯 Questionnaire ID: {questionnaire_id}")
        logger.info("📱 Test the API:")
        logger.info(f"   GET /api/questionnaire/{questionnaire_id}")
        
    except Exception as e:
        logger.error(f"❌ Migration failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()