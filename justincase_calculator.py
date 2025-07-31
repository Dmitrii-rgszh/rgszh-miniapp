# justincase_calculator.py
# МОДУЛЬНАЯ версия калькулятора "На всякий случай" с правильными коэффициентами

import logging
from datetime import datetime, date
from typing import Dict, Any, List, Tuple

# Импортируем наши модули
from frequency_coefficients import (
    get_frequency_coefficient, 
    calculate_frequency_premium,
    get_frequency_info
)
from tariffs import (
    calculate_accident_premium,
    calculate_critical_illness_premium,
    validate_insurance_sum,
    validate_insurance_term,
    validate_age,
    get_all_tariffs_info
)
from actuarial_tables import (
    get_life_tariff,
    calculate_life_premium,
    calculate_disability_premium
)

logger = logging.getLogger(__name__)

class JustincaseCalculatorComplete:
    """
    МОДУЛЬНЫЙ калькулятор "На всякий случай" с правильными коэффициентами периодичности
    Использует отдельные модули для коэффициентов, тарифов и актуарных таблиц
    """
    
    def __init__(self):
        logger.info("🚀 Инициализация МОДУЛЬНОГО калькулятора 'На всякий случай'")
        
        # Версия калькулятора
        self.version = "v3.0 MODULAR ARCHITECTURE + FIXED COEFFICIENTS"
        self.name = "JustInCase Calculator MODULAR"
        
        # Константы для страховых сумм
        self.MIN_INSURANCE_SUM = 1_000_000
        self.MAX_INSURANCE_SUM = 100_000_000
        
    def get_calculator_info(self) -> Dict[str, Any]:
        """Информация о калькуляторе"""
        return {
            'name': self.name,
            'version': self.version,
            'description': 'Модульный калькулятор программы "На всякий случай" с правильными коэффициентами из Excel',
            'architecture': 'modular',
            'modules': {
                'frequency_coefficients': 'Коэффициенты периодичности платежей',
                'tariffs': 'Тарифы НС, КЗ и валидация',
                'actuarial_tables': 'Актуарные таблицы СБСЖ'
            },
            'features': {
                'corrected_frequency_coefficients': True,
                'sbszh_actuarial_tables': True,
                'accident_insurance': True,
                'critical_illness': True,
                'sport_coefficient': True,
                'modular_design': True,
                'recommended_sum_calculation': True
            },
            'limits': {
                'min_sum': self.MIN_INSURANCE_SUM,
                'max_sum': self.MAX_INSURANCE_SUM,
                'min_age': 18,
                'max_age': 80,
                'min_term': 1,
                'max_term': 30
            },
            'frequency_info': get_frequency_info(),
            'tariffs_info': get_all_tariffs_info()
        }
    
    def calculate_age(self, birth_date_str: str) -> int:
        """Расчет возраста"""
        try:
            birth_date = datetime.strptime(birth_date_str, '%Y-%m-%d').date()
            today = date.today()
            age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
            return age
        except Exception as e:
            logger.error(f"Ошибка расчета возраста: {e}")
            return 30
    
    def calculate_recommended_sum(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Расчет рекомендованной страховой суммы на основе алгоритма из Excel
        """
        try:
            logger.info("💰 === РАСЧЕТ РЕКОМЕНДОВАННОЙ СТРАХОВОЙ СУММЫ ===")
            
            # Коэффициенты из Excel
            COEFFICIENTS = {
                'breadwinner': {
                    'yes': 3.0,  # Единственный кормилец
                    'not_breadwinner': 1.0,  # Не является кормильцем
                    'no': {  # Не единственный кормилец - по доле дохода
                        'до 10%': 1.0,
                        '10-24%': 1.4,
                        '25-49%': 1.8,
                        '50-74%': 2.2,
                        '75-89%': 2.6,
                        'Более 90%': 3.0
                    }
                },
                'children': {
                    '0': 1.0,
                    '1': 1.25,
                    '2': 1.40625,
                    '3 и более': 1.5234375
                },
                'relatives_care': {
                    'yes': 1.3,
                    'no': 1.0
                },
                'max_sum_by_age': {  # Коэффициенты к среднегодовому доходу
                    'до 34': 10,
                    '35-44': 8,
                    '45-49': 7,
                    '50-54': 6,
                    '55-59': 5,
                    '60 и старше': 3
                }
            }
            
            # Константы
            MIN_SUM = self.MIN_INSURANCE_SUM
            ROUND_TO = 100_000
            
            # 1. Проверяем, есть ли работа
            has_job = data.get('hasJob', 'no')
            if has_job == 'no':
                logger.info(f"   Нет работы -> рекомендованная сумма: {MIN_SUM:,}")
                return MIN_SUM
            
            # 2. Расчет среднегодового дохода
            try:
                income_2022 = int(str(data.get('income2022', '0')).replace('.', '').replace(' ', ''))
                income_2023 = int(str(data.get('income2023', '0')).replace('.', '').replace(' ', ''))
                income_2024 = int(str(data.get('income2024', '0')).replace('.', '').replace(' ', ''))
                
                # Для работающих студентов стипендия участвует в расчете среднего
                if has_job == 'student':
                    scholarship = int(str(data.get('scholarship', '0')).replace('.', '').replace(' ', ''))
                    avg_income = (income_2022 + income_2023 + income_2024 + scholarship) / 4
                    logger.info(f"   Расчет для студента: ({income_2022} + {income_2023} + {income_2024} + {scholarship}) / 4 = {avg_income:,.0f}")
                else:
                    avg_income = (income_2022 + income_2023 + income_2024) / 3
                    logger.info(f"   Расчет для работающего: ({income_2022} + {income_2023} + {income_2024}) / 3 = {avg_income:,.0f}")
                
                logger.info(f"   Среднегодовой доход: {avg_income:,.0f} руб.")
                
            except Exception as e:
                logger.error(f"   Ошибка расчета дохода: {e}")
                return MIN_SUM
            
            # 3. Определяем коэффициенты
            # Коэффициент кормильца
            breadwinner_status = data.get('breadwinnerStatus', 'no')
            if breadwinner_status == 'yes':
                breadwinner_coeff = COEFFICIENTS['breadwinner']['yes']
            elif breadwinner_status == 'not_breadwinner':
                breadwinner_coeff = COEFFICIENTS['breadwinner']['not_breadwinner']
            else:  # 'no' - не единственный кормилец
                income_share = data.get('incomeShare', '25-49%')
                breadwinner_coeff = COEFFICIENTS['breadwinner']['no'].get(income_share, 1.8)
            
            logger.info(f"   Коэффициент кормильца: {breadwinner_coeff}")
            
            # Коэффициент количества детей
            children_count = data.get('childrenCount', '0')
            children_coeff = COEFFICIENTS['children'].get(children_count, 1.0)
            logger.info(f"   Коэффициент детей ({children_count}): {children_coeff}")
            
            # Коэффициент родственников
            special_care = data.get('specialCareRelatives', 'no')
            relatives_coeff = COEFFICIENTS['relatives_care'].get(special_care, 1.0)
            logger.info(f"   Коэффициент родственников: {relatives_coeff}")
            
            # 4. Получаем незащищенные кредиты
            unsecured_loans = int(str(data.get('unsecuredLoans', '0')).replace('.', '').replace(' ', ''))
            logger.info(f"   Незащищенные кредиты: {unsecured_loans:,} руб.")
            
            # 5. Рассчитываем страховую сумму
            calculated_sum = avg_income * breadwinner_coeff * children_coeff * relatives_coeff + unsecured_loans
            logger.info(f"   Рассчитанная сумма: {calculated_sum:,.0f} руб.")
            logger.info(f"   Детали расчета: {avg_income:,.0f} × {breadwinner_coeff} × {children_coeff} × {relatives_coeff} + {unsecured_loans} = {calculated_sum:,.0f}")
            
            # 6. Определяем максимальную сумму по возрасту
            age = self.calculate_age(data.get('birthDate'))
            
            # Определяем возрастную группу
            if age <= 34:
                age_group = 'до 34'
            elif age <= 44:
                age_group = '35-44'
            elif age <= 49:
                age_group = '45-49'
            elif age <= 54:
                age_group = '50-54'
            elif age <= 59:
                age_group = '55-59'
            else:
                age_group = '60 и старше'
            
            age_coeff = COEFFICIENTS['max_sum_by_age'][age_group]
            max_sum = avg_income * age_coeff
            logger.info(f"   Максимальная сумма для возраста {age} ({age_group}): {max_sum:,.0f} руб.")
            
            # 7. Берем минимум из рассчитанной и максимальной
            recommended_sum = min(calculated_sum, max_sum)
            logger.info(f"   Рекомендованная сумма (до округления): {recommended_sum:,.0f} руб.")
            
            # 8. Округляем до 100 000
            rounded_sum = round(recommended_sum / ROUND_TO) * ROUND_TO
            
            # Минимальная сумма страхования
            if rounded_sum < MIN_SUM:
                rounded_sum = MIN_SUM
            
            logger.info(f"   ✅ ИТОГОВАЯ рекомендованная сумма: {rounded_sum:,} руб.")
            
            return rounded_sum
            
        except Exception as e:
            logger.error(f"❌ Ошибка расчета рекомендованной суммы: {e}")
            return self.MIN_INSURANCE_SUM  # Возвращаем минимальную сумму при ошибке
    
    def validate_input_data(self, data: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """Валидация входных данных"""
        errors = []
        
        try:
            # Возраст
            age = self.calculate_age(data['birthDate'])
            is_valid, error = validate_age(age)
            if not is_valid:
                errors.append(error)
            
            # Страховая сумма и срок (если страхование выбрано)
            if data.get('insuranceInfo') == 'yes':
                # Страховая сумма
                sum_str = str(data.get('insuranceSum', '')).replace(' ', '').replace(',', '')
                try:
                    insurance_sum = int(sum_str)
                    is_valid, error = validate_insurance_sum(insurance_sum)
                    if not is_valid:
                        errors.append(error)
                except ValueError:
                    errors.append("Некорректная страховая сумма")
                
                # Срок страхования
                try:
                    term = int(data.get('insuranceTerm', 1))
                    is_valid, error = validate_insurance_term(term)
                    if not is_valid:
                        errors.append(error)
                except ValueError:
                    errors.append("Некорректный срок страхования")
            
            return len(errors) == 0, errors
            
        except Exception as e:
            logger.error(f"Ошибка валидации: {e}")
            return False, ["Ошибка валидации данных"]
    
    def calculate_base_premium(self, age: int, gender: str, term: int, insurance_sum: int, frequency: str) -> Dict[str, Any]:
        """Расчет базовой премии (страхование жизни + инвалидность) через модули"""
        try:
            # 1. Расчет премии страхования жизни через модуль актуарных таблиц
            life_result = calculate_life_premium(age, gender, term, insurance_sum)
            life_premium = life_result['life_premium']
            
            # 2. Расчет премии инвалидности через модуль актуарных таблиц
            disability_result = calculate_disability_premium(life_premium)
            disability_premium = disability_result['disability_premium']
            
            # 3. Общая базовая премия до применения коэффициента частоты
            base_premium_annual = life_premium + disability_premium
            
            # 4. Применение коэффициента частоты через модуль коэффициентов
            frequency_result = calculate_frequency_premium(base_premium_annual, frequency)
            total_base_premium = frequency_result['total_premium']
            freq_coeff = frequency_result['coefficient']
            
            logger.info(f"💰 МОДУЛЬНАЯ базовая премия:")
            logger.info(f"   Возраст: {age}, пол: {gender}, срок: {term} лет")
            logger.info(f"   Тариф жизни: {life_result['life_tariff']}")
            logger.info(f"   Премия жизни: {life_premium:.2f} руб")
            logger.info(f"   Премия инвалидности: {disability_premium:.2f} руб")
            logger.info(f"   Годовая база: {base_premium_annual:.2f} руб")
            logger.info(f"   Коэфф. частоты ({frequency}): {freq_coeff}")
            logger.info(f"   ИТОГО базовая: {total_base_premium:.2f} руб")
            
            return {
                'life_premium': round(life_premium, 2),
                'disability_premium': round(disability_premium, 2),
                'base_premium': round(total_base_premium, 2),
                'frequency_coefficient': freq_coeff,
                'life_tariff': life_result['life_tariff'],
                'annual_before_frequency': round(base_premium_annual, 2),
                'frequency_details': frequency_result
            }
            
        except Exception as e:
            logger.error(f"Ошибка расчета базовой премии: {e}")
            raise
    
    def calculate_accident_premium_wrapper(self, insurance_sum: int, frequency: str, sport_included: bool = False) -> Dict[str, Any]:
        """Обертка для расчета премии НС через модуль тарифов"""
        try:
            freq_coeff = get_frequency_coefficient(frequency)
            
            # Используем функцию из модуля тарифов
            result = calculate_accident_premium(insurance_sum, freq_coeff, sport_included)
            
            logger.info(f"💥 МОДУЛЬНАЯ премия НС:")
            logger.info(f"   Смерть от НС: {result['accident_death']:.2f} руб")
            logger.info(f"   Смерть от ДТП: {result['accident_transport']:.2f} руб") 
            logger.info(f"   Травма: {result['accident_trauma']:.2f} руб")
            logger.info(f"   Коэфф. частоты: {freq_coeff}")
            if sport_included:
                logger.info(f"   Спорт коэфф: {result['sport_coefficient']} (+{result['sport_markup']}%)")
            logger.info(f"   ИТОГО НС: {result['total_accident_premium']:.2f} руб")
            
            return result
            
        except Exception as e:
            logger.error(f"Ошибка расчета премии НС: {e}")
            raise
    
    def calculate_critical_illness_premium_wrapper(self, treatment_region: str, frequency: str) -> Dict[str, Any]:
        """Обертка для расчета премии КЗ через модуль тарифов"""
        try:
            freq_coeff = get_frequency_coefficient(frequency)
            
            # Используем функцию из модуля тарифов
            result = calculate_critical_illness_premium(treatment_region, freq_coeff)
            
            logger.info(f"🏥 МОДУЛЬНАЯ премия КЗ:")
            logger.info(f"   Регион: {treatment_region}")
            logger.info(f"   Базовый тариф: {result['base_tariff']:.2f} руб")
            logger.info(f"   Коэфф. частоты: {freq_coeff}")
            logger.info(f"   ИТОГО КЗ: {result['critical_premium']:.2f} руб")
            
            return result
            
        except Exception as e:
            logger.error(f"Ошибка расчета премии КЗ: {e}")
            raise
    
    def calculate_full_program(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Основной метод расчета с использованием МОДУЛЬНОЙ архитектуры"""
        try:
            logger.info("🚀 МОДУЛЬНЫЙ расчет с правильными коэффициентами через отдельные модули")
            
            # 1. Базовые параметры
            age = self.calculate_age(data['birthDate'])
            gender = data['gender']
            frequency = data.get('insuranceFrequency', 'Ежегодно')
            
            # 2. Проверяем страхование
            if data.get('insuranceInfo') != 'yes':
                return {
                    'success': False,
                    'error': 'Страхование не выбрано',
                    'calculator_version': self.version
                }
            
            # 3. Получаем параметры страхования
            insurance_sum = int(str(data['insuranceSum']).replace(' ', '').replace(',', ''))
            insurance_term = int(data['insuranceTerm'])
            
            # 4. Базовая премия через модуль
            base_result = self.calculate_base_premium(age, gender, insurance_term, insurance_sum, frequency)
            
            # 5. Премия НС через модуль (если выбрана)
            accident_result = {'total_accident_premium': 0}
            if data.get('accidentPackage', False):
                sport_included = data.get('sportPackage', False)
                accident_result = self.calculate_accident_premium_wrapper(insurance_sum, frequency, sport_included)
            
            # 6. Премия КЗ через модуль (если выбрана)
            critical_result = {'critical_premium': 0}
            if data.get('criticalPackage', False):
                treatment_region = data.get('treatmentRegion', 'russia')
                critical_result = self.calculate_critical_illness_premium_wrapper(treatment_region, frequency)
            
            # 7. Общая годовая премия
            annual_premium = (
                base_result['base_premium'] + 
                accident_result['total_accident_premium'] + 
                critical_result['critical_premium']
            )
            
            logger.info(f"🎯 ФИНАЛЬНЫЙ МОДУЛЬНЫЙ РЕЗУЛЬТАТ:")
            logger.info(f"   Базовая: {base_result['base_premium']:,.2f} руб")
            logger.info(f"   НС: {accident_result['total_accident_premium']:,.2f} руб")
            logger.info(f"   КЗ: {critical_result['critical_premium']:,.2f} руб")
            logger.info(f"   ИТОГО: {annual_premium:,.2f} руб")
            logger.info(f"   Коэффициент частоты ({frequency}): {base_result['frequency_coefficient']}")
            
            # 8. Формируем результат
            result = {
                'success': True,
                'calculator_version': self.version,
                'architecture': 'modular',
                'frequency_coefficient': base_result['frequency_coefficient'],
                
                # Основные результаты
                'basePremium': base_result['base_premium'],
                'accidentPremium': accident_result['total_accident_premium'],
                'criticalPremium': critical_result['critical_premium'],
                'annualPremium': round(annual_premium, 2),
                
                # Детали базовой премии
                'lifePremium': base_result['life_premium'],
                'disabilityPremium': base_result['disability_premium'],
                'lifeTariff': base_result['life_tariff'],
                
                # Детали НС
                'accidentDetails': accident_result if data.get('accidentPackage', False) else None,
                
                # Детали КЗ
                'criticalDetails': critical_result if data.get('criticalPackage', False) else None,
                
                # Детали модульного расчета
                'moduleDetails': {
                    'frequency_details': base_result.get('frequency_details'),
                    'base_before_frequency': base_result['annual_before_frequency']
                },
                
                # Входные параметры
                'inputParameters': {
                    'age': age,
                    'gender': gender,
                    'insuranceSum': insurance_sum,
                    'insuranceTerm': insurance_term,
                    'frequency': frequency,
                    'accidentPackage': data.get('accidentPackage', False),
                    'criticalPackage': data.get('criticalPackage', False),
                    'sportPackage': data.get('sportPackage', False),
                    'treatmentRegion': data.get('treatmentRegion', 'russia')
                }
            }
            
            return result
            
        except Exception as e:
            logger.error(f"❌ Критическая ошибка модульного расчета: {e}")
            return {
                'success': False,
                'error': str(e),
                'calculator_version': self.version
            }

# Для тестирования модульной архитектуры
if __name__ == "__main__":
    print("🔍 === ТЕСТ МОДУЛЬНОГО КАЛЬКУЛЯТОРА ===")
    
    # Создаем калькулятор
    calculator = JustincaseCalculatorComplete()
    
    # Показываем информацию о калькуляторе
    info = calculator.get_calculator_info()
    print(f"\n📋 Информация о калькуляторе:")
    print(f"   Название: {info['name']}")
    print(f"   Версия: {info['version']}")
    print(f"   Архитектура: {info['architecture']}")
    
    print(f"\n🧩 Модули:")
    for module, description in info['modules'].items():
        print(f"   {module}: {description}")
    
    # Тест функции рекомендованной суммы
    print(f"\n💰 Тест расчета рекомендованной суммы:")
    test_recommended_data = {
        'birthDate': '1978-01-01',
        'hasJob': 'yes',
        'income2022': '1500000',
        'income2023': '1500000',
        'income2024': '2000000',
        'breadwinnerStatus': 'no',
        'incomeShare': '25-49%',
        'childrenCount': '3 и более',
        'specialCareRelatives': 'yes',
        'unsecuredLoans': '0'
    }
    
    recommended_sum = calculator.calculate_recommended_sum(test_recommended_data)
    print(f"   Рекомендованная сумма: {recommended_sum:,} руб.")
    
    # Тестовые данные для полного расчета
    test_data = {
        'birthDate': '1990-01-01',
        'gender': 'male',
        'insuranceInfo': 'yes',
        'insuranceTerm': '10',
        'insuranceSum': '2000000',
        'insuranceFrequency': 'Ежемесячно',
        'accidentPackage': True,
        'criticalPackage': True,
        'treatmentRegion': 'abroad',
        'sportPackage': False
    }
    
    # Тестируем расчет
    print(f"\n🧮 Тест модульного расчета:")
    result = calculator.calculate_full_program(test_data)
    
    if result['success']:
        print(f"   ✅ Расчет успешен")
        print(f"   Базовая премия: {result['basePremium']:,.2f} руб")
        print(f"   НС премия: {result['accidentPremium']:,.2f} руб")
        print(f"   КЗ премия: {result['criticalPremium']:,.2f} руб")
        print(f"   ИТОГО: {result['annualPremium']:,.2f} руб")
        print(f"   Коэффициент частоты: {result['frequency_coefficient']}")
    else:
        print(f"   ❌ Ошибка: {result['error']}")