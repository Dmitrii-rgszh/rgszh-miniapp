# -*- coding: utf-8 -*-
"""
Инициализация базы данных для калькулятора JustInCase
Создание таблиц и загрузка базовых тарифов из файла base_tariffs.txt
"""

import psycopg2
import logging
import os
import sys
from typing import Dict, Any
import re

# Настройка логирования
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class JustInCaseDatabase:
    def __init__(self):
        self.db_config = {
            'host': os.getenv('DB_HOST', '176.108.243.189'),
            'port': int(os.getenv('DB_PORT', 5432)),
            'database': os.getenv('DB_NAME', 'miniapp'),
            'user': os.getenv('DB_USER', 'postgres'),
            'password': os.getenv('DB_PASSWORD', 'secret')
        }
        
    def connect(self):
        """Подключение к базе данных"""
        try:
            conn = psycopg2.connect(**self.db_config)
            logger.info("✅ Подключение к PostgreSQL установлено")
            return conn
        except Exception as e:
            logger.error(f"❌ Ошибка подключения к БД: {e}")
            return None

    def create_tables(self):
        """Создание таблиц для калькулятора JustInCase"""
        conn = self.connect()
        if not conn:
            return False
            
        try:
            cursor = conn.cursor()
            
            # Создаем таблицу базовых тарифов
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS justincase_base_tariffs (
                    id SERIAL PRIMARY KEY,
                    term_years INTEGER NOT NULL,
                    age INTEGER NOT NULL,
                    gender CHAR(1) NOT NULL CHECK (gender IN ('m', 'f')),
                    death_rate DECIMAL(10, 8) NOT NULL,
                    critical_illness_rate DECIMAL(10, 8) NOT NULL,
                    accident_rate DECIMAL(10, 8) NOT NULL DEFAULT 0.0009684,
                    injury_rate DECIMAL(10, 8) NOT NULL DEFAULT 0.0002424,
                    additional_rate DECIMAL(10, 8) NOT NULL DEFAULT 0.001584,
                    base_sum_1 DECIMAL(12, 2) NOT NULL,
                    base_sum_2 DECIMAL(12, 2) NOT NULL,
                    coefficient_i DECIMAL(6, 4) NOT NULL DEFAULT 0.08,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(term_years, age, gender)
                );
            """)
            
            # Создаем таблицу коэффициентов частоты выплат
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS justincase_frequency_coefficients (
                    id SERIAL PRIMARY KEY,
                    payment_frequency VARCHAR(20) NOT NULL UNIQUE,
                    coefficient DECIMAL(6, 4) NOT NULL,
                    description VARCHAR(100),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            
            # Создаем таблицу расчетов
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS justincase_calculations (
                    id SERIAL PRIMARY KEY,
                    calculation_id VARCHAR(50) UNIQUE NOT NULL,
                    age INTEGER NOT NULL,
                    gender CHAR(1) NOT NULL,
                    term_years INTEGER NOT NULL,
                    sum_insured DECIMAL(15, 2) NOT NULL,
                    include_accident BOOLEAN DEFAULT TRUE,
                    include_critical_illness BOOLEAN DEFAULT TRUE,
                    payment_frequency VARCHAR(20) DEFAULT 'annual',
                    base_premium DECIMAL(15, 2) NOT NULL,
                    accident_premium DECIMAL(15, 2) NOT NULL DEFAULT 0,
                    critical_premium DECIMAL(15, 2) NOT NULL DEFAULT 0,
                    total_premium DECIMAL(15, 2) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            
            # Создаем индексы
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_justincase_tariffs_lookup 
                ON justincase_base_tariffs (term_years, age, gender);
            """)
            
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_justincase_calculations_id 
                ON justincase_calculations (calculation_id);
            """)
            
            conn.commit()
            logger.info("✅ Таблицы калькулятора JustInCase созданы успешно")
            return True
            
        except Exception as e:
            logger.error(f"❌ Ошибка создания таблиц: {e}")
            conn.rollback()
            return False
        finally:
            cursor.close()
            conn.close()

    def load_frequency_coefficients(self):
        """Загрузка коэффициентов частоты выплат"""
        conn = self.connect()
        if not conn:
            return False
            
        try:
            cursor = conn.cursor()
            
            # Коэффициенты частоты выплат
            frequency_data = [
                ('annual', 1.0000, 'Годовая выплата'),
                ('semi_annual', 0.5150, 'Полугодовая выплата'),
                ('quarterly', 0.2640, 'Ежеквартальная выплата'),
                ('monthly', 0.0870, 'Ежемесячная выплата')
            ]
            
            for freq, coeff, desc in frequency_data:
                cursor.execute("""
                    INSERT INTO justincase_frequency_coefficients 
                    (payment_frequency, coefficient, description)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (payment_frequency) 
                    DO UPDATE SET coefficient = EXCLUDED.coefficient,
                                description = EXCLUDED.description;
                """, (freq, coeff, desc))
            
            conn.commit()
            logger.info("✅ Коэффициенты частоты выплат загружены")
            return True
            
        except Exception as e:
            logger.error(f"❌ Ошибка загрузки коэффициентов: {e}")
            conn.rollback()
            return False
        finally:
            cursor.close()
            conn.close()

    def parse_tariff_file(self, file_path: str):
        """Парсинг файла с тарифами"""
        logger.info(f"📊 Парсинг файла тарифов: {file_path}")
        
        if not os.path.exists(file_path):
            logger.error(f"❌ Файл {file_path} не найден")
            return []
            
        tariffs = []
        
        try:
            # Пробуем разные кодировки
            encodings = ['utf-8', 'cp1251', 'windows-1251', 'utf-16']
            content = None
            
            for encoding in encodings:
                try:
                    with open(file_path, 'r', encoding=encoding) as f:
                        content = f.read()
                    logger.info(f"✅ Файл прочитан в кодировке {encoding}")
                    break
                except UnicodeDecodeError:
                    continue
            
            if not content:
                logger.error("❌ Не удалось прочитать файл ни в одной кодировке")
                return []
            
            lines = content.strip().split('\n')
            logger.info(f"📄 Всего строк в файле: {len(lines)}")
            
            # Пропускаем заголовок
            for line_num, line in enumerate(lines[1:], 2):
                line = line.strip()
                if not line:
                    continue
                    
                try:
                    # Разделяем по табуляции
                    parts = line.split('\t')
                    if len(parts) < 10:
                        continue
                    
                    term_years = int(parts[0])
                    age = int(parts[1])
                    gender = parts[2].strip()
                    
                    # Парсим проценты (убираем знак % и конвертируем)
                    death_rate = float(parts[3].replace('%', '').replace(',', '.')) / 100
                    critical_rate = float(parts[4].replace('%', '').replace(',', '.')) / 100
                    accident_rate = float(parts[5].replace('%', '').replace(',', '.')) / 100
                    injury_rate = float(parts[6].replace('%', '').replace(',', '.')) / 100
                    additional_rate = float(parts[7].replace('%', '').replace(',', '.')) / 100
                    
                    # Парсим суммы (убираем пробелы и запятые)
                    base_sum_1 = float(parts[8].replace(' ', '').replace(',', '.'))
                    base_sum_2 = float(parts[9].replace(' ', '').replace(',', '.'))
                    
                    # Коэффициент i
                    coeff_i = 0.08
                    if len(parts) > 10 and parts[10].strip():
                        coeff_i = float(parts[10].replace(',', '.'))
                    
                    tariff = {
                        'term_years': term_years,
                        'age': age,
                        'gender': gender,
                        'death_rate': death_rate,
                        'critical_illness_rate': critical_rate,
                        'accident_rate': accident_rate,
                        'injury_rate': injury_rate,
                        'additional_rate': additional_rate,
                        'base_sum_1': base_sum_1,
                        'base_sum_2': base_sum_2,
                        'coefficient_i': coeff_i
                    }
                    
                    tariffs.append(tariff)
                    
                except (ValueError, IndexError) as e:
                    logger.warning(f"⚠️ Ошибка парсинга строки {line_num}: {e}")
                    continue
            
            logger.info(f"✅ Успешно распарсено {len(tariffs)} тарифов")
            return tariffs
            
        except Exception as e:
            logger.error(f"❌ Ошибка парсинга файла: {e}")
            return []

    def load_base_tariffs(self, file_path: str):
        """Загрузка базовых тарифов из файла"""
        tariffs = self.parse_tariff_file(file_path)
        if not tariffs:
            return False
            
        conn = self.connect()
        if not conn:
            return False
            
        try:
            cursor = conn.cursor()
            
            # Очищаем существующие данные
            cursor.execute("DELETE FROM justincase_base_tariffs;")
            logger.info("🗑️ Существующие тарифы удалены")
            
            # Загружаем новые данные
            insert_count = 0
            for tariff in tariffs:
                try:
                    cursor.execute("""
                        INSERT INTO justincase_base_tariffs 
                        (term_years, age, gender, death_rate, critical_illness_rate,
                         accident_rate, injury_rate, additional_rate, base_sum_1, 
                         base_sum_2, coefficient_i)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
                    """, (
                        tariff['term_years'], tariff['age'], tariff['gender'],
                        tariff['death_rate'], tariff['critical_illness_rate'],
                        tariff['accident_rate'], tariff['injury_rate'],
                        tariff['additional_rate'], tariff['base_sum_1'],
                        tariff['base_sum_2'], tariff['coefficient_i']
                    ))
                    insert_count += 1
                except Exception as e:
                    logger.warning(f"⚠️ Ошибка вставки тарифа: {e}")
                    continue
            
            conn.commit()
            logger.info(f"✅ Загружено {insert_count} базовых тарифов")
            return True
            
        except Exception as e:
            logger.error(f"❌ Ошибка загрузки тарифов: {e}")
            conn.rollback()
            return False
        finally:
            cursor.close()
            conn.close()

    def get_statistics(self):
        """Получение статистики загруженных данных"""
        conn = self.connect()
        if not conn:
            return {}
            
        try:
            cursor = conn.cursor()
            
            # Статистика по тарифам
            cursor.execute("SELECT COUNT(*) FROM justincase_base_tariffs;")
            total_tariffs = cursor.fetchone()[0]
            
            cursor.execute("""
                SELECT term_years, COUNT(*) 
                FROM justincase_base_tariffs 
                GROUP BY term_years 
                ORDER BY term_years;
            """)
            tariffs_by_term = cursor.fetchall()
            
            cursor.execute("""
                SELECT gender, COUNT(*) 
                FROM justincase_base_tariffs 
                GROUP BY gender;
            """)
            tariffs_by_gender = cursor.fetchall()
            
            cursor.execute("SELECT COUNT(*) FROM justincase_frequency_coefficients;")
            frequency_count = cursor.fetchone()[0]
            
            stats = {
                'total_tariffs': total_tariffs,
                'tariffs_by_term': dict(tariffs_by_term),
                'tariffs_by_gender': dict(tariffs_by_gender),
                'frequency_coefficients': frequency_count
            }
            
            return stats
            
        except Exception as e:
            logger.error(f"❌ Ошибка получения статистики: {e}")
            return {}
        finally:
            cursor.close()
            conn.close()

def main():
    """Основная функция инициализации"""
    logger.info("🚀 Инициализация базы данных калькулятора JustInCase")
    
    db = JustInCaseDatabase()
    
    # Создаем таблицы
    if not db.create_tables():
        logger.error("❌ Не удалось создать таблицы")
        return False
    
    # Загружаем коэффициенты частоты
    if not db.load_frequency_coefficients():
        logger.error("❌ Не удалось загрузить коэффициенты частоты")
        return False
    
    # Загружаем базовые тарифы
    tariff_file = "base_tariffs.txt"
    if not db.load_base_tariffs(tariff_file):
        logger.error("❌ Не удалось загрузить базовые тарифы")
        return False
    
    # Показываем статистику
    stats = db.get_statistics()
    if stats:
        logger.info("� Статистика загруженных данных:")
        logger.info(f"   - Всего тарифов: {stats['total_tariffs']}")
        logger.info(f"   - По срокам: {stats['tariffs_by_term']}")
        logger.info(f"   - По полу: {stats['tariffs_by_gender']}")
        logger.info(f"   - Коэффициентов частоты: {stats['frequency_coefficients']}")
    
    logger.info("✅ Инициализация базы данных завершена успешно!")
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
    
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS frequency_coefficients (
        id SERIAL PRIMARY KEY,
        payment_frequency VARCHAR(20) NOT NULL UNIQUE,
        coefficient DECIMAL(10, 6) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """
    
    cursor.execute(create_table_sql)
    
    # Вставляем базовые коэффициенты
    insert_coefficients_sql = """
    INSERT INTO frequency_coefficients (payment_frequency, coefficient, description) 
    VALUES 
        ('annual', 1.000000, 'Годовая оплата'),
        ('semiannual', 0.520000, 'Полугодовая оплата'),
        ('quarterly', 0.265000, 'Квартальная оплата'),
        ('monthly', 0.090000, 'Ежемесячная оплата')
    ON CONFLICT (payment_frequency) DO UPDATE SET
        coefficient = EXCLUDED.coefficient,
        description = EXCLUDED.description;
    """
    
    cursor.execute(insert_coefficients_sql)
    logger.info("✅ Таблица frequency_coefficients создана и заполнена")

def create_sample_tariffs(cursor):
    """Создает образцы тарифов для тестирования"""
    logger.info("🔧 Добавление образцов тарифов...")
    
    sample_tariffs = [
        # Мужчины 25 лет
        (1, 1, 25, 'M', 0.00150000, 0.00080000, 0.00120000, 0.00070000),
        (1, 5, 25, 'M', 0.00180000, 0.00095000, 0.00140000, 0.00085000),
        (1, 10, 25, 'M', 0.00220000, 0.00110000, 0.00160000, 0.00100000),
        
        # Женщины 25 лет
        (1, 1, 25, 'F', 0.00130000, 0.00070000, 0.00100000, 0.00060000),
        (1, 5, 25, 'F', 0.00160000, 0.00085000, 0.00120000, 0.00075000),
        (1, 10, 25, 'F', 0.00200000, 0.00100000, 0.00140000, 0.00090000),
        
        # Мужчины 35 лет
        (1, 1, 35, 'M', 0.00200000, 0.00090000, 0.00150000, 0.00080000),
        (1, 5, 35, 'M', 0.00240000, 0.00110000, 0.00180000, 0.00100000),
        (1, 10, 35, 'M', 0.00290000, 0.00130000, 0.00210000, 0.00120000),
        
        # Женщины 35 лет
        (1, 1, 35, 'F', 0.00180000, 0.00080000, 0.00130000, 0.00070000),
        (1, 5, 35, 'F', 0.00220000, 0.00100000, 0.00160000, 0.00090000),
        (1, 10, 35, 'F', 0.00270000, 0.00120000, 0.00190000, 0.00110000),
    ]
    
    insert_sql = """
    INSERT INTO base_tariffs 
    (payment_period, insurance_term, insured_age, gender, life_tariff, accident_tariff, critical_illness_tariff, disability_tariff)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    ON CONFLICT (payment_period, insurance_term, insured_age, gender) DO UPDATE SET
        life_tariff = EXCLUDED.life_tariff,
        accident_tariff = EXCLUDED.accident_tariff,
        critical_illness_tariff = EXCLUDED.critical_illness_tariff,
        disability_tariff = EXCLUDED.disability_tariff;
    """
    
    cursor.executemany(insert_sql, sample_tariffs)
    logger.info(f"✅ Добавлено {len(sample_tariffs)} образцов тарифов")

def check_tables(cursor):
    """Проверяет созданные таблицы"""
    logger.info("🔍 Проверка созданных таблиц...")
    
    # Проверяем base_tariffs
    cursor.execute("SELECT COUNT(*) FROM base_tariffs;")
    tariffs_count = cursor.fetchone()[0]
    logger.info(f"📊 Таблица base_tariffs: {tariffs_count} записей")
    
    # Проверяем frequency_coefficients  
    cursor.execute("SELECT COUNT(*) FROM frequency_coefficients;")
    coefficients_count = cursor.fetchone()[0]
    logger.info(f"📊 Таблица frequency_coefficients: {coefficients_count} записей")
    
    # Показываем коэффициенты
    cursor.execute("SELECT payment_frequency, coefficient FROM frequency_coefficients ORDER BY coefficient DESC;")
    coefficients = cursor.fetchall()
    
    logger.info("💰 Коэффициенты периодичности:")
    for freq, coeff in coefficients:
        logger.info(f"  - {freq}: {coeff}")

def main():
    """Основная функция инициализации"""
    logger.info("🚀 Инициализация базы данных для калькулятора 'На всякий случай'")
    
    try:
        # Подключение к базе данных
        logger.info("🔌 Подключение к базе данных...")
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # Создание таблиц
        create_base_tariffs_table(cursor)
        create_frequency_coefficients_table(cursor)
        
        # Добавление образцов данных
        create_sample_tariffs(cursor)
        
        # Сохранение изменений
        conn.commit()
        
        # Проверка результатов
        check_tables(cursor)
        
        logger.info("✅ Инициализация базы данных завершена успешно!")
        
    except Exception as e:
        logger.error(f"❌ Ошибка инициализации: {e}")
        if 'conn' in locals():
            conn.rollback()
        raise
        
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    main()
