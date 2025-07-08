# server.py

import os
import logging
import threading
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from datetime import datetime

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO

from db_saver import init_db, save_feedback_to_db
from polls_ws import register_poll_ws
from polls_routes import register_poll_routes
from assessment_routes import register_assessment_routes  # Новый импорт

# ===== ИМПОРТЫ ДЛЯ КАЛЬКУЛЯТОРА НСЖ =====
try:
    from care_future_models import init_nsj_database, NSJDataManager
    from care_future_routes import init_care_future_routes
    CARE_FUTURE_AVAILABLE = True
    logger = logging.getLogger("server")
    logger.info("✅ Модули калькулятора НСЖ загружены")
except ImportError as e:
    CARE_FUTURE_AVAILABLE = False
    logger = logging.getLogger("server")
    logger.warning(f"⚠️ Калькулятор НСЖ не загружен: {e}")

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

# Инициализация калькулятора НСЖ
if CARE_FUTURE_AVAILABLE:
    try:
        # Инициализируем БД калькулятора
        with app.app_context():
            init_success = init_nsj_database()
            if init_success:
                logger.info("✅ БД калькулятора НСЖ инициализирована")
            else:
                logger.warning("⚠️ Ошибка инициализации БД калькулятора НСЖ")
        
        # Регистрируем routes
        route_success = init_care_future_routes(app)
        if route_success:
            logger.info("✅ API калькулятора НСЖ зарегистрировано")
        else:
            logger.warning("⚠️ Ошибка регистрации API калькулятора НСЖ")
            
    except Exception as e:
        logger.error(f"❌ Ошибка инициализации калькулятора НСЖ: {e}")
else:
    logger.info("ℹ️ Калькулятор НСЖ отключен")

# ====== Email Configuration ======
SMTP_SERVER = os.environ.get("SMTP_SERVER", "smtp.yandex.ru")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER", "rgszh-miniapp@yandex.ru")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "")
SMTP_FROM = os.environ.get("SMTP_FROM", "rgszh-miniapp@yandex.ru")
SMTP_TO = os.environ.get("SMTP_TO", "zerotlt@mail.ru")

def send_email(subject, body, to_email=None):
    """
    Отправляет простой email через SMTP (без вложений)
    """
    try:
        if not SMTP_PASSWORD:
            logger.warning("📧 SMTP password not configured, skipping email send")
            return False
            
        # Используем переданный email или дефолтный
        recipient = to_email or SMTP_TO
        
        logger.info(f"📧 Sending email to {recipient}: {subject}")
        
        # Создаем сообщение
        msg = MIMEMultipart()
        msg['From'] = SMTP_FROM
        msg['To'] = recipient
        msg['Subject'] = subject
        
        # Добавляем тело письма
        msg.attach(MIMEText(body, 'plain', 'utf-8'))
        
        # Отправляем через SMTP
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()  # Включаем шифрование
            server.login(SMTP_USER, SMTP_PASSWORD)
            text = msg.as_string()
            server.sendmail(SMTP_FROM, recipient, text)
        
        logger.info(f"✅ Email sent successfully to {recipient}")
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to send email: {e}")
        return False

def send_email_with_attachment(subject, body, attachment_data, attachment_filename, to_email=None):
    """
    Отправляет email с вложением через SMTP
    
    Args:
        subject: Тема письма
        body: Тело письма
        attachment_data: Данные вложения в байтах
        attachment_filename: Имя файла вложения
        to_email: Email получателя (опционально)
    
    Returns:
        bool: True если отправлено успешно
    """
    try:
        if not SMTP_PASSWORD:
            logger.warning("📧 SMTP password not configured, skipping email send")
            return False
            
        if not attachment_data:
            logger.warning("📧 No attachment data provided, sending simple email")
            return send_email(subject, body, to_email)
            
        # Используем переданный email или дефолтный
        recipient = to_email or SMTP_TO
        
        logger.info(f"📧 Sending email with attachment to {recipient}: {subject}")
        logger.info(f"📎 Attachment: {attachment_filename} ({len(attachment_data)} bytes)")
        
        # Создаем сообщение
        msg = MIMEMultipart()
        msg['From'] = SMTP_FROM
        msg['To'] = recipient
        msg['Subject'] = subject
        
        # Добавляем тело письма
        msg.attach(MIMEText(body, 'plain', 'utf-8'))
        
        # Добавляем вложение
        attachment = MIMEBase('application', 'octet-stream')
        attachment.set_payload(attachment_data)
        encoders.encode_base64(attachment)
        attachment.add_header(
            'Content-Disposition',
            f'attachment; filename= {attachment_filename}'
        )
        msg.attach(attachment)
        
        # Отправляем через SMTP
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()  # Включаем шифрование
            server.login(SMTP_USER, SMTP_PASSWORD)
            text = msg.as_string()
            server.sendmail(SMTP_FROM, recipient, text)
        
        logger.info(f"✅ Email with attachment sent successfully to {recipient}")
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to send email with attachment: {e}")
        # Fallback - пробуем отправить без вложения
        logger.info("🔄 Trying to send email without attachment as fallback...")
        return send_email(subject, body, to_email)

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
        logger.error("   JSON parse error: %s", e)
        return jsonify({"error": "Invalid JSON"}), 400

    # Сохраняем в БД
    try:
        save_feedback_to_db(payload)
        return jsonify({"success": True}), 200
    except Exception as e:
        logger.error("   DB save error: %s", e)
        return jsonify({"error": "Database error"}), 500

# ====== EMAIL PROXY ENDPOINTS ======

@app.route('/api/proxy/assessment/send_manager', methods=['POST', 'OPTIONS'])
def send_assessment_email():
    """Отправка email уведомлений для assessment"""
    logger.info("🌐 ➜ %s %s", request.method, request.path)
    
    if request.method == "OPTIONS":
        return '', 200
    
    try:
        data = request.get_json()
        subject = data.get('subject', 'Assessment Notification')
        body = data.get('body', '')
        
        # Отправляем email
        success = send_email(subject, body)
        
        if success:
            return jsonify({"success": True, "message": "Email sent successfully"}), 200
        else:
            return jsonify({"success": False, "message": "Failed to send email"}), 500
            
    except Exception as e:
        logger.error(f"❌ Error in assessment email endpoint: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/api/proxy/snp/send_manager', methods=['POST', 'OPTIONS'])
def send_snp_email():
    """Отправка email уведомлений для SNP"""
    logger.info("🌐 ➜ %s %s", request.method, request.path)
    
    if request.method == "OPTIONS":
        return '', 200
    
    try:
        data = request.get_json()
        subject = data.get('subject', 'SNP Notification')
        body = data.get('body', '')
        
        # Отправляем email
        success = send_email(subject, body)
        
        if success:
            return jsonify({"success": True, "message": "Email sent successfully"}), 200
        else:
            return jsonify({"success": False, "message": "Failed to send email"}), 500
            
    except Exception as e:
        logger.error(f"❌ Error in SNP email endpoint: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/api/proxy/carefuture/send_manager', methods=['POST', 'OPTIONS'])
def send_carefuture_email():
    """Отправка email уведомлений для Care Future"""
    logger.info("🌐 ➜ %s %s", request.method, request.path)
    
    if request.method == "OPTIONS":
        return '', 200
    
    try:
        data = request.get_json()
        subject = data.get('subject', 'Care Future Notification')
        body = data.get('body', '')
        
        # Отправляем email
        success = send_email(subject, body)
        
        if success:
            return jsonify({"success": True, "message": "Email sent successfully"}), 200
        else:
            return jsonify({"success": False, "message": "Failed to send email"}), 500
            
    except Exception as e:
        logger.error(f"❌ Error in Care Future email endpoint: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/api/contact-manager', methods=['POST', 'OPTIONS'])
def contact_manager():
    """Обработка заявок на связь с менеджером из Care Future"""
    logger.info("🌐 ➜ %s %s", request.method, request.path)
    
    if request.method == "OPTIONS":
        return '', 200
    
    try:
        data = request.get_json()
        
        # Формируем email для менеджера
        subject = f"Новая заявка с калькулятора НСЖ от {data.get('surname', '')} {data.get('name', '')}"
        
        body = f"""
Новая заявка на консультацию по программе "Забота о будущем Ультра"

Данные клиента:
- Фамилия: {data.get('surname', 'Не указана')}
- Имя: {data.get('name', 'Не указано')}
- Город: {data.get('city', 'Не указан')}
- Email: {data.get('email', 'Не указан')}

Дополнительная информация:
- Страница: {data.get('page', 'care-future')}
- ID расчета: {data.get('calculationId', 'Нет')}
- Дата заявки: {datetime.now().strftime('%d.%m.%Y %H:%M')}

---
Автоматическое уведомление из MiniApp
        """
        
        # Отправляем email
        success = send_email(subject, body)
        
        if success:
            logger.info(f"✅ Заявка от {data.get('surname', '')} {data.get('name', '')} отправлена")
            return jsonify({"success": True, "message": "Заявка отправлена успешно"}), 200
        else:
            return jsonify({"success": False, "message": "Ошибка отправки заявки"}), 500
            
    except Exception as e:
        logger.error(f"❌ Ошибка обработки заявки менеджера: {e}")
        return jsonify({"error": "Внутренняя ошибка сервера"}), 500

# ====== Static files ======
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react_app(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

# ====== App startup ======
if __name__ == '__main__':
    logger.info("🚀 Starting MiniApp Server...")
    
    # Проверяем email конфигурацию
    if SMTP_PASSWORD:
        logger.info(f"📧 Email configured: {SMTP_FROM} -> {SMTP_TO}")
    else:
        logger.warning("📧 Email not configured (SMTP_PASSWORD missing)")
    
    port = int(os.environ.get("PORT", 5000))
    socketio.run(app, host='0.0.0.0', port=5000, debug=False)






















