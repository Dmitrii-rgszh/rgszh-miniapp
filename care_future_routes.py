# care_future_routes.py - ОБНОВЛЕННЫЕ роуты с логикой программы сотрудников

from flask import Blueprint, request, jsonify
from datetime import datetime, date
import logging
from typing import Dict, Any
import uuid

# Импорты новых моделей для программы сотрудников
try:
    from care_future_employees_models import (
        NSJRiskRatesByTerm, 
        NSJCashbackRates, 
        EmployeesCalculatorEngine,
        NSJCalculationResult
    )
    # Также импортируем обновленную модель выкупных сумм
    from care_future_models import NSJRedemptionRates
    EMPLOYEES_LOGIC_AVAILABLE = True
    logger = logging.getLogger(__name__)
    logger.info("✅ Логика программы сотрудников загружена")
except ImportError as e:
    EMPLOYEES_LOGIC_AVAILABLE = False
    logger = logging.getLogger(__name__)
    logger.warning(f"⚠️ Логика программы сотрудников недоступна: {e}")
    
    # Заглушки для случая если модули недоступны
    class MockModel:
        @classmethod
        def get_rates_for_term(cls, *args): return None
        @classmethod
        def get_cashback_for_term(cls, *args): return 0.63
        @classmethod
        def get_available_terms(cls, *args): return list(range(5, 21))
    
    NSJRiskRatesByTerm = NSJCashbackRates = MockModel
    EmployeesCalculatorEngine = object
    NSJCalculationResult = object

# Создаем Blueprint (сохраняем старое название)
care_future_bp = Blueprint('care_future', __name__, url_prefix='/api/care-future')

# =============================================================================
# ОСНОВНЫЕ ENDPOINTS КАЛЬКУЛЯТОРА (ОБНОВЛЕННЫЕ)
# =============================================================================

@care_future_bp.route('/calculate', methods=['POST', 'OPTIONS'])
def calculate():
    """Основной endpoint для расчета (обновлен с логикой программы сотрудников)"""
    logger.info("🧮 Care Future Calculator: Starting calculation (employees logic)")
    
    if request.method == "OPTIONS":
        return '', 200
    
    if not EMPLOYEES_LOGIC_AVAILABLE:
        return jsonify({
            'success': False,
            'error': 'Логика программы сотрудников недоступна'
        }), 503
    
    try:
        data = request.get_json()
        logger.info(f"📊 Входные данные: {data}")
        
        # Валидация входных данных
        required_fields = ['birthDate', 'gender', 'contractTerm', 'calculationType', 'inputAmount']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Отсутствует обязательное поле: {field}'
                }), 400
        
        # Парсинг даты рождения
        try:
            birth_date = datetime.strptime(data['birthDate'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({
                'success': False,
                'error': 'Неверный формат даты рождения. Используйте YYYY-MM-DD'
            }), 400
        
        # Создаем движок калькулятора сотрудников
        calculator = EmployeesCalculatorEngine()
        
        # Валидация входных данных
        validation_errors = calculator.validate_input(
            birth_date=birth_date,
            gender=data['gender'],
            contract_term=int(data['contractTerm']),
            calculation_type=data['calculationType'],
            input_amount=int(data['inputAmount'])
        )
        
        if validation_errors:
            return jsonify({
                'success': False,
                'errors': validation_errors
            }), 400
        
        # Определяем уровень дохода
        income_level = data.get('incomeLevel', 'low')  # 'low' или 'high'
        
        # Выполняем расчет с новой логикой
        result = calculator.calculate(
            birth_date=birth_date,
            gender=data['gender'],
            contract_term=int(data['contractTerm']),
            calculation_type=data['calculationType'],
            input_amount=int(data['inputAmount']),
            email=data.get('email'),
            income_level=income_level
        )
        
        # Формируем ответ в формате совместимом со старым API
        response_data = {
            'success': True,
            'calculationId': result.calculation_uuid,
            'programType': 'employees',
            'excelVersion': result.excel_version,
            
            'inputParameters': {
                'birthDate': result.birth_date.isoformat(),
                'gender': result.gender,
                'contractTerm': result.contract_term,
                'calculationType': result.calculation_type,
                'inputAmount': result.input_amount,
                'email': result.email,
                'incomeLevel': income_level,
                'ageAtStart': result.age_at_start,
                'ageAtEnd': result.age_at_end
            },
            
            'results': {
                'premiumAmount': result.premium_amount,
                'insuranceSum': result.insurance_sum,
                'accumulatedCapital': result.accumulated_capital,
                'formedCapital': result.formed_capital,
                'programIncome': result.program_income,
                'taxDeduction': result.tax_deduction,
                'cashbackCoefficient': result.cashback_coefficient,
                'insuranceSumSurvival': result.insurance_sum_survival,
                'insuranceSumDeath': result.insurance_sum_death
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
    """Получение конфигурации калькулятора (обновлено для программы сотрудников)"""
    try:
        if not EMPLOYEES_LOGIC_AVAILABLE:
            # Fallback конфигурация
            config_data = {
                'success': True,
                'programType': 'employees',
                'programName': 'Забота о будущем сотрудники',
                'available': False,
                'constraints': {
                    'minAge': 18,
                    'maxAge': 63,
                    'availableTerms': list(range(5, 21)),
                    'minPremium': 100000,
                    'maxPremium': 50000000,
                    'minInsuranceSum': 500000,
                    'maxInsuranceSum': 100000000
                },
                'error': 'Логика программы сотрудников недоступна'
            }
            return jsonify(config_data)
        
        # Получаем доступные сроки из БД
        available_terms = NSJRiskRatesByTerm.get_available_terms('employees')
        
        config_data = {
            'success': True,
            'programType': 'employees',
            'programName': 'Забота о будущем сотрудники',
            'excelVersion': 'v.1.15',
            'available': True,
            
            'constraints': {
                'minAge': 18,
                'maxAge': 63,
                'availableTerms': available_terms or list(range(5, 21)),
                'minPremium': 100000,
                'maxPremium': 50000000,
                'minInsuranceSum': 500000,
                'maxInsuranceSum': 100000000
            },
            
            'features': {
                'supportsTaxCalculation': True,
                'supportsRedemptionCalculation': True,
                'supportsIncomeLevel': True,
                'hasCashbackCoefficients': True
            },
            
            'calculationTypes': [
                {
                    'value': 'from_premium',
                    'label': 'От страхового взноса',
                    'description': 'Расчет исходя из ежегодного взноса'
                },
                {
                    'value': 'from_sum',
                    'label': 'От страховой суммы',
                    'description': 'Расчет исходя из желаемой страховой суммы'
                }
            ],
            
            'incomelevels': [
                {
                    'value': 'low',
                    'label': 'До 5 млн руб/год',
                    'taxRate': '13%',
                    'description': 'Доход до 5 миллионов рублей в год'
                },
                {
                    'value': 'high',
                    'label': 'Свыше 5 млн руб/год',
                    'taxRate': '15%',
                    'description': 'Доход свыше 5 миллионов рублей в год'
                }
            ]
        }
        
        return jsonify(config_data)
        
    except Exception as e:
        logger.error(f"❌ Ошибка получения конфигурации: {e}")
        return jsonify({
            'success': False,
            'error': 'Ошибка получения конфигурации'
        }), 500

@care_future_bp.route('/redemption', methods=['POST'])
def calculate_redemption():
    """Расчет выкупных сумм (обновлено для программы сотрудников)"""
    try:
        data = request.get_json()
        
        contract_term = int(data['contractTerm'])
        premium_amount = int(data['premiumAmount'])
        
        # Проверяем, что есть коэффициенты выкупа для этого срока
        redemption_rates = NSJRedemptionRates.query.filter_by(
            contract_term=contract_term,
            program_type='employees'  # ✅ ИЗМЕНЕНО: Используем программу сотрудников
        ).all()
       
        if not redemption_rates:
            return jsonify({
                'success': False,
                'error': f'Коэффициенты выкупа не найдены для срока {contract_term} лет'
            }), 404
        
        # Рассчитываем выкупные суммы
        redemption_values = []
        for year in range(1, contract_term + 1):
            coefficient_record = NSJRedemptionRates.query.filter_by(
                contract_year=year,
                contract_term=contract_term,
                program_type='employees'  # ✅ ИЗМЕНЕНО: Программа сотрудников
            ).first()
            
            coefficient = float(coefficient_record.redemption_coefficient) if coefficient_record else 0.0
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
            'programType': 'employees',
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
# АДМИНИСТРАТИВНЫЕ ENDPOINTS (ОБНОВЛЕННЫЕ)
# =============================================================================

@care_future_bp.route('/status', methods=['GET'])
def get_status():
    """Статус системы калькулятора (обновлено для программы сотрудников)"""
    try:
        if not EMPLOYEES_LOGIC_AVAILABLE:
            return jsonify({
                'success': False,
                'available': False,
                'programType': 'employees',
                'error': 'Логика программы сотрудников недоступна',
                'suggestion': 'Проверьте наличие файлов программы сотрудников'
            })
        
        # Проверяем данные в БД
        risk_rates_count = NSJRiskRatesByTerm.query.filter_by(
            program_type='employees',
            is_active=True
        ).count()
        
        cashback_rates_count = NSJCashbackRates.query.filter_by(
            program_type='employees',
            is_active=True
        ).count()
        
        redemption_rates_count = NSJRedemptionRates.query.filter_by(
            program_type='employees',
            is_active=True
        ).count()
        
        available_terms = NSJRiskRatesByTerm.get_available_terms('employees')
        
        status_data = {
            'success': True,
            'available': True,
            'programType': 'employees',
            'programName': 'Забота о будущем сотрудники',
            'excelVersion': 'v.1.15',
            
            'database': {
                'riskRatesCount': risk_rates_count,
                'cashbackRatesCount': cashback_rates_count,
                'redemptionRatesCount': redemption_rates_count,
                'availableTerms': available_terms,
                'dataIntegrity': {
                    'riskRatesOK': risk_rates_count >= 16,  # Ожидаем 16 сроков (5-20)
                    'cashbackRatesOK': cashback_rates_count >= 16,
                    'redemptionRatesOK': redemption_rates_count > 100  # Много записей по годам
                }
            },
            
            'endpoints': {
                'calculate': '/api/care-future/calculate',
                'config': '/api/care-future/config',
                'redemption': '/api/care-future/redemption',
                'status': '/api/care-future/status'
            },
            
            'features': {
                'calculationEngine': 'EmployeesCalculatorEngine',
                'excelVersion': 'v.1.15',
                'supportedCalculationTypes': ['from_premium', 'from_sum'],
                'supportedIncomelevels': ['low', 'high'],
                'lastUpdate': datetime.now().isoformat()
            }
        }
        
        return jsonify(status_data)
        
    except Exception as e:
        logger.error(f"❌ Ошибка получения статуса: {e}")
        return jsonify({
            'success': False,
            'available': False,
            'error': 'Ошибка получения статуса системы'
        }), 500

@care_future_bp.route('/validate-age', methods=['POST'])
def validate_age():
    """Валидация возраста (совместимость со старым API)"""
    try:
        data = request.get_json()
        birth_date = datetime.strptime(data['birthDate'], '%Y-%m-%d').date()
        
        today = date.today()
        age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
        
        is_valid = 18 <= age <= 63
        
        return jsonify({
            'success': True,
            'age': age,
            'isValid': is_valid,
            'constraints': {
                'minAge': 18,
                'maxAge': 63,
                'programType': 'employees'
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Ошибка валидации возраста'
        }), 400

@care_future_bp.route('/validate-amount', methods=['POST'])  
def validate_amount():
    """Валидация суммы (совместимость со старым API)"""
    try:
        data = request.get_json()
        amount = int(data['amount'])
        calculation_type = data['calculationType']
        
        if calculation_type == 'from_premium':
            is_valid = 100000 <= amount <= 50000000
            constraints = {'min': 100000, 'max': 50000000, 'type': 'premium'}
        else:  # from_sum
            is_valid = 500000 <= amount <= 100000000
            constraints = {'min': 500000, 'max': 100000000, 'type': 'insurance_sum'}
        
        return jsonify({
            'success': True,
            'amount': amount,
            'isValid': is_valid,
            'constraints': constraints,
            'programType': 'employees'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Ошибка валидации суммы'
        }), 400

# =============================================================================
# LEGACY ENDPOINTS (для обратной совместимости)
# =============================================================================

@care_future_bp.route('/legacy-status', methods=['GET'])
def legacy_status():
    """Legacy endpoint для проверки работы старых интеграций"""
    return jsonify({
        'success': True,
        'message': 'Калькулятор обновлен до программы сотрудников',
        'programType': 'employees',
        'version': 'v.1.15',
        'legacy': True,
        'recommendedEndpoint': '/api/care-future/status'
    })

# =============================================================================
# ОБРАБОТЧИКИ ОШИБОК
# =============================================================================

@care_future_bp.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'error': 'Endpoint не найден',
        'programType': 'employees',
        'availableEndpoints': [
            '/api/care-future/calculate',
            '/api/care-future/config', 
            '/api/care-future/status'
        ]
    }), 404

@care_future_bp.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'error': 'Внутренняя ошибка сервера',
        'programType': 'employees'
    }), 500

# =============================================================================
# ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
# =============================================================================

def register_care_future_routes(app):
    """Регистрация роутов в основном приложении"""
    app.register_blueprint(care_future_bp)
    logger.info("✅ Care Future routes (employees logic) registered")

# Middleware для логирования запросов к API
@care_future_bp.before_request
def before_request():
    """Middleware для логирования"""
    logger.info(f"🌐 {request.method} {request.path} - Care Future API Request (employees logic)")

"""
КЛЮЧЕВЫЕ ИЗМЕНЕНИЯ В ЭТОЙ ВЕРСИИ:

1. ✅ Заменена логика расчетов на программу сотрудников
2. ✅ Сохранены все старые endpoints (/api/care-future/*)
3. ✅ Добавлена поддержка уровней дохода (incomeLevel)
4. ✅ Обновлена структура ответов с новыми полями
5. ✅ Добавлена обратная совместимость
6. ✅ Сохранен интерфейс старого API

НОВЫЕ ПОЛЯ В ОТВЕТАХ:
- formedCapital - сформированный капитал
- cashbackCoefficient - коэффициент кэшбэка
- incomeLevel - уровень дохода клиента

СОВМЕСТИМОСТЬ:
- Все старые endpoints работают
- Фронтенд может использовать тот же код
- Добавлены новые возможности без breaking changes
"""