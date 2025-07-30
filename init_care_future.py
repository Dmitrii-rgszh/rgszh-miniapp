#!/usr/bin/env python3
# init_care_future.py - Скрипт инициализации калькулятора НСЖ "Забота о будущем Ультра"

import os
import sys
import logging
from pathlib import Path

# Добавляем текущую директорию в sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask
from db_saver import init_db, db
from sqlalchemy import text

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def create_app():
    """Создает Flask приложение для работы с БД"""
    app = Flask(__name__)
    
    # Конфигурация БД из переменных окружения
    db_uri = (
        os.getenv("SQLALCHEMY_DATABASE_URI") 
        or os.getenv("DATABASE_URL") 
        or f"postgresql://postgres:secret@{os.getenv('DB_HOST', 'localhost')}:1112/postgres"
    )
    
    logger.info(f"Подключение к БД: {db_uri.split('@')[1] if '@' in db_uri else 'локальная БД'}")
    app.config["SQLALCHEMY_DATABASE_URI"] = db_uri
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    
    init_db(app)
    return app

def execute_sql_file(filepath: str):
    """Выполняет SQL скрипт из файла"""
    try:
        if not os.path.exists(filepath):
            logger.error(f"Файл не найден: {filepath}")
            return False
            
        with open(filepath, 'r', encoding='utf-8') as file:
            sql_content = file.read()
        
        # Разделяем на отдельные команды
        commands = [cmd.strip() for cmd in sql_content.split(';') if cmd.strip()]
        
        executed = 0
        for command in commands:
            if command:
                try:
                    db.session.execute(text(command))
                    db.session.commit()
                    executed += 1
                except Exception as e:
                    logger.warning(f"Предупреждение при выполнении команды: {e}")
                    db.session.rollback()
        
        logger.info(f"✅ Выполнено команд из {filepath}: {executed}")
        return True
        
    except Exception as e:
        logger.error(f"❌ Ошибка выполнения {filepath}: {e}")
        db.session.rollback()
        return False

def check_existing_tables():
    """Проверяет существующие таблицы"""
    try:
        # Проверяем основные таблицы калькулятора
        tables_to_check = [
            'nsj_risk_rates',
            'nsj_redemption_rates', 
            'nsj_calculator_settings',
            'nsj_calculations'
        ]
        
        existing_tables = []
        for table in tables_to_check:
            result = db.session.execute(text(f"""
                SELECT COUNT(*) FROM information_schema.tables 
                WHERE table_name = '{table}'
            """)).fetchone()
            
            if result[0] > 0:
                existing_tables.append(table)
        
        return existing_tables
        
    except Exception as e:
        logger.error(f"Ошибка проверки таблиц: {e}")
        return []

def init_care_future_database():
    """Основная функция инициализации"""
    app = create_app()
    
    with app.app_context():
        try:
            logger.info("🚀 Инициализация калькулятора НСЖ 'Забота о будущем Ультра'...")
            
            # 1. Проверяем существующие таблицы
            existing_tables = check_existing_tables()
            if existing_tables:
                logger.info(f"📋 Найдены существующие таблицы: {existing_tables}")
                
                # Спрашиваем пользователя о пересоздании
                if len(sys.argv) > 1 and sys.argv[1] == '--force':
                    logger.info("🔧 Принудительное пересоздание таблиц...")
                else:
                    logger.info("💡 Для пересоздания таблиц используйте флаг --force")
                    logger.info("📊 Проверяем данные в существующих таблицах...")
                    
                    # Проверяем данные
                    data_check = check_data_completeness()
                    if data_check['complete']:
                        logger.info("✅ Данные в таблицах уже загружены")
                        print_summary()
                        return True
                    else:
                        logger.info("⚠️ Данные неполные, загружаем недостающие...")
            
            # 2. Создаем схему таблиц
            logger.info("📋 Создание схемы таблиц...")
            if not execute_sql_file('care_future_schema.sql'):
                logger.error("Ошибка создания схемы")
                return False
            
            # 3. Загружаем данные
            logger.info("📊 Загрузка данных из Excel...")
            if not execute_sql_file('care_future_data.sql'):
                logger.error("Ошибка загрузки данных")
                return False
            
            # 4. Проверяем результат
            logger.info("🔍 Проверка результата...")
            validation = validate_installation()
            
            if validation['success']:
                logger.info("🎉 Калькулятор НСЖ успешно инициализирован!")
                print_summary()
                return True
            else:
                logger.error(f"❌ Ошибки валидации: {validation['errors']}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Критическая ошибка инициализации: {e}")
            return False

def check_data_completeness():
    """Проверяет полноту данных в таблицах"""
    try:
        # Проверяем тарифные коэффициенты
        risk_count = db.session.execute(text(
            "SELECT COUNT(*) FROM nsj_risk_rates WHERE is_active = true"
        )).fetchone()[0]
        
        # Проверяем коэффициенты выкупа
        redemption_count = db.session.execute(text(
            "SELECT COUNT(*) FROM nsj_redemption_rates WHERE is_active = true"
        )).fetchone()[0]
        
        # Проверяем настройки
        settings_count = db.session.execute(text(
            "SELECT COUNT(*) FROM nsj_calculator_settings WHERE is_active = true"
        )).fetchone()[0]
        
        # Проверяем доступные сроки
        terms_result = db.session.execute(text(
            "SELECT DISTINCT contract_term FROM nsj_redemption_rates WHERE is_active = true ORDER BY contract_term"
        )).fetchall()
        terms = [row[0] for row in terms_result]
        
        complete = (
            risk_count >= 10 and  # минимум 10 возрастных групп
            redemption_count >= 50 and  # минимум данные для нескольких сроков
            settings_count >= 10 and  # основные настройки
            len(terms) >= 5  # минимум 5 разных сроков
        )
        
        return {
            'complete': complete,
            'risk_count': risk_count,
            'redemption_count': redemption_count,
            'settings_count': settings_count,
            'available_terms': terms
        }
        
    except Exception as e:
        logger.error(f"Ошибка проверки данных: {e}")
        return {'complete': False, 'error': str(e)}

def validate_installation():
    """Валидация установки"""
    try:
        # Импортируем модели для проверки
        from care_future_models import NSJDataManager, NSJCalculator, CalculationInput
        from datetime import date
        
        # Проверяем состояние БД
        validation = NSJDataManager.validate_database()
        
        if validation['status'] != 'ok':
            return {'success': False, 'errors': validation['errors']}
        
        # Тестируем простой расчет
        try:
            calculator = NSJCalculator()
            test_input = CalculationInput(
                birth_date=date(1990, 1, 1),
                gender='male',
                contract_term=5,
                calculation_type='from_premium',
                input_amount=960000
            )
            
            result = calculator.calculate(test_input)
            logger.info(f"✅ Тестовый расчет выполнен: {result.calculation_uuid}")
            
        except Exception as e:
            return {'success': False, 'errors': [f'Ошибка тестового расчета: {e}']}
        
        return {'success': True, 'stats': validation['stats']}
        
    except Exception as e:
        return {'success': False, 'errors': [f'Ошибка валидации: {e}']}

def print_summary():
    """Выводит сводку о состоянии системы"""
    try:
        from care_future_models import NSJDataManager
        
        # Получаем информацию о системе
        info = NSJDataManager.get_calculator_info()
        validation = NSJDataManager.validate_database()
        
        print("\n" + "="*60)
        print("📊 СВОДКА КАЛЬКУЛЯТОРА НСЖ 'ЗАБОТА О БУДУЩЕМ'")
        print("="*60)
        print(f"Программа: {info['program_name']}")
        print(f"Версия: {info['program_version']}")
        print(f"Валюта: {info['currency']}")
        print(f"Статус БД: {validation['status']}")
        
        if 'stats' in validation:
            stats = validation['stats']
            print(f"\n📋 СТАТИСТИКА ДАННЫХ:")
            print(f"  • Тарифных коэффициентов: {stats.get('risk_rates_count', 'N/A')}")
            print(f"  • Коэффициентов выкупа: {stats.get('redemption_rates_count', 'N/A')}")
            print(f"  • Настроек: {stats.get('settings_count', 'N/A')}")
            print(f"  • Доступные сроки: {info['available_terms']}")
            print(f"  • Сохраненных расчетов: {stats.get('calculations_count', 0)}")
        
        print(f"\n⚙️ ОГРАНИЧЕНИЯ:")
        limits = info['age_limits']
        amounts = info['amount_limits']
        print(f"  • Возраст: {limits['min_age']}-{limits['max_age']} лет")
        print(f"  • Взнос: {amounts['min_premium']:,}-{amounts['max_premium']:,} руб.")
        print(f"  • Страховая сумма: {amounts['min_insurance_sum']:,}-{amounts['max_insurance_sum']:,} руб.")
        
        print(f"\n🔗 API ENDPOINTS:")
        print(f"  • POST /api/care-future/calculate - основной расчет")
        print(f"  • GET  /api/care-future/config - конфигурация")
        print(f"  • POST /api/care-future/validate-age - валидация возраста")
        print(f"  • POST /api/care-future/validate-amount - валидация суммы")
        print(f"  • GET  /api/care-future/admin/status - статус системы")
        
        if validation.get('warnings'):
            print(f"\n⚠️ ПРЕДУПРЕЖДЕНИЯ:")
            for warning in validation['warnings']:
                print(f"  • {warning}")
        
        print("="*60)
        print("✅ Система готова к работе!")
        print("="*60 + "\n")
        
    except Exception as e:
        logger.error(f"Ошибка вывода сводки: {e}")

def main():
    """Главная функция"""
    print("🚀 Инициализация калькулятора НСЖ 'Забота о будущем Ультра'")
    print("Версия на основе Excel файла: v.25.2.1")
    print("-" * 60)
    
    # Проверяем наличие необходимых файлов
    required_files = ['care_future_schema.sql', 'care_future_data.sql']
    missing_files = [f for f in required_files if not os.path.exists(f)]
    
    if missing_files:
        logger.error(f"❌ Отсутствуют необходимые файлы: {missing_files}")
        logger.info("💡 Убедитесь, что файлы care_future_schema.sql и care_future_data.sql находятся в текущей директории")
        return False
    
    # Запускаем инициализацию
    success = init_care_future_database()
    
    if success:
        logger.info("🎉 Инициализация завершена успешно!")
        return True
    else:
        logger.error("❌ Инициализация завершилась с ошибками")
        return False

if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        logger.info("❌ Операция прервана пользователем")
        sys.exit(1)
    except Exception as e:
        logger.error(f"❌ Неожиданная ошибка: {e}")
        sys.exit(1)