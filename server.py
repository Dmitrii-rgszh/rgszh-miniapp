import os
import json
import logging
import threading
from threading import Lock
from flask import (
    Flask, request, jsonify, send_from_directory
)
from flask_cors import CORS
from win32com.client import DispatchEx, constants
from datetime import datetime

# ====== Logging setup ======
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s"
)

app = Flask(__name__, static_folder='build', static_url_path='')
CORS(app, resources={r"/api/*": {"origins": "*"}}, methods=["GET", "POST", "OPTIONS"])

excel_lock = Lock()

# EXCEL_PATH по-прежнему лежит в src/LOS/…
BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
EXCEL_PATH = os.path.join(BASE_DIR, 'src', 'LOS', 'Feedback-training.xlsx')

def append_feedback_to_excel(data: dict):
    logger = logging.getLogger("excel_saver")
    logger.info("append_feedback_to_excel: keys=%s", list(data.keys()))
    with excel_lock:
        try:
            # Создаем/открываем книгу
            if not os.path.exists(EXCEL_PATH):
                os.makedirs(os.path.dirname(EXCEL_PATH), exist_ok=True)
                wb = DispatchEx("Excel.Application").Workbooks.Add()
                ws = wb.Worksheets(1)
                ws.Name = "Свод"
                ws.Range("A1:M1").Value = [
                    "Партнер", "Дата", "Фамилия и имя спикера/ои",
                    "Положительные качества", "Отрицательные",
                    "Полезность информации", "Аргументация",
                    "Самые яркие мысли с обучения", "Что добавить в тренинг",
                    "Если выбрана статистика", "Общее впечатление",
                    "Настроение", "NPS"
                ]
                wb.SaveAs(EXCEL_PATH)
                wb.Close()
                logger.info("Created new Excel file at %s", EXCEL_PATH)

            wb = DispatchEx("Excel.Application").Workbooks.Open(EXCEL_PATH)
            ws = wb.Worksheets("Свод")

            # Подготовка данных (пример)
            partner = data.get("partner", "")
            dt = datetime.fromisoformat(data.get("dateTime"))
            date_str = dt.strftime("%d.%m.%Y %H:%M")

            speakers = data.get("speakersFeedback", [])
            names = [sp.get("fullName","") for sp in speakers if sp.get("fullName")]
            col_c = ", ".join(names) if names else "-"

            qualities = []
            for sp in speakers:
                qualities += [str(q) for q in sp.get("qualities", []) if q is not None]
            col_d = ", ".join(qualities) if qualities else "-"

            ca = data.get("commonAnswers", {})
            col_f = ca.get("usefulness","")
            col_g = ca.get("uselessArgument","")
            col_h = ca.get("brightThoughts","")
            col_i = ca.get("additionalSuggestions","")
            col_j = ca.get("statsDetails","")
            col_k = ca.get("impression","")
            col_l = ca.get("mood","")
            col_m = ca.get("recommendation","")

            # Append
            next_row = ws.Cells(ws.Rows.Count, 1).End(constants.xlUp).Row + 1
            ws.Cells(next_row, 1).Value = partner
            ws.Cells(next_row, 2).Value = date_str
            ws.Cells(next_row, 3).Value = col_c
            ws.Cells(next_row, 4).Value = col_d
            ws.Cells(next_row, 5).Value = "-"
            ws.Cells(next_row, 6).Value = col_f
            ws.Cells(next_row, 7).Value = col_g
            ws.Cells(next_row, 8).Value = col_h
            ws.Cells(next_row, 9).Value = col_i
            ws.Cells(next_row, 10).Value = col_j
            ws.Cells(next_row, 11).Value = col_k
            ws.Cells(next_row, 12).Value = col_l
            ws.Cells(next_row, 13).Value = col_m

            wb.Save()
            wb.Close()
            logger.info("Appended row %d to Excel", next_row)

        except Exception:
            logger.exception("Failed to append to Excel")

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

    def worker(data):
        app.logger.info("   [worker] start append_feedback_to_excel")
        append_feedback_to_excel(data)
        app.logger.info("   [worker] append_feedback_to_excel done")

    threading.Thread(target=worker, args=(payload,), daemon=True).start()
    return jsonify({"status": "queued"}), 200

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    full_path = os.path.join(app.static_folder, path)
    exists = os.path.exists(full_path)
    app.logger.info("➜ GET /%s  (exists=%s)", path, exists)
    if path and exists:
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)

















