#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Загрузка правильных тарифов из CSV файла в PostgreSQL
"""

import pandas as pd
import psycopg2
from psycopg2.extras import execute_values
import os

def create_tariffs_table():
    """Создает таблицу тарифов с правильной структурой"""
    
    # Подключение к PostgreSQL
    conn = psycopg2.connect(
        host="postgres",
        port=5432,
        database="miniapp",
        user="postgres", 
        password="secret"
    )
    
    cursor = conn.cursor()
    
    # Удаляем старую таблицу если есть
    cursor.execute("DROP TABLE IF EXISTS justincase_tariffs CASCADE;")
    
    # Создаем новую таблицу с правильной структурой
    create_table_sql = """
    CREATE TABLE justincase_tariffs (
        id SERIAL PRIMARY KEY,
        payment_period INTEGER NOT NULL,
        age INTEGER NOT NULL,
        gender VARCHAR(1) NOT NULL,
        death_rate DECIMAL(10,8) NOT NULL,
        disability_rate DECIMAL(10,8) NOT NULL,
        accident_death_rate DECIMAL(10,8) NOT NULL,
        traffic_death_rate DECIMAL(10,8) NOT NULL,
        injury_rate DECIMAL(10,8) NOT NULL,
        critical_rf_fee DECIMAL(10,2) NOT NULL,
        critical_abroad_fee DECIMAL(10,2) NOT NULL,
        i_rate DECIMAL(10,8) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """
    
    cursor.execute(create_table_sql)
    
    # Создаем индексы для быстрого поиска
    cursor.execute("""
        CREATE INDEX idx_tariffs_lookup ON justincase_tariffs (age, gender, payment_period);
    """)
    
    conn.commit()
    cursor.close()
    conn.close()
    
    print("✅ Таблица justincase_tariffs создана")

def load_tariffs_from_csv():
    """Загружает тарифы из CSV файла"""
    
    # Читаем CSV файл
    csv_file = "Базовые тарифы.csv"
    
    print(f"📄 Читаем файл: {csv_file}")
    
    # Читаем CSV с правильной кодировкой и разделителем
    df = pd.read_csv(csv_file, encoding='utf-8', sep=';')
    
    print(f"📊 Прочитано строк: {len(df)}")
    print(f"📋 Колонки: {list(df.columns)}")
    
    # Очищаем данные
    # Убираем первую строку если она пустая или служебная
    if df.iloc[0].isnull().all() or 'i' in str(df.iloc[0, 0]):
        df = df.drop(df.index[0]).reset_index(drop=True)
    
    # Переименовываем колонки на английские
    df.columns = [
        'payment_period', 'age', 'gender', 'death_rate', 'disability_rate',
        'accident_death_rate', 'traffic_death_rate', 'injury_rate', 
        'critical_rf_fee', 'critical_abroad_fee', 'i_rate', 
        'col1', 'col2', 'col3'  # Лишние колонки
    ]
    
    # Убираем лишние колонки
    df = df[['payment_period', 'age', 'gender', 'death_rate', 'disability_rate',
             'accident_death_rate', 'traffic_death_rate', 'injury_rate', 
             'critical_rf_fee', 'critical_abroad_fee', 'i_rate']]
    
    # Очищаем данные
    df = df.dropna(subset=['age', 'gender'])  # Убираем строки без возраста или пола
    
    # Преобразуем проценты в десятичные числа
    for col in ['death_rate', 'disability_rate', 'accident_death_rate', 'traffic_death_rate', 'injury_rate', 'i_rate']:
        df[col] = df[col].astype(str).str.replace('%', '').str.replace(',', '.').astype(float) / 100
    
    # Преобразуем суммы (убираем пробелы и запятые)
    for col in ['critical_rf_fee', 'critical_abroad_fee']:
        df[col] = df[col].astype(str).str.replace(' ', '').str.replace(',', '.').astype(float)
    
    # Убираем некорректные строки
    df = df[df['age'].notna() & df['gender'].notna()]
    df = df[df['age'] != 'Возраст Застрахованного']  # Убираем заголовок если попал
    
    # Преобразуем типы
    df['payment_period'] = df['payment_period'].astype(int)
    df['age'] = df['age'].astype(int)
    df['gender'] = df['gender'].astype(str)
    
    print(f"📊 После очистки строк: {len(df)}")
    print(f"🔍 Возрастной диапазон: {df['age'].min()} - {df['age'].max()}")
    print(f"👥 Полы: {df['gender'].unique()}")
    
    # Подключение к PostgreSQL
    conn = psycopg2.connect(
        host="postgres",
        port=5432,
        database="miniapp",
        user="postgres", 
        password="secret"
    )
    
    cursor = conn.cursor()
    
    # Подготавливаем данные для вставки
    data_tuples = [tuple(row) for row in df.values]
    
    # Вставляем данные пакетно
    insert_sql = """
    INSERT INTO justincase_tariffs (
        payment_period, age, gender, death_rate, disability_rate,
        accident_death_rate, traffic_death_rate, injury_rate,
        critical_rf_fee, critical_abroad_fee, i_rate
    ) VALUES %s
    """
    
    execute_values(cursor, insert_sql, data_tuples, page_size=1000)
    
    conn.commit()
    
    # Проверяем что загрузилось
    cursor.execute("SELECT COUNT(*) FROM justincase_tariffs;")
    count = cursor.fetchone()[0]
    
    cursor.execute("""
        SELECT age, gender, death_rate, critical_rf_fee 
        FROM justincase_tariffs 
        WHERE age = 35 AND gender = 'm' 
        LIMIT 1;
    """)
    sample = cursor.fetchone()
    
    cursor.close()
    conn.close()
    
    print(f"✅ Загружено тарифов: {count}")
    if sample:
        print(f"🔍 Пример (возраст 35, мужчина): death_rate={sample[2]}, critical_rf_fee={sample[3]}")
    
    return count

if __name__ == "__main__":
    print("🚀 Создание и загрузка правильных тарифов...")
    
    create_tariffs_table()
    count = load_tariffs_from_csv()
    
    print(f"✅ Готово! Загружено {count} тарифов в PostgreSQL")
