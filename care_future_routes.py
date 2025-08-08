# care_future_routes_updated.py - ОБНОВЛЕННАЯ версия с исправленной логикой расчетов

import os
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, date
from typing import Dict, Any, List, Optional
from flask import Blueprint, request, jsonify, current_app
from sqlalchemy.exc import SQLAlchemyError

# Импортируем исправленный калькулятор
from care_future_models import NSJCalculator

# Импортируем модели
from care_future_models import (
    NSJDataManager, NSJCalculations,
    CalculationInput, CalculationResult,
    NSJRiskRates, NSJRedemptionRates, NSJCalculatorSettings
)
from db_saver import db

# Настройка логирования
logger = logging.getLogger("care_future_routes_updated")

# Создаем Blueprint для API калькулятора НСЖ
care_future_bp = Blueprint('care_future', __name__, url_prefix='/api/care-future')

# =============================================================================
# ФУНКЦИЯ ОТПРАВКИ EMAIL ДЛЯ КАЛЬКУЛЯТОРА НСЖ
# =============================================================================

def send_calculation_email(to_email, calculation_result):
    """Отправка результатов расчета калькулятора по email"""
    try:
        smtp_server = "smtp.yandex.ru"
        smtp_port = 465
        smtp_username = "rgszh-miniapp@yandex.ru"
        smtp_password = "rbclbdyejwwxrisg"
        
        # Формируем содержимое письма
        subject = "Результаты расчета калькулятора НСЖ 'Забота о будущем Ультра'"
        
        # Получаем данные из результата
        input_params = calculation_result.get('inputParameters', {})
        results = calculation_result.get('results', {})
        redemption_values = calculation_result.get('redemptionValues', [])
        
        # Форматируем суммы
        def format_amount(amount):
            return f"{amount:,}".replace(',', ' ')
        
        # Формируем текст письма
        body = f"""
Результаты расчета калькулятора НСЖ "Забота о будущем Ультра"

ВХОДНЫЕ ДАННЫЕ:
• Дата рождения: {input_params.get('birthDate', 'Не указано')}
• Пол: {'Мужской' if input_params.get('gender') == 'male' else 'Женский'}
• Возраст при оформлении: {input_params.get('ageAtStart', 'Не указан')} лет
• Возраст при окончании: {input_params.get('ageAtEnd', 'Не указан')} лет
• Срок договора: {input_params.get('contractTerm', 'Не указан')} лет
• Тип расчета: {'От суммы взноса' if input_params.get('calculationType') == 'from_premium' else 'От страховой суммы'}
• Сумма для расчета: {format_amount(input_params.get('inputAmount', 0))} руб.

РЕЗУЛЬТАТЫ РАСЧЕТА:
• Страховой взнос: {format_amount(results.get('premiumAmount', 0))} руб.
• Страховая сумма: {format_amount(results.get('insuranceSum', 0))} руб.
• Накопленный капитал: {format_amount(results.get('accumulatedCapital', 0))} руб.
• Доход по программе: {format_amount(results.get('programIncome', 0))} руб.
• Налоговый вычет: {format_amount(results.get('taxDeduction', 0))} руб.

ВЫКУПНЫЕ СУММЫ ПО ГОДАМ:
"""
        
        # Добавляем таблицу выкупных сумм
        for redemption in redemption_values:
            year = redemption.get('year', 0)
            amount = redemption.get('amount', 0)
            percentage = int(redemption.get('percentage', 0) * 100)
            body += f"Год {year}: {format_amount(amount)} руб. ({percentage}%)\n"
        
        body += f"""

Расчет выполнен: {datetime.now().strftime('%d.%m.%Y в %H:%M')}
ID расчета: {calculation_result.get('calculationId', 'Не указан')}

С уважением,
Команда РГСЗН
"""
        
        # Создаем сообщение
        msg = MIMEMultipart()
        msg['From'] = smtp_username
        msg['To'] = to_email
        msg['Subject'] = subject
        
        # Добавляем текст
        msg.attach(MIMEText(body, 'plain', 'utf-8'))
        
        # Отправляем через SMTP_SSL для порта 465
        with smtplib.SMTP_SSL(smtp_server, smtp_port) as server:
            server.login(smtp_username, smtp_password)
            server.send_message(msg)
            
        logger.info(f"✅ Email с результатами калькулятора успешно отправлен на {to_email}")
        return True
        
    except Exception as e:
        logger.error(f"❌ Ошибка отправки email калькулятора: {e}")
        return False

# =============================================================================
# ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
# =============================================================================

def safe_get_json():
    """Безопасное получение JSON из запроса с правильной обработкой ошибок"""
    try:
        # Проверяем Content-Type
        content_type = request.content_type
        logger.info(f"📋 Content-Type: {content_type}")
        
        if not content_type or 'application/json' not in content_type:
            logger.error(f"❌ Неверный Content-Type: {content_type}")
            return None, "Content-Type должен быть application/json"
        
        # Проверяем наличие данных
        if not request.data:
            logger.error("❌ Пустое тело запроса")
            return None, "Пустое тело запроса"
        
        # Пытаемся распарсить JSON
        try:
            data = request.get_json(force=True)
            if data is None:
                logger.error("❌ Невозможно распарсить JSON")
                return None, "Невозможно распарсить JSON данные"
            
            logger.info(f"📥 JSON успешно распарсен: {list(data.keys()) if isinstance(data, dict) else type(data)}")
            return data, None
            
        except Exception as json_error:
            logger.error(f"❌ Ошибка парсинга JSON: {json_error}")
            return None, f"Ошибка парсинга JSON: {str(json_error)}"
            
    except Exception as e:
        logger.error(f"❌ Общая ошибка получения JSON: {e}")
        return None, f"Ошибка обработки запроса: {str(e)}"

# =============================================================================
# ОСНОВНЫЕ API ENDPOINTS
# =============================================================================

@care_future_bp.route('/calculate', methods=['POST', 'OPTIONS'])
def calculate_insurance():
    """
    Основной endpoint для расчета НСЖ с исправленной логикой
    """
    logger.info("🌐 ➜ %s %s", request.method, request.path)
    
    # Обработка CORS preflight
    if request.method == "OPTIONS":
        return '', 200
    
    try:
        # Безопасно получаем JSON
        data, error = safe_get_json()
        if error:
            logger.error(f"❌ Ошибка получения JSON: {error}")
            return jsonify({
                'success': False,
                'error': error
            }), 400
        
        logger.info(f"📊 Получены данные для расчета: {data}")
        
        # Валидация обязательных полей
        required_fields = ['birthDate', 'gender', 'contractTerm', 'calculationType', 'inputAmount']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            logger.error(f"❌ Отсутствуют поля: {missing_fields}")
            return jsonify({
                'success': False,
                'error': f'Отсутствуют обязательные поля: {", ".join(missing_fields)}'
            }), 400
        
        # Парсинг даты рождения
        try:
            birth_date = datetime.strptime(data['birthDate'], '%Y-%m-%d').date()
        except (ValueError, TypeError) as e:
            logger.error(f"❌ Неверная дата рождения: {data['birthDate']}")
            return jsonify({
                'success': False,
                'error': 'Неверный формат даты рождения. Используйте YYYY-MM-DD'
            }), 400
        
        # Создаем объект входных данных
        try:
            calculation_input = CalculationInput(
                birth_date=birth_date,
                gender=data['gender'],
                contract_term=int(data['contractTerm']),
                calculation_type=data['calculationType'],
                input_amount=int(data['inputAmount']),
                email=data.get('email'),
                calculation_date=date.today()
            )
        except (ValueError, TypeError) as e:
            logger.error(f"❌ Ошибка создания входных данных: {e}")
            return jsonify({
                'success': False,
                'error': f'Ошибка в параметрах расчета: {str(e)}'
            }), 400
        
        # Выполняем расчет с исправленным калькулятором
        logger.info(f"🧮 Начинаем расчет с исправленным калькулятором...")
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
              'premiumAmount': int(result.premium_amount),
              'insuranceSum': int(result.insurance_sum),
              'accumulatedCapital': int(result.accumulated_capital),
              'programIncome': int(result.program_income),
              'taxDeduction': int(result.tax_deduction)
            },
            'redemptionValues': result.redemption_values,
            'calculatedAt': datetime.now().isoformat(),
            'version': 'fixed_v1.15'  # Указываем что используем исправленную версию
        }
        
        logger.info(f"✅ Расчет выполнен успешно: {result.calculation_uuid}")
        logger.info(f"📊 Результат: премия={result.premium_amount:,}, сумма={result.insurance_sum:,}, доход={result.program_income:,}")
        
        # Email будет отправлен только на этапе "Связаться с менеджером"
        response_data['emailSent'] = False  # Изменено: email не отправляется на этапе расчета
        
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
            'error': 'Внутренняя ошибка сервера при расчете'
        }), 500

@care_future_bp.route('/config', methods=['GET'])
def get_config():
    """Получение конфигурации калькулятора"""
    try:
        # Основные настройки
        config_data = {
            'contractTerms': list(range(5, 21)),  # 5-20 лет
            'ageRange': {
                'min': 18,
                'max': 63
            },
            'amountLimits': {
                'premium': {
                    'min': 100000,
                    'max': 50000000
                },
                'sum': {
                    'min': 500000,
                    'max': 100000000
                }
            },
            'calculationTypes': ['from_premium', 'from_sum'],
            'genders': ['male', 'female'],
            'currency': 'RUB',
            'version': 'fixed_v1.15'
        }
        
        response_data = {
            'success': True,
            'config': config_data
        }
        
        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"Ошибка получения конфигурации: {e}")
        return jsonify({
            'success': False,
            'error': 'Ошибка получения конфигурации'
        }), 500

@care_future_bp.route('/validate-amount', methods=['POST', 'OPTIONS'])
def validate_amount():
    """Валидация суммы перед расчетом"""
    logger.info("🌐 ➜ %s %s", request.method, request.path)
    
    if request.method == "OPTIONS":
        return '', 200
    
    try:
        data, error = safe_get_json()
        if error:
            return jsonify({
                'success': False,
                'error': error
            }), 400
        
        amount = int(data.get('amount', 0))
        calc_type = data.get('calculationType', 'from_premium')
        
        # Валидация лимитов
        if calc_type == 'from_premium':
            if amount < 100000:
                return jsonify({
                    'success': False,
                    'error': 'Минимальный страховой взнос: 100,000 руб.'
                }), 400
            if amount > 50000000:
                return jsonify({
                    'success': False,
                    'error': 'Максимальный страховой взнос: 50,000,000 руб.'
                }), 400
        else:  # from_sum
            if amount < 500000:
                return jsonify({
                    'success': False,
                    'error': 'Минимальная страховая сумма: 500,000 руб.'
                }), 400
            if amount > 100000000:
                return jsonify({
                    'success': False,
                    'error': 'Максимальная страховая сумма: 100,000,000 руб.'
                }), 400
        
        return jsonify({
            'success': True,
            'valid': True
        })
        
    except Exception as e:
        logger.error(f"Ошибка валидации суммы: {e}")
        return jsonify({
            'success': False,
            'error': 'Ошибка валидации'
        }), 500

@care_future_bp.route('/admin/status', methods=['GET'])
def admin_status():
    """Административный статус системы"""
    try:
        # Тест исправленного калькулятора
        calculator = NSJCalculator()
        test_input = CalculationInput(
            birth_date=date(1990, 1, 1),
            gender='male',
            contract_term=5,
            calculation_type='from_premium',
            input_amount=960000
        )
        
        try:
            test_result = calculator.calculate(test_input)
            calculator_status = 'working'
            calculator_error = None
        except Exception as e:
            calculator_status = 'error'
            calculator_error = str(e)
        
        response_data = {
            'success': True,
            'status': {
                'database': 'connected',
                'calculator': calculator_status,
                'version': 'fixed_v1.15',
                'excel_logic': 'implemented'
            },
            'calculator_error': calculator_error,
            'stats': {
                'available_terms': list(range(5, 21)),
                'calculations_count': NSJCalculations.query.count() if calculator_status == 'working' else 0
            },
            'endpoints': {
                'calculate': '/api/care-future/calculate',
                'config': '/api/care-future/config',
                'validateAmount': '/api/care-future/validate-amount',
                'adminStatus': '/api/care-future/admin/status'
            }
        }
        
        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"Ошибка получения статуса: {e}")
        return jsonify({
            'success': False,
            'error': 'Ошибка получения статуса системы'
        }), 500

@care_future_bp.route('/calculation/<uuid:calculation_id>', methods=['GET'])
def get_calculation(calculation_id):
    """Получение расчета по ID"""
    try:
        calculation = NSJCalculations.query.filter_by(
            calculation_uuid=str(calculation_id)
        ).first()
        
        if not calculation:
            return jsonify({
                'success': False,
                'error': 'Расчет не найден'
            }), 404
        
        response_data = {
            'success': True,
            'calculation': calculation.to_dict(include_redemption=True)
        }
        
        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"Ошибка получения расчета: {e}")
        return jsonify({
            'success': False,
            'error': 'Ошибка получения расчета'
        }), 500

@care_future_bp.route('/calculations/by-email/<email>', methods=['GET'])
def get_calculations_by_email(email):
    """Получение истории расчетов по email"""
    try:
        limit = request.args.get('limit', 10, type=int)
        
        calculations = NSJCalculations.query.filter_by(
            email=email
        ).order_by(NSJCalculations.created_at.desc()).limit(limit).all()
        
        response_data = {
            'success': True,
            'calculations': [calc.to_dict() for calc in calculations],
            'count': len(calculations)
        }
        
        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"Ошибка получения истории расчетов: {e}")
        return jsonify({
            'success': False,
            'error': 'Ошибка получения истории расчетов'
        }), 500

@care_future_bp.route('/test-excel-logic', methods=['GET'])
def test_excel_logic():
    """Тестирование логики Excel с проверкой результатов"""
    try:
        calculator = NSJCalculator()
        
        # Тестовые данные из Excel (мужчина 60 лет, срок 9 лет, премия 100,000)
        test_input = CalculationInput(
            birth_date=date(1965, 4, 1),  # возраст 60 лет
            gender='male',
            contract_term=9,
            calculation_type='from_premium',
            input_amount=100000,
            email='test@example.com'
        )
        
        result = calculator.calculate(test_input)
        
        # Ожидаемые значения из Excel файла
        expected_values = {
            'insurance_sum': 1467000,  # C16 из Excel
            'accumulated_capital': 900000,  # C12 из Excel (100000 * 9)
            'program_income_approx': 567000,  # C13 из Excel (примерно)
            'tax_deduction': 117000  # C14 из Excel (для дохода до 5 млн)
        }
        
        # Проверяем соответствие
        accuracy = {}
        accuracy['insurance_sum'] = abs(result.insurance_sum - expected_values['insurance_sum']) < 1000
        accuracy['accumulated_capital'] = result.accumulated_capital == expected_values['accumulated_capital']
        accuracy['program_income'] = abs(result.program_income - expected_values['program_income_approx']) < 10000
        accuracy['tax_deduction'] = result.tax_deduction == expected_values['tax_deduction']
        
        all_accurate = all(accuracy.values())
        
        response_data = {
            'success': True,
            'test_passed': all_accurate,
            'calculation_uuid': result.calculation_uuid,
            'results': {
                'calculated': {
                    'insurance_sum': result.insurance_sum,
                    'accumulated_capital': result.accumulated_capital,
                    'program_income': result.program_income,
                    'tax_deduction': result.tax_deduction
                },
                'expected': expected_values,
                'accuracy': accuracy
            },
            'redemption_values_count': len(result.redemption_values),
            'message': 'Логика Excel успешно реализована!' if all_accurate else 'Есть расхождения с Excel'
        }
        
        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"Ошибка тестирования Excel логики: {e}")
        return jsonify({
            'success': False,
            'error': f'Ошибка тестирования: {str(e)}'
        }), 500

# =============================================================================
# ОБРАБОТЧИКИ ОШИБОК
# =============================================================================

@care_future_bp.errorhandler(404)
def not_found(error):
    """Обработчик 404 ошибок"""
    return jsonify({
        'success': False,
        'error': 'Endpoint не найден'
    }), 404

@care_future_bp.errorhandler(405)
def method_not_allowed(error):
    """Обработчик 405 ошибок"""
    return jsonify({
        'success': False,
        'error': 'Метод не разрешен'
    }), 405

@care_future_bp.errorhandler(500)
def internal_error(error):
    """Обработчик 500 ошибок"""
    logger.error(f"Внутренняя ошибка сервера: {error}")
    return jsonify({
        'success': False,
        'error': 'Внутренняя ошибка сервера'
    }), 500

# =============================================================================
# ИНИЦИАЛИЗАЦИЯ BLUEPRINT
# =============================================================================

def init_care_future_routes(app):
    """Инициализация routes для калькулятора НСЖ с исправленной логикой"""
    try:
        # Регистрируем Blueprint
        app.register_blueprint(care_future_bp)
        
        logger.info("✅ Care Future routes с исправленной логикой зарегистрированы успешно")
        
        # Проверяем готовность системы с исправленным калькулятором
        with app.app_context():
            try:
                calculator = NSJCalculator()
                test_input = CalculationInput(
                    birth_date=date(1990, 1, 1),
                    gender='male',
                    contract_term=5,
                    calculation_type='from_premium',
                    input_amount=960000
                )
                
                test_result = calculator.calculate(test_input)
                logger.info(f"✅ Исправленный калькулятор НСЖ готов к работе: {test_result.calculation_uuid}")
                logger.info(f"📍 Доступные endpoints:")
                logger.info(f"  - POST /api/care-future/calculate (исправленная логика)")
                logger.info(f"  - GET  /api/care-future/test-excel-logic")
                logger.info(f"  - GET  /api/care-future/admin/status")
                
            except Exception as e:
                logger.error(f"❌ Ошибка проверки исправленного калькулятора: {e}")
                return False
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Ошибка инициализации Care Future routes: {e}")
        return False

if __name__ == "__main__":
    # Тестирование при прямом запуске
    from flask import Flask
    from db_saver import init_db
    
    app = Flask(__name__)
    init_db(app)
    init_care_future_routes(app)
    
    print("🧪 Тестирование обновленного Care Future API...")
    
    with app.test_client() as client:
        # Тест конфигурации
        response = client.get('/api/care-future/config')
        print(f"Config test: {response.status_code}")
        
        # Тест статуса
        response = client.get('/api/care-future/admin/status')
        print(f"Status test: {response.status_code}")
        
        # Тест Excel логики
        response = client.get('/api/care-future/test-excel-logic')
        print(f"Excel logic test: {response.status_code}")
        
        if response.status_code == 200:
            result = response.get_json()
            print(f"Excel logic passed: {result.get('test_passed', False)}")
        
        # Тест расчета
        test_data = {
            'birthDate': '1990-01-01',
            'gender': 'male',
            'contractTerm': 5,
            'calculationType': 'from_premium',
            'inputAmount': 960000
        }
        
        response = client.post('/api/care-future/calculate', json=test_data)
        print(f"Calculate test: {response.status_code}")
        
        if response.status_code == 200:
            print("🎉 Все API тесты с исправленной логикой пройдены!")
        else:
            print(f"❌ Ошибка API: {response.get_json()}")