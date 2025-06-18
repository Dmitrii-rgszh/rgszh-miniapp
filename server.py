# server.py

import logging
import threading
import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

# Импортируем наш модуль работы с БД
from db_saver import init_db, save_feedback_to_db

# ====== Настройка логирования ======
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s"
)

# ====== Создаём Flask-приложение ======
app = Flask(
    __name__,
    static_folder="build",      # путь к собранному React
    static_url_path=""          # корень для фронта
)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# ====== Инициализируем базу данных ======
init_db(app)

# ====== Эндпоинты ======

@app.route('/api/training', methods=['GET'])
def get_training():
    # Пример данных для автодополнения
    return jsonify(["Product A", "Product B", "Service X"])

@app.route('/api/feedback/save', methods=["POST", "OPTIONS"])
def save_feedback():
    app.logger.info("➜ %s %s", request.method, request.path)
    if request.method == "OPTIONS":
        return '', 200

    try:
        payload = request.get_json(force=True)
        app.logger.info("   payload keys: %s", list(payload.keys()))
    except Exception as e:
        app.logger.error("   JSON parse error: %s", e, exc_info=True)
        return jsonify({"error": "invalid JSON"}), 400

    # Сохраняем в отдельном потоке, чтобы не держать запрос долго открытым
    threading.Thread(
        target=save_feedback_to_db,
        args=(payload,),
        daemon=True
    ).start()

    return jsonify({"status": "queued"}), 200

# Раздача React-фронтенда
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    # Если файл есть в build — отдадим его
    if path and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    # Иначе — возвращаем index.html (SPA)
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.logger.info("Starting server on port %d", port)
    app.run(host='0.0.0.0', port=port)


















