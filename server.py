import os
import logging
import threading

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

from db_saver import init_db, save_feedback_to_db

# ====== Logging setup ======
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s"
)
logger = logging.getLogger("server")

# ====== Flask app ======
app = Flask(__name__, static_folder="build", static_url_path="")
CORS(app, resources={r"/api/*": {"origins": "*"}})

# ====== Database setup ======
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

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    logger.info("Starting server on port %d", port)
    app.run(host='0.0.0.0', port=port)




















