#!/usr/bin/env python3
# init_assessment_db.py - Исправленная инициализация с миграцией

import os
import sys
import logging
import psycopg2
from urllib.parse import urlparse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def check_and_add_column(cur, table_name, column_name, column_definition):
    """Проверяет существование столбца и добавляет его если нужно"""
    try:
        # Проверяем существование столбца
        cur.execute("""
            SELECT COUNT(*) 
            FROM information_schema.columns 
            WHERE table_name = %s AND column_name = %s
        """, (table_name, column_name))
        
        exists = cur.fetchone()[0] > 0
        
        if not exists:
            # Добавляем столбец
            cur.execute(f"ALTER TABLE {table_name} ADD COLUMN {column_definition}")
            logger.info(f"   ✅ Added column {column_name} to {table_name}")
            return True
        else:
            logger.info(f"   ℹ️ Column {column_name} already exists in {table_name}")
            return False
            
    except Exception as e:
        logger.error(f"   ❌ Error with column {column_name}: {e}")
        return False

def migrate_assessment_candidates(cur):
    """Мигрирует таблицу assessment_candidates для добавления недостающих столбцов"""
    logger.info("🔄 Migrating assessment_candidates table...")
    
    # Проверяем существование таблицы
    cur.execute("""
        SELECT COUNT(*) 
        FROM information_schema.tables 
        WHERE table_name = 'assessment_candidates'
    """)
    
    if cur.fetchone()[0] == 0:
        logger.info("   📋 Table assessment_candidates doesn't exist, will be created")
        return True
    
    # Добавляем недостающие столбцы
    columns_to_add = [
        ("dominant_type", "VARCHAR(20)"),
        ("transcription", "TEXT"),
        ("total_score", "INTEGER DEFAULT 0"),
        ("percentage", "DECIMAL(5,2) DEFAULT 0"),
        ("innovator_score", "INTEGER DEFAULT 0"),
        ("optimizer_score", "INTEGER DEFAULT 0"),
        ("executor_score", "INTEGER DEFAULT 0"),
    ]
    
    for column_name, column_def in columns_to_add:
        check_and_add_column(cur, "assessment_candidates", column_name, column_def)
    
    return True

def main():
    """Основная функция инициализации"""
    try:
        # Получаем URL БД из переменной окружения
        db_url = os.getenv('SQLALCHEMY_DATABASE_URI')
        if not db_url:
            logger.error("❌ SQLALCHEMY_DATABASE_URI not set")
            sys.exit(1)
        
        # Парсим URL
        parsed = urlparse(db_url)
        
        # Подключаемся к БД
        conn = psycopg2.connect(
            host=parsed.hostname,
            port=parsed.port,
            user=parsed.username,
            password=parsed.password,
            database=parsed.path[1:]
        )
        
        conn.autocommit = True
        cur = conn.cursor()
        
        logger.info("🔄 Initializing assessment database...")
        
        # Сначала мигрируем существующие таблицы
        migrate_assessment_candidates(cur)
        
        # Создаем таблицы опросников (если не существуют)
        logger.info("📋 Creating questionnaire tables...")
        
        # Таблица опросников
        cur.execute("""
            CREATE TABLE IF NOT EXISTS questionnaires (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                questions_count INTEGER DEFAULT 0,
                max_time_minutes INTEGER,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Таблица вопросов
        cur.execute("""
            CREATE TABLE IF NOT EXISTS questions (
                id SERIAL PRIMARY KEY,
                questionnaire_id INTEGER REFERENCES questionnaires(id) ON DELETE CASCADE,
                question_order INTEGER NOT NULL,
                question_text TEXT NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Таблица вариантов ответов
        cur.execute("""
            CREATE TABLE IF NOT EXISTS question_options (
                id SERIAL PRIMARY KEY,
                question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
                option_order INTEGER NOT NULL,
                option_text TEXT NOT NULL,
                option_type VARCHAR(50) DEFAULT 'executor',
                score_value INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        logger.info("✅ Questionnaire tables created/verified")
        
        # Проверяем есть ли уже данные
        cur.execute("SELECT COUNT(*) FROM questionnaires WHERE id = 1")
        questionnaire_exists = cur.fetchone()[0] > 0
        
        if not questionnaire_exists:
            logger.info("📝 Populating assessment questionnaire...")
            
            # Добавляем базовый опросник
            cur.execute("""
                INSERT INTO questionnaires (id, title, description, questions_count, max_time_minutes) 
                VALUES (1, 'Психологическая оценка кандидата', 
                       'Прочитайте вопросы и выберите вариант ответа, который наиболее точно описывает ваше поведение или отношение к ситуации.',
                       25, 30)
                ON CONFLICT (id) DO NOTHING
            """)
            
            # Читаем и выполняем SQL с вопросами
            try:
                with open('assessment_questions.sql', 'r', encoding='utf-8') as f:
                    questions_sql = f.read()
                
                logger.info("📝 Adding assessment questions...")
                cur.execute(questions_sql)
                logger.info("✅ Assessment questions added")
                
            except FileNotFoundError:
                logger.warning("⚠️ assessment_questions.sql not found, creating minimal data...")
                
                # Создаем минимальные тестовые данные
                cur.execute("""
                    INSERT INTO questions (questionnaire_id, question_order, question_text) VALUES 
                    (1, 1, 'Какой формат работы вам ближе?');
                    
                    INSERT INTO question_options (question_id, option_order, option_text, option_type, score_value) VALUES 
                    ((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 1), 1, 'Системный подход', 'innovator', 2),
                    ((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 1), 2, 'Гибкий подход', 'optimizer', 1),
                    ((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 1), 3, 'Четкий алгоритм', 'executor', 0);
                """)
                
        else:
            logger.info("ℹ️ Questionnaire data already exists")
        
        # Проверяем результат
        cur.execute("SELECT COUNT(*) FROM questionnaires WHERE id = 1")
        questionnaire_count = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM questions WHERE questionnaire_id = 1")
        questions_count = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM question_options WHERE question_id IN (SELECT id FROM questions WHERE questionnaire_id = 1)")
        options_count = cur.fetchone()[0]
        
        if questionnaire_count > 0:
            logger.info("🎉 Assessment database initialized successfully!")
            logger.info(f"   📋 Questionnaires: {questionnaire_count}")
            logger.info(f"   ❓ Questions: {questions_count}")
            logger.info(f"   📝 Options: {options_count}")
            
            if questions_count > 0:
                # Проверяем структуру первого вопроса
                cur.execute("""
                    SELECT q.question_text, COUNT(qo.id) as options_count
                    FROM questions q
                    LEFT JOIN question_options qo ON q.id = qo.question_id
                    WHERE q.questionnaire_id = 1 AND q.question_order = 1
                    GROUP BY q.id, q.question_text
                """)
                
                first_question = cur.fetchone()
                if first_question:
                    logger.info(f"   📋 First question: {first_question[0][:50]}...")
                    logger.info(f"   📝 Options for first question: {first_question[1]}")
        else:
            logger.error("❌ Assessment database initialization incomplete")
            sys.exit(1)
        
        conn.close()
        
    except Exception as e:
        logger.error(f"❌ Error initializing assessment database: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()