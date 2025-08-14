#!/usr/bin/env python3
"""
Скрипт для загрузки тарифов на ВМ через Docker
"""

import subprocess
import sys
import json

def run_command(cmd, description):
    """Выполняет команду и возвращает результат"""
    print(f"🔄 {description}...")
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, check=True)
        print(f"✅ {description} - успешно")
        return result.stdout
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} - ошибка:")
        print(f"   Stdout: {e.stdout}")
        print(f"   Stderr: {e.stderr}")
        return None

def load_tariffs_to_vm():
    """Загружает тарифы на ВМ"""
    vm_ip = "176.108.243.189"
    
    print("🚀 ЗАГРУЗКА ТАРИФОВ НА ВМ")
    print("=" * 50)
    
    # 1. Копируем базу данных в контейнер
    print(f"📤 Копируем локальную базу miniapp.db на ВМ {vm_ip}...")
    
    commands = [
        # Копируем локальную базу данных на ВМ
        f'scp miniapp.db root@{vm_ip}:/root/miniapp.db',
        
        # Копируем базу в контейнер сервера
        f'ssh root@{vm_ip} "docker cp /root/miniapp.db rgszh-miniapp-server-1:/app/miniapp.db"',
        
        # Перезапускаем сервер для применения изменений
        f'ssh root@{vm_ip} "cd /root && docker-compose restart server"',
        
        # Проверяем статус
        f'ssh root@{vm_ip} "docker ps --filter name=rgszh-miniapp-server"'
    ]
    
    for cmd in commands:
        result = run_command(cmd, f"Выполнение: {cmd}")
        if result is None:
            print("❌ Ошибка при выполнении команды")
            return False
    
    print("\n✅ Загрузка тарифов завершена!")
    return True

def test_vm_api():
    """Тестирует API на ВМ после загрузки тарифов"""
    print("\n🧪 ТЕСТИРОВАНИЕ API НА ВМ")
    print("=" * 50)
    
    test_cmd = '''
    curl -k -X POST "https://176.108.243.189/api/proxy/calculator/save" \
    -H "Content-Type: application/json" \
    -d '{
        "age": 35,
        "gender": "Мужской", 
        "insuranceTerm": 5,
        "insuranceSum": 1000000,
        "includeAccidentInsurance": "да",
        "criticalIllnessOption": "Лечение за рубежом",
        "insuranceFrequency": "Ежегодно",
        "email": "test@rgsl.ru"
    }'
    '''
    
    result = run_command(test_cmd, "Тестирование API с корпоративными коэффициентами")
    if result:
        print("📊 Результат тестирования:")
        print(result)

if __name__ == "__main__":
    print("🎯 ЗАГРУЗКА ТАРИФОВ НА ВМ ДЛЯ КОРПОРАТИВНЫХ КОЭФФИЦИЕНТОВ")
    print("=" * 70)
    
    if load_tariffs_to_vm():
        test_vm_api()
    
    print("\n" + "=" * 70)
    print("🎉 Процесс завершен!")
