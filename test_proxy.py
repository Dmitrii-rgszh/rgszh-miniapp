#!/usr/bin/env python3
import requests
import json

def test_proxy_endpoint():
    """Тестируем proxy endpoint как это делает фронтенд"""
    
    url = "https://176.108.243.189/api/proxy/calculator/save"
    
    # Payload в точности как отправляет фронтенд
    payload = {
        "age": 35,
        "gender": "m",
        "term_years": 5,
        "sum_insured": 1000000,
        "include_accident": True,
        "include_critical_illness": True,
        "critical_illness_type": "rf",
        "payment_frequency": "annual"
    }
    
    print("=" * 60)
    print("ТЕСТ PROXY ENDPOINT (как фронтенд)")
    print("=" * 60)
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
            if 'calculation_result' in data:
                calc = data['calculation_result']
                print(f"\n--- АНАЛИЗ РЕЗУЛЬТАТА ---")
                print(f"Critical Premium: {calc.get('criticalPremium', 'НЕ НАЙДЕНО')}")
                print(f"Total Premium: {calc.get('totalPremium', 'НЕ НАЙДЕНО')}")
                
                # Проверяем что возвращается фронтенду
                if 'criticalPremium' in calc:
                    cp = calc['criticalPremium']
                    print(f"❗ Critical Premium TYPE: {type(cp)} = {cp}")
                    
                if 'totalPremium' in calc:
                    tp = calc['totalPremium']
                    print(f"❗ Total Premium TYPE: {type(tp)} = {tp}")
                    
            elif 'data' in data:
                result = data['data']
                print(f"\n--- АНАЛИЗ РЕЗУЛЬТАТА (data) ---")
                print(f"Critical Premium: {result.get('criticalPremium', 'НЕ НАЙДЕНО')}")
                print(f"Total Premium: {result.get('totalPremium', 'НЕ НАЙДЕНО')}")
        else:
            print(f"Ошибка: {response.text}")
            
    except Exception as e:
        print(f"Ошибка запроса: {e}")

if __name__ == "__main__":
    test_proxy_endpoint()
