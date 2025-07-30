#!/usr/bin/env python3
# add_yearly_income_column.py - Добавление колонки yearly_income в таблицу nsj_calculations

import os
import sys
import logging
from flask import Flask
from sqlalchemy import text

# Добавляем текущую директорию в sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from db_saver import init_db, db

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def add_yearly_income_column():
    """Добавляет колонку yearly_income в таблицу nsj_calculations"""
    app = Flask(__name__)
    init_db(app)
    
    with app.app_context():
        try:
            # Проверяем, существует ли уже колонка
            check_query = text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'nsj_calculations' 
                AND column_name = 'yearly_income'
            """)
            
            result = db.session.execute(check_query)
            if result.fetchone():
                logger.info("✅ Колонка yearly_income уже существует")
                return True
            
            # Добавляем колонку
            logger.info("📊 Добавляем колонку yearly_income...")
            alter_query = text("""
                ALTER TABLE nsj_calculations 
                ADD COLUMN yearly_income VARCHAR(20)
            """)
            
            db.session.execute(alter_query)
            db.session.commit()
            
            logger.info("✅ Колонка yearly_income успешно добавлена")
            
            # Создаем индекс для новой колонки
            index_query = text("""
                CREATE INDEX ix_nsj_calculations_yearly_income 
                ON nsj_calculations(yearly_income)
            """)
            
            try:
                db.session.execute(index_query)
                db.session.commit()
                logger.info("✅ Индекс для yearly_income создан")
            except Exception as e:
                logger.warning(f"⚠️ Не удалось создать индекс (возможно уже существует): {e}")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Ошибка при добавлении колонки: {e}")
            db.session.rollback()
            return False

if __name__ == "__main__":
    logger.info("🔄 Запуск миграции для добавления yearly_income...")
    
    if add_yearly_income_column():
        logger.info("🎉 Миграция выполнена успешно!")
    else:
        logger.error("❌ Миграция завершилась с ошибкой")
        sys.exit(1)