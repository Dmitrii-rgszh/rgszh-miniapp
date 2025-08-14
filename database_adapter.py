# database_adapter.py - Адаптер для работы с разными типами БД

import os
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

logger = logging.getLogger("database_adapter")

class DatabaseAdapter:
    """Адаптер для автоматического выбора типа базы данных"""
    
    def __init__(self):
        self.engine = None
        self.Session = None
        self.db_type = None
        self.db_url = None
        
    def initialize(self):
        """Инициализация подключения к базе данных"""
        
        # Определяем тип окружения и выбираем БД
        database_url = os.getenv("DATABASE_URL")
        
        if database_url and "postgresql" in database_url:
            # Продакшн - используем PostgreSQL
            self.db_type = "postgresql"
            self.db_url = database_url
            logger.info("🐘 Используется PostgreSQL база данных")
            
        else:
            # Разработка - используем SQLite
            self.db_type = "sqlite"
            sqlite_path = os.path.join(os.path.dirname(__file__), "miniapp.db")
            self.db_url = f"sqlite:///{sqlite_path}"
            logger.info(f"🗃️ Используется SQLite база данных: {sqlite_path}")
            
            # Проверяем, существует ли SQLite база с тарифами
            if not os.path.exists(sqlite_path):
                logger.warning("⚠️ SQLite база не найдена, будет создана пустая база")
                logger.info("💡 Запустите: python init_local_tariffs_sqlite.py для создания тарифов")
        
        try:
            # Создаем подключение
            if self.db_type == "postgresql":
                self.engine = create_engine(
                    self.db_url,
                    pool_pre_ping=True,
                    pool_recycle=300,
                    echo=False
                )
            else:
                self.engine = create_engine(
                    self.db_url,
                    echo=False,
                    connect_args={"check_same_thread": False}
                )
            
            # Создаем сессию
            self.Session = sessionmaker(bind=self.engine)
            
            # Тестируем подключение
            with self.engine.connect() as conn:
                if self.db_type == "postgresql":
                    result = conn.execute(text("SELECT version()"))
                    version = result.fetchone()[0]
                    logger.info(f"✅ PostgreSQL подключена: {version[:50]}...")
                else:
                    result = conn.execute(text("SELECT sqlite_version()"))
                    version = result.fetchone()[0]
                    logger.info(f"✅ SQLite подключена: версия {version}")
                    
                    # Проверяем наличие тарифных таблиц
                    result = conn.execute(text(
                        "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'nsj_%'"
                    ))
                    tables = [row[0] for row in result.fetchall()]
                    
                    if tables:
                        logger.info(f"📊 Найдены тарифные таблицы: {', '.join(tables)}")
                        
                        # Проверяем количество тарифов
                        if 'nsj_tariffs' in tables:
                            result = conn.execute(text("SELECT COUNT(*) FROM nsj_tariffs"))
                            count = result.fetchone()[0]
                            logger.info(f"📋 Базовых тарифов в SQLite: {count}")
                    else:
                        logger.warning("⚠️ Тарифные таблицы не найдены в SQLite")
                        logger.info("💡 Запустите: python init_local_tariffs_sqlite.py")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Ошибка подключения к {self.db_type}: {e}")
            return False
    
    def get_session(self):
        """Получение сессии БД"""
        if self.Session:
            return self.Session()
        else:
            raise Exception("База данных не инициализирована")
    
    def execute_query(self, query, params=None):
        """Выполнение SQL запроса"""
        try:
            with self.engine.connect() as conn:
                if params:
                    result = conn.execute(text(query), params)
                else:
                    result = conn.execute(text(query))
                return result.fetchall()
        except Exception as e:
            logger.error(f"❌ Ошибка выполнения запроса: {e}")
            raise
    
    def get_tariff(self, age, gender, term_years):
        """Получение базового тарифа"""
        query = """
            SELECT death_rate, disability_rate 
            FROM nsj_tariffs 
            WHERE age = :age AND gender = :gender AND term_years = :term_years AND is_active = 1
        """
        
        try:
            result = self.execute_query(query, {
                'age': age,
                'gender': gender,
                'term_years': term_years
            })
            
            if result:
                return {
                    'death_rate': float(result[0][0]),
                    'disability_rate': float(result[0][1])
                }
            else:
                logger.warning(f"⚠️ Базовый тариф не найден: возраст={age}, пол={gender}, срок={term_years}")
                return None
                
        except Exception as e:
            logger.error(f"❌ Ошибка получения базового тарифа: {e}")
            return None
    
    def get_accident_tariff(self, age, gender, term_years):
        """Получение тарифа НС"""
        query = """
            SELECT death_rate, traffic_death_rate, injury_rate 
            FROM nsj_accident_tariffs 
            WHERE age = :age AND gender = :gender AND term_years = :term_years AND is_active = 1
        """
        
        try:
            result = self.execute_query(query, {
                'age': age,
                'gender': gender,
                'term_years': term_years
            })
            
            if result:
                return {
                    'death_rate': float(result[0][0]),
                    'traffic_death_rate': float(result[0][1]),
                    'injury_rate': float(result[0][2])
                }
            else:
                logger.warning(f"⚠️ Тариф НС не найден: возраст={age}, пол={gender}, срок={term_years}")
                return None
                
        except Exception as e:
            logger.error(f"❌ Ошибка получения тарифа НС: {e}")
            return None
    
    def get_critical_tariff(self, age, gender, term_years, region='russia'):
        """Получение тарифа КЗ"""
        rate_column = 'russia_rate' if region == 'russia' else 'abroad_rate'
        
        query = f"""
            SELECT {rate_column}
            FROM nsj_critical_tariffs 
            WHERE age = :age AND gender = :gender AND term_years = :term_years AND is_active = 1
        """
        
        try:
            result = self.execute_query(query, {
                'age': age,
                'gender': gender,
                'term_years': term_years
            })
            
            if result:
                return {
                    'rate': float(result[0][0]),
                    'region': region
                }
            else:
                logger.warning(f"⚠️ Тариф КЗ не найден: возраст={age}, пол={gender}, срок={term_years}, регион={region}")
                return None
                
        except Exception as e:
            logger.error(f"❌ Ошибка получения тарифа КЗ: {e}")
            return None
    
    def check_tables_exist(self):
        """Проверка наличия тарифных таблиц"""
        required_tables = ['nsj_tariffs', 'nsj_accident_tariffs', 'nsj_critical_tariffs', 'nsj_risk_rates']
        
        try:
            if self.db_type == "postgresql":
                query = """
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_schema = 'public' AND table_name LIKE 'nsj_%'
                """
            else:
                query = """
                    SELECT name 
                    FROM sqlite_master 
                    WHERE type='table' AND name LIKE 'nsj_%'
                """
            
            result = self.execute_query(query)
            existing_tables = [row[0] for row in result]
            
            missing_tables = set(required_tables) - set(existing_tables)
            
            if missing_tables:
                logger.warning(f"⚠️ Отсутствуют таблицы: {', '.join(missing_tables)}")
                return False
            else:
                logger.info(f"✅ Все тарифные таблицы найдены: {', '.join(existing_tables)}")
                return True
                
        except Exception as e:
            logger.error(f"❌ Ошибка проверки таблиц: {e}")
            return False

# Глобальный экземпляр адаптера
db_adapter = DatabaseAdapter()

def get_database_adapter():
    """Получение инициализированного адаптера БД"""
    if not db_adapter.engine:
        success = db_adapter.initialize()
        if not success:
            raise Exception("Не удалось инициализировать базу данных")
    return db_adapter
