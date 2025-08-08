import os
import psycopg2

# Устанавливаем переменные кодировки
os.environ['PYTHONIOENCODING'] = 'utf-8'
os.environ['LC_ALL'] = 'C.UTF-8'
os.environ['LANG'] = 'C.UTF-8'

try:
    print("🔄 Проверка подключения к PostgreSQL...")
    
    # Простое подключение
    conn = psycopg2.connect(
        host='localhost',
        port=5432,
        database='miniapp',
        user='postgres',
        password='secret',
        client_encoding='utf8'
    )
    
    cursor = conn.cursor()
    cursor.execute('SELECT version();')
    version = cursor.fetchone()
    print(f"✅ PostgreSQL версия: {version[0]}")
    
    cursor.execute('SHOW client_encoding;')
    encoding = cursor.fetchone()
    print(f"✅ Кодировка клиента: {encoding[0]}")
    
    cursor.close()
    conn.close()
    
    print("✅ Подключение к PostgreSQL успешно!")
    
except Exception as e:
    print(f"❌ Ошибка подключения: {e}")
