-- assessment_questions.sql - Вопросы с правильной системой баллов (0-1-2)

-- Удаляем существующие вопросы для пересоздания с правильными баллами
DELETE FROM question_options WHERE question_id IN (SELECT id FROM questions WHERE questionnaire_id = 1);
DELETE FROM questions WHERE questionnaire_id = 1;

-- Вопрос 1
INSERT INTO questions (questionnaire_id, question_order, question_text) VALUES 
(1, 1, 'Какой формат работы вам ближе?');

INSERT INTO question_options (question_id, option_order, option_text, option_type, score_value) VALUES 
((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 1), 1, 'Когда можно детально разобраться в процессах и построить устойчивую систему', 'innovator', 2),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 1), 2, 'Когда задачи достаточно разнообразны и требуют гибкого подхода', 'optimizer', 1),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 1), 3, 'Когда есть чёткий алгоритм действий и понятный конечный результат', 'executor', 0);

-- Вопрос 2  
INSERT INTO questions (questionnaire_id, question_order, question_text) VALUES 
(1, 2, 'Если коллега допустил серьёзную ошибку, что для вас логичнее сделать?');

INSERT INTO question_options (question_id, option_order, option_text, option_type, score_value) VALUES 
((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 2), 1, 'Понять, что пошло не так, и вместе найти пути исправления', 'innovator', 2),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 2), 2, 'В первую очередь скорректировать свои планы с учётом возникших проблем', 'optimizer', 1),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 2), 3, 'Сделать выводы для себя и минимизировать влияние на мою работу', 'executor', 0);

-- Вопрос 3
INSERT INTO questions (questionnaire_id, question_order, question_text) VALUES 
(1, 3, 'В команде нарастает напряжение, которое влияет на общий процесс. Как вы реагируете?');

INSERT INTO question_options (question_id, option_order, option_text, option_type, score_value) VALUES 
((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 3), 1, 'Стараюсь выяснить причину и предложить возможные решения, учитывая интересы всех', 'innovator', 2),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 3), 2, 'Наблюдаю за развитием ситуации и при необходимости высказываю своё мнение', 'optimizer', 1),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 3), 3, 'Предпочитаю не вовлекаться, если это напрямую не затрагивает мою зону ответственности', 'executor', 0);

-- Вопрос 4
INSERT INTO questions (questionnaire_id, question_order, question_text) VALUES 
(1, 4, 'Как относитесь к комментариям по вашей работе?');

INSERT INTO question_options (question_id, option_order, option_text, option_type, score_value) VALUES 
((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 4), 1, 'Считаю их возможностью для развития, если они аргументированы', 'innovator', 2),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 4), 2, 'Выслушиваю, но меняю подход только при реальной необходимости', 'optimizer', 1),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 4), 3, 'Если работа выполнена по стандартам, дополнительные замечания не критичны', 'executor', 0);

-- Вопрос 5
INSERT INTO questions (questionnaire_id, question_order, question_text) VALUES 
(1, 5, 'Клиент или партнер выражает недовольство результатом. Как поступаете?');

INSERT INTO question_options (question_id, option_order, option_text, option_type, score_value) VALUES 
((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 5), 1, 'Пытаюсь понять, где возникли расхождения, и найти приемлемое решение', 'innovator', 2),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 5), 2, 'Сначала оцениваю обоснованность претензий, при необходимости уточняю детали', 'optimizer', 1),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 5), 3, 'Если всё сделано согласно договорённостям, считаю, что моя задача выполнена', 'executor', 0);

-- Вопрос 6
INSERT INTO questions (questionnaire_id, question_order, question_text) VALUES 
(1, 6, 'Какой рабочий стиль для вас комфортнее?');

INSERT INTO question_options (question_id, option_order, option_text, option_type, score_value) VALUES 
((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 6), 1, 'Выстраивать системные процессы, учитывая интересы всех сторон надолго вперёд', 'innovator', 2),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 6), 2, 'Следовать намеченному плану, при необходимости поддерживая взаимодействие', 'optimizer', 1),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 6), 3, 'Сосредотачиваться на своих задачах, минимизируя отвлечения на внешние факторы', 'executor', 0);

-- Вопрос 7
INSERT INTO questions (questionnaire_id, question_order, question_text) VALUES 
(1, 7, 'Как вы относитесь к идее поддерживать контакт с бывшими клиентами или коллегами, чтобы в будущем возможно было сотрудничество?');

INSERT INTO question_options (question_id, option_order, option_text, option_type, score_value) VALUES 
((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 7), 1, 'Считаю это важным для выстраивания долгосрочных отношений', 'innovator', 2),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 7), 2, 'Можно поддерживать связь, если в этом есть очевидная практическая выгода', 'optimizer', 1),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 7), 3, 'Предпочитаю фокусироваться на текущих проектах, не распыляясь на прошлое', 'executor', 0);

-- Вопрос 8
INSERT INTO questions (questionnaire_id, question_order, question_text) VALUES 
(1, 8, 'Если приходится выбирать между краткосрочной выгодой и построением долгосрочных отношений, что окажется важнее?');

INSERT INTO question_options (question_id, option_order, option_text, option_type, score_value) VALUES 
((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 8), 1, 'Долгосрочная перспектива, даже если сейчас придётся чем-то пожертвовать', 'innovator', 2),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 8), 2, 'Зависит от ситуации — оцениваю риски, возможности и совокупную пользу', 'optimizer', 1),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 8), 3, 'Скорее выберу краткосрочную выгоду, ведь будущее сложно прогнозировать', 'executor', 0);

-- Вопрос 9
INSERT INTO questions (questionnaire_id, question_order, question_text) VALUES 
(1, 9, 'Насколько вы готовы вкладываться в общее развитие и успехи команды?');

INSERT INTO question_options (question_id, option_order, option_text, option_type, score_value) VALUES 
((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 9), 1, 'Считаю важным делиться опытом, помогать коллегам и укреплять общий результат', 'innovator', 2),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 9), 2, 'Поддерживаю такие инициативы, если они не мешают моей продуктивности', 'optimizer', 1),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 9), 3, 'Сосредотачиваюсь на своей зоне ответственности, дополнительные усилия — опциональны', 'executor', 0);

-- Вопрос 10
INSERT INTO questions (questionnaire_id, question_order, question_text) VALUES 
(1, 10, 'Как относитесь к идее регулярных встреч или мозговых штурмов с коллегами для совершенствования общего процесса?');

INSERT INTO question_options (question_id, option_order, option_text, option_type, score_value) VALUES 
((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 10), 1, 'Считаю это ценным инструментом для укрепления взаимопонимания и улучшения результата', 'innovator', 2),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 10), 2, 'Участвую, если уверен(а), что это оправданно и не перегружает рабочее время', 'optimizer', 1),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 10), 3, 'Предпочитаю решать задачи в индивидуальном порядке, без лишних обсуждений', 'executor', 0);

-- Вопрос 11
INSERT INTO questions (questionnaire_id, question_order, question_text) VALUES 
(1, 11, 'Как относитесь к повышению квалификации?');

INSERT INTO question_options (question_id, option_order, option_text, option_type, score_value) VALUES 
((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 11), 1, 'Постоянно осваиваю новые инструменты и технологии, чтобы быть в курсе трендов', 'innovator', 2),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 11), 2, 'Изучаю что-то новое, когда это действительно нужно для выполнения задач', 'optimizer', 1),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 11), 3, 'Считаю, что уже имеющихся знаний обычно достаточно для базовых процессов', 'executor', 0);

-- Вопрос 12
INSERT INTO questions (questionnaire_id, question_order, question_text) VALUES 
(1, 12, 'Как реагируете, когда сталкиваетесь с незнакомой задачей?');

INSERT INTO question_options (question_id, option_order, option_text, option_type, score_value) VALUES 
((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 12), 1, 'С радостью вижу шанс изучить новую область и расширить компетенции', 'innovator', 2),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 12), 2, 'Изучаю столько, сколько требуется, чтобы качественно решить задачу', 'optimizer', 1),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 12), 3, 'Предпочитаю применять проверенные методы, если они дают нужный результат', 'executor', 0);

-- Вопрос 13
INSERT INTO questions (questionnaire_id, question_order, question_text) VALUES 
(1, 13, 'Как относитесь к обмену знаниями в команде?');

INSERT INTO question_options (question_id, option_order, option_text, option_type, score_value) VALUES 
((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 13), 1, 'Считаю, что это взаимовыгодный процесс: чем больше делимся, тем сильнее команда', 'innovator', 2),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 13), 2, 'Готов(а) поделиться опытом, если вижу, что это действительно кому-то полезно', 'optimizer', 1),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 13), 3, 'Делюсь информацией, когда об этом просят напрямую', 'executor', 0);

-- Вопрос 14
INSERT INTO questions (questionnaire_id, question_order, question_text) VALUES 
(1, 14, 'Что делаете, если замечаете, что используемый процесс устарел?');

INSERT INTO question_options (question_id, option_order, option_text, option_type, score_value) VALUES 
((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 14), 1, 'Изучаю, как его можно обновить, и вношу конкретные предложения', 'innovator', 2),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 14), 2, 'Адаптируюсь к ситуации и работаю с тем, что есть', 'optimizer', 1),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 14), 3, 'Если процесс пока работает, значит, радикальные изменения не обязательны', 'executor', 0);

-- Вопрос 15
INSERT INTO questions (questionnaire_id, question_order, question_text) VALUES 
(1, 15, 'Насколько важно для вас идти в ногу с новыми трендами в своей сфере?');

INSERT INTO question_options (question_id, option_order, option_text, option_type, score_value) VALUES 
((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 15), 1, 'Постоянно ищу и пробую инновационные подходы, слежу за профессиональными сообществами', 'innovator', 2),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 15), 2, 'Изучаю новинки по мере необходимости, когда они могут пригодиться в работе', 'optimizer', 1),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 15), 3, 'Ориентируюсь в основном на проверенные временем технологии', 'executor', 0);

-- Вопрос 16
INSERT INTO questions (questionnaire_id, question_order, question_text) VALUES 
(1, 16, 'Как подходите к решению сложных задач?');

INSERT INTO question_options (question_id, option_order, option_text, option_type, score_value) VALUES 
((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 16), 1, 'Стараюсь рассмотреть задачу под разными углами и привлекаю экспертов при необходимости', 'innovator', 2),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 16), 2, 'Опираюсь на имеющиеся знания, обращаясь за поддержкой только если это действительно нужно', 'optimizer', 1),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 16), 3, 'Использую знакомые шаблоны, которые уже доказали свою эффективность', 'executor', 0);

-- Вопрос 17
INSERT INTO questions (questionnaire_id, question_order, question_text) VALUES 
(1, 17, 'Как относитесь к критическому анализу своих профессиональных методов?');

INSERT INTO question_options (question_id, option_order, option_text, option_type, score_value) VALUES 
((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 17), 1, 'Считаю, что это естественный путь к росту экспертизы и поиску новых решений', 'innovator', 2),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 17), 2, 'Прислушиваюсь, если замечания выглядят обоснованными и практичными', 'optimizer', 1),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 17), 3, 'Если метод работает, то лишний анализ может только замедлить процесс', 'executor', 0);

-- Вопрос 18
INSERT INTO questions (questionnaire_id, question_order, question_text) VALUES 
(1, 18, 'Какой тип задач для вас наиболее интересен?');

INSERT INTO question_options (question_id, option_order, option_text, option_type, score_value) VALUES 
((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 18), 1, 'Когда можно глубоко вникнуть и довести методику до высокого уровня', 'innovator', 2),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 18), 2, 'Когда нужно сочетать проверенные подходы и что-то новое', 'optimizer', 1),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 18), 3, 'Когда есть чёткая инструкция и предсказуемый результат, без лишнего эксперимента', 'executor', 0);

-- Вопрос 19
INSERT INTO questions (questionnaire_id, question_order, question_text) VALUES 
(1, 19, 'Как оцениваете качество выполненной работы?');

INSERT INTO question_options (question_id, option_order, option_text, option_type, score_value) VALUES 
((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 19), 1, 'Если результат заметно превосходит обычные ожидания и удивляет заказчика/коллег', 'innovator', 2),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 19), 2, 'Если всё сделано надёжно, в срок и соответствует ключевым целям', 'optimizer', 1),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 19), 3, 'Если задача решена строго по заданным критериям и нет существенных нареканий', 'executor', 0);

-- Вопрос 20
INSERT INTO questions (questionnaire_id, question_order, question_text) VALUES 
(1, 20, 'Как относитесь к инициативе, выходящей за рамки поставленных задач?');

INSERT INTO question_options (question_id, option_order, option_text, option_type, score_value) VALUES 
((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 20), 1, 'Часто предлагаю идеи, которые могут сделать итог действительно впечатляющим', 'innovator', 2),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 20), 2, 'Высказываю предложения, когда вижу, что это принесёт реальную пользу', 'optimizer', 1),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 20), 3, 'Предпочитаю не выходить за рамки инструкции, чтобы не рисковать понапрасну', 'executor', 0);

-- Вопрос 21
INSERT INTO questions (questionnaire_id, question_order, question_text) VALUES 
(1, 21, 'Как воспринимаете нестандартные решения?');

INSERT INTO question_options (question_id, option_order, option_text, option_type, score_value) VALUES 
((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 21), 1, 'Это шанс получить новый опыт и порадовать команду или клиентов', 'innovator', 2),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 21), 2, 'Готов(а) их рассмотреть, если они оправданы и не слишком рискованны', 'optimizer', 1),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 21), 3, 'Предпочитаю проверенные пути, чтобы избежать лишних экспериментов', 'executor', 0);

-- Вопрос 22
INSERT INTO questions (questionnaire_id, question_order, question_text) VALUES 
(1, 22, 'Какую обратную связь по работе вам приятнее всего получать?');

INSERT INTO question_options (question_id, option_order, option_text, option_type, score_value) VALUES 
((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 22), 1, 'Когда говорят, что всё получилось даже лучше, чем ожидали', 'innovator', 2),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 22), 2, 'Когда отмечают аккуратное, качественное выполнение без ошибок', 'optimizer', 1),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 22), 3, 'Когда просто подтверждают, что всё соответствует заранее установленным требованиям', 'executor', 0);

-- Вопрос 23
INSERT INTO questions (questionnaire_id, question_order, question_text) VALUES 
(1, 23, 'Если видите возможность улучшить процесс, что делаете?');

INSERT INTO question_options (question_id, option_order, option_text, option_type, score_value) VALUES 
((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 23), 1, 'Инициирую изменения, стремясь поднять планку качества и удивить результатом', 'innovator', 2),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 23), 2, 'Оцениваю плюсы и минусы, предлагаю улучшения, если они действительно востребованы', 'optimizer', 1),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 23), 3, 'Если текущая схема работает стабильно, глобальных перемен обычно не вношу', 'executor', 0);

-- Вопрос 24
INSERT INTO questions (questionnaire_id, question_order, question_text) VALUES 
(1, 24, 'Как относитесь к деталям в работе?');

INSERT INTO question_options (question_id, option_order, option_text, option_type, score_value) VALUES 
((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 24), 1, 'Считаю, что именно нюансы придают результату яркость и особое качество', 'innovator', 2),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 24), 2, 'Уделяю им внимание, когда это влияет на общее впечатление и удовлетворённость клиентов', 'optimizer', 1),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 24), 3, 'Главная цель — выполнить работу по основным критериям, не вдаваясь в мелочи', 'executor', 0);

-- Вопрос 25
INSERT INTO questions (questionnaire_id, question_order, question_text) VALUES 
(1, 25, 'Как воспринимаете конечных пользователей или клиентов вашей работы?');

INSERT INTO question_options (question_id, option_order, option_text, option_type, score_value) VALUES 
((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 25), 1, 'Стараюсь удивить их качеством и оригинальностью, чтобы оставить сильное впечатление', 'innovator', 2),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 25), 2, 'Важно, чтобы они получили то, что нужно, и остались довольны', 'optimizer', 1),
((SELECT id FROM questions WHERE questionnaire_id = 1 AND question_order = 25), 3, 'Главное — соответствие техническим требованиям и срокам, без лишних нюансов', 'executor', 0);