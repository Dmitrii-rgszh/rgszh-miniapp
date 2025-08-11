import sqlite3

try:
    conn = sqlite3.connect('miniapp.db')
    cursor = conn.cursor()
    
    # Проверяем какие таблицы есть
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = cursor.fetchall()
    print('Таблицы в базе данных:')
    for table in tables:
        print(f'  {table[0]}')
    
    # Если есть таблица justincase_base_tariffs, проверяем её структуру
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='justincase_base_tariffs'")
    if cursor.fetchone():
        print('\nСтруктура таблицы justincase_base_tariffs:')
        cursor.execute("PRAGMA table_info(justincase_base_tariffs)")
        columns = cursor.fetchall()
        for col in columns:
            print(f'  {col[1]} - {col[2]}')
        
        # Проверяем несколько записей
        print('\nПример записей:')
        cursor.execute("SELECT * FROM justincase_base_tariffs LIMIT 3")
        rows = cursor.fetchall()
        for row in rows:
            print(f'  {row}')
    else:
        print('\nТаблица justincase_base_tariffs не найдена!')
    
    conn.close()
    
except Exception as e:
    print(f"Ошибка: {e}")
