# check_actuarial_tables.py
# Проверяем, что реально загружено в актуарные таблицы

print("🔍 === АНАЛИЗ АКТУАРНЫХ ТАБЛИЦ СБСЖ ===")

try:
    from justincase_calculator import JustincaseCalculatorComplete
    
    calculator = JustincaseCalculatorComplete()
    
    # Анализируем мужские таблицы
    male_table = calculator.LIFE_TARIFFS_MALE
    female_table = calculator.LIFE_TARIFFS_FEMALE
    
    print("\n📊 МУЖСКИЕ ТАБЛИЦЫ:")
    male_ages = sorted(male_table.keys())
    print(f"   Возраста в таблице: {male_ages}")
    print(f"   Количество возрастов: {len(male_ages)}")
    print(f"   Диапазон: {min(male_ages)} - {max(male_ages)} лет")
    
    # Проверяем сроки для первого возраста
    if male_ages:
        first_age = male_ages[0]
        terms = sorted(male_table[first_age].keys())
        print(f"   Сроки для возраста {first_age}: {terms}")
        print(f"   Количество сроков: {len(terms)}")
        print(f"   Диапазон сроков: {min(terms)} - {max(terms)} лет")
    
    print("\n📊 ЖЕНСКИЕ ТАБЛИЦЫ:")
    female_ages = sorted(female_table.keys())
    print(f"   Возраста в таблице: {female_ages}")
    print(f"   Количество возрастов: {len(female_ages)}")
    print(f"   Диапазон: {min(female_ages)} - {max(female_ages)} лет")
    
    # Проверяем полноту таблиц
    print("\n🔍 АНАЛИЗ ПОЛНОТЫ:")
    
    # Ожидаемые возраста (18-70 = 53 возраста)
    expected_ages = list(range(18, 71))
    missing_ages = [age for age in expected_ages if age not in male_ages]
    
    print(f"   Ожидается возрастов (18-70): {len(expected_ages)}")
    print(f"   Загружено возрастов: {len(male_ages)}")
    print(f"   Отсутствует возрастов: {len(missing_ages)}")
    
    if missing_ages:
        print(f"   Пропущенные возраста: {missing_ages[:10]}{'...' if len(missing_ages) > 10 else ''}")
    
    # Ожидаемые сроки (1-30 = 30 сроков)
    if male_ages:
        first_age = male_ages[0]
        actual_terms = sorted(male_table[first_age].keys())
        expected_terms = list(range(1, 31))
        missing_terms = [term for term in expected_terms if term not in actual_terms]
        
        print(f"   Ожидается сроков (1-30): {len(expected_terms)}")
        print(f"   Загружено сроков: {len(actual_terms)}")
        print(f"   Отсутствует сроков: {len(missing_terms)}")
        
        if missing_terms:
            print(f"   Пропущенные сроки: {missing_terms}")
    
    # Проверяем несколько примеров тарифов
    print("\n📋 ПРИМЕРЫ ТАРИФОВ:")
    test_cases = [
        (25, 10), (30, 15), (35, 5), (50, 20), (60, 10)
    ]
    
    for age, term in test_cases:
        if age in male_table and term in male_table[age]:
            male_tariff = male_table[age][term]
            female_tariff = female_table.get(age, {}).get(term, 'НЕТ')
            print(f"   Возраст {age}, срок {term}: М={male_tariff}, Ж={female_tariff}")
        else:
            print(f"   Возраст {age}, срок {term}: ❌ ОТСУТСТВУЕТ")
    
    # Проверяем интерполяцию
    print("\n🧮 ТЕСТ ИНТЕРПОЛЯЦИИ:")
    test_age = 33  # Промежуточный возраст
    test_term = 7   # Промежуточный срок
    
    try:
        tariff = calculator.get_life_tariff(test_age, 'male', test_term)
        print(f"   Возраст {test_age}, срок {test_term}: тариф {tariff:.4f}")
        print("   ✅ Интерполяция работает")
    except Exception as e:
        print(f"   ❌ Ошибка интерполяции: {e}")
    
    # Выводы
    print("\n🎯 ВЫВОДЫ:")
    
    if len(male_ages) < 53:
        print(f"   ⚠️ НЕПОЛНЫЕ ТАБЛИЦЫ: загружено только {len(male_ages)} из 53 возрастов")
        print("   📝 Нужно дополнить таблицы всеми возрастами 18-70")
    else:
        print("   ✅ Возраста: полная таблица")
    
    if len(actual_terms) < 30:
        print(f"   ⚠️ НЕПОЛНЫЕ СРОКИ: загружено только {len(actual_terms)} из 30 сроков") 
        print("   📝 Нужно дополнить таблицы сроками 1-30")
    else:
        print("   ✅ Сроки: полная таблица")
    
    # Проверяем ограничения калькулятора
    print("\n⚙️ ОГРАНИЧЕНИЯ КАЛЬКУЛЯТОРА:")
    print(f"   MIN_AGE: {calculator.MIN_AGE}")
    print(f"   MAX_AGE: {calculator.MAX_AGE}")
    print(f"   MIN_INSURANCE_TERM: {calculator.MIN_INSURANCE_TERM}")
    print(f"   MAX_INSURANCE_TERM: {calculator.MAX_INSURANCE_TERM}")
    
except Exception as e:
    print(f"❌ Ошибка анализа: {e}")
    import traceback
    traceback.print_exc()