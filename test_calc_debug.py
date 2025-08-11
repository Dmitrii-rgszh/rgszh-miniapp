#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import os
sys.path.append('.')

# Устанавливаем переменные окружения для подключения к БД на сервере
os.environ['DB_HOST'] = '176.108.243.189'
os.environ['DB_PORT'] = '5432'
os.environ['DB_NAME'] = 'miniapp'
os.environ['DB_USER'] = 'postgres'
os.environ['DB_PASSWORD'] = 'secret'

from justincase_calculator import JustInCaseCalculator

def test_calculation():
    calc = JustInCaseCalculator()
    
    print("🧮 Тестируем расчет для:")
    print("   Возраст: 35 лет")
    print("   Пол: мужской")
    print("   Срок: 5 лет")
    print("   Страховая сумма: 1,000,000 руб.")
    print("   НС: включен")
    print("   КЗ: включены (РФ)")
    print()
    
    result = calc.calculate_premium(
        age=35,
        gender='m',
        term_years=5,
        sum_insured=1000000,
        include_accident=True,
        include_critical_illness=True,
        critical_illness_type='rf',
        payment_frequency='annual'
    )
    
    if result['success']:
        print("✅ РЕЗУЛЬТАТ РАСЧЕТА:")
        print(f"   💀 Базовая премия (смерть + инвалидность): {result['base_premium']} руб.")
        print(f"   🏥 Критические заболевания: {result['critical_illness_premium']} руб.")
        print(f"   🚑 Несчастный случай: {result['accident_premium']} руб.")
        print(f"   💰 ИТОГО: {result['final_premium']} руб.")
        print()
        
        # Детализация базовой премии
        details = result['calculation_details']['tariff_rates']
        print("📊 ДЕТАЛИЗАЦИЯ ТАРИФОВ:")
        print(f"   death_rate: {details['death_rate']}")
        print(f"   disability_rate: {details['disability_rate']}")
        print(f"   Смерть: 1,000,000 × {details['death_rate']} = {1000000 * details['death_rate']} руб.")
        print(f"   Инвалидность: 1,000,000 × {details['disability_rate']} = {1000000 * details['disability_rate']} руб.")
        
    else:
        print("❌ ОШИБКА:", result['error'])

if __name__ == "__main__":
    test_calculation()
