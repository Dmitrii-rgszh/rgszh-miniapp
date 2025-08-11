#!/usr/bin/env python3
import sys
import os
import requests
import json

# Тест API напрямую
def test_justincase_api():
    url = "https://176.108.243.189/api/justincase/calculate"
    
    # Данные как в скриншоте - мужчина 35 лет, срок 5 лет
    payload = {
        "age": 35,
        "gender": "m", 
        "term_years": 5,
        "sum_insured": 1000000
    }
    
    print("=" * 50)
    print("ОТЛАДКА РАСЧЕТА JUSTINCASE")
    print("=" * 50)
    print(f"Отправляем запрос на: {url}")
    print(f"Payload: {json.dumps(payload, indent=2, ensure_ascii=False)}")
    
    try:
        # Отключаем проверку SSL для тестирования
        response = requests.post(url, json=payload, verify=False, timeout=10)
        
        print(f"\nСтатус ответа: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"\nОтвет API:")
            print(json.dumps(data, indent=2, ensure_ascii=False))
            
            # Анализируем результат
            if 'result' in data:
                result = data['result']
                print(f"\n--- АНАЛИЗ РЕЗУЛЬТАТА ---")
                print(f"Base Premium: {result.get('basePremium', 'НЕ НАЙДЕНО')}")
                print(f"Critical Premium: {result.get('criticalPremium', 'НЕ НАЙДЕНО')}")
                print(f"Total Premium: {result.get('totalPremium', 'НЕ НАЙДЕНО')}")
                
                # Проверим типы данных
                if 'criticalPremium' in result:
                    cp = result['criticalPremium']
                    print(f"Тип criticalPremium: {type(cp)} = {cp}")
                    
                if 'totalPremium' in result:
                    tp = result['totalPremium']
                    print(f"Тип totalPremium: {type(tp)} = {tp}")
        else:
            print(f"Ошибка: {response.text}")
            
    except Exception as e:
        print(f"Ошибка запроса: {e}")

# Тестируем локальный расчет
def test_local_calculation():
    print("\n" + "=" * 50)
    print("ТЕСТ ЛОКАЛЬНОГО РАСЧЕТА")
    print("=" * 50)
    
    try:
        # Импортируем наш калькулятор
        sys.path.append('.')
        from justincase_calculator import calculate_premium
        
        # Данные как в скриншоте
        age = 35
        gender = 'm'
        term_years = 5
        amount = 1000000
        
        print(f"Тестируем расчет для:")
        print(f"  Возраст: {age}")
        print(f"  Пол: {gender}")
        print(f"  Срок: {term_years} лет")
        print(f"  Сумма: {amount:,} руб.")
        
        result = calculate_premium(age, gender, amount, term_years)
        
        print(f"\nРезультат локального расчета:")
        print(json.dumps(result, indent=2, ensure_ascii=False))
        
        return result
        
    except Exception as e:
        print(f"Ошибка локального расчета: {e}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    # Тестируем локально
    local_result = test_local_calculation()
    
    # Тестируем API
    test_justincase_api()
    
    print("\n" + "=" * 50)
    print("ЗАКЛЮЧЕНИЕ")
    print("=" * 50)
    
    if local_result:
        cp = local_result.get('criticalPremium', 0)
        tp = local_result.get('totalPremium', 0)
        
        print(f"Ожидаемые значения (локальный расчет):")
        print(f"  Critical Premium: {cp}")
        print(f"  Total Premium: {tp}")
        print(f"\nДолжно отображаться:")
        print(f"  Критические заболевания: {cp:,.0f} руб.")
        print(f"  Итоговая стоимость: {tp:,.0f} руб.")
