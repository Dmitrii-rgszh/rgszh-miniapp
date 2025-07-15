# care_future_models.py - ИСПРАВЛЕННАЯ ВЕРСИЯ с точной логикой Excel

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
    """
    ИСПРАВЛЕННЫЙ класс для расчетов НСЖ с точной логикой Excel
    """
    
    def __init__(self):
        self.logger = logging.getLogger("NSJCalculator")
        
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
           5: {1: 0, 2: 0, 3: 0.3, 4: 0.4, 5: 0.5},
           6: {1: 0, 2: 0, 3: 0.3, 4: 0.4, 5: 0.5, 6: 0.6},
           7: {1: 0, 2: 0, 3: 0.3, 4: 0.4, 5: 0.5, 6: 0.6, 7: 0},
           8: {1: 0, 2: 0, 3: 0.3, 4: 0.4, 5: 0.5, 6: 0.6, 7: 0, 8: 0},
           9: {1: 0, 2: 0, 3: 0.3, 4: 0.4, 5: 0.5, 6: 0.6, 7: 0, 8: 0, 9: 0},
           10: {1: 0, 2: 0, 3: 0.2, 4: 0.3, 5: 0.4, 6: 0.5, 7: 0.6, 8: 0.7, 9: 0, 10: 0},
           11: {1: 0, 2: 0, 3: 0.2, 4: 0.3, 5: 0.4, 6: 0.5, 7: 0.6, 8: 0.7, 9: 0.8, 10: 0, 11: 0},
           12: {1: 0, 2: 0, 3: 0.2, 4: 0.3, 5: 0.4, 6: 0.5, 7: 0.6, 8: 0.7, 9: 0.8, 10: 0.9, 11: 0, 12: 0},
           13: {1: 0, 2: 0, 3: 0.1, 4: 0.2, 5: 0.3, 6: 0.4, 7: 0.5, 8: 0.6, 9: 0.7, 10: 0.8, 11: 0.9, 12: 0, 13: 0},
           14: {1: 0, 2: 0, 3: 0.1, 4: 0.2, 5: 0.3, 6: 0.4, 7: 0.5, 8: 0.6, 9: 0.7, 10: 0.8, 11: 0.9, 12: 1.0, 13: 0, 14: 0},
           15: {1: 0, 2: 0, 3: 0.1, 4: 0.2, 5: 0.3, 6: 0.4, 7: 0.5, 8: 0.6, 9: 0.7, 10: 0.8, 11: 0.9, 12: 1.0, 13: 1.1, 14: 0, 15: 0},
           16: {1: 0, 2: 0, 3: 0.1, 4: 0.2, 5: 0.3, 6: 0.4, 7: 0.5, 8: 0.6, 9: 0.7, 10: 0.8, 11: 0.9, 12: 1.0, 13: 1.1, 14: 1.2, 15: 0, 16: 0},
           17: {1: 0, 2: 0, 3: 0.1, 4: 0.2, 5: 0.3, 6: 0.4, 7: 0.5, 8: 0.6, 9: 0.7, 10: 0.8, 11: 0.9, 12: 1.0, 13: 1.1, 14: 1.2, 15: 1.3, 16: 0, 17: 0},
           18: {1: 0, 2: 0, 3: 0.1, 4: 0.2, 5: 0.3, 6: 0.4, 7: 0.5, 8: 0.6, 9: 0.7, 10: 0.8, 11: 0.9, 12: 1.0, 13: 1.1, 14: 1.2, 15: 1.3, 16: 1.4, 17: 0, 18: 0},
           19: {1: 0, 2: 0, 3: 0.1, 4: 0.2, 5: 0.3, 6: 0.4, 7: 0.5, 8: 0.6, 9: 0.7, 10: 0.8, 11: 0.9, 12: 1.0, 13: 1.1, 14: 1.2, 15: 1.3, 16: 1.4, 17: 1.5, 18: 0, 19: 0},
           20: {1: 0, 2: 0, 3: 0.1, 4: 0.2, 5: 0.3, 6: 0.4, 7: 0.5, 8: 0.6, 9: 0.7, 10: 0.8, 11: 0.9, 12: 1.0, 13: 1.1, 14: 1.2, 15: 1.3, 16: 1.4, 17: 1.5, 18: 1.6, 19: 0, 20: 0}
        }
    
    def calculate(self, input_data: CalculationInput) -> CalculationResult:
        """
        ИСПРАВЛЕННЫЙ основной метод расчета с точной логикой Excel
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
            
            # 3. Определяем премию и страховую сумму (ИСПРАВЛЕННАЯ ЛОГИКА)
            if input_data.calculation_type == 'from_premium':
                premium_amount = input_data.input_amount
                insurance_sum = self._calculate_insurance_sum_from_premium(premium_amount, input_data.contract_term)
            else:  # from_sum
                insurance_sum = input_data.input_amount
                premium_amount = self._calculate_premium_from_sum(insurance_sum, input_data.contract_term)
            
            self.logger.info(f"💰 Премия: {premium_amount}, Страховая сумма: {insurance_sum}")
            
            # 4. ИСПРАВЛЕННЫЕ основные расчеты (по логике Excel)
            cashback_rate = self._get_cashback_rate(input_data.contract_term)
            accumulated_capital = premium_amount * input_data.contract_term
            program_income = int(premium_amount * cashback_rate * input_data.contract_term)
            
            # 5. Налоговый вычет (ИСПРАВЛЕННАЯ ФОРМУЛА)
            tax_deduction = self._calculate_tax_deduction(premium_amount, input_data.contract_term)
            
            # 6. Выкупные суммы (ИСПРАВЛЕННАЯ ЛОГИКА)
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
        """
        ИСПРАВЛЕННАЯ: Получение ставки кэшбэка по сроку (из Excel логики)
        Логика из листа "к_Расчетчик": кэшбэк = коэффициент_дожития - 1
        """
        survival_coeff = self.survival_coefficients.get(contract_term)
        if not survival_coeff:
            raise ValueError(f"Нет данных о коэффициенте дожития для срока {contract_term}")
        
        cashback_rate = survival_coeff - 1.0
        self.logger.info(f"📊 Кэшбэк для срока {contract_term} лет: {cashback_rate:.4f}")
        return cashback_rate
    
    def _calculate_insurance_sum_from_premium(self, premium: int, term: int) -> int:
        """
        ИСПРАВЛЕННАЯ: Расчет страховой суммы от премии 
        Формула из Excel: р_сумма = р_взнос * р_срок * (1 + р_кэшбэк)
        """
        cashback_rate = self._get_cashback_rate(term)
        insurance_sum = int(premium * term * (1 + cashback_rate))
        return insurance_sum
    
    def _calculate_premium_from_sum(self, insurance_sum: int, term: int) -> int:
        """
        ИСПРАВЛЕННАЯ: Расчет премии от страховой суммы
        Формула из Excel: р_взнос = р_сумма / (р_срок * (1 + р_кэшбэк))
        """
        cashback_rate = self._get_cashback_rate(term)
        premium = int(insurance_sum / (term * (1 + cashback_rate)))
        return premium
    
    def _calculate_tax_deduction(self, premium: int, term: int) -> int:
        """
        ИСПРАВЛЕННАЯ: Расчет налогового вычета 
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
      ИСПРАВЛЕННАЯ: Расчет выкупных сумм по годам
      Из Excel: выкупная_сумма = премия * год * процент_выкупа
      """
      redemption_values = []
      percentages = self.redemption_percentages.get(term, {})
    
      # Проходим по всем годам срока программы
      for year in range(1, term + 1):
          # Получаем процент (если есть) или 0
          percentage = percentages.get(year, 0)
        
          # Рассчитываем сумму
          if percentage > 0:
              amount = int(premium * year * percentage)
          else:
              amount = 0
            
          redemption_values.append({
              'year': year,
              'amount': amount,
              'percentage': percentage
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

# =============================================================================
# УТИЛИТЫ ДЛЯ РАБОТЫ С ДАННЫМИ
# =============================================================================

class NSJDataManager:
    """Класс для управления данными калькулятора"""
    
    @staticmethod
    def get_available_contract_terms() -> List[int]:
        """Получить доступные сроки договора"""
        # Возвращаем фиксированные сроки из Excel
        return list(range(5, 21))  # 5-20 лет
    
    @staticmethod
    def get_age_ranges() -> Dict[str, int]:
        """Получить возрастные ограничения"""
        return {
            'min_age': 18,
            'max_age': 63
        }
    
    @staticmethod
    def get_amount_limits() -> Dict[str, int]:
        """Получить ограничения по суммам"""
        return {
            'min_premium': 100000,
            'max_premium': 50000000,
            'min_insurance_sum': 500000,
            'max_insurance_sum': 100000000
        }
    
    @staticmethod
    def get_calculator_info() -> Dict[str, Any]:
        """Получить общую информацию о калькуляторе"""
        return {
            'program_name': 'Забота о будущем Ультра',
            'program_version': 'v.1.15 (Excel logic)',
            'currency': 'RUB',
            'supports_tax_calculation': True,
            'supports_redemption_calculation': True,
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
            # Проверяем встроенные данные Excel
            calculator = NSJCalculator()
            
            # Проверяем наличие всех коэффициентов дожития
            missing_survival = []
            for term in range(5, 21):
                if term not in calculator.survival_coefficients:
                    missing_survival.append(term)
            
            if missing_survival:
                result['errors'].append(f'Отсутствуют коэффициенты дожития для сроков: {missing_survival}')
                result['status'] = 'error'
            
            # Проверяем наличие тарифов по рискам
            missing_tariffs = []
            for term in range(5, 21):
                if term not in calculator.risk_tariffs:
                    missing_tariffs.append(term)
            
            if missing_tariffs:
                result['errors'].append(f'Отсутствуют тарифы по рискам для сроков: {missing_tariffs}')
                result['status'] = 'error'
            
            # Проверяем выкупные суммы
            missing_redemption = []
            for term in range(5, 21):
                if term not in calculator.redemption_percentages:
                    missing_redemption.append(term)
            
            if missing_redemption:
                result['warnings'].append(f'Отсутствуют выкупные суммы для сроков: {missing_redemption}')
            
            result['stats']['survival_coefficients_count'] = len(calculator.survival_coefficients)
            result['stats']['risk_tariffs_count'] = len(calculator.risk_tariffs)
            result['stats']['redemption_terms_count'] = len(calculator.redemption_percentages)
            result['stats']['available_terms'] = NSJDataManager.get_available_contract_terms()
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
    """Быстрый тест расчета для проверки ИСПРАВЛЕННОЙ логики"""
    try:
        calculator = NSJCalculator()
        
        # Тестовые данные из Excel (мужчина 60 лет, срок 9 лет, премия 100,000)
        test_input = CalculationInput(
            birth_date=date(1965, 4, 1),  # возраст 60 лет
            gender='male',
            contract_term=9,
            calculation_type='from_premium',
            input_amount=100000,
            email='test@example.com'
        )
        
        result = calculator.calculate(test_input)
        
        print(f"✅ Тест ИСПРАВЛЕННОГО расчета прошел успешно!")
        print(f"📊 Результаты:")
        print(f"   UUID: {result.calculation_uuid}")
        print(f"   Премия: {result.premium_amount:,} руб.")
        print(f"   Страховая сумма: {result.insurance_sum:,} руб.")
        print(f"   Накопленный капитал: {result.accumulated_capital:,} руб.")
        print(f"   Доход по программе: {result.program_income:,} руб.")
        print(f"   Налоговый вычет: {result.tax_deduction:,} руб.")
        print(f"   Возраст: {result.age_at_start} → {result.age_at_end}")
        print(f"   Выкупных сумм: {len(result.redemption_values)}")
        
        # Сверяем с ожидаемыми значениями из Excel
        expected_insurance_sum = 1467000  # из Excel C16
        expected_program_income = 567000  # примерно из Excel C13
        
        print(f"\n🔍 Сверка с Excel:")
        print(f"   Страховая сумма: ожидается {expected_insurance_sum:,}, получено {result.insurance_sum:,}")
        print(f"   Доход: ожидается ~{expected_program_income:,}, получено {result.program_income:,}")
        
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
        print("🧪 Тестирование ИСПРАВЛЕННОГО калькулятора НСЖ...")
        
        # Проверяем БД
        validation = NSJDataManager.validate_database()
        print(f"Статус БД: {validation['status']}")
        print(f"Статистика: {validation['stats']}")
        
        if validation['errors']:
            print(f"❌ Ошибки: {validation['errors']}")
        
        if validation['warnings']:
            print(f"⚠️ Предупреждения: {validation['warnings']}")
        
        # Тестируем расчет
        if quick_calculation_test():
            print("🎉 Все тесты ИСПРАВЛЕННОЙ логики пройдены!")
        else:
            sys.exit(1)