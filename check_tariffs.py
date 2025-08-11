import psycopg2

conn = psycopg2.connect(host="postgres", port=5432, database="miniapp", user="postgres", password="secret")
cursor = conn.cursor()

print("=== ПРОВЕРКА ТАРИФОВ ===")

# Проверяем какие периоды есть
cursor.execute("SELECT DISTINCT payment_period FROM justincase_tariffs ORDER BY payment_period;")
periods = [row[0] for row in cursor.fetchall()]
print(f"Доступные периоды: {periods}")

# Проверяем для возраста 35, мужчина
cursor.execute("SELECT payment_period, age, gender, death_rate, critical_rf_fee FROM justincase_tariffs WHERE age = 35 AND gender = 'm' LIMIT 5;")
results = cursor.fetchall()
print(f"Тарифы для 35 лет, мужчина: {results}")

# Проверяем есть ли период 5
cursor.execute("SELECT COUNT(*) FROM justincase_tariffs WHERE payment_period = 5;")
count_5 = cursor.fetchone()[0]
print(f"Тарифов с периодом 5: {count_5}")

# Проверяем есть ли период 1
cursor.execute("SELECT COUNT(*) FROM justincase_tariffs WHERE payment_period = 1;")
count_1 = cursor.fetchone()[0]
print(f"Тарифов с периодом 1: {count_1}")

cursor.close()
conn.close()
