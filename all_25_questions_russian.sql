-- Оставшиеся 20 вопросов Assessment (6-25) на русском языке

-- Вопрос 6
INSERT INTO questions (questionnaire_id, text, order_index, question_type, is_required) VALUES 
(1, 'Какой рабочий стиль для вас комфортнее?', 6, 'multiple_choice', true);

INSERT INTO question_options (question_id, text, order_index, score_type, score_value) VALUES 
((SELECT id FROM questions WHERE questionnaire_id = 1 AND order_index = 6), 'Выстраивать системные процессы, учитывая интересы всех сторон надолго вперёд', 1, 'innovator', 2),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND order_index = 6), 'Следовать намеченному плану, при необходимости поддерживая взаимодействие', 2, 'optimizer', 1),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND order_index = 6), 'Сосредотачиваться на своих задачах, минимизируя отвлечения на внешние факторы', 3, 'executor', 0);

-- Вопрос 7
INSERT INTO questions (questionnaire_id, text, order_index, question_type, is_required) VALUES 
(1, 'Как вы относитесь к идее поддерживать контакт с бывшими клиентами или коллегами, чтобы в будущем возможно было сотрудничество?', 7, 'multiple_choice', true);

INSERT INTO question_options (question_id, text, order_index, score_type, score_value) VALUES 
((SELECT id FROM questions WHERE questionnaire_id = 1 AND order_index = 7), 'Считаю это важным для выстраивания долгосрочных отношений', 1, 'innovator', 2),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND order_index = 7), 'Можно поддерживать связь, если в этом есть очевидная практическая выгода', 2, 'optimizer', 1),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND order_index = 7), 'Предпочитаю фокусироваться на текущих проектах, не распыляясь на прошлое', 3, 'executor', 0);

-- Вопрос 8
INSERT INTO questions (questionnaire_id, text, order_index, question_type, is_required) VALUES 
(1, 'Если приходится выбирать между краткосрочной выгодой и построением долгосрочных отношений, что окажется важнее?', 8, 'multiple_choice', true);

INSERT INTO question_options (question_id, text, order_index, score_type, score_value) VALUES 
((SELECT id FROM questions WHERE questionnaire_id = 1 AND order_index = 8), 'Долгосрочная перспектива, даже если сейчас придётся чем-то пожертвовать', 1, 'innovator', 2),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND order_index = 8), 'Зависит от ситуации — оцениваю риски, возможности и совокупную пользу', 2, 'optimizer', 1),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND order_index = 8), 'Скорее выберу краткосрочную выгоду, ведь будущее сложно прогнозировать', 3, 'executor', 0);

-- Вопрос 9
INSERT INTO questions (questionnaire_id, text, order_index, question_type, is_required) VALUES 
(1, 'Насколько вы готовы вкладываться в общее развитие и успехи команды?', 9, 'multiple_choice', true);

INSERT INTO question_options (question_id, text, order_index, score_type, score_value) VALUES 
((SELECT id FROM questions WHERE questionnaire_id = 1 AND order_index = 9), 'Считаю важным делиться опытом, помогать коллегам и укреплять общий результат', 1, 'innovator', 2),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND order_index = 9), 'Поддерживаю такие инициативы, если они не мешают моей продуктивности', 2, 'optimizer', 1),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND order_index = 9), 'Сосредотачиваюсь на своей зоне ответственности, дополнительные усилия — опциональны', 3, 'executor', 0);

-- Вопрос 10
INSERT INTO questions (questionnaire_id, text, order_index, question_type, is_required) VALUES 
(1, 'Как относитесь к идее регулярных встреч или мозговых штурмов с коллегами для совершенствования общего процесса?', 10, 'multiple_choice', true);

INSERT INTO question_options (question_id, text, order_index, score_type, score_value) VALUES 
((SELECT id FROM questions WHERE questionnaire_id = 1 AND order_index = 10), 'Считаю это ценным инструментом для укрепления взаимопонимания и улучшения результата', 1, 'innovator', 2),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND order_index = 10), 'Участвую, если уверен(а), что это оправданно и не перегружает рабочее время', 2, 'optimizer', 1),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND order_index = 10), 'Предпочитаю решать задачи в индивидуальном порядке, без лишних обсуждений', 3, 'executor', 0);

-- Вопрос 11
INSERT INTO questions (questionnaire_id, text, order_index, question_type, is_required) VALUES 
(1, 'Как относитесь к повышению квалификации?', 11, 'multiple_choice', true);

INSERT INTO question_options (question_id, text, order_index, score_type, score_value) VALUES 
((SELECT id FROM questions WHERE questionnaire_id = 1 AND order_index = 11), 'Постоянно осваиваю новые инструменты и технологии, чтобы быть в курсе трендов', 1, 'innovator', 2),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND order_index = 11), 'Изучаю что-то новое, когда это действительно нужно для выполнения задач', 2, 'optimizer', 1),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND order_index = 11), 'Считаю, что уже имеющихся знаний обычно достаточно для базовых процессов', 3, 'executor', 0);

-- Вопрос 12
INSERT INTO questions (questionnaire_id, text, order_index, question_type, is_required) VALUES 
(1, 'Как реагируете, когда сталкиваетесь с незнакомой задачей?', 12, 'multiple_choice', true);

INSERT INTO question_options (question_id, text, order_index, score_type, score_value) VALUES 
((SELECT id FROM questions WHERE questionnaire_id = 1 AND order_index = 12), 'С радостью вижу шанс изучить новую область и расширить компетенции', 1, 'innovator', 2),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND order_index = 12), 'Изучаю столько, сколько требуется, чтобы качественно решить задачу', 2, 'optimizer', 1),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND order_index = 12), 'Предпочитаю применять проверенные методы, если они дают нужный результат', 3, 'executor', 0);

-- Вопрос 13
INSERT INTO questions (questionnaire_id, text, order_index, question_type, is_required) VALUES 
(1, 'Как относитесь к обмену знаниями в команде?', 13, 'multiple_choice', true);

INSERT INTO question_options (question_id, text, order_index, score_type, score_value) VALUES 
((SELECT id FROM questions WHERE questionnaire_id = 1 AND order_index = 13), 'Считаю, что это взаимовыгодный процесс: чем больше делимся, тем сильнее команда', 1, 'innovator', 2),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND order_index = 13), 'Готов(а) поделиться опытом, если вижу, что это действительно кому-то полезно', 2, 'optimizer', 1),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND order_index = 13), 'Делюсь информацией, когда об этом просят напрямую', 3, 'executor', 0);

-- Вопрос 14
INSERT INTO questions (questionnaire_id, text, order_index, question_type, is_required) VALUES 
(1, 'Что делаете, если замечаете, что используемый процесс устарел?', 14, 'multiple_choice', true);

INSERT INTO question_options (question_id, text, order_index, score_type, score_value) VALUES 
((SELECT id FROM questions WHERE questionnaire_id = 1 AND order_index = 14), 'Изучаю, как его можно обновить, и вношу конкретные предложения', 1, 'innovator', 2),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND order_index = 14), 'Адаптируюсь к ситуации и работаю с тем, что есть', 2, 'optimizer', 1),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND order_index = 14), 'Если процесс пока работает, значит, радикальные изменения не обязательны', 3, 'executor', 0);

-- Вопрос 15
INSERT INTO questions (questionnaire_id, text, order_index, question_type, is_required) VALUES 
(1, 'Насколько важно для вас идти в ногу с новыми трендами в своей сфере?', 15, 'multiple_choice', true);

INSERT INTO question_options (question_id, text, order_index, score_type, score_value) VALUES 
((SELECT id FROM questions WHERE questionnaire_id = 1 AND order_index = 15), 'Постоянно ищу и пробую инновационные подходы, слежу за профессиональными сообществами', 1, 'innovator', 2),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND order_index = 15), 'Изучаю новинки по мере необходимости, когда они могут пригодиться в работе', 2, 'optimizer', 1),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND order_index = 15), 'Ориентируюсь в основном на проверенные временем технологии', 3, 'executor', 0);

-- Вопрос 16
INSERT INTO questions (questionnaire_id, text, order_index, question_type, is_required) VALUES 
(1, 'Как подходите к решению сложных задач?', 16, 'multiple_choice', true);

INSERT INTO question_options (question_id, text, order_index, score_type, score_value) VALUES 
((SELECT id FROM questions WHERE questionnaire_id = 1 AND order_index = 16), 'Стараюсь рассмотреть задачу под разными углами и привлекаю экспертов при необходимости', 1, 'innovator', 2),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND order_index = 16), 'Опираюсь на имеющиеся знания, обращаясь за поддержкой только если это действительно нужно', 2, 'optimizer', 1),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND order_index = 16), 'Использую знакомые шаблоны, которые уже доказали свою эффективность', 3, 'executor', 0);

-- Вопрос 17
INSERT INTO questions (questionnaire_id, text, order_index, question_type, is_required) VALUES 
(1, 'Как относитесь к критическому анализу своих профессиональных методов?', 17, 'multiple_choice', true);

INSERT INTO question_options (question_id, text, order_index, score_type, score_value) VALUES 
((SELECT id FROM questions WHERE questionnaire_id = 1 AND order_index = 17), 'Считаю, что это естественный путь к росту экспертизы и поиску новых решений', 1, 'innovator', 2),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND order_index = 17), 'Прислушиваюсь, если замечания выглядят обоснованными и практичными', 2, 'optimizer', 1),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND order_index = 17), 'Если метод работает, то лишний анализ может только замедлить процесс', 3, 'executor', 0);

-- Вопрос 18
INSERT INTO questions (questionnaire_id, text, order_index, question_type, is_required) VALUES 
(1, 'Какой тип задач для вас наиболее интересен?', 18, 'multiple_choice', true);

INSERT INTO question_options (question_id, text, order_index, score_type, score_value) VALUES 
((SELECT id FROM questions WHERE questionnaire_id = 1 AND order_index = 18), 'Когда можно глубоко вникнуть и довести методику до высокого уровня', 1, 'innovator', 2),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND order_index = 18), 'Когда нужно сочетать проверенные подходы и что-то новое', 2, 'optimizer', 1),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND order_index = 18), 'Когда есть чёткая инструкция и предсказуемый результат, без лишнего эксперимента', 3, 'executor', 0);

-- Вопрос 19
INSERT INTO questions (questionnaire_id, text, order_index, question_type, is_required) VALUES 
(1, 'Как оцениваете качество выполненной работы?', 19, 'multiple_choice', true);

INSERT INTO question_options (question_id, text, order_index, score_type, score_value) VALUES 
((SELECT id FROM questions WHERE questionnaire_id = 1 AND order_index = 19), 'Если результат заметно превосходит обычные ожидания и удивляет заказчика/коллег', 1, 'innovator', 2),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND order_index = 19), 'Если всё сделано надёжно, в срок и соответствует ключевым целям', 2, 'optimizer', 1),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND order_index = 19), 'Если задача решена строго по заданным критериям и нет существенных нареканий', 3, 'executor', 0);

-- Вопрос 20
INSERT INTO questions (questionnaire_id, text, order_index, question_type, is_required) VALUES 
(1, 'Как относитесь к инициативе, выходящей за рамки поставленных задач?', 20, 'multiple_choice', true);

INSERT INTO question_options (question_id, text, order_index, score_type, score_value) VALUES 
((SELECT id FROM questions WHERE questionnaire_id = 1 AND order_index = 20), 'Часто предлагаю идеи, которые могут сделать итог действительно впечатляющим', 1, 'innovator', 2),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND order_index = 20), 'Высказываю предложения, когда вижу, что это принесёт реальную пользу', 2, 'optimizer', 1),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND order_index = 20), 'Предпочитаю не выходить за рамки инструкции, чтобы не рисковать понапрасну', 3, 'executor', 0);

-- Вопрос 21
INSERT INTO questions (questionnaire_id, text, order_index, question_type, is_required) VALUES 
(1, 'Как воспринимаете нестандартные решения?', 21, 'multiple_choice', true);

INSERT INTO question_options (question_id, text, order_index, score_type, score_value) VALUES 
((SELECT id FROM questions WHERE questionnaire_id = 1 AND order_index = 21), 'Это шанс получить новый опыт и порадовать команду или клиентов', 1, 'innovator', 2),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND order_index = 21), 'Готов(а) их рассмотреть, если они оправданы и не слишком рискованны', 2, 'optimizer', 1),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND order_index = 21), 'Предпочитаю проверенные пути, чтобы избежать лишних экспериментов', 3, 'executor', 0);

-- Вопрос 22
INSERT INTO questions (questionnaire_id, text, order_index, question_type, is_required) VALUES 
(1, 'Какую обратную связь по работе вам приятнее всего получать?', 22, 'multiple_choice', true);

INSERT INTO question_options (question_id, text, order_index, score_type, score_value) VALUES 
((SELECT id FROM questions WHERE questionnaire_id = 1 AND order_index = 22), 'Когда говорят, что всё получилось даже лучше, чем ожидали', 1, 'innovator', 2),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND order_index = 22), 'Когда отмечают аккуратное, качественное выполнение без ошибок', 2, 'optimizer', 1),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND order_index = 22), 'Когда просто подтверждают, что всё соответствует заранее установленным требованиям', 3, 'executor', 0);

-- Вопрос 23
INSERT INTO questions (questionnaire_id, text, order_index, question_type, is_required) VALUES 
(1, 'Если видите возможность улучшить процесс, что делаете?', 23, 'multiple_choice', true);

INSERT INTO question_options (question_id, text, order_index, score_type, score_value) VALUES 
((SELECT id FROM questions WHERE questionnaire_id = 1 AND order_index = 23), 'Инициирую изменения, стремясь поднять планку качества и удивить результатом', 1, 'innovator', 2),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND order_index = 23), 'Оцениваю плюсы и минусы, предлагаю улучшения, если они действительно востребованы', 2, 'optimizer', 1),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND order_index = 23), 'Если текущая схема работает стабильно, глобальных перемен обычно не вношу', 3, 'executor', 0);

-- Вопрос 24
INSERT INTO questions (questionnaire_id, text, order_index, question_type, is_required) VALUES 
(1, 'Как относитесь к деталям в работе?', 24, 'multiple_choice', true);

INSERT INTO question_options (question_id, text, order_index, score_type, score_value) VALUES 
((SELECT id FROM questions WHERE questionnaire_id = 1 AND order_index = 24), 'Считаю, что именно нюансы придают результату яркость и особое качество', 1, 'innovator', 2),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND order_index = 24), 'Уделяю им внимание, когда это влияет на общее впечатление и удовлетворённость клиентов', 2, 'optimizer', 1),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND order_index = 24), 'Главная цель — выполнить работу по основным критериям, не вдаваясь в мелочи', 3, 'executor', 0);

-- Вопрос 25
INSERT INTO questions (questionnaire_id, text, order_index, question_type, is_required) VALUES 
(1, 'Как воспринимаете конечных пользователей или клиентов вашей работы?', 25, 'multiple_choice', true);

INSERT INTO question_options (question_id, text, order_index, score_type, score_value) VALUES 
((SELECT id FROM questions WHERE questionnaire_id = 1 AND order_index = 25), 'Стараюсь удивить их качеством и оригинальностью, чтобы оставить сильное впечатление', 1, 'innovator', 2),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND order_index = 25), 'Важно, чтобы они получили то, что нужно, и остались довольны', 2, 'optimizer', 1),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND order_index = 25), 'Главное — соответствие техническим требованиям и срокам, без лишних нюансов', 3, 'executor', 0);

-- Обновляем количество вопросов в опроснике
UPDATE questionnaires SET questions_count = 25 WHERE id = 1;
