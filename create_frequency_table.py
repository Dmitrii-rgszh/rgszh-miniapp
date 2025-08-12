import sqlite3

def create_frequency_coefficients_table():
    """Создает таблицу коэффициентов частоты платежей"""
    
    conn = sqlite3.connect('miniapp.db')
    cursor = conn.cursor()
    
    try:
        # Создаем таблицу
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS justincase_frequency_coefficients (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                payment_frequency VARCHAR(20) NOT NULL UNIQUE,
                coefficient REAL NOT NULL
            )
        """)
        
        print("Таблица justincase_frequency_coefficients создана")
        
        # Очищаем таблицу перед загрузкой
        cursor.execute("DELETE FROM justincase_frequency_coefficients")
        
        # Стандартные коэффициенты частоты платежей
        coefficients = [
            ('annual', 1.0),       # Ежегодно: 1 × 1.0 = 1.00
            ('semi_annual', 0.51), # Полугодие: 2 × 0.51 = 1.02
            ('quarterly', 0.2575), # Поквартально: 4 × 0.2575 = 1.03  
            ('monthly', 0.0867)    # Ежемесячно: 12 × 0.0867 = 1.04
        ]
        
        for freq, coeff in coefficients:
            cursor.execute("""
                INSERT INTO justincase_frequency_coefficients (payment_frequency, coefficient)
                VALUES (?, ?)
            """, (freq, coeff))
        
        conn.commit()
        print("Коэффициенты частоты платежей загружены")
        
        # Проверяем результат
        cursor.execute("SELECT * FROM justincase_frequency_coefficients")
        rows = cursor.fetchall()
        print("\nЗагруженные коэффициенты:")
        for row in rows:
            print(f"  {row[1]}: {row[2]}")
        
        return True
        
    except Exception as e:
        print(f"Ошибка: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

if __name__ == "__main__":
    create_frequency_coefficients_table()
