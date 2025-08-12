#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Принудительное обновление через HTTP webhook
"""

import requests
import time

def trigger_vm_update():
    """Пытаемся обновить VM через различные способы"""
    
    vm_ip = "176.108.243.189"
    
    # Сначала проверим текущую версию
    print("🔍 Проверяем текущую версию API...")
    try:
        response = requests.get(f"https://{vm_ip}/api/justincase/health", 
                              timeout=10, verify=False)
        if response.status_code == 200:
            print("✅ API доступен, проверяем версию...")
            print(f"📊 Ответ health: {response.json()}")
        else:
            print(f"⚠️ Health check вернул {response.status_code}")
    except Exception as e:
        print(f"❌ Ошибка health check: {e}")
    
    # Попробуем отправить POST на новый эндпоинт для проверки
    print("\n🧪 Тестируем наличие нового эндпоинта...")
    try:
        response = requests.post(f"https://{vm_ip}/api/justincase/recommend-sum",
                               json={"test": "data"},
                               timeout=10, verify=False)
        print(f"📊 Статус: {response.status_code}")
        if response.status_code == 405:
            print("⚠️ Эндпоинт существует но не поддерживает POST - старая версия")
        elif response.status_code == 400:
            print("✅ Эндпоинт поддерживает POST - новая версия установлена!")
        else:
            print(f"🤔 Неожиданный статус: {response.status_code}")
            print(f"📝 Ответ: {response.text}")
    except Exception as e:
        print(f"❌ Ошибка тестирования эндпоинта: {e}")
    
    # Информация о том, что нужно сделать
    print("\n📋 ИНСТРУКЦИЯ ДЛЯ РУЧНОГО ОБНОВЛЕНИЯ:")
    print("1. Подключитесь к VM по SSH")
    print("2. Выполните команды:")
    print(f"   cd /opt/miniapp")
    print(f"   docker-compose down")
    print(f"   docker pull zerotlt/rgszh-miniapp-server:latest")
    print(f"   docker pull zerotlt/rgszh-miniapp-client:latest")
    print(f"   docker-compose up -d")
    print("3. Проверьте логи: docker-compose logs server --tail=20")

if __name__ == "__main__":
    trigger_vm_update()
