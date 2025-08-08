-- Русские вопросы Assessment для существующей структуры базы

-- Очищаем тестовые данные на английском
DELETE FROM question_options WHERE question_id IN (SELECT id FROM questions WHERE questionnaire_id = 1);
DELETE FROM questions WHERE questionnaire_id = 1;

-- Обновляем описание опросника на русском
UPDATE questionnaires SET 
    title = 'Психологическая оценка кандидата',
    description = 'Прочитайте вопросы и выберите вариант ответа, который наиболее точно описывает ваше поведение или отношение к ситуации.'
WHERE id = 1;

-- Вопрос 1
INSERT INTO questions (questionnaire_id, text, order_index, question_type, is_required) VALUES 
(1, 'Какой формат работы вам ближе?', 1, 'multiple_choice', true);

INSERT INTO question_options (question_id, text, order_index, score_type, score_value) VALUES 
((SELECT id FROM questions WHERE questionnaire_id = 1 AND order_index = 1), 'Когда можно детально разобраться в процессах и построить устойчивую систему', 1, 'innovator', 2),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND order_index = 1), 'Когда задачи достаточно разнообразны и требуют гибкого подхода', 2, 'optimizer', 1),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND order_index = 1), 'Когда есть чёткий алгоритм действий и понятный конечный результат', 3, 'executor', 0);

-- Вопрос 2  
INSERT INTO questions (questionnaire_id, text, order_index, question_type, is_required) VALUES 
(1, 'Если коллега допустил серьёзную ошибку, что для вас логичнее сделать?', 2, 'multiple_choice', true);

INSERT INTO question_options (question_id, text, order_index, score_type, score_value) VALUES 
((SELECT id FROM questions WHERE questionnaire_id = 1 AND order_index = 2), 'Понять, что пошло не так, и вместе найти пути исправления', 1, 'innovator', 2),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND order_index = 2), 'В первую очередь скорректировать свои планы с учётом возникших проблем', 2, 'optimizer', 1),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND order_index = 2), 'Сделать выводы для себя и минимизировать влияние на мою работу', 3, 'executor', 0);

-- Вопрос 3
INSERT INTO questions (questionnaire_id, text, order_index, question_type, is_required) VALUES 
(1, 'В команде нарастает напряжение, которое влияет на общий процесс. Как вы реагируете?', 3, 'multiple_choice', true);

INSERT INTO question_options (question_id, text, order_index, score_type, score_value) VALUES 
((SELECT id FROM questions WHERE questionnaire_id = 1 AND order_index = 3), 'Стараюсь выяснить причину и предложить возможные решения, учитывая интересы всех', 1, 'innovator', 2),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND order_index = 3), 'Наблюдаю за развитием ситуации и при необходимости высказываю своё мнение', 2, 'optimizer', 1),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND order_index = 3), 'Предпочитаю не вовлекаться, если это напрямую не затрагивает мою зону ответственности', 3, 'executor', 0);

-- Вопрос 4
INSERT INTO questions (questionnaire_id, text, order_index, question_type, is_required) VALUES 
(1, 'Как относитесь к комментариям по вашей работе?', 4, 'multiple_choice', true);

INSERT INTO question_options (question_id, text, order_index, score_type, score_value) VALUES 
((SELECT id FROM questions WHERE questionnaire_id = 1 AND order_index = 4), 'Считаю их возможностью для развития, если они аргументированы', 1, 'innovator', 2),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND order_index = 4), 'Выслушиваю, но меняю подход только при реальной необходимости', 2, 'optimizer', 1),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND order_index = 4), 'Если работа выполнена по стандартам, дополнительные замечания не критичны', 3, 'executor', 0);

-- Вопрос 5
INSERT INTO questions (questionnaire_id, text, order_index, question_type, is_required) VALUES 
(1, 'Клиент или партнер выражает недовольство результатом. Как поступаете?', 5, 'multiple_choice', true);

INSERT INTO question_options (question_id, text, order_index, score_type, score_value) VALUES 
((SELECT id FROM questions WHERE questionnaire_id = 1 AND order_index = 5), 'Пытаюсь понять, где возникли расхождения, и найти приемлемое решение', 1, 'innovator', 2),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND order_index = 5), 'Сначала оцениваю обоснованность претензий, при необходимости уточняю детали', 2, 'optimizer', 1),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND order_index = 5), 'Если всё сделано согласно договорённостям, считаю, что моя задача выполнена', 3, 'executor', 0);
