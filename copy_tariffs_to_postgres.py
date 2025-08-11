#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Копирование тарифов из SQLite в PostgreSQL
"""

import sqlite3
import psycopg2
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def copy_tariffs_to_postgres():
    """Копирует тарифы из SQLite в PostgreSQL"""
    
    # Подключение к SQLite
    sqlite_conn = sqlite3.connect('miniapp.db')
    sqlite_cursor = sqlite_conn.cursor()
    
    # Подключение к PostgreSQL
    postgres_conn = psycopg2.connect(
        host='localhost',  # Подключаемся к локальному контейнеру
        port=5432,
        database='miniapp',
        user='postgres',
        password='secret'
    )
    postgres_cursor = postgres_conn.cursor()
    
    try:
        # Создаем таблицу в PostgreSQL если её нет
        logger.info("Создаем таблицу justincase_base_tariffs в PostgreSQL...")
        
        postgres_cursor.execute("""
            CREATE TABLE IF NOT EXISTS justincase_base_tariffs (
                id SERIAL PRIMARY KEY,
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
                coefficient_i REAL
            )
        """)
        
        # Очищаем таблицу
        postgres_cursor.execute("DELETE FROM justincase_base_tariffs")
        postgres_conn.commit()
        logger.info("Таблица очищена")
        
        # Получаем данные из SQLite
        sqlite_cursor.execute("""
            SELECT term_years, age, gender, death_rate, disability_rate, 
                   accident_death_rate, traffic_death_rate, injury_rate,
                   critical_illness_rf_fee, critical_illness_abroad_fee, coefficient_i
            FROM justincase_base_tariffs
        """)
        
        rows = sqlite_cursor.fetchall()
        logger.info(f"Найдено {len(rows)} записей в SQLite")
        
        # Вставляем данные в PostgreSQL
        insert_query = """
            INSERT INTO justincase_base_tariffs 
            (term_years, age, gender, death_rate, disability_rate, 
             accident_death_rate, traffic_death_rate, injury_rate,
             critical_illness_rf_fee, critical_illness_abroad_fee, coefficient_i)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        postgres_cursor.executemany(insert_query, rows)
        postgres_conn.commit()
        
        logger.info(f"Скопировано {len(rows)} записей в PostgreSQL")
        
        # Проверяем результат
        postgres_cursor.execute("SELECT COUNT(*) FROM justincase_base_tariffs")
        count = postgres_cursor.fetchone()[0]
        logger.info(f"Итого записей в PostgreSQL: {count}")
        
        # Проверяем конкретную запись
        postgres_cursor.execute("""
            SELECT * FROM justincase_base_tariffs 
            WHERE age = 35 AND gender = 'm' AND term_years = 5
        """)
        result = postgres_cursor.fetchone()
        logger.info(f"Тестовая запись (возраст 35, пол m, срок 5): {result}")
        
    except Exception as e:
        logger.error(f"Ошибка: {e}")
        postgres_conn.rollback()
        raise
    
    finally:
        sqlite_conn.close()
        postgres_conn.close()

def copy_frequency_coefficients():
    """Копирует коэффициенты частоты из SQLite в PostgreSQL"""
    
    # Подключение к SQLite
    sqlite_conn = sqlite3.connect('miniapp.db')
    sqlite_cursor = sqlite_conn.cursor()
    
    # Подключение к PostgreSQL
    postgres_conn = psycopg2.connect(
        host='localhost',
        port=5432,
        database='miniapp',
        user='postgres',
        password='secret'
    )
    postgres_cursor = postgres_conn.cursor()
    
    try:
        # Создаем таблицу в PostgreSQL если её нет
        logger.info("Создаем таблицу justincase_frequency_coefficients в PostgreSQL...")
        
        postgres_cursor.execute("""
            CREATE TABLE IF NOT EXISTS justincase_frequency_coefficients (
                id SERIAL PRIMARY KEY,
                frequency VARCHAR(20) NOT NULL UNIQUE,
                coefficient REAL NOT NULL
            )
        """)
        
        # Очищаем таблицу
        postgres_cursor.execute("DELETE FROM justincase_frequency_coefficients")
        postgres_conn.commit()
        
        # Проверяем есть ли таблица в SQLite
        sqlite_cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='justincase_frequency_coefficients'
        """)
        
        if sqlite_cursor.fetchone():
            # Получаем данные из SQLite
            sqlite_cursor.execute("""
                SELECT frequency, coefficient
                FROM justincase_frequency_coefficients
            """)
            
            rows = sqlite_cursor.fetchall()
            logger.info(f"Найдено {len(rows)} коэффициентов частоты в SQLite")
            
            if rows:
                # Вставляем данные в PostgreSQL
                insert_query = """
                    INSERT INTO justincase_frequency_coefficients (frequency, coefficient)
                    VALUES (%s, %s)
                """
                
                postgres_cursor.executemany(insert_query, rows)
                postgres_conn.commit()
                logger.info(f"Скопировано {len(rows)} коэффициентов в PostgreSQL")
            else:
                # Создаем стандартные коэффициенты
                logger.info("Создаем стандартные коэффициенты частоты...")
                default_coefficients = [
                    ('annual', 1.0),
                    ('semi_annual', 0.52),
                    ('quarterly', 0.26),
                    ('monthly', 0.087)
                ]
                
                postgres_cursor.executemany("""
                    INSERT INTO justincase_frequency_coefficients (frequency, coefficient)
                    VALUES (%s, %s)
                """, default_coefficients)
                postgres_conn.commit()
                logger.info("Созданы стандартные коэффициенты")
        else:
            # Создаем стандартные коэффициенты если таблицы нет в SQLite
            logger.info("Таблица коэффициентов не найдена в SQLite, создаем стандартные...")
            default_coefficients = [
                ('annual', 1.0),
                ('semi_annual', 0.52),
                ('quarterly', 0.26),
                ('monthly', 0.087)
            ]
            
            postgres_cursor.executemany("""
                INSERT INTO justincase_frequency_coefficients (frequency, coefficient)
                VALUES (%s, %s)
            """, default_coefficients)
            postgres_conn.commit()
            logger.info("Созданы стандартные коэффициенты")
        
    except Exception as e:
        logger.error(f"Ошибка копирования коэффициентов: {e}")
        postgres_conn.rollback()
        raise
    
    finally:
        sqlite_conn.close()
        postgres_conn.close()

if __name__ == '__main__':
    logger.info("Начинаем копирование данных в PostgreSQL...")
    copy_tariffs_to_postgres()
    copy_frequency_coefficients()
    logger.info("Копирование завершено!")
