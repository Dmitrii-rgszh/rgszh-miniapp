# care_future_models.py - Модели БД для калькулятора НСЖ "Забота о будущем Ультра"

import os
import json
import logging
import uuid
from datetime import datetime, date
from typing import Dict, Any, List, Optional, Union
from decimal import Decimal
from dataclasses import dataclass

from sqlalchemy import Index, text, JSON, and_, or_
from flask_sqlalchemy import SQLAlchemy

logger = logging.getLogger("care_future_models")

# Используем существующий db экземпляр из db_saver
from db_saver import db

# =============================================================================
# МОДЕЛИ БАЗЫ ДАННЫХ
# =============================================================================

class NSJRiskRates(db.Model):
    """Модель тарифных коэффициентов по рискам"""
    __tablename__ = "nsj_risk_rates"
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    
    # Возрастные параметры
    age_from = db.Column(db.Integer, nullable=False, index=True)
    age_to = db.Column(db.Integer, nullable=False, index=True)
    
    # Коэффициенты по рискам
    survival_rate = db.Column(db.Numeric(10, 6), nullable=False, default=0)
    death_immediate_rate = db.Column(db.Numeric(10, 6), nullable=False, default=0)
    death_deferred_rate = db.Column(db.Numeric(10, 6), nullable=False, default=0)
    investment_rate = db.Column(db.Numeric(10, 6), nullable=False, default=0)
    
    # Метаданные
    is_active = db.Column(db.Boolean, default=True, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    @classmethod
    def get_rates_for_age(cls, age: int) -> Optional['NSJRiskRates']:
        """Получить тарифные коэффициенты для конкретного возраста"""
        return cls.query.filter(
            and_(
                cls.age_from <= age,
                cls.age_to >= age,
                cls.is_active == True
            )
        ).first()
    
    def to_dict(self) -> Dict[str, Any]:
        """Преобразование в словарь"""
        return {
            'id': self.id,
            'age_from': self.age_from,
            'age_to': self.age_to,
            'survival_rate': float(self.survival_rate),
            'death_immediate_rate': float(self.death_immediate_rate),
            'death_deferred_rate': float(self.death_deferred_rate),
            'investment_rate': float(self.investment_rate),
            'is_active': self.is_active
        }
    
    def __repr__(self):
        return f'<NSJRiskRates age={self.age_from}-{self.age_to}, survival={self.survival_rate}>'

class NSJRedemptionRates(db.Model):
    """Модель коэффициентов выкупных сумм"""
    __tablename__ = "nsj_redemption_rates"
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    
    # Параметры договора
    contract_year = db.Column(db.Integer, nullable=False, index=True)
    contract_term = db.Column(db.Integer, nullable=False, index=True)
    
    # Коэффициент выкупа
    redemption_coefficient = db.Column(db.Numeric(6, 3), nullable=False, default=0)
    
    # Метаданные
    is_active = db.Column(db.Boolean, default=True, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    @classmethod
    def get_coefficient(cls, year: int, term: int) -> float:
        """Получить коэффициент выкупа для конкретного года и срока"""
        record = cls.query.filter(
            and_(
                cls.contract_year == year,
                cls.contract_term == term,
                cls.is_active == True
            )
        ).first()
        
        if record:
            return float(record.redemption_coefficient)
        return 0.0
    
    @classmethod
    def get_all_for_term(cls, term: int) -> List['NSJRedemptionRates']:
        """Получить все коэффициенты для определенного срока"""
        return cls.query.filter(
            and_(
                cls.contract_term == term,
                cls.is_active == True
            )
        ).order_by(cls.contract_year).all()
    
    def to_dict(self) -> Dict[str, Any]:
        """Преобразование в словарь"""
        return {
            'id': self.id,
            'contract_year': self.contract_year,
            'contract_term': self.contract_term,
            'redemption_coefficient': float(self.redemption_coefficient),
            'is_active': self.is_active
        }
    
    def __repr__(self):
        return f'<NSJRedemptionRates year={self.contract_year}, term={self.contract_term}, coeff={self.redemption_coefficient}>'

class NSJCalculatorSettings(db.Model):
    """Модель настроек калькулятора"""
    __tablename__ = "nsj_calculator_settings"
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    
    # Ключ и значение
    setting_key = db.Column(db.String(100), nullable=False, unique=True, index=True)
    setting_value = db.Column(db.Text, nullable=False)
    
    # Описание и тип
    description = db.Column(db.Text)
    value_type = db.Column(db.String(20), default='string')  # string, integer, decimal, boolean
    
    # Метаданные
    is_active = db.Column(db.Boolean, default=True, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    @classmethod
    def get_value(cls, key: str, default: Any = None) -> Any:
        """Получить значение настройки с автоматическим приведением типа"""
        setting = cls.query.filter(
            and_(
                cls.setting_key == key,
                cls.is_active == True
            )
        ).first()
        
        if not setting:
            return default
        
        value = setting.setting_value
        value_type = setting.value_type
        
        try:
            if value_type == 'integer':
                return int(value)
            elif value_type == 'decimal':
                return float(value)
            elif value_type == 'boolean':
                return value.lower() in ('true', '1', 'yes', 'on')
            else:
                return value
        except (ValueError, AttributeError):
            logger.warning(f"Failed to convert setting {key} value '{value}' to type {value_type}")
            return default
    
    @classmethod
    def set_value(cls, key: str, value: Any, description: str = None, value_type: str = None) -> 'NSJCalculatorSettings':
        """Установить значение настройки"""
        setting = cls.query.filter_by(setting_key=key).first()
        
        if setting:
            setting.setting_value = str(value)
            setting.updated_at = datetime.utcnow()
            if description:
                setting.description = description
            if value_type:
                setting.value_type = value_type
        else:
            setting = cls(
                setting_key=key,
                setting_value=str(value),
                description=description,
                value_type=value_type or 'string'
            )
            db.session.add(setting)
        
        db.session.commit()
        return setting
    
    def to_dict(self) -> Dict[str, Any]:
        """Преобразование в словарь"""
        return {
            'id': self.id,
            'setting_key': self.setting_key,
            'setting_value': self.setting_value,
            'description': self.description,
            'value_type': self.value_type,
            'is_active': self.is_active
        }
    
    def __repr__(self):
        return f'<NSJCalculatorSettings {self.setting_key}={self.setting_value}>'

class NSJCalculations(db.Model):
    """Модель результатов расчетов"""
    __tablename__ = "nsj_calculations"
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    
    # Идентификация
    calculation_uuid = db.Column(db.String(36), nullable=False, unique=True, index=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String(255), index=True)
    
    # Входные параметры
    birth_date = db.Column(db.Date, nullable=False, index=True)
    gender = db.Column(db.String(10), nullable=False, index=True)
    calculation_date = db.Column(db.Date, nullable=False, default=date.today, index=True)
    contract_term = db.Column(db.Integer, nullable=False, index=True)
    
    # Тип расчета и входная сумма
    calculation_type = db.Column(db.String(20), nullable=False, index=True)  # 'from_premium', 'from_sum'
    input_amount = db.Column(db.BigInteger, nullable=False)
    
    # Результаты расчета
    premium_amount = db.Column(db.BigInteger, nullable=False)
    insurance_sum = db.Column(db.BigInteger, nullable=False)
    accumulated_capital = db.Column(db.BigInteger, nullable=False)
    program_income = db.Column(db.BigInteger, nullable=False)
    tax_deduction = db.Column(db.BigInteger, default=0)
    
    # Дополнительные параметры
    age_at_start = db.Column(db.Integer, nullable=False)
    age_at_end = db.Column(db.Integer, nullable=False)
    payment_frequency = db.Column(db.String(20), default='annual')
    
    # Выкупные суммы (JSON)
    redemption_values = db.Column(db.JSON)
    
    # Метаданные
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    user_agent = db.Column(db.Text)
    ip_address = db.Column(db.String(45))  # поддержка IPv6
    
    @classmethod
    def find_by_uuid(cls, calculation_uuid: str) -> Optional['NSJCalculations']:
        """Найти расчет по UUID"""
        return cls.query.filter_by(calculation_uuid=calculation_uuid).first()
    
    @classmethod
    def find_by_email(cls, email: str, limit: int = 10) -> List['NSJCalculations']:
        """Найти расчеты по email"""
        return cls.query.filter_by(email=email).order_by(cls.created_at.desc()).limit(limit).all()
    
    def to_dict(self, include_redemption: bool = True) -> Dict[str, Any]:
        """Преобразование в словарь"""
        result = {
            'id': self.id,
            'calculation_uuid': self.calculation_uuid,
            'email': self.email,
            'birth_date': self.birth_date.isoformat() if self.birth_date else None,
            'gender': self.gender,
            'calculation_date': self.calculation_date.isoformat() if self.calculation_date else None,
            'contract_term': self.contract_term,
            'calculation_type': self.calculation_type,
            'input_amount': self.input_amount,
            'premium_amount': self.premium_amount,
            'insurance_sum': self.insurance_sum,
            'accumulated_capital': self.accumulated_capital,
            'program_income': self.program_income,
            'tax_deduction': self.tax_deduction,
            'age_at_start': self.age_at_start,
            'age_at_end': self.age_at_end,
            'payment_frequency': self.payment_frequency,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        
        if include_redemption and self.redemption_values:
            result['redemption_values'] = self.redemption_values
        
        return result
    
    def __repr__(self):
        return f'<NSJCalculations {self.calculation_uuid[:8]}... {self.gender} age={self.age_at_start} term={self.contract_term}>'

# =============================================================================
# КЛАССЫ ДЛЯ РАСЧЕТОВ
# =============================================================================

@dataclass
class CalculationInput:
    """Входные параметры для расчета"""
    birth_date: date
    gender: str  # 'male' или 'female'
    contract_term: int  # срок в годах
    calculation_type: str  # 'from_premium' или 'from_sum'
    input_amount: int  # входная сумма в рублях
    email: Optional[str] = None
    calculation_date: Optional[date] = None

@dataclass
class CalculationResult:
    """Результат расчета"""
    premium_amount: int
    insurance_sum: int
    accumulated_capital: int
    program_income: int
    tax_deduction: int
    age_at_start: int
    age_at_end: int
    redemption_values: List[Dict[str, Union[int, float]]]
    calculation_uuid: str

class NSJCalculator:
    """Основной класс для расчетов НСЖ"""
    
    def __init__(self):
        self.logger = logging.getLogger("NSJCalculator")
    
    def calculate(self, input_data: CalculationInput) -> CalculationResult:
        """Основной метод расчета"""
        try:
            # Рассчитываем возраст
            calc_date = input_data.calculation_date or date.today()
            age_at_start = self._calculate_age(input_data.birth_date, calc_date)
            age_at_end = age_at_start + input_data.contract_term
            
            # Валидация входных данных
            self._validate_input(input_data, age_at_start, age_at_end)
            
            # Получаем тарифные коэффициенты
            risk_rates = NSJRiskRates.get_rates_for_age(age_at_start)
            if not risk_rates:
                raise ValueError(f"Тарифные коэффициенты не найдены для возраста {age_at_start}")
            
            # Выполняем расчет в зависимости от типа
            if input_data.calculation_type == 'from_premium':
                result = self._calculate_from_premium(input_data, risk_rates, age_at_start, age_at_end)
            elif input_data.calculation_type == 'from_sum':
                result = self._calculate_from_sum(input_data, risk_rates, age_at_start, age_at_end)
            else:
                raise ValueError(f"Неизвестный тип расчета: {input_data.calculation_type}")
            
            # Рассчитываем выкупные суммы
            redemption_values = self._calculate_redemption_values(
                result['premium_amount'], 
                input_data.contract_term
            )
            
            # Рассчитываем налоговый вычет
            tax_deduction = self._calculate_tax_deduction(result['premium_amount'], input_data.contract_term)
            
            # Создаем объект результата
            calculation_result = CalculationResult(
                premium_amount=result['premium_amount'],
                insurance_sum=result['insurance_sum'],
                accumulated_capital=result['accumulated_capital'],
                program_income=result['program_income'],
                tax_deduction=tax_deduction,
                age_at_start=age_at_start,
                age_at_end=age_at_end,
                redemption_values=redemption_values,
                calculation_uuid=str(uuid.uuid4())
            )
            
            # Сохраняем в БД
            self._save_calculation(input_data, calculation_result, calc_date)
            
            return calculation_result
            
        except Exception as e:
            self.logger.error(f"Ошибка расчета: {e}")
            raise
    
    def _calculate_age(self, birth_date: date, calculation_date: date) -> int:
        """Расчет возраста в полных годах"""
        age = calculation_date.year - birth_date.year
        if calculation_date.month < birth_date.month or \
           (calculation_date.month == birth_date.month and calculation_date.day < birth_date.day):
            age -= 1
        return age
    
    def _validate_input(self, input_data: CalculationInput, age_at_start: int, age_at_end: int):
        """Валидация входных параметров"""
        min_age = NSJCalculatorSettings.get_value('min_age', 18)
        max_age = NSJCalculatorSettings.get_value('max_age', 63)
        min_term = NSJCalculatorSettings.get_value('min_contract_term', 5)
        max_term = NSJCalculatorSettings.get_value('max_contract_term', 20)
        min_amount = NSJCalculatorSettings.get_value('min_premium_amount', 100000)
        max_amount = NSJCalculatorSettings.get_value('max_premium_amount', 50000000)
        
        if age_at_start < min_age or age_at_start > max_age:
            raise ValueError(f"Возраст должен быть от {min_age} до {max_age} лет")
        
        if input_data.contract_term < min_term or input_data.contract_term > max_term:
            raise ValueError(f"Срок договора должен быть от {min_term} до {max_term} лет")
        
        if input_data.input_amount < min_amount or input_data.input_amount > max_amount:
            raise ValueError(f"Сумма должна быть от {min_amount:,} до {max_amount:,} рублей")
        
        if input_data.gender not in ('male', 'female'):
            raise ValueError("Пол должен быть 'male' или 'female'")
    
    def _calculate_from_premium(self, input_data: CalculationInput, risk_rates: NSJRiskRates, 
                               age_at_start: int, age_at_end: int) -> Dict[str, int]:
        """Расчет от страхового взноса"""
        premium_amount = input_data.input_amount
        
        # Базовый расчет страховой суммы (упрощенная формула из Excel)
        survival_rate = float(risk_rates.survival_rate)
        insurance_sum = int(premium_amount / survival_rate)
        
        # Накопленный капитал (с учетом кэшбэка)
        cashback_rate = NSJCalculatorSettings.get_value('cashback_rate', 0.06)
        accumulated_capital = int(premium_amount * input_data.contract_term * (1 + cashback_rate))
        
        # Доход по программе
        program_income = accumulated_capital - (premium_amount * input_data.contract_term)
        
        return {
            'premium_amount': premium_amount,
            'insurance_sum': insurance_sum,
            'accumulated_capital': accumulated_capital,
            'program_income': program_income
        }
    
    def _calculate_from_sum(self, input_data: CalculationInput, risk_rates: NSJRiskRates,
                           age_at_start: int, age_at_end: int) -> Dict[str, int]:
        """Расчет от страховой суммы"""
        insurance_sum = input_data.input_amount
        
        # Расчет страхового взноса
        survival_rate = float(risk_rates.survival_rate)
        premium_amount = int(insurance_sum * survival_rate)
        
        # Остальные расчеты аналогично
        cashback_rate = NSJCalculatorSettings.get_value('cashback_rate', 0.06)
        accumulated_capital = int(premium_amount * input_data.contract_term * (1 + cashback_rate))
        program_income = accumulated_capital - (premium_amount * input_data.contract_term)
        
        return {
            'premium_amount': premium_amount,
            'insurance_sum': insurance_sum,
            'accumulated_capital': accumulated_capital,
            'program_income': program_income
        }
    
    def _calculate_redemption_values(self, premium_amount: int, contract_term: int) -> List[Dict[str, Union[int, float]]]:
        """Расчет выкупных сумм по годам"""
        redemption_data = NSJRedemptionRates.get_all_for_term(contract_term)
        results = []
        
        total_premiums = premium_amount * contract_term
        
        for year in range(1, contract_term + 1):
            coefficient = NSJRedemptionRates.get_coefficient(year, contract_term)
            paid_premiums = premium_amount * year
            redemption_amount = int(paid_premiums * coefficient)
            
            results.append({
                'year': year,
                'paid_premiums': paid_premiums,
                'redemption_coefficient': coefficient,
                'redemption_amount': redemption_amount
            })
        
        return results
    
    def _calculate_tax_deduction(self, premium_amount: int, contract_term: int) -> int:
        """Расчет налогового вычета"""
        annual_limit = NSJCalculatorSettings.get_value('tax_deduction_limit', 120000)
        tax_rate = NSJCalculatorSettings.get_value('tax_deduction_rate_standard', 0.13)
        
        # Размер вычета ограничен лимитом
        annual_deduction_base = min(premium_amount, annual_limit)
        annual_deduction = int(annual_deduction_base * tax_rate)
        
        # Общий вычет за весь срок
        total_deduction = annual_deduction * contract_term
        
        return total_deduction
    
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
            
            self.logger.info(f"Расчет сохранен: {result.calculation_uuid}")
            
        except Exception as e:
            self.logger.error(f"Ошибка сохранения расчета: {e}")
            db.session.rollback()
            # Не прерываем выполнение, если не удалось сохранить

# =============================================================================
# УТИЛИТЫ ДЛЯ РАБОТЫ С ДАННЫМИ
# =============================================================================

class NSJDataManager:
    """Класс для управления данными калькулятора"""
    
    @staticmethod
    def get_available_contract_terms() -> List[int]:
        """Получить доступные сроки договора"""
        terms = db.session.query(NSJRedemptionRates.contract_term).distinct().filter(
            NSJRedemptionRates.is_active == True
        ).order_by(NSJRedemptionRates.contract_term).all()
        
        return [term[0] for term in terms]
    
    @staticmethod
    def get_age_ranges() -> Dict[str, int]:
        """Получить возрастные ограничения"""
        return {
            'min_age': NSJCalculatorSettings.get_value('min_age', 18),
            'max_age': NSJCalculatorSettings.get_value('max_age', 63)
        }
    
    @staticmethod
    def get_amount_limits() -> Dict[str, int]:
        """Получить ограничения по суммам"""
        return {
            'min_premium': NSJCalculatorSettings.get_value('min_premium_amount', 100000),
            'max_premium': NSJCalculatorSettings.get_value('max_premium_amount', 50000000),
            'min_insurance_sum': NSJCalculatorSettings.get_value('min_insurance_sum', 500000),
            'max_insurance_sum': NSJCalculatorSettings.get_value('max_insurance_sum', 100000000)
        }
    
    @staticmethod
    def get_calculator_info() -> Dict[str, Any]:
        """Получить общую информацию о калькуляторе"""
        return {
            'program_name': NSJCalculatorSettings.get_value('program_name', 'Забота о будущем Ультра'),
            'program_version': NSJCalculatorSettings.get_value('program_version', 'v.25.2.1'),
            'currency': NSJCalculatorSettings.get_value('currency', 'RUB'),
            'supports_tax_calculation': NSJCalculatorSettings.get_value('supports_tax_calculation', True),
            'supports_redemption_calculation': NSJCalculatorSettings.get_value('supports_redemption_calculation', True),
            'available_terms': NSJDataManager.get_available_contract_terms(),
            'age_limits': NSJDataManager.get_age_ranges(),
            'amount_limits': NSJDataManager.get_amount_limits()
        }
    
    @staticmethod
    def validate_database() -> Dict[str, Any]:
        """Проверка корректности данных в БД"""
        result = {
            'status': 'ok',
            'errors': [],
            'warnings': [],
            'stats': {}
        }
        
        try:
            # Проверяем наличие тарифных коэффициентов
            risk_count = NSJRiskRates.query.filter_by(is_active=True).count()
            result['stats']['risk_rates_count'] = risk_count
            
            if risk_count == 0:
                result['errors'].append('Отсутствуют тарифные коэффициенты')
                result['status'] = 'error'
            
            # Проверяем наличие коэффициентов выкупа
            redemption_count = NSJRedemptionRates.query.filter_by(is_active=True).count()
            result['stats']['redemption_rates_count'] = redemption_count
            
            if redemption_count == 0:
                result['errors'].append('Отсутствуют коэффициенты выкупных сумм')
                result['status'] = 'error'
            
            # Проверяем настройки
            settings_count = NSJCalculatorSettings.query.filter_by(is_active=True).count()
            result['stats']['settings_count'] = settings_count
            
            required_settings = [
                'min_age', 'max_age', 'min_contract_term', 'max_contract_term',
                'min_premium_amount', 'cashback_rate', 'tax_deduction_rate_standard'
            ]
            
            for setting_key in required_settings:
                value = NSJCalculatorSettings.get_value(setting_key)
                if value is None:
                    result['warnings'].append(f'Отсутствует настройка: {setting_key}')
            
            # Проверяем целостность данных выкупа
            terms = NSJDataManager.get_available_contract_terms()
            for term in terms:
                coeffs = NSJRedemptionRates.get_all_for_term(term)
                if len(coeffs) != term:
                    result['warnings'].append(f'Неполные данные выкупа для срока {term} лет')
            
            result['stats']['available_terms'] = terms
            result['stats']['calculations_count'] = NSJCalculations.query.count()
            
        except Exception as e:
            result['status'] = 'error'
            result['errors'].append(f'Ошибка проверки БД: {str(e)}')
        
        return result

# =============================================================================
# ФУНКЦИИ ДЛЯ ИНИЦИАЛИЗАЦИИ
# =============================================================================

def init_nsj_database():
    """Инициализация таблиц калькулятора НСЖ"""
    try:
        # Создаем таблицы
        db.create_all()
        
        # Проверяем, что данные загружены
        validation = NSJDataManager.validate_database()
        
        if validation['status'] == 'error':
            logger.error(f"Ошибки в БД: {validation['errors']}")
            return False
        
        if validation['warnings']:
            logger.warning(f"Предупреждения БД: {validation['warnings']}")
        
        logger.info(f"БД калькулятора НСЖ инициализирована: {validation['stats']}")
        return True
        
    except Exception as e:
        logger.error(f"Ошибка инициализации БД калькулятора НСЖ: {e}")
        return False

def quick_calculation_test():
    """Быстрый тест расчета для проверки"""
    try:
        calculator = NSJCalculator()
        
        # Тестовые данные
        test_input = CalculationInput(
            birth_date=date(1990, 1, 1),
            gender='male',
            contract_term=5,
            calculation_type='from_premium',
            input_amount=960000,
            email='test@example.com'
        )
        
        result = calculator.calculate(test_input)
        
        print(f"✅ Тест расчета прошел успешно!")
        print(f"UUID: {result.calculation_uuid}")
        print(f"Взнос: {result.premium_amount:,} руб.")
        print(f"Страховая сумма: {result.insurance_sum:,} руб.")
        print(f"Накопленный капитал: {result.accumulated_capital:,} руб.")
        print(f"Доход: {result.program_income:,} руб.")
        print(f"Налоговый вычет: {result.tax_deduction:,} руб.")
        print(f"Возраст: {result.age_at_start} → {result.age_at_end}")
        print(f"Выкупных сумм: {len(result.redemption_values)}")
        
        return True
        
    except Exception as e:
        print(f"❌ Ошибка теста расчета: {e}")
        return False

if __name__ == "__main__":
    # Тестирование при прямом запуске
    import sys
    from flask import Flask
    from db_saver import init_db
    
    app = Flask(__name__)
    init_db(app)
    
    with app.app_context():
        print("🧪 Тестирование калькулятора НСЖ...")
        
        # Проверяем БД
        validation = NSJDataManager.validate_database()
        print(f"Статус БД: {validation['status']}")
        print(f"Статистика: {validation['stats']}")
        
        if validation['errors']:
            print(f"❌ Ошибки: {validation['errors']}")
            sys.exit(1)
        
        # Тестируем расчет
        if quick_calculation_test():
            print("🎉 Все тесты пройдены!")
        else:
            sys.exit(1)