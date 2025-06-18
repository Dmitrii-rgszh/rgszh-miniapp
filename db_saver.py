# db_saver.py

import os
import logging
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

logger = logging.getLogger("db_saver")
logger.setLevel(logging.INFO)

# Создаём экземпляр SQLAlchemy (будем инициализировать его в server.py)
db = SQLAlchemy()

class Feedback(db.Model):
    __tablename__ = "feedback"
    id         = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name       = db.Column(db.String(128))
    department = db.Column(db.String(128))
    grade      = db.Column(db.String(64))
    program    = db.Column(db.String(256))
    reason     = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

def init_db(app):
    """
    Настраивает SQLAlchemy, создаёт таблицы.
    Вызывать из server.py сразу после создания Flask-app.
    """
    # читаем URI из окружения, либо sqlite-фоллбэк
    db_uri = os.environ.get(
        "SQLALCHEMY_DATABASE_URI",
        "sqlite:////data/feedback.db"
    )
    app.config["SQLALCHEMY_DATABASE_URI"] = db_uri
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    db.init_app(app)
    with app.app_context():
        db.create_all()
        logger.info("Database initialized, tables created if needed")

def save_feedback_to_db(data: dict):
    """
    Сохраняет один фидбэк в БД.
    Можно вызывать в отдельном потоке.
    """
    try:
        fb = Feedback(
            name=data.get("name"),
            department=data.get("department"),
            grade=data.get("grade"),
            program=data.get("program"),
            reason=data.get("reason")
        )
        db.session.add(fb)
        db.session.commit()
        logger.info("Saved feedback id=%s", fb.id)
    except Exception:
        logger.exception("Failed to save feedback to DB")


