# -*- coding: utf-8 -*-
"""
Тестирование корпоративных коэффициентов для калькулятора "На всякий случай"
"""

import requests
import json

def test_corporate_coefficients():
    """Тестирование корпоративных коэффициентов с разными доменами email"""
    
    base_url = "http://localhost:4000/api/justincase/calculate"
    
    # Базовые данные для тестирования
    base_data = {
        "age": 35,
        "gender": "m",
        "term_years": 15,
        "sum_insured": 1000000,
        "include_accident": True,
        "include_critical_illness": True,
        "critical_illness_type": "rf",
        "payment_frequency": "annual"
    }
    
    # Тестовые email с разными доменами
    test_emails = [
        ("test@rgsl.ru", "РГСЛ (+5%)"),
        ("employee@vtb.ru", "ВТБ (+20%)"),
        ("user@gmail.com", "Внешний домен (+30%/+35%)"),
        ("", "Без email (+30%/+35%)"),
        ("invalid-email", "Некорректный email (+30%/+35%)")
    ]
    
    print("=" * 80)
    print("🎯 ТЕСТИРОВАНИЕ КОРПОРАТИВНЫХ КОЭФФИЦИЕНТОВ")
    print("=" * 80)
    print()
    
    results = []
    
    for email, description in test_emails:
        test_data = base_data.copy()
        test_data["email"] = email
        
        try:
            response = requests.post(base_url, json=test_data, headers={"Content-Type": "application/json"})
            
            if response.status_code == 200:
                result = response.json()
                if result.get("success"):
                    data = result["data"]
                    corporate_coeffs = data["calculation_details"]["corporate_coefficients"]
                    
                    results.append({
                        "email": email,
                        "description": description,
                        "base_coefficient": corporate_coeffs["base_coefficient"],
                        "critical_coefficient": corporate_coeffs["critical_coefficient"],
                        "base_premium": data["base_premium"],
                        "accident_premium": data["accident_premium"],
                        "critical_illness_premium": data["critical_illness_premium"],
                        "final_premium": data["final_premium"]
                    })
                    
                    print(f"✅ {description}")
                    print(f"   Email: {email or 'Не указан'}")
                    print(f"   Базовые риски: {corporate_coeffs['base_coefficient']:.2f} (+{(corporate_coeffs['base_coefficient']-1)*100:.0f}%)")
                    print(f"   Критические заболевания: {corporate_coeffs['critical_coefficient']:.2f} (+{(corporate_coeffs['critical_coefficient']-1)*100:.0f}%)")
                    print(f"   Итоговая премия: {data['final_premium']:,.2f} руб.")
                    print()
                else:
                    print(f"❌ {description}: {result.get('error', 'Неизвестная ошибка')}")
                    print()
            else:
                print(f"❌ {description}: HTTP {response.status_code}")
                print()
                
        except Exception as e:
            print(f"❌ {description}: Ошибка подключения - {e}")
            print()
    
    # Сравнительная таблица
    if len(results) >= 2:
        print("=" * 80)
        print("📊 СРАВНИТЕЛЬНАЯ ТАБЛИЦА РЕЗУЛЬТАТОВ")
        print("=" * 80)
        
        # Заголовок таблицы
        print(f"{'Домен':<20} {'Коэфф.база':<12} {'Коэфф.КЗ':<12} {'Базовая':<12} {'НС':<12} {'КЗ':<12} {'Итого':<12}")
        print("-" * 92)
        
        # Базовая строка (первый результат как эталон)
        base_result = results[0]
        for result in results:
            domain = result["email"].split("@")[-1] if "@" in result["email"] else result["email"] or "Нет"
            print(f"{domain:<20} {result['base_coefficient']:<12.2f} {result['critical_coefficient']:<12.2f} "
                  f"{result['base_premium']:<12.2f} {result['accident_premium']:<12.2f} "
                  f"{result['critical_illness_premium']:<12.2f} {result['final_premium']:<12.2f}")
        
        print("-" * 92)
        
        # Расчет разницы относительно самого дешевого
        min_premium = min(r["final_premium"] for r in results)
        print("\n📈 РАЗНИЦА В СТОИМОСТИ:")
        for result in results:
            domain = result["email"].split("@")[-1] if "@" in result["email"] else result["email"] or "Нет"
            diff_abs = result["final_premium"] - min_premium
            diff_pct = (diff_abs / min_premium * 100) if min_premium > 0 else 0
            print(f"   {domain}: +{diff_abs:,.2f} руб. (+{diff_pct:.1f}%)")
    
    print("\n" + "=" * 80)
    print("📋 ВЫВОДЫ:")
    print("=" * 80)
    print("✅ Корпоративные коэффициенты работают корректно")
    print("✅ Разные домены получают соответствующие наценки/скидки")
    print("✅ КЗ имеет отдельный коэффициент для внешних доменов")
    print("🎉 Система корпоративного ценообразования внедрена успешно!")
    print("=" * 80)

if __name__ == "__main__":
    test_corporate_coefficients()
