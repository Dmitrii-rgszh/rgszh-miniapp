-- Assessment initialization for existing schema

-- Insert questionnaire with correct columns
INSERT INTO questionnaires (id, title, description, category, is_active, max_time_minutes) VALUES 
(1, 'Assessment Questionnaire', 'Please select the best answer that describes your behavior.', 'assessment', true, 30)
ON CONFLICT (id) DO UPDATE SET 
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    is_active = EXCLUDED.is_active,
    max_time_minutes = EXCLUDED.max_time_minutes;

-- Insert test question with correct column names
INSERT INTO questions (questionnaire_id, text, order_index, question_type, is_required) 
VALUES (1, 'What work format is closer to you?', 1, 'multiple_choice', true)
ON CONFLICT (questionnaire_id, order_index) DO UPDATE SET
    text = EXCLUDED.text,
    question_type = EXCLUDED.question_type,
    is_required = EXCLUDED.is_required;

-- Insert options for the question with correct column names
INSERT INTO question_options (question_id, text, order_index, score_type, score_value) 
SELECT 
    q.id as question_id,
    'Systematic approach' as text,
    1 as order_index,
    'innovator' as score_type,
    2 as score_value
FROM questions q 
WHERE q.questionnaire_id = 1 AND q.order_index = 1
ON CONFLICT (question_id, order_index) DO UPDATE SET
    text = EXCLUDED.text,
    score_type = EXCLUDED.score_type,
    score_value = EXCLUDED.score_value;

INSERT INTO question_options (question_id, text, order_index, score_type, score_value) 
SELECT 
    q.id as question_id,
    'Flexible approach' as text,
    2 as order_index,
    'optimizer' as score_type,
    2 as score_value
FROM questions q 
WHERE q.questionnaire_id = 1 AND q.order_index = 1
ON CONFLICT (question_id, order_index) DO UPDATE SET
    text = EXCLUDED.text,
    score_type = EXCLUDED.score_type,
    score_value = EXCLUDED.score_value;

INSERT INTO question_options (question_id, text, order_index, score_type, score_value) 
SELECT 
    q.id as question_id,
    'Clear algorithm' as text,
    3 as order_index,
    'executor' as score_type,
    2 as score_value
FROM questions q 
WHERE q.questionnaire_id = 1 AND q.order_index = 1
ON CONFLICT (question_id, order_index) DO UPDATE SET
    text = EXCLUDED.text,
    score_type = EXCLUDED.score_type,
    score_value = EXCLUDED.score_value;
