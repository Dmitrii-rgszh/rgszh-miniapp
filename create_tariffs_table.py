import sqlite3
import csv

def create_table_and_load_data():
    """Создает таблицу justincase_base_tariffs и загружает данные из CSV"""
    
    conn = sqlite3.connect('miniapp.db')
    cursor = conn.cursor()
    
    try:
        # Создаем таблицу
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
        
        # Создаем индексы для быстрого поиска
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_tariffs_lookup 
            ON justincase_base_tariffs(age, gender, term_years)
        """)
        
        print("Таблица justincase_base_tariffs создана")
        
        # Очищаем таблицу перед загрузкой
        cursor.execute("DELETE FROM justincase_base_tariffs")
        print("Таблица очищена")
        
        # Загружаем данные из CSV
        csv_file = "Базовые тарифы.csv"
        
        # Пробуем разные кодировки
        encodings = ['utf-8', 'cp1251', 'windows-1251', 'utf-8-sig']
        
        for encoding in encodings:
            try:
                print(f"Пробуем кодировку: {encoding}")
                with open(csv_file, 'r', encoding=encoding) as file:
                    reader = csv.reader(file, delimiter=';')
                    header = next(reader)  # Пропускаем заголовок
                    break
            except UnicodeDecodeError:
                continue
        else:
            print("Не удалось определить кодировку файла")
            return False
        
        print(f"Используем кодировку: {encoding}")
        
        def parse_percentage(value):
            """Парсинг процентного значения"""
            if not value or value.strip() == '':
                return 0.0
            try:
                clean_value = value.replace('%', '').replace(',', '.').strip()
                return float(clean_value) / 100 if clean_value else 0.0
            except ValueError:
                return 0.0
        
        def parse_decimal(value):
            """Парсинг числового значения"""
            if not value or value.strip() == '':
                return 0.0
            try:
                clean_value = value.replace(' ', '').replace(',', '.').strip()
                return float(clean_value) if clean_value else 0.0
            except ValueError:
                return 0.0
        
        # Загружаем данные
        with open(csv_file, 'r', encoding=encoding) as file:
            reader = csv.reader(file, delimiter=';')
            header = next(reader)  # Пропускаем заголовок
            
            rows_processed = 0
            rows_inserted = 0
            
            for row_num, row in enumerate(reader, start=2):
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
                    
                    # Вставляем запись
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
                    print(f"Ошибка обработки строки {row_num}: {e}")
                
                rows_processed += 1
                
                if rows_processed % 500 == 0:
                    print(f"Обработано строк: {rows_processed}, вставлено: {rows_inserted}")
        
        conn.commit()
        print(f"Загрузка завершена. Всего обработано: {rows_processed}, вставлено: {rows_inserted}")
        
        # Проверяем результат
        cursor.execute("SELECT COUNT(*) FROM justincase_base_tariffs")
        count = cursor.fetchone()[0]
        print(f"Всего записей в таблице: {count}")
        
        # Показываем несколько примеров
        cursor.execute("""
            SELECT term_years, age, gender, death_rate, disability_rate, 
                   critical_illness_rf_fee, critical_illness_abroad_fee
            FROM justincase_base_tariffs 
            WHERE age = 30 AND gender = 'm' 
            ORDER BY term_years 
            LIMIT 5
        """)
        examples = cursor.fetchall()
        print("\nПримеры загруженных данных (возраст 30, мужчина):")
        for row in examples:
            print(f"  Срок: {row[0]}, Смерть: {row[3]:.4f}, Инвалидность: {row[4]:.4f}, КЗ РФ: {row[5]:.2f}, КЗ Зарубеж: {row[6]:.2f}")
        
        return True
        
    except Exception as e:
        print(f"Ошибка: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

if __name__ == "__main__":
    create_table_and_load_data()
