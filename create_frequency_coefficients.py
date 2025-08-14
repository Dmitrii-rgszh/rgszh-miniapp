# -*- coding: utf-8 -*-
"""
Создание таблицы коэффициентов периодичности взносов для калькулятора "На всякий случай"
"""

import sqlite3
import os

def create_frequency_coefficients_table():
    """Создание и заполнение таблицы коэффициентов частоты платежей"""
    
    # Получаем путь к базе данных
    db_path = os.getenv('DATABASE_URL', 'sqlite:///miniapp.db').replace('sqlite:///', '')
    if not db_path:
        db_path = 'miniapp.db'
    
    print(f"Подключение к базе данных: {db_path}")
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Создаем таблицу коэффициентов частоты
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS justincase_frequency_coefficients (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                payment_frequency TEXT UNIQUE NOT NULL,
                coefficient REAL NOT NULL,
                description TEXT
            )
        """)
        
        # Очищаем таблицу если есть данные
        cursor.execute("DELETE FROM justincase_frequency_coefficients")
        
        # Вставляем коэффициенты согласно требованиям
        frequency_data = [
            ('annual', 1.000, 'Ежегодно'),
            ('semi_annual', 0.5100, 'Раз в пол года'),
            ('quarterly', 0.2575, 'Ежеквартально'),
            ('monthly', 0.0867, 'Ежемесячно')
        ]
        
        cursor.executemany("""
            INSERT INTO justincase_frequency_coefficients 
            (payment_frequency, coefficient, description) 
            VALUES (?, ?, ?)
        """, frequency_data)
        
        conn.commit()
        
        # Проверяем результат
        cursor.execute("SELECT * FROM justincase_frequency_coefficients ORDER BY coefficient DESC")
        results = cursor.fetchall()
        
        print("\n✅ Таблица коэффициентов частоты создана успешно!")
        print("\nКоэффициенты периодичности взносов:")
        for row in results:
            print(f"  {row[3]}: {row[1]} = {row[2]}")
        
        return True
        
    except Exception as e:
        print(f"❌ Ошибка создания таблицы коэффициентов: {e}")
        return False
        
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    success = create_frequency_coefficients_table()
    if success:
        print("\n🎉 Коэффициенты периодичности взносов успешно загружены!")
    else:
        print("\n💥 Не удалось загрузить коэффициенты")
