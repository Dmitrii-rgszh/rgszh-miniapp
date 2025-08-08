-- 25 русских вопросов для Assessment

-- Очистка
DELETE FROM question_options WHERE question_id IN (SELECT id FROM questions WHERE questionnaire_id = 1);
DELETE FROM questions WHERE questionnaire_id = 1;

-- Вопрос 1
INSERT INTO questions (questionnaire_id, question_text, question_order, description) VALUES 
(1, 'В каких условиях вы лучше всего проявляете себя в работе?', 1, null);

INSERT INTO question_options (question_id, option_text, option_order, option_type, score_value) VALUES 
(currval('questions_id_seq'), 'Когда можно детально разобраться в процессах и построить устойчивую систему', 1, 'innovator', 2),
(currval('questions_id_seq'), 'Когда задачи достаточно разнообразны и требуют гибкого подхода', 2, 'optimizer', 1),
(currval('questions_id_seq'), 'Когда есть чёткий алгоритм действий и понятный конечный результат', 3, 'executor', 0);

-- Вопрос 2
INSERT INTO questions (questionnaire_id, question_text, question_order, description) VALUES 
(1, 'Как вы реагируете на неожиданные изменения в проекте?', 2, null);

INSERT INTO question_options (question_id, option_text, option_order, option_type, score_value) VALUES 
(currval('questions_id_seq'), 'Понять, что пошло не так, и вместе найти пути исправления', 1, 'innovator', 2),
(currval('questions_id_seq'), 'Сделать выводы для себя и минимизировать влияние на мою работу', 2, 'optimizer', 1),
(currval('questions_id_seq'), 'В первую очередь скорректировать свои планы с учётом возникших проблем', 3, 'executor', 0);

-- Вопрос 3
INSERT INTO questions (questionnaire_id, question_text, question_order, description) VALUES 
(1, 'Если коллега критикует ваш подход к задаче, как вы отреагируете?', 3, null);

INSERT INTO question_options (question_id, option_text, option_order, option_type, score_value) VALUES 
(currval('questions_id_seq'), 'Стараюсь выяснить причину и предложить возможные решения, учитывая интересы всех', 1, 'innovator', 2),
(currval('questions_id_seq'), 'Выслушиваю, но меняю подход только при реальной необходимости', 2, 'optimizer', 1),
(currval('questions_id_seq'), 'Предпочитаю не вовлекаться, если это напрямую не затрагивает мою зону ответственности', 3, 'executor', 0);

-- Вопрос 4
INSERT INTO questions (questionnaire_id, question_text, question_order, description) VALUES 
(1, 'Что для вас важнее при получении обратной связи?', 4, null);

INSERT INTO question_options (question_id, option_text, option_order, option_type, score_value) VALUES 
(currval('questions_id_seq'), 'Понять, как улучшить процесс для всех участников в будущем', 1, 'innovator', 2),
(currval('questions_id_seq'), 'Если работа выполнена по стандартам, дополнительные замечания не критичны', 2, 'optimizer', 1),
(currval('questions_id_seq'), 'Узнать, соответствует ли результат первоначальным требованиям', 3, 'executor', 0);

-- Вопрос 5
INSERT INTO questions (questionnaire_id, question_text, question_order, description) VALUES 
(1, 'При работе в команде, где мнения расходятся, вы склонны:', 5, null);

INSERT INTO question_options (question_id, option_text, option_order, option_type, score_value) VALUES 
(currval('questions_id_seq'), 'Искать творческий компромисс, который учтёт потребности каждого', 1, 'innovator', 2),
(currval('questions_id_seq'), 'Пытаюсь понять, где возникли расхождения, и найти приемлемое решение', 2, 'optimizer', 1),
(currval('questions_id_seq'), 'Высказать своё мнение и придерживаться его, если оно обосновано', 3, 'executor', 0);

-- Вопрос 6
INSERT INTO questions (questionnaire_id, question_text, question_order, description) VALUES 
(1, 'Какой рабочий стиль для вас комфортнее?', 6, null);

INSERT INTO question_options (question_id, option_text, option_order, option_type, score_value) VALUES 
(currval('questions_id_seq'), 'Выстраивать системные процессы, учитывая интересы всех сторон надолго вперёд', 1, 'innovator', 2),
(currval('questions_id_seq'), 'Следовать намеченному плану, при необходимости поддерживая взаимодействие', 2, 'optimizer', 1),
(currval('questions_id_seq'), 'Сосредотачиваться на своих задачах, минимизируя отвлечения на внешние факторы', 3, 'executor', 0);

-- Вопрос 7
INSERT INTO questions (questionnaire_id, question_text, question_order, description) VALUES 
(1, 'Как вы относитесь к налаживанию связей с коллегами?', 7, null);

INSERT INTO question_options (question_id, option_text, option_order, option_type, score_value) VALUES 
(currval('questions_id_seq'), 'Считаю это важным для выстраивания долгосрочных отношений', 1, 'innovator', 2),
(currval('questions_id_seq'), 'Поддерживаю контакты в рамках рабочих задач', 2, 'optimizer', 1),
(currval('questions_id_seq'), 'Общаюсь по мере необходимости, когда это требует рабочий процесс', 3, 'executor', 0);

-- Вопрос 8
INSERT INTO questions (questionnaire_id, question_text, question_order, description) VALUES 
(1, 'При планировании проекта что для вас приоритетнее?', 8, null);

INSERT INTO question_options (question_id, option_text, option_order, option_type, score_value) VALUES 
(currval('questions_id_seq'), 'Долгосрочная перспектива, даже если сейчас придётся чем-то пожертвовать', 1, 'innovator', 2),
(currval('questions_id_seq'), 'Сбалансированный подход между краткосрочными и долгосрочными целями', 2, 'optimizer', 1),
(currval('questions_id_seq'), 'Скорее выберу краткосрочную выгоду, ведь будущее сложно прогнозировать', 3, 'executor', 0);

-- Вопрос 9
INSERT INTO questions (questionnaire_id, question_text, question_order, description) VALUES 
(1, 'Как вы относитесь к совместной работе над сложными задачами?', 9, null);

INSERT INTO question_options (question_id, option_text, option_order, option_type, score_value) VALUES 
(currval('questions_id_seq'), 'Считаю важным делиться опытом, помогать коллегам и укреплять общий результат', 1, 'innovator', 2),
(currval('questions_id_seq'), 'Поддерживаю такие инициативы, если они не мешают моей продуктивности', 2, 'optimizer', 1),
(currval('questions_id_seq'), 'Предпочитаю решать задачи самостоятельно, консультируясь при крайней необходимости', 3, 'executor', 0);

-- Вопрос 10
INSERT INTO questions (questionnaire_id, question_text, question_order, description) VALUES 
(1, 'Как вы подходите к участию в корпоративных мероприятиях?', 10, null);

INSERT INTO question_options (question_id, option_text, option_order, option_type, score_value) VALUES 
(currval('questions_id_seq'), 'Считаю это ценным инструментом для укрепления взаимопонимания и улучшения результата', 1, 'innovator', 2),
(currval('questions_id_seq'), 'Участвую, если уверен(а), что это оправданно и не перегружает рабочее время', 2, 'optimizer', 1),
(currval('questions_id_seq'), 'Участвую по мере необходимости, когда присутствие действительно важно', 3, 'executor', 0);

-- Вопрос 11
INSERT INTO questions (questionnaire_id, question_text, question_order, description) VALUES 
(1, 'Когда вы изучаете что-то новое для работы?', 11, null);

INSERT INTO question_options (question_id, option_text, option_order, option_type, score_value) VALUES 
(currval('questions_id_seq'), 'Постоянно ищу возможности для развития, даже если они не связаны с текущими задачами', 1, 'innovator', 2),
(currval('questions_id_seq'), 'Изучаю что-то новое, когда это действительно нужно для выполнения задач', 2, 'optimizer', 1),
(currval('questions_id_seq'), 'Изучаю новое только когда без этого невозможно справиться с задачей', 3, 'executor', 0);

-- Вопрос 12
INSERT INTO questions (questionnaire_id, question_text, question_order, description) VALUES 
(1, 'Как глубоко вы изучаете новую информацию?', 12, null);

INSERT INTO question_options (question_id, option_text, option_order, option_type, score_value) VALUES 
(currval('questions_id_seq'), 'Стараюсь понять систему целиком, включая связи и возможности для улучшения', 1, 'innovator', 2),
(currval('questions_id_seq'), 'Изучаю столько, сколько требуется, чтобы качественно решить задачу', 2, 'optimizer', 1),
(currval('questions_id_seq'), 'Изучаю только то, что напрямую нужно для выполнения конкретной задачи', 3, 'executor', 0);

-- Вопрос 13
INSERT INTO questions (questionnaire_id, question_text, question_order, description) VALUES 
(1, 'Как вы делитесь знаниями с коллегами?', 13, null);

INSERT INTO question_options (question_id, option_text, option_order, option_type, score_value) VALUES 
(currval('questions_id_seq'), 'Активно делюсь знаниями, создаю документацию и обучающие материалы', 1, 'innovator', 2),
(currval('questions_id_seq'), 'Готов(а) поделиться опытом, если вижу, что это действительно кому-то полезно', 2, 'optimizer', 1),
(currval('questions_id_seq'), 'Делюсь информацией, когда об этом просят напрямую', 3, 'executor', 0);

-- Вопрос 14
INSERT INTO questions (questionnaire_id, question_text, question_order, description) VALUES 
(1, 'Как вы относитесь к пересмотру существующих процессов?', 14, null);

INSERT INTO question_options (question_id, option_text, option_order, option_type, score_value) VALUES 
(currval('questions_id_seq'), 'Регулярно анализирую процессы и предлагаю улучшения', 1, 'innovator', 2),
(currval('questions_id_seq'), 'Изучаю, как его можно обновить, и вношу конкретные предложения', 2, 'optimizer', 1),
(currval('questions_id_seq'), 'Если процесс пока работает, значит, радикальные изменения не обязательны', 3, 'executor', 0);

-- Вопрос 15
INSERT INTO questions (questionnaire_id, question_text, question_order, description) VALUES 
(1, 'Как часто вы изучаете новинки в своей области?', 15, null);

INSERT INTO question_options (question_id, option_text, option_order, option_type, score_value) VALUES 
(currval('questions_id_seq'), 'Регулярно слежу за трендами и экспериментирую с новыми подходами', 1, 'innovator', 2),
(currval('questions_id_seq'), 'Изучаю новинки по мере необходимости, когда они могут пригодиться в работе', 2, 'optimizer', 1),
(currval('questions_id_seq'), 'Изучаю новинки, когда они становятся стандартом или требованием', 3, 'executor', 0);

-- Вопрос 16
INSERT INTO questions (questionnaire_id, question_text, question_order, description) VALUES 
(1, 'Когда вы обращаетесь за помощью к коллегам?', 16, null);

INSERT INTO question_options (question_id, option_text, option_order, option_type, score_value) VALUES 
(currval('questions_id_seq'), 'Часто советуюсь с коллегами, чтобы найти лучшие решения и учесть разные точки зрения', 1, 'innovator', 2),
(currval('questions_id_seq'), 'Опираюсь на имеющиеся знания, обращаясь за поддержкой только если это действительно нужно', 2, 'optimizer', 1),
(currval('questions_id_seq'), 'Стараюсь справляться самостоятельно, обращаюсь за помощью в крайнем случае', 3, 'executor', 0);

-- Вопрос 17
INSERT INTO questions (questionnaire_id, question_text, question_order, description) VALUES 
(1, 'Как вы подходите к анализу результатов?', 17, null);

INSERT INTO question_options (question_id, option_text, option_order, option_type, score_value) VALUES 
(currval('questions_id_seq'), 'Провожу глубокий анализ, чтобы понять, что можно улучшить в будущем', 1, 'innovator', 2),
(currval('questions_id_seq'), 'Анализирую результат с точки зрения соответствия поставленным целям', 2, 'optimizer', 1),
(currval('questions_id_seq'), 'Если метод работает, то лишний анализ может только замедлить процесс', 3, 'executor', 0);

-- Вопрос 18
INSERT INTO questions (questionnaire_id, question_text, question_order, description) VALUES 
(1, 'В каких ситуациях вы чувствуете себя наиболее продуктивно?', 18, null);

INSERT INTO question_options (question_id, option_text, option_order, option_type, score_value) VALUES 
(currval('questions_id_seq'), 'Когда есть возможность экспериментировать и внедрять новые идеи', 1, 'innovator', 2),
(currval('questions_id_seq'), 'Когда нужно сочетать проверенные подходы и что-то новое', 2, 'optimizer', 1),
(currval('questions_id_seq'), 'Когда задачи понятны и есть план их выполнения', 3, 'executor', 0);

-- Вопрос 19
INSERT INTO questions (questionnaire_id, question_text, question_order, description) VALUES 
(1, 'Что означает для вас "успешно выполненная работа"?', 19, null);

INSERT INTO question_options (question_id, option_text, option_order, option_type, score_value) VALUES 
(currval('questions_id_seq'), 'Если результат заметно превосходит обычные ожидания и удивляет заказчика/коллег', 1, 'innovator', 2),
(currval('questions_id_seq'), 'Если работа выполнена качественно, в срок и соответствует всем требованиям', 2, 'optimizer', 1),
(currval('questions_id_seq'), 'Если задача решена строго по заданным критериям и нет существенных нареканий', 3, 'executor', 0);

-- Вопрос 20
INSERT INTO questions (questionnaire_id, question_text, question_order, description) VALUES 
(1, 'Как вы относитесь к предложениям по улучшению?', 20, null);

INSERT INTO question_options (question_id, option_text, option_order, option_type, score_value) VALUES 
(currval('questions_id_seq'), 'Часто предлагаю идеи, которые могут сделать итог действительно впечатляющим', 1, 'innovator', 2),
(currval('questions_id_seq'), 'Вношу предложения, когда вижу конкретные возможности для оптимизации', 2, 'optimizer', 1),
(currval('questions_id_seq'), 'Предпочитаю не выходить за рамки инструкции, чтобы не рисковать понапрасну', 3, 'executor', 0);

-- Вопрос 21
INSERT INTO questions (questionnaire_id, question_text, question_order, description) VALUES 
(1, 'Какие изменения в рабочем процессе вы готовы поддержать?', 21, null);

INSERT INTO question_options (question_id, option_text, option_order, option_type, score_value) VALUES 
(currval('questions_id_seq'), 'Готов(а) к кардинальным изменениям, если они принесут долгосрочную пользу', 1, 'innovator', 2),
(currval('questions_id_seq'), 'Готов(а) их рассмотреть, если они оправданы и не слишком рискованны', 2, 'optimizer', 1),
(currval('questions_id_seq'), 'Предпочитаю постепенные улучшения, а не резкие изменения', 3, 'executor', 0);

-- Вопрос 22
INSERT INTO questions (questionnaire_id, question_text, question_order, description) VALUES 
(1, 'Какая обратная связь вас больше мотивирует?', 22, null);

INSERT INTO question_options (question_id, option_text, option_order, option_type, score_value) VALUES 
(currval('questions_id_seq'), 'Когда говорят, что результат превзошёл ожидания и вдохновил на новые идеи', 1, 'innovator', 2),
(currval('questions_id_seq'), 'Когда говорят, что всё получилось даже лучше, чем ожидали', 2, 'optimizer', 1),
(currval('questions_id_seq'), 'Когда просто подтверждают, что всё соответствует заранее установленным требованиям', 3, 'executor', 0);

-- Вопрос 23
INSERT INTO questions (questionnaire_id, question_text, question_order, description) VALUES 
(1, 'Как часто вы вносите изменения в привычные процессы?', 23, null);

INSERT INTO question_options (question_id, option_text, option_order, option_type, score_value) VALUES 
(currval('questions_id_seq'), 'Постоянно ищу способы улучшить и оптимизировать рабочие процессы', 1, 'innovator', 2),
(currval('questions_id_seq'), 'Вношу изменения, когда вижу явные возможности для улучшения', 2, 'optimizer', 1),
(currval('questions_id_seq'), 'Если текущая схема работает стабильно, глобальных перемен обычно не вношу', 3, 'executor', 0);

-- Вопрос 24
INSERT INTO questions (questionnaire_id, question_text, question_order, description) VALUES 
(1, 'Что для вас важнее в работе?', 24, null);

INSERT INTO question_options (question_id, option_text, option_order, option_type, score_value) VALUES 
(currval('questions_id_seq'), 'Возможность создавать что-то новое и влиять на развитие процессов', 1, 'innovator', 2),
(currval('questions_id_seq'), 'Достижение высокого качества при сохранении эффективности', 2, 'optimizer', 1),
(currval('questions_id_seq'), 'Главная цель — выполнить работу по основным критериям, не вдаваясь в мелочи', 3, 'executor', 0);

-- Вопрос 25
INSERT INTO questions (questionnaire_id, question_text, question_order, description) VALUES 
(1, 'На что вы больше обращаете внимание при завершении проекта?', 25, null);

INSERT INTO question_options (question_id, option_text, option_order, option_type, score_value) VALUES 
(currval('questions_id_seq'), 'Стараюсь удивить их качеством и оригинальностью, чтобы оставить сильное впечатление', 1, 'innovator', 2),
(currval('questions_id_seq'), 'Уделяю им внимание, когда это влияет на общее впечатление и удовлетворённость клиентов', 2, 'optimizer', 1),
(currval('questions_id_seq'), 'Главное — соответствие техническим требованиям и срокам, без лишних нюансов', 3, 'executor', 0);

-- Обновление счетчика вопросов
UPDATE questionnaires SET questions_count = 25 WHERE id = 1;
