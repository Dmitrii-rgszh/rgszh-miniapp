# assessment_routes.py - Обновленные API маршруты с правильной системой баллов

import logging
from datetime import datetime
from flask import request, jsonify
from sqlalchemy import text
from db_saver import db

logger = logging.getLogger("assessment_routes")

def register_assessment_routes(app):
    """Регистрирует маршруты для оценки кандидатов"""
    
    @app.route('/api/questionnaire/<int:questionnaire_id>', methods=['GET'])
    def get_questionnaire(questionnaire_id):
        """Получение опросника с вопросами"""
        try:
            include_questions = request.args.get('include_questions', 'false').lower() == 'true'
            
            # Получаем опросник
            query = text("""
                SELECT id, title, description, questions_count, max_time_minutes, is_active
                FROM questionnaires 
                WHERE id = :questionnaire_id AND is_active = true
            """)
            
            result = db.session.execute(query, {"questionnaire_id": questionnaire_id})
            questionnaire = result.fetchone()
            
            if not questionnaire:
                return jsonify({"error": "Questionnaire not found"}), 404
            
            questionnaire_data = {
                "id": questionnaire.id,
                "title": questionnaire.title,
                "description": questionnaire.description,
                "questions_count": questionnaire.questions_count,
                "max_time_minutes": questionnaire.max_time_minutes,
                "is_active": questionnaire.is_active
            }
            
            # Если нужны вопросы, загружаем их
            if include_questions:
                questions_query = text("""
                    SELECT q.id, q.question_order, q.question_text, q.description,
                           qo.id as option_id, qo.option_order, qo.option_text, 
                           qo.option_type, qo.score_value
                    FROM questions q
                    LEFT JOIN question_options qo ON q.id = qo.question_id
                    WHERE q.questionnaire_id = :questionnaire_id
                    ORDER BY q.question_order, qo.option_order
                """)
                
                questions_result = db.session.execute(questions_query, {"questionnaire_id": questionnaire_id})
                
                questions_dict = {}
                for row in questions_result:
                    q_id = row.id
                    if q_id not in questions_dict:
                        questions_dict[q_id] = {
                            "id": row.id,
                            "order_number": row.question_order,
                            "text": row.question_text,
                            "description": row.description,
                            "options": []
                        }
                    
                    if row.option_id:
                        questions_dict[q_id]["options"].append({
                            "id": row.option_id,
                            "order_number": row.option_order,
                            "text": row.option_text,
                            "type": row.option_type,
                            "score_value": row.score_value
                        })
                
                questionnaire_data["questions"] = list(questions_dict.values())
            
            return jsonify(questionnaire_data), 200
            
        except Exception as e:
            logger.error(f"Error getting questionnaire {questionnaire_id}: {e}")
            return jsonify({"error": "Internal server error"}), 500
    
    @app.route('/api/assessment/save', methods=['POST', 'OPTIONS'])
    def save_assessment():
        """Сохранение результатов оценки кандидата с обновленной системой баллов"""
        logger.info("➜ %s %s", request.method, request.path)
        
        if request.method == "OPTIONS":
            return '', 200
        
        try:
            data = request.get_json()
            logger.info("   payload keys: %s", list(data.keys()))
            
            # Валидация входных данных (убрали questionnaireId из обязательных)
            required_fields = ['surname', 'firstName', 'patronymic', 'answers']
            for field in required_fields:
                if not data.get(field):
                    return jsonify({"error": f"Missing required field: {field}"}), 400
            
            # Вычисляем баллы по новой системе (0-1-2 балла за ответ)
            total_score = calculate_total_score(data['answers'])
            if total_score is None:
                return jsonify({"error": "Failed to calculate scores"}), 500
            
            # Определяем доминирующий тип
            type_scores = calculate_type_scores(data['answers'])
            dominant_type = max(type_scores, key=type_scores.get)
            
            # Получаем транскрипцию по общему баллу
            transcription = get_transcription_by_score(total_score)
            
            # Сохраняем кандидата (БЕЗ questionnaireId, dominant_percentage, session_id)
            candidate_query = text("""
                INSERT INTO assessment_candidates 
                (surname, first_name, patronymic, total_score, percentage,
                 innovator_score, optimizer_score, executor_score, dominant_type, 
                 transcription, completion_time_minutes)
                VALUES (:surname, :first_name, :patronymic, :total_score, 
                        :percentage, :innovator_score, :optimizer_score, :executor_score, 
                        :dominant_type, :transcription, :completion_time_minutes)
                RETURNING id
            """)
            
            # Процент от максимума (50 баллов)
            percentage = (total_score / 50.0 * 100) if total_score > 0 else 0
            
            candidate_result = db.session.execute(candidate_query, {
                "surname": data['surname'],
                "first_name": data['firstName'],
                "patronymic": data['patronymic'],
                "total_score": total_score,
                "percentage": percentage,
                "innovator_score": type_scores['innovator'],
                "optimizer_score": type_scores['optimizer'],
                "executor_score": type_scores['executor'],
                "dominant_type": dominant_type,
                "transcription": transcription,
                "completion_time_minutes": data.get('completionTimeMinutes', 0)
            })
            
            candidate_id = candidate_result.fetchone()[0]
            
            # Сохраняем ответы
            for answer_text in data['answers']:
                # Находим option_id по тексту ответа
                option_query = text("""
                    SELECT qo.id, q.id as question_id FROM question_options qo
                    JOIN questions q ON qo.question_id = q.id
                    WHERE q.questionnaire_id = 1 
                    AND qo.option_text = :answer_text
                    LIMIT 1
                """)
                
                option_result = db.session.execute(option_query, {
                    "answer_text": answer_text
                })
                
                option_row = option_result.fetchone()
                if option_row:
                    answer_query = text("""
                        INSERT INTO candidate_answers 
                        (candidate_id, question_id, selected_option_id, answer_text)
                        VALUES (:candidate_id, :question_id, :selected_option_id, :answer_text)
                    """)
                    
                    db.session.execute(answer_query, {
                        "candidate_id": candidate_id,
                        "question_id": option_row.question_id,
                        "selected_option_id": option_row.id,
                        "answer_text": answer_text
                    })
            
            db.session.commit()
            
            # Формируем ответ (упрощенный, без детальных результатов)
            result = {
                "candidate": {
                    "id": candidate_id,
                    "surname": data['surname'],
                    "firstName": data['firstName'],
                    "patronymic": data['patronymic'],
                    "total_score": total_score,
                    "percentage": percentage,
                    "dominant_type": dominant_type,
                    "transcription": transcription
                }
            }
            
            logger.info(f"✅ Assessment saved for {data['firstName']} {data['surname']}: {total_score}/50 points, {dominant_type}")
            
            return jsonify(result), 201
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"❌ Error saving assessment: {e}", exc_info=True)
            return jsonify({"error": "Internal server error"}), 500

def calculate_total_score(answers):
    """Вычисляет общий балл на основе ответов (максимум 50 баллов)"""
    try:
        total_score = 0
        
        for answer_text in answers:
            # Находим балл для данного ответа
            query = text("""
                SELECT qo.score_value
                FROM question_options qo
                JOIN questions q ON qo.question_id = q.id
                WHERE q.questionnaire_id = 1 
                AND qo.option_text = :answer_text
                LIMIT 1
            """)
            
            result = db.session.execute(query, {"answer_text": answer_text})
            row = result.fetchone()
            
            if row:
                total_score += row.score_value
        
        return total_score
        
    except Exception as e:
        logger.error(f"Error calculating total score: {e}")
        return None

def calculate_type_scores(answers):
    """Вычисляет баллы по типам личности"""
    try:
        type_scores = {"innovator": 0, "optimizer": 0, "executor": 0}
        
        for answer_text in answers:
            # Находим тип и балл для данного ответа
            query = text("""
                SELECT qo.option_type, qo.score_value
                FROM question_options qo
                JOIN questions q ON qo.question_id = q.id
                WHERE q.questionnaire_id = 1 
                AND qo.option_text = :answer_text
                LIMIT 1
            """)
            
            result = db.session.execute(query, {"answer_text": answer_text})
            row = result.fetchone()
            
            if row:
                option_type = row.option_type
                score_value = row.score_value
                
                if option_type in type_scores:
                    type_scores[option_type] += score_value
        
        return type_scores
        
    except Exception as e:
        logger.error(f"Error calculating type scores: {e}")
        return {"innovator": 0, "optimizer": 0, "executor": 0}

def get_transcription_by_score(total_score):
    """Получает транскрипцию по общему баллу"""
    try:
        query = text("""
            SELECT transcription_text
            FROM score_transcriptions
            WHERE questionnaire_id = 1
            AND :total_score BETWEEN min_score AND max_score
            LIMIT 1
        """)
        
        result = db.session.execute(query, {"total_score": total_score})
        row = result.fetchone()
        
        return row[0] if row else "Стандартная оценка результатов"
        
    except Exception as e:
        logger.error(f"Error getting transcription: {e}")
        return "Стандартная оценка результатов"