import pandas as pd
import psycopg2

# Параметры подключения
user = "postgres"
password = "secret"
host = "176.109.110.217"
port = 1112
db = "postgres"

# Путь к вашему CSV-файлу
csv_path = r"C:\Users\shapeless\Desktop\calculators\На всякий случай\Базовые тарифы.csv"

# Чтение CSV
df = pd.read_csv(csv_path, sep=';', encoding='cp1251')

# Проверка и обработка данных
df['insured_age'] = pd.to_numeric(df['insured_age'], errors='coerce')  # Преобразование в числа, некорректные значения станут NaN
invalid_rows = df[df['insured_age'].isna()]  # Найти строки с некорректными значениями
if not invalid_rows.empty:
    print("Некорректные строки:")
    print(invalid_rows)
    df = df.dropna(subset=['insured_age'])  # Удаление строк с некорректными значениями

# Сохранение обработанного CSV
processed_csv_path = r"C:\Users\shapeless\Desktop\calculators\На всякий случай\Базовые тарифы_обработанные.csv"
df.to_csv(processed_csv_path, sep=';', index=False, encoding='cp1251')

# Подключение к базе данных
conn = psycopg2.connect(
    dbname=db,
    user=user,
    password=password,
    host=host,
    port=port
)
cur = conn.cursor()

# Команда COPY для загрузки данных
with open(processed_csv_path, 'r', encoding='cp1251') as f:
    cur.copy_expert("COPY base_tariffs FROM STDIN WITH CSV HEADER DELIMITER ';'", f)

# Завершение транзакции
conn.commit()
cur.close()
conn.close()

print("Данные успешно загружены в таблицу base_tariffs!")