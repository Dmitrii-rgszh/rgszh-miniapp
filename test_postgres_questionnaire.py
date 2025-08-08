#!/usr/bin/env python3
# test_postgres_questionnaire.py - Тестируем PostgreSQL questionnaire API

import json
from flask import Flask, jsonify
import psycopg2
import psycopg2.extras

app = Flask(__name__)

@app.route('/api/questionnaire/<int:questionnaire_id>')
def get_questionnaire(questionnaire_id):
    try:
        # Подключаемся к PostgreSQL
        conn = psycopg2.connect(
            host="localhost",
            port=5432,
            user="postgres",
            password="secret",
            database="miniapp"
        )
        
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # Получаем опросник
        cur.execute("""
            SELECT id, title, description, questions_count, max_time_minutes, 
                   is_active, created_at, updated_at
            FROM questionnaires 
            WHERE id = %s AND is_active = TRUE
        """, (questionnaire_id,))
        
        questionnaire = cur.fetchone()
        if not questionnaire:
            return jsonify({"error": "Questionnaire not found"}), 404
        
        # Получаем вопросы
        cur.execute("""
            SELECT id, question_order, question_text, description, created_at
            FROM questions 
            WHERE questionnaire_id = %s 
            ORDER BY question_order
        """, (questionnaire_id,))
        
        questions = cur.fetchall()
        
        # Получаем варианты ответов для каждого вопроса
        for question in questions:
            cur.execute("""
                SELECT id, option_order, option_text, option_type, score_value, created_at
                FROM question_options 
                WHERE question_id = %s 
                ORDER BY option_order
            """, (question['id'],))
            
            question['options'] = cur.fetchall()
            question['options_count'] = len(question['options'])
            question['question_type'] = 'single_choice'
            question['is_required'] = True
            question['order_index'] = question['question_order']
            question['text'] = question['question_text']
        
        # Формируем ответ
        result = dict(questionnaire)
        result['questions'] = [dict(q) for q in questions]
        result['category'] = 'assessment'
        result['created_by'] = 'postgres_init'
        result['randomize_options'] = True
        result['randomize_questions'] = False
        result['version'] = '1.0'
        
        # Форматируем даты
        for field in ['created_at', 'updated_at']:
            if result.get(field):
                result[field] = result[field].strftime('%d.%m.%Y %H:%M:%S')
        
        for question in result['questions']:
            if question.get('created_at'):
                question['created_at'] = question['created_at'].strftime('%d.%m.%Y %H:%M:%S')
            for option in question.get('options', []):
                if option.get('created_at'):
                    option['created_at'] = option['created_at'].strftime('%d.%m.%Y %H:%M:%S')
        
        conn.close()
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500

@app.route('/health')
def health():
    return jsonify({"status": "OK", "message": "PostgreSQL Questionnaire API is running"})

if __name__ == '__main__':
    print("🚀 Запускаем тестовый PostgreSQL Questionnaire API на порту 5001...")
    app.run(host='0.0.0.0', port=5001, debug=True)
