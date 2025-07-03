#!/bin/bash
# docker-entrypoint.sh - Упрощенный скрипт запуска (БД уже работает на ВМ)

set -e

echo "🚀 Starting MiniApp Server Container..."

# Проверяем подключение к внешней БД
echo "🔍 Checking database connection..."
python -c "
import psycopg2
import os
from urllib.parse import urlparse

def test_db_connection():
    try:
        db_url = os.getenv('SQLALCHEMY_DATABASE_URI')
        if not db_url:
            print('❌ SQLALCHEMY_DATABASE_URI not set')
            return False
        
        print(f'📡 Connecting to: {db_url.split(\"@\")[1] if \"@\" in db_url else \"database\"}')
        
        parsed = urlparse(db_url)
        conn = psycopg2.connect(
            host=parsed.hostname,
            port=parsed.port,
            user=parsed.username,
            password=parsed.password,
            database=parsed.path[1:]
        )
        
        cur = conn.cursor()
        cur.execute('SELECT version();')
        version = cur.fetchone()[0]
        print(f'✅ Connected to PostgreSQL: {version[:50]}...')
        
        conn.close()
        return True
        
    except Exception as e:
        print(f'❌ Database connection failed: {e}')
        return False

if not test_db_connection():
    print('💡 Make sure PostgreSQL is running and accessible from container')
    exit(1)
"

# Проверяем, нужна ли инициализация assessment таблиц
echo "🔍 Checking assessment tables..."
python -c "
import os
import psycopg2
from urllib.parse import urlparse

def check_assessment_tables():
    try:
        db_url = os.getenv('SQLALCHEMY_DATABASE_URI')
        parsed = urlparse(db_url)
        
        conn = psycopg2.connect(
            host=parsed.hostname,
            port=parsed.port,
            user=parsed.username,
            password=parsed.password,
            database=parsed.path[1:]
        )
        
        cur = conn.cursor()
        
        # Проверяем основные таблицы assessment
        tables_to_check = ['questionnaires', 'questions', 'question_options', 'assessment_candidates']
        missing_tables = []
        
        for table in tables_to_check:
            cur.execute(f\"SELECT COUNT(*) FROM information_schema.tables WHERE table_name = '{table}'\")
            count = cur.fetchone()[0]
            if count == 0:
                missing_tables.append(table)
        
        if missing_tables:
            print(f'📋 Missing assessment tables: {missing_tables}')
            print('🔧 Need to initialize assessment database')
            conn.close()
            exit(1)
        else:
            # Проверяем есть ли данные в questionnaires
            cur.execute('SELECT COUNT(*) FROM questionnaires WHERE id = 1')
            count = cur.fetchone()[0]
            if count == 0:
                print('📋 Assessment tables exist but empty')
                print('🔧 Need to populate assessment data')
                conn.close()
                exit(1)
            else:
                print('✅ Assessment database is ready')
                conn.close()
                exit(0)
            
    except Exception as e:
        print(f'📋 Assessment database check failed: {e}')
        print('🔧 Will initialize assessment database')
        exit(1)
"

# Если код выше вернул 1, инициализируем assessment таблицы
if [ $? -eq 1 ]; then
    echo "🔧 Initializing assessment database..."
    python init_assessment_db.py
    
    if [ $? -eq 0 ]; then
        echo "✅ Assessment database initialized successfully"
    else
        echo "❌ Assessment database initialization failed"
        exit 1
    fi
fi

echo "🌟 Starting Flask server on port ${PORT:-4000}..."
exec python server.py