#!/usr/bin/env python3
# init_assessment_local.py - Локальная инициализация Assessment базы данных

import logging
import psycopg2

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    """Инициализация Assessment базы данных"""
    try:
        # Подключаемся к локальной БД
        conn = psycopg2.connect(
            host="localhost",
            port=5432,
            user="postgres",
            password="secret",
            database="miniapp"
        )
        
        conn.autocommit = True
        cur = conn.cursor()
        
        logger.info("🔄 Initializing assessment database...")
        
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
                logger.error("❌ assessment_questions.sql not found!")
                return False
                
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
                    
            return True
        else:
            logger.error("❌ Assessment database initialization incomplete")
            return False
        
        conn.close()
        
    except Exception as e:
        logger.error(f"❌ Error initializing assessment database: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = main()
    if not success:
        exit(1)
