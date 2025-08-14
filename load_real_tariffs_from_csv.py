# load_real_tariffs_from_csv.py - Загрузка реальных тарифов из CSV

import sqlite3
import csv
import os
from pathlib import Path

def parse_percentage(value):
    """Конвертирует процент в коэффициент"""
    if isinstance(value, str):
        # Убираем % и заменяем запятую на точку
        value = value.replace('%', '').replace(',', '.')
        try:
            return float(value) / 100  # Конвертируем проценты в коэффициент (0.2583% / 100 = 0.002583)
        except ValueError:
            return 0.0
    return float(value) / 100

def parse_ruble_amount(value):
    """Парсит сумму в рублях"""
    if isinstance(value, str):
        # Убираем пробелы и заменяем запятую на точку
        value = value.replace(' ', '').replace(',', '.')
        try:
            return float(value)
        except ValueError:
            return 0.0
    return float(value)

def load_tariffs_from_csv():
    """Загружает тарифы из CSV файла в SQLite"""
    
    csv_file = "Базовые тарифы.csv"
    db_path = "miniapp.db"
    
    if not os.path.exists(csv_file):
        print(f"❌ CSV файл не найден: {csv_file}")
        return False
    
    # Удаляем старую базу
    if os.path.exists(db_path):
        os.remove(db_path)
        print(f"🗑️ Удалена старая база: {db_path}")
    
    # Создаем новую базу
    conn = sqlite3.connect(db_path, check_same_thread=False)
    conn.execute("PRAGMA encoding = 'UTF-8'")
    cursor = conn.cursor()
    
    print(f"🆕 Создана новая база: {db_path}")
    
    # Создаем таблицы
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
    
    print("✅ Таблицы созданы")
    
    # Читаем CSV файл
    print(f"📖 Читаем CSV файл: {csv_file}")
    
    with open(csv_file, 'r', encoding='utf-8') as file:
        # Используем ; как разделитель
        csv_reader = csv.reader(file, delimiter=';')
        
        # Пропускаем заголовок
        header = next(csv_reader)
        print(f"📋 Заголовки: {header}")
        
        base_count = 0
        accident_count = 0
        critical_count = 0
        
        for row in csv_reader:
            if len(row) < 10:  # Проверяем что есть все нужные колонки
                continue
                
            try:
                term_years = int(row[0])  # Период уплаты премии
                age = int(row[1])         # Возраст
                gender = row[2]           # Пол (m/f)
                
                # Тарифы в процентах, конвертируем в промилле
                death_rate = parse_percentage(row[3])         # Смерть ЛП
                disability_rate = parse_percentage(row[4])    # Инвалидность ЛП
                accident_death_rate = parse_percentage(row[5]) # Смерть НС
                traffic_death_rate = parse_percentage(row[6])  # Смерть ДТП
                injury_rate = parse_percentage(row[7])         # Травма
                
                # КЗ тарифы в рублях
                critical_rf_rate = parse_ruble_amount(row[8])      # КЗ РФ
                critical_abroad_rate = parse_ruble_amount(row[9])  # КЗ Зарубеж
                
                # Добавляем базовые тарифы НСЖ
                cursor.execute('''
                    INSERT OR REPLACE INTO nsj_tariffs (age, gender, term_years, death_rate, disability_rate)
                    VALUES (?, ?, ?, ?, ?)
                ''', (age, gender, term_years, death_rate, disability_rate))
                base_count += 1
                
                # Добавляем тарифы НС
                cursor.execute('''
                    INSERT OR REPLACE INTO nsj_accident_tariffs (age, gender, term_years, death_rate, traffic_death_rate, injury_rate)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (age, gender, term_years, accident_death_rate, traffic_death_rate, injury_rate))
                accident_count += 1
                
                # Добавляем тарифы КЗ для РФ и зарубежья
                # КЗ тарифы уже в рублях, сохраняем как есть
                if critical_rf_rate > 0:
                    cursor.execute('''
                        INSERT OR REPLACE INTO nsj_critical_tariffs (age, gender, term_years, region, rate)
                        VALUES (?, ?, ?, ?, ?)
                    ''', (age, gender, term_years, 'russia', critical_rf_rate))
                    critical_count += 1
                
                if critical_abroad_rate > 0:
                    cursor.execute('''
                        INSERT OR REPLACE INTO nsj_critical_tariffs (age, gender, term_years, region, rate)
                        VALUES (?, ?, ?, ?, ?)
                    ''', (age, gender, term_years, 'abroad', critical_abroad_rate))
                    critical_count += 1
                
            except (ValueError, IndexError) as e:
                print(f"⚠️ Ошибка обработки строки: {row[:3]} - {e}")
                continue
        
        print(f"✅ Загружено из CSV:")
        print(f"   📊 Базовые тарифы НСЖ: {base_count}")
        print(f"   🚨 Тарифы НС: {accident_count}")
        print(f"   🏥 Тарифы КЗ: {critical_count}")
        
        # Сохраняем изменения
        conn.commit()
        conn.close()
        
        print(f"🎉 База данных успешно создана из CSV файла!")
        return True

if __name__ == "__main__":
    print("🚀 Загрузка реальных тарифов из CSV...")
    try:
        if load_tariffs_from_csv():
            print("✅ Загрузка завершена успешно!")
        else:
            print("❌ Ошибка загрузки")
            exit(1)
    except Exception as e:
        print(f"❌ Критическая ошибка: {e}")
        exit(1)
