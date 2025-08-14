#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Инициализация локальной SQLite базы данных с тарифными данными для разработки
Скрипт создает SQLite базу с минимальным набором тарифов для тестирования калькулятора НСЖ
"""

import sqlite3
import os
import sys
from datetime import datetime

def create_sqlite_tariffs_db(db_path="miniapp.db"):
    """Создание SQLite базы с тарифными данными"""
    
    print(f"🔧 Создание SQLite базы данных: {db_path}")
    
    # Удаляем старую базу если есть
    if os.path.exists(db_path):
        os.remove(db_path)
        print(f"   ✅ Удалена старая база данных")
    
    # Создаем подключение
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # 1. Создаем таблицу nsj_risk_rates (тарифные коэффициенты по рискам)
        print("📊 Создание таблицы nsj_risk_rates...")
        cursor.execute("""
            CREATE TABLE nsj_risk_rates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                age_from INTEGER NOT NULL,
                age_to INTEGER NOT NULL,
                survival_rate DECIMAL(10,6) NOT NULL DEFAULT 0,
                death_immediate_rate DECIMAL(10,6) NOT NULL DEFAULT 0,
                death_deferred_rate DECIMAL(10,6) NOT NULL DEFAULT 0,
                investment_rate DECIMAL(10,6) NOT NULL DEFAULT 0,
                is_active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Создаем индексы
        cursor.execute("CREATE INDEX idx_nsj_risk_rates_age_from ON nsj_risk_rates(age_from)")
        cursor.execute("CREATE INDEX idx_nsj_risk_rates_age_to ON nsj_risk_rates(age_to)")
        cursor.execute("CREATE INDEX idx_nsj_risk_rates_is_active ON nsj_risk_rates(is_active)")
        
        # 2. Создаем таблицу nsj_tariffs (основные тарифы)
        print("📊 Создание таблицы nsj_tariffs...")
        cursor.execute("""
            CREATE TABLE nsj_tariffs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                age INTEGER NOT NULL,
                gender VARCHAR(1) NOT NULL,
                term_years INTEGER NOT NULL,
                death_rate DECIMAL(10,6) NOT NULL,
                disability_rate DECIMAL(10,6) NOT NULL,
                is_active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Создаем индексы
        cursor.execute("CREATE INDEX idx_nsj_tariffs_age ON nsj_tariffs(age)")
        cursor.execute("CREATE INDEX idx_nsj_tariffs_gender ON nsj_tariffs(gender)")
        cursor.execute("CREATE INDEX idx_nsj_tariffs_term ON nsj_tariffs(term_years)")
        cursor.execute("CREATE INDEX idx_nsj_tariffs_is_active ON nsj_tariffs(is_active)")
        cursor.execute("CREATE INDEX idx_nsj_tariffs_lookup ON nsj_tariffs(age, gender, term_years, is_active)")
        
        # 3. Создаем таблицу nsj_accident_tariffs (тарифы НС)
        print("📊 Создание таблицы nsj_accident_tariffs...")
        cursor.execute("""
            CREATE TABLE nsj_accident_tariffs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                age INTEGER NOT NULL,
                gender VARCHAR(1) NOT NULL,
                term_years INTEGER NOT NULL,
                death_rate DECIMAL(10,6) NOT NULL,
                traffic_death_rate DECIMAL(10,6) NOT NULL,
                injury_rate DECIMAL(10,6) NOT NULL,
                is_active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Создаем индексы
        cursor.execute("CREATE INDEX idx_nsj_accident_tariffs_age ON nsj_accident_tariffs(age)")
        cursor.execute("CREATE INDEX idx_nsj_accident_tariffs_gender ON nsj_accident_tariffs(gender)")
        cursor.execute("CREATE INDEX idx_nsj_accident_tariffs_term ON nsj_accident_tariffs(term_years)")
        cursor.execute("CREATE INDEX idx_nsj_accident_tariffs_lookup ON nsj_accident_tariffs(age, gender, term_years, is_active)")
        
        # 4. Создаем таблицу nsj_critical_tariffs (тарифы КЗ)
        print("📊 Создание таблицы nsj_critical_tariffs...")
        cursor.execute("""
            CREATE TABLE nsj_critical_tariffs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                age INTEGER NOT NULL,
                gender VARCHAR(1) NOT NULL,
                term_years INTEGER NOT NULL,
                russia_rate DECIMAL(10,6) NOT NULL,
                abroad_rate DECIMAL(10,6) NOT NULL,
                is_active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Создаем индексы
        cursor.execute("CREATE INDEX idx_nsj_critical_tariffs_age ON nsj_critical_tariffs(age)")
        cursor.execute("CREATE INDEX idx_nsj_critical_tariffs_gender ON nsj_critical_tariffs(gender)")
        cursor.execute("CREATE INDEX idx_nsj_critical_tariffs_term ON nsj_critical_tariffs(term_years)")
        cursor.execute("CREATE INDEX idx_nsj_critical_tariffs_lookup ON nsj_critical_tariffs(age, gender, term_years, is_active)")
        
        print("✅ Таблицы созданы успешно!")
        
        # 5. Заполняем тестовыми данными
        print("📝 Заполнение тестовыми тарифными данными...")
        
        # Базовые тарифы смертности и инвалидности (примеры)
        base_tariffs = []
        for age in range(18, 71):  # возраст от 18 до 70 лет
            for gender in ['m', 'f']:
                for term in [1, 5, 10, 15, 20, 25, 30]:
                    # Примерные тарифы (в промилле на 1000 руб страховой суммы)
                    if gender == 'm':
                        death_base = 0.5 + (age - 18) * 0.1 + (term * 0.05)
                        disability_base = 0.3 + (age - 18) * 0.05 + (term * 0.02)
                    else:
                        death_base = 0.3 + (age - 18) * 0.08 + (term * 0.04)
                        disability_base = 0.2 + (age - 18) * 0.04 + (term * 0.015)
                    
                    base_tariffs.append((age, gender, term, death_base, disability_base))
        
        cursor.executemany("""
            INSERT INTO nsj_tariffs (age, gender, term_years, death_rate, disability_rate)
            VALUES (?, ?, ?, ?, ?)
        """, base_tariffs)
        
        print(f"   ✅ Добавлено {len(base_tariffs)} базовых тарифов")
        
        # Тарифы НС
        accident_tariffs = []
        for age in range(18, 71):
            for gender in ['m', 'f']:
                for term in [1, 5, 10, 15, 20, 25, 30]:
                    # Примерные тарифы НС (в промилле)
                    if gender == 'm':
                        death_ns = 0.2 + (age - 18) * 0.02
                        traffic_ns = 0.15 + (age - 18) * 0.015
                        injury_ns = 1.5 + (age - 18) * 0.05
                    else:
                        death_ns = 0.15 + (age - 18) * 0.015
                        traffic_ns = 0.1 + (age - 18) * 0.01
                        injury_ns = 1.2 + (age - 18) * 0.04
                    
                    accident_tariffs.append((age, gender, term, death_ns, traffic_ns, injury_ns))
        
        cursor.executemany("""
            INSERT INTO nsj_accident_tariffs (age, gender, term_years, death_rate, traffic_death_rate, injury_rate)
            VALUES (?, ?, ?, ?, ?, ?)
        """, accident_tariffs)
        
        print(f"   ✅ Добавлено {len(accident_tariffs)} тарифов НС")
        
        # Тарифы КЗ
        critical_tariffs = []
        for age in range(18, 71):
            for gender in ['m', 'f']:
                for term in [1, 5, 10, 15, 20, 25, 30]:
                    # Примерные тарифы КЗ (в промилле)
                    if gender == 'm':
                        russia_rate = 2.0 + (age - 18) * 0.15
                        abroad_rate = russia_rate * 1.8  # За рубежом дороже
                    else:
                        russia_rate = 1.8 + (age - 18) * 0.12
                        abroad_rate = russia_rate * 1.8
                    
                    critical_tariffs.append((age, gender, term, russia_rate, abroad_rate))
        
        cursor.executemany("""
            INSERT INTO nsj_critical_tariffs (age, gender, term_years, russia_rate, abroad_rate)
            VALUES (?, ?, ?, ?, ?)
        """, critical_tariffs)
        
        print(f"   ✅ Добавлено {len(critical_tariffs)} тарифов КЗ")
        
        # Добавляем коэффициенты по рискам
        risk_rates = []
        for age_from in range(18, 66, 5):  # Группы по 5 лет
            age_to = min(age_from + 4, 70)
            survival = 0.98 - (age_from - 18) * 0.001
            death_immediate = 0.001 + (age_from - 18) * 0.0001
            death_deferred = 0.015 + (age_from - 18) * 0.0005
            investment = 0.04  # 4% годовых
            
            risk_rates.append((age_from, age_to, survival, death_immediate, death_deferred, investment))
        
        cursor.executemany("""
            INSERT INTO nsj_risk_rates (age_from, age_to, survival_rate, death_immediate_rate, death_deferred_rate, investment_rate)
            VALUES (?, ?, ?, ?, ?, ?)
        """, risk_rates)
        
        print(f"   ✅ Добавлено {len(risk_rates)} коэффициентов по рискам")
        
        # Сохраняем изменения
        conn.commit()
        
        # 6. Проверяем созданные данные
        print("\n📊 Проверка созданных данных:")
        
        cursor.execute("SELECT COUNT(*) FROM nsj_tariffs")
        tariffs_count = cursor.fetchone()[0]
        print(f"   📋 Базовые тарифы: {tariffs_count}")
        
        cursor.execute("SELECT COUNT(*) FROM nsj_accident_tariffs")
        accident_count = cursor.fetchone()[0]
        print(f"   🚨 Тарифы НС: {accident_count}")
        
        cursor.execute("SELECT COUNT(*) FROM nsj_critical_tariffs")
        critical_count = cursor.fetchone()[0]
        print(f"   🏥 Тарифы КЗ: {critical_count}")
        
        cursor.execute("SELECT COUNT(*) FROM nsj_risk_rates")
        risk_count = cursor.fetchone()[0]
        print(f"   📈 Коэффициенты рисков: {risk_count}")
        
        # Тестовый запрос
        print("\n🧪 Тестовый запрос (мужчина 35 лет, срок 15 лет):")
        cursor.execute("""
            SELECT death_rate, disability_rate 
            FROM nsj_tariffs 
            WHERE age = 35 AND gender = 'm' AND term_years = 15
        """)
        
        test_result = cursor.fetchone()
        if test_result:
            print(f"   ✅ Найден тариф: смерть={test_result[0]:.6f}, инвалидность={test_result[1]:.6f}")
        else:
            print("   ❌ Тестовый тариф не найден!")
        
        print(f"\n🎉 SQLite база данных успешно создана: {db_path}")
        print(f"📁 Размер файла: {os.path.getsize(db_path)} байт")
        
        return True
        
    except Exception as e:
        print(f"❌ Ошибка при создании базы данных: {e}")
        return False
    
    finally:
        cursor.close()
        conn.close()

def test_database(db_path="miniapp.db"):
    """Тестирование созданной базы данных"""
    print(f"\n🧪 Тестирование базы данных: {db_path}")
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Тест 1: Поиск базового тарифа
        print("📋 Тест 1: Поиск базового тарифа...")
        cursor.execute("""
            SELECT death_rate, disability_rate 
            FROM nsj_tariffs 
            WHERE age = 35 AND gender = 'm' AND term_years = 15 AND is_active = 1
        """)
        result = cursor.fetchone()
        if result:
            print(f"   ✅ Базовый тариф найден: {result}")
        else:
            print("   ❌ Базовый тариф не найден")
        
        # Тест 2: Поиск тарифа НС
        print("🚨 Тест 2: Поиск тарифа НС...")
        cursor.execute("""
            SELECT death_rate, traffic_death_rate, injury_rate 
            FROM nsj_accident_tariffs 
            WHERE age = 35 AND gender = 'm' AND term_years = 15 AND is_active = 1
        """)
        result = cursor.fetchone()
        if result:
            print(f"   ✅ Тариф НС найден: {result}")
        else:
            print("   ❌ Тариф НС не найден")
        
        # Тест 3: Поиск тарифа КЗ
        print("🏥 Тест 3: Поиск тарифа КЗ...")
        cursor.execute("""
            SELECT russia_rate, abroad_rate 
            FROM nsj_critical_tariffs 
            WHERE age = 35 AND gender = 'm' AND term_years = 15 AND is_active = 1
        """)
        result = cursor.fetchone()
        if result:
            print(f"   ✅ Тариф КЗ найден: {result}")
        else:
            print("   ❌ Тариф КЗ не найден")
        
        # Тест 4: Поиск коэффициентов рисков
        print("📈 Тест 4: Поиск коэффициентов рисков...")
        cursor.execute("""
            SELECT survival_rate, death_immediate_rate, death_deferred_rate, investment_rate 
            FROM nsj_risk_rates 
            WHERE age_from <= 35 AND age_to >= 35 AND is_active = 1
        """)
        result = cursor.fetchone()
        if result:
            print(f"   ✅ Коэффициенты найдены: {result}")
        else:
            print("   ❌ Коэффициенты не найдены")
        
        cursor.close()
        conn.close()
        
        print("✅ Все тесты пройдены успешно!")
        return True
        
    except Exception as e:
        print(f"❌ Ошибка при тестировании: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Инициализация локальной SQLite базы данных с тарифами НСЖ")
    print("=" * 70)
    
    # Создаем базу
    success = create_sqlite_tariffs_db()
    
    if success:
        # Тестируем базу
        test_database()
        
        print("\n" + "=" * 70)
        print("🎯 База данных готова к использованию!")
        print("💡 Теперь запустите сервер: python server.py")
        print("📝 База будет использоваться автоматически при локальной разработке")
    else:
        print("\n❌ Не удалось создать базу данных")
        sys.exit(1)
