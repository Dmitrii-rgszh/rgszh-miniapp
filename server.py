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
CARE_FUTURE_AVAILABLE = False
CARE_FUTURE_ERROR = None

print("🔄 Загрузка модулей калькулятора НСЖ...")

try:
    # Сначала проверяем зависимости
    import sqlalchemy
    import psycopg2
    print("  ✅ Зависимости найдены")
    
    # Затем импортируем наши модули
    from care_future_models import init_nsj_database, NSJDataManager
    from care_future_routes import init_care_future_routes
    
    CARE_FUTURE_AVAILABLE = True
    print("  ✅ Модули калькулятора НСЖ загружены успешно")
    
except ImportError as e:
    CARE_FUTURE_ERROR = f"ImportError: {e}"
    print(f"  ❌ Ошибка импорта: {e}")
    print(f"  💡 Установите зависимости: pip install psycopg2-binary sqlalchemy flask-sqlalchemy")
    
except Exception as e:
    CARE_FUTURE_ERROR = f"Error: {e}"
    print(f"  ❌ Другая ошибка: {e}")

# ====== Logging setup ======
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s"
)
logger = logging.getLogger("server")

# ====== Flask app ======
app = Flask(__name__, static_folder="build", static_url_path="")

CORS(app, resources={
    r"/*": {
        "origins": [
            "http://localhost:3000",
            "http://localhost:3001", 
            "http://localhost:4000",
            "http://localhost:4001",  # Добавить
            "http://127.0.0.1:*",
            "https://rgszh-miniapp.org"
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

@app.before_request
def log_request():
    logger.info(f"🔍 Incoming request: {request.method} {request.path}")

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

# ===== ИНИЦИАЛИЗАЦИЯ КАЛЬКУЛЯТОРА НСЖ =====
print("🚀 Инициализация калькулятора НСЖ...")

if CARE_FUTURE_AVAILABLE:
    try:
        # Инициализируем БД калькулятора
        print("  🗄️ Инициализация базы данных...")
        with app.app_context():
            init_success = init_nsj_database()
            if init_success:
                print("  ✅ БД калькулятора НСЖ инициализирована")
            else:
                print("  ⚠️ Предупреждения при инициализации БД")
        
        # Регистрируем routes
        print("  🔗 Регистрация API endpoints...")
        route_success = init_care_future_routes(app)
        if route_success:
            print("  ✅ API калькулятора НСЖ зарегистрировано")
            print("  📍 Доступные endpoints:")
            print("    - POST /api/care-future/calculate")
            print("    - GET  /api/care-future/test")
            print("    - GET  /api/care-future/admin/status")
        else:
            print("  ❌ Ошибка регистрации API калькулятора НСЖ")
            
    except Exception as e:
        print(f"  ❌ Ошибка инициализации калькулятора НСЖ: {e}")
        CARE_FUTURE_AVAILABLE = False
        CARE_FUTURE_ERROR = str(e)
else:
    print(f"  ℹ️ Калькулятор НСЖ отключен. Причина: {CARE_FUTURE_ERROR}")

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

# ===== CARE FUTURE ENDPOINTS =====

@app.route('/api/care-future/status', methods=['GET'])
def care_future_status():
    """Статус калькулятора НСЖ"""
    return jsonify({
        'available': CARE_FUTURE_AVAILABLE,
        'error': CARE_FUTURE_ERROR,
        'files_exist': {
            'care_future_models.py': os.path.exists('care_future_models.py'),
            'care_future_routes.py': os.path.exists('care_future_routes.py'),
            'care_future_schema.sql': os.path.exists('care_future_schema.sql'),
            'care_future_data.sql': os.path.exists('care_future_data.sql')
        }
    })

@app.route('/api/care-future/test', methods=['GET'])
def care_future_test():
    """Тестовый endpoint калькулятора НСЖ"""
    try:
        if not CARE_FUTURE_AVAILABLE:
            return jsonify({
                'status': 'error',
                'message': 'Калькулятор НСЖ недоступен',
                'error': CARE_FUTURE_ERROR
            }), 503
        
        # Простой тест расчета
        from care_future_models import NSJCalculator, CalculationInput
        from datetime import date
        
        test_input = CalculationInput(
            birth_date=date(1990, 1, 1),
            gender='male',
            contract_term=5,
            calculation_type='from_premium',
            input_amount=960000,
            email='test@example.com'
        )
        
        calculator = NSJCalculator()
        result = calculator.calculate(test_input)
        
        return jsonify({
            'status': 'success',
            'message': 'Калькулятор НСЖ работает корректно!',
            'test_result': {
                'calculation_id': result.calculation_uuid,
                'premium_amount': result.premium_amount,
                'insurance_sum': result.insurance_sum,
                'accumulated_capital': result.accumulated_capital,
                'program_income': result.program_income,
                'tax_deduction': result.tax_deduction
            },
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Ошибка теста калькулятора: {str(e)}'
        }), 500

@app.route('/api/care-future/calculate', methods=['POST', 'OPTIONS'])
def care_future_calculate():
    """Основной endpoint для расчета НСЖ"""
    if request.method == "OPTIONS":
        return '', 200
    
    if not CARE_FUTURE_AVAILABLE:
        return jsonify({
            'success': False,
            'error': f'Калькулятор НСЖ недоступен: {CARE_FUTURE_ERROR}'
        }), 503
    
    try:
        # Получаем данные запроса
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error': 'Отсутствуют данные запроса'
            }), 400
        
        logger.info(f"📊 Выполняем расчет: {data.get('calculationType', 'unknown')} для {data.get('gender', 'unknown')}")
        
        # Импортируем модули
        from care_future_models import NSJCalculator, CalculationInput
        from datetime import datetime, date
        
        # Преобразуем и валидируем данные
        try:
            birth_date = datetime.strptime(data['birthDate'], '%Y-%m-%d').date()
        except (KeyError, ValueError) as e:
            return jsonify({
                'success': False,
                'error': 'Неверный формат даты рождения. Используйте YYYY-MM-DD'
            }), 400
        
        # Валидация обязательных полей
        required_fields = ['gender', 'contractTerm', 'calculationType', 'inputAmount']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify({
                'success': False,
                'error': f'Отсутствуют обязательные поля: {", ".join(missing_fields)}'
            }), 400
        
        # Создаем объект входных данных
        calculation_input = CalculationInput(
            birth_date=birth_date,
            gender=data['gender'],
            contract_term=int(data['contractTerm']),
            calculation_type=data['calculationType'],
            input_amount=int(data['inputAmount']),
            email=data.get('email'),
            calculation_date=date.today()
        )
        
        # Выполняем расчет
        calculator = NSJCalculator()
        result = calculator.calculate(calculation_input)
        
        # Формируем ответ
        response_data = {
            'success': True,
            'calculationId': result.calculation_uuid,
            'inputParameters': {
                'birthDate': calculation_input.birth_date.isoformat(),
                'gender': calculation_input.gender,
                'contractTerm': calculation_input.contract_term,
                'calculationType': calculation_input.calculation_type,
                'inputAmount': calculation_input.input_amount,
                'email': calculation_input.email,
                'ageAtStart': result.age_at_start,
                'ageAtEnd': result.age_at_end
            },
            'results': {
                'premiumAmount': result.premium_amount,
                'insuranceSum': result.insurance_sum,
                'accumulatedCapital': result.accumulated_capital,
                'programIncome': result.program_income,
                'taxDeduction': result.tax_deduction
            },
            'redemptionValues': result.redemption_values,
            'calculatedAt': datetime.now().isoformat()
        }
        
        logger.info(f"✅ Расчет выполнен успешно: {result.calculation_uuid}")
        return jsonify(response_data)
        
    except ValueError as e:
        logger.warning(f"⚠️ Ошибка валидации: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400
        
    except Exception as e:
        logger.error(f"❌ Ошибка расчета: {e}")
        return jsonify({
            'success': False,
            'error': f'Внутренняя ошибка сервера: {str(e)}'
        }), 500

@app.route('/care-future/calculate', methods=['POST', 'OPTIONS'])
def care_future_proxy():
    """✅ ИСПРАВЛЕНО: Проксирующий endpoint для фронтенда (без конфликта имен)"""
    logger.info("🌐 ➜ %s %s (PROXY)", request.method, request.path)
    
    if request.method == "OPTIONS":
        return '', 200
    
    if not CARE_FUTURE_AVAILABLE:
        logger.error("❌ Калькулятор НСЖ недоступен")
        return jsonify({
            'success': False,
            'error': f'Калькулятор НСЖ временно недоступен: {CARE_FUTURE_ERROR}'
        }), 503
    
    try:
        # Получаем данные запроса
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error': 'Отсутствуют данные запроса'
            }), 400
        
        logger.info(f"📊 Проксирование расчета: {data.get('calculationType', 'unknown')} для возраста {data.get('birthDate', 'unknown')}")
        
        # Импортируем модули локально для безопасности
        from care_future_models import NSJCalculator, CalculationInput
        from datetime import datetime, date
        
        # Преобразуем данные
        try:
            birth_date = datetime.strptime(data['birthDate'], '%Y-%m-%d').date()
        except (KeyError, ValueError) as e:
            return jsonify({
                'success': False,
                'error': 'Неверный формат даты рождения. Используйте YYYY-MM-DD'
            }), 400
        
        # Валидация обязательных полей
        required_fields = ['gender', 'contractTerm', 'calculationType', 'inputAmount']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify({
                'success': False,
                'error': f'Отсутствуют обязательные поля: {", ".join(missing_fields)}'
            }), 400
        
        # Создаем объект входных данных
        calculation_input = CalculationInput(
            birth_date=birth_date,
            gender=data['gender'],
            contract_term=int(data['contractTerm']),
            calculation_type=data['calculationType'],
            input_amount=int(data['inputAmount']),
            email=data.get('email'),
            calculation_date=date.today()
        )
        
        # Выполняем расчет
        calculator = NSJCalculator()
        result = calculator.calculate(calculation_input)
        
        # Формируем ответ
        response_data = {
            'success': True,
            'calculationId': result.calculation_uuid,
            'inputParameters': {
                'birthDate': calculation_input.birth_date.isoformat(),
                'gender': calculation_input.gender,
                'contractTerm': calculation_input.contract_term,
                'calculationType': calculation_input.calculation_type,
                'inputAmount': calculation_input.input_amount,
                'email': calculation_input.email,
                'ageAtStart': result.age_at_start,
                'ageAtEnd': result.age_at_end
            },
            'results': {
                'premiumAmount': result.premium_amount,
                'insuranceSum': result.insurance_sum,
                'accumulatedCapital': result.accumulated_capital,
                'programIncome': result.program_income,
                'taxDeduction': result.tax_deduction
            },
            'redemptionValues': result.redemption_values,
            'calculatedAt': datetime.now().isoformat()
        }
        
        logger.info(f"✅ Расчет выполнен успешно: {result.calculation_uuid}")
        return jsonify(response_data)
        
    except ValueError as e:
        logger.warning(f"⚠️ Ошибка валидации в прокси: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400
        
    except Exception as e:
        logger.error(f"❌ Ошибка расчета в прокси: {e}")
        return jsonify({
            'success': False,
            'error': 'Внутренняя ошибка сервера'
        }), 500

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
# ВАЖНО: Эти маршруты должны быть ПОСЛЕДНИМИ, после всех API маршрутов
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react_app(path):
    logger.info(f"📁 Requested path: '{path}'")
    logger.info(f"📁 Static folder: {app.static_folder}")
    logger.info(f"📁 Current directory: {os.getcwd()}")
    
    # Проверяем, существует ли запрошенный файл
    file_path = os.path.join(app.static_folder, path)
    
    if path and os.path.exists(file_path) and os.path.isfile(file_path):
        logger.info(f"📁 Serving static file: {path}")
        return send_from_directory(app.static_folder, path)
    else:
        # Для всех остальных маршрутов возвращаем index.html (SPA)
        logger.info(f"📁 Serving index.html for SPA route: {path}")
        try:
            return send_from_directory(app.static_folder, 'index.html')
        except Exception as e:
            logger.error(f"❌ Error serving index.html: {e}")
            return "Build folder or index.html not found", 404

# ====== App startup ======
if __name__ == '__main__':
    logger.info("🚀 Starting MiniApp Server...")
    
    # Проверяем наличие build папки
    if not os.path.exists('build'):
        logger.error("❌ Build folder not found! Run 'npm run build' first")
    else:
        logger.info(f"✅ Build folder found with {len(os.listdir('build'))} items")
    
    # Проверяем email конфигурацию
    if SMTP_PASSWORD:
        logger.info(f"📧 Email configured: {SMTP_FROM} -> {SMTP_TO}")
    else:
        logger.warning("📧 Email not configured (SMTP_PASSWORD missing)")
    
    # Проверяем статус калькулятора при запуске
    if CARE_FUTURE_AVAILABLE:
        logger.info("🧮 Care Future калькулятор НСЖ: ДОСТУПЕН")
        logger.info("📍 Endpoints: /api/care-future/* и /care-future/calculate")
    else:
        logger.warning("🧮 Care Future калькулятор НСЖ: НЕДОСТУПЕН")
        logger.info("📍 Доступные тестовые endpoints:")
        logger.info("   - GET /api/care-future/status")
    
    port = int(os.environ.get("FLASK_PORT", 4000))
    logger.info(f"📍 Server will run on port {port}")
    logger.info(f"📍 Open http://localhost:{port}/ in your browser")
    
    socketio.run(app, host='0.0.0.0', port=port, debug=False)





















