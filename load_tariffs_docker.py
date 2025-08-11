#!/usr/bin/env python3
"""
Простой скрипт для загрузки данных через Docker exec
"""

import csv
import subprocess
import os

def convert_percent_to_decimal(value):
    """Конвертируем проценты (0,3231%) в десятичное число (0.003231)"""
    if not value or value.strip() == '':
        return 0.0
    
    # Убираем % и заменяем запятую на точку
    cleaned = value.replace('%', '').replace(',', '.').strip()
    return float(cleaned) / 100

def main():
    csv_file = 'Базовые тарифы.csv'
    
    if not os.path.exists(csv_file):
        print(f"Файл {csv_file} не найден!")
        return False
    
    try:
        # Сначала очищаем таблицу
        print("Очищаем существующую таблицу...")
        clear_cmd = [
            'docker', 'exec', '-i', 'rgszh-miniapp-postgres-1',
            'psql', '-U', 'postgres', '-d', 'miniapp',
            '-c', 'DELETE FROM justincase_base_tariffs;'
        ]
        subprocess.run(clear_cmd, check=True)
        
        # Создаем SQL файл для вставки данных
        sql_file = 'insert_tariffs.sql'
        inserted_count = 0
        
        with open(sql_file, 'w', encoding='utf-8') as sql_f:
            sql_f.write("BEGIN;\n")
            
            # Читаем CSV файл
            with open(csv_file, 'r', encoding='cp1251') as csv_f:
                reader = csv.reader(csv_f, delimiter=';')
                
                # Пропускаем заголовок
                header = next(reader)
                
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
                        
                        # Генерируем SQL
                        sql_f.write(f"""
INSERT INTO justincase_base_tariffs 
(term_years, age, gender, death_rate, disability_rate, 
 accident_death_rate, traffic_death_rate, injury_rate,
 critical_illness_rf_fee, critical_illness_abroad_fee, coefficient_i)
VALUES ({term_years}, {age}, '{gender}', {death_rate}, {disability_rate}, 
        {accident_death_rate}, {traffic_death_rate}, {injury_rate},
        {critical_illness_rf_fee}, {critical_illness_abroad_fee}, {coefficient_i});
""")
                        
                        inserted_count += 1
                        
                        if inserted_count % 500 == 0:
                            print(f"Подготовлено {inserted_count} записей...")
                            
                    except Exception as e:
                        print(f"Ошибка в строке {row_num}: {e}")
                        continue
            
            sql_f.write("COMMIT;\n")
        
        print(f"Подготовлено {inserted_count} записей для вставки")
        
        # Выполняем SQL
        print("Выполняем вставку в БД...")
        insert_cmd = [
            'docker', 'exec', '-i', 'rgszh-miniapp-postgres-1',
            'psql', '-U', 'postgres', '-d', 'miniapp'
        ]
        
        with open(sql_file, 'r', encoding='utf-8') as f:
            result = subprocess.run(insert_cmd, input=f.read(), text=True, check=True)
        
        print(f"✅ Успешно загружено {inserted_count} тарифных записей!")
        
        # Проверяем результат
        check_cmd = [
            'docker', 'exec', '-i', 'rgszh-miniapp-postgres-1',
            'psql', '-U', 'postgres', '-d', 'miniapp',
            '-c', 'SELECT COUNT(*) FROM justincase_base_tariffs;'
        ]
        result = subprocess.run(check_cmd, capture_output=True, text=True)
        print(f"Результат проверки:\n{result.stdout}")
        
        # Удаляем временный SQL файл
        os.remove(sql_file)
        
        return True
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        return False

if __name__ == "__main__":
    main()
