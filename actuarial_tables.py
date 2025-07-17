# actuarial_tables.py
# Модуль актуарных таблиц страхования жизни СБСЖ

"""
Актуарные таблицы страхования жизни СБСЖ
Тарифы указаны на 1000 рублей страховой суммы
Данные взяты из Excel файла "На всякий случай.xlsm"
"""

import logging
from typing import Dict, Optional

logger = logging.getLogger(__name__)

# ===== БАЗОВЫЕ АКТУАРНЫЕ ТАБЛИЦЫ МУЖЧИНЫ =====
# Ключевые возрасты с базовыми сроками (5, 10, 15, 20, 25, 30 лет)
MALE_BASE_TARIFFS = {
    18: {5: 3.790, 10: 3.908, 15: 4.028, 20: 4.150, 25: 4.274, 30: 4.400},
    25: {5: 4.094, 10: 4.230, 15: 4.368, 20: 4.509, 25: 4.652, 30: 4.797},
    30: {5: 4.449, 10: 4.606, 15: 4.766, 20: 4.928, 25: 5.093, 30: 5.261},
    35: {5: 4.868, 10: 5.051, 15: 5.237, 20: 5.426, 25: 5.618, 30: 5.814},
    40: {5: 5.361, 10: 5.575, 15: 5.793, 20: 6.015, 25: 6.241, 30: 6.472},
    45: {5: 5.941, 10: 6.193, 15: 6.450, 20: 6.713, 25: 6.981, 30: 7.255},
    50: {5: 6.624, 10: 6.923, 15: 7.230, 20: 7.544, 25: 7.866, 30: 8.196},
    55: {5: 7.430, 10: 7.790, 15: 8.160, 20: 8.540, 25: 8.931, 30: 9.333},
    60: {5: 8.382, 10: 8.811, 15: 9.254, 20: 9.710, 25: 10.180, 30: 10.665},
    65: {5: 9.509, 10: 10.018, 15: 10.545, 20: 11.091, 25: 11.657, 30: 12.244},
    70: {5: 10.842, 10: 11.443, 15: 12.067, 20: 12.716, 25: 13.391, 30: 14.094}
}

# ===== БАЗОВЫЕ АКТУАРНЫЕ ТАБЛИЦЫ ЖЕНЩИНЫ =====  
# Ключевые возрасты с базовыми сроками (данные из Excel скриншота)
FEMALE_BASE_TARIFFS = {
    18: {5: 3.951, 10: 4.071, 15: 4.216, 20: 4.389, 25: 4.596, 30: 4.846},
    25: {5: 4.400, 10: 4.552, 15: 4.738, 20: 4.965, 25: 5.240, 30: 5.573},
    30: {5: 4.777, 10: 4.951, 15: 5.163, 20: 5.422, 25: 5.737, 30: 6.121},
    35: {5: 5.232, 10: 5.434, 15: 5.679, 20: 5.980, 25: 6.350, 30: 6.805},
    40: {5: 5.796, 10: 6.032, 15: 6.321, 20: 6.676, 25: 7.116, 30: 7.661},
    45: {5: 6.510, 10: 6.791, 15: 7.141, 20: 7.577, 25: 8.120, 30: 8.801},
    50: {5: 7.420, 10: 7.760, 15: 8.194, 20: 8.746, 25: 9.449, 30: 10.353},
    55: {5: 8.585, 10: 9.007, 15: 9.562, 20: 10.288, 25: 11.241, 30: 12.490},
    60: {5: 10.097, 10: 10.624, 15: 11.330, 20: 12.276, 25: 13.542, 30: 15.235},
    65: {5: 12.024, 10: 12.692, 15: 13.611, 20: 14.870, 25: 16.598, 30: 18.984},
    70: {5: 14.451, 10: 15.305, 15: 16.507, 20: 18.196, 25: 20.584, 30: 23.990}
}

def interpolate_age(table: Dict[int, Dict[int, float]], age: int, term: int) -> float:
    """
    Интерполяция тарифа по возрасту
    
    Args:
        table: Таблица тарифов
        age: Возраст клиента
        term: Срок страхования
        
    Returns:
        float: Интерполированный тариф
    """
    try:
        available_ages = [a for a in table.keys() if a <= age]
        if not available_ages:
            available_ages = list(table.keys())
        
        # Если точное значение есть
        if age in table:
            return interpolate_term(table[age], term)
        
        # Находим ближайшие возрасты для интерполяции
        lower_age = max([a for a in table.keys() if a <= age], default=min(table.keys()))
        upper_age = min([a for a in table.keys() if a >= age], default=max(table.keys()))
        
        if lower_age == upper_age:
            return interpolate_term(table[lower_age], term)
        
        # Линейная интерполяция между возрастами
        lower_tariff = interpolate_term(table[lower_age], term)
        upper_tariff = interpolate_term(table[upper_age], term)
        
        age_ratio = (age - lower_age) / (upper_age - lower_age)
        return lower_tariff + age_ratio * (upper_tariff - lower_tariff)
        
    except Exception as e:
        logger.error(f"Ошибка интерполяции по возрасту: {e}")
        return 5.0

def interpolate_term(age_data: Dict[int, float], term: int) -> float:
    """
    Интерполяция тарифа по сроку для конкретного возраста
    
    Args:
        age_data: Данные тарифов для возраста
        term: Срок страхования
        
    Returns:
        float: Интерполированный тариф
    """
    try:
        # Если точное значение есть
        if term in age_data:
            return age_data[term]
        
        available_terms = list(age_data.keys())
        
        # Если срок меньше минимального
        if term <= min(available_terms):
            return age_data[min(available_terms)]
        
        # Если срок больше максимального
        if term >= max(available_terms):
            return age_data[max(available_terms)]
        
        # Линейная интерполяция между сроками
        lower_term = max([t for t in available_terms if t <= term])
        upper_term = min([t for t in available_terms if t >= term])
        
        if lower_term == upper_term:
            return age_data[lower_term]
        
        lower_tariff = age_data[lower_term]
        upper_tariff = age_data[upper_term]
        
        term_ratio = (term - lower_term) / (upper_term - lower_term)
        return lower_tariff + term_ratio * (upper_tariff - lower_tariff)
        
    except Exception as e:
        logger.error(f"Ошибка интерполяции по сроку: {e}")
        return 5.0

def get_life_tariff(age: int, gender: str, term: int) -> float:
    """
    Получение тарифа страхования жизни с интерполяцией
    
    Args:
        age: Возраст клиента (18-70)
        gender: Пол ('male' или 'female')
        term: Срок страхования (5-30 лет)
        
    Returns:
        float: Тариф на 1000 рублей страховой суммы
    """
    try:
        # Выбираем таблицу в зависимости от пола
        if gender.lower() == 'female':
            table = FEMALE_BASE_TARIFFS
        else:
            table = MALE_BASE_TARIFFS
        
        # Ограничиваем возраст и срок допустимыми значениями
        age = max(18, min(70, age))
        term = max(5, min(30, term))
        
        # Получаем тариф с интерполяцией
        tariff = interpolate_age(table, age, term)
        
        logger.debug(f"Тариф жизни: возраст={age}, пол={gender}, срок={term}, тариф={tariff}")
        return tariff
        
    except Exception as e:
        logger.error(f"Ошибка получения тарифа жизни: {e}")
        return 5.0

def calculate_life_premium(age: int, gender: str, term: int, insurance_sum: int) -> dict:
    """
    Расчет премии страхования жизни
    
    Args:
        age: Возраст клиента
        gender: Пол клиента
        term: Срок страхования
        insurance_sum: Страховая сумма
        
    Returns:
        dict: Детальный расчет премии страхования жизни
    """
    try:
        tariff = get_life_tariff(age, gender, term)
        life_premium = (insurance_sum / 1000) * tariff
        
        return {
            'age': age,
            'gender': gender,
            'term': term,
            'insurance_sum': insurance_sum,
            'life_tariff': tariff,
            'life_premium': round(life_premium, 2)
        }
        
    except Exception as e:
        logger.error(f"Ошибка расчета премии жизни: {e}")
        return {
            'age': age,
            'gender': gender,
            'term': term,
            'insurance_sum': insurance_sum,
            'life_tariff': 5.0,
            'life_premium': round((insurance_sum / 1000) * 5.0, 2)
        }

def calculate_disability_premium(life_premium: float, disability_rate: float = 0.20) -> dict:
    """
    Расчет премии страхования от инвалидности
    
    Args:
        life_premium: Премия страхования жизни
        disability_rate: Процент от премии жизни (по умолчанию 20%)
        
    Returns:
        dict: Расчет премии инвалидности
    """
    disability_premium = life_premium * disability_rate
    
    return {
        'life_premium': round(life_premium, 2),
        'disability_rate': disability_rate,
        'disability_rate_percent': disability_rate * 100,
        'disability_premium': round(disability_premium, 2)
    }

def get_available_ages(gender: str) -> list:
    """
    Получение списка доступных возрастов для пола
    
    Args:
        gender: Пол ('male' или 'female')
        
    Returns:
        list: Список доступных возрастов
    """
    if gender.lower() == 'female':
        return sorted(FEMALE_BASE_TARIFFS.keys())
    else:
        return sorted(MALE_BASE_TARIFFS.keys())

def get_available_terms(age: int, gender: str) -> list:
    """
    Получение списка доступных сроков для возраста и пола
    
    Args:
        age: Возраст
        gender: Пол
        
    Returns:
        list: Список доступных сроков
    """
    try:
        if gender.lower() == 'female':
            table = FEMALE_BASE_TARIFFS
        else:
            table = MALE_BASE_TARIFFS
        
        if age in table:
            return sorted(table[age].keys())
        else:
            # Возвращаем термы для ближайшего возраста
            closest_age = min(table.keys(), key=lambda x: abs(x - age))
            return sorted(table[closest_age].keys())
            
    except Exception as e:
        logger.error(f"Ошибка получения доступных сроков: {e}")
        return [5, 10, 15, 20, 25, 30]

def get_tariff_range(gender: str) -> dict:
    """
    Получение диапазона тарифов для пола
    
    Args:
        gender: Пол
        
    Returns:
        dict: Минимальный и максимальный тарифы
    """
    try:
        if gender.lower() == 'female':
            table = FEMALE_BASE_TARIFFS
        else:
            table = MALE_BASE_TARIFFS
        
        all_tariffs = []
        for age_data in table.values():
            all_tariffs.extend(age_data.values())
        
        return {
            'gender': gender,
            'min_tariff': min(all_tariffs),
            'max_tariff': max(all_tariffs),
            'age_range': f"{min(table.keys())}-{max(table.keys())}",
            'term_range': "5-30"
        }
        
    except Exception as e:
        logger.error(f"Ошибка получения диапазона тарифов: {e}")
        return {'gender': gender, 'min_tariff': 0, 'max_tariff': 0}

# Для тестирования и дебага
if __name__ == "__main__":
    print("🔍 === ТЕСТ МОДУЛЯ АКТУАРНЫХ ТАБЛИЦ ===")
    
    # Тестируем получение тарифов
    test_cases = [
        (25, 'male', 10),
        (35, 'female', 15),
        (42, 'male', 12),  # С интерполяцией
        (28, 'female', 8)   # С интерполяцией
    ]
    
    print("\n🧮 Тест получения тарифов:")
    for age, gender, term in test_cases:
        tariff = get_life_tariff(age, gender, term)
        print(f"   Возраст {age}, {gender}, срок {term} лет: {tariff:.3f}")
    
    # Тестируем расчет премий
    print("\n💰 Тест расчета премий (сумма: 2,000,000 руб):")
    for age, gender, term in test_cases:
        result = calculate_life_premium(age, gender, term, 2000000)
        print(f"   {age} лет, {gender}, {term} лет: {result['life_premium']:,.2f} руб")
    
    # Показываем диапазоны тарифов
    print("\n📊 Диапазоны тарифов:")
    for gender in ['male', 'female']:
        range_info = get_tariff_range(gender)
        print(f"   {gender}: {range_info['min_tariff']:.3f} - {range_info['max_tariff']:.3f}")
    
    # Тестируем расчет инвалидности
    print("\n♿ Тест расчета премии инвалидности:")
    life_premium = 50000
    disability_result = calculate_disability_premium(life_premium)
    print(f"   Жизнь: {disability_result['life_premium']:,.2f} руб")
    print(f"   Инвалидность ({disability_result['disability_rate_percent']}%): {disability_result['disability_premium']:,.2f} руб")
    