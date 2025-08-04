# server.py

import os
import logging
import threading
import smtplib
import sys
import uuid
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from datetime import datetime

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO
from flask_compress import Compress
from care_future_models import NSJCalculator, CalculationInput, NSJCalculations

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

# ИМПОРТ ПОЛНОГО КАЛЬКУЛЯТОРА "НА ВСЯКИЙ СЛУЧАЙ"
try:
    from justincase_routes import register_justincase_routes
    JUSTINCASE_AVAILABLE = True
    JUSTINCASE_ERROR = None
    print("✅ Полный модуль калькулятора 'На всякий случай' загружен")
except ImportError as e:
    JUSTINCASE_AVAILABLE = False
    JUSTINCASE_ERROR = str(e)
    print(f"⚠️ Полный калькулятор 'На всякий случай' недоступен: {e}")
except Exception as e:
    JUSTINCASE_AVAILABLE = False
    JUSTINCASE_ERROR = str(e)
    print(f"❌ Ошибка загрузки калькулятора 'На всякий случай': {e}")

# ====== Настройки логирования ======
import logging
import sys
import os

# Исправление кодировки для Windows
if os.name == 'nt':  # Windows
    import codecs
    # Устанавливаем UTF-8 для stdout
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer)
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('miniapp.log', encoding='utf-8') if os.path.exists('.') else logging.NullHandler()
    ]
)

logger = logging.getLogger("server")

# Создаем специальные логгеры
calculator_logger = logging.getLogger('calculators')
calculator_logger.setLevel(logging.INFO)

# Подавляем излишне подробные логи некоторых библиотек
logging.getLogger('werkzeug').setLevel(logging.WARNING)
logging.getLogger('urllib3').setLevel(logging.WARNING)

# ====== Flask app ======
app = Flask(__name__, static_folder="build", static_url_path="")
Compress(app)


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

# ====== Middleware для логирования =====

@app.before_request
def log_request_info():
    """Логирование входящих запросов для калькуляторов"""
    if request.path.startswith('/api/'):
        logger.info(f"📨 {request.method} {request.path} - {request.remote_addr}")
        if request.method == 'POST' and request.is_json:
            # Логируем только ключи, не значения (безопасность)
            try:
                data_keys = list(request.get_json().keys()) if request.get_json() else []
                logger.info(f"   📋 JSON keys: {data_keys}")
            except:
                logger.info("   📋 JSON parsing failed")
    else:
        logger.info(f"🔍 Incoming request: {request.method} {request.path}")

@app.after_request  
def log_response_info(response):
    """Логирование ответов API"""
    if request.path.startswith('/api/'):
        logger.info(f"📤 {request.method} {request.path} -> {response.status_code}")
        if response.status_code >= 400:
            logger.warning(f"   ⚠️ Error response: {response.status}")
    return response

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

# ===== ИНИЦИАЛИЗАЦИЯ ПОЛНОГО КАЛЬКУЛЯТОРА "НА ВСЯКИЙ СЛУЧАЙ" =====
print("🚀 Инициализация полного калькулятора 'На всякий случай'...")

if JUSTINCASE_AVAILABLE:
    try:
        print("  🔗 Регистрируем Blueprint...")
        route_success = register_justincase_routes(app)
        if route_success:
            print("  ✅ API полного калькулятора 'На всякий случай' зарегистрировано")
            print("  📍 Доступные endpoints:")
            print("    - POST /api/proxy/calculator/save (основной для фронтенда)")
            print("    - POST /api/justincase/calculate (расширенный)")
            print("    - POST /api/justincase/validate (валидация данных)")
            print("    - POST /api/justincase/validate-sum (валидация суммы)")
            print("    - POST /api/justincase/recommend-sum (рекомендуемая сумма)")
            print("    - GET  /api/justincase/config (конфигурация)")
            print("    - GET  /api/justincase/test (тестирование)")
            print("    - GET  /api/justincase/status (статус)")
            print("  🎯 Особенности полной версии:")
            print("    - Актуарные таблицы из Excel (11,444+ коэффициентов)")
            print("    - КВ коэффициенты по срокам (20%-60%)")
            print("    - Детальные тарифы НС и КЗ")
            print("    - Выкупные стоимости")
            print("    - Коэффициенты рассрочки")
            print("    - Спортивные доплаты")
        else:
            print("  ❌ Ошибка регистрации API полного калькулятора")
            
    except Exception as e:  # <-- ВОТ ЭТА СТРОКА ОТСУТСТВУЕТ!
        print(f"  ❌ Ошибка инициализации полного калькулятора: {e}")
        JUSTINCASE_AVAILABLE = False
        JUSTINCASE_ERROR = str(e)
else:
    print(f"  ℹ️ Полный калькулятор 'На всякий случай' отключен: {JUSTINCASE_ERROR}")

# ====== Email Configuration ======
SMTP_SERVER = os.environ.get("SMTP_SERVER", "smtp.yandex.ru")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER", "rgszh-miniapp@yandex.ru")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "")
SMTP_FROM = os.environ.get("SMTP_FROM", "rgszh-miniapp@yandex.ru")
SMTP_TO = os.environ.get("SMTP_TO", "zerotlt@mail.ru")
SMTP_TO_ADDITIONAL = os.environ.get("SMTP_TO_ADDITIONAL", "")

def get_email_recipients():
    """
    Возвращает список всех получателей email
    """
    recipients = [SMTP_TO]
    if SMTP_TO_ADDITIONAL:
        recipients.append(SMTP_TO_ADDITIONAL)
    return recipients

def send_email(subject, body, to_email=None):
    """
    Отправляет простой email через SMTP (без вложений)
    Если to_email не указан, отправляет на все настроенные адреса
    """
    try:
        if not SMTP_PASSWORD:
            logger.warning("📧 SMTP password not configured, skipping email send")
            return False
        
        # Определяем получателей
        if to_email:
            recipients = [to_email]
        else:
            recipients = get_email_recipients()
        
        logger.info(f"📧 Sending email to {len(recipients)} recipients: {subject}")
        logger.info(f"📧 Recipients: {', '.join(recipients)}")
        
        # Отправляем через SMTP
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()  # Включаем шифрование
            server.login(SMTP_USER, SMTP_PASSWORD)
            
            # Отправляем каждому получателю
            success_count = 0
            for recipient in recipients:
                try:
                    # Создаем сообщение для каждого получателя
                    msg = MIMEMultipart()
                    msg['From'] = SMTP_FROM
                    msg['To'] = recipient
                    msg['Subject'] = subject
                    
                    # Добавляем тело письма
                    msg.attach(MIMEText(body, 'plain', 'utf-8'))
                    
                    # Отправляем
                    text = msg.as_string()
                    server.sendmail(SMTP_FROM, recipient, text)
                    logger.info(f"✅ Email sent successfully to {recipient}")
                    success_count += 1
                    
                except Exception as e:
                    logger.error(f"❌ Failed to send email to {recipient}: {e}")
        
        # Считаем успешной отправкой, если хотя бы одному получателю доставлено
        success = success_count > 0
        logger.info(f"📧 Email sending summary: {success_count}/{len(recipients)} successful")
        return success
        
    except Exception as e:
        logger.error(f"❌ Failed to send email: {e}")
        return False
    


def send_assessment_email(subject, body):
    """
    Отправляет email для Assessment на специальные адреса:
    - zerotlt@mail.ru
    - Polina.Iureva@rgsl.ru
    (БЕЗ I.dav@mail.ru)
    """
    try:
        if not SMTP_PASSWORD:
            logger.warning("📧 SMTP password not configured, skipping email send")
            return False
        
        # ФИКСИРОВАННЫЕ получатели для Assessment
        assessment_recipients = [
            "zerotlt@mail.ru",
            "Polina.Iureva@rgsl.ru"
        ]
        
        logger.info(f"📧 [Assessment] Sending email to {len(assessment_recipients)} recipients: {subject}")
        logger.info(f"📧 [Assessment] Recipients: {', '.join(assessment_recipients)}")
        
        # Отправляем через SMTP
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()  # Включаем шифрование
            server.login(SMTP_USER, SMTP_PASSWORD)
            
            # Отправляем каждому получателю
            success_count = 0
            for recipient in assessment_recipients:
                try:
                    # Создаем сообщение для каждого получателя
                    msg = MIMEMultipart()
                    msg['From'] = SMTP_FROM
                    msg['To'] = recipient
                    msg['Subject'] = subject
                    
                    # Добавляем тело письма
                    msg.attach(MIMEText(body, 'plain', 'utf-8'))
                    
                    # Отправляем
                    text = msg.as_string()
                    server.sendmail(SMTP_FROM, recipient, text)
                    logger.info(f"✅ [Assessment] Email sent successfully to {recipient}")
                    success_count += 1
                    
                except Exception as e:
                    logger.error(f"❌ [Assessment] Failed to send email to {recipient}: {e}")
        
        # Считаем успешной отправкой, если хотя бы одному получателю доставлено
        success = success_count > 0
        logger.info(f"📧 [Assessment] Email sending summary: {success_count}/{len(assessment_recipients)} successful")
        return success
        
    except Exception as e:
        logger.error(f"❌ [Assessment] Failed to send email: {e}")
        return False

def send_carefuture_email_to_managers(subject, body):
    """
    Отправляет email с результатами калькулятора НСЖ на фиксированные адреса менеджеров
    Получатели: zerotlt@mail.ru, I.dav@mail.ru
    """
    try:
        if not SMTP_PASSWORD:
            logger.warning("📧 SMTP password not configured, skipping email send")
            return False
        
        # ФИКСИРОВАННЫЕ получатели для калькулятора НСЖ
        carefuture_recipients = [
            "zerotlt@mail.ru",
            "I.dav@mail.ru"
        ]
        
        logger.info(f"📧 [CareFuture] Sending email to {len(carefuture_recipients)} recipients: {subject}")
        logger.info(f"📧 [CareFuture] Recipients: {', '.join(carefuture_recipients)}")
        
        # Отправляем через SMTP
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()  # Включаем шифрование
            server.login(SMTP_USER, SMTP_PASSWORD)
            
            # Отправляем каждому получателю
            success_count = 0
            for recipient in carefuture_recipients:
                try:
                    # Создаем сообщение для каждого получателя
                    msg = MIMEMultipart()
                    msg['From'] = SMTP_FROM
                    msg['To'] = recipient
                    msg['Subject'] = subject
                    
                    # Добавляем тело письма
                    msg.attach(MIMEText(body, 'plain', 'utf-8'))
                    
                    # Отправляем
                    text = msg.as_string()
                    server.sendmail(SMTP_FROM, recipient, text)
                    logger.info(f"✅ [CareFuture] Email sent successfully to {recipient}")
                    success_count += 1
                    
                except Exception as e:
                    logger.error(f"❌ [CareFuture] Failed to send email to {recipient}: {e}")
        
        # Считаем успешной отправкой, если хотя бы одному получателю доставлено
        success = success_count > 0
        logger.info(f"📧 [CareFuture] Email sending summary: {success_count}/{len(carefuture_recipients)} successful")
        return success
        
    except Exception as e:
        logger.error(f"❌ [CareFuture] Failed to send email: {e}")
        return False

def print_startup_summary():
    """Выводит сводку по запущенным сервисам"""
    print("\n" + "="*60)
    print("🚀 СЕРВЕР TELEGRAM MINIAPP ЗАПУЩЕН")
    print("="*60)
    print(f"📅 Время запуска: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🌐 URL: http://176.109.110.217")
    print("\n📊 СТАТУС КАЛЬКУЛЯТОРОВ:")
    
    if CARE_FUTURE_AVAILABLE:
        print("  ✅ 'Забота о будущем' (НСЖ) - РАБОТАЕТ")
        print("     📊 Актуарные таблицы, выкупные суммы, налоговые вычеты")
    else:
        print(f"  ❌ 'Забота о будущем' (НСЖ) - ОШИБКА: {CARE_FUTURE_ERROR}")
    
    
    
    print("="*60)
    
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

# ===== СТАТУС ENDPOINTS =====
@app.route('/api/status', methods=['GET'])
def api_status_updated():
    """Обновленный общий статус всех API"""
    return jsonify({
        'status': 'ok',
        'timestamp': datetime.now().isoformat(),
        'server_version': '2.0.0',
        'services': {
            'care_future': {
                'available': CARE_FUTURE_AVAILABLE,
                'error': CARE_FUTURE_ERROR,
                'type': 'НСЖ Накопительное страхование жизни',
                'version': 'v1.15',
                'status': 'full' if CARE_FUTURE_AVAILABLE else 'unavailable'
            },
            'justincase': {
                'available': JUSTINCASE_AVAILABLE,
                'error': JUSTINCASE_ERROR,
                'type': 'Рисковое страхование жизни',
                'version': '2.0.0-complete' if JUSTINCASE_AVAILABLE else 'unavailable',
                'status': 'full' if JUSTINCASE_AVAILABLE else 'unavailable',
                'actuarial_tables_loaded': JUSTINCASE_AVAILABLE,
                'excel_integration': JUSTINCASE_AVAILABLE
            },
            'polls': {
                'available': True,
                'type': 'Система опросов'
            },
            'feedback': {
                'available': True,
                'type': 'Обратная связь'
            },
            'assessment': {
                'available': True,
                'type': 'Оценка кандидатов'
            }
        },
        'endpoints': {
            '/api/care-future/*': 'Калькулятор НСЖ "Забота о будущем" (полный)',
            '/api/proxy/calculator/save': 'Основной калькулятор "На всякий случай" (полный)' if JUSTINCASE_AVAILABLE else 'Основной калькулятор "На всякий случай" (временный)',
            '/api/justincase/*': 'API калькулятора "На всякий случай" (полный)' if JUSTINCASE_AVAILABLE else 'API калькулятора "На всякий случай" (в разработке)',
            '/api/polls/*': 'Система опросов',
            '/api/feedback/save': 'Сохранение обратной связи',
            '/api/assessment/*': 'Система оценки кандидатов'
        },
        'calculators_comparison': {
            'care_future': {
                'name': 'Забота о будущем',
                'type': 'НСЖ (накопительное)',
                'features': ['Накопления', 'Выкупные суммы', 'Инвестиционный доход'],
                'status': 'Работает (полный)' if CARE_FUTURE_AVAILABLE else 'Недоступен',
                'accuracy': 'Полная'
            },
            'justincase': {
                'name': 'На всякий случай',
                'type': 'Рисковое страхование',
                'features': ['Актуарные таблицы', 'НС', 'КЗ', 'КВ коэффициенты', 'Выкупы'] if JUSTINCASE_AVAILABLE else ['Базовые расчеты', 'НС', 'КЗ', 'Возрастные коэффициенты'],
                'status': 'Работает (полный)' if JUSTINCASE_AVAILABLE else 'Недоступен',
                'accuracy': 'Полная (соответствует РГС)' if JUSTINCASE_AVAILABLE else 'Приближенная',
                'limitations': [] if JUSTINCASE_AVAILABLE else ['Упрощенные коэффициенты', 'Нет актуарных таблиц']
            }
        },
        'important_notes': [] if JUSTINCASE_AVAILABLE else [
            'Калькулятор "На всякий случай" работает в упрощенном режиме',
            'Результаты могут отличаться от официального калькулятора РГС',
            'Для точных расчетов требуется полный модуль с актуарными таблицами'
        ]
    })

@app.route('/health', methods=['GET'])
def health_check():
    """Health check для мониторинга сервера"""
    health_status = {
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'uptime': 'unknown',  # Можно добавить подсчет uptime
        'services': {
            'care_future': 'up' if CARE_FUTURE_AVAILABLE else 'down',
            'justincase': 'up' if JUSTINCASE_AVAILABLE else 'down',
            'database': 'up',  # Предполагаем что БД работает
            'polls': 'up',
            'feedback': 'up',
            'assessment': 'up'
        },
        'version': {
            'server': '2.0.0',
            'care_future': 'v1.15' if CARE_FUTURE_AVAILABLE else None,
            'justincase': '2.0.0-complete' if JUSTINCASE_AVAILABLE else None
        },
        'service_details': {
            'justincase': {
                'mode': 'full' if JUSTINCASE_AVAILABLE else 'unavailable',
                'actuarial_tables': JUSTINCASE_AVAILABLE,
                'accuracy': 'high' if JUSTINCASE_AVAILABLE else 'unknown',
                'note': 'Full calculator with actuarial tables loaded' if JUSTINCASE_AVAILABLE else 'Calculator not available'
            }
        }
    }
    
    # Проверяем общее состояние
    down_services = [name for name, status in health_status['services'].items() if status == 'down']
    
    if len(down_services) > 0:
        health_status['status'] = 'degraded'
        health_status['issues'] = down_services
    
    status_code = 200 if health_status['status'] in ['healthy', 'degraded'] else 503
    return jsonify(health_status), status_code

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
        # После строки: calculation_input = CalculationInput(...)
        # Замените весь блок на:

        calculation_input = CalculationInput(
            birth_date=birth_date,
            gender=data['gender'],
            contract_term=int(data['contractTerm']),
            calculation_type=data['calculationType'],
            input_amount=int(data['inputAmount']),
            email=data.get('email'),
            yearly_income=data.get('yearlyIncome'),  # ✅ ДОБАВЛЕНО
            calculation_date=date.today()
        )

        # Выполняем расчет
        calculator = NSJCalculator()
        result = calculator.calculate(calculation_input)

        logger.info(f"✅ Расчет выполнен: {result.calculation_uuid}")
        
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
            yearly_income=data.get('yearlyIncome'),
            calculation_date=date.today()
        )
        
        # Выполняем расчет
        calculator = NSJCalculator()
        result = calculator.calculate(calculation_input)

        # ✅ ДОБАВЬТЕ сохранение в БД (как в основной функции)
        try:
            calculator.save_calculation_to_db(calculation_input, result)
            logger.info(f"💾 Расчет {result.calculation_uuid} сохранен в БД")
        except Exception as save_error:
            logger.warning(f"⚠️ Не удалось сохранить расчет: {save_error}")

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
def send_assessment_email_endpoint():
    """Отправка email уведомлений для assessment"""
    logger.info("🌐 ➜ %s %s", request.method, request.path)
    
    if request.method == "OPTIONS":
        return '', 200
    
    try:
        data = request.get_json()
        subject = data.get('subject', 'Assessment Notification')
        body = data.get('body', '')
        
        # Используем специальную функцию для Assessment
        success = send_assessment_email(subject, body)
        
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
    """Отправка email уведомлений для Care Future НА ФИКСИРОВАННЫЕ АДРЕСА МЕНЕДЖЕРОВ"""
    logger.info("🌐 ➜ %s %s", request.method, request.path)
    
    if request.method == "OPTIONS":
        return '', 200
    
    try:
        data = request.get_json()
        if not data:
            logger.error("❌ [CareFuture] No JSON data received")
            return jsonify({"success": False, "message": "No data provided"}), 400
            
        subject = data.get('subject', 'Care Future Notification')
        body = data.get('body', '')
        
        logger.info(f"📧 [CareFuture] Processing email request: {subject[:50]}...")
        
        # ИСПОЛЬЗУЕМ СПЕЦИАЛЬНУЮ ФУНКЦИЮ ДЛЯ CARE FUTURE
        success = send_carefuture_email_to_managers(subject, body)
        
        if success:
            logger.info("✅ [CareFuture] Email sent successfully to managers")
            return jsonify({"success": True, "message": "Email sent successfully"}), 200
        else:
            logger.error("❌ [CareFuture] Failed to send email")
            return jsonify({"success": False, "message": "Failed to send email"}), 500
            
    except Exception as e:
        logger.error(f"❌ [CareFuture] Error in Care Future email endpoint: {e}")
        return jsonify({"success": False, "error": "Internal server error"}), 500


# Обновленная функция contact_manager для server.py:

def send_carefuture_email_with_user(subject, body, user_email):
    """
    Отправляет email для CalcFuture на 3 адреса:
    - zerotlt@mail.ru
    - I.dav@mail.ru  
    - email пользователя
    """
    try:
        if not SMTP_PASSWORD:
            logger.warning("📧 SMTP password not configured, skipping email send")
            return False
        
        # ✅ СПЕЦИАЛЬНЫЕ получатели для CareFuture
        carefuture_recipients = [
            "zerotlt@mail.ru",
            "I.dav@mail.ru"
        ]
        
        # ✅ Добавляем email пользователя если он валидный
        if user_email and user_email.strip():
            user_email_clean = user_email.strip().lower()
            # Проверяем что это корпоративный email
            if user_email_clean.endswith('@vtb.ru') or user_email_clean.endswith('@rgsl.ru'):
                carefuture_recipients.append(user_email_clean)
                logger.info(f"📧 [CareFuture] Added user email: {user_email_clean}")
            else:
                logger.warning(f"📧 [CareFuture] Invalid user email format: {user_email}")
        
        logger.info(f"📧 [CareFuture] Sending email to {len(carefuture_recipients)} recipients: {subject}")
        logger.info(f"📧 [CareFuture] Recipients: {', '.join(carefuture_recipients)}")
        
        # Отправляем через SMTP
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            
            success_count = 0
            for recipient in carefuture_recipients:
                try:
                    # Создаем сообщение для каждого получателя
                    msg = MIMEMultipart()
                    msg['From'] = SMTP_FROM
                    msg['To'] = recipient
                    msg['Subject'] = subject
                    
                    # Добавляем тело письма
                    msg.attach(MIMEText(body, 'plain', 'utf-8'))
                    
                    # Отправляем
                    text = msg.as_string()
                    server.sendmail(SMTP_FROM, recipient, text)
                    logger.info(f"✅ [CareFuture] Email sent successfully to {recipient}")
                    success_count += 1
                    
                except Exception as e:
                    logger.error(f"❌ [CareFuture] Failed to send email to {recipient}: {e}")
        
        success = success_count > 0
        logger.info(f"📧 [CareFuture] Email sending summary: {success_count}/{len(carefuture_recipients)} successful")
        return success
        
    except Exception as e:
        logger.error(f"❌ [CareFuture] Failed to send email: {e}")
        return False
    
@app.route('/api/contact-manager', methods=['POST', 'OPTIONS'])
def contact_manager():
    """
    Обработка заявок на связь с менеджером из разных страниц
    ✅ CareFuture: отправляет на zerotlt@mail.ru, I.dav@mail.ru + email пользователя
    ✅ Assessment: отправляет на стандартные адреса (включая Polina.Iureva@rgsl.ru)
    """
    logger.info("🌐 ➜ %s %s", request.method, request.path)
    
    if request.method == "OPTIONS":
        return '', 200
    
    try:
        data = request.get_json()
        
        # Получаем данные расчета из БД, если есть calculationId
        # Получаем данные расчета из БД, если есть calculationId
        calculation_data = None
        if data.get('calculationId'):
            try:
                calc_id = data['calculationId']
                logger.info(f"🔍 Ищем расчет с ID: {calc_id}")
                
                # ✅ ИСПОЛЬЗУЕМ МЕТОД КЛАССА (как было раньше)
                calculation = NSJCalculations.find_by_uuid(calc_id)
                
                if calculation:
                    calculation_data = calculation.to_dict()
                    logger.info(f"✅ Найден расчет: {calc_id}")
                    logger.info(f"   Данные: возраст {calculation_data.get('age_at_start')}, срок {calculation_data.get('contract_term')}")
                else:
                    logger.warning(f"⚠️ Расчет не найден в БД: {calc_id}")
                    # Проверяем, есть ли вообще расчеты в БД
                    total_count = db.session.query(NSJCalculations).count()
                    logger.info(f"   Всего расчетов в БД: {total_count}")
            except Exception as e:
                logger.error(f"❌ Ошибка получения расчета из БД: {e}")
                import traceback
                logger.error(f"   Traceback: {traceback.format_exc()}")
        
        # Формируем email
        page = data.get('page', 'unknown')
        surname = data.get('surname', 'Не указана')
        name = data.get('name', 'Не указано')
        city = data.get('city', 'Не указан')
        user_email = data.get('email', 'Не указан')
        
        # ✅ РАЗНАЯ ЛОГИКА ДЛЯ РАЗНЫХ СТРАНИЦ
        if page == 'care-future':
            subject = f"Новая заявка НСЖ «Забота о будущем» от {surname} {name}"
            logger.info(f"📧 [CareFuture] Processing manager request from: {surname} {name}")
        else:
            # Для всех остальных страниц (включая Assessment)
            subject = f"Новая заявка с калькулятора от {surname} {name}"
            logger.info(f"📧 [Other] Processing manager request from: {surname} {name}")
        
        # Формируем тело письма
        body = f"""
Новая заявка на консультацию

ДАННЫЕ КЛИЕНТА:
- Фамилия: {surname}
- Имя: {name}
- Город: {city}
- Email: {user_email}
"""
        if calculation_data:
            gender_ru = 'Мужской' if calculation_data['gender'] == 'male' else 'Женский'
            birth_date_str = calculation_data.get('birth_date', '').split('T')[0] if calculation_data.get('birth_date') else 'Не указана'
    
            # Карта уровней дохода
            income_map = {
                'up_to_2_4': 'До 2,4 млн ₽',
                'over_2_4': 'Свыше 2,4 млн ₽', 
                'over_5': 'Свыше 5 млн ₽',
                'over_20': 'Свыше 20 млн ₽',
                'over_50': 'Свыше 50 млн ₽'
            }
    
            yearly_income_text = income_map.get(calculation_data.get('yearly_income', ''), 'Не указан')
    
            body += f"""

ПАРАМЕТРЫ СТРАХОВАНИЯ:
- Дата рождения: {birth_date_str}
- Пол: {gender_ru}
- Возраст на момент заключения: {calculation_data.get('age_at_start', 'Не указан')} лет
- Срок программы: {calculation_data.get('contract_term', 'Не указан')} лет

ФИНАНСОВЫЕ ПАРАМЕТРЫ:
- Ежегодный взнос: {calculation_data.get('premium_amount', 0):,} ₽
- Страховая сумма: {calculation_data.get('insurance_sum', 0):,} ₽
- Накопленный капитал: {calculation_data.get('accumulated_capital', 0):,} ₽
- Доход по программе: {calculation_data.get('program_income', 0):,} ₽
- Налоговый вычет (за весь срок): {calculation_data.get('tax_deduction', 0):,} ₽
- Уровень дохода: {yearly_income_text}

ТИП РАСЧЕТА:
- {('По размеру взноса' if calculation_data.get('calculation_type') == 'from_premium' else 'По страховой сумме')}
- Введенная сумма: {calculation_data.get('input_amount', 0):,} ₽
"""
        else:
            body += f"""

ПАРАМЕТРЫ СТРАХОВАНИЯ:
- Расчет не найден в базе данных (ID: {data.get('calculationId', 'Нет')})
"""
        
        body += f"""

ДОПОЛНИТЕЛЬНАЯ ИНФОРМАЦИЯ:
- Страница: {page}
- ID расчета: {data.get('calculationId', 'Нет')}
- Дата заявки: {datetime.now().strftime('%d.%m.%Y %H:%M')}

---
Автоматическое уведомление из MiniApp
        """
        
        # ✅ ВЫБИРАЕМ ФУНКЦИЮ ОТПРАВКИ В ЗАВИСИМОСТИ ОТ СТРАНИЦЫ
        if page == 'care-future':
            # Для CareFuture отправляем на специальные 3 адреса
            success = send_carefuture_email_with_user(subject, body, user_email)
            logger_prefix = "[CareFuture]"
        elif page == 'assessment':
            # Для Assessment отправляем только на 2 адреса (без I.dav@mail.ru)
            success = send_assessment_email(subject, body)
            logger_prefix = "[Assessment]"
        else:
            # Для всех остальных страниц - стандартная отправка
            success = send_email(subject, body)
            logger_prefix = "[Other]"
        
        if success:
            logger.info(f"✅ {logger_prefix} Заявка от {surname} {name} отправлена")
            return jsonify({"success": True, "message": "Заявка отправлена успешно"}), 200
        else:
            logger.error(f"❌ {logger_prefix} Ошибка отправки заявки от {surname} {name}")
            return jsonify({"success": False, "message": "Ошибка отправки заявки"}), 500
            
    except Exception as e:
        logger.error(f"❌ Ошибка обработки заявки менеджера: {e}")
        return jsonify({"error": "Внутренняя ошибка сервера"}), 500

# ===== ПРОВЕРЬТЕ СУЩЕСТВУЮЩУЮ ФУНКЦИЮ get_email_recipients() =====
# Убедитесь что Polina.Iureva@rgsl.ru НЕ добавляется для CareFuture

def get_email_recipients():
    """
    Возвращает список всех получателей email для стандартной отправки
    (используется для Assessment и других страниц, НЕ для CareFuture)
    """
    recipients = [SMTP_TO]  # zerotlt@mail.ru
    if SMTP_TO_ADDITIONAL:
        recipients.append(SMTP_TO_ADDITIONAL)  # I.dav@mail.ru
    
    # ✅ Добавляем Polina.Iureva@rgsl.ru для Assessment (но НЕ для CareFuture)
    recipients.append("Polina.Iureva@rgsl.ru")
    
    return recipients

@app.errorhandler(404)
def handle_404(error):
    """Обработка 404 для API калькуляторов"""
    if request.path.startswith('/api/'):
        return jsonify({
            'success': False,
            'error': 'API endpoint не найден',
            'path': request.path,
            'available_calculators': {
                'care_future': CARE_FUTURE_AVAILABLE,
                'justincase': JUSTINCASE_AVAILABLE
            },
            'suggestion': 'Проверьте правильность URL и доступность калькулятора'
        }), 404
    return str(error), 404

@app.errorhandler(500)
def handle_500(error):
    """Обработка 500 для API калькуляторов"""
    if request.path.startswith('/api/'):
        logger.error(f"❌ Internal server error on {request.path}: {error}")
        return jsonify({
            'success': False,
            'error': 'Внутренняя ошибка сервера',
            'path': request.path,
            'timestamp': datetime.now().isoformat(),
            'suggestion': 'Обратитесь к администратору или попробуйте позже'
        }), 500
    return str(error), 500

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
        recipients = get_email_recipients()
        logger.info(f"📧 Email configured: {SMTP_FROM} -> {', '.join(recipients)}")
        if SMTP_TO_ADDITIONAL:
            logger.info(f"📧 Additional recipient configured: {SMTP_TO_ADDITIONAL}")
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
    
    # Выводим сводку запущенных сервисов
    print_startup_summary()
    
    flask_port = os.environ.get("FLASK_PORT", "4000")
    # Очищаем от возможных комментариев
    flask_port = flask_port.split('#')[0].strip()
    port = int(flask_port)
    logger.info(f"📍 Server will run on port {port}")
    logger.info(f"📍 Open http://localhost:{port}/ in your browser")
    
    socketio.run(app, host='0.0.0.0', port=port, debug=False)





















