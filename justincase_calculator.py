# -*- coding: utf-8 -*-
"""
Модуль расчета премий для калькулятора JustInCase
"""

import logging
import psycopg2
from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, Any, Optional
import os

logger = logging.getLogger(__name__)

class JustInCaseCalculator:
    def __init__(self):
        self.db_config = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'port': int(os.getenv('DB_PORT', 5432)),
            'database': os.getenv('DB_NAME', 'miniapp'),
            'user': os.getenv('DB_USER', 'postgres'),
            'password': os.getenv('DB_PASSWORD', 'secret')
        }
    
    def validate_input_data(self, data: Dict[str, Any]) -> tuple[bool, Dict[str, str]]:
        """Валидация входных данных"""
        errors = {}
        
        # Проверяем обязательные поля
        required_fields = ['age', 'gender', 'term_years', 'sum_insured']
        for field in required_fields:
            if field not in data or data[field] is None:
                errors[field] = f"Поле {field} обязательно для заполнения"
        
        # Валидация возраста
        if 'age' in data:
            try:
                age = int(data['age'])
                if age < 18 or age > 65:
                    errors['age'] = "Возраст должен быть от 18 до 65 лет"
            except (ValueError, TypeError):
                errors['age'] = "Возраст должен быть числом"
        
        # Валидация пола
        if 'gender' in data:
            gender = data['gender']
            if gender not in ['m', 'f', 'Мужской', 'Женский']:
                errors['gender'] = "Пол должен быть 'm', 'f', 'Мужской' или 'Женский'"
        
        # Валидация срока страхования
        if 'term_years' in data:
            try:
                term = int(data['term_years'])
                if term < 1 or term > 30:
                    errors['term_years'] = "Срок страхования должен быть от 1 до 30 лет"
            except (ValueError, TypeError):
                errors['term_years'] = "Срок страхования должен быть числом"
        
        # Валидация страховой суммы
        if 'sum_insured' in data:
            try:
                sum_insured = int(data['sum_insured'])
                if sum_insured < 100000:
                    errors['sum_insured'] = "Страховая сумма должна быть не менее 100,000 руб."
            except (ValueError, TypeError):
                errors['sum_insured'] = "Страховая сумма должна быть числом"
        
        return len(errors) == 0, errors
    
    def connect(self):
        """Подключение к базе данных"""
        try:
            conn = psycopg2.connect(**self.db_config)
            return conn
        except Exception as e:
            logger.error(f"Ошибка подключения к БД: {e}")
            return None
    
    def get_base_tariff(self, age: int, gender: str, term_years: int) -> Optional[Dict]:
        """Получение базового тарифа"""
        conn = self.connect()
        if not conn:
            return None
            
        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT death_rate, disability_rate, accident_death_rate, 
                       traffic_death_rate, injury_rate, critical_illness_rf_fee, 
                       critical_illness_abroad_fee, coefficient_i
                FROM justincase_base_tariffs
                WHERE age = %s AND gender = %s AND term_years = %s
            """, (age, gender, term_years))
            
            result = cursor.fetchone()
            if result:
                return {
                    'death_rate': float(result[0]),
                    'disability_rate': float(result[1]),
                    'accident_death_rate': float(result[2]) if result[2] else 0.0,
                    'traffic_death_rate': float(result[3]) if result[3] else 0.0,
                    'injury_rate': float(result[4]) if result[4] else 0.0,
                    'critical_illness_rf_fee': float(result[5]) if result[5] else 0.0,
                    'critical_illness_abroad_fee': float(result[6]) if result[6] else 0.0,
                    'coefficient_i': float(result[7]) if result[7] else 0.0
                }
            return None
            
        except Exception as e:
            logger.error(f"Ошибка получения тарифа: {e}")
            return None
        finally:
            cursor.close()
            conn.close()
    
    def get_frequency_coefficient(self, payment_frequency: str) -> float:
        """Получение коэффициента частоты выплат"""
        conn = self.connect()
        if not conn:
            return 1.0
            
        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT coefficient 
                FROM justincase_frequency_coefficients
                WHERE payment_frequency = %s
            """, (payment_frequency,))
            
            result = cursor.fetchone()
            return float(result[0]) if result else 1.0
            
        except Exception as e:
            logger.error(f"Ошибка получения коэффициента частоты: {e}")
            return 1.0
        finally:
            cursor.close()
            conn.close()
    
    def calculate_premium(self, 
                         age: int, 
                         gender: str, 
                         term_years: int, 
                         sum_insured: float,
                         include_accident: bool = True,
                         include_critical_illness: bool = True,
                         critical_illness_type: str = 'rf',
                         payment_frequency: str = 'annual') -> Dict[str, Any]:
        """
        Основной расчет премии
        
        Args:
            age: Возраст застрахованного
            gender: Пол (m/f)
            term_years: Срок страхования в годах
            sum_insured: Страховая сумма
            include_accident: Включить покрытие несчастного случая
            include_critical_illness: Включить покрытие критических заболеваний
            critical_illness_type: Тип КЗ ('rf' - РФ, 'abroad' - зарубеж)
            payment_frequency: Частота выплат (annual, semi_annual, quarterly, monthly)
        
        Returns:
            Словарь с результатами расчета
        """
        
        try:
            # Получаем базовый тариф
            tariff = self.get_base_tariff(age, gender, term_years)
            if not tariff:
                return {
                    'success': False,
                    'error': f'Тариф не найден для возраста {age}, пола {gender}, срока {term_years} лет'
                }
            
            # Получаем коэффициент частоты
            freq_coeff = self.get_frequency_coefficient(payment_frequency)
            
            # Базовая премия по смерти и инвалидности
            death_premium = sum_insured * tariff['death_rate']
            disability_premium = sum_insured * tariff['disability_rate']
            base_premium = death_premium + disability_premium
            
            # Премия по критическим заболеваниям (ФИКСИРОВАННАЯ СУММА)
            critical_premium = 0
            if include_critical_illness:
                if critical_illness_type == 'abroad':
                    critical_premium = tariff['critical_illness_abroad_fee']
                else:
                    critical_premium = tariff['critical_illness_rf_fee']
            
            # Премия по несчастному случаю
            accident_premium = 0
            if include_accident:
                # Включаем все риски НС
                total_accident_rate = (tariff['accident_death_rate'] + 
                                     tariff['traffic_death_rate'] + 
                                     tariff['injury_rate'])
                accident_premium = sum_insured * total_accident_rate
            
            # Общая премия
            total_annual_premium = base_premium + critical_premium + accident_premium
            
            # Применяем коэффициент частоты выплат
            final_premium = total_annual_premium * freq_coeff
            
            # Округляем до 2 знаков
            final_premium = float(Decimal(str(final_premium)).quantize(
                Decimal('0.01'), rounding=ROUND_HALF_UP))
            base_premium = float(Decimal(str(base_premium)).quantize(
                Decimal('0.01'), rounding=ROUND_HALF_UP))
            critical_premium = float(Decimal(str(critical_premium)).quantize(
                Decimal('0.01'), rounding=ROUND_HALF_UP))
            accident_premium = float(Decimal(str(accident_premium)).quantize(
                Decimal('0.01'), rounding=ROUND_HALF_UP))
            
            return {
                'success': True,
                'base_premium': base_premium,
                'critical_illness_premium': critical_premium,
                'accident_premium': accident_premium,
                'total_annual_premium': float(Decimal(str(total_annual_premium)).quantize(
                    Decimal('0.01'), rounding=ROUND_HALF_UP)),
                'payment_frequency': payment_frequency,
                'frequency_coefficient': freq_coeff,
                'final_premium': final_premium,
                'critical_illness_type': critical_illness_type,
                'calculation_details': {
                    'age': age,
                    'gender': gender,
                    'term_years': term_years,
                    'sum_insured': sum_insured,
                    'include_accident': include_accident,
                    'include_critical_illness': include_critical_illness,
                    'critical_illness_type': critical_illness_type,
                    'tariff_rates': {
                        'death_rate': tariff['death_rate'],
                        'disability_rate': tariff['disability_rate'],
                        'accident_death_rate': tariff['accident_death_rate'],
                        'traffic_death_rate': tariff['traffic_death_rate'],
                        'injury_rate': tariff['injury_rate']
                    },
                    'critical_illness_fees': {
                        'rf_fee': tariff['critical_illness_rf_fee'],
                        'abroad_fee': tariff['critical_illness_abroad_fee']
                    }
                }
            }
            
        except Exception as e:
            logger.error(f"Ошибка расчета премии: {e}")
            return {
                'success': False,
                'error': f'Ошибка расчета: {str(e)}'
            }
    
    def save_calculation(self, calculation_data: Dict[str, Any], calculation_id: str) -> bool:
        """Сохранение расчета в базе данных"""
        conn = self.connect()
        if not conn:
            return False
            
        try:
            cursor = conn.cursor()
            
            details = calculation_data['calculation_details']
            
            cursor.execute("""
                INSERT INTO justincase_calculations 
                (calculation_id, age, gender, term_years, sum_insured,
                 include_accident, include_critical_illness, critical_illness_type, payment_frequency,
                 base_premium, accident_premium, critical_premium, total_premium)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (calculation_id) 
                DO UPDATE SET 
                    age = EXCLUDED.age,
                    gender = EXCLUDED.gender,
                    term_years = EXCLUDED.term_years,
                    sum_insured = EXCLUDED.sum_insured,
                    include_accident = EXCLUDED.include_accident,
                    include_critical_illness = EXCLUDED.include_critical_illness,
                    critical_illness_type = EXCLUDED.critical_illness_type,
                    payment_frequency = EXCLUDED.payment_frequency,
                    base_premium = EXCLUDED.base_premium,
                    accident_premium = EXCLUDED.accident_premium,
                    critical_premium = EXCLUDED.critical_premium,
                    total_premium = EXCLUDED.total_premium,
                    created_at = CURRENT_TIMESTAMP;
            """, (
                calculation_id,
                details['age'],
                details['gender'],
                details['term_years'],
                details['sum_insured'],
                details['include_accident'],
                details['include_critical_illness'],
                details['critical_illness_type'],
                calculation_data['payment_frequency'],
                calculation_data['base_premium'],
                calculation_data['accident_premium'],
                calculation_data['critical_illness_premium'],
                calculation_data['final_premium']
            ))
            
            conn.commit()
            return True
            
        except Exception as e:
            logger.error(f"Ошибка сохранения расчета: {e}")
            conn.rollback()
            return False
        finally:
            cursor.close()
            conn.close()
    
    def get_available_terms(self, age: int, gender: str) -> list:
        """Получение доступных сроков страхования для данного возраста и пола"""
        conn = self.connect()
        if not conn:
            return []
            
        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT DISTINCT term_years 
                FROM justincase_base_tariffs
                WHERE age = ? AND gender = ?
                ORDER BY term_years
            """, (age, gender))
            
            return [row[0] for row in cursor.fetchall()]
            
        except Exception as e:
            logger.error(f"Ошибка получения доступных сроков: {e}")
            return []
        finally:
            cursor.close()
            conn.close()
    
    def get_age_range(self) -> Dict[str, int]:
        """Получение доступного диапазона возрастов"""
        conn = self.connect()
        if not conn:
            return {'min': 18, 'max': 70}
            
        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT MIN(age), MAX(age) 
                FROM justincase_base_tariffs
            """)
            
            result = cursor.fetchone()
            return {
                'min': result[0] if result[0] else 18,
                'max': result[1] if result[1] else 70
            }
            
        except Exception as e:
            logger.error(f"Ошибка получения диапазона возрастов: {e}")
            return {'min': 18, 'max': 70}
        finally:
            cursor.close()
            conn.close()

# Функция для использования в API
def calculate_justincase_premium(age: int, gender: str, term_years: int, 
                               sum_insured: float, include_accident: bool = True,
                               include_critical_illness: bool = True,
                               critical_illness_type: str = 'rf',
                               payment_frequency: str = 'annual',
                               calculation_id: str = None) -> Dict[str, Any]:
    """
    Основная функция расчета премии для использования в API
    """
    calculator = JustInCaseCalculator()
    
    # Валидация входных данных
    age_range = calculator.get_age_range()
    if age < age_range['min'] or age > age_range['max']:
        return {
            'success': False,
            'error': f'Возраст должен быть от {age_range["min"]} до {age_range["max"]} лет'
        }
    
    if gender not in ['m', 'f']:
        return {
            'success': False,
            'error': 'Пол должен быть m (мужской) или f (женский)'
        }
    
    if sum_insured <= 0:
        return {
            'success': False,
            'error': 'Страховая сумма должна быть больше 0'
        }
    
    if critical_illness_type not in ['rf', 'abroad']:
        return {
            'success': False,
            'error': 'Тип критических заболеваний должен быть rf (РФ) или abroad (зарубеж)'
        }
    
    # Проверяем доступные сроки
    available_terms = calculator.get_available_terms(age, gender)
    if term_years not in available_terms:
        return {
            'success': False,
            'error': f'Для возраста {age} и пола {gender} доступные сроки: {available_terms}'
        }
    
    # Выполняем расчет
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
    
    # Сохраняем расчет если указан ID
    if result['success'] and calculation_id:
        calculator.save_calculation(result, calculation_id)
    
    return result


def calculate_premium(age: int, gender: str, sum_insured: int, term_years: int, 
                     critical_illness_type: str = 'rf', include_accident: bool = True, 
                     include_critical_illness: bool = True, payment_frequency: str = 'annual'):
    """
    Простая функция-обёртка для расчёта премии
    
    Args:
        age: Возраст
        gender: Пол ('m' или 'f')
        sum_insured: Страховая сумма (минимум 1,000,000)
        term_years: Срок страхования (лет)
        critical_illness_type: Тип критических заболеваний ('rf' или 'abroad')
        include_accident: Включить НС
        include_critical_illness: Включить критические заболевания
        payment_frequency: Частота платежей
    
    Returns:
        dict: Результат расчёта
    """
    calculator = JustInCaseCalculator()
    return calculator.calculate_premium(
        age=age,
        gender=gender, 
        term_years=term_years,
        sum_insured=sum_insured,
        include_accident=include_accident,
        include_critical_illness=include_critical_illness,
        critical_illness_type=critical_illness_type,
        payment_frequency=payment_frequency
    )


# Алиас для обратной совместимости
JustincaseCalculatorComplete = JustInCaseCalculator
