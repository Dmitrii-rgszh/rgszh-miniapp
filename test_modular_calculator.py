#!/usr/bin/env python3
# test_modular_calculator.py
# Тестирование модульного калькулятора с правильными коэффициентами

print("🧪 === ТЕСТ МОДУЛЬНОГО КАЛЬКУЛЯТОРА ===")

try:
    # 1. Тестируем импорт всех модулей
    print("\n📦 ТЕСТ ИМПОРТА МОДУЛЕЙ:")
    
    try:
        from frequency_coefficients import get_frequency_coefficient, get_frequency_info
        print("   ✅ frequency_coefficients - импортирован")
    except ImportError as e:
        print(f"   ❌ frequency_coefficients - ошибка: {e}")
    
    try:
        from tariffs import calculate_accident_premium, get_all_tariffs_info
        print("   ✅ tariffs - импортирован")
    except ImportError as e:
        print(f"   ❌ tariffs - ошибка: {e}")
    
    try:
        from actuarial_tables import get_life_tariff, calculate_life_premium
        print("   ✅ actuarial_tables - импортирован")
    except ImportError as e:
        print(f"   ❌ actuarial_tables - ошибка: {e}")
    
    try:
        from justincase_calculator import JustincaseCalculatorComplete
        print("   ✅ justincase_calculator - импортирован")
    except ImportError as e:
        print(f"   ❌ justincase_calculator - ошибка: {e}")
        print("💡 Убедитесь, что все файлы модулей созданы и находятся в той же папке")
        exit(1)
    
    # 2. Тестируем модуль коэффициентов
    print("\n📊 ТЕСТ МОДУЛЯ КОЭФФИЦИЕНТОВ:")
    
    frequency_info = get_frequency_info()
    print(f"   Источник: {frequency_info['source']}")
    
    for freq, coeff in frequency_info['coefficients'].items():
        markup = frequency_info['markup_percentages'][freq]
        print(f"   {freq}: {coeff} ({markup})")
    
    # 3. Тестируем модуль актуарных таблиц
    print("\n💰 ТЕСТ МОДУЛЯ АКТУАРНЫХ ТАБЛИЦ:")
    
    test_cases = [
        (25, 'male', 10),
        (30, 'female', 15),
        (42, 'male', 12)  # с интерполяцией
    ]
    
    for age, gender, term in test_cases:
        tariff = get_life_tariff(age, gender, term)
        life_result = calculate_life_premium(age, gender, term, 2000000)
        print(f"   {age} лет, {gender}, {term} лет: тариф {tariff:.3f}, премия {life_result['life_premium']:,.2f} руб")
    
    # 4. Тестируем модуль тарифов
    print("\n💥 ТЕСТ МОДУЛЯ ТАРИФОВ:")
    
    accident_result = calculate_accident_premium(2000000, 1.04, sport_included=True)
    print(f"   НС (со спортом): {accident_result['total_accident_premium']:,.2f} руб")
    print(f"   Спорт коэффициент: {accident_result['sport_coefficient']} (+{accident_result['sport_markup']}%)")
    
    # 5. Тестируем основной калькулятор
    print("\n🚀 ТЕСТ ОСНОВНОГО КАЛЬКУЛЯТОРА:")
    
    calculator = JustincaseCalculatorComplete()
    
    # Показываем информацию о калькуляторе
    info = calculator.get_calculator_info()
    print(f"   Название: {info['name']}")
    print(f"   Версия: {info['version']}")
    print(f"   Архитектура: {info['architecture']}")
    
    # 6. Тестируем полный расчет
    print("\n🧮 ТЕСТ ПОЛНОГО РАСЧЕТА:")
    
    test_data = {
        'birthDate': '1990-01-01',
        'gender': 'male',
        'insuranceInfo': 'yes',
        'insuranceTerm': '10',
        'insuranceSum': '2000000',
        'insuranceFrequency': 'Ежемесячно',
        'accidentPackage': True,
        'criticalPackage': True,
        'treatmentRegion': 'abroad',
        'sportPackage': False
    }
    
    result = calculator.calculate_full_program(test_data)
    
    if result['success']:
        print(f"   ✅ Расчет успешен")
        print(f"   Базовая премия: {result['basePremium']:,.2f} руб")
        print(f"   НС премия: {result['accidentPremium']:,.2f} руб")
        print(f"   КЗ премия: {result['criticalPremium']:,.2f} руб")
        print(f"   ИТОГО: {result['annualPremium']:,.2f} руб")
        print(f"   Коэффициент частоты: {result['frequency_coefficient']}")
    else:
        print(f"   ❌ Ошибка расчета: {result['error']}")
    
    # 7. Тестируем исправленные коэффициенты
    print("\n🔍 ПРОВЕРКА ИСПРАВЛЕННЫХ КОЭФФИЦИЕНТОВ:")
    
    base_premium = 50000
    
    expected_coefficients = {
        'Ежегодно': 1.0,
        'Полугодие': 1.02,
        'Поквартально': 1.03,
        'Ежемесячно': 1.04
    }
    
    all_correct = True
    
    for frequency, expected_coeff in expected_coefficients.items():
        actual_coeff = get_frequency_coefficient(frequency)
        is_correct = abs(actual_coeff - expected_coeff) < 0.001
        
        if is_correct:
            print(f"   ✅ {frequency}: {actual_coeff} (ожидалось {expected_coeff})")
        else:
            print(f"   ❌ {frequency}: {actual_coeff} (ожидалось {expected_coeff})")
            all_correct = False
    
    # 8. Итоговая проверка
    print("\n🎯 === РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ ===")
    
    if all_correct and result.get('success', False):
        print("✅ ВСЕ ТЕСТЫ ПРОЙДЕНЫ! Модульная архитектура работает корректно.")
        print("📝 СЛЕДУЮЩИЕ ШАГИ:")
        print("   1. Замените старый justincase_calculator.py новой модульной версией")
        print("   2. Добавьте все модули в проект:")
        print("      - frequency_coefficients.py")
        print("      - tariffs.py") 
        print("      - actuarial_tables.py")
        print("   3. Перезапустите сервер")
        print("   4. Протестируйте через Telegram Miniapp")
    else:
        print("⚠️ ЕСТЬ ПРОБЛЕМЫ! Проверьте:")
        if not all_correct:
            print("   - Коэффициенты периодичности")
        if not result.get('success', False):
            print("   - Работу основного калькулятора")
    
    print("\n📋 ПРЕИМУЩЕСТВА МОДУЛЬНОЙ АРХИТЕКТУРЫ:")
    print("   🔍 Легко дебажить - каждый модуль отвечает за свою область")
    print("   ⚡ Быстро обновлять - изменения в отдельных файлах")
    print("   🧪 Тестировать модули независимо")
    print("   📖 Читаемый и структурированный код")
    print("   🔧 Простая поддержка и расширение")

except ImportError as e:
    print(f"❌ Ошибка импорта: {e}")
    print("💡 Убедитесь, что все модули созданы:")
    print("   - frequency_coefficients.py")
    print("   - tariffs.py")
    print("   - actuarial_tables.py")
    print("   - justincase_calculator.py (модульная версия)")
    
except Exception as e:
    print(f"❌ Ошибка тестирования: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "="*60)
print("Тестирование завершено!")