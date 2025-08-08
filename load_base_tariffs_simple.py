#!/usr/bin/env python3
# load_base_tariffs_simple.py - Упрощенный скрипт для загрузки базовых тарифов

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
    
    # Используем индексы столбцов вместо названий
    # Структура CSV: Период;Возраст;Пол;Смерть ЛП;Инвалидность;Смерть НС;Смерть ДТП;Травма;КЗ РФ;КЗ Зарубеж;Дисконт;Нагрузка;Нагрузка КЗ;i
    
    # Удаляем строки с пустыми значениями в ключевых полях (индексы 1 и 2)
    df = df.dropna(subset=[df.columns[1], df.columns[2]])
    
    # Преобразуем возраст в числовой формат (индекс 1)
    df.iloc[:, 1] = pd.to_numeric(df.iloc[:, 1], errors='coerce')
    df = df.dropna(subset=[df.columns[1]])
    
    # Преобразуем процентные значения в десятичные числа (индексы 3-8, 10-12)
    percentage_indices = [3, 4, 5, 6, 7, 10, 11, 12]
    for idx in percentage_indices:
        if idx < len(df.columns):
            # Убираем знак % и преобразуем в десятичное число
            df.iloc[:, idx] = df.iloc[:, idx].astype(str).str.replace('%', '').str.replace(',', '.')
            df.iloc[:, idx] = pd.to_numeric(df.iloc[:, idx], errors='coerce')
    
    # Преобразуем суммы в числовой формат (индексы 8, 9)
    money_indices = [8, 9]
    for idx in money_indices:
        if idx < len(df.columns):
            # Убираем пробелы и заменяем запятую на точку
            df.iloc[:, idx] = df.iloc[:, idx].astype(str).str.replace(' ', '').str.replace(',', '.')
            df.iloc[:, idx] = pd.to_numeric(df.iloc[:, idx], errors='coerce')
    
    # Преобразуем последний столбец (индекс 13) - процентная ставка
    if len(df.columns) > 13:
        df.iloc[:, 13] = df.iloc[:, 13].astype(str).str.replace(',', '.')
        df.iloc[:, 13] = pd.to_numeric(df.iloc[:, 13], errors='coerce')
    
    logger.info(f"✅ Данные очищены. Осталось строк: {len(df)}")
    return df

def load_data_to_database(df, cursor, conn):
    """Загружает данные в базу данных"""
    logger.info("Загрузка данных в базу данных...")
    
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
                int(row.iloc[0]),      # Период уплаты премии
                int(row.iloc[1]),      # Возраст
                str(row.iloc[2]),      # Пол
                float(row.iloc[3]),    # Смерть ЛП
                float(row.iloc[4]),    # Инвалидность
                float(row.iloc[5]),    # Смерть НС
                float(row.iloc[6]),    # Смерть ДТП
                float(row.iloc[7]),    # Травма
                float(row.iloc[8]),    # КЗ РФ
                float(row.iloc[9]),    # КЗ Зарубеж
                float(row.iloc[10]),   # Дисконт к КВ
                float(row.iloc[11]),   # Нагрузка
                float(row.iloc[12]),   # Нагрузка КЗ
                float(row.iloc[13])    # i
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
        logger.info(f"Количество столбцов: {len(df.columns)}")
        
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