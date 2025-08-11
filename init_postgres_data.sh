#!/bin/bash

# Скрипт инициализации PostgreSQL с данными тарифов

set -e

echo "Ожидание готовности PostgreSQL..."
until pg_isready -h postgres -p 5432 -U postgres; do
    echo "PostgreSQL не готов, ждем..."
    sleep 2
done

echo "PostgreSQL готов. Инициализируем данные..."

# Создаем таблицы если их нет
psql -h postgres -U postgres -d miniapp << 'EOF'
CREATE TABLE IF NOT EXISTS justincase_base_tariffs (
    id SERIAL PRIMARY KEY,
    term_years INTEGER NOT NULL,
    age INTEGER NOT NULL,
    gender VARCHAR(1) NOT NULL,
    death_rate REAL NOT NULL,
    disability_rate REAL NOT NULL,
    accident_death_rate REAL,
    traffic_death_rate REAL,
    injury_rate REAL,
    critical_illness_rf_fee REAL,
    critical_illness_abroad_fee REAL,
    coefficient_i REAL
);

CREATE TABLE IF NOT EXISTS justincase_frequency_coefficients (
    id SERIAL PRIMARY KEY,
    payment_frequency VARCHAR(20) NOT NULL UNIQUE,
    coefficient REAL NOT NULL
);
EOF

# Проверяем есть ли данные
count=$(psql -h postgres -U postgres -d miniapp -t -c "SELECT COUNT(*) FROM justincase_base_tariffs;" | tr -d ' ')

if [ "$count" = "0" ]; then
    echo "Загружаем тарифы..."
    
    # Загружаем данные из локальной SQLite базы
    python3 << 'EOF'
import sqlite3
import psycopg2
import os

# Подключение к SQLite
sqlite_conn = sqlite3.connect('/app/miniapp.db')
sqlite_cursor = sqlite_conn.cursor()

# Подключение к PostgreSQL
postgres_conn = psycopg2.connect(
    host='postgres',
    port=5432,
    database='miniapp',
    user='postgres',
    password='secret'
)
postgres_cursor = postgres_conn.cursor()

# Копируем тарифы
sqlite_cursor.execute("""
    SELECT term_years, age, gender, death_rate, disability_rate, 
           accident_death_rate, traffic_death_rate, injury_rate,
           critical_illness_rf_fee, critical_illness_abroad_fee, coefficient_i
    FROM justincase_base_tariffs
""")

rows = sqlite_cursor.fetchall()
print(f"Копируем {len(rows)} тарифов...")

postgres_cursor.executemany("""
    INSERT INTO justincase_base_tariffs 
    (term_years, age, gender, death_rate, disability_rate, 
     accident_death_rate, traffic_death_rate, injury_rate,
     critical_illness_rf_fee, critical_illness_abroad_fee, coefficient_i)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
""", rows)

# Копируем коэффициенты частоты
sqlite_cursor.execute("SELECT payment_frequency, coefficient FROM justincase_frequency_coefficients")
freq_rows = sqlite_cursor.fetchall()

postgres_cursor.executemany("""
    INSERT INTO justincase_frequency_coefficients (payment_frequency, coefficient)
    VALUES (%s, %s)
""", freq_rows)

postgres_conn.commit()
print("Данные загружены!")

sqlite_conn.close()
postgres_conn.close()
EOF

else
    echo "Данные уже загружены ($count записей)"
fi

echo "Инициализация завершена!"
