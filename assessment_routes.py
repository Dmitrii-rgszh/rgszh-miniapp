# assessment_routes.py - Исправленная версия БЕЗ дублирующего эндпоинта
import traceback
import logging
import smtplib
from datetime import datetime
from flask import request, jsonify
from sqlalchemy import text
from db_saver import db
from email_sender import process_new_candidate_notification
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logger = logging.getLogger("assessment_routes")

def send_test_email(to_email, subject, body):
    """Отправка email через Yandex SMTP"""
    try:
        # Настройки SMTP для Yandex
        smtp_server = "smtp.yandex.ru"
        smtp_port = 465
        smtp_username = "rgszh-miniapp@yandex.ru"
        smtp_password = "rbclbdyejwwxrisg"
        
        # Создаем сообщение
        msg = MIMEMultipart()
        msg['From'] = smtp_username
        msg['To'] = to_email
        msg['Subject'] = subject
        
        # Добавляем текст
        msg.attach(MIMEText(body, 'plain', 'utf-8'))
        
        # Отправляем через SMTP_SSL для порта 465
        with smtplib.SMTP_SSL(smtp_server, smtp_port) as server:
            server.login(smtp_username, smtp_password)
            server.send_message(msg)
            
        logger.info(f"✅ Email успешно отправлен на {to_email}")
        return True
        
    except Exception as e:
        logger.error(f"❌ Ошибка отправки email: {e}")
        return False

def register_assessment_routes(app):
    """Регистрирует маршруты для оценки кандидатов"""
    
    @app.route('/api/assessment/questionnaire/<int:questionnaire_id>', methods=['GET'])
    def get_assessment_questionnaire(questionnaire_id):
        """Получение опросника с вопросами"""
        try:
            include_questions = request.args.get('include_questions', 'false').lower() == 'true'
            
            # Получаем опросник
            query = text("""
                SELECT id, title, description, max_time_minutes, is_active
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
                "max_time_minutes": questionnaire.max_time_minutes,
                "is_active": questionnaire.is_active
            }
            
            # Получаем количество вопросов
            count_query = text("""
                SELECT COUNT(*) as questions_count
                FROM questions 
                WHERE questionnaire_id = :questionnaire_id
            """)
            count_result = db.session.execute(count_query, {"questionnaire_id": questionnaire_id})
            questions_count = count_result.fetchone().questions_count
            questionnaire_data["questions_count"] = questions_count
            
            # Если нужны вопросы, загружаем их
            if include_questions:
                questions_query = text("""
                    SELECT q.id, q.order_index as question_order, q.text as question_text, q.description,
                           qo.id as option_id, qo.order_index as option_order, qo.text as option_text, 
                           qo.score_type as option_type, qo.score_value
                    FROM questions q
                    LEFT JOIN question_options qo ON q.id = qo.question_id
                    WHERE q.questionnaire_id = :questionnaire_id
                    ORDER BY q.order_index, qo.order_index
                """)
                
                questions_result = db.session.execute(questions_query, {"questionnaire_id": questionnaire_id})
                
                # Группируем результаты по вопросам
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
        """Сохранение результатов оценки кандидата с обновленной структурой БД"""
        logger.info("🌐 ➜ %s %s", request.method, request.path)

        if request.method == "OPTIONS":
            return '', 200

        try:
            logger.info("📦 Request headers: %s", dict(request.headers))
            logger.info("📋 Content-Type: %s", request.content_type)
            logger.info("📄 Raw data length: %s", len(request.data) if request.data else 0)
      
            data = request.get_json()
      
            # Логируем полученные данные
            logger.info("📥 Parsed JSON successfully")
            logger.info("📝 Data keys: %s", list(data.keys()) if data else "None")
            logger.info("📊 Data details: surname='%s', firstName='%s', answers_count=%s", 
                       data.get('surname', 'None'), 
                       data.get('firstName', 'None'), 
                       len(data.get('answers', [])))

            # ДОБАВЛЯЕМ ВАЛИДАЦИЮ ПОЛЕЙ
            required_fields = ['surname', 'firstName', 'patronymic', 'answers']
            for field in required_fields:
                if not data.get(field):
                    logger.error(f"❌ Missing required field: {field}")
                    return jsonify({"error": f"Missing required field: {field}"}), 400

            # Проверяем каждое поле отдельно
            for field in required_fields:
                value = data.get(field)
                logger.info(f"🔍 Field '{field}': value='{value}', type={type(value)}, empty={not value}")
      
            # Проверяем что answers - это список и не пустой
            if not isinstance(data['answers'], list) or len(data['answers']) == 0:
                logger.error(f"❌ Invalid answers: {data.get('answers')}")
                return jsonify({"error": "Answers must be a non-empty list"}), 400
            
            logger.info(f"📋 Processing {len(data['answers'])} answers...")

            # Вычисляем баллы по новой системе (0-1-2 балла за ответ)
            total_score = calculate_total_score(data['answers'])
            if total_score is None:
                logger.error("❌ Failed to calculate total score")
                return jsonify({"error": "Failed to calculate scores"}), 500
      
            logger.info(f"🎯 Calculated total score: {total_score}")

            # Вычисляем баллы по типам
            type_scores = calculate_type_scores(data['answers'])
            logger.info(f"📊 Type scores: {type_scores}")
      
            # Вычисляем процент (максимум 50 баллов)
            percentage = round((total_score / 50.0) * 100, 2)
      
            # Определяем доминирующий тип
            dominant_type = max(type_scores, key=type_scores.get) if max(type_scores.values()) > 0 else None
            logger.info(f"🏆 Dominant type: {dominant_type}")
      
            # Получаем транскрипцию на основе баллов
            transcription = get_transcription_by_score(total_score)
            logger.info(f"📝 Transcription: {transcription[:50]}...")
      
            # Создаем полное имя
            full_name = f"{data['surname']} {data['firstName']} {data['patronymic']}"
      
            # Сохраняем результат в БД (со ВСЕМИ столбцами)
            insert_query = text("""
                INSERT INTO assessment_candidates 
                (surname, first_name, patronymic, total_score, percentage, 
                 innovator_score, optimizer_score, executor_score, dominant_type, transcription, 
                 completion_time_minutes, created_at, updated_at)
                VALUES (:surname, :first_name, :patronymic, :total_score, :percentage,
                        :innovator_score, :optimizer_score, :executor_score, :dominant_type, :transcription,
                        :completion_time_minutes, :created_at, :updated_at)
                RETURNING id
            """)
      
            current_time = datetime.utcnow()
            completion_time = data.get('completionTime', 0)  # время в минутах
      
            logger.info("💾 Saving to database...")
            result = db.session.execute(insert_query, {
                "surname": data['surname'],
                "first_name": data['firstName'], 
                "patronymic": data['patronymic'],
                "total_score": total_score,
                "percentage": percentage,
                "innovator_score": type_scores.get('innovator', 0),
                "optimizer_score": type_scores.get('optimizer', 0),
                "executor_score": type_scores.get('executor', 0),
                "dominant_type": dominant_type,
                "transcription": transcription,
                "completion_time_minutes": completion_time,
                "created_at": current_time,
                "updated_at": current_time
            })
      
            candidate_id = result.fetchone()[0]
            logger.info(f"📋 Candidate saved with ID: {candidate_id}")
      
            # Сохраняем ответы (опционально)
            saved_answers = 0
            for i, answer_text in enumerate(data['answers']):
                try:
                    option_query = text("""
                        SELECT qo.id, qo.question_id
                        FROM question_options qo
                        JOIN questions q ON qo.question_id = q.id
                        WHERE q.questionnaire_id = 1 
                        AND qo.text = :answer_text
                        LIMIT 1
                    """)
              
                    option_result = db.session.execute(option_query, {"answer_text": answer_text})
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
                        saved_answers += 1
                except Exception as answer_error:
                    logger.warning(f"Failed to save answer {i+1}: {answer_error}")
                    # Продолжаем, даже если не удалось сохранить отдельный ответ
      
            logger.info(f"📝 Saved {saved_answers}/{len(data['answers'])} answers")
            db.session.commit()
            
            # ОТПРАВЛЯЕМ EMAIL УВЕДОМЛЕНИЕ
            try:
                # ВКЛЮЧАЕМ отправку email через нашу функцию
                subject = f"Новый кандидат прошел опрос - {full_name}"
                body = f"""
Кандидат: {full_name}
Общий балл: {total_score}/50 ({percentage}%)
Доминирующий тип: {dominant_type}

Баллы по типам:
- Инноватор: {type_scores.get('innovator', 0)}
- Оптимизатор: {type_scores.get('optimizer', 0)} 
- Исполнитель: {type_scores.get('executor', 0)}

Время прохождения: {completion_time} минут
Дата: {current_time.strftime('%Y-%m-%d %H:%M:%S')}

Расшифровка:
{transcription}
                """
                
                # Отправляем email на оба адреса
                email_addresses = ["zerotlt@mail.ru", "Polina.Iureva@rgsl.ru"]
                email_sent = True
                
                for email_addr in email_addresses:
                    success = send_test_email(email_addr, subject, body)
                    if success:
                        logger.info(f"📧 Email успешно отправлен на {email_addr}")
                    else:
                        logger.error(f"❌ Ошибка отправки email на {email_addr}")
                        email_sent = False
                
                logger.info(f"📧 Email уведомления {'успешно отправлены' if email_sent else 'отправлены частично или не отправлены'}")
                
            except Exception as email_error:
                logger.error(f"❌ Ошибка отправки email: {email_error}")
                email_sent = False
      
            # Формируем ответ
            result_data = {
                "candidate": {
                    "id": candidate_id,
                    "surname": data['surname'],
                    "firstName": data['firstName'],
                    "patronymic": data['patronymic'],
                    "full_name": full_name,
                    "total_score": total_score,
                    "percentage": percentage,
                    "innovator_score": type_scores.get('innovator', 0),
                    "optimizer_score": type_scores.get('optimizer', 0),
                    "executor_score": type_scores.get('executor', 0),
                    "dominant_type": dominant_type,
                    "transcription": transcription
                },
                "email_sent": email_sent
            }
      
            logger.info(f"✅ Assessment saved for {data['firstName']} {data['surname']}: {total_score}/50 points ({percentage}%)")
            logger.info(f"   Type scores: I:{type_scores.get('innovator', 0)} O:{type_scores.get('optimizer', 0)} E:{type_scores.get('executor', 0)}")
      
            return jsonify(result_data), 201
      
        except Exception as e:
            db.session.rollback()
            logger.error(f"❌ Error saving assessment: {e}", exc_info=True)
            return jsonify({"error": "Internal server error"}), 500

    @app.route('/api/test-email', methods=['GET'])
    def test_email_send():
        """Тестовая отправка email"""
        try:
            subject = "Тестовое письмо из RGSZH Mini App"
            body = f"Это тестовое письмо для проверки работы SMTP. Отправлено {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
            
            success = send_test_email("zerotlt@mail.ru", subject, body)
            
            return jsonify({
                "status": "success" if success else "failed",
                "message": "Email отправлен" if success else "Ошибка отправки email"
            }), 200
            
        except Exception as e:
            logger.error(f"❌ Test email error: {e}")
            return jsonify({"status": "error", "message": str(e)}), 500

    # ❌ УДАЛЕН ДУБЛИРУЮЩИЙ ЭНДПОИНТ send_assessment_manager
    # Он уже есть в server.py и создавал конфликт

def calculate_total_score(answers):
    """Вычисляет общий балл на основе ответов (максимум 50 баллов)"""
    try:
        total_score = 0
        
        for answer_text in answers:
            # Находим балл для данного ответа по тексту
            query = text("""
                SELECT qo.score_value
                FROM question_options qo
                JOIN questions q ON qo.question_id = q.id
                WHERE q.questionnaire_id = 1 
                AND qo.text = :answer_text
                LIMIT 1
            """)
            
            result = db.session.execute(query, {"answer_text": answer_text})
            row = result.fetchone()
            
            if row and row.score_value is not None:
                total_score += row.score_value
        
        return total_score
        
    except Exception as e:
        logger.error(f"❌ Error calculating total score: {e}")
        return None

def calculate_type_scores(answers):
    """Вычисляет баллы по типам (инноватор, оптимизатор, исполнитель)"""
    try:
        type_scores = {
            'innovator': 0,
            'optimizer': 0, 
            'executor': 0
        }
        
        for answer_text in answers:
            # Находим тип и балл для данного ответа по тексту
            query = text("""
                SELECT qo.score_type as option_type, qo.score_value
                FROM question_options qo
                JOIN questions q ON qo.question_id = q.id
                WHERE q.questionnaire_id = 1 
                AND qo.text = :answer_text
                LIMIT 1
            """)
            
            result = db.session.execute(query, {"answer_text": answer_text})
            row = result.fetchone()
            
            if row and row.option_type and row.score_value is not None:
                type_name = row.option_type.lower()
                if type_name in type_scores:
                    type_scores[type_name] += row.score_value
        
        return type_scores
        
    except Exception as e:
        logger.error(f"❌ Error calculating type scores: {e}")
        return {'innovator': 0, 'optimizer': 0, 'executor': 0}

def get_transcription_by_score(total_score):
    """Возвращает расшифровку на основе общего балла"""
    try:
        if total_score >= 40:
            return "Кандидат демонстрирует высокий уровень соответствия корпоративным ценностям и готов к эффективной работе в команде"
        elif total_score >= 30:
            return "Кандидат показывает хороший потенциал и может быть эффективным сотрудником при поддержке и развитии"
        elif total_score >= 20:
            return "Кандидат поддерживает многие принципы, но может нуждаться в адаптации или дополнительных стимулах, чтобы раскрыть потенциал в полной мере"
        else:
            return "Кандидат требует значительной адаптации и поддержки для соответствия корпоративным ценностям"
    except Exception as e:
        logger.error(f"❌ Error getting transcription: {e}")
        return "Не удалось сформировать расшифровку результата"