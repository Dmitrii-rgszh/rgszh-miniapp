# deploy.ps1 - ПОЛНОСТЬЮ ИСПРАВЛЕННЫЙ PowerShell скрипт для деплоя RGSZH MiniApp

param(
    [switch]$SkipBuild,
    [switch]$SkipCopy,
    [switch]$SkipDeploy,
    [switch]$Verbose
)

# Настройки
$VM_USER = "admin"
$VM_HOST = "176.109.110.217"
$DOCKER_REGISTRY = "zerotlt"
$PROJECT_NAME = "rgszh-miniapp"
$SOCKET_URL = "https://rgszh-miniapp.org"

# Генерируем уникальный тег на основе времени для принудительного обновления
$DEPLOY_TAG = (Get-Date -Format "yyyyMMdd-HHmmss")

# Цвета для вывода
$Colors = @{
    Red = "Red"
    Green = "Green"
    Yellow = "Yellow"
    Blue = "Cyan"
    Gray = "Gray"
}

# Функции логирования
function Write-Log {
    param([string]$Message, [string]$Color = "White")
    $timestamp = Get-Date -Format "HH:mm:ss"
    Write-Host "[$timestamp] $Message" -ForegroundColor $Color
}

function Write-Success {
    param([string]$Message)
    Write-Log "✅ $Message" -Color $Colors.Green
}

function Write-Error {
    param([string]$Message)
    Write-Log "❌ $Message" -Color $Colors.Red
}

function Write-Warning {
    param([string]$Message)
    Write-Log "⚠️ $Message" -Color $Colors.Yellow
}

function Write-Info {
    param([string]$Message)
    Write-Log "ℹ️ $Message" -Color $Colors.Blue
}

# Проверка зависимостей
function Test-Dependencies {
    Write-Log "🔍 Проверка зависимостей..."
    
    $dependencies = @("docker", "scp", "ssh")
    $missing = @()
    
    foreach ($dep in $dependencies) {
        if (-not (Get-Command $dep -ErrorAction SilentlyContinue)) {
            $missing += $dep
        }
    }
    
    if ($missing.Count -gt 0) {
        Write-Error "Отсутствуют зависимости: $($missing -join ', ')"
        Write-Info "Установите Docker Desktop и Git Bash (или WSL) для scp/ssh"
        exit 1
    }
    
    Write-Success "Все зависимости установлены"
}

# Сборка и отправка образов с уникальными тегами
function Build-And-Push-Images {
    if ($SkipBuild) {
        Write-Warning "Пропуск сборки образов (параметр -SkipBuild)"
        return
    }
    
    Write-Log "🐳 Сборка и отправка Docker образов (тег: $DEPLOY_TAG)..."
    
    try {
        # Очистка локального кэша
        Write-Log "🧹 Очистка Docker кэша..."
        $cmd = "docker system prune -f"
        if ($Verbose) { Write-Info "Выполняем: $cmd" }
        Invoke-Expression $cmd
        
        # Сборка серверного образа с уникальным тегом
        Write-Log "📦 Сборка серверного образа..."
        $cmd = "docker build --no-cache -f Dockerfile.server -t ${DOCKER_REGISTRY}/${PROJECT_NAME}-api:$DEPLOY_TAG -t ${DOCKER_REGISTRY}/${PROJECT_NAME}-api:latest ."
        
        if ($Verbose) { Write-Info "Выполняем: $cmd" }
        Invoke-Expression $cmd
        
        if ($LASTEXITCODE -ne 0) {
            throw "Ошибка сборки серверного образа"
        }
        
        Write-Log "📤 Отправка серверного образа..."
        $cmd = "docker push ${DOCKER_REGISTRY}/${PROJECT_NAME}-api:$DEPLOY_TAG"
        if ($Verbose) { Write-Info "Выполняем: $cmd" }
        Invoke-Expression $cmd
        
        $cmd = "docker push ${DOCKER_REGISTRY}/${PROJECT_NAME}-api:latest"
        if ($Verbose) { Write-Info "Выполняем: $cmd" }
        Invoke-Expression $cmd
        
        if ($LASTEXITCODE -ne 0) {
            throw "Ошибка отправки серверного образа"
        }
        
        Write-Success "Серверный образ собран и отправлен (тег: $DEPLOY_TAG)"
        
        # Сборка клиентского образа с уникальным тегом (ИСПРАВЛЕНА ОШИБКА В SOCKET_URL)
        Write-Log "📦 Сборка клиентского образа..."
        $cmd = "docker build --no-cache -f Dockerfile.client --build-arg REACT_APP_SOCKET_URL=`"$SOCKET_URL`" -t ${DOCKER_REGISTRY}/${PROJECT_NAME}:$DEPLOY_TAG -t ${DOCKER_REGISTRY}/${PROJECT_NAME}:latest ."
        
        if ($Verbose) { Write-Info "Выполняем: $cmd" }
        Invoke-Expression $cmd
        
        if ($LASTEXITCODE -ne 0) {
            throw "Ошибка сборки клиентского образа"
        }
        
        Write-Log "📤 Отправка клиентского образа..."
        $cmd = "docker push ${DOCKER_REGISTRY}/${PROJECT_NAME}:$DEPLOY_TAG"
        if ($Verbose) { Write-Info "Выполняем: $cmd" }
        Invoke-Expression $cmd
        
        $cmd = "docker push ${DOCKER_REGISTRY}/${PROJECT_NAME}:latest"
        if ($Verbose) { Write-Info "Выполняем: $cmd" }
        Invoke-Expression $cmd
        
        if ($LASTEXITCODE -ne 0) {
            throw "Ошибка отправки клиентского образа"
        }
        
        Write-Success "Клиентский образ собран и отправлен (тег: $DEPLOY_TAG)"
        
    } catch {
        Write-Error "Ошибка при сборке/отправке образов: $_"
        exit 1
    }
}

# Копирование файлов на ВМ
function Copy-Files-To-VM {
    if ($SkipCopy) {
        Write-Warning "Пропуск копирования файлов (параметр -SkipCopy)"
        return
    }
    
    Write-Log "📁 Копирование файлов на ВМ..."
    
    $files = @(
        "docker-compose.yml",
        "Dockerfile.client", 
        "Dockerfile.server",
        ".env"
    )
    
    try {
        # Создаем папку если не существует
        $cmd = "ssh ${VM_USER}@${VM_HOST} 'mkdir -p /home/${VM_USER}/${PROJECT_NAME}'"
        if ($Verbose) { Write-Info "Выполняем: $cmd" }
        Invoke-Expression $cmd
        
        foreach ($file in $files) {
            if (Test-Path $file) {
                Write-Log "📋 Копируем $file..."
                $cmd = "scp $file ${VM_USER}@${VM_HOST}:/home/${VM_USER}/${PROJECT_NAME}/"
                
                if ($Verbose) { Write-Info "Выполняем: $cmd" }
                Invoke-Expression $cmd
                
                if ($LASTEXITCODE -ne 0) {
                    throw "Ошибка копирования $file"
                }
            } else {
                Write-Warning "Файл $file не найден, пропускаем"
            }
        }
        
        Write-Success "Все файлы скопированы на ВМ"
        
    } catch {
        Write-Error "Ошибка при копировании файлов: $_"
        exit 1
    }
}

# Деплой на ВМ с исправленными командами
function Deploy-To-VM {
    if ($SkipDeploy) {
        Write-Warning "Пропуск деплоя на ВМ (параметр -SkipDeploy)"
        return
    }
    
    Write-Log "🚀 Деплой на виртуальную машину (тег: $DEPLOY_TAG)..."
    
    # Создаем временный файл скрипта с правильными переводами строк
    $tempScript = New-TemporaryFile
    $scriptContent = @"
#!/bin/bash
set -e
cd /home/${VM_USER}/${PROJECT_NAME}

echo "🛑 Остановка контейнеров..."
docker compose down || echo "Контейнеры уже остановлены"

echo "🗑️ Принудительное удаление всех связанных образов..."
docker image rm ${DOCKER_REGISTRY}/${PROJECT_NAME}-api:latest || true
docker image rm ${DOCKER_REGISTRY}/${PROJECT_NAME}:latest || true
docker image rm ${DOCKER_REGISTRY}/${PROJECT_NAME}-api:$DEPLOY_TAG || true
docker image rm ${DOCKER_REGISTRY}/${PROJECT_NAME}:$DEPLOY_TAG || true

echo "🧹 Очистка Docker кэша..."
docker system prune -f

echo "📥 Принудительное получение новых образов..."
docker pull ${DOCKER_REGISTRY}/${PROJECT_NAME}-api:latest
docker pull ${DOCKER_REGISTRY}/${PROJECT_NAME}:latest

echo "🚀 Запуск контейнеров с обновленными образами..."
docker compose up -d --force-recreate

echo "⏳ Ожидание запуска контейнеров..."
sleep 10

echo "📊 Проверка статуса контейнеров..."
docker compose ps

echo "📋 Показ логов последних 20 строк..."
docker compose logs --tail=20

echo "🎉 Деплой завершен! Тег образов: $DEPLOY_TAG"
"@
    
    # Записываем скрипт с Unix переводами строк
    [System.IO.File]::WriteAllText($tempScript.FullName, $scriptContent, [System.Text.Encoding]::UTF8)
    
    try {
        Write-Log "🔗 Подключение к ВМ и выполнение деплоя..."
        
        # Копируем скрипт на ВМ
        $cmd = "scp $($tempScript.FullName) ${VM_USER}@${VM_HOST}:/tmp/deploy_script.sh"
        if ($Verbose) { Write-Info "Копируем скрипт на ВМ: $cmd" }
        Invoke-Expression $cmd
        
        # Выполняем скрипт на ВМ
        $cmd = "ssh ${VM_USER}@${VM_HOST} 'chmod +x /tmp/deploy_script.sh && /tmp/deploy_script.sh'"
        if ($Verbose) { Write-Info "Выполняем скрипт на ВМ: $cmd" }
        Invoke-Expression $cmd
        
        if ($LASTEXITCODE -ne 0) {
            throw "Ошибка выполнения команд на ВМ"
        }
        
        # Удаляем временный скрипт с ВМ
        $cmd = "ssh ${VM_USER}@${VM_HOST} 'rm -f /tmp/deploy_script.sh'"
        Invoke-Expression $cmd
        
        Write-Success "Деплой на ВМ завершен успешно"
        
    } catch {
        Write-Error "Ошибка при деплое на ВМ: $_"
        Write-Info "Проверьте статус контейнеров: ssh $VM_USER@$VM_HOST 'cd $PROJECT_NAME && docker compose ps && docker compose logs --tail=50'"
        exit 1
    } finally {
        # Удаляем временный файл
        Remove-Item $tempScript.FullName -ErrorAction SilentlyContinue
    }
}

# Улучшенная проверка работоспособности
function Test-Deployment {
    Write-Log "🏥 Проверка работоспособности..."
    
    try {
        # Проверяем HTTP
        $response = Invoke-WebRequest -Uri "http://$VM_HOST" -Method GET -TimeoutSec 15 -ErrorAction Stop
        
        if ($response.StatusCode -in @(200, 301, 302)) {
            Write-Success "Сайт доступен по адресу http://$VM_HOST (код: $($response.StatusCode))"
        } else {
            Write-Warning "Сайт отвечает с кодом $($response.StatusCode)"
        }
    } catch {
        Write-Warning "HTTP проверка не удалась: $($_.Exception.Message)"
        
        # Пробуем простую проверку TCP соединения
        try {
            $tcpClient = New-Object System.Net.Sockets.TcpClient
            $tcpClient.Connect($VM_HOST, 80)
            $tcpClient.Close()
            Write-Success "TCP порт 80 открыт на $VM_HOST"
        } catch {
            Write-Warning "TCP порт 80 недоступен: $($_.Exception.Message)"
        }
    }
    
    Write-Info "Для детальной диагностики используйте:"
    Write-Info "ssh $VM_USER@$VM_HOST 'cd $PROJECT_NAME && docker compose ps && docker compose logs --tail=50'"
}

# Главная функция
function Main {
    Write-Host ""
    Write-Host "===============================================" -ForegroundColor Magenta
    Write-Host "🚀 RGSZH MiniApp Deployment Script (PowerShell)" -ForegroundColor Magenta
    Write-Host "🏷️ Deploy Tag: $DEPLOY_TAG" -ForegroundColor Magenta
    Write-Host "===============================================" -ForegroundColor Magenta
    Write-Host ""
    
    $startTime = Get-Date
    
    try {
        Test-Dependencies
        Build-And-Push-Images
        Copy-Files-To-VM
        Deploy-To-VM
        Test-Deployment
        
        $endTime = Get-Date
        $duration = $endTime - $startTime
        
        Write-Host ""
        Write-Host "===============================================" -ForegroundColor Magenta
        Write-Success "Деплой завершен успешно! 🎉"
        Write-Info "Тег образов: $DEPLOY_TAG"
        Write-Info "Время выполнения: $($duration.Minutes)м $($duration.Seconds)с"
        Write-Info "URL: http://$VM_HOST"
        Write-Host "===============================================" -ForegroundColor Magenta
        
    } catch {
        Write-Error "Критическая ошибка: $_"
        exit 1
    }
}

# Показ справки
function Show-Help {
    Write-Host @"
RGSZH MiniApp Deployment Script

ИСПОЛЬЗОВАНИЕ:
    .\deploy.ps1 [-SkipBuild] [-SkipCopy] [-SkipDeploy] [-Verbose]

ПАРАМЕТРЫ:
    -SkipBuild   Пропустить сборку и отправку Docker образов
    -SkipCopy    Пропустить копирование файлов на ВМ
    -SkipDeploy  Пропустить деплой на ВМ
    -Verbose     Подробный вывод команд

ПРИМЕРЫ:
    .\deploy.ps1                        # Полный деплой
    .\deploy.ps1 -SkipBuild            # Только копирование и деплой
    .\deploy.ps1 -SkipCopy -SkipDeploy # Только сборка образов
    .\deploy.ps1 -Verbose              # С подробным выводом

ТРЕБОВАНИЯ:
    - Docker Desktop
    - Git Bash или WSL (для scp/ssh команд)
    - Доступ к Docker Hub репозиторию zerotlt
    - SSH доступ к ВМ 176.109.110.217

"@ -ForegroundColor Cyan
}

# Обработка параметров командной строки
if ($args -contains "--help" -or $args -contains "-h") {
    Show-Help
    exit 0
}

# Запуск основной функции
Main