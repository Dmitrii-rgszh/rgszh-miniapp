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
            payment_frequency=payment_frequency
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

@justincase_bp.route('/api/justincase/recommend-sum', methods=['POST', 'OPTIONS'])
def recommend_sum():
    """
    Расчет рекомендованной суммы страхования на основе данных о доходах и семье
    """
    if request.method == "OPTIONS":
        return '', 200
        
    try:
        # Получаем данные из запроса
        data, error = safe_get_json()
        if error:
            return format_error_response(error, 400)
        
        logger.info(f"📨 Запрос рекомендованной суммы: {data}")
        
        # Извлекаем параметры с безопасным парсингом
        birth_date = data.get('birthDate')
        has_job = safe_parse_boolean(data.get('hasJob'), False)
        income_2022 = safe_parse_number(data.get('income2022'), 0)
        income_2023 = safe_parse_number(data.get('income2023'), 0)
        income_2024 = safe_parse_number(data.get('income2024'), 0)
        scholarship = safe_parse_number(data.get('scholarship'), 0)
        unsecured_loans = safe_parse_number(data.get('unsecuredLoans'), 0)
        breadwinner_status = data.get('breadwinnerStatus', 'not_breadwinner')
        income_share = safe_parse_number(data.get('incomeShare'), 0)
        children_count = safe_parse_number(data.get('childrenCount'), 0)
        special_care_relatives = safe_parse_number(data.get('specialCareRelatives'), 0)
        
        # Нормализуем breadwinner_status
        if isinstance(breadwinner_status, str):
            breadwinner_lower = breadwinner_status.lower().strip()
            if breadwinner_lower in ['yes', 'да', 'true', '1']:
                breadwinner_status = 'main_breadwinner'
            elif breadwinner_lower in ['no', 'нет', 'false', '0']:
                breadwinner_status = 'not_breadwinner'
        
        # Рассчитываем возраст
        age = 30  # По умолчанию
        if birth_date:
            try:
                birth_dt = datetime.strptime(birth_date, '%Y-%m-%d')
                age = (datetime.now() - birth_dt).days // 365
            except:
                logger.warning(f"Не удалось разобрать дату рождения: {birth_date}")
        
        # Логика расчета рекомендованной суммы
        recommended_sum = calculate_recommended_insurance_sum(
            age=age,
            has_job=has_job,
            income_2022=income_2022,
            income_2023=income_2023,
            income_2024=income_2024,
            scholarship=scholarship,
            unsecured_loans=unsecured_loans,
            breadwinner_status=breadwinner_status,
            income_share=income_share,
            children_count=children_count,
            special_care_relatives=special_care_relatives
        )
        
        # Рекомендованный срок в зависимости от возраста
        if age <= 30:
            recommended_term = 25
        elif age <= 40:
            recommended_term = 20
        elif age <= 50:
            recommended_term = 15
        else:
            recommended_term = 10
            
        result = {
            'recommended_sum': int(recommended_sum),
            'recommended_term': recommended_term,
            'calculation_details': {
                'age': age,
                'average_income': (income_2022 + income_2023 + income_2024) / 3 if any([income_2022, income_2023, income_2024]) else scholarship,
                'family_multiplier': get_family_multiplier(breadwinner_status, children_count, special_care_relatives),
                'debt_factor': unsecured_loans
            }
        }
        
        logger.info(f"✅ Рекомендованная сумма рассчитана: {recommended_sum}")
        return jsonify(format_success_response(result, "Рекомендованная сумма рассчитана"))
        
    except Exception as e:
        logger.error(f"❌ Ошибка расчета рекомендованной суммы: {e}")
        traceback.print_exc()
        return format_error_response(f'Ошибка расчета рекомендованной суммы: {str(e)}', 500)

def calculate_recommended_insurance_sum(age, has_job, income_2022, income_2023, income_2024, 
                                       scholarship, unsecured_loans, breadwinner_status, 
                                       income_share, children_count, special_care_relatives):
    """
    Расчет рекомендованной суммы страхования
    """
    # Определяем средний доход
    incomes = [income_2022, income_2023, income_2024]
    valid_incomes = [inc for inc in incomes if inc > 0]
    
    if valid_incomes:
        average_income = sum(valid_incomes) / len(valid_incomes)
    elif scholarship > 0:
        average_income = scholarship
    else:
        # Минимальная сумма, если нет данных о доходах
        return 500000
    
    # Базовый множитель - от 1.5 до 3 годовых доходов (более консервативно)
    base_multiplier = 2  # Стандартная рекомендация
    
    # Корректировки в зависимости от возраста
    if age <= 25:
        base_multiplier = 2.5  # Больше для молодых
    elif age <= 35:
        base_multiplier = 2.2  # Наш случай - должен дать ~2.2млн для 1млн дохода
    elif age <= 45:
        base_multiplier = 2.0
    elif age <= 55:
        base_multiplier = 1.8
    else:
        base_multiplier = 1.5  # Меньше для старших
    
    # Семейные обстоятельства - более умеренные множители
    family_multiplier = get_family_multiplier_conservative(breadwinner_status, children_count, special_care_relatives)
    
    # Учет доли дохода - более умеренный
    if breadwinner_status == 'main_breadwinner' and income_share > 0:
        share_multiplier = 1.0 + (income_share - 50) / 100  # Добавляем только превышение над 50%
        share_multiplier = max(1.0, min(1.3, share_multiplier))  # Ограничиваем 1.0-1.3
    else:
        share_multiplier = 1.0
    
    # Базовая сумма
    base_sum = average_income * base_multiplier * family_multiplier * share_multiplier
    
    # Добавляем покрытие долгов
    total_recommended = base_sum + unsecured_loans
    
    # Ограничения
    min_sum = 500000   # Минимум 500 тыс
    max_sum = 10000000 # Максимум 10 млн
    
    recommended = max(min_sum, min(max_sum, total_recommended))
    
    # Округляем до 100 тысяч
    return round(recommended / 100000) * 100000

def get_family_multiplier_conservative(breadwinner_status, children_count, special_care_relatives):
    """
    Более консервативный множитель в зависимости от семейных обстоятельств
    """
    multiplier = 1.0
    
    # Статус кормильца - более умеренно
    if breadwinner_status == 'main_breadwinner':
        multiplier += 0.1  # Было 0.5, теперь 0.1
    elif breadwinner_status == 'co_breadwinner':
        multiplier += 0.05  # Было 0.3, теперь 0.05
    
    # Дети - более умеренно
    multiplier += children_count * 0.1  # Было 0.3, теперь 0.1
    
    # Родственники, требующие ухода - более умеренно
    multiplier += special_care_relatives * 0.15  # Было 0.4, теперь 0.15
    
    return min(multiplier, 1.5)  # Максимум в 1.5 раза (было 3.0)

def get_family_multiplier(breadwinner_status, children_count, special_care_relatives):
    """
    Множитель в зависимости от семейных обстоятельств
    """
    multiplier = 1.0
    
    # Статус кормильца
    if breadwinner_status == 'main_breadwinner':
        multiplier += 0.5
    elif breadwinner_status == 'co_breadwinner':
        multiplier += 0.3
    
    # Дети
    multiplier += children_count * 0.3
    
    # Родственники, требующие ухода
    multiplier += special_care_relatives * 0.4
    
    return min(multiplier, 3.0)  # Максимум в 3 раза

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
            include_accident = data.get('accidentPackage') in ['yes', 'Да', True]
        
        # Определяем включение КЗ
        include_critical_illness = data.get('include_critical_illness')
        if include_critical_illness is None:
            include_critical_illness = data.get('criticalPackage') in ['yes', 'Да', True]
            
        # Определяем тип КЗ
        critical_illness_type = data.get('critical_illness_type', 'rf')
        if critical_illness_type == 'rf':
            # Проверяем старый формат
            treatment_region = data.get('treatmentRegion', 'russia')
            if treatment_region in ['abroad', 'За границей']:
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

        api_data = {
            'age': age,
            'gender': gender,
            'sum_insured': sum_insured,
            'term_years': term_years,
            'include_accident': include_accident,
            'include_critical_illness': include_critical_illness,
            'critical_illness_type': critical_illness_type,
            'payment_frequency': payment_frequency
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
            payment_frequency=api_data['payment_frequency']
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
