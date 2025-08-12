#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Тест с проблемными данными, которые вызывали ошибку
"""

import requests
import json
from urllib3 import disable_warnings
from urllib3.exceptions import InsecureRequestWarning

disable_warnings(InsecureRequestWarning)

def test_problematic_data():
    """Тестируем с данными, которые ранее вызывали ошибку"""
    
    vm_ip = "176.108.243.189"
    endpoint = f"https://{vm_ip}/api/justincase/recommend-sum"
    
    # Данные, которые вызывали ошибку в логах
    problematic_payload = {
        "birthDate": "1990-06-13",
        "hasJob": "yes",  # ← Эта строка вызывала ошибку
        "income2022": "1000000",
        "income2023": "1000000", 
        "income2024": "1000000",
        "scholarship": "",  # ← Пустая строка
        "unsecuredLoans": "0",
        "breadwinnerStatus": "yes",  # ← Эта строка тоже
        "incomeShare": "",  # ← Пустая строка
        "childrenCount": "1",
        "specialCareRelatives": "yes"  # ← И эта строка вызывала ошибку
    }
    
    print("🧪 === ТЕСТ ИСПРАВЛЕНИЯ ПАРСИНГА ДАННЫХ ===")
    print(f"📡 URL: {endpoint}")
    print(f"📤 Проблемные данные (которые ранее вызывали ошибку):")
    print(json.dumps(problematic_payload, indent=2, ensure_ascii=False))
    print()
    
    try:
        print("🚀 Отправляем запрос...")
        response = requests.post(
            endpoint,
            json=problematic_payload,
            headers={'Content-Type': 'application/json'},
            timeout=15,
            verify=False
        )
        
        print(f"📊 Статус ответа: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ ИСПРАВЛЕНИЕ РАБОТАЕТ!")
            print(f"📥 Результат:")
            print(json.dumps(result, indent=2, ensure_ascii=False))
            
            data = result.get('data', {})
            recommended_sum = data.get('recommended_sum')
            recommended_term = data.get('recommended_term')
            
            print(f"\n💰 Рекомендованная сумма: {recommended_sum:,} руб.")
            print(f"📅 Рекомендованный срок: {recommended_term} лет")
            
            calculation_details = data.get('calculation_details', {})
            print(f"👤 Возраст: {calculation_details.get('age')} лет")
            print(f"💵 Средний доход: {calculation_details.get('average_income'):,} руб.")
            print(f"👨‍👩‍👧‍👦 Семейный множитель: {calculation_details.get('family_multiplier')}")
            
        elif response.status_code == 500:
            print("❌ Все еще получаем 500 ошибку")
            try:
                error_data = response.json()
                print(f"📝 Ошибка: {error_data.get('message', 'Неизвестная ошибка')}")
            except:
                print(f"📝 Текст ошибки: {response.text}")
        else:
            print(f"⚠️ Неожиданный статус: {response.status_code}")
            print(f"📝 Ответ: {response.text}")
            
    except Exception as e:
        print(f"💥 Ошибка запроса: {e}")

if __name__ == "__main__":
    test_problematic_data()
