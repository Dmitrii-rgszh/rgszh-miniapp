import psycopg2
import csv

# Подключение к PostgreSQL
conn = psycopg2.connect(host="postgres", port=5432, database="miniapp", user="postgres", password="secret")
cursor = conn.cursor()

# Очищаем старую таблицу
cursor.execute("DROP TABLE IF EXISTS justincase_tariffs CASCADE;")

# Создаем новую таблицу
cursor.execute("""
CREATE TABLE justincase_tariffs (
    id SERIAL PRIMARY KEY,
    payment_period INTEGER,
    age INTEGER,
    gender VARCHAR(1),
    death_rate DECIMAL(10,8),
    disability_rate DECIMAL(10,8),
    accident_death_rate DECIMAL(10,8),
    traffic_death_rate DECIMAL(10,8),
    injury_rate DECIMAL(10,8),
    critical_rf_fee DECIMAL(10,2),
    critical_abroad_fee DECIMAL(10,2),
    i_rate DECIMAL(10,8)
);
""")

# Загружаем данные из CSV
with open("Базовые тарифы.csv", "r", encoding="utf-8") as f:
    reader = csv.reader(f, delimiter=";")
    next(reader)  # Пропускаем заголовок
    
    for row in reader:
        if len(row) >= 11 and row[1].isdigit():
            period = int(row[0])
            age = int(row[1])
            gender = row[2]
            death_rate = float(row[3].replace("%", "").replace(",", ".")) / 100
            disability_rate = float(row[4].replace("%", "").replace(",", ".")) / 100
            accident_death_rate = float(row[5].replace("%", "").replace(",", ".")) / 100
            traffic_death_rate = float(row[6].replace("%", "").replace(",", ".")) / 100
            injury_rate = float(row[7].replace("%", "").replace(",", ".")) / 100
            critical_rf_fee = float(row[8].replace(" ", "").replace(",", "."))
            critical_abroad_fee = float(row[9].replace(" ", "").replace(",", "."))
            i_rate = float(row[10].replace(",", "."))
            
            cursor.execute("""
                INSERT INTO justincase_tariffs 
                (payment_period, age, gender, death_rate, disability_rate, 
                 accident_death_rate, traffic_death_rate, injury_rate,
                 critical_rf_fee, critical_abroad_fee, i_rate)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (period, age, gender, death_rate, disability_rate, 
                  accident_death_rate, traffic_death_rate, injury_rate,
                  critical_rf_fee, critical_abroad_fee, i_rate))

conn.commit()

cursor.execute("SELECT COUNT(*) FROM justincase_tariffs;")
total = cursor.fetchone()[0]
print(f"Загружено {total} тарифов")

cursor.close()
conn.close()
