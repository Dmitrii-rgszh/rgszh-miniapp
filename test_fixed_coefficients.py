#!/usr/bin/env python3
# test_fixed_coefficients.py
# Тестирование исправленных коэффициентов периодичности

print("🧪 === ТЕСТ ИСПРАВЛЕННЫХ КОЭФФИЦИЕНТОВ ПЕРИОДИЧНОСТИ ===")

try:
    # Импортируем исправленный калькулятор
    # ВАЖНО: Замените старый файл justincase_calculator.py на новый код из артефакта
    from justincase_calculator import JustincaseCalculatorComplete
    
    calculator = JustincaseCalculatorComplete()
    
    # Проверяем информацию о калькуляторе
    print("\n📋 ИНФОРМАЦИЯ О КАЛЬКУЛЯТОРЕ:")
    info = calculator.get_calculator_info()
    print(f"   Название: {info['name']}")
    print(f"   Версия: {info['version']}")
    print(f"   Исправленные коэффициенты: {info['features']['corrected_frequency_coefficients']}")
    
    # Показываем новые коэффициенты
    print("\n📊 ИСПРАВЛЕННЫЕ КОЭФФИЦИЕНТЫ ПЕРИОДИЧНОСТИ:")
    coefficients = calculator.FREQUENCY_COEFFICIENTS
    for frequency, coeff in coefficients.items():
        markup = (coeff - 1) * 100
        print(f"   {frequency}: {coeff} (доплата: {markup:+.1f}%)")
    
    # Сравниваем со старыми коэффициентами
    print("\n⚖️ СРАВНЕНИЕ СО СТАРЫМИ КОЭФФИЦИЕНТАМИ:")
    old_coefficients = {
        'Ежегодно': 1.0,
        'Ежемесячно': 1.05,     # старое значение +5%
        'Поквартально': 1.025,  # старое значение +2.5%
        'Полугодие': 1.01       # старое значение +1%
    }
    
    print("   Было → Стало:")
    for frequency in coefficients.keys():
        old_coeff = old_coefficients.get(frequency, 'N/A')
        new_coeff = coefficients[frequency]
        old_markup = (old_coeff - 1) * 100 if old_coeff != 'N/A' else 0
        new_markup = (new_coeff - 1) * 100
        
        changed = '✅' if old_coeff != new_coeff else '➖'
        print(f"   {changed} {frequency}: {old_coeff} ({old_markup:+.1f}%) → {new_coeff} ({new_markup:+.1f}%)")
    
    # Тестируем расчеты с исправленными коэффициентами
    print("\n🧮 ТЕСТ РАСЧЕТОВ С ИСПРАВЛЕННЫМИ КОЭФФИЦИЕНТАМИ:")
    
    test_data = {
        'birthDate': '1990-01-01',
        'gender': 'male',
        'insuranceInfo': 'yes',
        'insuranceTerm': '10',
        'insuranceSum': '2000000',
        'accidentPackage': True,
        'criticalPackage': True,
        'treatmentRegion': 'abroad',
        'sportPackage': False
    }
    
    results = {}
    
    # Тестируем каждую периодичность
    for frequency in coefficients.keys():
        test_data_copy = test_data.copy()
        test_data_copy['insuranceFrequency'] = frequency
        
        try:
            result = calculator.calculate_full_program(test_data_copy)
            
            results[frequency] = {
                'coefficient': coefficients[frequency],
                'base_premium': result['basePremium'],
                'accident_premium': result['accidentPremium'],
                'critical_premium': result['criticalPremium'],
                'total_premium': result['annualPremium']
            }
            
            print(f"\n   📋 {frequency} (коэфф. {coefficients[frequency]}):")
            print(f"      Базовая: {result['basePremium']:,.2f} руб")
            print(f"      НС: {result['accidentPremium']:,.2f} руб")
            print(f"      КЗ: {result['criticalPremium']:,.2f} руб")
            print(f"      ИТОГО: {result['annualPremium']:,.2f} руб")
            
        except Exception as e:
            print(f"   ❌ Ошибка расчета для {frequency}: {e}")
    
    # Проверяем логику применения коэффициентов
    print("\n🔍 ПРОВЕРКА ЛОГИКИ ПРИМЕНЕНИЯ КОЭФФИЦИЕНТОВ:")
    
    if 'Ежегодно' in results:
        base_annual = results['Ежегодно']
        
        print(f"   Базовая (ежегодно): {base_annual['total_premium']:,.2f} руб")
        
        for frequency, data in results.items():
            if frequency != 'Ежегодно':
                expected_total = base_annual['total_premium'] * data['coefficient']
                actual_total = data['total_premium']
                difference = abs(actual_total - expected_total)
                is_correct = difference < 1.0  # допуск 1 рубль на округления
                
                print(f"   {frequency}:")
                print(f"      Ожидается: {expected_total:,.2f} руб (база × {data['coefficient']})")
                print(f"      Фактически: {actual_total:,.2f} руб")
                print(f"      Разница: {difference:.2f} руб {'✅' if is_correct else '❌'}")
    
    # Проверяем соответствие Excel логике
    print("\n📈 ПРОВЕРКА СООТВЕТСТВИЯ EXCEL ЛОГИКЕ:")
    
    # На основе анализа Excel: tbl_freq_k
    excel_logic = {
        'Ежегодно': {'kk': 1, 'one_payment_coeff': 1.0, 'total_markup': 0.0},
        'Полугодие': {'kk': 2, 'one_payment_coeff': 0.51, 'total_markup': 2.0},
        'Поквартально': {'kk': 4, 'one_payment_coeff': 0.2575, 'total_markup': 3.0},
        'Ежемесячно': {'kk': 12, 'one_payment_coeff': 0.0867, 'total_markup': 4.0}
    }
    
    print("   Excel логика (kk × коэфф_одного_платежа = общая_доплата):")
    for frequency, excel_data in excel_logic.items():
        kk = excel_data['kk']
        one_coeff = excel_data['one_payment_coeff']
        expected_markup = excel_data['total_markup']
        
        calculated_total = kk * one_coeff
        our_coeff = coefficients.get(frequency, 1.0)
        our_markup = (our_coeff - 1) * 100
        
        matches = abs(our_markup - expected_markup) < 0.5
        
        print(f"   {frequency}: {kk} × {one_coeff} = {calculated_total:.3f} (доплата {expected_markup:.1f}%)")
        print(f"      Наш коэфф: {our_coeff} (доплата {our_markup:.1f}%) {'✅' if matches else '❌'}")
    
    print("\n🎯 === РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ ===")
    
    all_tests_passed = True
    
    # Проверяем, что все коэффициенты обновлены
    coeffs_updated = all(
        coefficients[freq] == excel_logic[freq]['kk'] * excel_logic[freq]['one_payment_coeff']
        for freq in excel_logic.keys()
        if freq in coefficients
    )
    
    if coeffs_updated:
        print("   ✅ Коэффициенты обновлены в соответствии с Excel")
    else:
        print("   ❌ Коэффициенты не полностью соответствуют Excel")
        all_tests_passed = False
    
    # Проверяем корректность расчетов
    calculations_correct = len(results) == len(coefficients)
    
    if calculations_correct:
        print("   ✅ Расчеты выполняются для всех периодичностей")
    else:
        print("   ❌ Есть ошибки в расчетах")
        all_tests_passed = False
    
    if all_tests_passed:
        print("\n🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ! Коэффициенты периодичности исправлены.")
        print("\n📝 СЛЕДУЮЩИЕ ШАГИ:")
        print("   1. Замените файл justincase_calculator.py новым кодом")
        print("   2. Перезапустите сервер")
        print("   3. Протестируйте через Telegram Miniapp")
        print("   4. Проверьте результаты с разными периодичностями")
    else:
        print("\n⚠️ ЕСТЬ ПРОБЛЕМЫ! Требуется дополнительная проверка.")
    
except ImportError as e:
    print(f"❌ Ошибка импорта: {e}")
    print("💡 Убедитесь, что файл justincase_calculator.py обновлен новым кодом")
    
except Exception as e:
    print(f"❌ Ошибка тестирования: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "="*60)
print("Тестирование завершено!")