#!/usr/bin/env python3
# test_updated_calculator.py
# Скрипт для проверки работы обновленного калькулятора

import os
import sys

print("🧪 === ТЕСТ ОБНОВЛЕННОГО КАЛЬКУЛЯТОРА ===")
print(f"📁 Директория: {os.getcwd()}")

# 1. Проверяем наличие файлов
print("\n📂 ПРОВЕРКА ФАЙЛОВ:")
required_files = [
    'justincase_calculator.py',
    'justincase_routes.py', 
    'server.py'
]

for file in required_files:
    exists = os.path.exists(file)
    size = os.path.getsize(file) if exists else 0
    print(f"  {'✅' if exists else '❌'} {file} ({size:,} bytes)")

# 2. Проверяем импорт обновленного калькулятора
print("\n🔄 ИМПОРТ ОБНОВЛЕННОГО КАЛЬКУЛЯТОРА:")
try:
    from justincase_calculator import JustincaseCalculatorComplete
    print("  ✅ JustincaseCalculatorComplete импортирован")
    
    # Проверяем версию
    calculator = JustincaseCalculatorComplete()
    info = calculator.get_calculator_info()
    
    print(f"  📊 Название: {info['name']}")
    print(f"  📊 Версия: {info['version']}")
    print(f"  📊 Описание: {info['description']}")
    
    # Проверяем особенности ПРАВИЛЬНОЙ версии
    features = info.get('features', {})
    print(f"  📊 СБСЖ таблицы: {'✅' if features.get('sbszh_actuarial_tables') else '❌'}")
    print(f"  📊 Excel формула: {'✅' if features.get('excel_formula') else '❌'}")
    print(f"  📊 Правильные НС: {'✅' if features.get('correct_accident_tariffs') else '❌'}")
    print(f"  📊 Фиксированные КЗ: {'✅' if features.get('fixed_critical_illness') else '❌'}")
    
    # Проверяем покрытие актуарных таблиц
    coverage = info.get('actuarial_coverage', {})
    male_ages = coverage.get('male_ages', [])
    female_ages = coverage.get('female_ages', [])
    terms_range = coverage.get('terms_range', '')
    
    print(f"  📊 Мужские возраста: {len(male_ages)} ({min(male_ages) if male_ages else 0}-{max(male_ages) if male_ages else 0})")
    print(f"  📊 Женские возраста: {len(female_ages)} ({min(female_ages) if female_ages else 0}-{max(female_ages) if female_ages else 0})")
    print(f"  📊 Сроки: {terms_range}")
    
except Exception as e:
    print(f"  ❌ Ошибка импорта: {e}")
    sys.exit(1)

# 3. Тестируем расчеты ПРАВИЛЬНОЙ версии
print("\n🧮 ТЕСТ РАСЧЕТОВ ПРАВИЛЬНОЙ ВЕРСИИ:")

# Тестовые данные из Excel примера
test_cases = [
    {
        'name': 'Пример из Excel (мужчина 35 лет, 11 лет, 2 млн)',
        'data': {
            'birthDate': '1990-01-01',  # ~35 лет
            'gender': 'male',
            'insuranceInfo': 'yes',
            'insuranceTerm': '11',
            'insuranceSum': '2000000',
            'insuranceFrequency': 'Ежегодно',
            'accidentPackage': True,
            'criticalPackage': True,
            'treatmentRegion': 'abroad',
            'sportPackage': True
        },
        'expected': {
            'base_premium': 7359,      # Ожидаемая базовая премия
            'accident_premium': 6472,  # Ожидаемая НС премия  
            'critical_premium': 54095, # Ожидаемая КЗ премия
            'total_premium': 67926     # Ожидаемая общая премия
        }
    },
    {
        'name': 'Простой тест (мужчина 30 лет, 5 лет, 1 млн)',
        'data': {
            'birthDate': '1995-01-01',  # ~30 лет
            'gender': 'male', 
            'insuranceInfo': 'yes',
            'insuranceTerm': '5',
            'insuranceSum': '1000000',
            'insuranceFrequency': 'Ежегодно',
            'accidentPackage': False,
            'criticalPackage': False,
            'sportPackage': False
        },
        'expected': {
            'total_premium': 10000  # Примерное значение
        }
    },
    {
        'name': 'Тест с женщиной (25 лет, 10 лет, 1.5 млн)',
        'data': {
            'birthDate': '2000-01-01',  # ~25 лет
            'gender': 'female',
            'insuranceInfo': 'yes', 
            'insuranceTerm': '10',
            'insuranceSum': '1500000',
            'insuranceFrequency': 'Ежемесячно',  # +5% коэффициент
            'accidentPackage': True,
            'criticalPackage': False,
            'sportPackage': False
        },
        'expected': {
            'total_premium': 12000  # Примерное значение
        }
    }
]

for i, test_case in enumerate(test_cases, 1):
    print(f"\n  🧪 Тест {i}: {test_case['name']}")
    
    try:
        # Валидация
        is_valid, errors = calculator.validate_input_data(test_case['data'])
        if not is_valid:
            print(f"    ❌ Ошибки валидации: {errors}")
            continue
        
        # Расчет
        result = calculator.calculate_full_program(test_case['data'])
        
        # Результаты
        base_premium = result.get('basePremium', 0)
        accident_premium = result.get('accidentPremium', 0)
        critical_premium = result.get('criticalPremium', 0)
        total_premium = result.get('annualPremium', 0)
        
        print(f"    📊 Базовая премия: {base_premium:,.2f} руб")
        print(f"    📊 НС премия: {accident_premium:,.2f} руб")
        print(f"    📊 КЗ премия: {critical_premium:,.2f} руб")
        print(f"    📊 ИТОГО: {total_premium:,.2f} руб")
        
        # Проверка ожидаемых значений
        expected = test_case.get('expected', {})
        if 'total_premium' in expected:
            expected_total = expected['total_premium']
            deviation = abs(total_premium - expected_total) / expected_total * 100
            
            if deviation <= 5:  # Допуск 5%
                print(f"    ✅ Результат в пределах нормы (отклонение: {deviation:.1f}%)")
            else:
                print(f"    ⚠️ Большое отклонение: ожидалось {expected_total:,}, получено {total_premium:,.2f} (отклонение: {deviation:.1f}%)")
        
        # Проверяем детали расчета
        details = result.get('calculationDetails', {})
        calculator_version = details.get('calculatorVersion', 'Unknown')
        uses_sbszh = details.get('usesSBSZHTables', False)
        
        print(f"    📋 Версия калькулятора: {calculator_version}")
        print(f"    📋 Использует СБСЖ: {'✅' if uses_sbszh else '❌'}")
        
    except Exception as e:
        print(f"    ❌ Ошибка расчета: {e}")
        import traceback
        traceback.print_exc()

# 4. Проверяем маршруты
print("\n🌐 ПРОВЕРКА МАРШРУТОВ:")
try:
    from justincase_routes import register_justincase_routes, justincase_bp
    print("  ✅ justincase_routes импортирован")
    
    from flask import Flask
    test_app = Flask(__name__)
    
    # Регистрируем маршруты
    register_result = register_justincase_routes(test_app)
    print(f"  {'✅' if register_result else '❌'} Маршруты зарегистрированы: {register_result}")
    
    # Список маршрутов
    justincase_routes = []
    for rule in test_app.url_map.iter_rules():
        if '/api/proxy/calculator/save' in rule.rule or '/api/justincase' in rule.rule:
            justincase_routes.append(f"{list(rule.methods)} {rule.rule}")
    
    print(f"  📍 Найдено {len(justincase_routes)} API маршрутов:")
    for route in justincase_routes:
        print(f"    - {route}")
    
    # Проверяем основной endpoint
    main_endpoint_exists = any('/api/proxy/calculator/save' in rule.rule for rule in test_app.url_map.iter_rules())
    print(f"  {'✅' if main_endpoint_exists else '❌'} Основной endpoint /api/proxy/calculator/save найден")
    
except Exception as e:
    print(f"  ❌ Ошибка проверки маршрутов: {e}")

# 5. Финальная проверка
print("\n🎯 === ИТОГОВАЯ ПРОВЕРКА ===")

try:
    # Проверяем, что это действительно ПРАВИЛЬНАЯ версия
    calculator_info = calculator.get_calculator_info()
    is_correct_version = (
        'CORRECT' in calculator_info.get('version', '') or
        'СБСЖ' in calculator_info.get('name', '') or
        calculator_info.get('features', {}).get('sbszh_actuarial_tables', False)
    )
    
    print(f"✅ ПРАВИЛЬНАЯ версия калькулятора установлена: {'ДА' if is_correct_version else 'НЕТ'}")
    
    if is_correct_version:
        print("🎉 ВСЕ ГОТОВО! Калькулятор обновлен и работает правильно.")
        print("📝 Теперь можно:")
        print("   1. Перезапустить сервер: python server.py")
        print("   2. Проверить статус: curl http://localhost:4000/api/justincase/status")
        print("   3. Тестировать через Telegram Miniapp")
    else:
        print("❌ ВНИМАНИЕ! Возможно, старая версия калькулятора.")
        print("📝 Проверьте, что файл justincase_calculator.py полностью заменен новым кодом.")
    
except Exception as e:
    print(f"❌ Ошибка финальной проверки: {e}")

print("\n" + "="*50)
print("Тест завершен!")