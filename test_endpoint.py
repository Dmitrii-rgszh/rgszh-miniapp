#!/usr/bin/env python3
# test_endpoint.py - Тест основного endpoint

import requests
import json

print("🧪 === ТЕСТ ОСНОВНОГО ENDPOINT ===")

# Тестовые данные
test_data = {
    "birthDate": "1990-01-01",
    "gender": "male",
    "insuranceInfo": "yes", 
    "insuranceTerm": 5,
    "insuranceSum": "1000000",
    "insuranceFrequency": "Ежегодно",
    "accidentPackage": False,
    "criticalPackage": False,
    "sportPackage": False
}

print("📤 Отправляем тестовые данные...")
print(f"   Данные: {json.dumps(test_data, ensure_ascii=False, indent=2)}")

try:
    response = requests.post(
        'http://localhost:4000/api/proxy/calculator/save',
        json=test_data,
        headers={'Content-Type': 'application/json'},
        timeout=10
    )
    
    print(f"\n📥 Ответ сервера:")
    print(f"   Статус: {response.status_code}")
    print(f"   Headers: {dict(response.headers)}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"   ✅ УСПЕХ!")
        print(f"   💰 Премия: {result.get('annualPremium', 'не найдено')}")
        print(f"   🎯 Сумма: {result.get('baseInsuranceSum', 'не найдено')}")
        print(f"   🧮 Калькулятор: {result.get('calculator', 'не указан')}")
        
    elif response.status_code == 404:
        print(f"   ❌ ENDPOINT НЕ НАЙДЕН!")
        print(f"   📝 Это означает, что маршрут /api/proxy/calculator/save не зарегистрирован")
        
    elif response.status_code == 500:
        print(f"   ❌ ОШИБКА СЕРВЕРА!")
        try:
            error_data = response.json()
            print(f"   📄 Ошибка: {json.dumps(error_data, ensure_ascii=False, indent=2)}")
        except:
            print(f"   📄 Raw: {response.text}")
            
    else:
        print(f"   ❌ НЕОЖИДАННЫЙ СТАТУС: {response.status_code}")
        print(f"   📄 Ответ: {response.text}")

except requests.exceptions.ConnectionError:
    print("   ❌ СЕРВЕР НЕ ЗАПУЩЕН!")
    print("   📝 Запустите: python server.py")
    
except Exception as e:
    print(f"   ❌ ОШИБКА: {e}")

print(f"\n🎯 === ДИАГНОЗ ===")
print("Если получили 404 - нужно исправить регистрацию маршрутов в server.py")
print("Если получили 500 - есть ошибка в коде калькулятора") 
print("Если получили 200 - все работает!")