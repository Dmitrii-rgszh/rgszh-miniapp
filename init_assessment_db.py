#!/usr/bin/env python3
# init_assessment_db.py - Скрипт для инициализации базы данных Assessment

import os
import sys
import logging
from flask import Flask
from db_saver import init_db, db
from sqlalchemy import text

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_app():
    """Создает Flask приложение для работы с БД"""
    app = Flask(__name__)
    
    # Конфигурация БД из переменных окружения или по умолчанию
    db_uri = (
        os.getenv("SQLALCHEMY_DATABASE_URI") 
        or os.getenv("DATABASE_URL") 
        or "postgresql://username:password@localhost:5432/miniapp_db"
    )
    
    logger.info(f"Connecting to database: {db_uri}")
    app.config["SQLALCHEMY_DATABASE_URI"] = db_uri
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    
    init_db(app)
    return app

def execute_sql_file(filepath):
    """Выполняет SQL скрипт из файла"""
    try:
        with open(filepath, 'r', encoding='utf-8') as file:
            sql_content = file.read()
        
        # Разделяем на отдельные команды по ';'
        commands = [cmd.strip() for cmd in sql_content.split(';') if cmd.strip()]
        
        for command in commands:
            if command:
                try:
                    db.session.execute(text(command))
                    db.session.commit()
                except Exception as e:
                    logger.warning(f"Warning executing command: {e}")
                    db.session.rollback()
        
        logger.info(f"✅ Successfully executed {filepath}")
        
    except Exception as e:
        logger.error(f"❌ Error executing {filepath}: {e}")
        db.session.rollback()
        raise

def init_assessment_database():
    """Инициализирует базу данных для Assessment"""
    app = create_app()
    
    with app.app_context():
        try:
            logger.info("🔧 Initializing Assessment database...")
            
            # 1. Создаем схему таблиц
            logger.info("📋 Creating database schema...")
            execute_sql_file('assessment_schema.sql')
            
            # 2. Заполняем вопросы и варианты ответов
            logger.info("❓ Inserting questions and options...")
            execute_sql_file('assessment_questions.sql')
            
            # 3. Проверяем результат
            logger.info("🔍 Verifying database setup...")
            
            # Проверяем опросники
            result = db.session.execute(text("SELECT COUNT(*) FROM questionnaires"))
            questionnaires_count = result.scalar()
            logger.info(f"📊 Questionnaires: {questionnaires_count}")
            
            # Проверяем вопросы
            result = db.session.execute(text("SELECT COUNT(*) FROM questions WHERE questionnaire_id = 1"))
            questions_count = result.scalar()
            logger.info(f"❓ Questions: {questions_count}")
            
            # Проверяем варианты ответов
            result = db.session.execute(text("""
                SELECT COUNT(*) FROM question_options qo 
                JOIN questions q ON qo.question_id = q.id 
                WHERE q.questionnaire_id = 1
            """))
            options_count = result.scalar()
            logger.info(f"📝 Answer options: {options_count}")
            
            # Проверяем типы личности
            result = db.session.execute(text("SELECT COUNT(*) FROM personality_types"))
            types_count = result.scalar()
            logger.info(f"👤 Personality types: {types_count}")
            
            # Проверяем транскрипции
            result = db.session.execute(text("SELECT COUNT(*) FROM score_transcriptions"))
            transcriptions_count = result.scalar()
            logger.info(f"📜 Score transcriptions: {transcriptions_count}")
            
            logger.info("✅ Assessment database initialization completed successfully!")
            
            # Показываем пример загрузки опросника
            logger.info("🧪 Testing questionnaire loading...")
            result = db.session.execute(text("""
                SELECT q.title, COUNT(qs.id) as questions_count
                FROM questionnaires q
                LEFT JOIN questions qs ON q.id = qs.questionnaire_id
                WHERE q.id = 1
                GROUP BY q.id, q.title
            """))
            
            row = result.fetchone()
            if row:
                logger.info(f"📋 Questionnaire '{row[0]}' has {row[1]} questions")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize database: {e}")
            sys.exit(1)

if __name__ == "__main__":
    logger.info("🚀 Starting Assessment database initialization...")
    
    # Проверяем наличие SQL файлов
    required_files = ['assessment_schema.sql', 'assessment_questions.sql']
    for file in required_files:
        if not os.path.exists(file):
            logger.error(f"❌ Required file not found: {file}")
            logger.info("Please make sure the following files are in the current directory:")
            for f in required_files:
                logger.info(f"  - {f}")
            sys.exit(1)
    
    init_assessment_database()
    logger.info("🎉 All done! Your Assessment database is ready to use.")
    
    # Показываем следующие шаги
    logger.info("\n📝 Next steps:")
    logger.info("1. Start your Flask server: python server.py")
    logger.info("2. Open your React app and test the Assessment questionnaire")
    logger.info("3. Check the assessment_candidates table for saved results")