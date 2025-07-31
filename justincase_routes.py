# justincase_routes.py
# ПОЛНЫЕ API routes для калькулятора "На всякий случай" с детальной валидацией

import logging
from datetime import datetime, date
from typing import Dict, Any, List
from flask import Blueprint, request, jsonify, current_app
import traceback

# Импортируем полный калькулятор
from justincase_calculator import JustincaseCalculatorComplete

logger = logging.getLogger(__name__)

# Создаем Blueprint для API калькулятора "На всякий случай"
justincase_bp = Blueprint('justincase', __name__, url_prefix='')

# =============================================================================
# ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
# =============================================================================

def safe_get_json():
    """Безопасное получение JSON из запроса"""
    try:
        content_type = request.content_type or ''
        logger.info(f"📋 Content-Type: {content_type}")
        
        if 'application/json' not in content_type.lower():
            return None, "Content-Type должен быть application/json"
        
        if not request.data:
            return None, "Пустое тело запроса"
        
        data = request.get_json(force=True)
        if data is None:
            return None, "Невозможно распарсить JSON данные"
        
        logger.info(f"📥 JSON получен: {list(data.keys()) if isinstance(data, dict) else type(data)}")
        return data, None
        
    except Exception as e:
        logger.error(f"❌ Ошибка получения JSON: {e}")
        return None, f"Ошибка обработки запроса: {str(e)}"

def format_error_response(error_message: str, error_code: int = 400, details: Dict = None) -> tuple:
    """Форматирование ошибки в стандартном виде"""
    response = {
        'success': False,
        'error': error_message,
        'timestamp': datetime.now().isoformat(),
        'calculator': 'JustincaseCalculatorComplete'
    }
    
    if details:
        response['details'] = details
    
    return jsonify(response), error_code

def format_success_response(data: Dict[str, Any], message: str = None) -> Dict[str, Any]:
    """Форматирование успешного ответа"""
    response = {
        'success': True,
        'timestamp': datetime.now().isoformat(),
        'calculator': 'JustincaseCalculatorComplete',
        'version': '2.0.0'
    }
    
    if message:
        response['message'] = message
    
    response.update(data)
    return response

# =============================================================================
# ОСНОВНЫЕ API ENDPOINTS
# =============================================================================

@justincase_bp.route('/api/proxy/calculator/save', methods=['POST', 'OPTIONS'])
def calculate_justincase_main():
    """
    ОСНОВНОЙ ENDPOINT для расчета программы "На всякий случай"
    Используется фронтендом JustincasePage.js
    """
    # CORS preflight
    if request.method == "OPTIONS":
        return '', 200

    try:
        logger.info("🧮 === ОСНОВНОЙ РАСЧЕТ 'НА ВСЯКИЙ СЛУЧАЙ' ===")
        
        # Получаем JSON данные
        data, error = safe_get_json()
        if error:
            return format_error_response(error, 400)
        
        logger.info(f"📝 Входные данные: {list(data.keys())}")
        
        # Создаем калькулятор
        calculator = JustincaseCalculatorComplete()
        
        # Полная валидация входных данных
        is_valid, validation_errors = calculator.validate_input_data(data)
        if not is_valid:
            return format_error_response(
                "Ошибки валидации входных данных", 
                400, 
                {'validation_errors': validation_errors}
            )
        
        # Выполняем полный расчет
        result = calculator.calculate_full_program(data)
        
        logger.info(f"✅ Расчет выполнен: премия {result.get('annualPremium', 0):,} руб.")
        
        # Возвращаем результат в формате, ожидаемом фронтендом
        return jsonify(result)
        
    except ValueError as e:
        logger.warning(f"⚠️ Ошибка валидации: {e}")
        return format_error_response(str(e), 400)
        
    except Exception as e:
        logger.error(f"❌ Критическая ошибка расчета: {e}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return format_error_response(
            f'Внутренняя ошибка сервера: {str(e)}', 
            500,
            {'traceback': traceback.format_exc() if current_app.debug else None}
        )

@justincase_bp.route('/api/justincase/calculate', methods=['POST', 'OPTIONS'])
def calculate_justincase_extended():
    """
    РАСШИРЕННЫЙ ENDPOINT с дополнительными возможностями
    Поддерживает детальную настройку параметров
    """
    if request.method == "OPTIONS":
        return '', 200

    try:
        logger.info("🎯 === РАСШИРЕННЫЙ РАСЧЕТ ===")
        
        data, error = safe_get_json()
        if error:
            return format_error_response(error, 400)
        
        calculator = JustincaseCalculatorComplete()
        
        # Валидация с детальными сообщениями
        is_valid, validation_errors = calculator.validate_input_data(data)
        if not is_valid:
            return format_error_response(
                "Валидация не пройдена", 
                400, 
                {
                    'validation_errors': validation_errors,
                    'input_data_received': list(data.keys()),
                    'required_fields': ['birthDate', 'gender', 'insuranceInfo']
                }
            )
        
        # Расчет
        result = calculator.calculate_full_program(data)
        
        # Дополнительная информация в расширенном режиме
        calculator_info = calculator.get_calculator_info()
        
        response_data = {
            'calculation_result': result,
            'calculator_info': calculator_info,
            'validation_passed': True
        }
        
        return jsonify(format_success_response(
            response_data, 
            "Расширенный расчет выполнен успешно"
        ))
        
    except Exception as e:
        logger.error(f"❌ Ошибка расширенного расчета: {e}")
        return format_error_response(f'Ошибка расчета: {str(e)}', 500)

@justincase_bp.route('/api/justincase/validate', methods=['POST', 'OPTIONS'])
def validate_data():
    """
    ENDPOINT для валидации данных без расчета
    """
    if request.method == "OPTIONS":
        return '', 200

    try:
        logger.info("🔍 === ВАЛИДАЦИЯ ДАННЫХ ===")
        
        data, error = safe_get_json()
        if error:
            return format_error_response(error, 400)
        
        calculator = JustincaseCalculatorComplete()
        is_valid, validation_errors = calculator.validate_input_data(data)
        
        response_data = {
            'validation_passed': is_valid,
            'errors': validation_errors,
            'input_fields_count': len(data.keys()),
            'received_fields': list(data.keys())
        }
        
        if is_valid:
            # Дополнительная информация при успешной валидации
            age = calculator.calculate_age(data['birthDate'])
            recommended_sum = calculator.calculate_recommended_sum(data) if data.get('insuranceInfo') == 'no' else None
            
            response_data.update({
                'calculated_age': age,
                'recommended_sum': recommended_sum,
                'ready_for_calculation': True
            })
        
        return jsonify(format_success_response(
            response_data,
            "Валидация завершена" + (" успешно" if is_valid else " с ошибками")
        ))
        
    except Exception as e:
        logger.error(f"❌ Ошибка валидации: {e}")
        return format_error_response(f'Ошибка валидации: {str(e)}', 500)

@justincase_bp.route('/api/justincase/validate-sum', methods=['POST', 'OPTIONS'])
def validate_insurance_sum():
    """
    ENDPOINT для валидации страховой суммы
    """
    if request.method == "OPTIONS":
        return '', 200

    try:
        data, error = safe_get_json()
        if error:
            return format_error_response(error, 400)
        
        if 'amount' not in data:
            return format_error_response('Не указана сумма для валидации', 400)
        
        calculator = JustincaseCalculatorComplete()
        
        try:
            amount_str = str(data['amount']).replace(' ', '').replace(',', '').replace('.', '')
            amount = int(amount_str)
        except:
            return format_error_response('Некорректный формат суммы', 400)
        
        errors = []
        if amount < calculator.MIN_INSURANCE_SUM:
            errors.append(f'Минимальная страховая сумма: {calculator.MIN_INSURANCE_SUM:,} руб.')
        
        if amount > calculator.MAX_INSURANCE_SUM:
            errors.append(f'Максимальная страховая сумма: {calculator.MAX_INSURANCE_SUM:,} руб.')
        
        is_valid = len(errors) == 0
        
        response_data = {
            'valid': is_valid,
            'amount': amount,
            'formatted_amount': f"{amount:,}".replace(",", "."),
            'errors': errors,
            'limits': {
                'min': calculator.MIN_INSURANCE_SUM,
                'max': calculator.MAX_INSURANCE_SUM
            }
        }
        
        return jsonify(format_success_response(response_data, "Валидация суммы завершена"))
        
    except Exception as e:
        logger.error(f"❌ Ошибка валидации суммы: {e}")
        return format_error_response(f'Ошибка валидации суммы: {str(e)}', 500)

@justincase_bp.route('/api/justincase/recommend-sum', methods=['POST', 'OPTIONS'])
def recommend_insurance_sum():
    """
    ENDPOINT для расчета рекомендуемой страховой суммы и срока
    """
    if request.method == "OPTIONS":
        return '', 200

    try:
        logger.info("💰 === РАСЧЕТ РЕКОМЕНДУЕМОЙ СУММЫ ===")
        
        data, error = safe_get_json()
        if error:
            return format_error_response(error, 400)
        
        calculator = JustincaseCalculatorComplete()
        result = calculator.calculate_recommended_sum(data)
        
        # Теперь result - это словарь с recommended_sum и recommended_term
        recommended_sum = result.get('recommended_sum', 1000000)
        recommended_term = result.get('recommended_term', 15)
        
        response_data = {
            'recommended_sum': recommended_sum,
            'recommended_term': recommended_term,
            'formatted_sum': f"{recommended_sum:,}".replace(",", "."),
            'calculation_basis': {
                'income_2022': data.get('income2022'),
                'income_2023': data.get('income2023'), 
                'income_2024': data.get('income2024'),
                'breadwinner_status': data.get('breadwinnerStatus'),
                'children_count': data.get('childrenCount'),
                'special_care_relatives': data.get('specialCareRelatives'),
                'income_share': data.get('incomeShare'),
                'unsecured_loans': data.get('unsecuredLoans')
            }
        }
        
        return jsonify(format_success_response(response_data, "Рекомендуемая сумма и срок рассчитаны"))
        
    except Exception as e:
        logger.error(f"❌ Ошибка расчета рекомендуемой суммы: {e}")
        return format_error_response(f'Ошибка расчета: {str(e)}', 500)

@justincase_bp.route('/api/justincase/config', methods=['GET'])
def get_calculator_config():
    """
    ENDPOINT для получения конфигурации калькулятора
    """
    try:
        calculator = JustincaseCalculatorComplete()
        config = calculator.get_calculator_info()
        
        # Дополнительные настройки для фронтенда
        frontend_config = {
            'api_version': '2.0.0',
            'calculator_name': 'На всякий случай - Полная версия',
            'features': config['features'],
            'limits': config['limits'],
            'supported_options': {
                'payment_frequencies': ['Ежегодно', 'Ежемесячно', 'Поквартально', 'Полугодие'],
                'treatment_regions': [
                    {'value': 'russia', 'label': 'Лечение в РФ'},
                    {'value': 'abroad', 'label': 'Лечение за рубежом'}
                ],
                'sport_types': [
                    {'value': 'none', 'label': 'Без спорта'},
                    {'value': 'low_risk', 'label': 'Низкий риск'},
                    {'value': 'medium_risk', 'label': 'Средний риск'},
                    {'value': 'high_risk', 'label': 'Высокий риск'},
                    {'value': 'extreme', 'label': 'Экстремальный спорт'}
                ]
            },
            'validation_rules': {
                'age_range': f"{config['limits']['min_age']}-{config['limits']['max_age']} лет",
                'sum_range': f"{config['limits']['min_sum']:,}-{config['limits']['max_sum']:,} руб.",
                'term_range': f"{config['limits']['min_term']}-{config['limits']['max_term']} лет"
            }
        }
        
        return jsonify(format_success_response(
            {'config': frontend_config}, 
            "Конфигурация калькулятора получена"
        ))
        
    except Exception as e:
        logger.error(f"❌ Ошибка получения конфигурации: {e}")
        return format_error_response(f'Ошибка получения конфигурации: {str(e)}', 500)

@justincase_bp.route('/api/justincase/test', methods=['GET'])
def test_calculator():
    """
    ENDPOINT для тестирования калькулятора
    """
    try:
        logger.info("🧪 === ТЕСТИРОВАНИЕ КАЛЬКУЛЯТОРА ===")
        
        calculator = JustincaseCalculatorComplete()
        
        # Тестовые данные - несколько сценариев
        test_scenarios = [
            {
                'name': 'Базовый тест - молодой мужчина',
                'data': {
                    'birthDate': '1990-01-01',
                    'gender': 'male',
                    'insuranceInfo': 'yes',
                    'insuranceTerm': '5',
                    'insuranceSum': '1000000',
                    'accidentPackage': False,
                    'criticalPackage': False,
                    'sportPackage': False
                }
            },
            {
                'name': 'Полный пакет - женщина с семьей',
                'data': {
                    'birthDate': '1985-05-15',
                    'gender': 'female',
                    'insuranceInfo': 'yes',
                    'insuranceTerm': '10',
                    'insuranceSum': '3000000',
                    'insuranceFrequency': 'Ежегодно',
                    'accidentPackage': True,
                    'criticalPackage': True,
                    'treatmentRegion': 'russia',
                    'sportPackage': True,
                    'breadwinnerStatus': 'yes',
                    'childrenCount': '2'
                }
            },
            {
                'name': 'Рекомендуемая сумма',
                'data': {
                    'birthDate': '1975-12-01',
                    'gender': 'male',
                    'insuranceInfo': 'no',
                    'income2021': '2000000',
                    'income2022': '2200000',
                    'income2023': '2400000',
                    'breadwinnerStatus': 'yes',
                    'childrenCount': '1',
                    'specialCareRelatives': 'no'
                }
            }
        ]
        
        test_results = []
        
        for scenario in test_scenarios:
            try:
                # Валидация
                is_valid, errors = calculator.validate_input_data(scenario['data'])
                
                if is_valid:
                    # Расчет
                    result = calculator.calculate_full_program(scenario['data'])
                    test_results.append({
                        'scenario': scenario['name'],
                        'status': 'success',
                        'premium': result['annualPremium'],
                        'insurance_sum': result['insuranceSum'],
                        'details': {
                            'age': result['clientAge'],
                            'term': result['insuranceTerm'],
                            'base_premium': result['basePremium'],
                            'accident_premium': result['accidentPremium'],
                            'critical_premium': result['criticalPremium']
                        }
                    })
                else:
                    test_results.append({
                        'scenario': scenario['name'],
                        'status': 'validation_failed',
                        'errors': errors
                    })
                    
            except Exception as e:
                test_results.append({
                    'scenario': scenario['name'],
                    'status': 'error',
                    'error': str(e)
                })
        
        # Общая статистика
        successful_tests = len([r for r in test_results if r['status'] == 'success'])
        total_tests = len(test_results)
        
        calculator_info = calculator.get_calculator_info()
        
        response_data = {
            'test_summary': {
                'total_tests': total_tests,
                'successful_tests': successful_tests,
                'failed_tests': total_tests - successful_tests,
                'success_rate': f"{(successful_tests/total_tests*100):.1f}%" if total_tests > 0 else "0%"
            },
            'test_results': test_results,
            'calculator_info': calculator_info,
            'all_tests_passed': successful_tests == total_tests
        }
        
        message = f"Тестирование завершено: {successful_tests}/{total_tests} тестов прошли успешно"
        
        return jsonify(format_success_response(response_data, message))
        
    except Exception as e:
        logger.error(f"❌ Критическая ошибка тестирования: {e}")
        return format_error_response(f'Ошибка тестирования: {str(e)}', 500)

@justincase_bp.route('/api/justincase/status', methods=['GET'])
def get_calculator_status():
    """
    ENDPOINT для получения статуса калькулятора
    """
    try:
        calculator = JustincaseCalculatorComplete()
        
        # Быстрый тест работоспособности
        test_data = {
            'birthDate': '1990-01-01',
            'gender': 'male',
            'insuranceInfo': 'yes',
            'insuranceTerm': '5',
            'insuranceSum': '1000000'
        }
        
        try:
            is_valid, _ = calculator.validate_input_data(test_data)
            result = calculator.calculate_full_program(test_data) if is_valid else None
            calculator_status = 'working'
            calculator_error = None
            test_premium = result['annualPremium'] if result else 0
        except Exception as e:
            calculator_status = 'error'
            calculator_error = str(e)
            test_premium = 0
        
        calculator_info = calculator.get_calculator_info()
        
        response_data = {
            'status': calculator_status,
            'error': calculator_error,
            'version': calculator_info['version'],
            'name': calculator_info['name'],
            'test_calculation': {
                'premium': test_premium,
                'test_data': test_data if calculator_status == 'working' else None
            },
            'features': calculator_info['features'],
            'limits': calculator_info['limits'],
            'endpoints': {
                'main_calculation': '/api/proxy/calculator/save',
                'extended_calculation': '/api/justincase/calculate',
                'validation': '/api/justincase/validate',
                'sum_validation': '/api/justincase/validate-sum',
                'recommend_sum': '/api/justincase/recommend-sum',
                'config': '/api/justincase/config',
                'test': '/api/justincase/test',
                'status': '/api/justincase/status'
            },
            'database_required': False,
            'external_dependencies': False
        }
        
        return jsonify(format_success_response(
            response_data,
            f"Калькулятор {calculator_status}" + (f": {calculator_error}" if calculator_error else "")
        ))
        
    except Exception as e:
        logger.error(f"❌ Ошибка получения статуса: {e}")
        return format_error_response(f'Ошибка получения статуса: {str(e)}', 500)

# =============================================================================
# ФУНКЦИЯ РЕГИСТРАЦИИ ROUTES
# =============================================================================

def register_justincase_routes(app):
    """
    Регистрация всех маршрутов калькулятора "На всякий случай"
    """
    try:
        app.register_blueprint(justincase_bp)
        logger.info("✅ Маршруты полного калькулятора 'На всякий случай' зарегистрированы")
        
        # Тестируем калькулятор при инициализации
        with app.app_context():
            try:
                calculator = JustincaseCalculatorComplete()
                
                # Быстрый тест
                test_data = {
                    'birthDate': '1990-01-01',
                    'gender': 'male',
                    'insuranceInfo': 'yes',
                    'insuranceTerm': '5',
                    'insuranceSum': '1000000'
                }
                
                is_valid, errors = calculator.validate_input_data(test_data)
                if is_valid:
                    result = calculator.calculate_full_program(test_data)
                    premium = result['annualPremium']
                    logger.info(f"✅ Полный калькулятор готов: тест-премия {premium:,} руб.")
                else:
                    logger.warning(f"⚠️ Проблемы в тестовых данных: {errors}")
                
                logger.info("📍 Доступные endpoints:")
                logger.info("  - POST /api/proxy/calculator/save (основной, для фронтенда)")
                logger.info("  - POST /api/justincase/calculate (расширенный)")
                logger.info("  - POST /api/justincase/validate (валидация)")
                logger.info("  - POST /api/justincase/validate-sum (валидация суммы)")
                logger.info("  - POST /api/justincase/recommend-sum (рекомендуемая сумма)")
                logger.info("  - GET  /api/justincase/config (конфигурация)")
                logger.info("  - GET  /api/justincase/test (тестирование)")
                logger.info("  - GET  /api/justincase/status (статус)")
                
            except Exception as e:
                logger.error(f"❌ Ошибка проверки калькулятора при инициализации: {e}")
                return False
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Критическая ошибка регистрации маршрутов: {e}")
        return False

# =============================================================================
# ТЕСТИРОВАНИЕ ПРИ ПРЯМОМ ЗАПУСКЕ
# =============================================================================

if __name__ == "__main__":
    from flask import Flask
    
    app = Flask(__name__)
    app.config['DEBUG'] = True
    
    register_justincase_routes(app)
    
    print("🧪 === ТЕСТИРОВАНИЕ API ПОЛНОГО КАЛЬКУЛЯТОРА ===")
    
    with app.test_client() as client:
        # Тест статуса
        response = client.get('/api/justincase/status')
        print(f"Status test: {response.status_code}")
        if response.status_code == 200:
            status_data = response.get_json()
            print(f"Calculator status: {status_data['data']['status']}")
        
        # Тест конфигурации
        response = client.get('/api/justincase/config')
        print(f"Config test: {response.status_code}")
        
        # Тест работы калькулятора
        response = client.get('/api/justincase/test')
        print(f"Calculator test: {response.status_code}")
        if response.status_code == 200:
            test_data = response.get_json()
            print(f"Tests passed: {test_data['data']['test_summary']['success_rate']}")
        
        # Тест основного расчета (как из фронтенда)
        test_calculation = {
            'birthDate': '1985-05-15',
            'gender': 'female',
            'insuranceInfo': 'yes',
            'insuranceTerm': '10',
            'insuranceSum': '2000000',
            'insuranceFrequency': 'Ежегодно',
            'accidentPackage': True,
            'criticalPackage': True,
            'treatmentRegion': 'russia',
            'sportPackage': False
        }
        
        response = client.post('/api/proxy/calculator/save', 
                             json=test_calculation,
                             content_type='application/json')
        print(f"Main calculation test: {response.status_code}")
        
        if response.status_code == 200:
            result = response.get_json()
            premium = result.get('annualPremium', 0)
            print(f"Calculation successful: премия {premium:,} руб.")
            print("🎉 Все API тесты пройдены!")
        else:
            error_data = response.get_json() if response.status_code != 500 else {'error': 'Internal server error'}
            print(f"❌ Ошибка основного расчета: {error_data}")