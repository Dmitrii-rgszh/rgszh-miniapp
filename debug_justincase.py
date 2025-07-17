#!/usr/bin/env python3
# debug_justincase.py
# Диагностика проблем с JustInCase калькулятором

import os
import sys
import logging

print("🔍 === ДИАГНОСТИКА JUSTINCASE КАЛЬКУЛЯТОРА ===")
print(f"📁 Текущая директория: {os.getcwd()}")
print(f"🐍 Python версия: {sys.version}")

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
    print(f"  {'✅' if exists else '❌'} {file} ({size} bytes)")

# 2. Проверяем импорт justincase_calculator
print("\n🔄 ТЕСТИРУЕМ ИМПОРТ JUSTINCASE_CALCULATOR:")
try:
    from justincase_calculator import JustincaseCalculatorComplete
    print("  ✅ JustincaseCalculatorComplete импортирован успешно")
    
    # Тестируем создание экземпляра
    try:
        calculator = JustincaseCalculatorComplete()
        print("  ✅ Экземпляр калькулятора создан успешно")
        
        # Тестируем базовую функциональность
        try:
            info = calculator.get_calculator_info()
            print(f"  ✅ Калькулятор инициализирован: {info['name']}")
            print(f"     Версия: {info['version']}")
            print(f"     Актуарные таблицы: {info['features']['actuarial_tables']}")
        except Exception as e:
            print(f"  ⚠️ Ошибка получения информации о калькуляторе: {e}")
            
    except Exception as e:
        print(f"  ❌ Ошибка создания экземпляра калькулятора: {e}")
        print(f"     Тип ошибки: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        
except ImportError as e:
    print(f"  ❌ ImportError: {e}")
    print(f"     Модуль не найден или содержит синтаксические ошибки")
except Exception as e:
    print(f"  ❌ Другая ошибка импорта: {e}")
    print(f"     Тип ошибки: {type(e).__name__}")
    import traceback
    traceback.print_exc()

# 3. Проверяем импорт justincase_routes
print("\n🔄 ТЕСТИРУЕМ ИМПОРТ JUSTINCASE_ROUTES:")
try:
    from justincase_routes import register_justincase_routes, justincase_bp
    print("  ✅ justincase_routes импортирован успешно")
    print(f"  ✅ Blueprint justincase_bp найден: {justincase_bp}")
    print(f"  ✅ Функция register_justincase_routes найдена: {register_justincase_routes}")
except ImportError as e:
    print(f"  ❌ ImportError: {e}")
except Exception as e:
    print(f"  ❌ Другая ошибка импорта: {e}")
    import traceback
    traceback.print_exc()

# 4. Тестируем регистрацию маршрутов
print("\n🧪 ТЕСТИРУЕМ РЕГИСТРАЦИЮ МАРШРУТОВ:")
try:
    from flask import Flask
    
    # Создаем тестовое приложение
    test_app = Flask(__name__)
    print("  ✅ Тестовое Flask приложение создано")
    
    # Тестируем регистрацию
    from justincase_routes import register_justincase_routes
    
    with test_app.app_context():
        result = register_justincase_routes(test_app)
        print(f"  {'✅' if result else '❌'} Регистрация маршрутов: {result}")
        
        # Проверяем зарегистрированные маршруты
        routes = []
        for rule in test_app.url_map.iter_rules():
            if '/api/proxy/calculator/save' in rule.rule or '/api/justincase' in rule.rule:
                routes.append(f"{rule.methods} {rule.rule}")
        
        print(f"  📍 Найдено {len(routes)} API маршрутов:")
        for route in routes:
            print(f"     - {route}")
            
        # Специально проверяем наш проблемный endpoint
        has_main_endpoint = any('/api/proxy/calculator/save' in rule.rule for rule in test_app.url_map.iter_rules())
        print(f"  {'✅' if has_main_endpoint else '❌'} Основной endpoint /api/proxy/calculator/save зарегистрирован: {has_main_endpoint}")
        
except Exception as e:
    print(f"  ❌ Ошибка тестирования регистрации: {e}")
    import traceback
    traceback.print_exc()

# 5. Проверяем переменные состояния
print("\n🔧 ПРОВЕРЯЕМ ПЕРЕМЕННЫЕ СОСТОЯНИЯ:")
try:
    # Эмулируем импорт как в server.py
    JUSTINCASE_AVAILABLE = False
    JUSTINCASE_ERROR = None
    
    try:
        from justincase_routes import register_justincase_routes
        JUSTINCASE_AVAILABLE = True
        JUSTINCASE_ERROR = None
        print("  ✅ JUSTINCASE_AVAILABLE = True")
    except ImportError as e:
        JUSTINCASE_AVAILABLE = False
        JUSTINCASE_ERROR = str(e)
        print(f"  ❌ JUSTINCASE_AVAILABLE = False")
        print(f"     JUSTINCASE_ERROR = {JUSTINCASE_ERROR}")
    except Exception as e:
        JUSTINCASE_AVAILABLE = False
        JUSTINCASE_ERROR = str(e)
        print(f"  ❌ JUSTINCASE_AVAILABLE = False")
        print(f"     JUSTINCASE_ERROR = {JUSTINCASE_ERROR}")
        
except Exception as e:
    print(f"  ❌ Ошибка проверки переменных: {e}")

# 6. Тестируем простой расчет
print("\n🧮 ТЕСТИРУЕМ ПРОСТОЙ РАСЧЕТ:")
try:
    from justincase_calculator import JustincaseCalculatorComplete
    
    calculator = JustincaseCalculatorComplete()
    
    test_data = {
        'birthDate': '1990-01-01',
        'gender': 'male',
        'insuranceInfo': 'yes',
        'insuranceTerm': '5',
        'insuranceSum': '1000000',
        'insuranceFrequency': 'Ежегодно',
        'accidentPackage': False,
        'criticalPackage': False,
        'sportPackage': False
    }
    
    # Валидация
    is_valid, errors = calculator.validate_input_data(test_data)
    print(f"  {'✅' if is_valid else '❌'} Валидация: {is_valid}")
    if errors:
        print(f"     Ошибки: {errors}")
    
    if is_valid:
        # Расчет
        result = calculator.calculate_full_program(test_data)
        premium = result.get('annualPremium', 0)
        print(f"  ✅ Расчет выполнен: премия {premium:,} руб.")
    
except Exception as e:
    print(f"  ❌ Ошибка тестового расчета: {e}")
    import traceback
    traceback.print_exc()

print("\n🎯 === ЗАКЛЮЧЕНИЕ ===")
print("Если все тесты выше прошли успешно, но endpoint не работает,")
print("проблема может быть в:")
print("1. Конфликте имен маршрутов")
print("2. Порядке регистрации маршрутов в server.py")
print("3. Проблемах с CORS")
print("4. Кэшировании в браузере")

print("\n💡 РЕКОМЕНДАЦИИ:")
print("1. Перезапустите сервер полностью")
print("2. Очистите кэш браузера")
print("3. Проверьте консоль браузера на ошибки")
print("4. Попробуйте обратиться к /api/justincase/status для проверки")