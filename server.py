import os
import threading

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

from excel_saver import append_feedback_to_excel  # <- импорт из excel_saver.py

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}}, methods=["GET", "POST", "OPTIONS"])

@app.route('/api/feedback/save', methods=["POST", "OPTIONS"])
def save_feedback():
    if request.method == "OPTIONS":
        return '', 200
    payload = request.get_json(force=True)
    threading.Thread(
        target=append_feedback_to_excel,
        args=(payload,),
        daemon=True
    ).start()
    return jsonify({"status": "queued"}), 200

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    # теперь используем os.path.join и у нас есть импорт os
    full_path = os.path.join(app.static_folder, path)
    if path and os.path.exists(full_path):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

















