#!/usr/bin/env python3
# init_assessment_db.py - Скрипт для инициализации таблиц Assessment

import os
import sys
import logging
from flask import Flask

# Добавляем текущую директорию в sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from db_saver import init_db, db
from assessment_models import AssessmentCandidate, AssessmentAnswer

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_assessment_tables():
    """Инициализирует таблицы для системы оценки кандидатов"""
    
    # Создаем Flask приложение
    app = Flask(__name__)
    
    # Настраиваем базу данных
    init_db(app)
    
    with app.app_context():
        try:
            # Создаем все таблицы
            db.create_all()
            logger.info("✅ Assessment tables created successfully!")
            
            # Проверяем, что таблицы созданы
            from sqlalchemy import inspect
            inspector = inspect(db.engine)
            tables = inspector.get_table_names()
            
            if 'assessment_candidates' in tables:
                logger.info("✅ Table 'assessment_candidates' exists")
            else:
                logger.warning("❌ Table 'assessment_candidates' not found")
                
            if 'assessment_answers' in tables:
                logger.info("✅ Table 'assessment_answers' exists")
            else:
                logger.warning("❌ Table 'assessment_answers' not found")
            
            # Показываем статистику
            candidate_count = db.session.query(AssessmentCandidate).count()
            answer_count = db.session.query(AssessmentAnswer).count()
            
            logger.info(f"📊 Current data:")
            logger.info(f"   - Candidates: {candidate_count}")
            logger.info(f"   - Answers: {answer_count}")
            
        except Exception as e:
            logger.error(f"❌ Error creating tables: {e}")
            raise

def create_sample_data():
    """Создает тестовые данные для демонстрации"""
    app = Flask(__name__)
    init_db(app)
    
    with app.app_context():
        try:
            # Проверяем, есть ли уже данные
            if db.session.query(AssessmentCandidate).count() > 0:
                logger.info("📋 Sample data already exists, skipping creation")
                return
            
            from assessment_models import save_assessment_to_db
            
            # Пример вопросов (упрощенный для демо)
            sample_questions = [
                {
                    "question": "1. Какой формат работы вам ближе?",
                    "answers": [
                        "Новаторский подход",
                        "Сбалансированный подход", 
                        "Структурированный подход"
                    ]
                },
                {
                    "question": "2. Как относитесь к изменениям?",
                    "answers": [
                        "Активно инициирую",
                        "Поддерживаю обоснованные",
                        "Предпочитаю стабильность"
                    ]
                }
            ]
            
            # Создаем тестового кандидата
            sample_candidate = save_assessment_to_db(
                surname="Иванов",
                first_name="Иван",
                patronymic="Иванович",
                answers=["Новаторский подход", "Активно инициирую"],
                questions_data=sample_questions,
                session_id="sample_session_001",
                completion_time=5
            )
            
            logger.info(f"✅ Sample candidate created: {sample_candidate.full_name}")
            logger.info(f"   Type: {sample_candidate.dominant_type} ({sample_candidate.dominant_percentage:.1f}%)")
            
        except Exception as e:
            logger.error(f"❌ Error creating sample data: {e}")
            raise

def show_current_stats():
    """Показывает текущую статистику по оценкам"""
    app = Flask(__name__)
    init_db(app)
    
    with app.app_context():
        try:
            from assessment_models import get_assessment_stats
            
            stats = get_assessment_stats()
            
            logger.info("📊 Current Assessment Statistics:")
            logger.info(f"   Total assessments: {stats.get('total_assessments', 0)}")
            
            if 'type_distribution' in stats:
                logger.info("   Type distribution:")
                for type_stat in stats['type_distribution']:
                    logger.info(f"     - {type_stat['type']}: {type_stat['count']} ({type_stat['percentage']:.1f}%)")
            
            if 'average_scores' in stats:
                logger.info("   Average scores:")
                avg_scores = stats['average_scores']
                logger.info(f"     - Innovator: {avg_scores['innovator']}")
                logger.info(f"     - Optimizer: {avg_scores['optimizer']}")
                logger.info(f"     - Executor: {avg_scores['executor']}")
                
        except Exception as e:
            logger.error(f"❌ Error getting stats: {e}")

def main():
    """Главная функция"""
    logger.info("🚀 Starting Assessment DB initialization...")
    
    try:
        # Инициализируем таблицы
        init_assessment_tables()
        
        # Создаем тестовые данные (опционально)
        create_sample_data()
        
        # Показываем статистику
        show_current_stats()
        
        logger.info("✅ Assessment DB initialization completed successfully!")
        
    except Exception as e:
        logger.error(f"❌ Initialization failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()