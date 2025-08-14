#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Тест расчета премий с коэффициентами периодичности
"""

import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from justincase_calculator import JustInCaseCalculator, calculate_premium

def test_frequency_calculations():
    """Тестирование расчета с разными периодичностями"""
    
    print("🧮 === ТЕСТ РАСЧЕТА ПРЕМИЙ С КОЭФФИЦИЕНТАМИ ПЕРИОДИЧНОСТИ ===\n")
    
    # Тестовые данные
    test_data = {
        'age': 30,
        'gender': 'm',
        'term_years': 10,
        'sum_insured': 2000000,
        'include_accident': True,
        'include_critical_illness': True,
        'critical_illness_type': 'rf'
    }
    
    # Коэффициенты из таблицы
    frequency_tests = [
        ('annual', 'Ежегодно', 1.0000),
        ('semi_annual', 'Раз в полгода', 0.5100),
        ('quarterly', 'Ежеквартально', 0.2575),
        ('monthly', 'Ежемесячно', 0.0867)
    ]
    
    print(f"Тестовые параметры:")
    print(f"  Возраст: {test_data['age']} лет")
    print(f"  Пол: {'мужской' if test_data['gender'] == 'm' else 'женский'}")
    print(f"  Срок: {test_data['term_years']} лет")
    print(f"  Страховая сумма: {test_data['sum_insured']:,} руб")
    print(f"  НС: {'да' if test_data['include_accident'] else 'нет'}")
    print(f"  КЗ: {'да' if test_data['include_critical_illness'] else 'нет'}")
    print(f"  Тип КЗ: {test_data['critical_illness_type']}")
    print("\n" + "="*80 + "\n")
    
    results = {}
    
    for freq_key, freq_name, expected_coeff in frequency_tests:
        print(f"📊 {freq_name} (ожидаемый коэффициент: {expected_coeff})")
        print("-" * 60)
        
        try:
            result = calculate_premium(
                **test_data,
                payment_frequency=freq_key
            )
            
            if result['success']:
                results[freq_key] = result
                
                # Основная информация
                print(f"✅ Расчет успешен")
                print(f"   Коэффициент из БД: {result.get('frequency_coefficient', 'N/A')}")
                print(f"   Платежей в год: {result.get('payments_per_year', 'N/A')}")
                print(f"   Коэффициент платежа: {result.get('per_payment_coefficient', 'N/A')}")
                
                # Годовые премии по рискам
                print(f"\n📈 Годовые премии по рискам:")
                if 'premium_by_risk' in result:
                    pbr = result['premium_by_risk']
                    print(f"   Смерть: {pbr.get('death', 0):,.2f} руб")
                    print(f"   Инвалидность: {pbr.get('disability', 0):,.2f} руб")
                    print(f"   НС: {pbr.get('accident', 0):,.2f} руб")
                    print(f"   КЗ: {pbr.get('critical', 0):,.2f} руб")
                    print(f"   Базовая (смерть+инвалидность): {pbr.get('base', 0):,.2f} руб")
                
                # Суммы за один платеж
                print(f"\n💰 Суммы за один платеж:")
                if 'per_payment_breakdown' in result:
                    ppb = result['per_payment_breakdown']
                    print(f"   Смерть: {ppb.get('death', 0):,.2f} руб")
                    print(f"   Инвалидность: {ppb.get('disability', 0):,.2f} руб")
                    print(f"   НС: {ppb.get('accident', 0):,.2f} руб")
                    print(f"   КЗ: {ppb.get('critical', 0):,.2f} руб")
                    print(f"   Итого за платеж: {ppb.get('total', 0):,.2f} руб")
                
                # Итоговые суммы
                print(f"\n🎯 Итоговые суммы:")
                print(f"   Базовая премия: {result.get('base_premium', 0):,.2f} руб")
                print(f"   Премия НС: {result.get('accident_premium', 0):,.2f} руб") 
                print(f"   Премия КЗ: {result.get('critical_illness_premium', 0):,.2f} руб")
                print(f"   Годовая до частоты: {result.get('total_annual_premium', 0):,.2f} руб")
                print(f"   ИТОГО К ДОПЛАТЕ: {result.get('final_premium', 0):,.2f} руб")
                
            else:
                print(f"❌ Ошибка: {result.get('error', 'Неизвестная ошибка')}")
                
        except Exception as e:
            print(f"❌ Исключение: {e}")
            import traceback
            traceback.print_exc()
        
        print("\n" + "="*80 + "\n")
    
    # Сравнительная таблица
    if len(results) > 1:
        print("📋 СРАВНИТЕЛЬНАЯ ТАБЛИЦА РЕЗУЛЬТАТОВ")
        print("=" * 100)
        
        header = f"{'Периодичность':<15} {'Коэфф.':<8} {'Платежей':<10} {'За платеж':<12} {'Годовая':<12} {'Доплата':<10}"
        print(header)
        print("-" * 100)
        
        base_annual = results.get('annual', {}).get('final_premium', 0)
        
        for freq_key, freq_name, expected_coeff in frequency_tests:
            if freq_key in results:
                r = results[freq_key]
                final = r.get('final_premium', 0)
                per_payment = r.get('per_payment_breakdown', {}).get('total', 0)
                freq_coeff = r.get('frequency_coefficient', 0)
                payments = r.get('payments_per_year', 0)
                markup = ((final / base_annual - 1) * 100) if base_annual > 0 else 0
                
                row = f"{freq_name:<15} {freq_coeff:<8.4f} {payments:<10} {per_payment:<12,.0f} {final:<12,.0f} {markup:<10.1f}%"
                print(row)
        
        print("-" * 100)

if __name__ == "__main__":
    test_frequency_calculations()
