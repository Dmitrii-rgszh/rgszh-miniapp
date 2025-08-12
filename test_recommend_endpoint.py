#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Тест эндпоинта рекомендованной суммы
"""

import requests
import json
from datetime import datetime, timedelta

def test_recommend_sum_endpoint():
    """Тестируем эндпоинт расчета рекомендованной суммы"""
    
    # URL эндпоинта
    base_url = "https://176.108.243.189"
    endpoint = f"{base_url}/api/justincase/recommend-sum"
    
    # Тестовые данные
    test_payload = {
        "birthDate": "1990-05-15",  # 35 лет
        "hasJob": True,
        "income2022": "1200000",     # 1.2 млн
        "income2023": "1350000",     # 1.35 млн
        "income2024": "1500000",     # 1.5 млн
        "scholarship": "0",
        "unsecuredLoans": "500000",   # 500к долгов
        "breadwinnerStatus": "main_breadwinner",
        "incomeShare": "70",          # 70% дохода семьи
        "childrenCount": "2",         # 2 детей
        "specialCareRelatives": "1"   # 1 родственник на попечении
    }
    
    print("🧪 === ТЕСТ ЭНДПОИНТА РЕКОМЕНДОВАННОЙ СУММЫ ===")
    print(f"📡 URL: {endpoint}")
    print(f"📤 Payload: {json.dumps(test_payload, indent=2, ensure_ascii=False)}")
    print()
    
    try:
        # Отправляем запрос
        print("🚀 Отправляем запрос...")
        response = requests.post(
            endpoint,
            json=test_payload,
            headers={'Content-Type': 'application/json'},
            timeout=30,
            verify=False  # Игнорируем SSL сертификат для тестов
        )
        
        print(f"📊 Статус ответа: {response.status_code}")
        print(f"📋 Заголовки ответа: {dict(response.headers)}")
        
        if response.headers.get('Content-Type', '').startswith('application/json'):
            result = response.json()
            print(f"📥 Результат:")
            print(json.dumps(result, indent=2, ensure_ascii=False))
            
            if response.status_code == 200:
                if result.get('success'):
                    data = result.get('data', {})
                    recommended_sum = data.get('recommended_sum')
                    recommended_term = data.get('recommended_term')
                    calculation_details = data.get('calculation_details', {})
                    
                    print("\n✅ ЭНДПОИНТ РАБОТАЕТ КОРРЕКТНО!")
                    print(f"💰 Рекомендованная сумма: {recommended_sum:,} руб.")
                    print(f"📅 Рекомендованный срок: {recommended_term} лет")
                    print(f"👤 Возраст: {calculation_details.get('age')} лет")
                    print(f"💵 Средний доход: {calculation_details.get('average_income'):,} руб.")
                    print(f"👨‍👩‍👧‍👦 Семейный множитель: {calculation_details.get('family_multiplier')}")
                    print(f"💳 Долги: {calculation_details.get('debt_factor'):,} руб.")
                else:
                    print(f"❌ Ошибка в ответе: {result.get('message', 'Неизвестная ошибка')}")
            else:
                print(f"❌ HTTP ошибка {response.status_code}")
        else:
            print(f"📝 Текстовый ответ: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Ошибка подключения к серверу")
        print("💡 Возможно, сервер не запущен или эндпоинт не развернут")
    except requests.exceptions.Timeout:
        print("⏰ Таймаут запроса")
    except requests.exceptions.SSLError as e:
        print(f"🔒 SSL ошибка: {e}")
    except Exception as e:
        print(f"💥 Неожиданная ошибка: {e}")

if __name__ == "__main__":
    test_recommend_sum_endpoint()
