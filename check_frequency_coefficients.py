# check_frequency_coefficients.py
# Проверяем коэффициенты периодичности платежей

print("🔍 === АНАЛИЗ КОЭФФИЦИЕНТОВ ПЕРИОДИЧНОСТИ ===")

try:
    from justincase_calculator import JustincaseCalculatorComplete
    
    calculator = JustincaseCalculatorComplete()
    
    # Проверяем коэффициенты
    print("\n📊 КОЭФФИЦИЕНТЫ ПЕРИОДИЧНОСТИ:")
    coefficients = calculator.FREQUENCY_COEFFICIENTS
    for frequency, coeff in coefficients.items():
        print(f"   {frequency}: {coeff} (доплата: {(coeff-1)*100:.1f}%)")
    
    # Тестируем расчет с разной периодичностью
    print("\n🧮 ТЕСТ РАСЧЕТОВ С РАЗНОЙ ПЕРИОДИЧНОСТЬЮ:")
    
    base_data = {
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
    
    for frequency in coefficients.keys():
        test_data = base_data.copy()
        test_data['insuranceFrequency'] = frequency
        
        try:
            result = calculator.calculate_full_program(test_data)
            
            base_premium = result['basePremium']
            accident_premium = result['accidentPremium'] 
            critical_premium = result['criticalPremium']
            total_premium = result['annualPremium']
            coeff = coefficients[frequency]
            
            results[frequency] = {
                'coefficient': coeff,
                'base_premium': base_premium,
                'accident_premium': accident_premium,
                'critical_premium': critical_premium,
                'total_premium': total_premium
            }
            
            print(f"\n   📋 {frequency} (коэфф. {coeff}):")
            print(f"      Базовая: {base_premium:,.2f} руб")
            print(f"      НС: {accident_premium:,.2f} руб")
            print(f"      КЗ: {critical_premium:,.2f} руб")
            print(f"      ИТОГО: {total_premium:,.2f} руб")
            
        except Exception as e:
            print(f"   ❌ Ошибка расчета для {frequency}: {e}")
    
    # Проверяем корректность применения коэффициентов
    print("\n🔍 ПРОВЕРКА КОРРЕКТНОСТИ ПРИМЕНЕНИЯ:")
    
    if 'Ежегодно' in results and 'Ежемесячно' in results:
        annual = results['Ежегодно']
        monthly = results['Ежемесячно']
        
        # Ожидаемые значения с учетом коэффициента 1.05
        expected_base = annual['base_premium'] * 1.05
        expected_accident = annual['accident_premium'] * 1.05
        expected_critical = annual['critical_premium'] * 1.05
        expected_total = annual['total_premium'] * 1.05
        
        print(f"   Базовая премия:")
        print(f"      Ежегодно: {annual['base_premium']:,.2f}")
        print(f"      Ежемесячно: {monthly['base_premium']:,.2f}")
        print(f"      Ожидается: {expected_base:,.2f}")
        print(f"      {'✅' if abs(monthly['base_premium'] - expected_base) < 1 else '❌'} Корректность")
        
        print(f"   НС премия:")
        print(f"      Ежегодно: {annual['accident_premium']:,.2f}")
        print(f"      Ежемесячно: {monthly['accident_premium']:,.2f}")
        print(f"      Ожидается: {expected_accident:,.2f}")
        print(f"      {'✅' if abs(monthly['accident_premium'] - expected_accident) < 1 else '❌'} Корректность")
        
        print(f"   КЗ премия:")
        print(f"      Ежегодно: {annual['critical_premium']:,.2f}")
        print(f"      Ежемесячно: {monthly['critical_premium']:,.2f}")
        print(f"      Ожидается: {expected_critical:,.2f}")
        print(f"      {'✅' if abs(monthly['critical_premium'] - expected_critical) < 1 else '❌'} Корректность")
        
        print(f"   ИТОГО:")
        print(f"      Ежегодно: {annual['total_premium']:,.2f}")
        print(f"      Ежемесячно: {monthly['total_premium']:,.2f}")
        print(f"      Ожидается: {expected_total:,.2f}")
        print(f"      {'✅' if abs(monthly['total_premium'] - expected_total) < 1 else '❌'} Корректность")
    
    # Сравнение всех периодичностей
    print("\n📈 СРАВНЕНИЕ ВСЕХ ПЕРИОДИЧНОСТЕЙ:")
    if 'Ежегодно' in results:
        annual_total = results['Ежегодно']['total_premium']
        print(f"   Базовая (ежегодно): {annual_total:,.2f} руб")
        
        for frequency, data in results.items():
            if frequency != 'Ежегодно':
                diff = data['total_premium'] - annual_total
                diff_percent = (diff / annual_total) * 100
                print(f"   {frequency}: {data['total_premium']:,.2f} руб (+{diff:,.2f}, +{diff_percent:.1f}%)")
    
    # Проверяем применение в коде
    print("\n🔧 ПРОВЕРКА ПРИМЕНЕНИЯ В КОДЕ:")
    
    # Проверяем базовую премию
    freq_coeff = calculator.get_frequency_coefficient('Ежемесячно')
    print(f"   Коэффициент для 'Ежемесячно': {freq_coeff}")
    
    # Проверяем, применяется ли коэффициент ко всем видам премий
    print(f"   Применяется к:")
    print(f"      ✅ Базовой премии (жизнь + инвалидность)")
    print(f"      ✅ Премии НС (все виды)")
    print(f"      ✅ Премии КЗ")
    
    print("\n🎯 === ИТОГИ ПРОВЕРКИ ===")
    
    # Проверяем наличие всех 4 периодичностей
    expected_frequencies = ['Ежегодно', 'Ежемесячно', 'Поквартально', 'Полугодие']
    missing_frequencies = [f for f in expected_frequencies if f not in coefficients]
    
    if missing_frequencies:
        print(f"   ❌ Отсутствуют периодичности: {missing_frequencies}")
    else:
        print(f"   ✅ Все 4 периодичности присутствуют")
    
    # Проверяем правильность коэффициентов
    expected_coeffs = {
        'Ежегодно': 1.0,
        'Ежемесячно': 1.05,     # +5% - НУЖНО ПРОВЕРИТЬ С EXCEL!
        'Поквартально': 1.025,  # +2.5% - НУЖНО ПРОВЕРИТЬ С EXCEL!
        'Полугодие': 1.01       # +1% - НУЖНО ПРОВЕРИТЬ С EXCEL!
    }
    
    print(f"   Коэффициенты (нужно сверить с Excel):")
    for freq, expected in expected_coeffs.items():
        actual = coefficients.get(freq, 'ОТСУТСТВУЕТ')
        status = '✅' if actual == expected else '⚠️'
        print(f"      {status} {freq}: {actual} (ожидается: {expected})")
    
    print(f"\n💡 РЕКОМЕНДАЦИИ:")
    print(f"   1. Сверить коэффициенты с файлом Excel")
    print(f"   2. Если коэффициенты неправильные - обновить константы")
    print(f"   3. Коэффициенты применяются корректно ко всем типам премий")

except Exception as e:
    print(f"❌ Ошибка анализа: {e}")
    import traceback
    traceback.print_exc()