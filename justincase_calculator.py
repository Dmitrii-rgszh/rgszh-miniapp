# -*- coding: utf-8 -*-
"""
Модуль расчета премий для калькулятора JustInCase
"""

import logging
import sqlite3
from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, Any, Optional
import os

logger = logging.getLogger(__name__)

class JustInCaseCalculator:
    def __init__(self):
        # Принудительно используем SQLite файл miniapp.db
        self.db_path = 'miniapp.db'
        
        # Диагностика базы данных при инициализации
        self._diagnose_database()
        
        logger.info(f"🗄️ JustInCaseCalculator инициализирован с БД: {self.db_path}")
    
    def _diagnose_database(self):
        """Диагностика состояния базы данных"""
        try:
            if not os.path.exists(self.db_path):
                logger.error(f"❌ Файл базы данных не найден: {self.db_path}")
                return
            
            file_size = os.path.getsize(self.db_path) / 1024 / 1024  # MB
            logger.info(f"📊 Размер БД: {file_size:.2f} MB")
            
            conn = self.connect()
            if conn:
                cursor = conn.cursor()
                
                # Проверяем наличие таблиц
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
                tables = cursor.fetchall()
                logger.info(f"📋 Найдено таблиц: {len(tables)}")
                
                # Проверяем количество записей в ключевых таблицах
                for table_name in ['nsj_tariffs', 'nsj_accident_tariffs', 'nsj_critical_tariffs', 'justincase_frequency_coefficients']:
                    try:
                        cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
                        count = cursor.fetchone()[0]
                        logger.info(f"📊 {table_name}: {count} записей")
                    except sqlite3.OperationalError:
                        logger.warning(f"⚠️ Таблица {table_name} не найдена")
                
                conn.close()
            
        except Exception as e:
            logger.error(f"❌ Ошибка диагностики БД: {e}")
    
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
        """Подключение к SQLite базе данных"""
        try:
            conn = sqlite3.connect(self.db_path, check_same_thread=False)
            conn.row_factory = sqlite3.Row  # Для доступа к колонкам по имени
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
            
            # Получаем базовый тариф НСЖ
            cursor.execute("""
                SELECT death_rate, disability_rate
                FROM nsj_tariffs
                WHERE age = ? AND gender = ? AND term_years = ?
            """, (age, gender, term_years))
            
            base_result = cursor.fetchone()
            if not base_result:
                logger.warning(f"Тариф не найден для возраста {age}, пола {gender}, срока {term_years} лет")
                return None
            
            # Получаем тариф НС
            cursor.execute("""
                SELECT death_rate, traffic_death_rate, injury_rate
                FROM nsj_accident_tariffs
                WHERE age = ? AND gender = ? AND term_years = ?
            """, (age, gender, term_years))
            
            accident_result = cursor.fetchone()
            
            # Получаем тарифы КЗ
            cursor.execute("""
                SELECT region, rate
                FROM nsj_critical_tariffs
                WHERE age = ? AND gender = ? AND term_years = ?
            """, (age, gender, term_years))
            
            critical_results = cursor.fetchall()
            
            # Формируем результат
            result = {
                'death_rate': float(base_result[0]),
                'disability_rate': float(base_result[1]),
                'accident_death_rate': float(accident_result[0]) if accident_result else 0.0,
                'traffic_death_rate': float(accident_result[1]) if accident_result else 0.0,
                'injury_rate': float(accident_result[2]) if accident_result else 0.0,
                'critical_illness_rf_fee': 0.0,
                'critical_illness_abroad_fee': 0.0,
                'coefficient_i': 0.08  # Базовый коэффициент
            }
            
            # Добавляем тарифы КЗ
            for critical in critical_results:
                if critical[0] == 'russia':
                    result['critical_illness_rf_fee'] = float(critical[1])
                elif critical[0] == 'abroad':
                    result['critical_illness_abroad_fee'] = float(critical[1])
            
            return result
            
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
                WHERE payment_frequency = ?
            """, (payment_frequency,))
            
            result = cursor.fetchone()
            return float(result[0]) if result else 1.0
            
        except Exception as e:
            logger.error(f"Ошибка получения коэффициента частоты: {e}")
            return 1.0
        finally:
            cursor.close()
            conn.close()
    
    def get_corporate_coefficients(self, email: str) -> Dict[str, float]:
        """
        Получение корпоративных коэффициентов на основе домена email
        
        Returns:
            dict: {
                'base_coefficient': float,     # Для базовых рисков (смерть, инвалидность, НС)
                'critical_coefficient': float  # Для критических заболеваний
            }
        """
        if not email or '@' not in email:
            # Если email не указан или некорректный - применяем максимальную наценку
            return {
                'base_coefficient': 1.30,     # +30% для всех рисков кроме КЗ
                'critical_coefficient': 1.35  # +35% для КЗ
            }
        
        # Извлекаем домен
        domain = email.lower().split('@')[-1]
        
        # Определяем коэффициенты на основе домена
        if domain == 'rgsl.ru':
            # Сотрудники РГСЛ - скидка 5%
            return {
                'base_coefficient': 1.05,     # +5% для всех рисков
                'critical_coefficient': 1.05  # +5% для КЗ
            }
        elif domain == 'vtb.ru':
            # Сотрудники ВТБ - наценка 20%
            return {
                'base_coefficient': 1.20,     # +20% для всех рисков
                'critical_coefficient': 1.20  # +20% для КЗ
            }
        else:
            # Все остальные домены - максимальная наценка
            return {
                'base_coefficient': 1.30,     # +30% для всех рисков кроме КЗ
                'critical_coefficient': 1.35  # +35% для КЗ
            }
    
    def calculate_premium(self, 
                         age: int, 
                         gender: str, 
                         term_years: int, 
                         sum_insured: float,
                         include_accident: bool = True,
                         include_critical_illness: bool = True,
                         critical_illness_type: str = 'rf',
                         payment_frequency: str = 'annual',
                         email: str = None) -> Dict[str, Any]:
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
            email: Email пользователя для определения корпоративных коэффициентов
        
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
            
            # Получаем коэффициент частоты (из БД может прийти как коэффициент одного платежа или как годовой)
            coeff_raw = self.get_frequency_coefficient(payment_frequency)
            # Количество платежей в год
            payments_map = {
                'annual': 1,
                'semi_annual': 2,
                'quarterly': 4,
                'monthly': 12
            }
            payments_per_year = payments_map.get(payment_frequency, 1)
            # Нормализуем коэффициенты: определяем коэффициент одного платежа и годовой коэффициент
            if coeff_raw > 1.0:
                # Пришёл годовой коэффициент (например, 1.02, 1.03, 1.04)
                per_payment_coeff = coeff_raw / payments_per_year
                freq_coeff = coeff_raw
            else:
                # Пришёл коэффициент одного платежа (например, 0.51, 0.2575, 0.0867)
                per_payment_coeff = coeff_raw
                freq_coeff = per_payment_coeff * payments_per_year
            
            # Получаем корпоративные коэффициенты на основе email
            corporate_coeffs = self.get_corporate_coefficients(email)
            logger.info(f"📧 Email: {email}, корпоративные коэффициенты: {corporate_coeffs}")
            
            # Базовая премия по смерти и инвалидности
            death_premium = sum_insured * tariff['death_rate'] * corporate_coeffs['base_coefficient']
            disability_premium = sum_insured * tariff['disability_rate'] * corporate_coeffs['base_coefficient']
            base_premium = death_premium + disability_premium
            
            # Премия по критическим заболеваниям (ФИКСИРОВАННАЯ СУММА)
            critical_premium = 0
            if include_critical_illness:
                if critical_illness_type == 'abroad':
                    critical_premium = tariff['critical_illness_abroad_fee'] * corporate_coeffs['critical_coefficient']
                else:
                    critical_premium = tariff['critical_illness_rf_fee'] * corporate_coeffs['critical_coefficient']
            
            # Премия по несчастному случаю
            accident_premium = 0
            if include_accident:
                # Включаем все риски НС
                total_accident_rate = (tariff['accident_death_rate'] + 
                                     tariff['traffic_death_rate'] + 
                                     tariff['injury_rate'])
                accident_premium = sum_insured * total_accident_rate * corporate_coeffs['base_coefficient']
            
            # Общая премия до учёта частоты (годовая база)
            total_annual_premium = base_premium + critical_premium + accident_premium

            # Применяем коэффициент частоты по-рисково с округлением каждого платежа
            def q2(x: float) -> float:
                return float(Decimal(str(x)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))

            # Базовые компоненты (уже с учетом корпоративных коэффициентов)
            death_premium_base = sum_insured * tariff['death_rate'] * corporate_coeffs['base_coefficient']
            disability_premium_base = sum_insured * tariff['disability_rate'] * corporate_coeffs['base_coefficient']

            # Пер-платёжные суммы по каждому риску
            per_payment = {
                'death': q2(death_premium_base * per_payment_coeff),
                'disability': q2(disability_premium_base * per_payment_coeff),
                'accident': q2(accident_premium * per_payment_coeff),
                'critical': q2(critical_premium * per_payment_coeff)
            }
            per_payment['base'] = q2(per_payment['death'] + per_payment['disability'])
            per_payment['total'] = q2(per_payment['death'] + per_payment['disability'] + per_payment['accident'] + per_payment['critical'])

            # Годовые суммы после учёта частоты (через пер-платёжные суммы)
            premium_by_risk = {
                'death': q2(per_payment['death'] * payments_per_year),
                'disability': q2(per_payment['disability'] * payments_per_year),
                'accident': q2(per_payment['accident'] * payments_per_year),
                'critical': q2(per_payment['critical'] * payments_per_year)
            }
            premium_by_risk['base'] = q2(premium_by_risk['death'] + premium_by_risk['disability'])
            final_premium = q2(premium_by_risk['death'] + premium_by_risk['disability'] + premium_by_risk['accident'] + premium_by_risk['critical'])

            # Округляем базовые (до частоты) компоненты для обратной совместимости полей
            base_premium = q2(base_premium)
            critical_premium = q2(critical_premium)
            accident_premium = q2(accident_premium)
            
            return {
                'success': True,
                # Основные поля - размер одного платежа
                'base_premium': per_payment['base'],
                'critical_illness_premium': per_payment['critical'],
                'accident_premium': per_payment['accident'],
                'final_premium': per_payment['total'],
                # Дополнительная информация
                'payment_frequency': payment_frequency,
                'frequency_coefficient': q2(freq_coeff),
                'critical_illness_type': critical_illness_type,
                'payments_per_year': payments_per_year,
                'per_payment_coefficient': per_payment_coeff,
                # Детальная разбивка по платежам
                'per_payment_breakdown': per_payment,
                # Годовые суммы с учетом коэффициентов
                'annual_breakdown': premium_by_risk,
                'total_annual_premium': final_premium,
                # Базовые годовые суммы (без коэффициентов)
                'base_annual_amounts': {
                    'base_premium': base_premium,
                    'critical_illness_premium': critical_premium,
                    'accident_premium': accident_premium,
                    'total_annual_premium': float(Decimal(str(total_annual_premium)).quantize(
                        Decimal('0.01'), rounding=ROUND_HALF_UP))
                },
                'calculation_details': {
                    'age': age,
                    'gender': gender,
                    'term_years': term_years,
                    'sum_insured': sum_insured,
                    'include_accident': include_accident,
                    'include_critical_illness': include_critical_illness,
                    'critical_illness_type': critical_illness_type,
                    'payments_per_year': payments_per_year,
                    'per_payment_coefficient': per_payment_coeff,
                    'email': email,
                    'corporate_coefficients': corporate_coeffs,
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
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
