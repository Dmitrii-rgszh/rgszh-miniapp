# server.py

import os
import logging
import threading

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO

from db_saver       import init_db, save_feedback_to_db
from polls_ws       import register_poll_ws
from polls_routes   import register_poll_routes
from assessment_routes import register_assessment_routes

# ====== Logging setup ======
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s"
)
logger = logging.getLogger("server")

# ====== Flask app ======
app = Flask(__name__, static_folder="build", static_url_path="")
CORS(app, resources={r"/api/*": {"origins": "*"}})

# ====== Socket.IO setup with Redis message queue ======
# читает адрес Redis из переменной окружения REDIS_URL
redis_url = os.environ.get("REDIS_URL")  # например, "redis://redis:6379/0"
if redis_url:
    socketio = SocketIO(
        app,
        cors_allowed_origins="*",
        message_queue=redis_url
    )
    logger.info("Socket.IO: using Redis message queue %s", redis_url)
else:
    socketio = SocketIO(app, cors_allowed_origins="*")
    logger.warning("Socket.IO: no REDIS_URL set, running without message queue — may get inconsistent broadcasts")

# Регистрируем WS-слушатели и REST-маршруты для опросов
register_poll_ws(socketio)
register_poll_routes(app, socketio)

# Регистрируем маршруты для оценки кандидатов
register_assessment_routes(app)

# ====== Database setup (для остального функционала) ======
init_db(app)

# Создаем таблицы для Assessment после инициализации основной БД
with app.app_context():
    try:
        from assessment_models import AssessmentCandidate, AssessmentAnswer
        from db_saver import db
        db.create_all()
        logger.info("Assessment tables created successfully")
    except Exception as e:
        logger.error("Error creating assessment tables: %s", e)

# ====== Endpoints ======

@app.route('/api/feedback/save', methods=['POST', 'OPTIONS'])
def save_feedback():
    logger.info("➜ %s %s", request.method, request.path)
    if request.method == "OPTIONS":
        return '', 200

    try:
        payload = request.get_json(force=True)
        logger.info("   payload keys: %s", list(payload.keys()))
    except Exception as e:
        logger.error("   JSON parse error: %s", e, exc_info=True)
        return jsonify({"error": "invalid JSON"}), 400

    def bg_worker(data):
        # Поднимаем Flask-контекст в фоне
        with app.app_context():
            try:
                save_feedback_to_db(data)
            except Exception:
                logger.exception("Error saving feedback in background")

    threading.Thread(target=bg_worker, args=(payload,), daemon=True).start()
    return jsonify({"status": "queued"}), 200

# Раздача React-фронтенда
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    if path and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

# ====== Запуск ======
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    logger.info("Starting server on port %d", port)
    # Используем встроенный сервер Flask-SocketIO (eventlet/gevent) — не Gunicorn
    socketio.run(
      app,
      host='0.0.0.0',
      port=port,
      allow_unsafe_werkzeug=True
    )






















