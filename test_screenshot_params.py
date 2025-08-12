#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Тест с параметрами из скриншота для анализа логики расчета
"""

import requests
import json

def test_screenshot_parameters():
    """
    Тестируем точно такие же параметры как на скриншоте
    """
    vm_ip = "176.108.243.189"
    endpoint = f"https://{vm_ip}/api/justincase/recommend-sum"
    
    # Параметры из скриншота
    test_data = {
        "birthDate": "1989-01-01",  # Возраст 35 лет (2024 - 1989 = 35)
        "hasJob": "yes",
        "income2022": 1000000,  # 1 млн в 2022
        "income2023": 1000000,  # 1 млн в 2023  
        "income2024": 1000000,  # 1 млн в 2024
        "scholarship": 0,
        "unsecuredLoans": 0,  # Нет незащищенных кредитов
        "breadwinnerStatus": "yes",  # Единственный кормилец
        "incomeShare": 62,  # 50-74% -> среднее 62%
        "childrenCount": 0,  # Нет детей
        "specialCareRelatives": 0  # Нет родственников на иждивении
    }
    
    print("🧪 Тестирование параметров из скриншота:")
    print(f"   Возраст: 35 лет")
    print(f"   Доход: 1,000,000 руб/год")
    print(f"   Семейный статус: единственный кормилец")
    print(f"   Доля в бюджете: 50-74%")
    print(f"   Дети: нет")
    print(f"   Иждивенцы: нет")
    print(f"   Долги: нет")
    print()
    
    try:
        response = requests.post(endpoint, json=test_data, timeout=10, verify=False)
        print(f"HTTP Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                data = result.get('data', {})
                recommended_sum = data.get('recommended_sum', 0)
                recommended_term = data.get('recommended_term', 0)
                details = data.get('calculation_details', {})
                
                print(f"✅ Успешно рассчитано:")
                print(f"   Рекомендованная сумма: {recommended_sum:,} руб")
                print(f"   Рекомендованный срок: {recommended_term} лет")
                print()
                print(f"📊 Детали расчета:")
                print(f"   Возраст: {details.get('age')} лет")
                print(f"   Средний доход: {details.get('average_income', 0):,} руб")
                print(f"   Семейный множитель: {details.get('family_multiplier', 1)}")
                print(f"   Долговой фактор: {details.get('debt_factor', 0):,} руб")
                
                # Ручной расчет для проверки
                print()
                print("🔍 Проверим расчет:")
                age = 35
                income = 1000000
                
                # Базовый множитель для возраста 35
                if age <= 35:
                    base_multiplier = 6
                print(f"   Базовый множитель (возраст {age}): {base_multiplier}")
                
                # Семейный множитель
                # main_breadwinner (+0.5) + 0 детей + 0 иждивенцев = 1.5
                family_mult = 1.0 + 0.5  # main_breadwinner
                print(f"   Семейный множитель: {family_mult}")
                
                # Множитель доли дохода (50-74% -> берем среднее ~62%)
                share_mult = min(62 / 50, 2.0)  # = 1.24
                print(f"   Множитель доли дохода: {share_mult}")
                
                # Базовая сумма
                base_sum = income * base_multiplier * family_mult * share_mult
                print(f"   Базовая сумма: {income} * {base_multiplier} * {family_mult} * {share_mult} = {base_sum:,.0f}")
                
                # Итоговая сумма (без долгов)
                final_sum = base_sum + 0  # нет долгов
                print(f"   Итоговая сумма: {final_sum:,.0f}")
                
                # Округление до 100 тысяч
                rounded = round(final_sum / 100000) * 100000
                print(f"   Округленная сумма: {rounded:,.0f}")
                
                # Ограничения (мин 500к, макс 10млн)
                limited = max(500000, min(10000000, rounded))
                print(f"   С ограничениями: {limited:,.0f}")
                
            else:
                print(f"❌ Ошибка в ответе: {result.get('error', 'Неизвестная ошибка')}")
        else:
            print(f"❌ HTTP ошибка: {response.text}")
            
    except Exception as e:
        print(f"❌ Ошибка запроса: {e}")

if __name__ == "__main__":
    test_screenshot_parameters()
