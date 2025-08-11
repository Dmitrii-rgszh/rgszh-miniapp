import sqlite3
import os

# Проверяем, существует ли файл базы данных
db_file = 'miniapp.db'
if not os.path.exists(db_file):
    print(f'❌ Файл базы данных {db_file} не найден!')
    exit(1)

print(f'✅ Файл базы данных {db_file} найден')

# Проверяем таблицы в базе данных
conn = sqlite3.connect(db_file)
cursor = conn.cursor()

cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()

print('\n🗃️ Таблицы в БД:')
for table in tables:
    print(f'  - {table[0]}')

# Проверяем, есть ли таблицы для калькулятора "На всякий случай"
justincase_tables = [t[0] for t in tables if 'tariff' in t[0].lower() or 'actuarial' in t[0].lower() or 'coefficient' in t[0].lower()]

if justincase_tables:
    print('\n📊 Таблицы калькулятора "На всякий случай":')
    for table in justincase_tables:
        cursor.execute(f"SELECT COUNT(*) FROM {table}")
        count = cursor.fetchone()[0]
        print(f'  - {table}: {count} записей')
else:
    print('\n❌ Таблицы калькулятора "На всякий случай" НЕ НАЙДЕНЫ!')

conn.close()
