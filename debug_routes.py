#!/usr/bin/env python3
# debug_routes.py - Простая диагностика проблемы

print("🔍 === ДИАГНОСТИКА ПРОБЛЕМЫ ===")

# 1. Проверяем файлы
import os
print("\n📂 Проверка файлов:")
files = ['server.py', 'justincase_calculator.py', 'justincase_routes.py']
for file in files:
    status = "✅" if os.path.exists(file) else "❌"
    print(f"  {status} {file}")

# 2. Пробуем импорты
print("\n🔄 Проверка импортов:")
try:
    from justincase_calculator import JustincaseCalculatorComplete
    print("  ✅ justincase_calculator - OK")
    calc_ok = True
except Exception as e:
    print(f"  ❌ justincase_calculator - ОШИБКА: {e}")
    calc_ok = False

try:
    from justincase_routes import register_justincase_routes
    print("  ✅ justincase_routes - OK")
    routes_ok = True
except Exception as e:
    print(f"  ❌ justincase_routes - ОШИБКА: {e}")
    routes_ok = False

# 3. Тестируем калькулятор
if calc_ok:
    print("\n⚙️ Тест калькулятора:")
    try:
        calculator = JustincaseCalculatorComplete()
        test_data = {
            'birthDate': '1990-01-01',
            'gender': 'male',
            'insuranceInfo': 'yes',
            'insuranceTerm': '5',
            'insuranceSum': '1000000'
        }
        is_valid, errors = calculator.validate_input_data(test_data)
        if is_valid:
            result = calculator.calculate_full_program(test_data)
            premium = result['annualPremium']
            print(f"  ✅ Калькулятор работает: премия {premium:,} руб.")
        else:
            print(f"  ❌ Ошибки валидации: {errors}")
    except Exception as e:
        print(f"  ❌ Ошибка калькулятора: {e}")

# 4. Проверяем сервер
print("\n🌐 Проверка сервера:")
try:
    import requests
    response = requests.get('http://localhost:4000/api/justincase/status', timeout=5)
    print(f"  ✅ Сервер отвечает: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"  📊 Статус: {data.get('data', {}).get('status', 'unknown')}")
except Exception as e:
    print(f"  ❌ Сервер недоступен: {e}")

print("\n🎯 === РЕЗУЛЬТАТ ===")
if calc_ok and routes_ok:
    print("✅ Модули в порядке - проблема в сервере")
    print("📝 Нужно исправить server.py")
else:
    print("❌ Проблема с модулями")
    print("📝 Нужно исправить импорты")