#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from justincase_calculator import calculate_premium
import json

# Тест с минимальной страховой суммой 1 млн рублей
print("🧪 Тестирование расчётов с новой структурой тарифов")
print("=" * 60)

# Тест 1: Мужчина 30 лет, 1 млн рублей, 5 лет, РФ
print("\n📊 Тест 1: Мужчина 30 лет, 1 млн рублей, 5 лет, критические заболевания РФ")
result1 = calculate_premium(30, 'm', 1000000, 5, 'rf')
print(json.dumps(result1, indent=2, ensure_ascii=False))

# Тест 2: Женщина 25 лет, 2 млн рублей, 10 лет, Зарубежье
print("\n📊 Тест 2: Женщина 25 лет, 2 млн рублей, 10 лет, критические заболевания Зарубежье")
result2 = calculate_premium(25, 'f', 2000000, 10, 'abroad')
print(json.dumps(result2, indent=2, ensure_ascii=False))

# Тест 3: Мужчина 40 лет, 5 млн рублей, 15 лет, РФ
print("\n📊 Тест 3: Мужчина 40 лет, 5 млн рублей, 15 лет, критические заболевания РФ")
result3 = calculate_premium(40, 'm', 5000000, 15, 'rf')
print(json.dumps(result3, indent=2, ensure_ascii=False))

print("\n✅ Все тесты завершены!")
