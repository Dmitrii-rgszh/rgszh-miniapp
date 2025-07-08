# care_future_routes.py - ИСПРАВЛЕННАЯ ВЕРСИЯ с правильной обработкой JSON

import os
import logging
from datetime import datetime, date
from typing import Dict, Any, List, Optional
from flask import Blueprint, request, jsonify, current_app
from sqlalchemy.exc import SQLAlchemyError

# Импортируем наши модели и классы
from care_future_models import (
    NSJCalculator, NSJDataManager, NSJCalculations,
    CalculationInput, CalculationResult,
    NSJRiskRates, NSJRedemptionRates, NSJCalculatorSettings
)
from db_saver import db

# Настройка логирования
logger = logging.getLogger("care_future_routes")

# Создаем Blueprint для API калькулятора НСЖ
care_future_bp = Blueprint('care_future', __name__, url_prefix='/api/care-future')

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
    Основной endpoint для расчета НСЖ
    
    Ожидает JSON:
    {
        "email": "client@example.com",
        "birthDate": "1990-01-15",
        "gender": "male",
        "contractTerm": 5,
        "calculationType": "from_premium",
        "inputAmount": 960000
    }
    """
    logger.info("🌐 ➜ %s %s", request.method, request.path)
    
    # Обработка CORS preflight
    if request.method == "OPTIONS":
        return '', 200
        
    try:
        # Безопасно получаем JSON
        data, error = safe_get_json()
        if error:
            return jsonify({
                'success': False,
                'error': error
            }), 400
        
        # Валидация обязательных полей
        required_fields = ['birthDate', 'gender', 'contractTerm', 'calculationType', 'inputAmount']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify({
                'success': False,
                'error': f'Отсутствуют обязательные поля: {", ".join(missing_fields)}'
            }), 400
        
        # Преобразуем данные
        try:
            birth_date = datetime.strptime(data['birthDate'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({
                'success': False,
                'error': 'Неверный формат даты рождения. Используйте YYYY-MM-DD'
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
            'error': 'Внутренняя ошибка сервера'
        }), 500

@care_future_bp.route('/config', methods=['GET'])
def get_config():
    """Получение конфигурации калькулятора"""
    try:
        config_data = NSJDataManager.get_calculator_info()
        
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

@care_future_bp.route('/validate-age', methods=['POST', 'OPTIONS'])
def validate_age():
    """Валидация возраста для расчета"""
    logger.info("🌐 ➜ %s %s", request.method, request.path)
    
    # Обработка CORS preflight
    if request.method == "OPTIONS":
        return '', 200
        
    try:
        # Безопасно получаем JSON
        data, error = safe_get_json()
        if error:
            return jsonify({
                'success': False,
                'error': error
            }), 400
        
        if 'birthDate' not in data:
            return jsonify({
                'success': False,
                'error': 'Не указана дата рождения'
            }), 400
        
        try:
            birth_date = datetime.strptime(data['birthDate'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({
                'success': False,
                'error': 'Неверный формат даты'
            }), 400
        
        # Рассчитываем возраст
        today = date.today()
        age = today.year - birth_date.year
        if today.month < birth_date.month or (today.month == birth_date.month and today.day < birth_date.day):
            age -= 1
        
        # Проверяем ограничения
        age_limits = NSJDataManager.get_age_ranges()
        is_valid = age_limits['min_age'] <= age <= age_limits['max_age']
        
        response_data = {
            'success': True,
            'age': age,
            'isValid': is_valid,
            'limits': age_limits
        }
        
        if not is_valid:
            response_data['message'] = f"Возраст должен быть от {age_limits['min_age']} до {age_limits['max_age']} лет"
        
        logger.info(f"✅ Валидация возраста: {age} лет, валиден: {is_valid}")
        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"❌ Ошибка валидации возраста: {e}")
        return jsonify({
            'success': False,
            'error': 'Ошибка валидации возраста'
        }), 500

@care_future_bp.route('/validate-amount', methods=['POST', 'OPTIONS'])
def validate_amount():
    """Валидация суммы для расчета"""
    logger.info("🌐 ➜ %s %s", request.method, request.path)
    
    # Обработка CORS preflight
    if request.method == "OPTIONS":
        return '', 200
        
    try:
        # Безопасно получаем JSON
        data, error = safe_get_json()
        if error:
            return jsonify({
                'success': False,
                'error': error
            }), 400
        
        if 'amount' not in data or 'type' not in data:
            return jsonify({
                'success': False,
                'error': 'Не указана сумма или тип валидации'
            }), 400
        
        amount = int(data['amount'])
        validation_type = data['type']  # 'premium' или 'insurance_sum'
        
        # Получаем лимиты
        amount_limits = NSJDataManager.get_amount_ranges()
        
        if validation_type == 'premium':
            min_amount = amount_limits['min_premium']
            max_amount = amount_limits['max_premium']
            amount_name = 'страхового взноса'
        else:
            min_amount = amount_limits['min_insurance_sum']
            max_amount = amount_limits['max_insurance_sum']
            amount_name = 'страховой суммы'
        
        is_valid = min_amount <= amount <= max_amount
        
        response_data = {
            'success': True,
            'amount': amount,
            'isValid': is_valid,
            'limits': {
                'min': min_amount,
                'max': max_amount,
                'type': validation_type
            }
        }
        
        if not is_valid:
            response_data['message'] = f"Сумма {amount_name} должна быть от {min_amount:,} до {max_amount:,} рублей"
        
        logger.info(f"✅ Валидация суммы: {amount:,} руб., тип: {validation_type}, валиден: {is_valid}")
        return jsonify(response_data)
        
    except ValueError:
        return jsonify({
            'success': False,
            'error': 'Неверный формат суммы'
        }), 400
    except Exception as e:
        logger.error(f"❌ Ошибка валидации суммы: {e}")
        return jsonify({
            'success': False,
            'error': 'Ошибка валидации суммы'
        }), 500

# =============================================================================
# ДОПОЛНИТЕЛЬНЫЕ ENDPOINTS
# =============================================================================

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
            'calculation': calculation.to_dict()
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

@care_future_bp.route('/redemption-preview', methods=['POST', 'OPTIONS'])
def get_redemption_preview():
    """Предварительный расчет выкупных сумм"""
    logger.info("🌐 ➜ %s %s", request.method, request.path)
    
    # Обработка CORS preflight
    if request.method == "OPTIONS":
        return '', 200
        
    try:
        # Безопасно получаем JSON
        data, error = safe_get_json()
        if error:
            return jsonify({
                'success': False,
                'error': error
            }), 400
        
        contract_term = int(data['contractTerm'])
        premium_amount = int(data['premiumAmount'])
        
        # Проверяем, что есть коэффициенты выкупа для этого срока
        redemption_rates = NSJRedemptionRates.query.filter_by(
            contract_term=contract_term
        ).all()
       
        if not redemption_rates:
            return jsonify({
                'success': False,
                'error': f'Коэффициенты выкупа не найдены для срока {contract_term} лет'
            }), 404
        
        # Рассчитываем выкупные суммы
        redemption_values = []
        for year in range(1, contract_term + 1):
            coefficient = NSJRedemptionRates.get_coefficient(year, contract_term)
            paid_premiums = premium_amount * year
            redemption_amount = int(paid_premiums * coefficient)
            
            redemption_values.append({
                'year': year,
                'paidPremiums': paid_premiums,
                'coefficient': coefficient,
                'redemptionAmount': redemption_amount
            })
        
        response_data = {
            'success': True,
            'contractTerm': contract_term,
            'premiumAmount': premium_amount,
            'redemptionValues': redemption_values
        }
        
        return jsonify(response_data)
        
    except ValueError:
        return jsonify({
            'success': False,
            'error': 'Неверный формат данных'
        }), 400
    except Exception as e:
        logger.error(f"Ошибка расчета выкупных сумм: {e}")
        return jsonify({
            'success': False,
            'error': 'Ошибка расчета выкупных сумм'
        }), 500

# =============================================================================
# АДМИНИСТРАТИВНЫЕ ENDPOINTS
# =============================================================================

@care_future_bp.route('/admin/status', methods=['GET'])
def get_system_status():
    """Статус системы калькулятора"""
    try:
        validation = NSJDataManager.validate_database()
        
        response_data = {
            'success': True,
            'database': validation,
            'endpoints': {
                'calculate': '/api/care-future/calculate',
                'config': '/api/care-future/config',
                'validateAge': '/api/care-future/validate-age',
                'validateAmount': '/api/care-future/validate-amount',
                'redemptionPreview': '/api/care-future/redemption-preview'
            }
        }
        
        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"Ошибка получения статуса: {e}")
        return jsonify({
            'success': False,
            'error': 'Ошибка получения статуса системы'
        }), 500

@care_future_bp.route('/admin/test-calculation', methods=['POST', 'OPTIONS'])
def test_calculation():
    """Тестовый расчет для проверки системы"""
    logger.info("🌐 ➜ %s %s", request.method, request.path)
    
    # Обработка CORS preflight
    if request.method == "OPTIONS":
        return '', 200
        
    try:
        # Тестовые данные
        test_data = {
            'birthDate': '1990-01-01',
            'gender': 'male',
            'contractTerm': 5,
            'calculationType': 'from_premium',
            'inputAmount': 960000,
            'email': 'test@example.com'
        }
        
        # Переопределяем данные из запроса, если они есть
        if request.content_length and request.content_length > 0:
            data, error = safe_get_json()
            if not error and data:
                test_data.update(data)
        
        # Выполняем тестовый расчет
        logger.info(f"🧪 Выполняем тестовый расчет с данными: {test_data}")
        
        # Создаем тестовый запрос
        with current_app.test_request_context(
            '/api/care-future/calculate',
            json=test_data,
            method='POST',
            content_type='application/json'
        ):
            response = calculate_insurance()
            return response
        
    except Exception as e:
        logger.error(f"❌ Ошибка тестового расчета: {e}")
        return jsonify({
            'success': False,
            'error': f'Ошибка тестового расчета: {str(e)}'
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
    """Инициализация routes для калькулятора НСЖ"""
    try:
        # Регистрируем Blueprint
        app.register_blueprint(care_future_bp)
        
        logger.info("✅ Care Future routes зарегистрированы успешно")
        
        # Проверяем готовность системы
        with app.app_context():
            validation = NSJDataManager.validate_database()
            if validation['status'] == 'error':
                logger.error(f"❌ Ошибки в БД калькулятора: {validation['errors']}")
            else:
                logger.info(f"✅ Калькулятор НСЖ готов к работе: {validation['stats']}")
        
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
    
    print("🧪 Тестирование Care Future API...")
    
    with app.test_client() as client:
        # Тест конфигурации
        response = client.get('/api/care-future/config')
        print(f"Config test: {response.status_code}")
        
        # Тест статуса
        response = client.get('/api/care-future/admin/status')
        print(f"Status test: {response.status_code}")
        
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
            print("🎉 Все API тесты пройдены!")
        else:
            print(f"❌ Ошибка API: {response.get_json()}")