#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Финальные команды для обновления
"""

def final_update_commands():
    """Генерируем финальные команды для обновления"""
    
    print("✅ === ДИРЕКТОРИЯ НАЙДЕНА ===")
    print("Путь: /home/admin/rgszh-miniapp/docker-compose.yml")
    print()
    
    print("🚀 === КОМАНДЫ ДЛЯ НЕМЕДЛЕННОГО ВЫПОЛНЕНИЯ ===")
    print("Скопируйте и выполните эти команды на сервере:")
    print()
    
    print("# Переходим в директорию проекта")
    print("cd /home/admin/rgszh-miniapp")
    print()
    
    print("# Проверяем структуру")
    print("ls -la")
    print()
    
    print("# Останавливаем только сервер")
    print("docker-compose stop server")
    print()
    
    print("# Загружаем новый образ сервера")
    print("docker-compose pull server")
    print()
    
    print("# Запускаем обновленный сервер")
    print("docker-compose up -d server")
    print()
    
    print("# Проверяем статус")
    print("docker-compose ps")
    print()
    
    print("# Проверяем логи сервера")
    print("docker-compose logs server --tail=20")
    print()
    
    print("🧪 === ТЕСТ ПОСЛЕ ОБНОВЛЕНИЯ ===")
    print("После выполнения команд проверьте эндпоинт:")
    print()
    print("curl -X POST https://176.108.243.189/api/justincase/recommend-sum \\")
    print("  -H 'Content-Type: application/json' \\")
    print("  -d '{\"birthDate\":\"1990-01-01\"}' \\")
    print("  -k")
    print()
    
    print("📊 === ОЖИДАЕМЫЕ РЕЗУЛЬТАТЫ ===")
    print("✅ УСПЕХ: HTTP 400 + JSON с ошибкой валидации (эндпоинт работает)")
    print("❌ НЕУДАЧА: HTTP 405 Method Not Allowed (старая версия)")
    print()
    
    print("🎯 === АЛЬТЕРНАТИВНЫЙ МЕТОД (если первый не сработает) ===")
    print("docker stop rgszh-miniapp-server-1")
    print("docker rm rgszh-miniapp-server-1") 
    print("docker pull zerotlt/rgszh-miniapp-server:latest")
    print("cd /home/admin/rgszh-miniapp && docker-compose up -d server")

if __name__ == "__main__":
    final_update_commands()
