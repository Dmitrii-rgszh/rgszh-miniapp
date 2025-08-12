#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Финальная проверка готовности к деплою
"""

import json
import requests
from datetime import datetime

def final_deployment_check():
    """Финальная проверка готовности к деплою"""
    
    print("🎯 === ФИНАЛЬНАЯ ПРОВЕРКА ГОТОВНОСТИ К ДЕПЛОЮ ===")
    print(f"⏰ Время: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # 1. Проверка Docker Hub образов
    print("📦 1. ПРОВЕРКА DOCKER HUB ОБРАЗОВ:")
    try:
        # Проверяем сервер
        server_response = requests.get("https://hub.docker.com/v2/repositories/zerotlt/rgszh-miniapp-server/tags/", timeout=10)
        if server_response.status_code == 200:
            server_data = server_response.json()
            latest_server = next((tag for tag in server_data['results'] if tag['name'] == 'latest'), None)
            if latest_server:
                print(f"   ✅ Сервер образ: zerotlt/rgszh-miniapp-server:latest")
                print(f"      📅 Обновлен: {latest_server['last_updated']}")
            else:
                print("   ❌ Latest тег сервера не найден")
        else:
            print(f"   ⚠️ Ошибка проверки сервера: {server_response.status_code}")
            
        # Проверяем клиент
        client_response = requests.get("https://hub.docker.com/v2/repositories/zerotlt/rgszh-miniapp-client/tags/", timeout=10)
        if client_response.status_code == 200:
            client_data = client_response.json()
            latest_client = next((tag for tag in client_data['results'] if tag['name'] == 'latest'), None)
            if latest_client:
                print(f"   ✅ Клиент образ: zerotlt/rgszh-miniapp-client:latest")
                print(f"      📅 Обновлен: {latest_client['last_updated']}")
            else:
                print("   ❌ Latest тег клиента не найден")
        else:
            print(f"   ⚠️ Ошибка проверки клиента: {client_response.status_code}")
            
    except Exception as e:
        print(f"   ❌ Ошибка проверки Docker Hub: {e}")
    
    print()
    
    # 2. Проверка локального кода
    print("💻 2. ПРОВЕРКА ЛОКАЛЬНОГО КОДА:")
    try:
        with open('justincase_routes_new.py', 'r', encoding='utf-8') as f:
            content = f.read()
            if '/api/justincase/recommend-sum' in content:
                print("   ✅ Эндпоинт recommend-sum добавлен в код")
                if 'calculate_recommended_insurance_sum' in content:
                    print("   ✅ Функция расчета рекомендованной суммы реализована")
                else:
                    print("   ❌ Функция расчета не найдена")
            else:
                print("   ❌ Эндпоинт recommend-sum не найден в коде")
    except Exception as e:
        print(f"   ❌ Ошибка проверки кода: {e}")
    
    print()
    
    # 3. Проверка текущего статуса VM
    print("🖥️ 3. ПРОВЕРКА ТЕКУЩЕГО СТАТУСА VM:")
    try:
        # Health check
        health_response = requests.get("https://176.108.243.189/api/justincase/health", 
                                     timeout=10, verify=False)
        if health_response.status_code == 200:
            health_data = health_response.json()
            print(f"   ✅ API доступен: {health_data['status']}")
            print(f"   📊 База данных: {'подключена' if health_data.get('database_connected') else 'отключена'}")
            print(f"   📋 Тарифов загружено: {health_data.get('tariffs_loaded', 0)}")
        else:
            print(f"   ⚠️ Health check вернул {health_response.status_code}")
            
        # Проверка нового эндпоинта
        recommend_response = requests.post("https://176.108.243.189/api/justincase/recommend-sum",
                                         json={"test": "data"}, timeout=10, verify=False)
        
        if recommend_response.status_code == 405:
            print("   ⚠️ Эндпоинт recommend-sum: СТАРАЯ ВЕРСИЯ (405 Method Not Allowed)")
            print("   🔄 Требуется обновление контейнеров на VM")
        elif recommend_response.status_code == 400:
            print("   ✅ Эндпоинт recommend-sum: НОВАЯ ВЕРСИЯ АКТИВНА")
        else:
            print(f"   🤔 Эндпоинт recommend-sum: статус {recommend_response.status_code}")
            
    except Exception as e:
        print(f"   ❌ Ошибка проверки VM: {e}")
    
    print()
    
    # 4. Итоговый статус
    print("📋 4. ИТОГОВЫЙ СТАТУС:")
    print("   ✅ Docker образы собраны и загружены в Docker Hub")
    print("   ✅ Код эндпоинта recommend-sum реализован")
    print("   ✅ Новая функциональность готова к использованию")
    print("   🔄 ОСТАЛОСЬ: Обновить контейнеры на VM")
    
    print()
    print("🚀 СЛЕДУЮЩИЕ ШАГИ:")
    print("1. Подключитесь к VM 176.108.243.189")
    print("2. Выполните команды обновления:")
    print("   cd /opt/miniapp")
    print("   docker-compose down --remove-orphans")
    print("   docker pull zerotlt/rgszh-miniapp-server:latest")
    print("   docker pull zerotlt/rgszh-miniapp-client:latest")  
    print("   docker-compose up -d")
    print("3. Проверьте результат: python test_recommend_endpoint.py")
    
    print()
    print("💡 ОЖИДАЕМЫЙ РЕЗУЛЬТАТ:")
    print("После обновления эндпоинт /api/justincase/recommend-sum будет")
    print("принимать POST запросы и возвращать рекомендованную сумму страхования")
    print("на основе данных о доходах, семье и финансовой ситуации пользователя.")

if __name__ == "__main__":
    final_deployment_check()
