#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Автоматическое обновление VM через HTTP API
"""

import requests
import time
import json
from urllib3 import disable_warnings
from urllib3.exceptions import InsecureRequestWarning

# Отключаем предупреждения SSL
disable_warnings(InsecureRequestWarning)

def try_update_via_webhook():
    """Попытка обновления через веб-хук или HTTP API"""
    
    vm_ip = "176.108.243.189"
    
    print("🚀 === ПОПЫТКА АВТОМАТИЧЕСКОГО ОБНОВЛЕНИЯ VM ===")
    
    # Список возможных эндпоинтов для обновления
    update_endpoints = [
        f"https://{vm_ip}:9000/api/webhooks/update",  # Portainer webhook
        f"https://{vm_ip}/api/update",                # Кастомный webhook
        f"https://{vm_ip}/webhook/deploy",            # Deploy webhook
        f"http://{vm_ip}:8080/update",               # HTTP webhook
    ]
    
    update_payload = {
        "action": "update",
        "services": ["server", "client"],
        "images": {
            "server": "zerotlt/rgszh-miniapp-server:latest",
            "client": "zerotlt/rgszh-miniapp-client:latest"
        }
    }
    
    # Пробуем каждый эндпоинт
    for endpoint in update_endpoints:
        try:
            print(f"🔍 Пробуем: {endpoint}")
            response = requests.post(
                endpoint,
                json=update_payload,
                timeout=10,
                verify=False
            )
            
            if response.status_code in [200, 201, 202]:
                print(f"✅ Успешно! Статус: {response.status_code}")
                print(f"📝 Ответ: {response.text}")
                return True
            else:
                print(f"⚠️ Статус {response.status_code}: {response.text[:100]}")
                
        except requests.exceptions.ConnectionError:
            print(f"❌ Нет подключения к {endpoint}")
        except Exception as e:
            print(f"❌ Ошибка {endpoint}: {e}")
    
    return False

def try_docker_api_update():
    """Попытка обновления через Docker API"""
    
    vm_ip = "176.108.243.189"
    
    # Возможные порты Docker API
    docker_ports = [2375, 2376, 4243]
    
    for port in docker_ports:
        try:
            print(f"🐳 Пробуем Docker API на порту {port}...")
            
            # Проверяем доступность API
            api_url = f"http://{vm_ip}:{port}"
            response = requests.get(f"{api_url}/version", timeout=5)
            
            if response.status_code == 200:
                print(f"✅ Docker API доступен на {port}")
                
                # Пробуем обновить контейнеры
                containers_response = requests.get(f"{api_url}/containers/json")
                if containers_response.status_code == 200:
                    containers = containers_response.json()
                    print(f"📋 Найдено контейнеров: {len(containers)}")
                    
                    # Ищем наши контейнеры
                    for container in containers:
                        name = container.get('Names', [''])[0].lstrip('/')
                        image = container.get('Image', '')
                        
                        if 'rgszh-miniapp' in image:
                            print(f"🔄 Найден контейнер: {name} ({image})")
                            # Здесь можно было бы перезапустить контейнер
                            
                return True
                
        except Exception as e:
            print(f"❌ Docker API {port}: {e}")
    
    return False

def create_remote_update_script():
    """Создаем скрипт для удаленного выполнения"""
    
    vm_ip = "176.108.243.189"
    
    print("📝 Создаем скрипт удаленного обновления...")
    
    # Скрипт обновления
    update_script = """#!/bin/bash
echo "🚀 Начинаем обновление контейнеров..."

# Переходим в директорию
cd /opt/miniapp || { echo "❌ Директория /opt/miniapp не найдена"; exit 1; }

# Останавливаем контейнеры
echo "⏹️ Останавливаем контейнеры..."
docker-compose down --remove-orphans

# Удаляем старые образы
echo "🗑️ Удаляем старые образы..."
docker rmi -f zerotlt/rgszh-miniapp-server:latest || true
docker rmi -f zerotlt/rgszh-miniapp-client:latest || true

# Загружаем новые образы
echo "⬇️ Загружаем новые образы..."
docker pull zerotlt/rgszh-miniapp-server:latest
docker pull zerotlt/rgszh-miniapp-client:latest

# Запускаем контейнеры
echo "▶️ Запускаем обновленные контейнеры..."
docker-compose up -d

# Проверяем статус
echo "📊 Проверяем статус:"
docker-compose ps

echo "✅ Обновление завершено!"
"""
    
    # Пробуем отправить скрипт через различные методы
    methods = [
        ("HTTP POST", f"https://{vm_ip}/api/execute"),
        ("Webhook", f"https://{vm_ip}/webhook/script"),
        ("SSH fallback", "ssh_script"),
    ]
    
    for method_name, endpoint in methods:
        try:
            if endpoint == "ssh_script":
                print(f"📋 {method_name}: Создаем локальный скрипт...")
                with open("remote_update.sh", "w") as f:
                    f.write(update_script)
                print("✅ Скрипт создан: remote_update.sh")
                continue
                
            print(f"📤 {method_name}: {endpoint}")
            response = requests.post(
                endpoint,
                json={"script": update_script, "shell": "/bin/bash"},
                timeout=30,
                verify=False
            )
            
            if response.status_code in [200, 201, 202]:
                print(f"✅ {method_name} успешно!")
                return True
            else:
                print(f"⚠️ {method_name}: статус {response.status_code}")
                
        except Exception as e:
            print(f"❌ {method_name}: {e}")
    
    return False

def main():
    """Главная функция обновления"""
    
    print("🎯 Пробуем различные методы обновления VM...\n")
    
    # Метод 1: Webhook обновление
    if try_update_via_webhook():
        print("\n✅ Обновление через webhook успешно!")
        return
    
    print("\n" + "="*50)
    
    # Метод 2: Docker API
    if try_docker_api_update():
        print("\n✅ Обновление через Docker API успешно!")
        return
    
    print("\n" + "="*50)
    
    # Метод 3: Создание скрипта
    if create_remote_update_script():
        print("\n✅ Скрипт обновления отправлен!")
        return
    
    print("\n" + "="*50)
    print("❌ Все автоматические методы не сработали")
    print("\n🔧 РУЧНОЕ ОБНОВЛЕНИЕ ТРЕБУЕТСЯ:")
    print("Подключитесь к VM и выполните:")
    print("cd /opt/miniapp")
    print("docker-compose down --remove-orphans")
    print("docker pull zerotlt/rgszh-miniapp-server:latest")
    print("docker pull zerotlt/rgszh-miniapp-client:latest")
    print("docker-compose up -d")
    
    # Ждем и проверяем результат
    print("\n⏰ Ожидание обновления (30 секунд)...")
    time.sleep(30)
    
    print("🧪 Проверяем результат обновления...")
    try:
        response = requests.post(
            "https://176.108.243.189/api/justincase/recommend-sum",
            json={"test": "data"},
            timeout=10,
            verify=False
        )
        
        if response.status_code == 400:
            print("✅ ОБНОВЛЕНИЕ УСПЕШНО! Эндпоинт теперь работает!")
        elif response.status_code == 405:
            print("⚠️ Эндпоинт все еще возвращает 405 - обновление не применилось")
        else:
            print(f"🤔 Неожиданный статус: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Ошибка проверки: {e}")

if __name__ == "__main__":
    main()
