# frequency_coefficients.py
# Модуль коэффициентов периодичности платежей из Excel

"""
Коэффициенты периодичности платежей из Excel файла "На всякий случай.xlsm"
Основано на таблице tbl_freq_k (Настройки!$I$10:$J$13)

Логика Excel:
- kk (количество платежей в год) × коэфф_одного_платежа = общий_коэфф_доплаты
- Ежегодно: 1 × 1.0 = 1.00 (доплата +0%)
- Полугодие: 2 × 0.51 = 1.02 (доплата +2%)
- Поквартально: 4 × 0.2575 = 1.03 (доплата +3%)
- Ежемесячно: 12 × 0.0867 = 1.04 (доплата +4%)
"""

# ПРАВИЛЬНЫЕ коэффициенты из Excel
FREQUENCY_COEFFICIENTS = {
    'Ежегодно': 1.0,        # +0%  (базовая премия, без доплаты)
    'Полугодие': 1.02,      # +2%  (2 платежа × 0.51)
    'Поквартально': 1.03,   # +3%  (4 платежа × 0.2575)  
    'Ежемесячно': 1.04      # +4%  (12 платежей × 0.0867)
}

# Исходные данные из Excel таблицы tbl_freq_k для справки
EXCEL_TABLE_DATA = {
    'table_location': 'Настройки!$I$10:$J$13',
    'formula': 'VLOOKUP(kk,tbl_freq_k,2,0)',
    'raw_data': {
        1: 1.0,      # Ежегодно: коэфф одного платежа
        2: 0.51,     # Полугодие: коэфф одного платежа  
        4: 0.2575,   # Поквартально: коэфф одного платежа
        12: 0.0867   # Ежемесячно: коэфф одного платежа
    }
}

def get_frequency_coefficient(frequency: str) -> float:
    """
    Получение коэффициента частоты платежей
    
    Args:
        frequency: Периодичность ('Ежегодно', 'Полугодие', 'Поквартально', 'Ежемесячно')
        
    Returns:
        float: Коэффициент для расчета доплаты
    """
    return FREQUENCY_COEFFICIENTS.get(frequency, 1.0)

def get_frequency_markup(frequency: str) -> float:
    """
    Получение процента доплаты для частоты платежей
    
    Args:
        frequency: Периодичность платежей
        
    Returns:
        float: Процент доплаты (например, 0.02 для +2%)
    """
    coeff = get_frequency_coefficient(frequency)
    return coeff - 1.0

def get_all_coefficients() -> dict:
    """Получение всех коэффициентов"""
    return FREQUENCY_COEFFICIENTS.copy()

def validate_frequency(frequency: str) -> bool:
    """
    Проверка валидности периодичности
    
    Args:
        frequency: Периодичность для проверки
        
    Returns:
        bool: True если периодичность поддерживается
    """
    return frequency in FREQUENCY_COEFFICIENTS

def get_frequency_info() -> dict:
    """
    Получение полной информации о коэффициентах
    
    Returns:
        dict: Подробная информация о коэффициентах и их источнике
    """
    info = {
        'source': 'Excel файл "На всякий случай.xlsm"',
        'table_location': EXCEL_TABLE_DATA['table_location'],
        'formula': EXCEL_TABLE_DATA['formula'],
        'coefficients': {},
        'markup_percentages': {}
    }
    
    for freq, coeff in FREQUENCY_COEFFICIENTS.items():
        markup = (coeff - 1) * 100
        info['coefficients'][freq] = coeff
        info['markup_percentages'][freq] = f"+{markup:.1f}%" if markup > 0 else "0%"
    
    return info

def calculate_frequency_premium(base_premium: float, frequency: str) -> dict:
    """
    Расчет премии с учетом коэффициента частоты
    
    Args:
        base_premium: Базовая годовая премия
        frequency: Периодичность платежей
        
    Returns:
        dict: Результат расчета с деталями
    """
    coeff = get_frequency_coefficient(frequency)
    total_premium = base_premium * coeff
    markup_amount = total_premium - base_premium
    markup_percent = (coeff - 1) * 100
    
    return {
        'base_premium': round(base_premium, 2),
        'frequency': frequency,
        'coefficient': coeff,
        'total_premium': round(total_premium, 2),
        'markup_amount': round(markup_amount, 2),
        'markup_percent': markup_percent,
        'markup_display': f"+{markup_percent:.1f}%" if markup_percent > 0 else "0%"
    }

# Для тестирования и дебага
if __name__ == "__main__":
    print("🔍 === ТЕСТ МОДУЛЯ КОЭФФИЦИЕНТОВ ПЕРИОДИЧНОСТИ ===")
    
    # Показываем все коэффициенты
    print("\n📊 Коэффициенты периодичности:")
    for freq, coeff in FREQUENCY_COEFFICIENTS.items():
        markup = get_frequency_markup(freq) * 100
        print(f"   {freq}: {coeff} (доплата {markup:+.1f}%)")
    
    # Тест расчета с разными периодичностями
    base_premium = 50000  # Тестовая премия
    print(f"\n🧮 Тест расчета (базовая премия: {base_premium:,} руб):")
    
    for frequency in FREQUENCY_COEFFICIENTS.keys():
        result = calculate_frequency_premium(base_premium, frequency)
        print(f"   {frequency}: {result['total_premium']:,.2f} руб ({result['markup_display']})")
    
    # Показываем информацию о модуле
    print("\n📋 Информация о модуле:")
    info = get_frequency_info()
    print(f"   Источник: {info['source']}")
    print(f"   Таблица: {info['table_location']}")
    print(f"   Формула: {info['formula']}")