#!/usr/bin/env python3
"""
Скрипт для загрузки тарифных коэффициентов из CSV файла в PostgreSQL
"""

import csv
import psycopg2
import sys
import os

def convert_percent_to_decimal(value):
    """Конвертируем проценты (0,3231%) в десятичное число (0.003231)"""
    if not value or value.strip() == '':
        return 0.0
    
    # Убираем % и заменяем запятую на точку
    cleaned = value.replace('%', '').replace(',', '.').strip()
    return float(cleaned) / 100

def main():
    # Параметры подключения к БД в Docker
    DB_CONFIG = {
        'host': 'localhost',
        'database': 'miniapp',
        'user': 'postgres',
        'password': 'password',  # Пароль из docker-compose
        'port': 5433  # Порт из docker-compose
    }
    
    csv_file = 'Базовые тарифы.csv'
    
    if not os.path.exists(csv_file):
        print(f"Файл {csv_file} не найден!")
        return False
    
    try:
        # Подключаемся к БД
        print("Подключаемся к PostgreSQL...")
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # Очищаем существующую таблицу
        print("Очищаем существующую таблицу justincase_base_tariffs...")
        cursor.execute("DELETE FROM justincase_base_tariffs;")
        
        # Читаем CSV файл
        print(f"Читаем данные из {csv_file}...")
        
        inserted_count = 0
        
        with open(csv_file, 'r', encoding='cp1251') as f:
            reader = csv.reader(f, delimiter=';')
            
            # Пропускаем заголовок
            header = next(reader)
            print(f"Заголовки: {header}")
            
            for row_num, row in enumerate(reader, start=2):
                if len(row) < 10:
                    continue
                    
                try:
                    # Парсим данные из CSV
                    term_years = int(row[0])
                    age = int(row[1])
                    gender = row[2].strip()
                    
                    # Конвертируем проценты в десятичные числа
                    death_rate = convert_percent_to_decimal(row[3])
                    disability_rate = convert_percent_to_decimal(row[4])
                    accident_death_rate = convert_percent_to_decimal(row[5])
                    traffic_death_rate = convert_percent_to_decimal(row[6])
                    injury_rate = convert_percent_to_decimal(row[7])
                    
                    # КЗ взносы
                    critical_illness_rf_fee = float(row[8].replace(',', '.').replace(' ', ''))
                    critical_illness_abroad_fee = float(row[9].replace(',', '.').replace(' ', ''))
                    
                    # Коэффициент i
                    coefficient_i = float(row[10].replace(',', '.')) if row[10].strip() else 0.08
                    
                    # Вставляем в БД
                    insert_query = """
                    INSERT INTO justincase_base_tariffs 
                    (term_years, age, gender, death_rate, disability_rate, 
                     accident_death_rate, traffic_death_rate, injury_rate,
                     critical_illness_rf_fee, critical_illness_abroad_fee, coefficient_i)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """
                    
                    cursor.execute(insert_query, (
                        term_years, age, gender, death_rate, disability_rate,
                        accident_death_rate, traffic_death_rate, injury_rate,
                        critical_illness_rf_fee, critical_illness_abroad_fee, coefficient_i
                    ))
                    
                    inserted_count += 1
                    
                    if inserted_count % 100 == 0:
                        print(f"Загружено {inserted_count} записей...")
                        
                except Exception as e:
                    print(f"Ошибка в строке {row_num}: {e}")
                    print(f"Данные строки: {row}")
                    continue
        
        # Сохраняем изменения
        conn.commit()
        print(f"✅ Успешно загружено {inserted_count} тарифных записей!")
        
        # Проверяем результат
        cursor.execute("SELECT COUNT(*) FROM justincase_base_tariffs;")
        total_count = cursor.fetchone()[0]
        print(f"Всего записей в таблице: {total_count}")
        
        # Показываем пример данных
        cursor.execute("""
            SELECT term_years, age, gender, death_rate, disability_rate 
            FROM justincase_base_tariffs 
            WHERE age = 35 AND term_years = 15 
            ORDER BY gender;
        """)
        
        results = cursor.fetchall()
        print("\nПример данных (возраст 35, срок 15 лет):")
        for row in results:
            term, age, gender, death, disability = row
            print(f"  {gender}: death={death:.6f} ({death*100:.4f}%), disability={disability:.6f} ({disability*100:.4f}%)")
        
        cursor.close()
        conn.close()
        
        return True
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
