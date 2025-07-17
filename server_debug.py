#!/usr/bin/env python3
# server_debug.py
# Диагностический скрипт для проверки серверного окружения

import os
import sys
import logging

print("🔍 === ДИАГНОСТИКА СЕРВЕРНОГО ОКРУЖЕНИЯ ===")
print(f"📁 Рабочая директория: {os.getcwd()}")
print(f"🐍 Python версия: {sys.version}")
print(f"📦 Python executable: {sys.executable}")

# Проверяем Python path
print(f"\n📚 Python path:")
for i, path in enumerate(sys.path):
    print(f"  {i}: {path}")

# Проверяем переменные окружения
print(f"\n🌍 Переменные окружения:")
env_vars = ['PYTHONPATH', 'PATH', 'FLASK_PORT', 'FLASK_ENV']
for var in env_vars:
    value = os.environ.get(var, 'НЕ УСТАНОВЛЕНА')
    print(f"  {var}: {value}")

# Проверяем наличие файлов
print(f"\n📂 ФАЙЛЫ В ТЕКУЩЕЙ ДИРЕКТОРИИ:")
files_to_check = [
    'server.py',
    'justincase_calculator.py', 
    'justincase_routes.py',
    'care_future_models.py',
    'care_future_routes.py'
]

for file in files_to_check:
    if os.path.exists(file):
        size = os.path.getsize(file)
        print(f"  ✅ {file} ({size} bytes)")
    else:
        print(f"  ❌ {file} ОТСУТСТВУЕТ")

# Проверяем импорты по порядку
print(f"\n🔄 ТЕСТИРУЕМ ИМПОРТЫ ПО ПОРЯДКУ:")

# 1. Базовые импорты
print("1. Базовые Python модули:")
try:
    import logging, datetime, typing
    from flask import Flask, Blueprint
    print("  ✅ Базовые модули импортированы")
except Exception as e:
    print(f"  ❌ Ошибка базовых импортов: {e}")

# 2. JustInCase Calculator
print("2. justincase_calculator:")
try:
    from justincase_calculator import JustincaseCalculatorComplete
    print("  ✅ JustincaseCalculatorComplete импортирован")
    
    # Пробуем создать экземпляр
    calculator = JustincaseCalculatorComplete()
    print("  ✅ Экземпляр создан успешно")
except Exception as e:
    print(f"  ❌ Ошибка импорта калькулятора: {e}")
    import traceback
    traceback.print_exc()

# 3. JustInCase Routes  
print("3. justincase_routes:")
try:
    from justincase_routes import register_justincase_routes, justincase_bp
    print("  ✅ justincase_routes импортирован")
except Exception as e:
    print(f"  ❌ Ошибка импорта routes: {e}")
    import traceback
    traceback.print_exc()

# 4. Проверяем зависимости калькулятора
print("4. Зависимости калькулятора:")
required_modules = ['logging', 'datetime', 'typing', 'math']
for module in required_modules:
    try:
        __import__(module)
        print(f"  ✅ {module}")
    except ImportError:
        print(f"  ❌ {module} ОТСУТСТВУЕТ")

# 5. Эмулируем импорт как в server.py
print("\n🚀 ЭМУЛИРУЕМ ИМПОРТ КАК В SERVER.PY:")
JUSTINCASE_AVAILABLE = False
JUSTINCASE_ERROR = None

try:
    print("  🔄 Импортируем justincase_routes...")
    from justincase_routes import register_justincase_routes
    JUSTINCASE_AVAILABLE = True
    JUSTINCASE_ERROR = None
    print("  ✅ Импорт успешен")
except ImportError as e:
    JUSTINCASE_AVAILABLE = False
    JUSTINCASE_ERROR = str(e)
    print(f"  ❌ ImportError: {e}")
except Exception as e:
    JUSTINCASE_AVAILABLE = False
    JUSTINCASE_ERROR = str(e)
    print(f"  ❌ Другая ошибка: {e}")
    import traceback
    traceback.print_exc()

print(f"\n📊 РЕЗУЛЬТАТ:")
print(f"  JUSTINCASE_AVAILABLE = {JUSTINCASE_AVAILABLE}")
print(f"  JUSTINCASE_ERROR = {JUSTINCASE_ERROR}")

# 6. Тест создания Flask приложения
print(f"\n🧪 ТЕСТ СОЗДАНИЯ FLASK ПРИЛОЖЕНИЯ:")
try:
    from flask import Flask
    test_app = Flask(__name__)
    print("  ✅ Flask приложение создано")
    
    if JUSTINCASE_AVAILABLE:
        with test_app.app_context():
            result = register_justincase_routes(test_app)
            print(f"  ✅ Регистрация маршрутов: {result}")
            
            # Проверяем маршруты
            route_count = 0
            proxy_route_found = False
            
            for rule in test_app.url_map.iter_rules():
                if '/api/' in rule.rule:
                    route_count += 1
                    if '/api/proxy/calculator/save' in rule.rule:
                        proxy_route_found = True
            
            print(f"  📍 Найдено API маршрутов: {route_count}")
            print(f"  {'✅' if proxy_route_found else '❌'} /api/proxy/calculator/save найден: {proxy_route_found}")
    else:
        print("  ⚠️ Пропускаем тест маршрутов - JUSTINCASE_AVAILABLE = False")
        
except Exception as e:
    print(f"  ❌ Ошибка создания Flask приложения: {e}")
    import traceback
    traceback.print_exc()

print(f"\n🎯 === ДИАГНОЗ ===")
if JUSTINCASE_AVAILABLE:
    print("✅ Модули доступны - проблема может быть в:")
    print("  - Кэшировании модулей Python")
    print("  - Необходимости перезапуска сервера")
    print("  - Проблемах с регистрацией маршрутов")
else:
    print("❌ Модули недоступны - проблема в:")
    print("  - Отсутствующих зависимостях")
    print("  - Синтаксических ошибках")
    print("  - Проблемах с путями импорта")
    print(f"  - Конкретная ошибка: {JUSTINCASE_ERROR}")

print(f"\n💡 РЕКОМЕНДАЦИИ:")
print("1. Загрузите этот скрипт на сервер")
print("2. Запустите: python server_debug.py")
print("3. Сравните результаты с локальной машиной")
print("4. Исправьте найденные различия")