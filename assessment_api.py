# assessment_routes.py - API маршруты для работы с оценкой кандидатов

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
                            "question_order": row.question_order,
                            "question_text": row.question_text,
                            "description": row.description,
                            "options": []
                        }
                    
                    if row.option_id:
                        questions_dict[q_id]["options"].append({
                            "id": row.option_id,
                            "option_order": row.option_order,
                            "text": row.option_text,
                            "type": row.option_type,
                            "score_value": row.score_value
                        })
                
                questionnaire_data["questions"] = list(questions_dict.values())
            
            return jsonify(questionnaire_data), 200
            
        except Exception as e:
            logger.error(f"Error getting questionnaire {questionnaire_id}: {e}")
            return jsonify({"error": "Internal server error"}), 500
    
    @app.route('/api/assessment/save', methods=['POST'])
    def save_assessment():
        """Сохранение результатов оценки кандидата"""
        try:
            data = request.get_json()
            
            # Валидация входных данных
            required_fields = ['surname', 'firstName', 'patronymic', 'answers', 'questionnaireId']
            for field in required_fields:
                if not data.get(field):
                    return jsonify({"error": f"Missing required field: {field}"}), 400
            
            # Вычисляем баллы по типам личности
            scores = calculate_personality_scores(data['answers'], data['questionnaireId'])
            if scores is None:
                return jsonify({"error": "Failed to calculate scores"}), 500
            
            # Определяем доминирующий тип
            dominant_type = max(scores, key=scores.get)
            total_score = sum(scores.values())
            dominant_percentage = (scores[dominant_type] / total_score * 100) if total_score > 0 else 0
            
            # Получаем транскрипцию
            transcription = get_transcription(total_score, data['questionnaireId'])
            
            # Сохраняем кандидата
            candidate_query = text("""
                INSERT INTO assessment_candidates 
                (questionnaire_id, surname, first_name, patronymic, total_score, percentage,
                 innovator_score, optimizer_score, executor_score, dominant_type, 
                 dominant_percentage, transcription, completion_time_minutes, session_id)
                VALUES (:questionnaire_id, :surname, :first_name, :patronymic, :total_score, 
                        :percentage, :innovator_score, :optimizer_score, :executor_score, 
                        :dominant_type, :dominant_percentage, :transcription, 
                        :completion_time_minutes, :session_id)
                RETURNING id
            """)
            
            percentage = (total_score / (25 * 3) * 100) if total_score > 0 else 0  # 25 вопросов, макс 3 балла
            
            candidate_result = db.session.execute(candidate_query, {
                "questionnaire_id": data['questionnaireId'],
                "surname": data['surname'],
                "first_name": data['firstName'],
                "patronymic": data['patronymic'],
                "total_score": total_score,
                "percentage": percentage,
                "innovator_score": scores['innovator'],
                "optimizer_score": scores['optimizer'],
                "executor_score": scores['executor'],
                "dominant_type": dominant_type,
                "dominant_percentage": dominant_percentage,
                "transcription": transcription,
                "completion_time_minutes": data.get('completionTimeMinutes', 0),
                "session_id": data.get('sessionId', '')
            })
            
            candidate_id = candidate_result.fetchone()[0]
            
            # Сохраняем ответы
            for answer in data['answers']:
                # Находим option_id по тексту ответа
                option_query = text("""
                    SELECT qo.id FROM question_options qo
                    JOIN questions q ON qo.question_id = q.id
                    WHERE q.questionnaire_id = :questionnaire_id 
                    AND qo.option_text = :answer_text
                    LIMIT 1
                """)
                
                option_result = db.session.execute(option_query, {
                    "questionnaire_id": data['questionnaireId'],
                    "answer_text": answer
                })
                
                option_row = option_result.fetchone()
                if option_row:
                    answer_query = text("""
                        INSERT INTO candidate_answers 
                        (candidate_id, selected_option_id, answer_text)
                        VALUES (:candidate_id, :selected_option_id, :answer_text)
                    """)
                    
                    db.session.execute(answer_query, {
                        "candidate_id": candidate_id,
                        "selected_option_id": option_row[0],
                        "answer_text": answer
                    })
            
            db.session.commit()
            
            # Получаем описания типов личности
            type_descriptions = get_personality_type_description(dominant_type)
            
            # Формируем ответ
            result = {
                "candidate": {
                    "id": candidate_id,
                    "surname": data['surname'],
                    "firstName": data['firstName'],
                    "patronymic": data['patronymic'],
                    "total_score": total_score,
                    "percentage": percentage,
                    "scores": scores,
                    "dominant_type": dominant_type,
                    "dominant_percentage": dominant_percentage,
                    "transcription": transcription,
                    "type_description": type_descriptions
                }
            }
            
            logger.info(f"✅ Assessment saved for {data['firstName']} {data['surname']}: {total_score} points, {dominant_type}")
            
            return jsonify(result), 201
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"❌ Error saving assessment: {e}")
            return jsonify({"error": "Internal server error"}), 500

def calculate_personality_scores(answers, questionnaire_id):
    """Вычисляет баллы по типам личности на основе ответов"""
    try:
        scores = {"innovator": 0, "optimizer": 0, "executor": 0}
        
        for answer_text in answers:
            # Находим тип и балл для данного ответа
            query = text("""
                SELECT qo.option_type, qo.score_value
                FROM question_options qo
                JOIN questions q ON qo.question_id = q.id
                WHERE q.questionnaire_id = :questionnaire_id 
                AND qo.option_text = :answer_text
                LIMIT 1
            """)
            
            result = db.session.execute(query, {
                "questionnaire_id": questionnaire_id,
                "answer_text": answer_text
            })
            
            row = result.fetchone()
            if row:
                option_type = row.option_type
                score_value = row.score_value
                
                if option_type in scores:
                    scores[option_type] += score_value
        
        return scores
        
    except Exception as e:
        logger.error(f"Error calculating scores: {e}")
        return None

def get_transcription(total_score, questionnaire_id):
    """Получает транскрипцию по общему баллу"""
    try:
        query = text("""
            SELECT transcription_text
            FROM score_transcriptions
            WHERE questionnaire_id = :questionnaire_id
            AND :total_score BETWEEN min_score AND max_score
            LIMIT 1
        """)
        
        result = db.session.execute(query, {
            "questionnaire_id": questionnaire_id,
            "total_score": total_score
        })
        
        row = result.fetchone()
        return row[0] if row else "Стандартная оценка результатов"
        
    except Exception as e:
        logger.error(f"Error getting transcription: {e}")
        return "Стандартная оценка результатов"

def get_personality_type_description(type_name):
    """Получает описание типа личности"""
    try:
        query = text("""
            SELECT display_name, description, traits
            FROM personality_types
            WHERE type_name = :type_name
            LIMIT 1
        """)
        
        result = db.session.execute(query, {"type_name": type_name})
        row = result.fetchone()
        
        if row:
            return {
                "display_name": row.display_name,
                "description": row.description,
                "traits": row.traits
            }
        
        return None
        
    except Exception as e:
        logger.error(f"Error getting personality type description: {e}")
        return None
