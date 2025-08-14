# check_sqlite_tariffs.py - Проверка тарифов в SQLite

import sqlite3

def check_tariffs():
    print("🔍 Проверяем тарифы в SQLite базе данных...")
    
    conn = sqlite3.connect('miniapp.db')
    cursor = conn.cursor()
    
    # Проверяем общее количество записей
    cursor.execute("SELECT COUNT(*) FROM nsj_tariffs")
    total_count = cursor.fetchone()[0]
    print(f"📊 Всего тарифов НСЖ: {total_count}")
    
    # Проверяем конкретный тариф для возраста 35
    cursor.execute("SELECT * FROM nsj_tariffs WHERE age=35 AND gender='m' AND term_years=5")
    tariff = cursor.fetchone()
    
    if tariff:
        print(f"✅ Тариф найден для возраста 35, пол m, срок 5 лет:")
        print(f"   ID: {tariff[0]}")
        print(f"   Возраст: {tariff[1]}")
        print(f"   Пол: {tariff[2]}")
        print(f"   Срок: {tariff[3]}")
        print(f"   Тариф смерти: {tariff[4]}")
        print(f"   Тариф инвалидности: {tariff[5]}")
    else:
        print("❌ Тариф для возраста 35, пол m, срок 5 лет НЕ НАЙДЕН")
        
        # Проверим какие возрасты есть
        cursor.execute("SELECT DISTINCT age FROM nsj_tariffs WHERE gender='m' AND term_years=5 ORDER BY age LIMIT 10")
        ages = cursor.fetchall()
        print(f"🔍 Доступные возрасты для m, срок 5: {[age[0] for age in ages]}")
        
        # Проверим какие сроки есть для возраста 35
        cursor.execute("SELECT DISTINCT term_years FROM nsj_tariffs WHERE age=35 AND gender='m' ORDER BY term_years")
        terms = cursor.fetchall()
        print(f"🔍 Доступные сроки для возраста 35, пол m: {[term[0] for term in terms]}")
    
    # Проверяем НС тарифы
    cursor.execute("SELECT COUNT(*) FROM nsj_accident_tariffs")
    accident_count = cursor.fetchone()[0]
    print(f"📊 Всего тарифов НС: {accident_count}")
    
    # Проверяем КЗ тарифы
    cursor.execute("SELECT COUNT(*) FROM nsj_critical_tariffs")
    critical_count = cursor.fetchone()[0]
    print(f"📊 Всего тарифов КЗ: {critical_count}")
    
    conn.close()
    print("✅ Проверка завершена")

if __name__ == "__main__":
    check_tariffs()
