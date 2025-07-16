# justincase_calculator.py
# ИСПРАВЛЕННАЯ версия калькулятора "На всякий случай" с правильными тарифами из Excel

import logging
from datetime import datetime, date
from typing import Dict, Any

logger = logging.getLogger(__name__)

class JustincaseCalculator:
    """Калькулятор для программы "На всякий случай" с правильными тарифами из Excel"""
    
    def __init__(self):
        # Основные константы
        self.MIN_INSURANCE_SUM = 1000000
        self.MAX_INSURANCE_TERM = 30
        self.MIN_AGE = 18
        self.MAX_AGE = 70
        
        # ПРАВИЛЬНЫЕ тарифы из Excel (из листа "Настройки")
        self.ACCIDENT_DEATH_RATE = 0.0009684  # NTr смерть от НС (M4)
        self.ACCIDENT_TRANSPORT_RATE = 0.0002424  # NTr смерть от ДТП (M5)  
        self.ACCIDENT_TRAUMA_RATE = 0.001584  # NTr травма от НС (M6)
        
        # Тарифы критических заболеваний (из Q16, Q17)
        self.CRITICAL_RUSSIA_BASE = 8840  # Базовый тариф для России
        self.CRITICAL_ABROAD_BASE = 51390  # Базовый тариф за рубежом
        
        # Коэффициенты нагрузки (из листа "Расчет")
        self.COMMISSION_RATE = 0.30  # D27 - комиссия 30%
        self.LOAD_RATE = 0.05  # D29 - нагрузка 5%
        self.SPORT_LOADING = 0.10  # Доплата за спорт 10%
        self.GUARANTEED_RATE = 0.08  # Гарантированная доходность 8%
        
        # Базовые тарифы смертности и инвалидности (из Excel таблиц)
        self.MORTALITY_RATES = {
            'male': {
                25: 0.0015, 30: 0.0018, 35: 0.0025, 40: 0.0035, 45: 0.0050,
                50: 0.0070, 55: 0.0100, 60: 0.0145, 65: 0.0210, 70: 0.0300
            },
            'female': {
                25: 0.0008, 30: 0.0012, 35: 0.0017, 40: 0.0024, 45: 0.0034,
                50: 0.0048, 55: 0.0070, 60: 0.0100, 65: 0.0145, 70: 0.0210
            }
        }
        
        self.DISABILITY_RATES = {
            'male': {
                25: 0.0003, 30: 0.0004, 35: 0.0005, 40: 0.0007, 45: 0.0010,
                50: 0.0014, 55: 0.0020, 60: 0.0029, 65: 0.0042
            },
            'female': {
                25: 0.0002, 30: 0.0003, 35: 0.0004, 40: 0.0005, 45: 0.0007,
                50: 0.0010, 55: 0.0014, 60: 0.0020, 65: 0.0029
            }
        }
    
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
    
    def get_mortality_rate(self, age: int, gender: str) -> float:
        """Получение коэффициента смертности с интерполяцией"""
        rates = self.MORTALITY_RATES[gender]
        ages = sorted(rates.keys())
        
        if age <= ages[0]:
            return rates[ages[0]]
        if age >= ages[-1]:
            return rates[ages[-1]]
        
        # Интерполяция
        for i in range(len(ages) - 1):
            if ages[i] <= age <= ages[i + 1]:
                rate1 = rates[ages[i]]
                rate2 = rates[ages[i + 1]]
                factor = (age - ages[i]) / (ages[i + 1] - ages[i])
                return rate1 + (rate2 - rate1) * factor
        
        return 0.002
    
    def get_disability_rate(self, age: int, gender: str) -> float:
        """Получение коэффициента инвалидности с интерполяцией"""
        if age > 64:  # Инвалидность только до 65 лет
            return 0.0
            
        rates = self.DISABILITY_RATES[gender]
        ages = sorted(rates.keys())
        
        if age <= ages[0]:
            return rates[ages[0]]
        if age >= ages[-1]:
            return rates[ages[-1]]
        
        # Интерполяция
        for i in range(len(ages) - 1):
            if ages[i] <= age <= ages[i + 1]:
                rate1 = rates[ages[i]]
                rate2 = rates[ages[i + 1]]
                factor = (age - ages[i]) / (ages[i + 1] - ages[i])
                return rate1 + (rate2 - rate1) * factor
        
        return 0.0005
    
    def calculate_base_premium(self, insurance_sum: int, age: int, gender: str, term: int) -> dict:
        """Расчет базовой премии с правильными формулами из Excel"""
        
        # Получаем базовые тарифы
        mortality_rate = self.get_mortality_rate(age, gender)
        disability_rate = self.get_disability_rate(age, gender)
        
        # Коэффициент загрузки (1 - комиссия - нагрузка)
        load_factor = 1 - self.COMMISSION_RATE - self.LOAD_RATE  # = 0.65
        
        # Расчет аннуитетного коэффициента для срока
        discount_rate = self.GUARANTEED_RATE
        annuity_factor = (1 - (1 + discount_rate) ** (-term)) / discount_rate if discount_rate > 0 else term
        
        # Net-премии (до нагрузки)
        net_death_premium = (mortality_rate * insurance_sum) / annuity_factor
        net_disability_premium = (disability_rate * insurance_sum) / annuity_factor if age <= 64 else 0
        
        # Gross-премии (с учетом нагрузки)
        death_premium = net_death_premium / load_factor
        disability_premium = net_disability_premium / load_factor
        
        return {
            'death_premium': round(death_premium, 2),
            'disability_premium': round(disability_premium, 2),
            'net_death_premium': round(net_death_premium, 2),
            'net_disability_premium': round(net_disability_premium, 2),
            'mortality_rate': mortality_rate,
            'disability_rate': disability_rate,
            'load_factor': load_factor
        }
    
    def calculate_accident_premium(self, insurance_sum: int, sport_package: bool = False) -> dict:
        """Расчет премии по пакету НС с правильными тарифами"""
        
        # Коэффициент спорта
        sport_factor = 1 + self.SPORT_LOADING if sport_package else 1
        
        # Коэффициент загрузки
        load_factor = 1 - self.COMMISSION_RATE - self.LOAD_RATE
        
        # Расчет премий по каждому виду НС (формулы из Excel H38-H40)
        death_premium = (self.ACCIDENT_DEATH_RATE * sport_factor * insurance_sum) / load_factor
        transport_premium = (self.ACCIDENT_TRANSPORT_RATE * sport_factor * insurance_sum) / load_factor  
        trauma_premium = (self.ACCIDENT_TRAUMA_RATE * sport_factor * insurance_sum) / load_factor
        
        total_premium = death_premium + transport_premium + trauma_premium
        
        return {
            'accident_death_premium': round(death_premium, 2),
            'accident_transport_premium': round(transport_premium, 2), 
            'accident_trauma_premium': round(trauma_premium, 2),
            'total_accident_premium': round(total_premium, 2),
            'sport_factor': sport_factor
        }
    
    def calculate_critical_premium(self, treatment_region: str) -> float:
        """Расчет премии по критическим заболеваниям"""
        
        # Коэффициент загрузки  
        load_factor = 1 - self.COMMISSION_RATE - self.LOAD_RATE
        
        if treatment_region == 'russia':
            return round(self.CRITICAL_RUSSIA_BASE / load_factor, 2)
        elif treatment_region == 'abroad':
            return round(self.CRITICAL_ABROAD_BASE / load_factor, 2)
        else:
            return 0.0
    
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
        """Основной расчет программы с правильными формулами"""
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
            
            logger.info(f"Расчет для: возраст {age}, пол {data['gender']}, сумма {insurance_sum}, срок {insurance_term}")
            
            # Базовая премия (смерть + инвалидность)
            base_premium = self.calculate_base_premium(insurance_sum, age, data['gender'], insurance_term)
            
            total_premium = base_premium['death_premium'] + base_premium['disability_premium']
            
            logger.info(f"Базовые премии: смерть {base_premium['death_premium']}, инвалидность {base_premium['disability_premium']}")
            
            # Пакет "Несчастный случай"
            accident_premium = {}
            if data.get('accidentPackage'):
                accident_premium = self.calculate_accident_premium(
                    insurance_sum, data.get('sportPackage', False)
                )
                total_premium += accident_premium['total_accident_premium']
                logger.info(f"Премия НС: {accident_premium['total_accident_premium']} (спорт: {data.get('sportPackage', False)})")
            
            # Пакет "Критические заболевания"  
            critical_premium = 0
            if data.get('criticalPackage') and data.get('treatmentRegion'):
                critical_premium = self.calculate_critical_premium(data['treatmentRegion'])
                total_premium += critical_premium
                logger.info(f"Премия критических заболеваний: {critical_premium} (регион: {data['treatmentRegion']})")
            
            # Применение коэффициента частоты (пока только годовая)
            frequency = data.get('insuranceFrequency', 'Ежегодно')
            
            logger.info(f"Итоговая годовая премия: {total_premium}")
            
            # Формирование результата
            result = {
                'calculationDate': datetime.now().strftime('%d.%m.%Y'),
                'clientAge': age,
                'clientGender': 'Мужской' if data['gender'] == 'male' else 'Женский',
                'insuranceTerm': insurance_term,
                'insuranceSum': insurance_sum,
                'baseInsuranceSum': f"{insurance_sum:,}".replace(",", "."),
                'endAge': age + insurance_term,
                
                # Детализация премий
                'deathPremium': base_premium['death_premium'],
                'disabilityPremium': base_premium['disability_premium'],
                'basePremium': round(base_premium['death_premium'] + base_premium['disability_premium'], 2),
                
                # Дополнительные пакеты
                'accidentPackageIncluded': data.get('accidentPackage', False),
                'accidentPremium': accident_premium.get('total_accident_premium', 0),
                'accidentInsuranceSum': f"{insurance_sum:,}".replace(",", ".") if data.get('accidentPackage') else "0",
                
                'criticalPackageIncluded': data.get('criticalPackage', False),
                'criticalPremium': critical_premium,
                'criticalTreatmentRegion': data.get('treatmentRegion', ''),
                
                'sportPackageIncluded': data.get('sportPackage', False),
                
                # Итоговые значения
                'annualPremium': round(total_premium, 2),
                'totalPremium': f"{round(total_premium, 2):,}".replace(",", "."),
                'paymentFrequency': frequency,
                
                # Дополнительная информация
                'recommendedSum': insurance_sum if data['insuranceInfo'] == 'no' else None,
                'calculationType': 'known_sum' if data['insuranceInfo'] == 'yes' else 'calculated_sum',
                
                # Детали расчета для отладки
                'calculationDetails': {
                    'mortalityRate': base_premium['mortality_rate'],
                    'disabilityRate': base_premium['disability_rate'], 
                    'loadFactor': base_premium['load_factor'],
                    'accidentDetails': accident_premium,
                    'criticalPremiumBase': critical_premium
                }
            }
            
            return result
            
        except Exception as e:
            logger.error(f"Ошибка в расчете программы: {e}")
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