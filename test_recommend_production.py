#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Тест логики расчета рекомендованной суммы на продакшене
"""

import requests
import json
import urllib3

# Отключаем предупреждения SSL
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def test_recommend_sum_production():
    """
    Тестируем рекомендованную сумму на продакшене
    """
    vm_ip = "176.108.243.189"
    endpoint = f"https://{vm_ip}/api/justincase/recommend-sum"
    
    # Тестовые данные для JustinCase
    test_cases = [
        {
            "name": "Молодой специалист",
            "data": {
                "birthDate": "1999-01-01",  # 25 лет
                "hasJob": "yes",
                "income2022": 600000,
                "income2023": 700000,
                "income2024": 800000,
                "scholarship": 0,
                "unsecuredLoans": 0,
                "breadwinnerStatus": "not_breadwinner",
                "incomeShare": 30,
                "childrenCount": 0,
                "specialCareRelatives": 0
            }
        },
        {
            "name": "Семейный кормилец",
            "data": {
                "birthDate": "1989-01-01",  # 35 лет
                "hasJob": "yes",
                "income2022": 1000000,
                "income2023": 1000000,
                "income2024": 1000000,
                "scholarship": 0,
                "unsecuredLoans": 0,
                "breadwinnerStatus": "yes",
                "incomeShare": 70,
                "childrenCount": 2,
                "specialCareRelatives": 0
            }
        },
        {
            "name": "Студент со стипендией",
            "data": {
                "birthDate": "2002-01-01",  # 22 года
                "hasJob": "no",
                "income2022": 0,
                "income2023": 0,
                "income2024": 0,
                "scholarship": 50000,
                "unsecuredLoans": 100000,
                "breadwinnerStatus": "not_breadwinner",
                "incomeShare": 0,
                "childrenCount": 0,
                "specialCareRelatives": 0
            }
        },
        {
            "name": "Старший возраст",
            "data": {
                "birthDate": "1964-01-01",  # 60 лет
                "hasJob": "yes",
                "income2022": 2000000,
                "income2023": 2200000,
                "income2024": 2500000,
                "scholarship": 0,
                "unsecuredLoans": 500000,
                "breadwinnerStatus": "yes",
                "incomeShare": 80,
                "childrenCount": 0,
                "specialCareRelatives": 1
            }
        }
    ]
    
    print("🧪 Тестирование логики рекомендованной суммы на продакшене")
    print(f"🌐 Эндпоинт: {endpoint}")
    print("=" * 60)
    
    for i, test_case in enumerate(test_cases, 1):
        name = test_case["name"]
        data = test_case["data"]
        
        print(f"\n{i}. {name}")
        print("-" * 40)
        
        try:
            response = requests.post(endpoint, json=data, timeout=10, verify=False)
            print(f"HTTP Status: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success'):
                    response_data = result.get('data', {})
                    recommended_sum = response_data.get('recommended_sum', 0)
                    recommended_term = response_data.get('recommended_term', 0)
                    details = response_data.get('calculation_details', {})
                    
                    print(f"✅ Результат:")
                    print(f"   Рекомендованная сумма: {recommended_sum:,} руб")
                    print(f"   Рекомендованный срок: {recommended_term} лет")
                    print(f"   Возраст: {details.get('age')} лет")
                    print(f"   Средний доход: {details.get('average_income', 0):,} руб")
                    print(f"   Семейный множитель: {details.get('family_multiplier', 1)}")
                    print(f"   Долговой фактор: {details.get('debt_factor', 0):,} руб")
                    
                    # Проверяем логику
                    age = details.get('age', 0)
                    avg_income = details.get('average_income', 0)
                    ratio = recommended_sum / avg_income if avg_income > 0 else 0
                    
                    print(f"   Коэффициент к доходу: {ratio:.2f}x")
                    
                    # Проверяем рекомендованный срок
                    expected_terms = {
                        "≤30": 25,
                        "31-40": 20,
                        "41-50": 15,
                        "≥51": 10
                    }
                    
                    if age <= 30:
                        expected_term = 25
                        age_group = "≤30"
                    elif age <= 40:
                        expected_term = 20
                        age_group = "31-40"
                    elif age <= 50:
                        expected_term = 15
                        age_group = "41-50"
                    else:
                        expected_term = 10
                        age_group = "≥51"
                    
                    print(f"   Группа возраста: {age_group}")
                    print(f"   Ожидаемый срок: {expected_term} лет")
                    print(f"   Срок совпадает: {'✅' if recommended_term == expected_term else '❌'}")
                    
                else:
                    print(f"❌ Ошибка в ответе: {result.get('error', 'Неизвестная ошибка')}")
            else:
                print(f"❌ HTTP ошибка: {response.text}")
                
        except Exception as e:
            print(f"❌ Ошибка запроса: {e}")
    
    print("\n" + "=" * 60)
    print("✅ Тестирование завершено")

if __name__ == "__main__":
    test_recommend_sum_production()
