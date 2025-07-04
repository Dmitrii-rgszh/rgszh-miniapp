# server.py

import os
import logging
import threading

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO

from db_saver import init_db, save_feedback_to_db
from polls_ws import register_poll_ws
from polls_routes import register_poll_routes
from assessment_routes import register_assessment_routes  # Новый импорт

# ====== Logging setup ======
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s"
)
logger = logging.getLogger("server")

# ====== Flask app ======
app = Flask(__name__, static_folder="build", static_url_path="")
CORS(app, resources={
    r"/api/*": {
        "origins": [
            "http://localhost:3000",
            "http://localhost:3001",  # ← Добавьте эту строку
            "http://127.0.0.1:3000", 
            "http://127.0.0.1:3001",  # ← И эту
            "https://rgszh-miniapp.org"
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# ====== Socket.IO setup with optional Redis ======
redis_url = os.environ.get("REDIS_URL")
if redis_url:
    try:
        import redis
        socketio = SocketIO(
            app,
            cors_allowed_origins="*",
            message_queue=redis_url
        )
        logger.info("Socket.IO: using Redis message queue %s", redis_url)
    except ImportError:
        logger.warning("Redis not installed, running without message queue")
        socketio = SocketIO(app, cors_allowed_origins="*")
else:
    socketio = SocketIO(app, cors_allowed_origins="*")
    logger.info("Socket.IO: running without Redis message queue")

# Регистрируем WS-слушатели и REST-маршруты для опросов
register_poll_ws(socketio)
register_poll_routes(app, socketio)

# Регистрируем маршруты для assessment
register_assessment_routes(app)

# ====== Database setup (для остального функционала) ======
init_db(app)

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
    port = int(os.environ.get("PORT", 4000))  # Изменили порт на 4000
    logger.info("🚀 Starting Flask-SocketIO server on port %d", port)
    
    # Запускаем через socketio.run для поддержки WebSocket
    socketio.run(
        app,
        host='0.0.0.0',
        port=port,
        debug=True,  # Включаем debug режим
        allow_unsafe_werkzeug=True
    )






















