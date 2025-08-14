# -*- coding: utf-8 -*-
"""
API роуты для калькулятора JustInCase
"""

import logging
from datetime import datetime
from typing import Dict, Any
from flask import Blueprint, request, jsonify
import traceback
import uuid

# Импортируем новый калькулятор
import justincase_calculator
from justincase_calculator import JustInCaseCalculator


def parse_int(value: Any) -> float:
    """Утилита для безопасного преобразования строки или числа в float/None."""
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    # Удаляем пробелы, точки-разделители тысяч
    s = str(value).strip().replace(' ', '').replace('.', '')
    try:
        return float(s)
    except ValueError:
        return None


def compute_recommended_sum_and_term(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Вычисляет рекомендованную страховую сумму и срок по логике из Excel.

    Ожидает словарь с полями:
    birthDate (строка YYYY-MM-DD), hasJob (yes/no/student),
    income2022, income2023, income2024, scholarship, unsecuredLoans,
    breadwinnerStatus, incomeShare, childrenCount, specialCareRelatives.
    Возвращает словарь { recommended_sum: int, recommended_term: int }.
    """
    from datetime import date, datetime

    birth_date_str = payload.get('birthDate')
    has_job = payload.get('hasJob')
    # normalize hasJob (case-insensitive)
    if isinstance(has_job, str):
        has_job = has_job.lower()
    # parse date
    age = None
    if birth_date_str:
        try:
            bd = datetime.strptime(birth_date_str, '%Y-%m-%d').date()
            today = date.today()
            age = today.year - bd.year - ((today.month, today.day) < (bd.month, bd.day))
        except Exception:
            age = None

    # parse incomes
    incomes = []
    for key in ('income2022', 'income2023', 'income2024', 'scholarship'):
        val = parse_int(payload.get(key))
        if isinstance(val, (int, float)) and not isinstance(val, bool):
            incomes.append(val)
    avg_income = sum(incomes) / len(incomes) if incomes else 0

    # breadwinner coefficient
    breadwinner_status = payload.get('breadwinnerStatus')
    income_share = (payload.get('incomeShare') or '').strip()
    # normalize strings: remove spaces, unify hyphen types
    norm_share = income_share.replace('–', '-').replace(' ', '').replace(' ', '')
    # mapping
    share_map = {
        'до10%': 1.0,
        '10-24%': 1.4,
        '25-49%': 1.8,
        '50-74%': 2.2,
        '75-89%': 2.6,
        '75%-89%': 2.6,
        'Более90%': 3.0,
        'Более90%': 3.0,
        'Более90%': 3.0,
        'более90%': 3.0,
        'Более 90%': 3.0,
        'более 90%': 3.0
    }
    if breadwinner_status == 'yes' or breadwinner_status == 'кормилец':
        breadwinner_coeff = 3.0
    elif breadwinner_status in ('no', 'not_breadwinner'):
        breadwinner_coeff = share_map.get(norm_share, 1.0)
    else:
        # default to coefficient based on income share if provided
        breadwinner_coeff = share_map.get(norm_share, 1.0)

    # children coefficient
    children_count = (payload.get('childrenCount') or '').strip()
    # normalize spaces and case
    child_key = children_count.replace(' ', '')
    children_map = {
        '0': 1.0,
        '1': 1.25,
        '2': 1.40625,
        '3имолее': 1.523438,
        '3имолее': 1.523438,
        '3иБолее': 1.523438,
        '3иБольше': 1.523438,
        '3': 1.523438,
        '3ибо': 1.523438,
        '3иближе': 1.523438
    }
    # handle Russian phrase '3 и более'
    if child_key in children_map:
        children_coeff = children_map[child_key]
    elif '3' in child_key:
        children_coeff = 1.523438
    else:
        children_coeff = 1.0

    # special care relatives coefficient
    special_care = payload.get('specialCareRelatives')
    special_coeff = 1.3 if str(special_care).lower() == 'yes' else 1.0

    # loans
    loans = parse_int(payload.get('unsecuredLoans')) or 0.0

    # combined coefficient
    product_coeff = breadwinner_coeff * children_coeff * special_coeff

    # f5 based on age
    f5 = 3.0
    if isinstance(age, int):
        if age <= 34:
            f5 = 10.0
        elif age <= 44:
            f5 = 8.0
        elif age <= 49:
            f5 = 7.0
        elif age <= 54:
            f5 = 6.0
        elif age <= 59:
            f5 = 5.0
        else:
            f5 = 3.0

    # maximum sum
    if has_job == 'yes':
        max_sum = avg_income * f5
    elif has_job == 'student':
        max_sum = avg_income * 10
    else:
        max_sum = 1_000_000.0

    # base sum
    if has_job == 'no':
        base_sum = 1_000_000.0
    else:
        base_sum = avg_income * product_coeff + loans

    # recommended sum
    rec_sum = min(base_sum, max_sum)
    # round to nearest 100k
    rec_sum = round(rec_sum / 100000) * 100000

    # recommended term
    rec_term = 0
    if isinstance(age, int):
        if age > 70:
            rec_term = max(75 - age, 0)
        else:
            rec_term = min(max(5, 60 - age), 15)

    return {
        'recommended_sum': int(rec_sum),
        'recommended_term': int(rec_term)
    }



logger = logging.getLogger(__name__)

# Создаем Blueprint
justincase_bp = Blueprint('justincase', __name__)

def safe_get_json():
    """Безопасное получение JSON из запроса"""
    try:
        if not request.is_json:
            return None, "Content-Type должен быть application/json"
        
        data = request.get_json()
        if data is None:
            return None, "Пустое тело запроса или невалидный JSON"
        
        return data, None
        
    except Exception as e:
        logger.error(f"Ошибка получения JSON: {e}")
        return None, f"Ошибка обработки запроса: {str(e)}"

def format_success_response(data: Any, message: str = "Успешно") -> Dict[str, Any]:
    """Форматирование успешного ответа"""
    return {
        'success': True,
        'message': message,
        'data': data,
        'timestamp': datetime.now().isoformat()
    }

def format_error_response(error_message: str, error_code: int = 400) -> tuple:
    """Форматирование ошибки"""
    response = {
        'success': False,
        'error': error_message,
        'timestamp': datetime.now().isoformat()
    }
    return jsonify(response), error_code

@justincase_bp.route('/api/justincase/calculate', methods=['POST', 'OPTIONS'])
def calculate_premium():
    """
    Основной эндпоинт для расчета премии
    
    Ожидает JSON:
    {
        "age": 30,
        "gender": "m",
        "term_years": 10,
        "sum_insured": 1000000,
        "include_accident": true,
        "include_critical_illness": true,
        "payment_frequency": "annual"
    }
    """
    if request.method == "OPTIONS":
        return '', 200

    try:
        logger.info("🎯 Начало расчета JustInCase")
        
        # Получаем данные
        data, error = safe_get_json()
        if error:
            return format_error_response(error, 400)
        
        # Извлекаем параметры
        try:
            age = int(data.get('age'))
            gender = data.get('gender', '').lower()
            term_years = int(data.get('term_years'))
            sum_insured = float(data.get('sum_insured'))
            include_accident = data.get('include_accident', True)
            include_critical_illness = data.get('include_critical_illness', True)
            critical_illness_type = data.get('critical_illness_type', 'rf')  # 'rf' или 'abroad'
            payment_frequency = data.get('payment_frequency', 'annual')
            email = data.get('email')  # Извлекаем email для корпоративных коэффициентов
            
        except (TypeError, ValueError) as e:
            return format_error_response(f"Неверный формат данных: {str(e)}", 400)
        
        # Генерируем ID расчета
        calculation_id = str(uuid.uuid4())
        
        # Выполняем расчет
        calculator = JustInCaseCalculator()
        result = calculator.calculate_premium(
            age=age,
            gender=gender,
            term_years=term_years,
            sum_insured=sum_insured,
            include_accident=include_accident,
            include_critical_illness=include_critical_illness,
            critical_illness_type=critical_illness_type,
            payment_frequency=payment_frequency,
            email=email  # Передаем email для корпоративных коэффициентов
        )
        
        if result['success']:
            logger.info(f"✅ Расчет выполнен успешно: {result['final_premium']} руб.")
            return jsonify(format_success_response(result, "Расчет выполнен успешно"))
        else:
            logger.error(f"❌ Ошибка расчета: {result['error']}")
            return format_error_response(result['error'], 400)
        
    except Exception as e:
        logger.error(f"❌ Внутренняя ошибка расчета: {e}")
        logger.error(traceback.format_exc())
        return format_error_response(f'Внутренняя ошибка сервера: {str(e)}', 500)

@justincase_bp.route('/api/justincase/info', methods=['GET', 'OPTIONS'])
def get_calculator_info():
    """
    Получение информации о калькуляторе
    """
    if request.method == "OPTIONS":
        return '', 200

    try:
        from justincase_calculator import JustInCaseCalculator
        
        calculator = JustInCaseCalculator()
        age_range = calculator.get_age_range()
        
        # Получаем пример доступных сроков для среднего возраста
        middle_age = (age_range['min'] + age_range['max']) // 2
        available_terms_m = calculator.get_available_terms(middle_age, 'm')
        available_terms_f = calculator.get_available_terms(middle_age, 'f')
        
        info = {
            'name': 'JustInCase Calculator',
            'version': '2.0',
            'description': 'Калькулятор страхования "На всякий случай"',
            'age_range': age_range,
            'supported_genders': ['m', 'f'],
            'payment_frequencies': ['annual', 'semi_annual', 'quarterly', 'monthly'],
            'example_available_terms': {
                'male': available_terms_m,
                'female': available_terms_f,
                'note': f'Пример для возраста {middle_age} лет'
            },
            'frequency_descriptions': {
                'annual': 'Годовая выплата',
                'semi_annual': 'Полугодовая выплата',
                'quarterly': 'Ежеквартальная выплата',
                'monthly': 'Ежемесячная выплата'
            }
        }
        
        return jsonify(format_success_response(info, "Информация о калькуляторе"))
        
    except Exception as e:
        logger.error(f"❌ Ошибка получения информации: {e}")
        return format_error_response(f'Ошибка получения информации: {str(e)}', 500)

@justincase_bp.route('/api/justincase/available-terms', methods=['POST', 'OPTIONS'])
def get_available_terms():
    """
    Получение доступных сроков для конкретного возраста и пола
    
    Ожидает JSON:
    {
        "age": 30,
        "gender": "m"
    }
    """
    if request.method == "OPTIONS":
        return '', 200

    try:
        data, error = safe_get_json()
        if error:
            return format_error_response(error, 400)
        
        try:
            age = int(data.get('age'))
            gender = data.get('gender', '').lower()
        except (TypeError, ValueError) as e:
            return format_error_response(f"Неверный формат данных: {str(e)}", 400)
        
        if gender not in ['m', 'f']:
            return format_error_response("Пол должен быть 'm' или 'f'", 400)
        
        from justincase_calculator import JustInCaseCalculator
        calculator = JustInCaseCalculator()
        
        available_terms = calculator.get_available_terms(age, gender)
        
        result = {
            'age': age,
            'gender': gender,
            'available_terms': available_terms
        }
        
        return jsonify(format_success_response(result, "Доступные сроки получены"))
        
    except Exception as e:
        logger.error(f"❌ Ошибка получения доступных сроков: {e}")
        return format_error_response(f'Ошибка получения доступных сроков: {str(e)}', 500)


@justincase_bp.route('/api/justincase/recommend-sum', methods=['POST', 'OPTIONS'])
def recommend_sum():
    """
    Расчет рекомендованной страховой суммы и срока по данным клиента.

    Ожидает JSON с полями, описанными в функции compute_recommended_sum_and_term.
    Возвращает recommended_sum и recommended_term.
    """
    if request.method == "OPTIONS":
        return '', 200

    try:
        data, error = safe_get_json()
        if error:
            return format_error_response(error, 400)

        result = compute_recommended_sum_and_term(data or {})
        return jsonify(format_success_response(result, "Рекомендованная сумма рассчитана"))

    except Exception as e:
        logger.error(f"❌ Ошибка расчета рекомендованной суммы: {e}")
        logger.error(traceback.format_exc())
        return format_error_response(f'Ошибка расчета рекомендованной суммы: {str(e)}', 500)

@justincase_bp.route('/api/justincase/health', methods=['GET'])
def health_check():
    """
    Проверка работоспособности калькулятора
    """
    try:
        from justincase_calculator import JustInCaseCalculator
        
        calculator = JustInCaseCalculator()
        conn = calculator.connect()
        
        if conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM justincase_base_tariffs;")
            tariff_count = cursor.fetchone()[0]
            cursor.close()
            conn.close()
            
            return jsonify({
                'status': 'healthy',
                'database_connected': True,
                'tariffs_loaded': tariff_count,
                'timestamp': datetime.now().isoformat()
            })
        else:
            return jsonify({
                'status': 'unhealthy',
                'database_connected': False,
                'error': 'Нет подключения к БД',
                'timestamp': datetime.now().isoformat()
            }), 500
            
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

def safe_parse_number(value, default=0):
    """Безопасное преобразование значения в число"""
    if value is None or value == '':
        return default
    
    # Обработка строковых boolean значений
    if isinstance(value, str):
        value_lower = value.lower().strip()
        if value_lower in ['yes', 'да', 'true']:
            return 1
        elif value_lower in ['no', 'нет', 'false']:
            return 0
        elif value_lower == '':
            return default
    
    try:
        return float(value) if '.' in str(value) else int(value)
    except (ValueError, TypeError):
        return default

def safe_parse_boolean(value, default=False):
    """Безопасное преобразование значения в boolean"""
    if value is None:
        return default
    
    if isinstance(value, bool):
        return value
    
    if isinstance(value, str):
        value_lower = value.lower().strip()
        if value_lower in ['yes', 'да', 'true', '1']:
            return True
        elif value_lower in ['no', 'нет', 'false', '0']:
            return False
    
    return bool(value)

# Эндпоинт для расчета рекомендованной суммы удален - теперь расчет происходит на клиенте

def register_justincase_routes(app):
    """
    Регистрация всех маршрутов калькулятора JustInCase
    """
    try:
        app.register_blueprint(justincase_bp)
        logger.info("✅ Маршруты калькулятора JustInCase зарегистрированы")
        
        # Тестируем калькулятор при инициализации
        with app.app_context():
            try:
                from justincase_calculator import JustInCaseCalculator
                calculator = JustInCaseCalculator()
                
                # Проверяем подключение к БД
                conn = calculator.connect()
                if conn:
                    cursor = conn.cursor()
                    cursor.execute("SELECT COUNT(*) FROM justincase_base_tariffs;")
                    count = cursor.fetchone()[0]
                    cursor.close()
                    conn.close()
                    logger.info(f"✅ База данных доступна. Загружено тарифов: {count}")
                else:
                    logger.warning("⚠️ Нет подключения к базе данных")
                    
            except Exception as e:
                logger.error(f"❌ Ошибка тестирования калькулятора: {e}")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Ошибка регистрации роутов JustInCase: {e}")
        return False


@justincase_bp.route('/api/proxy/calculator/save', methods=['POST', 'OPTIONS'])
def proxy_calculator_save():
    """
    Proxy маршрут для совместимости с фронтендом
    Перенаправляет запросы на новый API
    """
    if request.method == "OPTIONS":
        return '', 200
        
    try:
        logger.info("📨 Proxy запрос от фронтенда")
        
        # Получаем данные от фронтенда
        data, error = safe_get_json()
        if error:
            return format_error_response(error)
        
        # Преобразуем данные фронтенда в формат нового API
        # Поддерживаем как новый формат (напрямую), так и старый формат (через birthDate и пол)
        
        # Определяем возраст
        age = data.get('age')
        if not age and data.get('birthDate'):
            # Если возраст не передан, вычисляем из даты рождения
            from datetime import date
            birth_date = date.fromisoformat(data['birthDate'])
            today = date.today()
            age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
        elif not age:
            age = 30  # По умолчанию
            
        # Определяем пол
        gender = data.get('gender', 'm')
        if gender in ['male', 'Мужской']:
            gender = 'm'
        elif gender in ['female', 'Женский']:
            gender = 'f'
        
        # Определяем страховую сумму
        sum_insured = data.get('sum_insured')
        if not sum_insured:
            # Пробуем старый формат
            insurance_sum = data.get('insuranceSum', '')
            if isinstance(insurance_sum, str):
                sum_insured = int(insurance_sum.replace('.', '').replace(' ', '')) if insurance_sum else 1000000
            else:
                sum_insured = insurance_sum or 1000000
        
        # Определяем срок страхования
        term_years = data.get('term_years')
        if not term_years:
            term_years = int(data.get('insuranceTerm', 5))
            
        # Определяем включение НС
        include_accident = data.get('include_accident')
        if include_accident is None:
            # Поддерживаем разные форматы
            include_accident = (data.get('accidentPackage') in ['yes', 'Да', True] or
                              data.get('includeAccidentInsurance') in ['да', 'yes', 'Да', True])
        
        # Определяем включение КЗ
        include_critical_illness = data.get('include_critical_illness')
        if include_critical_illness is None:
            # Поддерживаем разные форматы
            include_critical_illness = (data.get('criticalPackage') in ['yes', 'Да', True] or
                                      data.get('criticalIllnessOption') not in [None, '', 'Нет'] or
                                      data.get('criticalIllnessOption') in ['Лечение в РФ', 'Лечение за рубежом'])
            
        # Определяем тип КЗ
        critical_illness_type = data.get('critical_illness_type', 'rf')
        if critical_illness_type == 'rf':
            # Проверяем старый формат
            treatment_region = data.get('treatmentRegion', 'russia')
            critical_illness_option = data.get('criticalIllnessOption', '')
            
            if (treatment_region in ['abroad', 'За границей'] or 
                critical_illness_option in ['Лечение за рубежом']):
                critical_illness_type = 'abroad'
        
        # Определяем частоту платежей
        payment_frequency = data.get('payment_frequency', 'annual')
        if payment_frequency == 'annual':
            # Проверяем старый формат
            insurance_frequency = data.get('insuranceFrequency') or data.get('paymentFrequency', 'Ежегодно')
            frequency_map = {
                'Ежегодно': 'annual',
                'Раз в год': 'annual',
                'ежегодно': 'annual',
                'Полугодие': 'semi_annual',
                'Раз в полгода': 'semi_annual',
                'полугодие': 'semi_annual',
                'Поквартально': 'quarterly',
                'Раз в квартал': 'quarterly',
                'поквартально': 'quarterly',
                'Ежемесячно': 'monthly',
                'Раз в месяц': 'monthly',
                'ежемесячно': 'monthly'
            }
            payment_frequency = frequency_map.get(insurance_frequency, 'annual')

        # Получаем email из данных
        email = data.get('email', '')

        api_data = {
            'age': age,
            'gender': gender,
            'sum_insured': sum_insured,
            'term_years': term_years,
            'include_accident': include_accident,
            'include_critical_illness': include_critical_illness,
            'critical_illness_type': critical_illness_type,
            'payment_frequency': payment_frequency,
            'email': email
        }
        
        
        logger.info(f"🔄 Преобразованные данные: {api_data}")        # Вызываем новый API
        calculator = JustInCaseCalculator()
        result = calculator.calculate_premium(
            age=api_data['age'],
            gender=api_data['gender'],
            sum_insured=api_data['sum_insured'],
            term_years=api_data['term_years'],
            critical_illness_type=api_data['critical_illness_type'],
            include_accident=api_data['include_accident'],
            include_critical_illness=api_data['include_critical_illness'],
            payment_frequency=api_data['payment_frequency'],
            email=api_data['email']
        )
        
        if not result.get('success'):
            return format_error_response(result.get('error', 'Ошибка расчёта'))
        
        # Преобразуем результат в формат, ожидаемый фронтендом
        frontend_result = {
            'success': True,
            'calculator': 'JustincaseCalculatorComplete',
            'calculationId': str(uuid.uuid4()),
            'clientAge': api_data['age'],
            'clientGender': 'Мужской' if api_data['gender'] == 'm' else 'Женский',
            'insuranceTerm': api_data['term_years'],
            'baseInsuranceSum': api_data['sum_insured'],
            'basePremium': result['base_premium'],
            # Используем размеры одного платежа из per_payment_breakdown
            'deathPremium': result['per_payment_breakdown']['death'],
            'disabilityPremium': result['per_payment_breakdown']['disability'],
            'accidentPackageIncluded': api_data['include_accident'],
            'accidentInsuranceSum': api_data['sum_insured'] if api_data['include_accident'] else 0,
            'accidentPremium': result['accident_premium'] if api_data['include_accident'] else 0,
            # Используем размер одного платежа для НС и разбиваем пропорционально
            'accidentDeathPremium': (result['per_payment_breakdown']['accident'] * 
                                   result['calculation_details']['tariff_rates']['accident_death_rate'] / 
                                   (result['calculation_details']['tariff_rates']['accident_death_rate'] + 
                                    result['calculation_details']['tariff_rates']['traffic_death_rate'] + 
                                    result['calculation_details']['tariff_rates']['injury_rate'])) if api_data['include_accident'] else 0,
            'trafficDeathPremium': (result['per_payment_breakdown']['accident'] * 
                                  result['calculation_details']['tariff_rates']['traffic_death_rate'] / 
                                  (result['calculation_details']['tariff_rates']['accident_death_rate'] + 
                                   result['calculation_details']['tariff_rates']['traffic_death_rate'] + 
                                   result['calculation_details']['tariff_rates']['injury_rate'])) if api_data['include_accident'] else 0,
            'injuryPremium': (result['per_payment_breakdown']['accident'] * 
                            result['calculation_details']['tariff_rates']['injury_rate'] / 
                            (result['calculation_details']['tariff_rates']['accident_death_rate'] + 
                             result['calculation_details']['tariff_rates']['traffic_death_rate'] + 
                             result['calculation_details']['tariff_rates']['injury_rate'])) if api_data['include_accident'] else 0,
            'criticalPackageIncluded': api_data['include_critical_illness'],
            'criticalInsuranceSum': 60000000,  # Фиксированная сумма покрытия КЗ
            'criticalRehabilitationSum': 400000,  # Фиксированная сумма реабилитации
            'criticalPremium': result['critical_illness_premium'] if api_data['include_critical_illness'] else 0,
            'totalPremium': result['final_premium'],
            'treatmentRegion': data.get('treatmentRegion', 'russia'),
            'sportPackage': data.get('sportPackage') == 'yes',
            'calculation_details': result.get('calculation_details', {}),
            'version': '2.0.0'
        }
        
        # Оборачиваем результат в формат, ожидаемый фронтендом
        final_response = {
            'success': True,
            'calculation_result': frontend_result
        }
        
        logger.info("✅ Proxy запрос обработан успешно")
        return jsonify(final_response)
        
    except Exception as e:
        logger.error(f"❌ Ошибка proxy запроса: {e}")
        import traceback
        traceback.print_exc()
        return format_error_response(f"Ошибка обработки запроса: {str(e)}")


def register_justincase_routes(app):
    """
    Функция для регистрации маршрутов JustInCase в Flask приложении
    
    Args:
        app: Flask приложение
    
    Returns:
        bool: True если регистрация успешна
    """
    try:
        # Регистрируем blueprint с маршрутами
        app.register_blueprint(justincase_bp)
        logger.info("✅ Маршруты JustInCase зарегистрированы успешно")
        return True
        
    except Exception as e:
        logger.error(f"❌ Ошибка регистрации маршрутов JustInCase: {e}")
        return False
