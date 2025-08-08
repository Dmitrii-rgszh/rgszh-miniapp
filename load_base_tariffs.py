#!/usr/bin/env python3
# load_base_tariffs.py - Скрипт для загрузки базовых тарифов из CSV в базу данных

import pandas as pd
import psycopg2
import logging
from pathlib import Path

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Параметры подключения к базе данных
DB_CONFIG = {
    "user": "postgres",
    "password": "secret", 
            "host": "176.108.243.189",
    "port": 1112,
    "dbname": "postgres"
}

def create_base_tariffs_table(cursor):
    """Создает таблицу base_tariffs если она не существует"""
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS base_tariffs (
        id SERIAL PRIMARY KEY,
        payment_period INTEGER NOT NULL,
        insured_age INTEGER NOT NULL,
        gender VARCHAR(10) NOT NULL,
        death_lp DECIMAL(10, 6) NOT NULL,
        disability_lp DECIMAL(10, 6) NOT NULL,
        death_accident DECIMAL(10, 6) NOT NULL,
        death_transport DECIMAL(10, 6) NOT NULL,
        trauma DECIMAL(10, 6) NOT NULL,
        kz_russia_premium DECIMAL(12, 2) NOT NULL,
        kz_foreign_premium DECIMAL(12, 2) NOT NULL,
        discount_kv DECIMAL(10, 6) NOT NULL,
        loading DECIMAL(10, 6) NOT NULL,
        loading_kz DECIMAL(10, 6) NOT NULL,
        interest_rate DECIMAL(10, 6) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Создаем индексы для быстрого поиска
    CREATE INDEX IF NOT EXISTS idx_base_tariffs_age_gender ON base_tariffs(insured_age, gender);
    CREATE INDEX IF NOT EXISTS idx_base_tariffs_period ON base_tariffs(payment_period);
    """
    
    try:
        cursor.execute(create_table_sql)
        logger.info("✅ Таблица base_tariffs создана или уже существует")
        return True
    except Exception as e:
        logger.error(f"❌ Ошибка создания таблицы: {e}")
        return False

def clean_csv_data(df):
    """Очищает и подготавливает данные из CSV"""
    logger.info("Очистка данных из CSV...")
    
    # Получаем точные названия столбцов
    age_column = None
    gender_column = None
    
    for col in df.columns:
        if 'Возраст' in col or 'возраст' in col:
            age_column = col
        elif 'Пол' in col or 'пол' in col:
            gender_column = col
    
    if not age_column or not gender_column:
        logger.error(f"Не найдены столбцы возраста или пола. Доступные столбцы: {list(df.columns)}")
        raise ValueError("Не найдены обязательные столбцы")
    
    logger.info(f"Найдены столбцы: возраст='{age_column}', пол='{gender_column}'")
    
    # Удаляем строки с пустыми значениями в ключевых полях
    df = df.dropna(subset=[age_column, gender_column])
    
    # Преобразуем возраст в числовой формат
    df[age_column] = pd.to_numeric(df[age_column], errors='coerce')
    df = df.dropna(subset=[age_column])
    
    # Преобразуем процентные значения в десятичные числа
    percentage_columns = [
        'Смерть ЛП', 'Инвалидность 1,2. гр. ЛП', 'Смерть НС', 
        'Смерть ДТП', 'Травма', 'Дисконт к КВ', 'Нагрузка', 'Нагрузка КЗ', 'i'
    ]
    
    for col in percentage_columns:
        if col in df.columns:
            # Убираем знак % и преобразуем в десятичное число
            df[col] = df[col].astype(str).str.replace('%', '').str.replace(',', '.')
            df[col] = pd.to_numeric(df[col], errors='coerce')
    
    # Преобразуем суммы в числовой формат
    money_columns = ['КЗ РФ\nВзнос', 'КЗ Зарубеж\nВзнос']
    for col in money_columns:
        if col in df.columns:
            # Убираем пробелы и заменяем запятую на точку
            df[col] = df[col].astype(str).str.replace(' ', '').str.replace(',', '.')
            df[col] = pd.to_numeric(df[col], errors='coerce')
    
    logger.info(f"✅ Данные очищены. Осталось строк: {len(df)}")
    return df

def load_data_to_database(df, cursor, conn):
    """Загружает данные в базу данных"""
    logger.info("Загрузка данных в базу данных...")
    
    # Получаем точные названия столбцов
    age_column = None
    gender_column = None
    
    for col in df.columns:
        if 'Возраст' in col or 'возраст' in col:
            age_column = col
        elif 'Пол' in col or 'пол' in col:
            gender_column = col
    
    # Подготавливаем данные для вставки
    insert_sql = """
    INSERT INTO base_tariffs (
        payment_period, insured_age, gender, death_lp, disability_lp,
        death_accident, death_transport, trauma, kz_russia_premium,
        kz_foreign_premium, discount_kv, loading, loading_kz, interest_rate
    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    
    # Очищаем таблицу перед загрузкой новых данных
    cursor.execute("DELETE FROM base_tariffs")
    logger.info("Старые данные удалены из таблицы")
    
    # Загружаем новые данные
    records_count = 0
    for _, row in df.iterrows():
        try:
            values = (
                int(row['Период уплаты премии']),
                int(row[age_column]),
                str(row[gender_column]),
                float(row['Смерть ЛП']),
                float(row['Инвалидность 1,2. гр. ЛП']),
                float(row['Смерть НС']),
                float(row['Смерть ДТП']),
                float(row['Травма']),
                float(row['КЗ РФ\nВзнос']),
                float(row['КЗ Зарубеж\nВзнос']),
                float(row['Дисконт к КВ']),
                float(row['Нагрузка']),
                float(row['Нагрузка КЗ']),
                float(row['i'])
            )
            cursor.execute(insert_sql, values)
            records_count += 1
            
            if records_count % 100 == 0:
                logger.info(f"Загружено записей: {records_count}")
                
        except Exception as e:
            logger.warning(f"Ошибка при загрузке строки {records_count + 1}: {e}")
            continue
    
    conn.commit()
    logger.info(f"✅ Загружено записей в базу данных: {records_count}")
    return records_count

def verify_data_loaded(cursor):
    """Проверяет, что данные загружены корректно"""
    try:
        cursor.execute("SELECT COUNT(*) FROM base_tariffs")
        count = cursor.fetchone()[0]
        logger.info(f"✅ В таблице base_tariffs записей: {count}")
        
        # Проверяем диапазон возрастов
        cursor.execute("SELECT MIN(insured_age), MAX(insured_age) FROM base_tariffs")
        age_range = cursor.fetchone()
        logger.info(f"✅ Диапазон возрастов: {age_range[0]} - {age_range[1]}")
        
        # Проверяем полы
        cursor.execute("SELECT gender, COUNT(*) FROM base_tariffs GROUP BY gender")
        genders = cursor.fetchall()
        logger.info(f"✅ Распределение по полу: {dict(genders)}")
        
        return True
    except Exception as e:
        logger.error(f"❌ Ошибка проверки данных: {e}")
        return False

def main():
    """Основная функция"""
    csv_path = Path("Базовые тарифы.csv")
    
    if not csv_path.exists():
        logger.error(f"❌ Файл не найден: {csv_path}")
        return False
    
    try:
        # Подключение к базе данных
        logger.info("Подключение к базе данных...")
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # Создание таблицы
        if not create_base_tariffs_table(cursor):
            return False
        
        # Чтение CSV файла
        logger.info(f"Чтение CSV файла: {csv_path}")
        df = pd.read_csv(csv_path, sep=';', encoding='cp1251', encoding_errors='replace')
        logger.info(f"Прочитано строк из CSV: {len(df)}")
        
        # Выводим названия столбцов для отладки
        logger.info(f"Названия столбцов: {list(df.columns)}")
        
        # Очистка данных
        df = clean_csv_data(df)
        
        # Загрузка данных в базу
        records_count = load_data_to_database(df, cursor, conn)
        
        # Проверка загрузки
        verify_data_loaded(cursor)
        
        cursor.close()
        conn.close()
        
        logger.info("✅ Загрузка завершена успешно!")
        return True
        
    except Exception as e:
        logger.error(f"❌ Ошибка: {e}")
        return False

if __name__ == "__main__":
    success = main()
    if success:
        print("\n🎉 Загрузка базовых тарифов завершена успешно!")
    else:
        print("\n💥 Произошла ошибка при загрузке данных!") 