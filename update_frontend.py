#!/usr/bin/env python3
"""
Скрипт для обновления фронтенда на продакшен сервере
"""

import requests
import base64
import os
import json

# Конфигурация
SERVER_URL = "https://176.108.243.189"
SERVER_API = f"{SERVER_URL}/api"

def update_frontend_files():
    """Попытка обновить файлы фронтенда"""
    
    files_to_update = [
        {
            'path': 'src/Styles/BackButton.css',
            'content': open('src/Styles/BackButton.css', 'r', encoding='utf-8').read()
        },
        {
            'path': 'src/CareFuturePage.js', 
            'content': open('src/CareFuturePage.js', 'r', encoding='utf-8').read()
        }
    ]
    
    # Попробуем отправить файлы через API
    for file_info in files_to_update:
        try:
            # Кодируем содержимое в base64
            content_b64 = base64.b64encode(file_info['content'].encode('utf-8')).decode('utf-8')
            
            payload = {
                'action': 'update_file',
                'path': file_info['path'],
                'content': content_b64
            }
            
            print(f"Обновляем {file_info['path']}...")
            
            # Попробуем разные endpoints
            endpoints = [
                f"{SERVER_API}/update",
                f"{SERVER_API}/deploy", 
                f"{SERVER_API}/webhook",
                f"{SERVER_API}/frontend/update"
            ]
            
            for endpoint in endpoints:
                try:
                    response = requests.post(
                        endpoint,
                        json=payload,
                        verify=False,
                        timeout=30
                    )
                    if response.status_code in [200, 201, 202]:
                        print(f"✅ Файл {file_info['path']} обновлен через {endpoint}")
                        break
                except requests.exceptions.RequestException as e:
                    continue
                    
        except Exception as e:
            print(f"❌ Ошибка обновления {file_info['path']}: {e}")

def rebuild_frontend():
    """Попытка перезапустить сборку фронтенда"""
    try:
        endpoints = [
            f"{SERVER_API}/rebuild",
            f"{SERVER_API}/frontend/rebuild",
            f"{SERVER_API}/deploy/rebuild"
        ]
        
        for endpoint in endpoints:
            try:
                response = requests.post(endpoint, verify=False, timeout=60)
                if response.status_code in [200, 201, 202]:
                    print(f"✅ Перезапуск сборки через {endpoint}")
                    return True
            except requests.exceptions.RequestException:
                continue
                
        return False
    except Exception as e:
        print(f"❌ Ошибка перезапуска: {e}")
        return False

if __name__ == "__main__":
    print("🔄 Начинаем обновление фронтенда...")
    
    # Попытка 1: Обновление файлов
    update_frontend_files()
    
    # Попытка 2: Перезапуск сборки
    rebuild_frontend()
    
    print("✅ Процесс обновления завершен")
    print(f"🌐 Проверьте изменения на {SERVER_URL}")
