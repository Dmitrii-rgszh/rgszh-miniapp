#!/usr/bin/env python3
# simple_check_db.py - Простая проверка БД

import psycopg2
from datetime import datetime

# Прямое подключение к БД
conn_string = "postgresql://postgres:secret@176.109.110.217:1112/postgres"

try:
    print("🔄 Подключаемся к БД...")
    conn = psycopg2.connect(conn_string)
    cur = conn.cursor()
    print("✅ Подключение успешно!\n")
    
    # Проверяем существование таблицы
    cur.execute("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'nsj_calculations'
        );
    """)
    table_exists = cur.fetchone()[0]
    
    if not table_exists:
        print("❌ Таблица nsj_calculations НЕ СУЩЕСТВУЕТ!")
        print("Нужно создать таблицу через init_nsj_database()")
    else:
        print("✅ Таблица nsj_calculations существует\n")
        
        # Считаем записи
        cur.execute("SELECT COUNT(*) FROM nsj_calculations")
        count = cur.fetchone()[0]
        print(f"📊 Всего расчетов в БД: {count}")
        
        if count == 0:
            print("❌ В базе данных НЕТ расчетов!")
            print("💡 Сделайте новый расчет в калькуляторе")
        else:
            # Показываем последние записи
            print(f"\n📋 Последние расчеты:")
            cur.execute("""
                SELECT calculation_uuid, email, created_at, age_at_start, 
                       contract_term, premium_amount
                FROM nsj_calculations 
                ORDER BY created_at DESC 
                LIMIT 5
            """)
            
            for row in cur.fetchall():
                uuid, email, created, age, term, premium = row
                print(f"\nID: {uuid[:8]}...")
                print(f"Email: {email}")
                print(f"Дата: {created}")
                print(f"Возраст: {age}, Срок: {term} лет")
                print(f"Премия: {premium:,} руб")
        
        # Ищем конкретный расчет
        search_id = "531eec5e-b788-45e4-9caa-10f27b2199aa"
        print(f"\n🔎 Ищем расчет {search_id[:8]}...")
        
        cur.execute("""
            SELECT * FROM nsj_calculations 
            WHERE calculation_uuid = %s
        """, (search_id,))
        
        if cur.fetchone():
            print("✅ Расчет найден!")
        else:
            print("❌ Расчет НЕ найден!")
            
        # Проверяем наличие колонки yearly_income
        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'nsj_calculations' 
            AND column_name = 'yearly_income'
        """)
        
        if cur.fetchone():
            print("\n✅ Колонка yearly_income существует")
        else:
            print("\n❌ Колонка yearly_income НЕ существует!")
    
    cur.close()
    conn.close()
    print("\n✅ Проверка завершена")
    
except psycopg2.OperationalError as e:
    print(f"❌ Ошибка подключения к БД: {e}")
    print("Проверьте доступность БД на 176.109.110.217:1112")
except Exception as e:
    print(f"❌ Ошибка: {e}")
    import traceback
    traceback.print_exc()