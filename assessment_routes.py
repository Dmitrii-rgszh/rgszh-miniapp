# assessment_routes.py - Маршруты для оценки кандидатов

import logging
from datetime import datetime
from flask import request, jsonify
from assessment_models import (
    AssessmentCandidate, 
    AssessmentAnswer,
    save_assessment_to_db, 
    get_assessment_stats,
    AssessmentCalculator
)

logger = logging.getLogger("assessment_routes")

def register_assessment_routes(app):
    """Регистрирует маршруты для оценки кандидатов"""
    
    @app.route('/api/assessment/save', methods=['POST', 'OPTIONS'])
    def save_assessment():
        """Сохраняет результаты оценки кандидата"""
        logger.info("➜ %s %s", request.method, request.path)
        
        if request.method == "OPTIONS":
            return '', 200

        try:
            payload = request.get_json(force=True)
            logger.info("Assessment payload keys: %s", list(payload.keys()))
            
            # Извлекаем данные
            surname = payload.get('surname', '').strip()
            first_name = payload.get('firstName', '').strip()
            patronymic = payload.get('patronymic', '').strip()
            answers = payload.get('answers', [])
            completion_time = payload.get('completionTimeMinutes')
            session_id = payload.get('sessionId')
            questionnaire_id = payload.get('questionnaireId', 1)  # по умолчанию основной опросник
            
            # Валидация
            if not surname or not first_name:
                return jsonify({"error": "Surname and firstName are required"}), 400
            
            if not answers or len(answers) == 0:
                return jsonify({"error": "Answers are required"}), 400
                
            # Данные вопросов (те же, что в React)
            questions_data = [
                {
                    "question": "1. Какой формат работы вам ближе?",
                    "answers": [
                        "Когда можно детально разобраться в процессах и построить устойчивую систему",
                        "Когда задачи достаточно разнообразны и требуют гибкого подхода",
                        "Когда есть чёткий алгоритм действий и понятный конечный результат"
                    ]
                },
                {
                    "question": "2. Если коллега допустил серьёзную ошибку, что для вас логичнее сделать?",
                    "answers": [
                        "Предложить новый подход, который поможет избежать подобных проблем в будущем",
                        "Помочь исправить ошибку и обсудить, как улучшить процесс",
                        "Указать на проблему и предложить воспользоваться проверенным решением"
                    ]
                },
                {
                    "question": "3. Какой тип обучения кажется вам наиболее эффективным?",
                    "answers": [
                        "Экспериментальный — пробую разные методы и создаю собственные подходы",
                        "Комбинированный — сочетаю изученные техники с практическими экспериментами",
                        "Структурированный — следую проверенным программам и методикам"
                    ]
                },
                {
                    "question": "4. Как воспринимаете неопределённость в рабочих задачах?",
                    "answers": [
                        "Как возможность для творчества и поиска прорывных решений",
                        "Как повод тщательно проанализировать ситуацию и найти оптимальный путь",
                        "Предпочитаю получить дополнительные инструкции, чтобы действовать уверенно"
                    ]
                },
                {
                    "question": "5. Что вас больше мотивирует в работе?",
                    "answers": [
                        "Возможность создать что-то принципиально новое и впечатляющее",
                        "Перспектива улучшить существующие процессы и добиться видимых результатов",
                        "Чёткое понимание задач и стабильность в достижении целей"
                    ]
                },
                {
                    "question": "6. Как относитесь к изменениям в рабочих процессах?",
                    "answers": [
                        "Активно их инициирую, стремясь к максимальной эффективности и новизне",
                        "Поддерживаю, если они обоснованы и приносят реальную пользу",
                        "Принимаю по необходимости, но предпочитаю стабильность проверенных методов"
                    ]
                },
                {
                    "question": "7. Какой стиль принятия решений вам ближе?",
                    "answers": [
                        "Интуитивный — опираюсь на опыт и творческие озарения",
                        "Аналитический — взвешиваю все «за» и «против», ищу баланс",
                        "Систематический — использую чёткие критерии и проверенные алгоритмы"
                    ]
                },
                {
                    "question": "8. Как строите отношения в команде?",
                    "answers": [
                        "Стараюсь вдохновить коллег на смелые идеи и нестандартные решения",
                        "Ищу компромиссы и способы объединить разные точки зрения",
                        "Придерживаюсь профессиональных стандартов и чётких ролей"
                    ]
                },
                {
                    "question": "9. Что делаете, когда сталкиваетесь с критикой своей работы?",
                    "answers": [
                        "Рассматриваю как повод пересмотреть подход и найти ещё более оригинальное решение",
                        "Анализирую обоснованность замечаний и корректирую методы при необходимости",
                        "Учитываю замечания и стараюсь далее следовать установленным стандартам"
                    ]
                },
                {
                    "question": "10. Как планируете свою работу?",
                    "answers": [
                        "Оставляю место для спонтанности и новых идей, планы могут кардинально меняться",
                        "Создаю гибкую структуру, которую можно адаптировать под обстоятельства",
                        "Составляю детальные планы и стараюсь их строго придерживаться"
                    ]
                },
                {
                    "question": "11. Какой подход к профессиональному развитию вам ближе?",
                    "answers": [
                        "Изучаю передовые тренды и экспериментирую с новыми технологиями",
                        "Сочетаю изучение новинок с углублением в уже освоенные области",
                        "Фокусируюсь на совершенствовании в рамках проверенных направлений"
                    ]
                },
                {
                    "question": "12. Как относитесь к риску в профессиональной деятельности?",
                    "answers": [
                        "Готов(а) рисковать ради потенциально выдающихся результатов",
                        "Иду на обоснованный риск, если потенциальная выгода превышает возможные потери",
                        "Предпочитаю минимизировать риски и действовать наверняка"
                    ]
                },
                {
                    "question": "13. Как относитесь к обмену знаниями в команде?",
                    "answers": [
                        "Считаю, что это взаимовыгодный процесс: чем больше делимся, тем сильнее команда",
                        "Готов(а) поделиться опытом, если вижу, что это действительно кому-то полезно",
                        "Каждый занимается своей областью, делиться или нет — решение сугубо личное"
                    ]
                },
                {
                    "question": "14. Что делаете, если замечаете, что используемый процесс устарел?",
                    "answers": [
                        "Изучаю, как его можно обновить, и вношу конкретные предложения",
                        "Предлагаю альтернативы, если вижу в этом реальную пользу",
                        "Если процесс пока работает, значит, радикальные изменения не обязательны"
                    ]
                },
                {
                    "question": "15. Насколько важно для вас идти в ногу с новыми трендами в своей сфере?",
                    "answers": [
                        "Постоянно ищу и пробую инновационные подходы, слежу за профессиональными сообществами",
                        "Изучаю новинки по мере необходимости, когда они могут пригодиться в работе",
                        "Ориентируюсь в основном на проверенные временем технологии"
                    ]
                },
                {
                    "question": "16. Как подходите к решению сложных задач?",
                    "answers": [
                        "Стараюсь рассмотреть задачу под разными углами и привлекаю экспертов при необходимости",
                        "Опираюсь на имеющиеся знания, обращаясь за поддержкой только если это действительно нужно",
                        "Использую знакомые шаблоны, которые уже доказали свою эффективность"
                    ]
                },
                {
                    "question": "17. Как относитесь к критическому анализу своих профессиональных методов?",
                    "answers": [
                        "Считаю, что это естественный путь к росту экспертизы и поиску новых решений",
                        "Прислушиваюсь, если замечания выглядят обоснованными и практичными",
                        "Если метод работает, то лишний анализ может только замедлить процесс"
                    ]
                },
                {
                    "question": "18. Какой тип задач для вас наиболее интересен?",
                    "answers": [
                        "Когда можно глубоко вникнуть и довести методику до высокого уровня",
                        "Когда нужно сочетать проверенные подходы и что-то новое",
                        "Когда есть чёткая инструкция и предсказуемый результат, без лишних экспериментов"
                    ]
                },
                {
                    "question": "19. Как оцениваете качество выполненной работы?",
                    "answers": [
                        "Если результат заметно превосходит обычные ожидания и удивляет заказчика/коллег",
                        "Если всё сделано надёжно, в срок и соответствует ключевым целям",
                        "Если задача решена строго по заданным критериям и нет существенных нареканий"
                    ]
                },
                {
                    "question": "20. Как относитесь к инициативе, выходящей за рамки поставленных задач?",
                    "answers": [
                        "Часто предлагаю идеи, которые могут сделать итог действительно впечатляющим",
                        "Высказываю предложения, когда вижу, что это принесёт реальную пользу",
                        "Предпочитаю не выходить за рамки инструкции, чтобы не рисковать понапрасну"
                    ]
                },
                {
                    "question": "21. Как воспринимаете нестандартные решения?",
                    "answers": [
                        "Это шанс получить новый опыт и порадовать команду или клиентов",
                        "Готов(а) их рассмотреть, если они оправданы и не слишком рискованны",
                        "Предпочитаю проверенные пути, чтобы избежать лишних экспериментов"
                    ]
                },
                {
                    "question": "22. Какую обратную связь по работе вам приятнее всего получать?",
                    "answers": [
                        "Когда говорят, что всё получилось даже лучше, чем ожидали",
                        "Когда отмечают аккуратное, качественное выполнение без ошибок",
                        "Когда просто подтверждают, что всё соответствует заранее установленным требованиям"
                    ]
                },
                {
                    "question": "23. Если видите возможность улучшить процесс, что делаете?",
                    "answers": [
                        "Инициирую изменения, стремясь поднять планку качества и удивить результатом",
                        "Оцениваю плюсы и минусы, предлагаю улучшения, если они действительно востребованы",
                        "Если текущая схема работает стабильно, глобальных перемен обычно не вношу"
                    ]
                },
                {
                    "question": "24. Как относитесь к деталям в работе?",
                    "answers": [
                        "Считаю, что именно нюансы придают результату яркость и особое качество",
                        "Уделяю им внимание, когда это влияет на общее впечатление и удовлетворённость клиентов",
                        "Главное — выполнить работу по основным критериям, не вдаваясь в мелочи"
                    ]
                },
                {
                    "question": "25. Как воспринимаете конечных пользователей или клиентов вашей работы?",
                    "answers": [
                        "Стараюсь удивить их качеством и оригинальностью, чтобы оставить сильное впечатление",
                        "Важно, чтобы они получили то, что нужно, и остались довольны",
                        "Главное — соответствие техническим требованиям и срокам, без лишних нюансов"
                    ]
                }
            ]
            
            # Получаем дополнительную информацию
            user_agent = request.headers.get('User-Agent')
            ip_address = request.environ.get('HTTP_X_FORWARDED_FOR', request.environ.get('REMOTE_ADDR'))
            
            # Сохраняем в БД
            candidate = save_assessment_to_db(
                surname=surname,
                first_name=first_name,
                patronymic=patronymic,
                answers=answers,
                questions_data=questions_data,
                session_id=session_id,
                completion_time=completion_time,
                user_agent=user_agent,
                ip_address=ip_address,
                questionnaire_id=questionnaire_id  # передаем ID опросника
            )
            
            # Возвращаем результат с расчетами
            result = candidate.to_dict()
            result['type_description'] = AssessmentCalculator.get_type_description(
                candidate.dominant_type, 
                candidate.dominant_percentage
            )
            
            logger.info(f"Assessment saved: {candidate.full_name} -> {candidate.dominant_type}")
            return jsonify({
                "status": "success",
                "candidate": result
            }), 200
            
        except Exception as e:
            logger.error("Error saving assessment: %s", e, exc_info=True)
            return jsonify({"error": "Failed to save assessment"}), 500
    
    @app.route('/api/assessment/stats', methods=['GET'])
    def get_stats():
        """Получает статистику по оценкам"""
        try:
            stats = get_assessment_stats()
            return jsonify(stats), 200
        except Exception as e:
            logger.error("Error getting assessment stats: %s", e)
            return jsonify({"error": "Failed to get stats"}), 500
    
    @app.route('/api/assessment/candidates', methods=['GET'])
    def get_candidates():
        """Получает список кандидатов с фильтрацией"""
        try:
            # Параметры запроса
            page = request.args.get('page', 1, type=int)
            per_page = min(request.args.get('per_page', 20, type=int), 100)
            search = request.args.get('search', '').strip()
            type_filter = request.args.get('type', '').strip()
            date_from = request.args.get('date_from')
            date_to = request.args.get('date_to')
            
            # Базовый запрос
            query = AssessmentCandidate.query
            
            # Фильтры
            if search:
                query = query.filter(AssessmentCandidate.full_name.ilike(f'%{search}%'))
            
            if type_filter and type_filter in ['innovator', 'optimizer', 'executor']:
                query = query.filter(AssessmentCandidate.dominant_type == type_filter)
            
            if date_from:
                try:
                    date_from_obj = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
                    query = query.filter(AssessmentCandidate.assessment_date >= date_from_obj)
                except ValueError:
                    pass
            
            if date_to:
                try:
                    date_to_obj = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
                    query = query.filter(AssessmentCandidate.assessment_date <= date_to_obj)
                except ValueError:
                    pass
            
            # Сортировка по дате (новые сначала)
            query = query.order_by(AssessmentCandidate.assessment_date.desc())
            
            # Пагинация
            candidates = query.paginate(
                page=page, 
                per_page=per_page, 
                error_out=False
            )
            
            return jsonify({
                'candidates': [candidate.to_dict() for candidate in candidates.items],
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': candidates.total,
                    'pages': candidates.pages,
                    'has_next': candidates.has_next,
                    'has_prev': candidates.has_prev
                }
            }), 200
            
        except Exception as e:
            logger.error("Error getting candidates: %s", e)
            return jsonify({"error": "Failed to get candidates"}), 500
    
    @app.route('/api/assessment/candidate/<int:candidate_id>', methods=['GET'])
    def get_candidate_details(candidate_id):
        """Получает детальную информацию о кандидате"""
        try:
            candidate = AssessmentCandidate.query.get_or_404(candidate_id)
            
            result = candidate.to_dict()
            result['type_description'] = AssessmentCalculator.get_type_description(
                candidate.dominant_type,
                candidate.dominant_percentage
            )
            
            # Добавляем ответы
            answers = AssessmentAnswer.query.filter_by(candidate_id=candidate_id)\
                .order_by(AssessmentAnswer.question_number).all()
            result['answers'] = [answer.to_dict() for answer in answers]
            
            return jsonify(result), 200
            
        except Exception as e:
            logger.error("Error getting candidate details: %s", e)
            return jsonify({"error": "Candidate not found"}), 404