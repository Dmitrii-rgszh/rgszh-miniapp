#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Прямой тест логики расчета рекомендованной суммы
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from justincase_routes_new import calculate_recommended_insurance_sum, get_family_multiplier_conservative

def test_calculation_logic():
    """
    Тестируем логику расчета напрямую с отладкой
    """
    print("🧪 Прямое тестирование логики расчета")
    print()
    
    # Параметры из нашего теста
    age = 35
    has_job = True
    income_2022 = 1000000
    income_2023 = 1000000
    income_2024 = 1000000
    scholarship = 0
    unsecured_loans = 0
    breadwinner_status = "main_breadwinner"
    income_share = 62  # 50-74% -> среднее 62%
    children_count = 0
    special_care_relatives = 0
    
    print(f"📊 Входные параметры:")
    print(f"   Возраст: {age}")
    print(f"   Есть работа: {has_job}")
    print(f"   Доходы: {income_2022}, {income_2023}, {income_2024}")
    print(f"   Стипендия: {scholarship}")
    print(f"   Долги: {unsecured_loans}")
    print(f"   Статус кормильца: {breadwinner_status}")
    print(f"   Доля дохода: {income_share}%")
    print(f"   Количество детей: {children_count}")
    print(f"   Иждивенцы: {special_care_relatives}")
    print()
    
    # Шаг 1: Определяем средний доход
    incomes = [income_2022, income_2023, income_2024]
    valid_incomes = [inc for inc in incomes if inc > 0]
    
    if valid_incomes:
        average_income = sum(valid_incomes) / len(valid_incomes)
    elif scholarship > 0:
        average_income = scholarship
    else:
        average_income = 0
        
    print(f"🧮 Шаг 1 - Средний доход:")
    print(f"   Валидные доходы: {valid_incomes}")
    print(f"   Средний доход: {average_income:,.0f}")
    print()
    
    # Шаг 2: Базовый множитель
    base_multiplier = 2  # По умолчанию
    if age <= 25:
        base_multiplier = 2.5
    elif age <= 35:
        base_multiplier = 2.2  # Наш случай
    elif age <= 45:
        base_multiplier = 2.0
    elif age <= 55:
        base_multiplier = 1.8
    else:
        base_multiplier = 1.5
        
    print(f"🧮 Шаг 2 - Базовый множитель:")
    print(f"   Возраст {age} лет -> множитель {base_multiplier}")
    print()
    
    # Шаг 3: Семейный множитель
    family_multiplier = get_family_multiplier_conservative(breadwinner_status, children_count, special_care_relatives)
    
    print(f"🧮 Шаг 3 - Семейный множитель:")
    print(f"   Базовый: 1.0")
    if breadwinner_status == 'main_breadwinner':
        print(f"   + Основной кормилец: +0.5")
    elif breadwinner_status == 'co_breadwinner':
        print(f"   + Со-кормилец: +0.3")
    print(f"   + Дети: {children_count} * 0.3 = {children_count * 0.3}")
    print(f"   + Иждивенцы: {special_care_relatives} * 0.4 = {special_care_relatives * 0.4}")
    print(f"   Итого: {family_multiplier}")
    print()
    
    # Шаг 4: Множитель доли дохода
    if breadwinner_status == 'main_breadwinner' and income_share > 0:
        share_multiplier = 1.0 + (income_share - 50) / 100  # Добавляем только превышение над 50%
        share_multiplier = max(1.0, min(1.3, share_multiplier))  # Ограничиваем 1.0-1.3
    else:
        share_multiplier = 1.0
        
    print(f"🧮 Шаг 4 - Множитель доли дохода:")
    print(f"   Доля: {income_share}%")
    print(f"   Расчет: min({income_share} / 50, 2.0) = {share_multiplier}")
    print()
    
    # Шаг 5: Базовая сумма
    base_sum = average_income * base_multiplier * family_multiplier * share_multiplier
    
    print(f"🧮 Шаг 5 - Базовая сумма:")
    print(f"   {average_income:,.0f} * {base_multiplier} * {family_multiplier} * {share_multiplier} = {base_sum:,.0f}")
    print()
    
    # Шаг 6: Добавляем долги
    total_recommended = base_sum + unsecured_loans
    
    print(f"🧮 Шаг 6 - Добавляем долги:")
    print(f"   {base_sum:,.0f} + {unsecured_loans:,.0f} = {total_recommended:,.0f}")
    print()
    
    # Шаг 7: Ограничения
    min_sum = 500000
    max_sum = 10000000
    recommended = max(min_sum, min(max_sum, total_recommended))
    
    print(f"🧮 Шаг 7 - Применяем ограничения:")
    print(f"   Мин: {min_sum:,.0f}, Макс: {max_sum:,.0f}")
    print(f"   До ограничений: {total_recommended:,.0f}")
    print(f"   После ограничений: {recommended:,.0f}")
    print()
    
    # Шаг 8: Округление
    final_recommended = round(recommended / 100000) * 100000
    
    print(f"🧮 Шаг 8 - Округляем до 100 тысяч:")
    print(f"   {recommended:,.0f} -> {final_recommended:,.0f}")
    print()
    
    print(f"🎯 ИТОГОВЫЙ РЕЗУЛЬТАТ: {final_recommended:,.0f} рублей")
    print()
    
    # Теперь вызовем оригинальную функцию для сравнения
    actual_result = calculate_recommended_insurance_sum(
        age=age,
        has_job=has_job,
        income_2022=income_2022,
        income_2023=income_2023,
        income_2024=income_2024,
        scholarship=scholarship,
        unsecured_loans=unsecured_loans,
        breadwinner_status=breadwinner_status,
        income_share=income_share,
        children_count=children_count,
        special_care_relatives=special_care_relatives
    )
    
    print(f"✅ Результат функции: {actual_result:,.0f} рублей")
    print(f"✅ Расчет совпадает: {final_recommended == actual_result}")
    
    # Сравним с ожидаемым результатом
    expected = 2200000
    print()
    print(f"🤔 Ожидаемый результат из скриншота: {expected:,.0f} рублей")
    print(f"📊 Разница: {abs(actual_result - expected):,.0f} рублей")
    print(f"📊 Коэффициент: {actual_result / expected:.2f}x")

if __name__ == "__main__":
    test_calculation_logic()
