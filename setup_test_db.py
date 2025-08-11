#!/usr/bin/env python3
"""
Создаем локальную PostgreSQL БД для тестирования
"""
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import sqlite3
import os

def create_test_db():
    """Создаем тестовую PostgreSQL БД"""
    
    # Подключаемся к PostgreSQL (база postgres по умолчанию)
    try:
        conn = psycopg2.connect(
            host='localhost',
            port=5432,
            user='postgres', 
            password='secret',
            database='postgres'
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        # Создаем БД если не существует
        cursor.execute("SELECT 1 FROM pg_database WHERE datname='miniapp_test'")
        if not cursor.fetchone():
            cursor.execute("CREATE DATABASE miniapp_test")
            print("База данных miniapp_test создана")
        else:
            print("База данных miniapp_test уже существует")
            
        cursor.close()
        conn.close()
        
        # Подключаемся к созданной БД
        test_conn = psycopg2.connect(
            host='localhost',
            port=5432,
            user='postgres',
            password='secret',
            database='miniapp_test'
        )
        
        return test_conn
        
    except Exception as e:
        print(f"Ошибка создания БД: {e}")
        return None

def migrate_data_from_sqlite():
    """Мигрируем данные из SQLite в PostgreSQL"""
    
    # Создаем PostgreSQL БД
    pg_conn = create_test_db()
    if not pg_conn:
        return False
    
    try:
        # Подключаемся к SQLite
        sqlite_conn = sqlite3.connect('miniapp.db')
        sqlite_cursor = sqlite_conn.cursor()
        
        pg_cursor = pg_conn.cursor()
        
        # Создаем таблицу тарифов в PostgreSQL
        pg_cursor.execute("""
            DROP TABLE IF EXISTS justincase_base_tariffs
        """)
        
        pg_cursor.execute("""
            CREATE TABLE justincase_base_tariffs (
                id SERIAL PRIMARY KEY,
                age INTEGER NOT NULL,
                gender VARCHAR(1) NOT NULL,
                term_years INTEGER NOT NULL,
                death_rate DECIMAL(10,8),
                disability_rate DECIMAL(10,8),
                accident_death_rate DECIMAL(10,8),
                traffic_death_rate DECIMAL(10,8),
                injury_rate DECIMAL(10,8),
                critical_illness_rf_fee DECIMAL(10,2),
                critical_illness_abroad_fee DECIMAL(10,2),
                coefficient_i DECIMAL(10,8),
                UNIQUE(age, gender, term_years)
            )
        """)
        
        # Получаем данные из SQLite
        sqlite_cursor.execute("SELECT * FROM justincase_base_tariffs")
        rows = sqlite_cursor.fetchall()
        
        print(f"Найдено {len(rows)} записей в SQLite")
        
        # Вставляем в PostgreSQL
        for row in rows:
            # Пропускаем ID (первый столбец)
            data = row[1:]  
            pg_cursor.execute("""
                INSERT INTO justincase_base_tariffs 
                (age, gender, term_years, death_rate, disability_rate, 
                 accident_death_rate, traffic_death_rate, injury_rate,
                 critical_illness_rf_fee, critical_illness_abroad_fee, coefficient_i)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (age, gender, term_years) DO NOTHING
            """, data)
        
        # Создаем таблицу частотных коэффициентов
        pg_cursor.execute("""
            DROP TABLE IF EXISTS justincase_frequency_coefficients
        """)
        
        pg_cursor.execute("""
            CREATE TABLE justincase_frequency_coefficients (
                id SERIAL PRIMARY KEY,
                payment_frequency VARCHAR(20) UNIQUE,
                coefficient DECIMAL(5,4)
            )
        """)
        
        # Получаем частотные коэффициенты
        sqlite_cursor.execute("SELECT * FROM justincase_frequency_coefficients")
        freq_rows = sqlite_cursor.fetchall()
        
        for row in freq_rows:
            data = row[1:]  # Пропускаем ID
            pg_cursor.execute("""
                INSERT INTO justincase_frequency_coefficients (payment_frequency, coefficient)
                VALUES (%s, %s)
                ON CONFLICT (payment_frequency) DO NOTHING
            """, data)
        
        pg_conn.commit()
        print("Данные успешно мигрированы в PostgreSQL")
        
        # Проверяем результат
        pg_cursor.execute("SELECT COUNT(*) FROM justincase_base_tariffs")
        count = pg_cursor.fetchone()[0]
        print(f"В PostgreSQL загружено {count} тарифных записей")
        
        # Тестируем конкретный тариф
        pg_cursor.execute("""
            SELECT age, gender, term_years, critical_illness_rf_fee, death_rate, disability_rate
            FROM justincase_base_tariffs 
            WHERE age = 35 AND gender = 'm' AND term_years = 5
        """)
        test_row = pg_cursor.fetchone()
        if test_row:
            print(f"Тестовый тариф (35, m, 5): {test_row}")
        else:
            print("ОШИБКА: Тестовый тариф не найден!")
        
        sqlite_conn.close()
        pg_conn.close()
        
        return True
        
    except Exception as e:
        print(f"Ошибка миграции: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("Настройка локальной PostgreSQL БД для тестирования...")
    
    if migrate_data_from_sqlite():
        print("\n✅ База данных готова для тестирования!")
        print("Используйте переменные окружения:")
        print("  DB_HOST=localhost")
        print("  DB_PORT=5432") 
        print("  DB_NAME=miniapp_test")
        print("  DB_USER=postgres")
        print("  DB_PASSWORD=secret")
    else:
        print("\n❌ Ошибка настройки БД")
