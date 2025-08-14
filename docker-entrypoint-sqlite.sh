#!/bin/bash
# docker-entrypoint.sh - Принудительное использование SQLite

set -e

echo "🚀 Starting MiniApp Server Container with SQLite..."

# Принудительно используем SQLite вместо PostgreSQL
export SQLALCHEMY_DATABASE_URI=""
export DATABASE_URL=""

echo "🗄️ Using SQLite database: /app/miniapp.db"

# Проверяем наличие файла базы данных
if [ -f "/app/miniapp.db" ]; then
    echo "✅ SQLite database found: $(du -h /app/miniapp.db)"
    
    # Проверяем таблицы в базе данных
    echo "📊 Checking database tables..."
    python3 -c "
import sqlite3
import os

db_path = '/app/miniapp.db'
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute('SELECT name FROM sqlite_master WHERE type=\"table\"')
    tables = cursor.fetchall()
    
    print('📋 Available tables:')
    for table in tables:
        table_name = table[0]
        cursor.execute(f'SELECT COUNT(*) FROM {table_name}')
        count = cursor.fetchone()[0]
        print(f'  - {table_name}: {count:,} records')
    
    conn.close()
    print('✅ Database validation complete')
else:
    print('❌ SQLite database not found!')
"
else
    echo "❌ SQLite database file not found!"
    exit 1
fi

# Запускаем приложение
echo "🚀 Starting Python server..."
exec python server.py
