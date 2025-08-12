#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Генерация команд для обновления найденных контейнеров
"""

def generate_update_commands():
    """Генерируем команды для обновления на основе найденных контейнеров"""
    
    print("🔍 === АНАЛИЗ КОНТЕЙНЕРОВ ===")
    print("Найдены контейнеры:")
    print("- rgszh-miniapp-server-1 (zerotlt/rgszh-miniapp-server:latest) - 39 мин назад")
    print("- rgszh-miniapp-frontend-1 (zerotlt/rgszh-miniapp-client:latest) - 32 мин назад")
    print("- rgszh-miniapp-proxy-1 (nginx)")
    print("- rgszh-miniapp-postgres-1 (postgres)")
    print("- rgszh-miniapp-redis-1 (redis)")
    print()
    
    print("📋 === КОМАНДЫ ДЛЯ ВЫПОЛНЕНИЯ ===")
    print("Выполните эти команды на сервере:")
    print()
    
    print("1. Найти директорию с docker-compose.yml:")
    print("   docker inspect rgszh-miniapp-server-1 | grep -i workingdir")
    print("   OR")
    print("   find /home /root /srv /var -name 'docker-compose.yml' 2>/dev/null | head -5")
    print()
    
    print("2. После нахождения директории (например, если это /home/admin/):")
    print("   cd [найденная_директория]")
    print("   ls -la  # проверить наличие docker-compose.yml")
    print()
    
    print("3. Обновить только сервер контейнер (самый важный):")
    print("   docker-compose pull server")
    print("   docker-compose up -d --no-deps server")
    print()
    
    print("4. Альтернативно - полное обновление:")
    print("   docker-compose down")
    print("   docker-compose pull")
    print("   docker-compose up -d")
    print()
    
    print("5. Быстрое принудительное обновление сервера:")
    print("   docker stop rgszh-miniapp-server-1")
    print("   docker rm rgszh-miniapp-server-1")
    print("   docker pull zerotlt/rgszh-miniapp-server:latest")
    print("   # Затем перезапустить через docker-compose up -d")
    print()
    
    print("🎯 === ОЖИДАЕМЫЙ РЕЗУЛЬТАТ ===")
    print("После обновления эндпоинт /api/justincase/recommend-sum")
    print("должен принимать POST запросы вместо возврата 405 ошибки")
    print()
    
    print("🧪 === ТЕСТ ПОСЛЕ ОБНОВЛЕНИЯ ===")
    print("Запустите тест: python test_recommend_endpoint.py")
    print("Или проверьте вручную:")
    print("curl -X POST https://176.108.243.189/api/justincase/recommend-sum \\")
    print("  -H 'Content-Type: application/json' \\")
    print("  -d '{\"birthDate\":\"1990-01-01\"}' \\")
    print("  -k")

if __name__ == "__main__":
    generate_update_commands()
