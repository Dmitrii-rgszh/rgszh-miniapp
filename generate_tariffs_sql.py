#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import csv
import sys
from decimal import Decimal, InvalidOperation

def parse_percentage(value):
    """Парсинг процентного значения в десятичное число"""
    if not value or value.strip() == '':
        return 'NULL'
    
    try:
        # Убираем знак процента и заменяем запятую на точку
        clean_value = value.replace('%', '').replace(',', '.').strip()
        if clean_value == '' or clean_value == '0':
            return '0'
        result = float(clean_value) / 100
        return str(result)
    except (ValueError) as e:
        print(f"Ошибка парсинга значения '{value}': {e}", file=sys.stderr)
        return 'NULL'

def parse_decimal(value):
    """Парсинг числового значения"""
    if not value or value.strip() == '':
        return 'NULL'
    
    try:
        # Убираем пробелы и заменяем запятую на точку
        clean_value = value.replace(' ', '').replace(',', '.').strip()
        if clean_value == '' or clean_value == '0':
            return '0'
        return str(float(clean_value))
    except (ValueError) as e:
        print(f"Ошибка парсинга числа '{value}': {e}", file=sys.stderr)
        return 'NULL'

def process_csv(csv_filename):
    """Генерация SQL запросов из CSV файла"""
    # Пробуем разные кодировки
    encodings = ['utf-8', 'cp1251', 'windows-1251', 'utf-8-sig']
    
    for encoding in encodings:
        try:
            print(f"-- Пробуем кодировку: {encoding}", file=sys.stderr)
            with open(csv_filename, 'r', encoding=encoding) as file:
                # Читаем CSV с точкой с запятой как разделителем
                reader = csv.reader(file, delimiter=';')
                
                # Пропускаем заголовок
                header = next(reader)
                print(f"-- Заголовки: {header}", file=sys.stderr)
                break
        except UnicodeDecodeError:
            continue
    else:
        print("-- Не удалось определить кодировку файла", file=sys.stderr)
        return False
    
    # Если дошли сюда, то кодировка найдена
    print(f"-- Используем кодировку: {encoding}", file=sys.stderr)
    
    # Генерируем SQL
    print("-- Очищаем таблицу")
    print("DELETE FROM justincase_base_tariffs;")
    print("")
    print("-- Вставляем данные")
    
    with open(csv_filename, 'r', encoding=encoding) as file:
        reader = csv.reader(file, delimiter=';')
        
        # Пропускаем заголовок
        header = next(reader)
        
        rows_processed = 0
        rows_valid = 0
        
        for row_num, row in enumerate(reader, start=2):
            if len(row) < 11:  # Минимальное количество колонок
                print(f"-- Строка {row_num}: недостаточно колонок - {len(row)}", file=sys.stderr)
                continue
            
            try:
                # Парсим основные поля
                period = int(row[0]) if row[0].strip() else None
                age = int(row[1]) if row[1].strip() else None
                gender = row[2].strip().lower() if row[2].strip() else None
                
                if not period or not age or not gender:
                    print(f"-- Строка {row_num}: отсутствуют обязательные поля", file=sys.stderr)
                    continue
                
                # Парсим процентные значения
                death_rate = parse_percentage(row[3])
                disability_rate = parse_percentage(row[4])
                death_accident_rate = parse_percentage(row[5])
                death_traffic_rate = parse_percentage(row[6])
                trauma_rate = parse_percentage(row[7])
                
                if death_rate == 'NULL' or disability_rate == 'NULL':
                    print(f"-- Строка {row_num}: не удалось парсить основные тарифы", file=sys.stderr)
                    continue
                
                # Парсим денежные значения
                kz_rf_payment = parse_decimal(row[8])
                kz_abroad_payment = parse_decimal(row[9])
                additional_rate = parse_decimal(row[10])
                
                # Генерируем SQL
                sql = f"""INSERT INTO justincase_base_tariffs 
(period, age, gender, death_rate, disability_rate, death_accident_rate, 
 death_traffic_rate, trauma_rate, kz_rf_payment, kz_abroad_payment, additional_rate)
VALUES ({period}, {age}, '{gender}', {death_rate}, {disability_rate}, {death_accident_rate}, 
        {death_traffic_rate}, {trauma_rate}, {kz_rf_payment}, {kz_abroad_payment}, {additional_rate});"""
                
                print(sql)
                rows_valid += 1
                
            except Exception as e:
                print(f"-- Ошибка обработки строки {row_num}: {e}", file=sys.stderr)
                print(f"-- Данные строки: {row}", file=sys.stderr)
            
            rows_processed += 1
            
            if rows_processed % 100 == 0:
                print(f"-- Обработано строк: {rows_processed}, валидных: {rows_valid}", file=sys.stderr)
        
        print(f"-- Обработка завершена. Всего: {rows_processed}, валидных: {rows_valid}", file=sys.stderr)
        
        # Добавляем тестовые запросы
        print("")
        print("-- Тестовые запросы")
        print("SELECT COUNT(*) as total_records FROM justincase_base_tariffs;")
        print("SELECT age, gender, period, death_rate, disability_rate FROM justincase_base_tariffs WHERE age = 35 AND gender = 'm' AND period = 15;")
        print("SELECT MIN(age), MAX(age) FROM justincase_base_tariffs;")
        print("SELECT DISTINCT period FROM justincase_base_tariffs ORDER BY period;")
        
        return True

def main():
    csv_file = "Базовые тарифы.csv"
    
    if len(sys.argv) > 1:
        csv_file = sys.argv[1]
    
    print(f"-- Генерация SQL из файла: {csv_file}", file=sys.stderr)
    
    if not process_csv(csv_file):
        sys.exit(1)

if __name__ == "__main__":
    main()
