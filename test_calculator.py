from justincase_calculator import calculate_justincase_premium

# Тестируем расчет
print("Тестируем калькулятор JustInCase...")

# Параметры из приложения: возраст 30, мужчина, срок 10 лет, сумма 1 000 000
result = calculate_justincase_premium(
    age=30,
    gender='m',
    term_years=10,
    sum_insured=1000000,
    include_accident=True,
    include_critical_illness=True,
    critical_illness_type='rf',  # РФ
    payment_frequency='annual'
)

print("\nРезультат расчета:")
print(f"Успех: {result['success']}")

if result['success']:
    print(f"Базовая премия: {result['base_premium']:.2f} руб.")
    print(f"Премия КЗ: {result['critical_illness_premium']:.2f} руб.")
    print(f"Премия НС: {result['accident_premium']:.2f} руб.")
    print(f"Итоговая премия: {result['final_premium']:.2f} руб.")
    print(f"Тип КЗ: {result['critical_illness_type']}")
else:
    print(f"Ошибка: {result['error']}")

# Тестируем с КЗ за рубежом
print("\n" + "="*50)
print("Тестируем с КЗ за рубежом...")

result2 = calculate_justincase_premium(
    age=30,
    gender='m',
    term_years=10,
    sum_insured=1000000,
    include_accident=True,
    include_critical_illness=True,
    critical_illness_type='abroad',  # За рубежом
    payment_frequency='annual'
)

print("\nРезультат расчета с КЗ за рубежом:")
if result2['success']:
    print(f"Базовая премия: {result2['base_premium']:.2f} руб.")
    print(f"Премия КЗ: {result2['critical_illness_premium']:.2f} руб.")
    print(f"Премия НС: {result2['accident_premium']:.2f} руб.")
    print(f"Итоговая премия: {result2['final_premium']:.2f} руб.")
    print(f"Тип КЗ: {result2['critical_illness_type']}")
else:
    print(f"Ошибка: {result2['error']}")
