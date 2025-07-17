# tariffs.py
# Модуль тарифов НС, КЗ и других констант

"""
Тарифы для расчета премий по несчастным случаям (НС) и критическим заболеваниям (КЗ)
Все значения взяты из Excel файла "На всякий случай.xlsm"
"""

# ===== ТАРИФЫ НЕСЧАСТНЫХ СЛУЧАЕВ (НС) =====
# Тарифы указаны на 1000 рублей страховой суммы
ACCIDENT_TARIFFS = {
    'death_accident': 0.0011213,      # НС смерть: 1.1213 / 1000
    'death_transport': 0.0002807,     # НС смерть от ДТП: 0.2807 / 1000  
    'trauma_accident': 0.0018341,     # НС травма: 1.8341 / 1000
}

# ===== ТАРИФЫ КРИТИЧЕСКИХ ЗАБОЛЕВАНИЙ (КЗ) =====
# Фиксированные суммы в рублях (не зависят от страховой суммы)
CRITICAL_ILLNESS_TARIFFS = {
    'russia': 0.0,        # Лечение в РФ - не используется в текущем примере
    'abroad': 54094.74    # Лечение за рубежом - фиксированная сумма в рублях
}

# ===== КОЭФФИЦИЕНТЫ =====
SPORT_COEFFICIENT = 1.1              # Коэффициент для занятий спортом (+10%)
DISABILITY_RATE = 0.20               # Премия по инвалидности (20% от жизни)

# ===== ОСНОВНЫЕ ПАРАМЕТРЫ РАСЧЕТА =====
CALCULATION_PARAMETERS = {
    'guaranteed_rate': 0.08,          # Гарантированная доходность: 8%
    'commission_rate': 0.30,          # Комиссия: 30%
    'load_rate': 0.05,                # Нагрузка: 5%
}

# ===== ОГРАНИЧЕНИЯ =====
LIMITS = {
    'min_insurance_sum': 1000000,     # Минимальная страховая сумма
    'max_insurance_sum': 100000000,   # Максимальная страховая сумма
    'min_insurance_term': 1,          # Минимальный срок страхования
    'max_insurance_term': 30,         # Максимальный срок страхования
    'min_age': 18,                    # Минимальный возраст
    'max_age': 70                     # Максимальный возраст
}

def get_accident_tariff(accident_type: str) -> float:
    """
    Получение тарифа НС по типу
    
    Args:
        accident_type: Тип НС ('death_accident', 'death_transport', 'trauma_accident')
        
    Returns:
        float: Тариф НС на 1000 рублей страховой суммы
    """
    return ACCIDENT_TARIFFS.get(accident_type, 0.0)

def get_critical_illness_tariff(treatment_region: str) -> float:
    """
    Получение тарифа КЗ по региону лечения
    
    Args:
        treatment_region: Регион лечения ('russia', 'abroad')
        
    Returns:
        float: Фиксированная сумма тарифа КЗ в рублях
    """
    return CRITICAL_ILLNESS_TARIFFS.get(treatment_region, 0.0)

def calculate_accident_premium(insurance_sum: int, frequency_coeff: float, sport_included: bool = False) -> dict:
    """
    Расчет премии НС
    
    Args:
        insurance_sum: Страховая сумма
        frequency_coeff: Коэффициент частоты платежей
        sport_included: Включен ли спорт-пакет
        
    Returns:
        dict: Детальный расчет премии НС
    """
    # Расчет по каждому виду НС
    accident_death = frequency_coeff * ACCIDENT_TARIFFS['death_accident'] * insurance_sum
    accident_transport = frequency_coeff * ACCIDENT_TARIFFS['death_transport'] * insurance_sum
    accident_trauma = frequency_coeff * ACCIDENT_TARIFFS['trauma_accident'] * insurance_sum
    
    total_accident_premium = accident_death + accident_transport + accident_trauma
    
    # Спортивный коэффициент
    sport_coeff = SPORT_COEFFICIENT if sport_included else 1.0
    if sport_included:
        total_accident_premium *= sport_coeff
    
    return {
        'accident_death': round(accident_death, 2),
        'accident_transport': round(accident_transport, 2),
        'accident_trauma': round(accident_trauma, 2),
        'subtotal': round(accident_death + accident_transport + accident_trauma, 2),
        'sport_coefficient': sport_coeff,
        'sport_markup': round((sport_coeff - 1) * 100, 1),
        'total_accident_premium': round(total_accident_premium, 2),
        'frequency_coefficient': frequency_coeff
    }

def calculate_critical_illness_premium(treatment_region: str, frequency_coeff: float) -> dict:
    """
    Расчет премии КЗ
    
    Args:
        treatment_region: Регион лечения
        frequency_coeff: Коэффициент частоты платежей
        
    Returns:
        dict: Детальный расчет премии КЗ
    """
    base_tariff = get_critical_illness_tariff(treatment_region)
    critical_premium = base_tariff * frequency_coeff
    
    return {
        'base_tariff': base_tariff,
        'treatment_region': treatment_region,
        'frequency_coefficient': frequency_coeff,
        'critical_premium': round(critical_premium, 2)
    }

def validate_insurance_sum(insurance_sum: int) -> tuple[bool, str]:
    """
    Валидация страховой суммы
    
    Args:
        insurance_sum: Страховая сумма для проверки
        
    Returns:
        tuple: (is_valid, error_message)
    """
    if insurance_sum < LIMITS['min_insurance_sum']:
        return False, f"Минимальная страховая сумма: {LIMITS['min_insurance_sum']:,} руб"
    elif insurance_sum > LIMITS['max_insurance_sum']:
        return False, f"Максимальная страховая сумма: {LIMITS['max_insurance_sum']:,} руб"
    return True, ""

def validate_insurance_term(term: int) -> tuple[bool, str]:
    """
    Валидация срока страхования
    
    Args:
        term: Срок страхования для проверки
        
    Returns:
        tuple: (is_valid, error_message)
    """
    if term < LIMITS['min_insurance_term']:
        return False, f"Минимальный срок страхования: {LIMITS['min_insurance_term']} лет"
    elif term > LIMITS['max_insurance_term']:
        return False, f"Максимальный срок страхования: {LIMITS['max_insurance_term']} лет"
    return True, ""

def validate_age(age: int) -> tuple[bool, str]:
    """
    Валидация возраста
    
    Args:
        age: Возраст для проверки
        
    Returns:
        tuple: (is_valid, error_message)
    """
    if age < LIMITS['min_age']:
        return False, f"Минимальный возраст: {LIMITS['min_age']} лет"
    elif age > LIMITS['max_age']:
        return False, f"Максимальный возраст: {LIMITS['max_age']} лет"
    return True, ""

def get_all_tariffs_info() -> dict:
    """
    Получение полной информации о тарифах
    
    Returns:
        dict: Подробная информация о всех тарифах
    """
    return {
        'accident_tariffs': ACCIDENT_TARIFFS.copy(),
        'critical_illness_tariffs': CRITICAL_ILLNESS_TARIFFS.copy(),
        'coefficients': {
            'sport': SPORT_COEFFICIENT,
            'disability_rate': DISABILITY_RATE
        },
        'calculation_parameters': CALCULATION_PARAMETERS.copy(),
        'limits': LIMITS.copy(),
        'source': 'Excel файл "На всякий случай.xlsm"'
    }

# Для тестирования и дебага
if __name__ == "__main__":
    print("🔍 === ТЕСТ МОДУЛЯ ТАРИФОВ ===")
    
    # Показываем тарифы НС
    print("\n💥 Тарифы НС (на 1000 руб страховой суммы):")
    for accident_type, tariff in ACCIDENT_TARIFFS.items():
        print(f"   {accident_type}: {tariff:.7f}")
    
    # Показываем тарифы КЗ
    print("\n🏥 Тарифы КЗ (фиксированные суммы):")
    for region, tariff in CRITICAL_ILLNESS_TARIFFS.items():
        print(f"   {region}: {tariff:,.2f} руб")
    
    # Тест расчета НС
    print("\n🧮 Тест расчета НС (сумма: 2,000,000 руб, частота: 1.04):")
    accident_result = calculate_accident_premium(2000000, 1.04, sport_included=True)
    for key, value in accident_result.items():
        if isinstance(value, float):
            print(f"   {key}: {value:,.2f}")
        else:
            print(f"   {key}: {value}")
    
    # Тест расчета КЗ
    print("\n🧮 Тест расчета КЗ (регион: abroad, частота: 1.04):")
    critical_result = calculate_critical_illness_premium('abroad', 1.04)
    for key, value in critical_result.items():
        if isinstance(value, float) and key != 'frequency_coefficient':
            print(f"   {key}: {value:,.2f}")
        else:
            print(f"   {key}: {value}")
    
    # Показываем ограничения
    print("\n📋 Ограничения:")
    for limit_name, limit_value in LIMITS.items():
        if 'sum' in limit_name:
            print(f"   {limit_name}: {limit_value:,}")
        else:
            print(f"   {limit_name}: {limit_value}")