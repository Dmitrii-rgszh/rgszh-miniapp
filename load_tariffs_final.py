#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import csv
import psycopg2
import os
import sys
from decimal import Decimal, InvalidOperation

# Устанавливаем переменные окружения для кодировки
os.environ['PGCLIENTENCODING'] = 'UTF8'

def create_connection():
    """Создание соединения с PostgreSQL"""
    try:
        print("Подключаемся к PostgreSQL...")
        connection = psycopg2.connect(
            host="localhost",
            port="5432",
            database="miniapp",
            user="postgres",
            password="password",
            client_encoding='utf8'
        )
        print("Подключение успешно")
        return connection
    except Exception as e:
        print(f"Ошибка подключения к PostgreSQL: {e}")
        import traceback
        traceback.print_exc()
        return None

def create_tariffs_table(connection):
    """Создание таблицы для тарифов"""
    create_table_query = """
    DROP TABLE IF EXISTS justincase_base_tariffs;
    
    CREATE TABLE justincase_base_tariffs (
        id SERIAL PRIMARY KEY,
        period INTEGER NOT NULL,
        age INTEGER NOT NULL,
        gender VARCHAR(1) NOT NULL,
        death_rate DECIMAL(10, 8) NOT NULL,
        disability_rate DECIMAL(10, 8) NOT NULL,
        death_accident_rate DECIMAL(10, 8),
        death_traffic_rate DECIMAL(10, 8),
        trauma_rate DECIMAL(10, 8),
        kz_rf_payment DECIMAL(12, 2),
        kz_abroad_payment DECIMAL(12, 2),
        additional_rate DECIMAL(6, 4),
        created_at TIMESTAMP DEFAULT NOW()
    );
    
    CREATE INDEX idx_tariffs_age_gender_period ON justincase_base_tariffs(age, gender, period);
    """
    
    try:
        cursor = connection.cursor()
        cursor.execute(create_table_query)
        connection.commit()
        cursor.close()
        print("Таблица justincase_base_tariffs создана успешно")
        return True
    except Exception as e:
        print(f"Ошибка создания таблицы: {e}")
        return False

def parse_percentage(value):
    """Парсинг процентного значения в десятичное число"""
    if not value or value.strip() == '':
        return None
    
    try:
        # Убираем знак процента и заменяем запятую на точку
        clean_value = value.replace('%', '').replace(',', '.').strip()
        if clean_value == '' or clean_value == '0':
            return Decimal('0')
        return Decimal(clean_value) / 100
    except (InvalidOperation, ValueError) as e:
        print(f"Ошибка парсинга значения '{value}': {e}")
        return None

def parse_decimal(value):
    """Парсинг числового значения"""
    if not value or value.strip() == '':
        return None
    
    try:
        # Убираем пробелы и заменяем запятую на точку
        clean_value = value.replace(' ', '').replace(',', '.').strip()
        if clean_value == '' or clean_value == '0':
            return Decimal('0')
        return Decimal(clean_value)
    except (InvalidOperation, ValueError) as e:
        print(f"Ошибка парсинга числа '{value}': {e}")
        return None

def load_tariffs_from_csv(connection, csv_filename):
    """Загрузка тарифов из CSV файла"""
    try:
        # Пробуем разные кодировки
        encodings = ['utf-8', 'cp1251', 'windows-1251', 'utf-8-sig']
        
        for encoding in encodings:
            try:
                print(f"Пробуем кодировку: {encoding}")
                with open(csv_filename, 'r', encoding=encoding) as file:
                    # Читаем CSV с точкой с запятой как разделителем
                    reader = csv.reader(file, delimiter=';')
                    
                    # Пропускаем заголовок
                    header = next(reader)
                    print(f"Заголовки: {header}")
                    break
            except UnicodeDecodeError:
                continue
        else:
            print("Не удалось определить кодировку файла")
            return False
        
        # Если дошли сюда, то кодировка найдена
        print(f"Используем кодировку: {encoding}")
        
        with open(csv_filename, 'r', encoding=encoding) as file:
            reader = csv.reader(file, delimiter=';')
            
            # Пропускаем заголовок
            header = next(reader)
            
            cursor = connection.cursor()
            
            # SQL запрос для вставки данных
            insert_query = """
            INSERT INTO justincase_base_tariffs 
            (period, age, gender, death_rate, disability_rate, death_accident_rate, 
             death_traffic_rate, trauma_rate, kz_rf_payment, kz_abroad_payment, additional_rate)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            
            rows_processed = 0
            rows_inserted = 0
            
            for row_num, row in enumerate(reader, start=2):
                if len(row) < 11:  # Минимальное количество колонок
                    print(f"Строка {row_num}: недостаточно колонок - {len(row)}")
                    continue
                
                try:
                    # Парсим основные поля
                    period = int(row[0]) if row[0].strip() else None
                    age = int(row[1]) if row[1].strip() else None
                    gender = row[2].strip().lower() if row[2].strip() else None
                    
                    if not period or not age or not gender:
                        print(f"Строка {row_num}: отсутствуют обязательные поля")
                        continue
                    
                    # Парсим процентные значения
                    death_rate = parse_percentage(row[3])
                    disability_rate = parse_percentage(row[4])
                    death_accident_rate = parse_percentage(row[5])
                    death_traffic_rate = parse_percentage(row[6])
                    trauma_rate = parse_percentage(row[7])
                    
                    if death_rate is None or disability_rate is None:
                        print(f"Строка {row_num}: не удалось парсить основные тарифы")
                        continue
                    
                    # Парсим денежные значения
                    kz_rf_payment = parse_decimal(row[8])
                    kz_abroad_payment = parse_decimal(row[9])
                    additional_rate = parse_decimal(row[10])
                    
                    # Вставляем данные
                    cursor.execute(insert_query, (
                        period, age, gender, death_rate, disability_rate,
                        death_accident_rate, death_traffic_rate, trauma_rate,
                        kz_rf_payment, kz_abroad_payment, additional_rate
                    ))
                    
                    rows_inserted += 1
                    
                except Exception as e:
                    print(f"Ошибка обработки строки {row_num}: {e}")
                    print(f"Данные строки: {row}")
                
                rows_processed += 1
                
                if rows_processed % 100 == 0:
                    print(f"Обработано строк: {rows_processed}, вставлено: {rows_inserted}")
            
            connection.commit()
            cursor.close()
            
            print(f"Загрузка завершена. Обработано: {rows_processed}, вставлено: {rows_inserted}")
            return True
            
    except Exception as e:
        print(f"Ошибка загрузки файла: {e}")
        return False

def test_data(connection):
    """Тестирование загруженных данных"""
    try:
        cursor = connection.cursor()
        
        # Общая статистика
        cursor.execute("SELECT COUNT(*) FROM justincase_base_tariffs")
        total_count = cursor.fetchone()[0]
        print(f"Всего записей в таблице: {total_count}")
        
        # Проверяем конкретные значения для 35-летнего мужчины, 15 лет
        cursor.execute("""
            SELECT age, gender, period, death_rate, disability_rate 
            FROM justincase_base_tariffs 
            WHERE age = 35 AND gender = 'm' AND period = 15
        """)
        test_row = cursor.fetchone()
        
        if test_row:
            print(f"Тестовая запись (возраст 35, пол м, период 15): {test_row}")
            print(f"Смерть ЛП: {float(test_row[3]):.6f} ({float(test_row[3])*100:.4f}%)")
            print(f"Инвалидность: {float(test_row[4]):.6f} ({float(test_row[4])*100:.4f}%)")
        else:
            print("Тестовая запись не найдена")
        
        # Проверяем диапазон возрастов
        cursor.execute("SELECT MIN(age), MAX(age) FROM justincase_base_tariffs")
        age_range = cursor.fetchone()
        print(f"Диапазон возрастов: {age_range[0]} - {age_range[1]}")
        
        # Проверяем периоды
        cursor.execute("SELECT DISTINCT period FROM justincase_base_tariffs ORDER BY period")
        periods = cursor.fetchall()
        print(f"Доступные периоды: {[p[0] for p in periods]}")
        
        cursor.close()
        return True
        
    except Exception as e:
        print(f"Ошибка тестирования: {e}")
        return False

def main():
    print("Загрузка базовых тарифов в PostgreSQL...")
    
    # Проверяем существование CSV файла
    csv_file = "Базовые тарифы.csv"
    if not os.path.exists(csv_file):
        print(f"Файл {csv_file} не найден")
        return False
    
    # Подключаемся к базе данных
    connection = create_connection()
    if not connection:
        return False
    
    try:
        # Создаем таблицу
        if not create_tariffs_table(connection):
            return False
        
        # Загружаем данные
        if not load_tariffs_from_csv(connection, csv_file):
            return False
        
        # Тестируем данные
        if not test_data(connection):
            return False
        
        print("Загрузка тарифов завершена успешно!")
        return True
        
    finally:
        connection.close()

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
