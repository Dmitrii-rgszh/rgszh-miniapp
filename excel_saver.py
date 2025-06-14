# excel_saver.py

import os
import json
import openpyxl
from threading import Lock
from datetime import datetime

# Блокировка, чтобы избежать коллизий при параллельных запросах
excel_lock = Lock()

# Путь к вашему файлу
BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
EXCEL_PATH = os.path.join(BASE_DIR, 'src', 'LOS', 'Feedback-training.xlsx')

def append_feedback_to_excel(data: dict):
    """
    Дописывает в Excel по одной строке на каждого спикера.
    Общие колонки (партнёр, дата, комментарии и т.п.) дублируются.
    """
    with excel_lock:
        # 1) Если файл не существует — создаём и пишем заголовки A–M
        if not os.path.exists(EXCEL_PATH):
            os.makedirs(os.path.dirname(EXCEL_PATH), exist_ok=True)
            wb = openpyxl.Workbook()
            ws = wb.active
            ws.title = "Свод"
            ws.append([
                "Партнер",               # A
                "Дата",                  # B
                "Фамилия и имя спикера/ои",     # C
                "Положительные качества",       # D
                "Отрицательные",         # E
                "Полезность информации", # F
                "Аргументация",          # G
                "Самые яркие мысли с обучения", # H
                "Что добавить в тренинг",       # I
                "Если выбрана статистика",      # J
                "Общее впечатление",     # K
                "Настроение",            # L
                "NPS"                    # M
            ])
            wb.save(EXCEL_PATH)
            wb.close()

        # 2) Открываем книгу и лист
        wb = openpyxl.load_workbook(EXCEL_PATH)
        ws = wb["Свод"] if "Свод" in wb.sheetnames else wb.create_sheet("Свод")

        # 3) Готовим общие поля
        partner = data.get("partner", "")

        # Форматируем дату
        dt = datetime.fromisoformat(data.get("dateTime"))
        date_str = dt.strftime("%d.%m.%Y %H:%M")

        # Поля из commonAnswers
        ca = data.get("commonAnswers", {})
        col_f = ca.get("usefulness", "")
        col_g = ca.get("uselessArgument", "")
        col_h = ca.get("brightThoughts", "")
        col_i = ca.get("additionalSuggestions", "")
        col_j = ca.get("statsDetails", "")
        col_k = ca.get("impression", "")
        col_l = ca.get("mood", "")
        col_m = ca.get("recommendation", "")

        # 4) Обрабатываем каждого спикера отдельно
        speakers = data.get("speakersFeedback", [])
        if speakers:
            for sp in speakers:
                # C: имя спикера
                full_name = sp.get("fullName", "") or "-"
                col_c = full_name

                # D: положительные качества
                positives = [str(q) for q in sp.get("qualities", []) if q is not None]
                col_d = ", ".join(positives) if positives else "-"

                # E: отрицательные качества (если есть в данных)
                negatives = [str(nq) for nq in sp.get("negativeQualities", []) if nq is not None]
                col_e = ", ".join(negatives) if negatives else "-"

                # Записываем строку
                ws.append([
                    partner, date_str, col_c, col_d, col_e,
                    col_f, col_g, col_h, col_i, col_j,
                    col_k, col_l, col_m
                ])
        else:
            # Если спикеров нет — создаём одну «общую» строку без имени
            ws.append([
                partner, date_str, "-", "-", "-",
                col_f, col_g, col_h, col_i, col_j,
                col_k, col_l, col_m
            ])

        # 5) Сохраняем и закрываем
        wb.save(EXCEL_PATH)
        wb.close()
        print(f"[Excel] Appended {len(speakers) or 1} row(s) to {EXCEL_PATH}")


