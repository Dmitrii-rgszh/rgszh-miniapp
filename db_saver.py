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
    dtime               = db.Column(db.DateTime, default=datetime.utcnow)
    partner                  = db.Column(db.Text)
    speaker                  = db.Column(db.Text)
    positive_qualities       = db.Column(db.Text)
    negative_qualities       = db.Column(db.Text)
    value                    = db.Column(db.Text)
    value_description        = db.Column(db.Text)
    impressions              = db.Column(db.Text)
    wanted                   = db.Column(db.Text)
    statistics_description   = db.Column(db.Text)
    mood                     = db.Column(db.Text)
    common_feelings          = db.Column(db.Text)
    nps                      = db.Column(db.Integer)

def init_db(app):
    db_uri = os.environ["SQLALCHEMY_DATABASE_URI"]
    app.config["SQLALCHEMY_DATABASE_URI"]        = db_uri
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    db.init_app(app)
    with app.app_context():
        db.create_all()
        logger.info("Database initialized, tables created")

def save_feedback_to_db(data: dict):
    """
    По каждому speaker из data['speakersFeedback'] создаём отдельную запись.
    Остальные поля дублируем.
    """
    try:
        # Обязательные общие поля
        dt = datetime.fromisoformat(data.get("dateTime"))
        partner = data.get("partner","")
        # Поля из commonAnswers
        ca = data.get("commonAnswers",{})
        value             = ca.get("usefulness","")
        value_description = ca.get("uselessArgument","") or "-"
        impressions       = ca.get("brightThoughts","")
        wanted            = ca.get("additionalSuggestions","")
        stats_desc        = ca.get("statsDetails","") or "-"
        mood              = ca.get("mood","")
        common_feelings   = ca.get("impression","")
        nps               = ca.get("recommendation", None)

        speakers = data.get("speakersFeedback", [])
        for sp in speakers:
            # Для каждого спикера:
            speaker_name = sp.get("fullName","")
            qualities = sp.get("qualities",[]) or []
            # Предполагаем, что частично первые — позитив, вторые — негатив:
            half = len(qualities)//2
            positive = ", ".join(str(q) for q in qualities[:half]) or "-"
            negative = ", ".join(str(q) for q in qualities[half:]) or "-"

            fb = Feedback(
                dtime                    = dt,
                partner                  = partner,
                speaker                  = speaker_name,
                positive_qualities       = positive,
                negative_qualities       = negative,
                value                    = value,
                value_description        = value_description,
                impressions              = impressions,
                wanted                   = wanted,
                statistics_description   = stats_desc,
                mood                     = mood,
                common_feelings          = common_feelings,
                nps                      = nps
            )
            db.session.add(fb)

        db.session.commit()
        logger.info("Saved %d feedback rows", len(speakers))

    except Exception:
        logger.exception("Failed to save feedback to DB")



