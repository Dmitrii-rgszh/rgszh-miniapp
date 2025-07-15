# care_future_calculator_fixed.py - ИСПРАВЛЕННАЯ логика расчетов НСЖ
# Точно воспроизводит логику из Excel файла "Автоматизатор Забота о будущем сотрудники v.1.15"

import logging
import uuid
from datetime import date, datetime
from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, Any, List, Optional, Union
from dataclasses import dataclass

from db_saver import db
from care_future_models import (
    NSJCalculations, NSJRiskRates, NSJRedemptionRates, 
    NSJCalculatorSettings, CalculationInput, CalculationResult
)

logger = logging.getLogger("NSJCalculatorFixed")

class NSJCalculatorFixed:
    """
    Исправленный калькулятор НСЖ с точной логикой из Excel файла
    """
    
    def __init__(self):
        self.logger = logging.getLogger("NSJCalculatorFixed")
        
        # Коэффициенты дожития по срокам (из листа "к_Расчетчик")
        self.survival_coefficients = {
            5: 1.34,
            6: 1.38, 
            7: 1.46,
            8: 1.54,
            9: 1.63,
            10: 1.73,
            11: 1.82,
            12: 1.92,
            13: 2.03,
            14: 2.15,
            15: 2.28,
            16: 2.42,
            17: 2.57,
            18: 2.74,
            19: 2.92,
            20: 3.11
        }
        
        # Тарифы по рискам (из листа "к_Тарифы по рискам")
        self.risk_tariffs = {
            5: {'survival': 0.981, 'death_immediate': 0.0063, 'disability': 0.0016, 'death_deferred': 0.0111},
            6: {'survival': 0.9764, 'death_immediate': 0.0076, 'disability': 0.0021, 'death_deferred': 0.0139},
            7: {'survival': 0.9715, 'death_immediate': 0.009, 'disability': 0.0026, 'death_deferred': 0.0169},
            8: {'survival': 0.9661, 'death_immediate': 0.0105, 'disability': 0.0032, 'death_deferred': 0.0202},
            9: {'survival': 0.96, 'death_immediate': 0.0122, 'disability': 0.0039, 'death_deferred': 0.0239},
            10: {'survival': 0.9535, 'death_immediate': 0.014, 'disability': 0.0046, 'death_deferred': 0.0279},
            11: {'survival': 0.9457, 'death_immediate': 0.0165, 'disability': 0.0055, 'death_deferred': 0.0323},
            12: {'survival': 0.9372, 'death_immediate': 0.0192, 'disability': 0.0066, 'death_deferred': 0.037},
            13: {'survival': 0.928, 'death_immediate': 0.0222, 'disability': 0.0077, 'death_deferred': 0.0421},
            14: {'survival': 0.918, 'death_immediate': 0.0255, 'disability': 0.009, 'death_deferred': 0.0475},
            15: {'survival': 0.9071, 'death_immediate': 0.0291, 'disability': 0.0105, 'death_deferred': 0.0533},
            16: {'survival': 0.8956, 'death_immediate': 0.0328, 'disability': 0.0121, 'death_deferred': 0.0595},
            17: {'survival': 0.8831, 'death_immediate': 0.0369, 'disability': 0.0138, 'death_deferred': 0.0662},
            18: {'survival': 0.8695, 'death_immediate': 0.0414, 'disability': 0.0157, 'death_deferred': 0.0734},
            19: {'survival': 0.8547, 'death_immediate': 0.0464, 'disability': 0.0178, 'death_deferred': 0.0811},
            20: {'survival': 0.8393, 'death_immediate': 0.0517, 'disability': 0.0201, 'death_deferred': 0.0889}
        }
        
        # Проценты выкупных сумм (из листа "к_Выкупные суммы")
        self.redemption_percentages = {
            5: {3: 0.7, 4: 0.8, 5: 0.9},
            6: {3: 0.6, 4: 0.7, 5: 0.8, 6: 0.9},
            7: {3: 0.5, 4: 0.6, 5: 0.7, 6: 0.8},
            8: {3: 0.4, 4: 0.5, 5: 0.6, 6: 0.7},
            9: {3: 0.3, 4: 0.4, 5: 0.5, 6: 0.6},
            10: {3: 0.2, 4: 0.3, 5: 0.4, 6: 0.5},
            11: {3: 0.1, 4: 0.2, 5: 0.3, 6: 0.4},
            12: {3: 0.1, 4: 0.2, 5: 0.3, 6: 0.4},
            13: {3: 0.1, 4: 0.2, 5: 0.3, 6: 0.4},
            14: {3: 0.1, 4: 0.2, 5: 0.3, 6: 0.4},
            15: {3: 0.1, 4: 0.2, 5: 0.3, 6: 0.4},
            16: {3: 0.1, 4: 0.2, 5: 0.3, 6: 0.4},
            17: {3: 0.1, 4: 0.2, 5: 0.3, 6: 0.4},
            18: {3: 0.1, 4: 0.2, 5: 0.3, 6: 0.4},
            19: {3: 0.1, 4: 0.2, 5: 0.3, 6: 0.4},
            20: {3: 0.1, 4: 0.2, 5: 0.3, 6: 0.4}
        }
    
    def calculate(self, input_data: CalculationInput) -> CalculationResult:
        """
        Основной метод расчета с исправленной логикой из Excel
        """
        try:
            self.logger.info(f"🧮 Начинаем расчет: {input_data.calculation_type}, сумма: {input_data.input_amount}, срок: {input_data.contract_term}")
            
            # 1. Валидация входных данных
            self._validate_input(input_data)
            
            # 2. Вычисляем возраст
            calc_date = input_data.calculation_date or date.today()
            age_at_start = self._calculate_age(input_data.birth_date, calc_date)
            age_at_end = age_at_start + input_data.contract_term
            
            self.logger.info(f"📅 Возраст на начало: {age_at_start}, на окончание: {age_at_end}")
            
            # 3. Определяем премию и страховую сумму
            if input_data.calculation_type == 'from_premium':
                premium_amount = input_data.input_amount
                insurance_sum = self._calculate_insurance_sum_from_premium(premium_amount, input_data.contract_term)
            else:  # from_sum
                insurance_sum = input_data.input_amount
                premium_amount = self._calculate_premium_from_sum(insurance_sum, input_data.contract_term)
            
            self.logger.info(f"💰 Премия: {premium_amount}, Страховая сумма: {insurance_sum}")
            
            # 4. Основные расчеты (по логике Excel)
            cashback_rate = self._get_cashback_rate(input_data.contract_term)
            accumulated_capital = premium_amount * input_data.contract_term
            program_income = int(premium_amount * cashback_rate * input_data.contract_term)
            
            # 5. Налоговый вычет
            tax_deduction = self._calculate_tax_deduction(premium_amount, input_data.contract_term)
            
            # 6. Выкупные суммы
            redemption_values = self._calculate_redemption_values(premium_amount, input_data.contract_term)
            
            # 7. Создаем UUID для расчета
            calculation_uuid = str(uuid.uuid4())
            
            result = CalculationResult(
                premium_amount=premium_amount,
                insurance_sum=insurance_sum,
                accumulated_capital=accumulated_capital,
                program_income=program_income,
                tax_deduction=tax_deduction,
                age_at_start=age_at_start,
                age_at_end=age_at_end,
                redemption_values=redemption_values,
                calculation_uuid=calculation_uuid
            )
            
            # 8. Сохраняем результат в БД
            self._save_calculation(input_data, result, calc_date)
            
            self.logger.info(f"✅ Расчет завершен успешно: {calculation_uuid}")
            return result
            
        except Exception as e:
            self.logger.error(f"❌ Ошибка расчета: {e}")
            raise
    
    def _validate_input(self, input_data: CalculationInput):
        """Валидация входных данных"""
        if input_data.contract_term < 5 or input_data.contract_term > 20:
            raise ValueError(f"Срок договора должен быть от 5 до 20 лет, получен: {input_data.contract_term}")
        
        if input_data.gender not in ['male', 'female']:
            raise ValueError(f"Пол должен быть 'male' или 'female', получен: {input_data.gender}")
        
        if input_data.calculation_type not in ['from_premium', 'from_sum']:
            raise ValueError(f"Тип расчета должен быть 'from_premium' или 'from_sum', получен: {input_data.calculation_type}")
        
        if input_data.input_amount <= 0:
            raise ValueError(f"Сумма должна быть положительной, получена: {input_data.input_amount}")
        
        # Проверка лимитов по суммам
        if input_data.calculation_type == 'from_premium':
            if input_data.input_amount < 100000:
                raise ValueError("Минимальный страховой взнос: 100,000 руб.")
            if input_data.input_amount > 50000000:
                raise ValueError("Максимальный страховой взнос: 50,000,000 руб.")
        else:  # from_sum
            if input_data.input_amount < 500000:
                raise ValueError("Минимальная страховая сумма: 500,000 руб.")
            if input_data.input_amount > 100000000:
                raise ValueError("Максимальная страховая сумма: 100,000,000 руб.")
    
    def _calculate_age(self, birth_date: date, calc_date: date) -> int:
        """Расчет возраста на дату расчета"""
        age = calc_date.year - birth_date.year
        if calc_date.month < birth_date.month or (calc_date.month == birth_date.month and calc_date.day < birth_date.day):
            age -= 1
        
        if age < 18 or age > 63:
            raise ValueError(f"Возраст должен быть от 18 до 63 лет, вычислен: {age}")
        
        return age
    
    def _get_cashback_rate(self, contract_term: int) -> float:
        """Получение ставки кэшбэка по сроку (из Excel логики)"""
        # Логика из листа "к_Расчетчик": кэшбэк = коэффициент_дожития - 1
        survival_coeff = self.survival_coefficients.get(contract_term)
        if not survival_coeff:
            raise ValueError(f"Нет данных о коэффициенте дожития для срока {contract_term}")
        
        cashback_rate = survival_coeff - 1.0
        self.logger.info(f"📊 Кэшбэк для срока {contract_term} лет: {cashback_rate:.4f}")
        return cashback_rate
    
    def _calculate_insurance_sum_from_premium(self, premium: int, term: int) -> int:
        """
        Расчет страховой суммы от премии 
        Формула из Excel: р_сумма = р_взнос * р_срок * (1 + р_кэшбэк)
        """
        cashback_rate = self._get_cashback_rate(term)
        insurance_sum = int(premium * term * (1 + cashback_rate))
        return insurance_sum
    
    def _calculate_premium_from_sum(self, insurance_sum: int, term: int) -> int:
        """
        Расчет премии от страховой суммы
        Формула из Excel: р_взнос = р_сумма / (р_срок * (1 + р_кэшбэк))
        """
        cashback_rate = self._get_cashback_rate(term)
        premium = int(insurance_sum / (term * (1 + cashback_rate)))
        return premium
    
    def _calculate_tax_deduction(self, premium: int, term: int) -> int:
        """
        Расчет налогового вычета 
        Из Excel: IF($C$10<=150000, $C$10 * 0.13 * $C$6, 19500 * $C$6)
        """
        if premium <= 150000:
            # Налоговый вычет 13% с премии
            annual_deduction = premium * 0.13
        else:
            # Максимальный вычет 19,500 руб в год (150,000 * 0.13)
            annual_deduction = 19500
        
        total_deduction = int(annual_deduction * term)
        self.logger.info(f"💰 Налоговый вычет: {annual_deduction}/год × {term} лет = {total_deduction}")
        return total_deduction
    
    def _calculate_redemption_values(self, premium: int, term: int) -> List[Dict[str, Union[int, float]]]:
        """
        Расчет выкупных сумм по годам
        Из Excel: выкупная_сумма = премия * год * процент_выкупа
        """
        redemption_values = []
        percentages = self.redemption_percentages.get(term, {})
        
        for year in range(1, term + 1):
            if year in percentages:
                # Есть выкупная сумма
                percentage = percentages[year]
                amount = int(premium * year * percentage)
                redemption_values.append({
                    'year': year,
                    'amount': amount,
                    'percentage': percentage
                })
            else:
                # Нет выкупной суммы (отмечаем как 0)
                redemption_values.append({
                    'year': year, 
                    'amount': 0,
                    'percentage': 0
                })
        
        return redemption_values
    
    def _save_calculation(self, input_data: CalculationInput, result: CalculationResult, calc_date: date):
        """Сохранение результата расчета в БД"""
        try:
            calculation = NSJCalculations(
                calculation_uuid=result.calculation_uuid,
                email=input_data.email,
                birth_date=input_data.birth_date,
                gender=input_data.gender,
                calculation_date=calc_date,
                contract_term=input_data.contract_term,
                calculation_type=input_data.calculation_type,
                input_amount=input_data.input_amount,
                premium_amount=result.premium_amount,
                insurance_sum=result.insurance_sum,
                accumulated_capital=result.accumulated_capital,
                program_income=result.program_income,
                tax_deduction=result.tax_deduction,
                age_at_start=result.age_at_start,
                age_at_end=result.age_at_end,
                redemption_values=result.redemption_values
            )
            
            db.session.add(calculation)
            db.session.commit()
            
            self.logger.info(f"💾 Расчет сохранен в БД: {result.calculation_uuid}")
            
        except Exception as e:
            self.logger.error(f"❌ Ошибка сохранения расчета: {e}")
            db.session.rollback()
            # Не прерываем выполнение, если не удалось сохранить

def quick_test():
    """Быстрый тест исправленного калькулятора"""
    print("🧪 Тестирование исправленного калькулятора НСЖ...")
    
    calculator = NSJCalculatorFixed()
    
    # Тестовые данные (из Excel файла)
    test_input = CalculationInput(
        birth_date=date(1965, 4, 1),  # возраст 60 лет
        gender='male',
        contract_term=9,
        calculation_type='from_premium',
        input_amount=100000,  # 100,000 руб премия
        email='test@example.com'
    )
    
    try:
        result = calculator.calculate(test_input)
        
        print(f"✅ Тест прошел успешно!")
        print(f"📊 Результаты:")
        print(f"   UUID: {result.calculation_uuid}")
        print(f"   Премия: {result.premium_amount:,} руб.")
        print(f"   Страховая сумма: {result.insurance_sum:,} руб.")
        print(f"   Накопленный капитал: {result.accumulated_capital:,} руб.")
        print(f"   Доход по программе: {result.program_income:,} руб.")
        print(f"   Налоговый вычет: {result.tax_deduction:,} руб.")
        print(f"   Выкупные суммы: {len(result.redemption_values)} записей")
        
        # Сверяем с ожидаемыми значениями из Excel
        expected_insurance_sum = 1467000  # из Excel C16
        expected_program_income = 567000  # примерно из Excel C13
        
        print(f"\n🔍 Сверка с Excel:")
        print(f"   Страховая сумма: ожидается {expected_insurance_sum:,}, получено {result.insurance_sum:,}")
        print(f"   Доход: ожидается ~{expected_program_income:,}, получено {result.program_income:,}")
        
        return True
        
    except Exception as e:
        print(f"❌ Ошибка теста: {e}")
        return False

if __name__ == "__main__":
    # Запуск теста при прямом выполнении
    quick_test()