# check_critical_tariffs.py - Проверка тарифов КЗ

import sqlite3

def check_critical_tariffs():
    print("🔍 Проверяем тарифы КЗ...")
    
    conn = sqlite3.connect('miniapp.db')
    cursor = conn.cursor()
    
    # Проверяем тарифы КЗ для возраста 35
    cursor.execute("SELECT * FROM nsj_critical_tariffs WHERE age=35 AND gender='m' AND term_years=5")
    tariffs = cursor.fetchall()
    
    for tariff in tariffs:
        print(f"✅ Тариф КЗ найден:")
        print(f"   ID: {tariff[0]}")
        print(f"   Возраст: {tariff[1]}")
        print(f"   Пол: {tariff[2]}")
        print(f"   Срок: {tariff[3]}")
        print(f"   Регион: {tariff[4]}")
        print(f"   Тариф: {tariff[5]} руб.")
        print()
    
    conn.close()

if __name__ == "__main__":
    check_critical_tariffs()
