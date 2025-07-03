# questionnaire_routes.py - API маршруты для работы с опросниками

import logging
from flask import request, jsonify
from questionnaire_models import (
    Questionnaire, Question, QuestionOption, QuestionnaireStats,
    get_questionnaire_with_questions, update_questionnaire_stats,
    create_questionnaire, add_question_to_questionnaire
)
from db_saver import db

logger = logging.getLogger("questionnaire_routes")

def register_questionnaire_routes(app):
    """Регистрирует маршруты для работы с опросниками"""
    
    @app.route('/api/questionnaires', methods=['GET'])
    def get_questionnaires():
        """Получает список всех активных опросников"""
        try:
            category = request.args.get('category', 'assessment')
            
            questionnaires = db.session.query(Questionnaire)\
                .filter_by(is_active=True, category=category)\
                .order_by(Questionnaire.created_at.desc()).all()
            
            return jsonify({
                'questionnaires': [q.to_dict() for q in questionnaires],
                'count': len(questionnaires)
            }), 200
            
        except Exception as e:
            logger.error(f"Error getting questionnaires: {e}")
            return jsonify({"error": "Failed to get questionnaires"}), 500
    
    @app.route('/api/questionnaire/<int:questionnaire_id>', methods=['GET'])
    def get_questionnaire(questionnaire_id):
        """Получает конкретный опросник со всеми вопросами"""
        try:
            include_questions = request.args.get('include_questions', 'true').lower() == 'true'
            
            questionnaire_data = get_questionnaire_with_questions(questionnaire_id)
            
            if not questionnaire_data:
                return jsonify({"error": "Questionnaire not found"}), 404
            
            # Логируем запрос опросника для аналитики
            logger.info(f"Questionnaire {questionnaire_id} requested")
            
            return jsonify(questionnaire_data), 200
            
        except Exception as e:
            logger.error(f"Error getting questionnaire {questionnaire_id}: {e}")
            return jsonify({"error": "Failed to get questionnaire"}), 500
    
    @app.route('/api/questionnaire/<int:questionnaire_id>/stats', methods=['GET'])
    def get_questionnaire_stats(questionnaire_id):
        """Получает статистику по опроснику"""
        try:
            # Обновляем статистику перед отдачей
            update_questionnaire_stats(questionnaire_id)
            
            stats = db.session.query(QuestionnaireStats)\
                .filter_by(questionnaire_id=questionnaire_id).first()
            
            if not stats:
                return jsonify({
                    "questionnaire_id": questionnaire_id,
                    "total_responses": 0,
                    "message": "No statistics available"
                }), 200
            
            return jsonify(stats.to_dict()), 200
            
        except Exception as e:
            logger.error(f"Error getting stats for questionnaire {questionnaire_id}: {e}")
            return jsonify({"error": "Failed to get statistics"}), 500
    
    @app.route('/api/questionnaire', methods=['POST'])
    def create_new_questionnaire():
        """Создает новый опросник (админ функция)"""
        try:
            data = request.get_json()
            
            # Валидация
            if not data.get('title'):
                return jsonify({"error": "Title is required"}), 400
            
            questionnaire = create_questionnaire(
                title=data['title'],
                description=data.get('description'),
                category=data.get('category', 'assessment'),
                created_by=data.get('created_by', 'api'),
                max_time_minutes=data.get('max_time_minutes'),
                randomize_questions=data.get('randomize_questions', False),
                randomize_options=data.get('randomize_options', False)
            )
            
            logger.info(f"Created questionnaire: {questionnaire.title}")
            return jsonify(questionnaire.to_dict()), 201
            
        except Exception as e:
            logger.error(f"Error creating questionnaire: {e}")
            return jsonify({"error": "Failed to create questionnaire"}), 500
    
    @app.route('/api/questionnaire/<int:questionnaire_id>/question', methods=['POST'])
    def add_question(questionnaire_id):
        """Добавляет вопрос в опросник (админ функция)"""
        try:
            data = request.get_json()
            
            # Валидация
            if not data.get('text'):
                return jsonify({"error": "Question text is required"}), 400
            
            if not data.get('options') or len(data['options']) < 2:
                return jsonify({"error": "At least 2 options are required"}), 400
            
            # Проверяем, что опросник существует
            questionnaire = db.session.query(Questionnaire)\
                .filter_by(id=questionnaire_id).first()
            
            if not questionnaire:
                return jsonify({"error": "Questionnaire not found"}), 404
            
            question = add_question_to_questionnaire(
                questionnaire_id=questionnaire_id,
                text=data['text'],
                options=data['options'],
                order_index=data.get('order_index'),
                question_type=data.get('question_type', 'single_choice'),
                description=data.get('description'),
                is_required=data.get('is_required', True)
            )
            
            logger.info(f"Added question to questionnaire {questionnaire_id}")
            return jsonify(question.to_dict(include_options=True)), 201
            
        except Exception as e:
            logger.error(f"Error adding question: {e}")
            return jsonify({"error": "Failed to add question"}), 500
    
    @app.route('/api/questionnaire/<int:questionnaire_id>/questions', methods=['GET'])
    def get_questions(questionnaire_id):
        """Получает список вопросов опросника"""
        try:
            questions = db.session.query(Question)\
                .filter_by(questionnaire_id=questionnaire_id)\
                .order_by(Question.order_index).all()
            
            return jsonify({
                'questions': [q.to_dict(include_options=True) for q in questions],
                'count': len(questions)
            }), 200
            
        except Exception as e:
            logger.error(f"Error getting questions: {e}")
            return jsonify({"error": "Failed to get questions"}), 500
    
    @app.route('/api/question/<int:question_id>', methods=['PUT'])
    def update_question(question_id):
        """Обновляет вопрос (админ функция)"""
        try:
            data = request.get_json()
            
            question = db.session.query(Question).filter_by(id=question_id).first()
            if not question:
                return jsonify({"error": "Question not found"}), 404
            
            # Обновляем поля вопроса
            if 'text' in data:
                question.text = data['text']
            if 'description' in data:
                question.description = data['description']
            if 'question_type' in data:
                question.question_type = data['question_type']
            if 'is_required' in data:
                question.is_required = data['is_required']
            if 'order_index' in data:
                question.order_index = data['order_index']
            
            # Обновляем варианты ответов если переданы
            if 'options' in data:
                # Удаляем старые варианты
                db.session.query(QuestionOption)\
                    .filter_by(question_id=question_id).delete()
                
                # Добавляем новые варианты
                for i, option_data in enumerate(data['options']):
                    option = QuestionOption(
                        question_id=question_id,
                        text=option_data['text'],
                        order_index=i,
                        score_type=option_data.get('score_type', 'executor'),
                        score_value=option_data.get('score_value', 1)
                    )
                    db.session.add(option)
            
            db.session.commit()
            
            # Возвращаем обновленный вопрос
            updated_question = db.session.query(Question).filter_by(id=question_id).first()
            return jsonify(updated_question.to_dict(include_options=True)), 200
            
        except Exception as e:
            logger.error(f"Error updating question {question_id}: {e}")
            db.session.rollback()
            return jsonify({"error": "Failed to update question"}), 500
    
    @app.route('/api/question/<int:question_id>', methods=['DELETE'])
    def delete_question(question_id):
        """Удаляет вопрос (админ функция)"""
        try:
            question = db.session.query(Question).filter_by(id=question_id).first()
            if not question:
                return jsonify({"error": "Question not found"}), 404
            
            questionnaire_id = question.questionnaire_id
            order_index = question.order_index
            
            # Удаляем вопрос (варианты ответов удалятся автоматически через cascade)
            db.session.delete(question)
            
            # Обновляем порядковые номера остальных вопросов
            db.session.query(Question)\
                .filter(Question.questionnaire_id == questionnaire_id)\
                .filter(Question.order_index > order_index)\
                .update({Question.order_index: Question.order_index - 1})
            
            db.session.commit()
            
            logger.info(f"Deleted question {question_id}")
            return jsonify({"message": "Question deleted successfully"}), 200
            
        except Exception as e:
            logger.error(f"Error deleting question {question_id}: {e}")
            db.session.rollback()
            return jsonify({"error": "Failed to delete question"}), 500
    
    @app.route('/api/questionnaire/<int:questionnaire_id>', methods=['PUT'])
    def update_questionnaire(questionnaire_id):
        """Обновляет настройки опросника (админ функция)"""
        try:
            data = request.get_json()
            
            questionnaire = db.session.query(Questionnaire)\
                .filter_by(id=questionnaire_id).first()
            
            if not questionnaire:
                return jsonify({"error": "Questionnaire not found"}), 404
            
            # Обновляем поля
            if 'title' in data:
                questionnaire.title = data['title']
            if 'description' in data:
                questionnaire.description = data['description']
            if 'is_active' in data:
                questionnaire.is_active = data['is_active']
            if 'max_time_minutes' in data:
                questionnaire.max_time_minutes = data['max_time_minutes']
            if 'randomize_questions' in data:
                questionnaire.randomize_questions = data['randomize_questions']
            if 'randomize_options' in data:
                questionnaire.randomize_options = data['randomize_options']
            if 'version' in data:
                questionnaire.version = data['version']
            
            questionnaire.updated_at = datetime.utcnow()
            
            db.session.commit()
            
            logger.info(f"Updated questionnaire {questionnaire_id}")
            return jsonify(questionnaire.to_dict()), 200
            
        except Exception as e:
            logger.error(f"Error updating questionnaire {questionnaire_id}: {e}")
            db.session.rollback()
            return jsonify({"error": "Failed to update questionnaire"}), 500
    
    @app.route('/api/questionnaire/<int:questionnaire_id>/duplicate', methods=['POST'])
    def duplicate_questionnaire(questionnaire_id):
        """Создает копию опросника (админ функция)"""
        try:
            data = request.get_json() or {}
            
            # Получаем исходный опросник
            original = db.session.query(Questionnaire)\
                .filter_by(id=questionnaire_id).first()
            
            if not original:
                return jsonify({"error": "Questionnaire not found"}), 404
            
            # Создаем копию опросника
            new_title = data.get('title', f"{original.title} (копия)")
            new_questionnaire = create_questionnaire(
                title=new_title,
                description=original.description,
                category=original.category,
                created_by=data.get('created_by', 'api'),
                max_time_minutes=original.max_time_minutes,
                randomize_questions=original.randomize_questions,
                randomize_options=original.randomize_options
            )
            
            # Копируем все вопросы и варианты ответов
            questions = db.session.query(Question)\
                .filter_by(questionnaire_id=questionnaire_id)\
                .order_by(Question.order_index).all()
            
            for question in questions:
                options_data = []
                for option in question.options:
                    options_data.append({
                        'text': option.text,
                        'score_type': option.score_type,
                        'score_value': option.score_value
                    })
                
                add_question_to_questionnaire(
                    questionnaire_id=new_questionnaire.id,
                    text=question.text,
                    options=options_data,
                    order_index=question.order_index,
                    question_type=question.question_type,
                    description=question.description,
                    is_required=question.is_required
                )
            
            logger.info(f"Duplicated questionnaire {questionnaire_id} -> {new_questionnaire.id}")
            return jsonify(new_questionnaire.to_dict(include_questions=True)), 201
            
        except Exception as e:
            logger.error(f"Error duplicating questionnaire {questionnaire_id}: {e}")
            return jsonify({"error": "Failed to duplicate questionnaire"}), 500