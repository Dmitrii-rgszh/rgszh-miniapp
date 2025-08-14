# justincase_routes.py - Роуты для калькулятора НСЖ

from flask import Blueprint, request, jsonify
import logging
from typing import Dict, Any
from justincase_calculator_simple import JustincaseCalculator, JustincaseCalculationInput

logger = logging.getLogger("justincase_routes")

# Создаем Blueprint для роутов НСЖ
justincase_bp = Blueprint('justincase', __name__, url_prefix='/api/justincase')

@justincase_bp.route('/calculate', methods=['POST'])
def calculate_justincase():
    """Расчет страховой премии НСЖ"""
    
    try:
        # Получаем данные из запроса
        data = request.get_json()
        
        if not data:
            logger.error("❌ Не получены данные для расчета")
            return jsonify({
                'success': False,
                'error': 'Не получены данные для расчета'
            }), 400
        
        logger.info(f"📥 Получены данные для расчета НСЖ: {data}")
        
        # Проверяем обязательные поля
        required_fields = ['age', 'gender', 'term', 'sum']
        for field in required_fields:
            if field not in data:
                logger.error(f"❌ Отсутствует обязательное поле: {field}")
                return jsonify({
                    'success': False,
                    'error': f'Отсутствует обязательное поле: {field}'
                }), 400
        
        # Подготавливаем входные данные
        input_data = JustincaseCalculationInput(
            age=int(data['age']),
            gender=str(data['gender']).lower(),
            term_years=int(data['term']),
            sum_insured=float(data['sum']),
            include_accident=bool(data.get('includeAccident', False)),
            include_critical_illness=bool(data.get('includeCritical', False)),
            critical_illness_type=str(data.get('criticalType', 'rf')),
            payment_frequency=str(data.get('paymentFrequency', 'annual'))
        )
        
        # Выполняем расчет
        calculator = JustincaseCalculator()
        result = calculator.calculate(input_data)
        
        if result.success:
            # Формируем ответ
            response_data = {
                'success': True,
                'calculation_id': result.calculation_id,
                'client_age': result.client_age,
                'client_gender': result.client_gender,
                'insurance_term': result.insurance_term,
                'base_insurance_sum': result.base_insurance_sum,
                
                # Основные премии
                'base_premium': round(result.base_premium, 2),
                'death_premium': round(result.death_premium, 2),
                'disability_premium': round(result.disability_premium, 2),
                
                # Дополнительные пакеты
                'accident_premium': round(result.accident_premium, 2),
                'accident_death_premium': round(result.accident_death_premium, 2),
                'traffic_death_premium': round(result.traffic_death_premium, 2),
                'injury_premium': round(result.injury_premium, 2),
                
                'critical_premium': round(result.critical_premium, 2),
                
                # Итоговая сумма
                'total_premium': round(result.total_premium, 2),
                
                # Флаги пакетов
                'accident_package_included': result.accident_package_included,
                'critical_package_included': result.critical_package_included,
                'treatment_region': result.treatment_region,
                
                # Метаданные
                'calculator': result.calculator,
                'version': result.version,
                'calculation_date': result.calculation_date
            }
            
            logger.info(f"✅ Расчет НСЖ успешен. Итоговая премия: {result.total_premium:.2f}")
            return jsonify(response_data)
        
        else:
            logger.error("❌ Расчет НСЖ не удался")
            return jsonify({
                'success': False,
                'error': 'Не удалось выполнить расчет. Проверьте входные данные.'
            }), 400
    
    except ValueError as e:
        logger.error(f"❌ Ошибка валидации данных: {e}")
        return jsonify({
            'success': False,
            'error': f'Ошибка в данных: {str(e)}'
        }), 400
    
    except Exception as e:
        logger.error(f"❌ Неожиданная ошибка при расчете НСЖ: {e}")
        return jsonify({
            'success': False,
            'error': 'Внутренняя ошибка сервера'
        }), 500

@justincase_bp.route('/health', methods=['GET'])
def health_check():
    """Проверка работоспособности калькулятора НСЖ"""
    
    try:
        # Пробуем создать калькулятор
        calculator = JustincaseCalculator()
        
        # Проверяем доступность базы данных
        test_tariff = calculator.db_adapter.get_tariff(age=30, gender='m', term_years=10)
        
        if test_tariff:
            return jsonify({
                'status': 'ok',
                'calculator': 'JustincaseCalculatorSimple',
                'database': 'connected',
                'message': 'Калькулятор НСЖ готов к работе'
            })
        else:
            return jsonify({
                'status': 'warning',
                'calculator': 'JustincaseCalculatorSimple',
                'database': 'empty',
                'message': 'База данных пуста, возможны проблемы с расчетами'
            }), 503
    
    except Exception as e:
        logger.error(f"❌ Ошибка проверки здоровья: {e}")
        return jsonify({
            'status': 'error',
            'message': f'Ошибка калькулятора: {str(e)}'
        }), 503

@justincase_bp.route('/test', methods=['GET'])
def test_calculation():
    """Тестовый расчет для проверки"""
    
    try:
        # Тестовые данные
        test_data = JustincaseCalculationInput(
            age=35,
            gender='m',
            term_years=15,
            sum_insured=5_000_000,
            include_accident=True,
            include_critical_illness=True,
            critical_illness_type='rf',
            payment_frequency='annual'
        )
        
        # Выполняем тестовый расчет
        calculator = JustincaseCalculator()
        result = calculator.calculate(test_data)
        
        if result.success:
            return jsonify({
                'test_status': 'passed',
                'calculation_id': result.calculation_id,
                'total_premium': round(result.total_premium, 2),
                'details': {
                    'base_premium': round(result.base_premium, 2),
                    'accident_premium': round(result.accident_premium, 2),
                    'critical_premium': round(result.critical_premium, 2)
                }
            })
        else:
            return jsonify({
                'test_status': 'failed',
                'error': 'Тестовый расчет не удался'
            }), 500
    
    except Exception as e:
        logger.error(f"❌ Ошибка тестового расчета: {e}")
        return jsonify({
            'test_status': 'error',
            'error': str(e)
        }), 500

# Экспорт Blueprint для использования в основном приложении
__all__ = ['justincase_bp']
