#!/usr/bin/env python3
import requests
import json

def test_frontend_format():
    """Тестируем как фронтенд отправляет данные в реальности"""
    
    url = "https://176.108.243.189/api/proxy/calculator/save"
    
    # Payload как отправляет реальный фронтенд (старый формат)
    payload = {
        "birthDate": "1990-06-14",  # 14.06.1990 -> должно быть 35 лет
        "gender": "male",            # старый формат
        "insuranceSum": "1.000.000", # старый формат с точками
        "insuranceTerm": "5",        # строка
        "accidentPackage": "yes",    # старый формат
        "criticalPackage": "yes",    # старый формат 
        "treatmentRegion": "russia", # старый формат
        "insuranceFrequency": "Ежегодно"  # старый формат
    }
    
    print("=" * 70)
    print("ТЕСТ ФРОНТЕНД ФОРМАТА (как реально отправляется)")
    print("=" * 70)
    print(f"URL: {url}")
    print(f"Payload: {json.dumps(payload, indent=2, ensure_ascii=False)}")
    
    try:
        response = requests.post(url, json=payload, verify=False, timeout=15)
        
        print(f"\nСтатус: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"\nОтвет:")
            print(json.dumps(data, indent=2, ensure_ascii=False))
            
            # Анализируем результат
            calc_result = data.get('calculation_result', {})
            print(f"\n--- АНАЛИЗ РЕЗУЛЬТАТА ---")
            print(f"Client Age: {calc_result.get('clientAge', 'НЕ НАЙДЕНО')}")
            print(f"Client Gender: {calc_result.get('clientGender', 'НЕ НАЙДЕНО')}")
            print(f"Insurance Term: {calc_result.get('insuranceTerm', 'НЕ НАЙДЕНО')}")
            print(f"Critical Premium: {calc_result.get('criticalPremium', 'НЕ НАЙДЕНО')}")
            print(f"Total Premium: {calc_result.get('totalPremium', 'НЕ НАЙДЕНО')}")
            
            # Проверяем правильность
            age = calc_result.get('clientAge')
            if age == 35:
                print(f"✅ ВОЗРАСТ ПРАВИЛЬНЫЙ: {age}")
            else:
                print(f"❌ ВОЗРАСТ НЕПРАВИЛЬНЫЙ: {age} (должен быть 35)")
                
            gender = calc_result.get('clientGender')
            if gender == 'Мужской':
                print(f"✅ ПОЛ ПРАВИЛЬНЫЙ: {gender}")
            else:
                print(f"❌ ПОЛ НЕПРАВИЛЬНЫЙ: {gender} (должен быть Мужской)")
                
        else:
            print(f"Ошибка: {response.text}")
            
    except Exception as e:
        print(f"Ошибка запроса: {e}")

if __name__ == "__main__":
    test_frontend_format()
