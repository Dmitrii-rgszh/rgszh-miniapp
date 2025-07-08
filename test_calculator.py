# test_calculator.py
# Простой тестовый скрипт для проверки калькулятора

import requests
import json

# URL сервера
BASE_URL = "http://localhost:5000"

def test_status():
    """Проверка статуса калькулятора"""
    print("🔍 Проверка статуса...")
    try:
        response = requests.get(f"{BASE_URL}/api/care-future/status")
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        return False

def test_simple():
    """Простой тест калькулятора"""
    print("\n🧪 Простой тест...")
    try:
        response = requests.get(f"{BASE_URL}/api/care-future/test")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Тест прошел успешно!")
            print(f"Message: {data.get('message', 'N/A')}")
            if 'test_result' in data:
                result = data['test_result']
                print(f"Страховой взнос: {result.get('premium_amount', 'N/A'):,} руб.")
                print(f"Страховая сумма: {result.get('insurance_sum', 'N/A'):,} руб.")
                print(f"Накопленный капитал: {result.get('accumulated_capital', 'N/A'):,} руб.")
                print(f"Доход: {result.get('program_income', 'N/A'):,} руб.")
        else:
            print(f"❌ Ошибка: {response.text}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        return False

def test_calculation():
    """Тест полного расчета"""
    print("\n💰 Тест расчета...")
    
    test_data = {
        "birthDate": "1990-01-01",
        "gender": "male",
        "contractTerm": 5,
        "calculationType": "from_premium",
        "inputAmount": 960000,
        "email": "test@example.com"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/care-future/calculate",
            json=test_data,
            headers={'Content-Type': 'application/json'}
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print(f"✅ Расчет выполнен успешно!")
                print(f"ID расчета: {data.get('calculationId', 'N/A')}")
                
                results = data.get('results', {})
                print(f"\n📊 Результаты:")
                print(f"Страховой взнос: {results.get('premiumAmount', 'N/A'):,} руб.")
                print(f"Страховая сумма: {results.get('insuranceSum', 'N/A'):,} руб.")
                print(f"Накопленный капитал: {results.get('accumulatedCapital', 'N/A'):,} руб.")
                print(f"Доход: {results.get('programIncome', 'N/A'):,} руб.")
                print(f"Налоговый вычет: {results.get('taxDeduction', 'N/A'):,} руб.")
                
                params = data.get('inputParameters', {})
                print(f"\n👤 Параметры:")
                print(f"Возраст на начало: {params.get('ageAtStart', 'N/A')}")
                print(f"Возраст на окончание: {params.get('ageAtEnd', 'N/A')}")
            else:
                print(f"❌ Ошибка расчета: {data.get('error', 'Неизвестная ошибка')}")
        else:
            print(f"❌ HTTP ошибка: {response.text}")
            
        return response.status_code == 200
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        return False

def test_proxy():
    """Тест проксирующего endpoint"""
    print("\n🔄 Тест прокси endpoint...")
    
    test_data = {
        "birthDate": "1985-05-15",
        "gender": "female",
        "contractTerm": 10,
        "calculationType": "from_sum",
        "inputAmount": 5000000
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/care-future/calculate",
            json=test_data,
            headers={'Content-Type': 'application/json'}
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print(f"✅ Прокси endpoint работает!")
                results = data.get('results', {})
                print(f"Расчет от страховой суммы: {results.get('premiumAmount', 'N/A'):,} руб./год")
            else:
                print(f"❌ Ошибка: {data.get('error', 'Неизвестная ошибка')}")
        else:
            print(f"❌ HTTP ошибка: {response.text}")
            
        return response.status_code == 200
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Тестирование калькулятора НСЖ")
    print("=" * 50)
    
    # Запускаем все тесты
    tests = [
        ("Статус", test_status),
        ("Простой тест", test_simple), 
        ("Полный расчет", test_calculation),
        ("Прокси endpoint", test_proxy)
    ]
    
    passed = 0
    total = len(tests)
    
    for name, test_func in tests:
        print(f"\n{'='*20} {name} {'='*20}")
        if test_func():
            passed += 1
            print(f"✅ {name}: ПРОШЕЛ")
        else:
            print(f"❌ {name}: НЕ ПРОШЕЛ")
    
    print(f"\n🎯 Результат: {passed}/{total} тестов прошли")
    
    if passed == total:
        print("🎉 Все тесты прошли! Калькулятор работает корректно.")
    else:
        print("⚠️ Некоторые тесты не прошли. Проверьте логи сервера.")