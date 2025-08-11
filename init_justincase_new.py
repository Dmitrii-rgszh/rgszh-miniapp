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
                    disability_rate DECIMAL(10, 8) NOT NULL,
                    accident_death_rate DECIMAL(10, 8) NOT NULL,
                    traffic_death_rate DECIMAL(10, 8) NOT NULL,
                    injury_rate DECIMAL(10, 8) NOT NULL,
                    critical_illness_rf_fee DECIMAL(12, 2) NOT NULL,
                    critical_illness_abroad_fee DECIMAL(12, 2) NOT NULL,
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
                    critical_illness_type VARCHAR(20) DEFAULT 'rf', -- 'rf' или 'abroad'
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
                    # Разделяем по точке с запятой (CSV формат)
                    parts = line.split(';')
                    if len(parts) < 11:
                        continue
                    
                    term_years = int(parts[0])
                    age = int(parts[1])
                    gender = parts[2].strip()
                    
                    # Парсим проценты (убираем знак % и конвертируем)
                    death_rate = float(parts[3].replace('%', '').replace(',', '.')) / 100
                    disability_rate = float(parts[4].replace('%', '').replace(',', '.')) / 100
                    accident_death_rate = float(parts[5].replace('%', '').replace(',', '.')) / 100
                    traffic_death_rate = float(parts[6].replace('%', '').replace(',', '.')) / 100
                    injury_rate = float(parts[7].replace('%', '').replace(',', '.')) / 100
                    
                    # Парсим фиксированные суммы КЗ (убираем пробелы и запятые)
                    critical_rf_fee = float(parts[8].replace(' ', '').replace(',', '.'))
                    critical_abroad_fee = float(parts[9].replace(' ', '').replace(',', '.'))
                    
                    # Коэффициент i
                    coeff_i = 0.08
                    if len(parts) > 10 and parts[10].strip():
                        coeff_i = float(parts[10].replace(',', '.'))
                    
                    tariff = {
                        'term_years': term_years,
                        'age': age,
                        'gender': gender,
                        'death_rate': death_rate,
                        'disability_rate': disability_rate,
                        'accident_death_rate': accident_death_rate,
                        'traffic_death_rate': traffic_death_rate,
                        'injury_rate': injury_rate,
                        'critical_illness_rf_fee': critical_rf_fee,
                        'critical_illness_abroad_fee': critical_abroad_fee,
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
                        (term_years, age, gender, death_rate, disability_rate,
                         accident_death_rate, traffic_death_rate, injury_rate, 
                         critical_illness_rf_fee, critical_illness_abroad_fee, coefficient_i)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
                    """, (
                        tariff['term_years'], tariff['age'], tariff['gender'],
                        tariff['death_rate'], tariff['disability_rate'],
                        tariff['accident_death_rate'], tariff['traffic_death_rate'],
                        tariff['injury_rate'], tariff['critical_illness_rf_fee'],
                        tariff['critical_illness_abroad_fee'], tariff['coefficient_i']
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
    tariff_file = "base_tariffs_new.csv"
    if not db.load_base_tariffs(tariff_file):
        logger.error("❌ Не удалось загрузить базовые тарифы")
        return False
    
    # Показываем статистику
    stats = db.get_statistics()
    if stats:
        logger.info("📊 Статистика загруженных данных:")
        logger.info(f"   - Всего тарифов: {stats['total_tariffs']}")
        logger.info(f"   - По срокам: {stats['tariffs_by_term']}")
        logger.info(f"   - По полу: {stats['tariffs_by_gender']}")
        logger.info(f"   - Коэффициентов частоты: {stats['frequency_coefficients']}")
    
    logger.info("✅ Инициализация базы данных завершена успешно!")
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
