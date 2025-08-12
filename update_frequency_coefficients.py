#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Обновление коэффициентов периодичности в базе данных
"""

import sqlite3
import os

def update_frequency_coefficients():
    """Обновляет коэффициенты периодичности согласно таблице Excel"""
    
    db_path = 'miniapp.db'
    
    # Коэффициенты из приложенной таблицы
    coefficients = [
        ('annual', 1.0000),      # Ежегодно
        ('semi_annual', 0.5100), # Раз в полгода  
        ('quarterly', 0.2575),   # Ежеквартально
        ('monthly', 0.0867)      # Ежемесячно
    ]
    
    print("🔄 Обновление коэффициентов периодичности...")
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Создаем таблицу если не существует
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS justincase_frequency_coefficients (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                payment_frequency VARCHAR(20) NOT NULL UNIQUE,
                coefficient REAL NOT NULL
            )
        """)
        
        # Очищаем старые данные
        cursor.execute("DELETE FROM justincase_frequency_coefficients")
        
        # Вставляем новые коэффициенты
        for freq, coeff in coefficients:
            cursor.execute("""
                INSERT INTO justincase_frequency_coefficients (payment_frequency, coefficient)
                VALUES (?, ?)
            """, (freq, coeff))
            print(f"   {freq}: {coeff}")
        
        conn.commit()
        
        # Проверяем результат
        cursor.execute("SELECT * FROM justincase_frequency_coefficients ORDER BY payment_frequency")
        rows = cursor.fetchall()
        
        print(f"\n✅ Загружено {len(rows)} коэффициентов:")
        for row in rows:
            print(f"   ID {row[0]}: {row[1]} = {row[2]}")
        
        return True
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        return False
    finally:
        if conn:
            conn.close()

def check_tariffs_table():
    """Проверяет наличие тарифов в базе"""
    
    db_path = 'miniapp.db'
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Проверяем таблицу тарифов
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='justincase_tariffs'")
        if not cursor.fetchone():
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='justincase_base_tariffs'")
            if not cursor.fetchone():
                print("❌ Таблица тарифов не найдена")
                return False
            else:
                table_name = 'justincase_base_tariffs'
        else:
            table_name = 'justincase_tariffs'
        
        # Проверяем данные в таблице тарифов
        cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
        count = cursor.fetchone()[0]
        
        if count == 0:
            print(f"❌ Таблица {table_name} пуста")
            return False
        
        # Проверяем наличие тестовых данных
        cursor.execute(f"SELECT age, gender, term_years FROM {table_name} WHERE age=30 AND gender='m' LIMIT 5")
        test_rows = cursor.fetchall()
        
        print(f"✅ Таблица {table_name} содержит {count} записей")
        if test_rows:
            print(f"   Найдены тестовые данные для возраста 30, пол m:")
            for row in test_rows:
                print(f"     Возраст: {row[0]}, Пол: {row[1]}, Срок: {row[2]} лет")
        else:
            print(f"   ⚠️  Тестовые данные для возраста 30, пол m не найдены")
            # Показываем доступные данные
            cursor.execute(f"SELECT DISTINCT age, gender FROM {table_name} ORDER BY age, gender LIMIT 10")
            available = cursor.fetchall()
            print(f"   Доступные возраста и полы:")
            for row in available:
                print(f"     Возраст: {row[0]}, Пол: {row[1]}")
        
        return True
        
    except Exception as e:
        print(f"❌ Ошибка проверки тарифов: {e}")
        return False
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    print("🔧 === ОБНОВЛЕНИЕ БАЗЫ ДАННЫХ ===\n")
    
    # Обновляем коэффициенты
    if update_frequency_coefficients():
        print("\n" + "="*50 + "\n")
        
        # Проверяем тарифы
        check_tariffs_table()
    
    print("\n🏁 Готово!")
