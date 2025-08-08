#!/usr/bin/env python3
# check_table_structure.py - Скрипт для проверки структуры таблицы

import psycopg2
import logging

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

def check_table_structure():
    """Проверяет структуру таблицы base_tariffs"""
    try:
        # Подключение к базе данных
        logger.info("Подключение к базе данных...")
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # Проверяем, существует ли таблица
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'base_tariffs'
            );
        """)
        table_exists = cursor.fetchone()[0]
        
        if not table_exists:
            logger.error("❌ Таблица base_tariffs не существует!")
            return False
        
        logger.info("✅ Таблица base_tariffs существует")
        
        # Получаем структуру таблицы
        cursor.execute("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'base_tariffs'
            ORDER BY ordinal_position;
        """)
        
        columns = cursor.fetchall()
        logger.info("Структура таблицы base_tariffs:")
        for col in columns:
            logger.info(f"  {col[0]} ({col[1]}) - {'NULL' if col[2] == 'YES' else 'NOT NULL'}")
        
        # Проверяем количество записей
        cursor.execute("SELECT COUNT(*) FROM base_tariffs")
        count = cursor.fetchone()[0]
        logger.info(f"Количество записей в таблице: {count}")
        
        cursor.close()
        conn.close()
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Ошибка: {e}")
        return False

if __name__ == "__main__":
    check_table_structure() 