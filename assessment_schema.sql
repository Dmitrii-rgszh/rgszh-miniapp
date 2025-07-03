-- assessment_schema.sql - Схема базы данных для оценки кандидатов

-- Таблица опросников
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

-- Таблица вопросов
CREATE TABLE IF NOT EXISTS questions (
    id SERIAL PRIMARY KEY,
    questionnaire_id INTEGER REFERENCES questionnaires(id) ON DELETE CASCADE,
    question_order INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица вариантов ответов
CREATE TABLE IF NOT EXISTS question_options (
    id SERIAL PRIMARY KEY,
    question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
    option_order INTEGER NOT NULL,
    option_text TEXT NOT NULL,
    option_type VARCHAR(50) DEFAULT 'innovator', -- innovator, optimizer, executor
    score_value INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица кандидатов (результаты)
CREATE TABLE IF NOT EXISTS assessment_candidates (
    id SERIAL PRIMARY KEY,
    questionnaire_id INTEGER REFERENCES questionnaires(id),
    
    -- Персональные данные
    surname VARCHAR(100) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    patronymic VARCHAR(100),
    
    -- Результаты оценки
    total_score INTEGER DEFAULT 0,
    percentage DECIMAL(5,2) DEFAULT 0,
    
    -- Баллы по типам
    innovator_score INTEGER DEFAULT 0,
    optimizer_score INTEGER DEFAULT 0,
    executor_score INTEGER DEFAULT 0,
    
    -- Доминирующий тип
    dominant_type VARCHAR(20), -- innovator, optimizer, executor
    dominant_percentage DECIMAL(5,2) DEFAULT 0,
    
    -- Транскрипция (описание)
    transcription TEXT,
    
    -- Метаданные
    completion_time_minutes INTEGER,
    session_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица ответов кандидатов
CREATE TABLE IF NOT EXISTS candidate_answers (
    id SERIAL PRIMARY KEY,
    candidate_id INTEGER REFERENCES assessment_candidates(id) ON DELETE CASCADE,
    question_id INTEGER REFERENCES questions(id),
    selected_option_id INTEGER REFERENCES question_options(id),
    answer_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица описаний типов личности
CREATE TABLE IF NOT EXISTS personality_types (
    id SERIAL PRIMARY KEY,
    type_name VARCHAR(20) UNIQUE NOT NULL, -- innovator, optimizer, executor
    display_name VARCHAR(50) NOT NULL,
    description TEXT,
    traits JSONB, -- массив ключевых качеств
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица транскрипций (описания результатов по баллам)
CREATE TABLE IF NOT EXISTS score_transcriptions (
    id SERIAL PRIMARY KEY,
    questionnaire_id INTEGER REFERENCES questionnaires(id),
    min_score INTEGER NOT NULL,
    max_score INTEGER NOT NULL,
    transcription_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для оптимизации
CREATE INDEX IF NOT EXISTS idx_questions_questionnaire ON questions(questionnaire_id);
CREATE INDEX IF NOT EXISTS idx_question_options_question ON question_options(question_id);
CREATE INDEX IF NOT EXISTS idx_candidates_questionnaire ON assessment_candidates(questionnaire_id);
CREATE INDEX IF NOT EXISTS idx_candidates_created ON assessment_candidates(created_at);
CREATE INDEX IF NOT EXISTS idx_candidate_answers_candidate ON candidate_answers(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_answers_question ON candidate_answers(question_id);

-- Функция для обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггеры для автоматического обновления updated_at
CREATE TRIGGER update_questionnaires_updated_at BEFORE UPDATE ON questionnaires 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assessment_candidates_updated_at BEFORE UPDATE ON assessment_candidates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Вставляем базовые данные

-- Основной опросник Assessment
INSERT INTO questionnaires (id, title, description, questions_count, max_time_minutes) VALUES 
(1, 'Оценка кандидата', 'Прочитайте вопросы и выберите вариант ответа, который кажется вам наиболее близким. Здесь нет «правильных» или «неправильных» ответов — важно лишь понять ваш естественный стиль работы и взаимодействия.', 25, 15)
ON CONFLICT (id) DO NOTHING;

-- Типы личности
INSERT INTO personality_types (type_name, display_name, description, traits) VALUES 
('innovator', 'Новатор', 'Ориентирован на поиск новых решений, экспериментирование и создание уникальных подходов', 
 '["Стремление к инновациям", "Готовность к экспериментам", "Творческий подход", "Ориентация на развитие"]'::jsonb),
('optimizer', 'Оптимизатор', 'Фокусируется на улучшении существующих процессов и достижении баланса между эффективностью и качеством',
 '["Системное мышление", "Аналитический подход", "Ориентация на результат", "Гибкость в решениях"]'::jsonb),
('executor', 'Исполнитель', 'Концентрируется на точном выполнении задач в соответствии с установленными стандартами и процедурами',
 '["Ответственность", "Надежность", "Следование стандартам", "Стабильность"]'::jsonb)
ON CONFLICT (type_name) DO NOTHING;

-- Транскрипции по баллам (на основе Excel)
INSERT INTO score_transcriptions (questionnaire_id, min_score, max_score, transcription_text) VALUES 
(1, 0, 20, 'Подход кандидата существенно отличается от культуры компании: вероятно, ему близки иные профессиональные приоритеты'),
(1, 21, 30, 'У кандидата иной акцент в работе: он скорее ориентирован на базовые результаты и может быть менее вовлечён в развитие и «вау»-эффект'),
(1, 31, 40, 'Кандидат поддерживает многие принципы, но может нуждаться в адаптации или дополнительных стимулах, чтобы раскрыть потенциал в полной мере'),
(1, 41, 75, 'Кандидат во многом разделяет подходы к долгосрочному партнёрству, стремится к углублённой экспертизе и нередко нацелен на «вау»-эффект')
ON CONFLICT DO NOTHING;