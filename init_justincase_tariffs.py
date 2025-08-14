# init_justincase_tariffs.py - Инициализация тарифов НСЖ в SQLite

import sqlite3
import os
from pathlib import Path

def init_tariffs_database():
    """Создает базу данных SQLite с тарифами НСЖ"""
    
    db_path = "miniapp.db"
    
    # Удаляем старую базу если есть
    if os.path.exists(db_path):
        os.remove(db_path)
        print(f"🗑️ Удалена старая база: {db_path}")
    
    # Создаем новую базу с правильной кодировкой
    conn = sqlite3.connect(db_path, check_same_thread=False)
    conn.execute("PRAGMA encoding = 'UTF-8'")
    cursor = conn.cursor()
    
    print(f"🆕 Создана новая база: {db_path}")
    
    # Создаем таблицу тарифов НСЖ
    cursor.execute('''
        CREATE TABLE nsj_tariffs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            age INTEGER NOT NULL,
            gender TEXT NOT NULL,
            term_years INTEGER NOT NULL,
            death_rate REAL NOT NULL,
            disability_rate REAL NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(age, gender, term_years)
        )
    ''')
    print("✅ Создана таблица nsj_tariffs")
    
    # Создаем таблицу тарифов НС
    cursor.execute('''
        CREATE TABLE nsj_accident_tariffs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            age INTEGER NOT NULL,
            gender TEXT NOT NULL,
            term_years INTEGER NOT NULL,
            death_rate REAL NOT NULL,
            traffic_death_rate REAL NOT NULL,
            injury_rate REAL NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(age, gender, term_years)
        )
    ''')
    print("✅ Создана таблица nsj_accident_tariffs")
    
    # Создаем таблицу тарифов КЗ
    cursor.execute('''
        CREATE TABLE nsj_critical_tariffs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            age INTEGER NOT NULL,
            gender TEXT NOT NULL,
            term_years INTEGER NOT NULL,
            region TEXT NOT NULL,
            rate REAL NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(age, gender, term_years, region)
        )
    ''')
    print("✅ Создана таблица nsj_critical_tariffs")
    
    # Заполняем тестовыми данными
    print("📊 Заполняем тестовыми тарифами...")
    
    # Базовые тарифы НСЖ (в промилле)
    for age in range(18, 71):
        for gender in ['m', 'f']:
            for term in range(1, 31):
                # Примерные тарифы (реальные должны быть из актуарных таблиц)
                death_base = 2.5 if gender == 'm' else 1.8
                disability_base = 1.2 if gender == 'm' else 0.9
                
                # Корректировка по возрасту
                age_factor = 1 + (age - 30) * 0.02
                term_factor = 1 + (term - 10) * 0.01
                
                death_rate = death_base * age_factor * term_factor
                disability_rate = disability_base * age_factor * term_factor
                
                cursor.execute('''
                    INSERT INTO nsj_tariffs (age, gender, term_years, death_rate, disability_rate)
                    VALUES (?, ?, ?, ?, ?)
                ''', (age, gender, term, death_rate, disability_rate))
    
    print(f"✅ Добавлено {53 * 2 * 30} тарифов НСЖ")
    
    # Тарифы НС
    for age in range(18, 71):
        for gender in ['m', 'f']:
            for term in range(1, 31):
                death_rate = 0.5 if gender == 'm' else 0.3
                traffic_rate = 0.8 if gender == 'm' else 0.5
                injury_rate = 2.0 if gender == 'm' else 1.5
                
                cursor.execute('''
                    INSERT INTO nsj_accident_tariffs (age, gender, term_years, death_rate, traffic_death_rate, injury_rate)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (age, gender, term, death_rate, traffic_rate, injury_rate))
    
    print(f"✅ Добавлено {53 * 2 * 30} тарифов НС")
    
    # Тарифы КЗ
    for age in range(18, 71):
        for gender in ['m', 'f']:
            for term in range(1, 31):
                for region in ['russia', 'abroad']:
                    rate = 15.0 if region == 'abroad' else 8.0
                    age_factor = 1 + (age - 30) * 0.03
                    
                    cursor.execute('''
                        INSERT INTO nsj_critical_tariffs (age, gender, term_years, region, rate)
                        VALUES (?, ?, ?, ?, ?)
                    ''', (age, gender, term, region, rate * age_factor))
    
    print(f"✅ Добавлено {53 * 2 * 30 * 2} тарифов КЗ")
    
    # Сохраняем и закрываем
    conn.commit()
    conn.close()
    
    print(f"🎉 База данных {db_path} успешно создана и заполнена!")
    print(f"📈 Всего записей: {53 * 2 * 30 * 4} тарифов")
    return True

if __name__ == "__main__":
    print("🚀 Инициализация базы данных тарифов НСЖ...")
    try:
        init_tariffs_database()
        print("✅ Инициализация завершена успешно!")
    except Exception as e:
        print(f"❌ Ошибка инициализации: {e}")
        exit(1)
