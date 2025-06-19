import os
import logging
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

logger = logging.getLogger("db_saver")
logger.setLevel(logging.INFO)

db = SQLAlchemy()

class Feedback(db.Model):
    __tablename__ = "feedback"
    id                       = db.Column(db.Integer, primary_key=True, autoincrement=True)
    dtime                    = db.Column(db.DateTime, nullable=False)
    partner                  = db.Column(db.Text, nullable=False)
    speaker                  = db.Column(db.Text, nullable=False)
    positive_qualities       = db.Column(db.Text, nullable=False)
    negative_qualities       = db.Column(db.Text, nullable=False)
    value                    = db.Column(db.Text, nullable=False)
    value_description        = db.Column(db.Text, nullable=False)
    impressions              = db.Column(db.Text, nullable=False)
    wanted                   = db.Column(db.Text, nullable=False)
    statistics_description   = db.Column(db.Text, nullable=False)
    mood                     = db.Column(db.Text, nullable=False)
    common_feelings          = db.Column(db.Text, nullable=False)
    nps                      = db.Column(db.Integer, nullable=True)

# повторим здесь ту же матрицу, что и в React:
QUALITY_ROWS = [
    {"positive": "Экспертный", "negative": "Некомпетентный"},
    {"positive": "Энергичный", "negative": "Пассивный"},
    {"positive": "Мотивирующий", "negative": "Невдохновляющий"},
    {"positive": "Харизматичный", "negative": "Душный"},
    {"positive": "Доступно доносит информацию", "negative": "Говорит сложными терминами"}
]
POSITIVE_LABELS = {r["positive"] for r in QUALITY_ROWS}
NEGATIVE_LABELS = {r["negative"] for r in QUALITY_ROWS}

def init_db(app):
    # Конфигурируем SQLAlchemy
    app.config["SQLALCHEMY_DATABASE_URI"]        = os.environ["SQLALCHEMY_DATABASE_URI"]
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    db.init_app(app)
    with app.app_context():
        db.create_all()
        logger.info("Database initialized, tables created")

def save_feedback_to_db(data: dict):
    """
    Для каждого спикера из data['speakersFeedback'] создаём отдельную запись,
    остальные поля дублируем.
    """
    try:
        # 1) Общие поля
        dt      = datetime.fromisoformat(data["dateTime"])
        partner = data.get("partner", "")

        ca = data.get("commonAnswers", {})
        value                  = ca.get("usefulness", "")
        value_description      = ca.get("uselessArgument", "") or "-"
        impressions            = ca.get("brightThoughts", "")
        wanted                 = ca.get("additionalSuggestions", "")
        stats_desc             = ca.get("statsDetails", "") or "-"
        mood                   = ca.get("mood", "")
        common_feelings        = ca.get("impression", "")
        nps                    = ca.get("recommendation", None)

        # 2) Шкалы позитивных/негативных качеств
        quality_map = [
            {"positive": "Экспертный",                 "negative": "Некомпетентный"},
            {"positive": "Энергичный",                  "negative": "Пассивный"},
            {"positive": "Мотивирующий",                "negative": "Невдохновляющий"},
            {"positive": "Харизматичный",               "negative": "Душный"},
            {"positive": "Доступно доносит информацию", "negative": "Говорит сложными терминами"},
        ]
        pos_labels = {r["positive"] for r in quality_map}
        neg_labels = {r["negative"] for r in quality_map}

        # 3) По каждому спикеру — отдельная строка
        speakers = data.get("speakersFeedback", [])
        for sp in speakers:
            speaker_name = sp.get("fullName", "")
            qualities = sp.get("qualities", []) or []

            positive_list = [q for q in qualities if q in pos_labels]
            negative_list = [q for q in qualities if q in neg_labels]

            positive = ", ".join(positive_list) or "-"
            negative = ", ".join(negative_list) or "-"

            fb = Feedback(
                dtime                  = dt,
                partner                = partner,
                speaker                = speaker_name,
                positive_qualities     = positive,
                negative_qualities     = negative,
                value                  = value,
                value_description      = value_description,
                impressions            = impressions,
                wanted                 = wanted,
                statistics_description = stats_desc,
                mood                   = mood,
                common_feelings        = common_feelings,
                nps                    = nps
            )
            db.session.add(fb)

        db.session.commit()
        logger.info("Saved %d feedback rows", len(speakers))

    except Exception:
        logger.exception("Failed to save feedback to DB")
        # В случае ошибки можно откатить:
        db.session.rollback()



