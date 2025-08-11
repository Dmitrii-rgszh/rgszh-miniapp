#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Создание SQL дампа тарифов из SQLite для PostgreSQL
"""

import sqlite3
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_sql_dump():
    """Создает SQL дамп для PostgreSQL"""
    
    conn = sqlite3.connect('miniapp.db')
    cursor = conn.cursor()
    
    try:
        # Получаем тарифы
        cursor.execute("""
            SELECT term_years, age, gender, death_rate, disability_rate, 
                   accident_death_rate, traffic_death_rate, injury_rate,
                   critical_illness_rf_fee, critical_illness_abroad_fee, coefficient_i
            FROM justincase_base_tariffs
            ORDER BY term_years, age, gender
        """)
        
        rows = cursor.fetchall()
        logger.info(f"Найдено {len(rows)} записей тарифов")
        
        # Создаем SQL файл
        with open('tariffs_dump.sql', 'w', encoding='utf-8') as f:
            f.write("-- Создание и заполнение таблицы тарифов JustInCase\n\n")
            
            # Создание таблицы
            f.write("""CREATE TABLE IF NOT EXISTS justincase_base_tariffs (
    id SERIAL PRIMARY KEY,
    period INTEGER NOT NULL,
    age INTEGER NOT NULL,
    gender VARCHAR(1) NOT NULL,
    death_rate NUMERIC(10,8) NOT NULL,
    disability_rate NUMERIC(10,8) NOT NULL,
    death_accident_rate NUMERIC(10,8),
    death_traffic_rate NUMERIC(10,8),
    trauma_rate NUMERIC(10,8),
    kz_rf_payment NUMERIC(12,2),
    kz_abroad_payment NUMERIC(12,2),
    additional_rate NUMERIC(6,4),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tariffs_age_gender_period ON justincase_base_tariffs (age, gender, period);

-- Очистка таблицы
DELETE FROM justincase_base_tariffs;

-- Заполнение данными
""")
            
            # Вставляем данные пачками по 100 записей
            batch_size = 100
            for i in range(0, len(rows), batch_size):
                batch = rows[i:i+batch_size]
                
                f.write("INSERT INTO justincase_base_tariffs ")
                f.write("(period, age, gender, death_rate, disability_rate, ")
                f.write("death_accident_rate, death_traffic_rate, trauma_rate, ")
                f.write("kz_rf_payment, kz_abroad_payment, additional_rate) VALUES\n")
                
                values = []
                for row in batch:
                    values.append(f"({row[0]}, {row[1]}, '{row[2]}', {row[3]}, {row[4]}, "
                                f"{row[5]}, {row[6]}, {row[7]}, {row[8]}, {row[9]}, {row[10]})")
                
                f.write(",\n".join(values))
                f.write(";\n\n")
        
        logger.info("SQL дамп тарифов создан: tariffs_dump.sql")
        
        # Получаем коэффициенты частоты
        cursor.execute("SELECT payment_frequency, coefficient FROM justincase_frequency_coefficients")
        freq_rows = cursor.fetchall()
        
        # Добавляем коэффициенты в тот же файл
        with open('tariffs_dump.sql', 'a', encoding='utf-8') as f:
            f.write("""
-- Создание и заполнение таблицы коэффициентов частоты
CREATE TABLE IF NOT EXISTS justincase_frequency_coefficients (
    id SERIAL PRIMARY KEY,
    frequency VARCHAR(20) NOT NULL UNIQUE,
    coefficient REAL NOT NULL
);

-- Очистка таблицы
DELETE FROM justincase_frequency_coefficients;

-- Заполнение коэффициентами
INSERT INTO justincase_frequency_coefficients (frequency, coefficient) VALUES
""")
            
            freq_values = []
            for freq_row in freq_rows:
                freq_values.append(f"('{freq_row[0]}', {freq_row[1]})")
            
            f.write(",\n".join(freq_values))
            f.write(";\n")
        
        logger.info(f"Добавлено {len(freq_rows)} коэффициентов частоты")
        
    finally:
        conn.close()

if __name__ == '__main__':
    logger.info("Создание SQL дампа...")
    create_sql_dump()
    logger.info("SQL дамп готов!")
