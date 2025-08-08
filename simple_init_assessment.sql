-- Simple Assessment Initialization

-- Insert basic questionnaire
INSERT INTO questionnaires (id, title, description, questions_count, max_time_minutes) VALUES 
(1, 'Assessment Questionnaire', 'Please select the best answer that describes your behavior.', 25, 30)
ON CONFLICT (id) DO NOTHING;

-- Insert test question
INSERT INTO questions (questionnaire_id, question_order, question_text) VALUES 
(1, 1, 'What work format is closer to you?')
ON CONFLICT DO NOTHING;

-- Get question ID and insert options
INSERT INTO question_options (question_id, option_order, option_text, option_type, score_value) 
SELECT 
    q.id as question_id,
    1 as option_order,
    'Systematic approach' as option_text,
    'innovator' as option_type,
    2 as score_value
FROM questions q 
WHERE q.questionnaire_id = 1 AND q.question_order = 1;

INSERT INTO question_options (question_id, option_order, option_text, option_type, score_value) 
SELECT 
    q.id as question_id,
    2 as option_order,
    'Flexible approach' as option_text,
    'optimizer' as option_type,
    1 as score_value
FROM questions q 
WHERE q.questionnaire_id = 1 AND q.question_order = 1;

INSERT INTO question_options (question_id, option_order, option_text, option_type, score_value) 
SELECT 
    q.id as question_id,
    3 as option_order,
    'Clear algorithm' as option_text,
    'executor' as option_type,
    0 as score_value
FROM questions q 
WHERE q.questionnaire_id = 1 AND q.question_order = 1;

-- Insert personality types
INSERT INTO personality_types (type_name, display_name, description, traits) VALUES 
('innovator', 'Innovator', 'Focused on new solutions and experiments', '["Innovation", "Experiments", "Creativity"]'::jsonb),
('optimizer', 'Optimizer', 'Focused on improving existing processes', '["Analytics", "Balance", "Efficiency"]'::jsonb),
('executor', 'Executor', 'Focused on precise task execution', '["Responsibility", "Standards", "Stability"]'::jsonb)
ON CONFLICT (type_name) DO NOTHING;
