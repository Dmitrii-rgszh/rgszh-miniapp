#!/usr/bin/env python3
# diagnostic.py - Скрипт для диагностики проблем с сервером

import os
import sys
import psutil
import requests
from pathlib import Path

def check_environment():
    """Проверяет переменные окружения"""
    print("🔍 Проверка переменных окружения:")
    
    env_vars = [
        'SQLALCHEMY_DATABASE_URI',
        'DATABASE_URL', 
        'FLASK_PORT',
        'FLASK_ENV'
    ]
    
    for var in env_vars:
        value = os.getenv(var)
        if value:
            # Скрываем пароли в URL
            if 'postgresql://' in str(value):
                masked = value.split('@')[1] if '@' in value else value
                print(f"  ✅ {var}: postgresql://***@{masked}")
            else:
                print(f"  ✅ {var}: {value}")
        else:
            print(f"  ❌ {var}: НЕ УСТАНОВЛЕНА")

def check_ports():
    """Проверяет какие порты заняты"""
    print("\n🔍 Проверка занятых портов:")
    
    ports_to_check = [3000, 4000, 5000, 5432, 1112]
    
    for port in ports_to_check:
        connections = [conn for conn in psutil.net_connections() 
                      if conn.laddr.port == port and conn.status == 'LISTEN']
        
        if connections:
            for conn in connections:
                try:
                    process = psutil.Process(conn.pid)
                    print(f"  ✅ Порт {port}: {process.name()} (PID: {conn.pid})")
                except:
                    print(f"  ✅ Порт {port}: Занят (PID: {conn.pid})")
        else:
            print(f"  ❌ Порт {port}: Свободен")

def check_files():
    """Проверяет наличие важных файлов"""
    print("\n🔍 Проверка файлов:")
    
    files_to_check = [
        'server.py',
        'requirements.txt',
        '.env',
        'assessment_routes.py',
        'db_saver.py',
        'assessment_schema.sql',
        'assessment_questions.sql',
        'src/config.js',
        'src/setupProxy.js'
    ]
    
    for file_path in files_to_check:
        if os.path.exists(file_path):
            size = os.path.getsize(file_path)
            print(f"  ✅ {file_path}: {size} байт")
        else:
            print(f"  ❌ {file_path}: НЕ НАЙДЕН")

def test_server_connection():
    """Тестирует подключение к серверу"""
    print("\n🔍 Тестирование подключения к серверу:")
    
    urls_to_test = [
        'http://localhost:4000/api/health',
        'http://localhost:4000/api/questionnaire/1',
        'http://localhost:5000/api/health',  # на случай если сервер все еще на 5000
        'http://localhost:5000/api/questionnaire/1'
    ]
    
    for url in urls_to_test:
        try:
            response = requests.get(url, timeout=5)
            print(f"  ✅ {url}: {response.status_code}")
            if response.status_code == 200:
                print(f"     Ответ: {response.text[:100]}...")
        except requests.exceptions.ConnectionError:
            print(f"  ❌ {url}: CONNECTION REFUSED")
        except requests.exceptions.Timeout:
            print(f"  ⏰ {url}: TIMEOUT")
        except Exception as e:
            print(f"  ❌ {url}: {e}")

def check_database_connection():
    """Проверяет подключение к базе данных"""
    print("\n🔍 Проверка подключения к БД:")
    
    try:
        import psycopg2
        
        db_uri = os.getenv('SQLALCHEMY_DATABASE_URI') or os.getenv('DATABASE_URL')
        if not db_uri:
            print("  ❌ Нет настроек БД")
            return
            
        # Парсим URI
        if db_uri.startswith('postgresql://'):
            print(f"  📍 Подключение к: {db_uri.split('@')[1] if '@' in db_uri else 'локальная БД'}")
            
            try:
                conn = psycopg2.connect(db_uri)
                cursor = conn.cursor()
                cursor.execute('SELECT version();')
                version = cursor.fetchone()[0]
                print(f"  ✅ PostgreSQL подключен: {version[:50]}...")
                
                # Проверяем таблицы assessment
                cursor.execute("""
                    SELECT table_name FROM information_schema.tables 
                    WHERE table_schema = 'public' AND table_name LIKE 'assessment%';
                """)
                tables = cursor.fetchall()
                if tables:
                    print(f"  ✅ Таблицы assessment найдены: {[t[0] for t in tables]}")
                else:
                    print("  ⚠️  Таблицы assessment не найдены")
                
                cursor.close()
                conn.close()
                
            except Exception as e:
                print(f"  ❌ Ошибка подключения к БД: {e}")
        
    except ImportError:
        print("  ❌ psycopg2 не установлен")

def main():
    print("🚀 Диагностика сервера Telegram MiniApp")
    print("=" * 50)
    
    check_environment()
    check_files()
    check_ports()
    check_database_connection()
    test_server_connection()
    
    print("\n" + "=" * 50)
    print("💡 Рекомендации:")
    print("1. Убедитесь что server.py запущен: python server.py")
    print("2. Проверьте .env файл с настройками БД")
    print("3. Установите зависимости: pip install -r requirements.txt")
    print("4. Обновите setupProxy.js на порт 4000")

if __name__ == "__main__":
    main()