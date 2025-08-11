#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Финальная загрузка тарифов на продакшн ВМ
"""

import sqlite3
import csv
import subprocess
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def export_and_upload_to_vm():
    """Экспорт из SQLite и загрузка на ВМ"""
    
    # Экспорт из SQLite
    conn = sqlite3.connect('miniapp.db')
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT term_years, age, gender, death_rate, disability_rate, 
               accident_death_rate, traffic_death_rate, injury_rate,
               critical_illness_rf_fee, critical_illness_abroad_fee, coefficient_i
        FROM justincase_base_tariffs
        ORDER BY term_years, age, gender
    """)
    
    rows = cursor.fetchall()
    logger.info(f"Экспортировано {len(rows)} тарифов")
    
    # Создаем CSV
    with open('tariffs.csv', 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow([
            'term_years', 'age', 'gender', 'death_rate', 'disability_rate',
            'accident_death_rate', 'traffic_death_rate', 'injury_rate',
            'critical_illness_rf_fee', 'critical_illness_abroad_fee', 'coefficient_i'
        ])
        writer.writerows(rows)
    
    # Коэффициенты частоты
    cursor.execute("SELECT payment_frequency, coefficient FROM justincase_frequency_coefficients")
    freq_rows = cursor.fetchall()
    
    with open('frequency.csv', 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(['frequency', 'coefficient'])
        writer.writerows(freq_rows)
    
    conn.close()
    
    vm_ip = "176.108.243.189"
    
    # Копируем файлы на ВМ
    logger.info("Копируем файлы на ВМ...")
    subprocess.run(['scp', '-o', 'StrictHostKeyChecking=no', 'tariffs.csv', f'admin@{vm_ip}:/tmp/'], check=True)
    subprocess.run(['scp', '-o', 'StrictHostKeyChecking=no', 'frequency.csv', f'admin@{vm_ip}:/tmp/'], check=True)
    
    # Загружаем в PostgreSQL на ВМ
    logger.info("Загружаем тарифы в PostgreSQL на ВМ...")
    
    # Очищаем и загружаем тарифы
    subprocess.run([
        'ssh', '-o', 'StrictHostKeyChecking=no', f'admin@{vm_ip}',
        'cd /home/admin/rgszh-miniapp && docker exec rgszh-miniapp-postgres-1 psql -U postgres -d miniapp -c "DELETE FROM justincase_base_tariffs;"'
    ], check=True)
    
    subprocess.run([
        'ssh', '-o', 'StrictHostKeyChecking=no', f'admin@{vm_ip}',
        'cd /home/admin/rgszh-miniapp && docker cp /tmp/tariffs.csv rgszh-miniapp-postgres-1:/tmp/'
    ], check=True)
    
    subprocess.run([
        'ssh', '-o', 'StrictHostKeyChecking=no', f'admin@{vm_ip}',
        'cd /home/admin/rgszh-miniapp && docker exec rgszh-miniapp-postgres-1 psql -U postgres -d miniapp -c "\\\\COPY justincase_base_tariffs(term_years, age, gender, death_rate, disability_rate, accident_death_rate, traffic_death_rate, injury_rate, critical_illness_rf_fee, critical_illness_abroad_fee, coefficient_i) FROM \'/tmp/tariffs.csv\' WITH CSV HEADER;"'
    ], check=True)
    
    # Загружаем коэффициенты
    subprocess.run([
        'ssh', '-o', 'StrictHostKeyChecking=no', f'admin@{vm_ip}',
        'cd /home/admin/rgszh-miniapp && docker exec rgszh-miniapp-postgres-1 psql -U postgres -d miniapp -c "DELETE FROM justincase_frequency_coefficients;"'
    ], check=True)
    
    subprocess.run([
        'ssh', '-o', 'StrictHostKeyChecking=no', f'admin@{vm_ip}',
        'cd /home/admin/rgszh-miniapp && docker cp /tmp/frequency.csv rgszh-miniapp-postgres-1:/tmp/'
    ], check=True)
    
    subprocess.run([
        'ssh', '-o', 'StrictHostKeyChecking=no', f'admin@{vm_ip}',
        'cd /home/admin/rgszh-miniapp && docker exec rgszh-miniapp-postgres-1 psql -U postgres -d miniapp -c "\\\\COPY justincase_frequency_coefficients(frequency, coefficient) FROM \'/tmp/frequency.csv\' WITH CSV HEADER;"'
    ], check=True)
    
    # Проверяем
    result = subprocess.run([
        'ssh', '-o', 'StrictHostKeyChecking=no', f'admin@{vm_ip}',
        'cd /home/admin/rgszh-miniapp && docker exec rgszh-miniapp-postgres-1 psql -U postgres -d miniapp -c "SELECT COUNT(*) FROM justincase_base_tariffs; SELECT * FROM justincase_base_tariffs WHERE age = 35 AND gender = \'m\' AND term_years = 5;"'
    ], capture_output=True, text=True, check=True)
    
    logger.info(f"Результат загрузки: {result.stdout}")
    
    # Удаляем временные файлы
    import os
    os.remove('tariffs.csv')
    os.remove('frequency.csv')
    
    logger.info("ГОТОВО! Тарифы загружены на продакшн ВМ")

if __name__ == '__main__':
    export_and_upload_to_vm()
