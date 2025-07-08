# test_imports.py
# Диагностика импортов калькулятора

import sys
import os

print("🔍 Диагностика импортов калькулятора НСЖ")
print("-" * 50)

print(f"📁 Текущая директория: {os.getcwd()}")
print(f"🐍 Python версия: {sys.version}")

# Проверяем наличие файлов
files_to_check = [
    'care_future_models.py',
    'care_future_routes.py', 
    'care_future_schema.sql',
    'care_future_data.sql'
]

print(f"\n📋 Проверка файлов:")
for file in files_to_check:
    exists = os.path.exists(file)
    size = os.path.getsize(file) if exists else 0
    status = "✅" if exists else "❌"
    print(f"  {status} {file} ({size} bytes)")

# Проверяем зависимости
print(f"\n📦 Проверка зависимостей:")
dependencies = ['flask', 'sqlalchemy', 'psycopg2']

for dep in dependencies:
    try:
        __import__(dep)
        print(f"  ✅ {dep}")
    except ImportError as e:
        print(f"  ❌ {dep}: {e}")

# Проверяем импорт моделей
print(f"\n🧪 Тест импорта модулей:")

try:
    import care_future_models
    print(f"  ✅ care_future_models импортирован")
    
    # Проверяем основные классы
    classes_to_check = ['NSJCalculator', 'NSJDataManager', 'CalculationInput']
    for cls_name in classes_to_check:
        if hasattr(care_future_models, cls_name):
            print(f"    ✅ {cls_name} найден")
        else:
            print(f"    ❌ {cls_name} не найден")
            
except ImportError as e:
    print(f"  ❌ care_future_models: {e}")
except Exception as e:
    print(f"  ⚠️ care_future_models (другая ошибка): {e}")

try:
    import care_future_routes
    print(f"  ✅ care_future_routes импортирован")
    
    # Проверяем функцию инициализации
    if hasattr(care_future_routes, 'init_care_future_routes'):
        print(f"    ✅ init_care_future_routes найдена")
    else:
        print(f"    ❌ init_care_future_routes не найдена")
        
except ImportError as e:
    print(f"  ❌ care_future_routes: {e}")
except Exception as e:
    print(f"  ⚠️ care_future_routes (другая ошибка): {e}")

# Проверяем db_saver
try:
    import db_saver
    print(f"  ✅ db_saver импортирован")
except ImportError as e:
    print(f"  ❌ db_saver: {e}")

print("-" * 50)
print("🎯 Рекомендации:")

# Проверяем основные проблемы
missing_deps = []
for dep in dependencies:
    try:
        __import__(dep)
    except ImportError:
        missing_deps.append(dep)

if missing_deps:
    print(f"1. Установите зависимости: pip install {' '.join(missing_deps)}")

if not os.path.exists('care_future_models.py'):
    print("2. Файл care_future_models.py отсутствует")

try:
    import care_future_models
    print("3. Попробуйте запустить: python init_care_future.py")
except:
    print("3. Сначала исправьте ошибки импорта, затем запустите: python init_care_future.py")

print("4. После исправления перезапустите сервер: python server.py")
print("-" * 50)