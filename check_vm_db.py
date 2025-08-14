#!/usr/bin/env python3
"""
Скрипт для проверки базы данных и подготовки данных для ВМ
"""

import sqlite3
import os

def check_local_db():
    """Проверяем локальную базу данных"""
    if not os.path.exists('miniapp.db'):
        print("❌ Локальная база данных miniapp.db не найдена")
        return
    
    conn = sqlite3.connect('miniapp.db')
    cursor = conn.cursor()
    
    # Получаем список таблиц
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = cursor.fetchall()
    
    print("📊 ЛОКАЛЬНАЯ БАЗА ДАННЫХ:")
    print("=" * 50)
    for table in tables:
        table_name = table[0]
        cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
        count = cursor.fetchone()[0]
        print(f"  📋 {table_name}: {count:,} записей")
    
    conn.close()

def check_tariff_structure():
    """Проверяем структуру тарифных таблиц"""
    conn = sqlite3.connect('miniapp.db')
    cursor = conn.cursor()
    
    # Ищем таблицы с тарифами/коэффициентами
    tariff_tables = []
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND (name LIKE '%tariff%' OR name LIKE '%coefficient%' OR name LIKE '%actuarial%')")
    tables = cursor.fetchall()
    
    print("\n🎯 ТАРИФНЫЕ ТАБЛИЦЫ:")
    print("=" * 50)
    
    for table in tables:
        table_name = table[0]
        cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
        count = cursor.fetchone()[0]
        
        # Получаем структуру таблицы
        cursor.execute(f"PRAGMA table_info({table_name})")
        columns = cursor.fetchall()
        
        print(f"\n📋 {table_name}: {count:,} записей")
        print("   Колонки:", ", ".join([col[1] for col in columns]))
        
        if count > 0:
            # Показываем несколько примеров
            cursor.execute(f"SELECT * FROM {table_name} LIMIT 3")
            samples = cursor.fetchall()
            for i, sample in enumerate(samples):
                print(f"   Пример {i+1}: {sample}")
    
    conn.close()

if __name__ == "__main__":
    print("🔍 ПРОВЕРКА БАЗЫ ДАННЫХ ДЛЯ ВМ")
    print("=" * 60)
    
    check_local_db()
    check_tariff_structure()
    
    print("\n" + "=" * 60)
    print("✅ Проверка завершена")
