# care_future_routes.py - API endpoints для калькулятора НСЖ "Забота о будущем Ультра"

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
# ОСНОВНЫЕ API ENDPOINTS
# =============================================================================

@care_future_bp.route('/calculate', methods=['POST'])
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
    try:
        # Получаем данные из запроса
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error': 'Отсутствуют данные в запросе'
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
        
        logger.info(f"Расчет выполнен успешно: {result.calculation_uuid}")
        return jsonify(response_data)
        
    except ValueError as e:
        logger.warning(f"Ошибка валидации: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400
        
    except Exception as e:
        logger.error(f"Ошибка расчета: {e}")
        return jsonify({
            'success': False,
            'error': 'Внутренняя ошибка сервера при выполнении расчета'
        }), 500

@care_future_bp.route('/calculation/<calculation_id>', methods=['GET'])
def get_calculation(calculation_id: str):
    """Получить результат расчета по ID"""
    try:
        calculation = NSJCalculations.find_by_uuid(calculation_id)
        
        if not calculation:
            return jsonify({
                'success': False,
                'error': 'Расчет не найден'
            }), 404
        
        # Возвращаем данные расчета
        response_data = {
            'success': True,
            'calculation': calculation.to_dict(include_redemption=True)
        }
        
        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"Ошибка получения расчета {calculation_id}: {e}")
        return jsonify({
            'success': False,
            'error': 'Ошибка получения расчета'
        }), 500

@care_future_bp.route('/calculations/by-email/<email>', methods=['GET'])
def get_calculations_by_email(email: str):
    """Получить историю расчетов по email"""
    try:
        limit = request.args.get('limit', 10, type=int)
        calculations = NSJCalculations.find_by_email(email, limit=limit)
        
        response_data = {
            'success': True,
            'email': email,
            'count': len(calculations),
            'calculations': [calc.to_dict(include_redemption=False) for calc in calculations]
        }
        
        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"Ошибка получения расчетов для {email}: {e}")
        return jsonify({
            'success': False,
            'error': 'Ошибка получения истории расчетов'
        }), 500

# =============================================================================
# ВСПОМОГАТЕЛЬНЫЕ ENDPOINTS
# =============================================================================

@care_future_bp.route('/config', methods=['GET'])
def get_calculator_config():
    """Получить конфигурацию калькулятора"""
    try:
        config = NSJDataManager.get_calculator_info()
        
        response_data = {
            'success': True,
            'config': config
        }
        
        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"Ошибка получения конфигурации: {e}")
        return jsonify({
            'success': False,
            'error': 'Ошибка получения конфигурации'
        }), 500

@care_future_bp.route('/validate-age', methods=['POST'])
def validate_age():
    """Валидация возраста для расчета"""
    try:
        data = request.get_json()
        if not data or 'birthDate' not in data:
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
        
        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"Ошибка валидации возраста: {e}")
        return jsonify({
            'success': False,
            'error': 'Ошибка валидации возраста'
        }), 500

@care_future_bp.route('/validate-amount', methods=['POST'])
def validate_amount():
    """Валидация суммы для расчета"""
    try:
        data = request.get_json()
        if not data or 'amount' not in data or 'type' not in data:
            return jsonify({
                'success': False,
                'error': 'Не указана сумма или тип'
            }), 400
        
        amount = int(data['amount'])
        amount_type = data['type']  # 'premium' или 'sum'
        
        # Получаем лимиты
        limits = NSJDataManager.get_amount_limits()
        
        if amount_type == 'premium':
            min_amount = limits['min_premium']
            max_amount = limits['max_premium']
        elif amount_type == 'sum':
            min_amount = limits['min_insurance_sum']
            max_amount = limits['max_insurance_sum']
        else:
            return jsonify({
                'success': False,
                'error': 'Неверный тип суммы'
            }), 400
        
        is_valid = min_amount <= amount <= max_amount
        
        response_data = {
            'success': True,
            'amount': amount,
            'type': amount_type,
            'isValid': is_valid,
            'limits': {
                'min': min_amount,
                'max': max_amount
            }
        }
        
        if not is_valid:
            response_data['message'] = f"Сумма должна быть от {min_amount:,} до {max_amount:,} рублей"
        
        return jsonify(response_data)
        
    except ValueError:
        return jsonify({
            'success': False,
            'error': 'Неверный формат суммы'
        }), 400
    except Exception as e:
        logger.error(f"Ошибка валидации суммы: {e}")
        return jsonify({
            'success': False,
            'error': 'Ошибка валидации суммы'
        }), 500

@care_future_bp.route('/redemption-preview', methods=['POST'])
def get_redemption_preview():
    """Предварительный расчет выкупных сумм"""
    try:
        data = request.get_json()
        if not data or 'contractTerm' not in data or 'premiumAmount' not in data:
            return jsonify({
                'success': False,
                'error': 'Не указаны срок договора или размер взноса'
            }), 400
        
        contract_term = int(data['contractTerm'])
        premium_amount = int(data['premiumAmount'])
        
        # Получаем коэффициенты выкупа
        redemption_rates = NSJRedemptionRates.get_all_for_term(contract_term)
        
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

@care_future_bp.route('/admin/test-calculation', methods=['POST'])
def test_calculation():
    """Тестовый расчет для проверки системы"""
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
        if request.get_json():
            test_data.update(request.get_json())
        
        # Выполняем тестовый расчет через основной endpoint
        with current_app.test_request_context('/api/care-future/calculate', 
                                            json=test_data, 
                                            method='POST'):
            from flask import request as test_request
            response = calculate_insurance()
            
        return response
        
    except Exception as e:
        logger.error(f"Ошибка тестового расчета: {e}")
        return jsonify({
            'success': False,
            'error': 'Ошибка тестового расчета'
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
        
        logger.info("Care Future routes зарегистрированы успешно")
        
        # Проверяем готовность системы
        with app.app_context():
            validation = NSJDataManager.validate_database()
            if validation['status'] == 'error':
                logger.error(f"Ошибки в БД калькулятора: {validation['errors']}")
            else:
                logger.info(f"Калькулятор НСЖ готов к работе: {validation['stats']}")
        
        return True
        
    except Exception as e:
        logger.error(f"Ошибка инициализации Care Future routes: {e}")
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