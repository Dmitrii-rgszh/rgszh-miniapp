# db_saver.py

import os
import logging
from datetime import datetime
from dotenv import load_dotenv
from flask_sqlalchemy import SQLAlchemy

# подгружаем .env (если есть)
load_dotenv()

logger = logging.getLogger("db_saver")
logger.setLevel(logging.INFO)

db = SQLAlchemy()

class Feedback(db.Model):
    __tablename__ = "feedback"
    id                     = db.Column(db.Integer, primary_key=True, autoincrement=True)
    dtime                  = db.Column(db.DateTime,  nullable=False)
    partner                = db.Column(db.Text,      nullable=False)
    speaker                = db.Column(db.Text,      nullable=False)
    positive_qualities     = db.Column(db.Text,      nullable=False)
    negative_qualities     = db.Column(db.Text,      nullable=False)
    value                  = db.Column(db.Text,      nullable=False)
    value_description      = db.Column(db.Text,      nullable=False)
    impressions            = db.Column(db.Text,      nullable=False)
    wanted                 = db.Column(db.Text,      nullable=False)
    statistics_description = db.Column(db.Text,      nullable=False)
    mood                   = db.Column(db.Text,      nullable=False)
    common_feelings        = db.Column(db.Text,      nullable=False)
    nps                    = db.Column(db.Integer,   nullable=True)

def init_db(app):
    """
    Инициализация SQLAlchemy:
    Используем переменные окружения для подключения к БД
    """
    # Получаем URI из переменных окружения или используем дефолтный
    db_uri = os.getenv("SQLALCHEMY_DATABASE_URI") or os.getenv("DATABASE_URL")
    
    if not db_uri:
        # Используем локальную SQLite базу данных для избежания проблем с кодировкой
        db_uri = "sqlite:///miniapp.db"
        logger.warning("Переменные SQLALCHEMY_DATABASE_URI и DATABASE_URL не найдены, использую локальную SQLite БД")
    
    logger.info("Используемая БД: %s", db_uri.replace(":secret@", ":***@"))
    app.config["SQLALCHEMY_DATABASE_URI"] = db_uri
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    db.init_app(app)
    with app.app_context():
        db.create_all()
        logger.info("Таблицы созданы (или уже существуют)")

def save_feedback_to_db(data: dict):
    """
    Сохраняет форму «Обратная связь» в таблицу feedback.
    Для каждого спикера из data['speakersFeedback'] создаётся своя запись,
    остальные поля дублируются в каждой.
    """
    try:
        # общий блок
        dt      = datetime.fromisoformat(data["dateTime"])
        partner = data.get("partner", "")

        ca = data.get("commonAnswers", {})
        value              = ca.get("usefulness", "")
        value_description  = ca.get("uselessArgument", "") or "-"
        impressions        = ca.get("brightThoughts", "")
        wanted             = ca.get("additionalSuggestions", "")
        stats_desc         = ca.get("statsDetails", "") or "-"
        mood               = ca.get("mood", "")
        common_feelings    = ca.get("impression", "")
        nps                = ca.get("recommendation", None)

        # справочник качеств из React
        QUALITY_ROWS = [
            {"positive": "Экспертный",                 "negative": "Некомпетентный"},
            {"positive": "Энергичный",                  "negative": "Пассивный"},
            {"positive": "Мотивирующий",                "negative": "Невдохновляющий"},
            {"positive": "Харизматичный",               "negative": "Душный"},
            {"positive": "Доступно доносит информацию", "negative": "Говорит сложными терминами"},
        ]
        pos_labels = {r["positive"] for r in QUALITY_ROWS}
        neg_labels = {r["negative"] for r in QUALITY_ROWS}

        speakers = data.get("speakersFeedback", []) or []
        for sp in speakers:
            speaker_name = sp.get("fullName", "")
            qualities    = sp.get("qualities", []) or []

            positive_list = [q for q in qualities if q in pos_labels]
            negative_list = [q for q in qualities if q in neg_labels]

            fb = Feedback(
                dtime                  = dt,
                partner                = partner,
                speaker                = speaker_name,
                positive_qualities     = ", ".join(positive_list) or "-",
                negative_qualities     = ", ".join(negative_list) or "-",
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
        logger.info("Сохранено записей feedback: %d", len(speakers))

    except Exception:
        logger.exception("Ошибка при сохранении feedback")
        db.session.rollback()




