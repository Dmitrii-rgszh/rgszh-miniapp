import os
import shutil
from dotenv import load_dotenv

# Устанавливаем переменные кодировки для Python
os.environ['PYTHONIOENCODING'] = 'utf-8'
os.environ['LC_ALL'] = 'C.UTF-8'
os.environ['LANG'] = 'C.UTF-8'

# Временно переименовываем .env чтобы он не загружался
if os.path.exists('.env'):
    shutil.copy('.env', '.env.backup')
    os.rename('.env', '.env.disabled')

try:
    # Загружаем локальные переменные окружения
    load_dotenv('.env.local')
    
    # Принудительно устанавливаем локальные настройки БД (SQLite для простоты)
    os.environ['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///miniapp_local.db'
    os.environ['DATABASE_URL'] = 'sqlite:///miniapp_local.db'
    os.environ['DB_HOST'] = 'localhost'
    os.environ['DB_PORT'] = '5432'
    os.environ['DB_USER'] = 'postgres'
    os.environ['DB_PASSWORD'] = 'secret'
    os.environ['DB_NAME'] = 'miniapp'
    
    print("🔧 Локальные переменные окружения установлены:")
    print(f"   БД: {os.environ.get('SQLALCHEMY_DATABASE_URI')}")
    print(f"   Redis: {os.environ.get('REDIS_URL', 'redis://localhost:6379/0')}")
    
    # Теперь запускаем сервер
    import server
    
    # Запускаем сервер вручную, т.к. мы импортируем его как модуль
    port = int(os.environ.get("FLASK_PORT", "5000"))
    print(f"🚀 Запускаем локальный сервер на порту {port}...")
    server.socketio.run(server.app, host='127.0.0.1', port=port, debug=True)
    
finally:
    # Восстанавливаем .env файл
    if os.path.exists('.env.disabled'):
        os.rename('.env.disabled', '.env')
