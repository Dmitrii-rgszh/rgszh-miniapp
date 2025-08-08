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

-- Insert test question (check existing structure first)
INSERT INTO questions (questionnaire_id, question_text, order_num) 
SELECT 1, 'What work format is closer to you?', 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE questionnaire_id = 1 AND order_num = 1);

-- Insert options for the question
INSERT INTO question_options (question_id, option_text, order_num, score_innovator, score_optimizer, score_executor) 
SELECT 
    q.id as question_id,
    'Systematic approach' as option_text,
    1 as order_num,
    2 as score_innovator,
    0 as score_optimizer,
    0 as score_executor
FROM questions q 
WHERE q.questionnaire_id = 1 AND q.order_num = 1
AND NOT EXISTS (SELECT 1 FROM question_options WHERE question_id = q.id AND order_num = 1);

INSERT INTO question_options (question_id, option_text, order_num, score_innovator, score_optimizer, score_executor) 
SELECT 
    q.id as question_id,
    'Flexible approach' as option_text,
    2 as order_num,
    0 as score_innovator,
    2 as score_optimizer,
    0 as score_executor
FROM questions q 
WHERE q.questionnaire_id = 1 AND q.order_num = 1
AND NOT EXISTS (SELECT 1 FROM question_options WHERE question_id = q.id AND order_num = 2);

INSERT INTO question_options (question_id, option_text, order_num, score_innovator, score_optimizer, score_executor) 
SELECT 
    q.id as question_id,
    'Clear algorithm' as option_text,
    3 as order_num,
    0 as score_innovator,
    0 as score_optimizer,
    2 as score_executor
FROM questions q 
WHERE q.questionnaire_id = 1 AND q.order_num = 1
AND NOT EXISTS (SELECT 1 FROM question_options WHERE question_id = q.id AND order_num = 3);
