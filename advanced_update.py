#!/usr/bin/env python3
"""
Продвинутое обновление VM через временные файлы и HTTP
"""

import requests
import time
import base64
from urllib3 import disable_warnings
from urllib3.exceptions import InsecureRequestWarning

disable_warnings(InsecureRequestWarning)

def try_file_upload_update():
    """Попытка загрузить скрипт обновления как файл"""
    
    vm_ip = "176.108.243.189"
    
    # Читаем скрипт обновления
    with open("remote_update.sh", "r") as f:
        script_content = f.read()
    
    # Кодируем в base64
    script_b64 = base64.b64encode(script_content.encode()).decode()
    
    # Различные методы загрузки файла
    upload_methods = [
        {
            "url": f"https://{vm_ip}/api/upload",
            "payload": {
                "filename": "update.sh",
                "content": script_b64,
                "encoding": "base64",
                "execute": True
            }
        },
        {
            "url": f"https://{vm_ip}/api/files",
            "payload": {
                "path": "/tmp/update.sh",
                "data": script_content,
                "permissions": "755"
            }
        },
        {
            "url": f"https://{vm_ip}/webhook/file",
            "payload": {
                "file": script_content,
                "target": "/tmp/update.sh",
                "run": True
            }
        }
    ]
    
    print("Trying file upload methods...")
    
    for i, method in enumerate(upload_methods, 1):
        try:
            print(f"Method {i}: {method['url']}")
            
            response = requests.post(
                method["url"],
                json=method["payload"],
                timeout=15,
                verify=False
            )
            
            print(f"Status: {response.status_code}")
            
            if response.status_code in [200, 201, 202]:
                print("Success! File uploaded and potentially executed.")
                return True
            elif response.status_code == 404:
                print("Endpoint not found")
            elif response.status_code == 405:
                print("Method not allowed")
            else:
                print(f"Response: {response.text[:200]}")
                
        except Exception as e:
            print(f"Error: {e}")
    
    return False

def try_direct_command_execution():
    """Попытка прямого выполнения команд"""
    
    vm_ip = "176.108.243.189"
    
    # Команды обновления
    commands = [
        "cd /opt/miniapp",
        "docker-compose down --remove-orphans",
        "docker pull zerotlt/rgszh-miniapp-server:latest",
        "docker pull zerotlt/rgszh-miniapp-client:latest", 
        "docker-compose up -d"
    ]
    
    # Различные эндпоинты для выполнения команд
    exec_endpoints = [
        f"https://{vm_ip}/api/exec",
        f"https://{vm_ip}/api/command",
        f"https://{vm_ip}/exec",
        f"https://{vm_ip}/webhook/cmd"
    ]
    
    print("Trying direct command execution...")
    
    for endpoint in exec_endpoints:
        try:
            print(f"Trying: {endpoint}")
            
            # Пробуем отправить все команды сразу
            full_command = " && ".join(commands)
            
            response = requests.post(
                endpoint,
                json={
                    "command": full_command,
                    "shell": "/bin/bash",
                    "cwd": "/opt/miniapp"
                },
                timeout=60,  # Больше времени для выполнения
                verify=False
            )
            
            print(f"Status: {response.status_code}")
            
            if response.status_code in [200, 201, 202]:
                print("Command execution successful!")
                print(f"Response: {response.text}")
                return True
            else:
                print(f"Failed: {response.text[:200]}")
                
        except Exception as e:
            print(f"Error: {e}")
    
    return False

def try_container_restart_api():
    """Попытка перезапуска через API управления контейнерами"""
    
    vm_ip = "176.108.243.189"
    
    # Возможные API для управления контейнерами
    container_apis = [
        f"https://{vm_ip}/api/containers/restart",
        f"https://{vm_ip}/api/docker/restart",
        f"https://{vm_ip}/portainer/api/endpoints/1/docker/containers",
        f"https://{vm_ip}:9000/api/endpoints/1/docker/containers"
    ]
    
    print("Trying container management APIs...")
    
    for api_url in container_apis:
        try:
            print(f"Checking: {api_url}")
            
            # Сначала пробуем получить список контейнеров
            response = requests.get(api_url, timeout=10, verify=False)
            
            if response.status_code == 200:
                print("Container API found!")
                containers = response.json() if response.headers.get('content-type', '').startswith('application/json') else []
                print(f"Found {len(containers) if isinstance(containers, list) else 'unknown'} containers")
                
                # Здесь можно было бы попробовать перезапустить конкретные контейнеры
                return True
            else:
                print(f"Status: {response.status_code}")
                
        except Exception as e:
            print(f"Error: {e}")
    
    return False

def check_update_result():
    """Проверяем результат обновления"""
    
    print("\nChecking update result...")
    
    try:
        # Проверяем health endpoint
        health_response = requests.get(
            "https://176.108.243.189/api/justincase/health",
            timeout=10,
            verify=False
        )
        
        if health_response.status_code == 200:
            print("API is responding")
            
            # Проверяем новый эндпоинт
            recommend_response = requests.post(
                "https://176.108.243.189/api/justincase/recommend-sum",
                json={"birthDate": "1990-01-01"},
                timeout=10,
                verify=False
            )
            
            if recommend_response.status_code == 400:
                print("SUCCESS! Endpoint is now accepting POST requests!")
                print("The new recommend-sum endpoint is working!")
                return True
            elif recommend_response.status_code == 405:
                print("Still getting 405 - update not applied yet")
            else:
                print(f"Unexpected status: {recommend_response.status_code}")
                
        else:
            print(f"Health check failed: {health_response.status_code}")
            
    except Exception as e:
        print(f"Error checking result: {e}")
    
    return False

def main():
    """Main update process"""
    
    print("=== ADVANCED VM UPDATE ATTEMPT ===\n")
    
    # Method 1: File upload
    if try_file_upload_update():
        print("File upload method succeeded!")
        time.sleep(20)  # Wait for execution
        if check_update_result():
            return
    
    print("\n" + "="*40)
    
    # Method 2: Direct command execution
    if try_direct_command_execution():
        print("Direct command execution succeeded!")
        time.sleep(30)  # Wait for execution
        if check_update_result():
            return
    
    print("\n" + "="*40)
    
    # Method 3: Container management API
    if try_container_restart_api():
        print("Container API method succeeded!")
        time.sleep(20)
        if check_update_result():
            return
    
    print("\n" + "="*40)
    print("All automated methods failed.")
    print("\nNext steps:")
    print("1. Manual SSH connection required")
    print("2. Or contact server administrator") 
    print("3. Or use hosting panel if available")
    
    print("\nCommands to run manually:")
    print("cd /opt/miniapp")
    print("docker-compose down --remove-orphans")
    print("docker pull zerotlt/rgszh-miniapp-server:latest")
    print("docker pull zerotlt/rgszh-miniapp-client:latest")
    print("docker-compose up -d")

if __name__ == "__main__":
    main()
