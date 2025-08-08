#!/usr/bin/env python3
# proxy_questionnaire.py - Простой прокси для questionnaire API через subprocess

import json
import subprocess
from flask import Flask, jsonify

app = Flask(__name__)

def execute_postgres_query(query):
    """Выполняет запрос к PostgreSQL через docker exec"""
    try:
        cmd = [
            "docker", "exec", "-i", "miniapp-postgres-1",
            "psql", "-U", "postgres", "-d", "miniapp", "-t", "-c", query
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8')
        
        if result.returncode != 0:
            raise Exception(f"PostgreSQL error: {result.stderr}")
        
        return result.stdout.strip()
    except Exception as e:
        raise Exception(f"Command execution error: {e}")

@app.route('/api/questionnaire/<int:questionnaire_id>')
def get_questionnaire(questionnaire_id):
    try:
        # Получаем основные данные опросника
        questionnaire_query = f"""
        SELECT json_build_object(
            'id', q.id,
            'title', q.title,
            'description', q.description,
            'questions_count', q.questions_count,
            'max_time_minutes', q.max_time_minutes,
            'is_active', q.is_active,
            'category', 'assessment',
            'created_by', 'postgres_init',
            'randomize_options', true,
            'randomize_questions', false,
            'version', '1.0',
            'created_at', to_char(q.created_at, 'DD.MM.YYYY HH24:MI:SS'),
            'updated_at', to_char(q.updated_at, 'DD.MM.YYYY HH24:MI:SS')
        ) as questionnaire_json
        FROM questionnaires q 
        WHERE q.id = {questionnaire_id} AND q.is_active = true;
        """
        
        questionnaire_result = execute_postgres_query(questionnaire_query)
        if not questionnaire_result:
            return jsonify({"error": "Questionnaire not found"}), 404
        
        questionnaire_data = json.loads(questionnaire_result)
        
        # Получаем вопросы с вариантами ответов
        questions_query = f"""
        SELECT json_agg(
            json_build_object(
                'id', q.id,
                'question_order', q.question_order,
                'question_text', q.question_text,
                'text', q.question_text,
                'description', COALESCE(q.description, ''),
                'question_type', 'single_choice',
                'is_required', true,
                'order_index', q.question_order,
                'questionnaire_id', q.questionnaire_id,
                'created_at', to_char(q.created_at, 'DD.MM.YYYY HH24:MI:SS'),
                'options', (
                    SELECT json_agg(
                        json_build_object(
                            'id', qo.id,
                            'option_order', qo.option_order,
                            'option_text', qo.option_text,
                            'text', qo.option_text,
                            'option_type', qo.option_type,
                            'score_type', qo.option_type,
                            'score_value', qo.score_value,
                            'question_id', qo.question_id,
                            'created_at', to_char(qo.created_at, 'DD.MM.YYYY HH24:MI:SS')
                        ) ORDER BY qo.option_order
                    )
                    FROM question_options qo 
                    WHERE qo.question_id = q.id
                ),
                'options_count', (
                    SELECT COUNT(*) 
                    FROM question_options qo 
                    WHERE qo.question_id = q.id
                )
            ) ORDER BY q.question_order
        ) as questions_json
        FROM questions q 
        WHERE q.questionnaire_id = {questionnaire_id};
        """
        
        questions_result = execute_postgres_query(questions_query)
        questions_data = json.loads(questions_result) if questions_result != 'null' else []
        
        questionnaire_data['questions'] = questions_data or []
        
        return jsonify(questionnaire_data)
        
    except Exception as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500

@app.route('/health')
def health():
    return jsonify({"status": "OK", "message": "PostgreSQL Questionnaire Proxy is running"})

if __name__ == '__main__':
    print("🚀 Запускаем PostgreSQL Questionnaire Proxy на порту 5002...")
    app.run(host='0.0.0.0', port=5002, debug=True)
