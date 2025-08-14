# justincase_calculator_simple.py - Упрощенный калькулятор НСЖ с поддержкой SQLite

import logging
from datetime import datetime, date
from typing import Dict, Any, Optional
from dataclasses import dataclass
from database_adapter import get_database_adapter

logger = logging.getLogger("justincase_calculator")

@dataclass
class JustincaseCalculationInput:
    """Входные данные для расчета НСЖ"""
    age: int
    gender: str  # 'm' or 'f'
    term_years: int
    sum_insured: float
    include_accident: bool = False
    include_critical_illness: bool = False
    critical_illness_type: str = 'rf'  # 'rf' or 'abroad'
    payment_frequency: str = 'annual'  # 'annual', 'semi_annual', 'quarterly', 'monthly'

@dataclass
class JustincaseCalculationResult:
    """Результат расчета НСЖ"""
    success: bool
    calculation_id: str
    
    # Основные параметры
    client_age: int
    client_gender: str
    insurance_term: int
    base_insurance_sum: float
    
    # Основные премии
    base_premium: float
    death_premium: float
    disability_premium: float
    
    # Дополнительные премии
    accident_premium: float = 0
    accident_death_premium: float = 0
    traffic_death_premium: float = 0
    injury_premium: float = 0
    
    critical_premium: float = 0
    
    # Итоговые суммы
    total_premium: float = 0
    
    # Флаги включения пакетов
    accident_package_included: bool = False
    critical_package_included: bool = False
    treatment_region: str = 'rf'
    
    # Метаданные
    calculator: str = 'JustincaseCalculatorSimple'
    version: str = '1.0.0'
    calculation_date: str = None
    
    def __post_init__(self):
        if not self.calculation_date:
            self.calculation_date = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

class JustincaseCalculator:
    """Упрощенный калькулятор НСЖ с поддержкой SQLite"""
    
    def __init__(self):
        self.db_adapter = get_database_adapter()
        
    def calculate(self, input_data: JustincaseCalculationInput) -> JustincaseCalculationResult:
        """Основной метод расчета"""
        
        try:
            logger.info(f"🧮 Начинаем расчет НСЖ для возраста {input_data.age}, пол {input_data.gender}, срок {input_data.term_years}")
            
            # Генерируем ID расчета
            calc_id = f"NSJ_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{input_data.age}_{input_data.gender}"
            
            # Получаем базовые тарифы
            base_tariff = self.db_adapter.get_tariff(
                age=input_data.age,
                gender=input_data.gender,
                term_years=input_data.term_years
            )
            
            if not base_tariff:
                logger.error(f"❌ Базовый тариф не найден для возраста {input_data.age}, пола {input_data.gender}, срока {input_data.term_years}")
                return JustincaseCalculationResult(
                    success=False,
                    calculation_id=calc_id,
                    client_age=input_data.age,
                    client_gender=input_data.gender,
                    insurance_term=input_data.term_years,
                    base_insurance_sum=input_data.sum_insured,
                    base_premium=0,
                    death_premium=0,
                    disability_premium=0
                )
            
            # Рассчитываем базовые премии
            death_premium = self._calculate_premium(
                input_data.sum_insured, 
                base_tariff['death_rate'],
                input_data.payment_frequency
            )
            
            disability_premium = self._calculate_premium(
                input_data.sum_insured, 
                base_tariff['disability_rate'],
                input_data.payment_frequency
            )
            
            base_premium = death_premium + disability_premium
            
            logger.info(f"💰 Базовые премии: смерть={death_premium:.2f}, инвалидность={disability_premium:.2f}")
            
            # Инициализируем результат
            result = JustincaseCalculationResult(
                success=True,
                calculation_id=calc_id,
                client_age=input_data.age,
                client_gender="Мужской" if input_data.gender == 'm' else "Женский",
                insurance_term=input_data.term_years,
                base_insurance_sum=input_data.sum_insured,
                base_premium=base_premium,
                death_premium=death_premium,
                disability_premium=disability_premium,
                total_premium=base_premium
            )
            
            # Рассчитываем пакет НС если включен
            if input_data.include_accident:
                accident_result = self._calculate_accident_package(input_data)
                if accident_result:
                    result.accident_package_included = True
                    result.accident_premium = accident_result['total_premium']
                    result.accident_death_premium = accident_result['death_premium']
                    result.traffic_death_premium = accident_result['traffic_premium']
                    result.injury_premium = accident_result['injury_premium']
                    result.total_premium += accident_result['total_premium']
                    
                    logger.info(f"🚨 Премия НС: {accident_result['total_premium']:.2f}")
            
            # Рассчитываем пакет КЗ если включен
            if input_data.include_critical_illness:
                critical_result = self._calculate_critical_package(input_data)
                if critical_result:
                    result.critical_package_included = True
                    result.critical_premium = critical_result['premium']
                    result.treatment_region = input_data.critical_illness_type
                    result.total_premium += critical_result['premium']
                    
                    logger.info(f"🏥 Премия КЗ: {critical_result['premium']:.2f}")
            
            logger.info(f"✅ Расчет завершен. Итоговая премия: {result.total_premium:.2f}")
            
            return result
            
        except Exception as e:
            logger.error(f"❌ Ошибка при расчете НСЖ: {e}")
            return JustincaseCalculationResult(
                success=False,
                calculation_id=f"ERROR_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                client_age=input_data.age,
                client_gender=input_data.gender,
                insurance_term=input_data.term_years,
                base_insurance_sum=input_data.sum_insured,
                base_premium=0,
                death_premium=0,
                disability_premium=0
            )
    
    def _calculate_premium(self, sum_insured: float, rate: float, frequency: str = 'annual') -> float:
        """Расчет премии по тарифу"""
        
        # Базовая премия (тариф в промилле на 1000 руб)
        base_premium = (sum_insured / 1000) * rate
        
        # Корректировка на частоту платежей
        frequency_multipliers = {
            'annual': 1.0,
            'semi_annual': 1.02,  # +2% за полугодовую оплату
            'quarterly': 1.03,    # +3% за квартальную оплату
            'monthly': 1.05       # +5% за месячную оплату
        }
        
        multiplier = frequency_multipliers.get(frequency, 1.0)
        return base_premium * multiplier
    
    def _calculate_accident_package(self, input_data: JustincaseCalculationInput) -> Optional[Dict[str, float]]:
        """Расчет пакета НС"""
        
        try:
            accident_tariff = self.db_adapter.get_accident_tariff(
                age=input_data.age,
                gender=input_data.gender,
                term_years=input_data.term_years
            )
            
            if not accident_tariff:
                logger.warning(f"⚠️ Тариф НС не найден для возраста {input_data.age}")
                return None
            
            # Рассчитываем премии по видам риска НС
            death_premium = self._calculate_premium(
                input_data.sum_insured,
                accident_tariff['death_rate'],
                input_data.payment_frequency
            )
            
            traffic_premium = self._calculate_premium(
                input_data.sum_insured,
                accident_tariff['traffic_death_rate'],
                input_data.payment_frequency
            )
            
            injury_premium = self._calculate_premium(
                input_data.sum_insured,
                accident_tariff['injury_rate'],
                input_data.payment_frequency
            )
            
            total_premium = death_premium + traffic_premium + injury_premium
            
            return {
                'death_premium': death_premium,
                'traffic_premium': traffic_premium,
                'injury_premium': injury_premium,
                'total_premium': total_premium
            }
            
        except Exception as e:
            logger.error(f"❌ Ошибка расчета пакета НС: {e}")
            return None
    
    def _calculate_critical_package(self, input_data: JustincaseCalculationInput) -> Optional[Dict[str, float]]:
        """Расчет пакета КЗ"""
        
        try:
            # Для КЗ используем фиксированную сумму 60 млн руб
            critical_sum = 60_000_000
            
            region = 'russia' if input_data.critical_illness_type == 'rf' else 'abroad'
            
            critical_tariff = self.db_adapter.get_critical_tariff(
                age=input_data.age,
                gender=input_data.gender,
                term_years=input_data.term_years,
                region=region
            )
            
            if not critical_tariff:
                logger.warning(f"⚠️ Тариф КЗ не найден для возраста {input_data.age}, регион {region}")
                return None
            
            # Рассчитываем премию КЗ
            premium = self._calculate_premium(
                critical_sum,
                critical_tariff['rate'],
                input_data.payment_frequency
            )
            
            return {
                'premium': premium,
                'insurance_sum': critical_sum,
                'region': region
            }
            
        except Exception as e:
            logger.error(f"❌ Ошибка расчета пакета КЗ: {e}")
            return None

def quick_test():
    """Быстрый тест калькулятора"""
    
    print("🧪 Тестирование упрощенного калькулятора НСЖ")
    print("=" * 60)
    
    try:
        calculator = JustincaseCalculator()
        
        # Тестовые данные
        test_input = JustincaseCalculationInput(
            age=35,
            gender='m',
            term_years=15,
            sum_insured=5_000_000,
            include_accident=True,
            include_critical_illness=True,
            critical_illness_type='rf',
            payment_frequency='annual'
        )
        
        print(f"📋 Тестовые данные:")
        print(f"   Возраст: {test_input.age}")
        print(f"   Пол: {test_input.gender}")
        print(f"   Срок: {test_input.term_years}")
        print(f"   Сумма: {test_input.sum_insured:,.0f}")
        print(f"   НС: {test_input.include_accident}")
        print(f"   КЗ: {test_input.include_critical_illness}")
        
        # Выполняем расчет
        result = calculator.calculate(test_input)
        
        if result.success:
            print(f"\n✅ Расчет успешен!")
            print(f"📊 Результаты:")
            print(f"   ID расчета: {result.calculation_id}")
            print(f"   Базовая премия: {result.base_premium:,.2f} руб.")
            print(f"   Премия НС: {result.accident_premium:,.2f} руб.")
            print(f"   Премия КЗ: {result.critical_premium:,.2f} руб.")
            print(f"   ИТОГО: {result.total_premium:,.2f} руб.")
        else:
            print(f"\n❌ Расчет не удался")
        
        return result.success
        
    except Exception as e:
        print(f"❌ Ошибка тестирования: {e}")
        return False

if __name__ == "__main__":
    quick_test()
