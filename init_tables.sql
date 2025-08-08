-- init_tables.sql - Создание таблиц для Assessment

-- Создаем таблицы
CREATE TABLE IF NOT EXISTS questionnaires (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    questions_count INTEGER DEFAULT 0,
    max_time_minutes INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS questions (
    id SERIAL PRIMARY KEY,
    questionnaire_id INTEGER REFERENCES questionnaires(id) ON DELETE CASCADE,
    question_order INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS question_options (
    id SERIAL PRIMARY KEY,
    question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
    option_order INTEGER NOT NULL,
    option_text TEXT NOT NULL,
    option_type VARCHAR(50) DEFAULT 'executor',
    score_value INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Вставляем опросник
INSERT INTO questionnaires (id, title, description, questions_count, max_time_minutes) 
VALUES (1, 'Психологическая оценка кандидата', 
       'Прочитайте вопросы и выберите вариант ответа, который наиболее точно описывает ваше поведение или отношение к ситуации.',
       25, 30)
ON CONFLICT (id) DO NOTHING;

SELECT 'Tables created successfully!' as result;
