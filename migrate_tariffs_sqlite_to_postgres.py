#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Экспорт тарифов из SQLite в CSV и импорт в PostgreSQL через docker
"""

import sqlite3
import csv
import subprocess
import logging
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def export_sqlite_to_csv():
    """Экспортирует данные из SQLite в CSV"""
    
    conn = sqlite3.connect('miniapp.db')
    cursor = conn.cursor()
    
    try:
        # Экспорт тарифов
        logger.info("Экспортируем тарифы из SQLite...")
        cursor.execute("""
            SELECT term_years, age, gender, death_rate, disability_rate, 
                   accident_death_rate, traffic_death_rate, injury_rate,
                   critical_illness_rf_fee, critical_illness_abroad_fee, coefficient_i
            FROM justincase_base_tariffs
            ORDER BY term_years, age, gender
        """)
        
        rows = cursor.fetchall()
        logger.info(f"Найдено {len(rows)} записей тарифов")
        
        with open('tariffs_export.csv', 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.writer(csvfile)
            # Заголовки
            writer.writerow([
                'period', 'age', 'gender', 'death_rate', 'disability_rate',
                'death_accident_rate', 'death_traffic_rate', 'trauma_rate',
                'kz_rf_payment', 'kz_abroad_payment', 'additional_rate'
            ])
            writer.writerows(rows)
        
        logger.info("Тарифы экспортированы в tariffs_export.csv")
        
        # Экспорт коэффициентов частоты (если таблица существует)
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='justincase_frequency_coefficients'
        """)
        
        if cursor.fetchone():
            cursor.execute("SELECT payment_frequency, coefficient FROM justincase_frequency_coefficients")
            freq_rows = cursor.fetchall()
            
            if freq_rows:
                with open('frequency_coefficients_export.csv', 'w', newline='', encoding='utf-8') as csvfile:
                    writer = csv.writer(csvfile)
                    writer.writerow(['frequency', 'coefficient'])
                    writer.writerows(freq_rows)
                logger.info(f"Экспортировано {len(freq_rows)} коэффициентов частоты")
            else:
                logger.info("Коэффициенты частоты не найдены, создаем стандартные")
                create_default_frequency_coefficients()
        else:
            logger.info("Таблица коэффициентов не найдена, создаем стандартные")
            create_default_frequency_coefficients()
            
    finally:
        conn.close()

def create_default_frequency_coefficients():
    """Создает файл со стандартными коэффициентами частоты"""
    default_coefficients = [
        ['frequency', 'coefficient'],
        ['annual', '1.0'],
        ['semi_annual', '0.52'],
        ['quarterly', '0.26'],
        ['monthly', '0.087']
    ]
    
    with open('frequency_coefficients_export.csv', 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerows(default_coefficients)
    
    logger.info("Созданы стандартные коэффициенты частоты")

def import_to_postgres():
    """Импортирует данные в PostgreSQL через docker"""
    
    try:
        # Копируем CSV файл в контейнер
        logger.info("Копируем файл тарифов в контейнер PostgreSQL...")
        subprocess.run([
            'docker', 'cp', 'tariffs_export.csv', 'miniapp-postgres-1:/tmp/tariffs_export.csv'
        ], check=True)
        
        # Очищаем таблицу и импортируем данные
        logger.info("Очищаем таблицу и импортируем тарифы...")
        subprocess.run([
            'docker', 'exec', 'miniapp-postgres-1', 'psql', '-U', 'postgres', '-d', 'miniapp', 
            '-c', 'DELETE FROM justincase_base_tariffs;'
        ], check=True)
        
        subprocess.run([
            'docker', 'exec', 'miniapp-postgres-1', 'psql', '-U', 'postgres', '-d', 'miniapp', 
            '-c', "\\COPY justincase_base_tariffs(period, age, gender, death_rate, disability_rate, death_accident_rate, death_traffic_rate, trauma_rate, kz_rf_payment, kz_abroad_payment, additional_rate) FROM '/tmp/tariffs_export.csv' WITH CSV HEADER;"
        ], check=True)
        
        # Импорт коэффициентов частоты
        logger.info("Копируем файл коэффициентов в контейнер...")
        subprocess.run([
            'docker', 'cp', 'frequency_coefficients_export.csv', 'miniapp-postgres-1:/tmp/frequency_coefficients_export.csv'
        ], check=True)
        
        logger.info("Импортируем коэффициенты частоты...")
        subprocess.run([
            'docker', 'exec', 'miniapp-postgres-1', 'psql', '-U', 'postgres', '-d', 'miniapp', 
            '-c', 'DELETE FROM justincase_frequency_coefficients;'
        ], check=True)
        
        subprocess.run([
            'docker', 'exec', 'miniapp-postgres-1', 'psql', '-U', 'postgres', '-d', 'miniapp', 
            '-c', "\\COPY justincase_frequency_coefficients(frequency, coefficient) FROM '/tmp/frequency_coefficients_export.csv' WITH CSV HEADER;"
        ], check=True)
        
        # Проверяем результат
        logger.info("Проверяем импорт...")
        result = subprocess.run([
            'docker', 'exec', 'miniapp-postgres-1', 'psql', '-U', 'postgres', '-d', 'miniapp', 
            '-c', 'SELECT COUNT(*) FROM justincase_base_tariffs;'
        ], capture_output=True, text=True, check=True)
        
        logger.info(f"Результат импорта тарифов: {result.stdout}")
        
        # Проверяем конкретную запись
        test_result = subprocess.run([
            'docker', 'exec', 'miniapp-postgres-1', 'psql', '-U', 'postgres', '-d', 'miniapp', 
            '-c', "SELECT * FROM justincase_base_tariffs WHERE age = 35 AND gender = 'm' AND period = 5;"
        ], capture_output=True, text=True, check=True)
        
        logger.info(f"Тестовая запись (возраст 35, пол m, срок 5): {test_result.stdout}")
        
        # Проверяем коэффициенты
        freq_result = subprocess.run([
            'docker', 'exec', 'miniapp-postgres-1', 'psql', '-U', 'postgres', '-d', 'miniapp', 
            '-c', 'SELECT * FROM justincase_frequency_coefficients;'
        ], capture_output=True, text=True, check=True)
        
        logger.info(f"Коэффициенты частоты: {freq_result.stdout}")
        
    except subprocess.CalledProcessError as e:
        logger.error(f"Ошибка выполнения команды: {e}")
        raise
    
    finally:
        # Удаляем временные файлы
        for file in ['tariffs_export.csv', 'frequency_coefficients_export.csv']:
            if os.path.exists(file):
                os.remove(file)
                logger.info(f"Удален временный файл {file}")

if __name__ == '__main__':
    logger.info("Начинаем экспорт из SQLite и импорт в PostgreSQL...")
    export_sqlite_to_csv()
    import_to_postgres()
    logger.info("Миграция данных завершена!")
