#!/usr/bin/env python3
# fix_care_future.py - Упрощенное исправление схемы и данных

import os
import sys
import logging
from flask import Flask
from db_saver import init_db, db
from sqlalchemy import text

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_app():
    """Создает Flask приложение для работы с БД"""
    app = Flask(__name__)
    
    db_uri = (
        os.getenv("SQLALCHEMY_DATABASE_URI") 
        or os.getenv("DATABASE_URL") 
        or "postgresql://postgres:secret@176.109.110.217:1112/postgres"
    )
    
    app.config["SQLALCHEMY_DATABASE_URI"] = db_uri
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    
    init_db(app)
    return app

def fix_database():
    """Исправляет схему и загружает данные"""
    app = create_app()
    
    with app.app_context():
        try:
            logger.info("🔧 Исправление базы данных...")
            
            # 1. Удаляем существующие таблицы
            logger.info("🗑️ Удаление существующих таблиц...")
            db.session.execute(text("DROP TABLE IF EXISTS nsj_calculations CASCADE"))
            db.session.execute(text("DROP TABLE IF EXISTS nsj_redemption_rates CASCADE"))
            db.session.execute(text("DROP TABLE IF EXISTS nsj_risk_rates CASCADE"))
            db.session.execute(text("DROP TABLE IF EXISTS nsj_calculator_settings CASCADE"))
            db.session.commit()
            
            # 2. Создаем таблицы заново с правильными ограничениями
            logger.info("📋 Создание исправленных таблиц...")
            
            # Таблица тарифных коэффициентов
            db.session.execute(text("""
                CREATE TABLE nsj_risk_rates (
                    id SERIAL PRIMARY KEY,
                    age_from INTEGER NOT NULL,
                    age_to INTEGER NOT NULL,
                    survival_rate DECIMAL(10,6) NOT NULL DEFAULT 0,
                    death_immediate_rate DECIMAL(10,6) NOT NULL DEFAULT 0,
                    death_deferred_rate DECIMAL(10,6) NOT NULL DEFAULT 0,
                    investment_rate DECIMAL(10,6) NOT NULL DEFAULT 0,
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT unique_age_range UNIQUE (age_from, age_to),
                    CHECK (age_from <= age_to),
                    CHECK (age_from >= 0 AND age_to <= 100)
                )
            """))
            
            # Таблица коэффициентов выкупа
            db.session.execute(text("""
                CREATE TABLE nsj_redemption_rates (
                    id SERIAL PRIMARY KEY,
                    contract_year INTEGER NOT NULL,
                    contract_term INTEGER NOT NULL,
                    redemption_coefficient DECIMAL(6,3) NOT NULL DEFAULT 0,
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT unique_year_term UNIQUE (contract_year, contract_term),
                    CHECK (contract_year >= 1 AND contract_year <= 20),
                    CHECK (contract_term >= 5 AND contract_term <= 20),
                    CHECK (contract_year <= contract_term),
                    CHECK (redemption_coefficient >= 0 AND redemption_coefficient <= 1)
                )
            """))
            
            # Таблица настроек
            db.session.execute(text("""
                CREATE TABLE nsj_calculator_settings (
                    id SERIAL PRIMARY KEY,
                    setting_key VARCHAR(100) NOT NULL UNIQUE,
                    setting_value TEXT NOT NULL,
                    description TEXT,
                    value_type VARCHAR(20) DEFAULT 'string',
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """))
            
            # Таблица расчетов
            db.session.execute(text("""
                CREATE TABLE nsj_calculations (
                    id SERIAL PRIMARY KEY,
                    calculation_uuid VARCHAR(36) NOT NULL UNIQUE,
                    email VARCHAR(255),
                    birth_date DATE NOT NULL,
                    gender VARCHAR(10) NOT NULL,
                    calculation_date DATE NOT NULL DEFAULT CURRENT_DATE,
                    contract_term INTEGER NOT NULL,
                    calculation_type VARCHAR(20) NOT NULL,
                    input_amount BIGINT NOT NULL,
                    premium_amount BIGINT NOT NULL,
                    insurance_sum BIGINT NOT NULL,
                    accumulated_capital BIGINT NOT NULL,
                    program_income BIGINT NOT NULL,
                    tax_deduction BIGINT DEFAULT 0,
                    age_at_start INTEGER NOT NULL,
                    age_at_end INTEGER NOT NULL,
                    payment_frequency VARCHAR(20) DEFAULT 'annual',
                    redemption_values JSONB,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    user_agent TEXT,
                    ip_address INET,
                    CHECK (contract_term >= 5 AND contract_term <= 20),
                    CHECK (calculation_type IN ('from_premium', 'from_sum')),
                    CHECK (gender IN ('male', 'female')),
                    CHECK (age_at_start >= 0 AND age_at_start <= 100),
                    CHECK (input_amount > 0)
                )
            """))
            
            db.session.commit()
            logger.info("✅ Таблицы созданы успешно")
            
            # 3. Загружаем тарифные коэффициенты
            logger.info("📊 Загрузка тарифных коэффициентов...")
            risk_data = [
                (5, 5, 0.981000, 0.011100, 0.001600, 0.006300),
                (6, 6, 0.976400, 0.013900, 0.002100, 0.007600),
                (7, 7, 0.971500, 0.016900, 0.002600, 0.009000),
                (8, 8, 0.966100, 0.020200, 0.003200, 0.010500),
                (9, 9, 0.960000, 0.023900, 0.003900, 0.012200),
                (10, 10, 0.953500, 0.027900, 0.004600, 0.014000),
                (11, 11, 0.945700, 0.032300, 0.005500, 0.016500),
                (12, 12, 0.937200, 0.037000, 0.006600, 0.019200),
                (13, 13, 0.928000, 0.042100, 0.007700, 0.022200),
                (14, 14, 0.918000, 0.047500, 0.009000, 0.025500),
                (15, 15, 0.907100, 0.053300, 0.010500, 0.029100),
                (16, 16, 0.895600, 0.059500, 0.012100, 0.032800),
                (17, 17, 0.883100, 0.066200, 0.013800, 0.036900),
                (18, 18, 0.869500, 0.073400, 0.015700, 0.041400),
                (19, 19, 0.854700, 0.081100, 0.017800, 0.046400),
                (20, 20, 0.839100, 0.089500, 0.019900, 0.051500),
                (21, 25, 0.825000, 0.095000, 0.022000, 0.055000),
                (26, 30, 0.810000, 0.100000, 0.025000, 0.060000),
                (31, 35, 0.795000, 0.110000, 0.030000, 0.065000),
                (36, 40, 0.780000, 0.120000, 0.035000, 0.070000),
                (41, 45, 0.765000, 0.130000, 0.040000, 0.075000),
                (46, 50, 0.750000, 0.140000, 0.045000, 0.080000),
                (51, 55, 0.735000, 0.150000, 0.050000, 0.085000),
                (56, 60, 0.720000, 0.160000, 0.055000, 0.090000),
                (61, 63, 0.705000, 0.170000, 0.060000, 0.095000)
            ]
            
            for age_from, age_to, survival, death_imm, death_def, investment in risk_data:
                db.session.execute(text("""
                    INSERT INTO nsj_risk_rates (age_from, age_to, survival_rate, death_immediate_rate, death_deferred_rate, investment_rate)
                    VALUES (:age_from, :age_to, :survival, :death_imm, :death_def, :investment)
                """), {
                    'age_from': age_from, 'age_to': age_to, 'survival': survival,
                    'death_imm': death_imm, 'death_def': death_def, 'investment': investment
                })
            
            db.session.commit()
            logger.info(f"✅ Загружено {len(risk_data)} тарифных коэффициентов")
            
            # 4. Загружаем коэффициенты выкупа (упрощенная версия)
            logger.info("📊 Загрузка коэффициентов выкупа...")
            
            # Генерируем коэффициенты выкупа
            redemption_count = 0
            for term in range(5, 21):  # от 5 до 20 лет
                for year in range(1, term + 1):
                    if year <= 2:
                        coeff = 0.0
                    elif year == term:
                        coeff = 1.0 if term >= 12 else 0.9
                    else:
                        # Прогрессивный рост
                        progress = (year - 2) / (term - 2)
                        coeff = round(progress * 0.9, 1)
                    
                    db.session.execute(text("""
                        INSERT INTO nsj_redemption_rates (contract_year, contract_term, redemption_coefficient)
                        VALUES (:year, :term, :coeff)
                    """), {'year': year, 'term': term, 'coeff': coeff})
                    redemption_count += 1
            
            db.session.commit()
            logger.info(f"✅ Загружено {redemption_count} коэффициентов выкупа")
            
            # 5. Загружаем настройки
            logger.info("⚙️ Загрузка настроек...")
            settings = [
                ('min_premium_amount', '100000', 'Минимальный страховой взнос в рублях', 'integer'),
                ('max_premium_amount', '50000000', 'Максимальный страховой взнос в рублях', 'integer'),
                ('min_insurance_sum', '500000', 'Минимальная страховая сумма в рублях', 'integer'),
                ('max_insurance_sum', '100000000', 'Максимальная страховая сумма в рублях', 'integer'),
                ('min_age', '18', 'Минимальный возраст страхователя', 'integer'),
                ('max_age', '63', 'Максимальный возраст страхователя', 'integer'),
                ('min_contract_term', '5', 'Минимальный срок договора в годах', 'integer'),
                ('max_contract_term', '20', 'Максимальный срок договора в годах', 'integer'),
                ('tax_deduction_rate_standard', '0.13', 'Ставка налогового вычета до 5 млн', 'decimal'),
                ('tax_deduction_limit', '120000', 'Лимит налогового вычета в год', 'integer'),
                ('cashback_rate', '0.06', 'Ставка кэшбэка (6%)', 'decimal'),
                ('program_name', 'Забота о будущем Ультра', 'Название программы НСЖ', 'string'),
                ('currency', 'RUB', 'Валюта расчетов', 'string'),
                ('program_version', 'v.25.2.1', 'Версия калькулятора', 'string')
            ]
            
            for key, value, desc, value_type in settings:
                db.session.execute(text("""
                    INSERT INTO nsj_calculator_settings (setting_key, setting_value, description, value_type)
                    VALUES (:key, :value, :desc, :type)
                """), {'key': key, 'value': value, 'desc': desc, 'type': value_type})
            
            db.session.commit()
            logger.info(f"✅ Загружено {len(settings)} настроек")
            
            # 6. Создаем индексы
            logger.info("🔗 Создание индексов...")
            db.session.execute(text("CREATE INDEX IF NOT EXISTS idx_nsj_risk_rates_age ON nsj_risk_rates (age_from, age_to)"))
            db.session.execute(text("CREATE INDEX IF NOT EXISTS idx_nsj_redemption_year_term ON nsj_redemption_rates (contract_year, contract_term)"))
            db.session.execute(text("CREATE INDEX IF NOT EXISTS idx_nsj_settings_key ON nsj_calculator_settings (setting_key, is_active)"))
            db.session.execute(text("CREATE INDEX IF NOT EXISTS idx_nsj_calculations_uuid ON nsj_calculations (calculation_uuid)"))
            db.session.commit()
            
            logger.info("🎉 База данных исправлена и инициализирована успешно!")
            return True
            
        except Exception as e:
            logger.error(f"❌ Ошибка исправления БД: {e}")
            db.session.rollback()
            return False

if __name__ == "__main__":
    success = fix_database()
    if success:
        print("✅ Исправление завершено успешно!")
        print("Теперь запустите: python init_care_future.py")
    else:
        print("❌ Ошибка исправления")
        sys.exit(1)