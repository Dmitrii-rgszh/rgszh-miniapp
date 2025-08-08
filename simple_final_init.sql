-- Simple Assessment initialization

-- Insert test question with correct column names
INSERT INTO questions (questionnaire_id, text, order_index, question_type, is_required) 
VALUES (1, 'What work format is closer to you?', 1, 'multiple_choice', true);

-- Get the question ID
DO $$
DECLARE
    question_id_var integer;
BEGIN
    SELECT id INTO question_id_var FROM questions WHERE questionnaire_id = 1 AND order_index = 1;
    
    -- Insert options for the question
    INSERT INTO question_options (question_id, text, order_index, score_type, score_value) VALUES
    (question_id_var, 'Systematic approach', 1, 'innovator', 2),
    (question_id_var, 'Flexible approach', 2, 'optimizer', 2),
    (question_id_var, 'Clear algorithm', 3, 'executor', 2);
END $$;
