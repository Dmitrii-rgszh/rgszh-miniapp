#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sqlite3
import csv
import os

def init_justincase_tables():
    """Инициализация таблиц для JustInCase калькулятора"""
    
    db_path = 'miniapp.db'
    csv_file = "Базовые тарифы.csv"
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Создаем таблицу тарифов
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS justincase_base_tariffs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                term_years INTEGER NOT NULL,
                age INTEGER NOT NULL,
                gender VARCHAR(1) NOT NULL,
                death_rate REAL NOT NULL,
                disability_rate REAL NOT NULL,
                accident_death_rate REAL,
                traffic_death_rate REAL,
                injury_rate REAL,
                critical_illness_rf_fee REAL,
                critical_illness_abroad_fee REAL,
                coefficient_i REAL,
                UNIQUE(term_years, age, gender)
            )
        """)
        
        # Создаем таблицу коэффициентов частоты
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS justincase_frequency_coefficients (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                payment_frequency VARCHAR(20) NOT NULL UNIQUE,
                coefficient REAL NOT NULL
            )
        """)
        
        # Создаем индексы
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_tariffs_lookup 
            ON justincase_base_tariffs(age, gender, term_years)
        """)
        
        print("Таблицы созданы")
        
        # Очищаем таблицы
        cursor.execute("DELETE FROM justincase_base_tariffs")
        cursor.execute("DELETE FROM justincase_frequency_coefficients")
        
        # Загружаем коэффициенты частоты
        coefficients = [
            ('annual', 1.0),
            ('semi_annual', 0.52),
            ('quarterly', 0.27),
            ('monthly', 0.09)
        ]
        
        for freq, coeff in coefficients:
            cursor.execute("""
                INSERT INTO justincase_frequency_coefficients (payment_frequency, coefficient)
                VALUES (?, ?)
            """, (freq, coeff))
        
        print("Коэффициенты частоты загружены")
        
        # Загружаем данные из CSV
        if not os.path.exists(csv_file):
            print(f"CSV файл {csv_file} не найден")
            return False
        
        encodings = ['utf-8', 'cp1251', 'windows-1251', 'utf-8-sig']
        
        for encoding in encodings:
            try:
                with open(csv_file, 'r', encoding=encoding) as file:
                    reader = csv.reader(file, delimiter=';')
                    header = next(reader)
                    break
            except UnicodeDecodeError:
                continue
        else:
            print("Не удалось определить кодировку файла")
            return False
        
        def parse_percentage(value):
            if not value or value.strip() == '':
                return 0.0
            try:
                clean_value = value.replace('%', '').replace(',', '.').strip()
                return float(clean_value) / 100 if clean_value else 0.0
            except ValueError:
                return 0.0
        
        def parse_decimal(value):
            if not value or value.strip() == '':
                return 0.0
            try:
                clean_value = value.replace(' ', '').replace(',', '.').strip()
                return float(clean_value) if clean_value else 0.0
            except ValueError:
                return 0.0
        
        # Загружаем данные из CSV
        with open(csv_file, 'r', encoding=encoding) as file:
            reader = csv.reader(file, delimiter=';')
            header = next(reader)
            
            rows_inserted = 0
            
            for row in reader:
                if len(row) < 11:
                    continue
                
                try:
                    term_years = int(row[0]) if row[0].strip() else None
                    age = int(row[1]) if row[1].strip() else None
                    gender = row[2].strip().lower() if row[2].strip() else None
                    
                    if not term_years or not age or not gender:
                        continue
                    
                    death_rate = parse_percentage(row[3])
                    disability_rate = parse_percentage(row[4])
                    accident_death_rate = parse_percentage(row[5])
                    traffic_death_rate = parse_percentage(row[6])
                    injury_rate = parse_percentage(row[7])
                    critical_illness_rf_fee = parse_decimal(row[8])
                    critical_illness_abroad_fee = parse_decimal(row[9])
                    coefficient_i = parse_decimal(row[10])
                    
                    cursor.execute("""
                        INSERT OR REPLACE INTO justincase_base_tariffs
                        (term_years, age, gender, death_rate, disability_rate, 
                         accident_death_rate, traffic_death_rate, injury_rate,
                         critical_illness_rf_fee, critical_illness_abroad_fee, coefficient_i)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (term_years, age, gender, death_rate, disability_rate,
                          accident_death_rate, traffic_death_rate, injury_rate,
                          critical_illness_rf_fee, critical_illness_abroad_fee, coefficient_i))
                    
                    rows_inserted += 1
                    
                except Exception as e:
                    continue
        
        conn.commit()
        
        # Проверяем результат
        cursor.execute("SELECT COUNT(*) FROM justincase_base_tariffs")
        count = cursor.fetchone()[0]
        print(f"Загружено {rows_inserted} записей тарифов")
        
        # Проверяем пример данных
        cursor.execute("""
            SELECT critical_illness_rf_fee, critical_illness_abroad_fee
            FROM justincase_base_tariffs 
            WHERE age = 30 AND gender = 'm' AND term_years = 10
            LIMIT 1
        """)
        result = cursor.fetchone()
        if result:
            print(f"Пример: КЗ РФ = {result[0]:.2f} руб., КЗ Зарубеж = {result[1]:.2f} руб.")
        
        return True
        
    except Exception as e:
        print(f"Ошибка: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

if __name__ == "__main__":
    init_justincase_tables()
