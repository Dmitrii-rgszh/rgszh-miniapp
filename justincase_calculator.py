# justincase_calculator.py
# Простая версия калькулятора "На всякий случай" для интеграции с существующим сервером

import logging
from datetime import datetime, date
from typing import Dict, Any

logger = logging.getLogger(__name__)

class JustincaseCalculator:
    """Простой калькулятор для программы "На всякий случай"""
    
    def __init__(self):
        # Основные константы (из Excel файла)
        self.MIN_INSURANCE_SUM = 1000000
        self.MAX_INSURANCE_TERM = 30
        self.MIN_AGE = 18
        self.MAX_AGE = 70
        
        # Упрощенные тарифы
        self.BASE_RATE = 0.0027  # Базовый тариф смертности
        self.DISABILITY_RATE = 0.0005  # Тариф инвалидности
        self.ACCIDENT_RATE = 0.0011  # Тариф НС
        self.CRITICAL_RATE = 6200  # Фиксированная премия за критические заболевания
        
        # Коэффициенты
        self.SPORT_LOADING = 0.10  # Доплата за спорт
        self.LOAD_FACTOR = 0.85   # Учет нагрузки и комиссии
    
    def calculate_age(self, birth_date: str) -> int:
        """Расчет возраста"""
        try:
            birth = datetime.strptime(birth_date, '%Y-%m-%d').date()
            today = date.today()
            age = today.year - birth.year
            if today.month < birth.month or (today.month == birth.month and today.day < birth.day):
                age -= 1
            return age
        except:
            return 0
    
    def calculate_recommended_sum(self, data: Dict[str, Any]) -> int:
        """Расчет рекомендуемой суммы страхования"""
        # Средний доход за 3 года
        incomes = [
            data.get('income2021', 0) or 0,
            data.get('income2022', 0) or 0,
            data.get('income2023', 0) or 0
        ]
        avg_income = sum(incomes) / 3 if any(incomes) else 2000000  # Средняя зарплата
        
        # Базовая сумма = 5-7 годовых доходов
        multiplier = 6
        
        # Корректировки
        if data.get('breadwinnerStatus') == 'yes':
            multiplier += 1
        
        children_count = int(data.get('childrenCount', 0))
        multiplier += children_count * 0.5
        
        if data.get('specialCareRelatives') == 'yes':
            multiplier += 1
        
        recommended_sum = int(avg_income * multiplier)
        return max(recommended_sum, self.MIN_INSURANCE_SUM)
    
    def calculate_program(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Основной расчет программы"""
        try:
            # Возраст
            age = self.calculate_age(data['birthDate'])
            if age < self.MIN_AGE or age > self.MAX_AGE:
                raise ValueError(f"Возраст должен быть от {self.MIN_AGE} до {self.MAX_AGE} лет")
            
            # Определяем страховую сумму и срок
            if data['insuranceInfo'] == 'yes':
                insurance_sum = data['insuranceSum']
                insurance_term = data['insuranceTerm']
            else:
                insurance_sum = self.calculate_recommended_sum(data)
                insurance_term = 5  # Стандартный срок
            
            # Базовая премия
            age_factor = 1 + (age - 30) * 0.02  # Увеличение с возрастом
            gender_factor = 0.9 if data['gender'] == 'female' else 1.0  # Женщины дешевле
            
            # Смерть
            death_premium = insurance_sum * self.BASE_RATE * age_factor * gender_factor / self.LOAD_FACTOR
            
            # Инвалидность (только до 65 лет)
            disability_premium = 0
            if age <= 64:
                disability_premium = insurance_sum * self.DISABILITY_RATE * age_factor * gender_factor / self.LOAD_FACTOR
            
            total_premium = death_premium + disability_premium
            
            # Дополнительные пакеты
            accident_premium = 0
            if data.get('accidentPackage'):
                sport_factor = 1 + self.SPORT_LOADING if data.get('sportPackage') else 1
                accident_premium = insurance_sum * self.ACCIDENT_RATE * sport_factor / self.LOAD_FACTOR
                total_premium += accident_premium
            
            critical_premium = 0
            if data.get('criticalPackage'):
                critical_premium = self.CRITICAL_RATE
                total_premium += critical_premium
            
            # Результат
            result = {
                'calculationDate': datetime.now().strftime('%d.%m.%Y'),
                'clientAge': age,
                'clientGender': 'Мужской' if data['gender'] == 'male' else 'Женский',
                'insuranceTerm': insurance_term,
                'insuranceSum': insurance_sum,
                'baseInsuranceSum': f"{insurance_sum:,}".replace(",", "."),
                'endAge': age + insurance_term,
                
                # Премии
                'deathPremium': round(death_premium, 2),
                'disabilityPremium': round(disability_premium, 2),
                'accidentPremium': round(accident_premium, 2),
                'criticalPremium': round(critical_premium, 2),
                'totalPremium': f"{round(total_premium, 2):,}".replace(",", "."),
                'annualPremium': round(total_premium, 2),
                
                # Пакеты
                'accidentPackageIncluded': data.get('accidentPackage', False),
                'criticalPackageIncluded': data.get('criticalPackage', False),
                'sportPackageIncluded': data.get('sportPackage', False),
                
                # Дополнительно
                'paymentFrequency': data.get('insuranceFrequency', 'Ежегодно'),
                'calculationType': 'known_sum' if data['insuranceInfo'] == 'yes' else 'calculated_sum',
                'recommendedSum': insurance_sum if data['insuranceInfo'] == 'no' else None
            }
            
            return result
            
        except Exception as e:
            logger.error(f"Ошибка расчета: {e}")
            raise
    
    def validate_data(self, data: Dict[str, Any]) -> bool:
        """Простая валидация данных"""
        required = ['birthDate', 'gender', 'insuranceInfo']
        
        for field in required:
            if field not in data or not data[field]:
                return False
        
        if data['insuranceInfo'] == 'yes':
            if not data.get('insuranceSum') or data['insuranceSum'] < self.MIN_INSURANCE_SUM:
                return False
        
        return True