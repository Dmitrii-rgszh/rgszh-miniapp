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
    if os.path.exists('.env.disabled'):
        os.remove('.env.disabled')
    os.rename('.env', '.env.disabled')

try:
    # Загружаем локальные переменные окружения
    load_dotenv('.env.local')
    
    # Принудительно устанавливаем локальные настройки БД (PostgreSQL для questionnaire)
    os.environ['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:secret@localhost:5432/miniapp'
    os.environ['DATABASE_URL'] = 'postgresql://postgres:secret@localhost:5432/miniapp'
    os.environ['DB_HOST'] = 'localhost'
    os.environ['DB_PORT'] = '5432'
    os.environ['DB_USER'] = 'postgres'
    os.environ['DB_PASSWORD'] = 'secret'
    os.environ['DB_NAME'] = 'miniapp'
    os.environ['REDIS_URL'] = 'redis://localhost:6379/0'
    
    print("🔧 Локальные переменные окружения установлены:")
    print(f"   БД: {os.environ.get('SQLALCHEMY_DATABASE_URI')}")
    print(f"   Redis: {os.environ.get('REDIS_URL', 'redis://localhost:6379/0')}")
    
    # Импортируем и запускаем сервер
    from server import app
    
    # Настройки для разработки
    app.config['DEBUG'] = True
    app.config['ENV'] = 'development'
    
    if __name__ == '__main__':
        print("🚀 Запускаем локальный сервер на порту 5000...")
        app.run(host='0.0.0.0', port=5000, debug=True)
        
finally:
    # Восстанавливаем .env если он был переименован
    if os.path.exists('.env.disabled') and not os.path.exists('.env'):
        os.rename('.env.disabled', '.env')
