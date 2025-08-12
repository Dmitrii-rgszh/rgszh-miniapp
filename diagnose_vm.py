#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Диагностика размещения приложения на VM
"""

import requests
from urllib3 import disable_warnings
from urllib3.exceptions import InsecureRequestWarning

disable_warnings(InsecureRequestWarning)

def diagnose_vm_deployment():
    """Диагностируем, где размещено приложение на VM"""
    
    vm_ip = "176.108.243.189"
    
    print("🔍 === ДИАГНОСТИКА РАЗМЕЩЕНИЯ ПРИЛОЖЕНИЯ ===")
    print(f"🖥️ VM: {vm_ip}")
    print()
    
    # Проверяем API
    try:
        health_response = requests.get(f"https://{vm_ip}/api/justincase/health", 
                                     timeout=10, verify=False)
        if health_response.status_code == 200:
            print("✅ API работает")
            health_data = health_response.json()
            print(f"📊 Статус: {health_data.get('status')}")
            print(f"📋 БД: {health_data.get('database_connected')}")
            print(f"🗃️ Тарифов: {health_data.get('tariffs_loaded')}")
        else:
            print(f"⚠️ Health check: {health_response.status_code}")
    except Exception as e:
        print(f"❌ Ошибка API: {e}")
    
    print()
    print("📋 ИНСТРУКЦИИ ДЛЯ ПОИСКА ПРИЛОЖЕНИЯ:")
    print("Выполните эти команды на сервере для поиска:")
    print()
    print("1. Найти запущенные Docker контейнеры:")
    print("   docker ps")
    print()
    print("2. Найти все Docker Compose файлы:")
    print("   find / -name 'docker-compose.yml' -type f 2>/dev/null")
    print()
    print("3. Найти директории с приложением:")
    print("   find / -name '*miniapp*' -type d 2>/dev/null")
    print("   find / -name '*rgszh*' -type d 2>/dev/null")
    print()
    print("4. Проверить стандартные директории:")
    print("   ls -la /home/")
    print("   ls -la /root/")
    print("   ls -la /var/www/")
    print("   ls -la /srv/")
    print()
    print("5. Найти образы Docker:")
    print("   docker images | grep miniapp")
    print("   docker images | grep rgszh")
    print()
    print("📌 ОЖИДАЕМЫЕ РЕЗУЛЬТАТЫ:")
    print("- Должны быть контейнеры zerotlt/rgszh-miniapp-server и zerotlt/rgszh-miniapp-client")
    print("- docker-compose.yml файл в рабочей директории")
    print("- Возможные директории: /home/admin/miniapp, /root/miniapp, /srv/miniapp")
    print()
    print("🔧 ПОСЛЕ ОБНАРУЖЕНИЯ ДИРЕКТОРИИ:")
    print("cd [найденная_директория]")
    print("docker-compose down --remove-orphans")
    print("docker pull zerotlt/rgszh-miniapp-server:latest")
    print("docker pull zerotlt/rgszh-miniapp-client:latest")
    print("docker-compose up -d")

if __name__ == "__main__":
    diagnose_vm_deployment()
