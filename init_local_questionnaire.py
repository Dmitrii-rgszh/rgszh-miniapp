import os
import sys
from flask import Flask

# Настраиваем локальное окружение
os.environ['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///miniapp_local.db'
os.environ['DATABASE_URL'] = 'sqlite:///miniapp_local.db'

from db_saver import init_db, db
from questionnaire_models import Questionnaire, Question, QuestionOption, create_questionnaire, add_question_to_questionnaire

def create_local_assessment_questionnaire():
    """Создает тестовый опросник для локальной разработки"""
    
    app = Flask(__name__)
    init_db(app)
    
    with app.app_context():
        try:
            # Создаем все таблицы
            db.create_all()
            print("✅ Таблицы созданы успешно")
            
            # Проверяем, есть ли уже опросник
            existing = db.session.query(Questionnaire).filter_by(id=1).first()
            if existing:
                print(f"📋 Опросник уже существует: {existing.title} (ID: {existing.id})")
                return existing.id
                
            # Создаем базовый опросник
            questionnaire = create_questionnaire(
                title="Психологическая оценка кандидата",
                description="Оценка личностных качеств и профессиональных предпочтений",
                category="assessment",
                created_by="local_init",
                max_time_minutes=30,
                randomize_questions=False,
                randomize_options=True
            )
            
            print(f"✅ Создан опросник: {questionnaire.title} (ID: {questionnaire.id})")
            
            # Добавляем тестовые вопросы
            test_questions = [
                {
                    "text": "Какой формат работы вам ближе?",
                    "options": [
                        {"text": "Когда можно детально разобраться в процессах и построить устойчивую систему", "score_type": "innovator", "score_value": 2},
                        {"text": "Когда задачи достаточно разнообразны и требуют гибкого подхода", "score_type": "optimizer", "score_value": 1},
                        {"text": "Когда есть четкий алгоритм действий и понятные критерии качества", "score_type": "executor", "score_value": 0}
                    ]
                },
                {
                    "text": "Когда коллега сталкивается с проблемой в работе, ваша первая реакция:",
                    "options": [
                        {"text": "Понять, что пошло не так, и вместе найти пути исправления", "score_type": "innovator", "score_value": 2},
                        {"text": "В первую очередь скорректировать свои планы с учётом возникших проблем", "score_type": "optimizer", "score_value": 1},
                        {"text": "Сделать выводы для себя и минимизировать влияние на мою работу", "score_type": "executor", "score_value": 0}
                    ]
                },
                {
                    "text": "Как относитесь к коллективному обсуждению спорных вопросов?",
                    "options": [
                        {"text": "Это важный способ найти компромисс и улучшить взаимопонимание", "score_type": "innovator", "score_value": 2},
                        {"text": "Полезно, если есть конкретная цель и ограничения по времени", "score_type": "optimizer", "score_value": 1},
                        {"text": "Предпочитаю не вовлекаться, если это напрямую не затрагивает мою зону ответственности", "score_type": "executor", "score_value": 0}
                    ]
                },
                {
                    "text": "Как относитесь к комментариям по вашей работе?",
                    "options": [
                        {"text": "Считаю их возможностью для развития, если они аргументированы", "score_type": "innovator", "score_value": 2},
                        {"text": "Выслушиваю, но меняю подход только при реальной необходимости", "score_type": "optimizer", "score_value": 1},
                        {"text": "Если работа выполнена по стандартам, дополнительные замечания не критичны", "score_type": "executor", "score_value": 0}
                    ]
                },
                {
                    "text": "Клиент выражает недовольство результатом. Как поступаете?",
                    "options": [
                        {"text": "Пытаюсь понять, где возникли расхождения, и найти приемлемое решение", "score_type": "innovator", "score_value": 2},
                        {"text": "Сначала оцениваю обоснованность претензий, при необходимости уточняю детали", "score_type": "optimizer", "score_value": 1},
                        {"text": "Если всё сделано согласно договорённостям, считаю, что моя задача выполнена", "score_type": "executor", "score_value": 0}
                    ]
                }
            ]
            
            # Добавляем вопросы
            for i, q_data in enumerate(test_questions, 1):
                question = add_question_to_questionnaire(
                    questionnaire_id=questionnaire.id,
                    text=q_data['text'],
                    options=q_data['options'],
                    order_index=i,
                    question_type='single_choice',
                    is_required=True
                )
                print(f"✅ Добавлен вопрос {i}: {q_data['text'][:50]}...")
            
            print(f"🎉 Опросник создан успешно с {len(test_questions)} вопросами!")
            return questionnaire.id
            
        except Exception as e:
            print(f"❌ Ошибка создания опросника: {e}")
            import traceback
            traceback.print_exc()
            db.session.rollback()
            raise

if __name__ == "__main__":
    questionnaire_id = create_local_assessment_questionnaire()
    print(f"✅ Инициализация завершена. ID опросника: {questionnaire_id}")
