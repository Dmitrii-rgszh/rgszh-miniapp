# deploy.ps1 - ИСПРАВЛЕННЫЙ PowerShell скрипт для деплоя RGSZH MiniApp
# ЗАЩИТА SSL СЕРТИФИКАТОВ И NGINX КОНФИГУРАЦИИ + УСТОЙЧИВОЕ SSH СОЕДИНЕНИЕ

param(
    [switch]$SkipBuild,
    [switch]$SkipCopy,
    [switch]$SkipDeploy,
    [switch]$ForceConfig,
    [switch]$Verbose
)

# Настройки
$VM_USER = "admin"
$VM_HOST = "176.108.243.189"
$DOCKER_REGISTRY = "zerotlt"
$PROJECT_NAME = "rgszh-miniapp"
$SOCKET_URL = "https://rgszh-miniapp.org"

# SSH опции для стабильного соединения
$SSH_OPTIONS = "-o ServerAliveInterval=30 -o ServerAliveCountMax=5 -o ConnectTimeout=30 -o TCPKeepAlive=yes"

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

# Функция для выполнения команд с повторными попытками
function Invoke-WithRetry {
    param(
        [string]$Command,
        [int]$MaxAttempts = 3,
        [int]$DelaySeconds = 5
    )
    
    for ($i = 1; $i -le $MaxAttempts; $i++) {
        try {
            if ($Verbose) { Write-Info "Попытка $i из ${MaxAttempts}: $Command" }
            Invoke-Expression $Command
            
            if ($LASTEXITCODE -eq 0) {
                return $true
            }
            
            if ($i -lt $MaxAttempts) {
                Write-Warning "Команда не выполнена, повтор через $DelaySeconds секунд..."
                Start-Sleep -Seconds $DelaySeconds
            }
        } catch {
            if ($i -lt $MaxAttempts) {
                Write-Warning "Ошибка: $_. Повтор через $DelaySeconds секунд..."
                Start-Sleep -Seconds $DelaySeconds
            } else {
                throw $_
            }
        }
    }
    
    return $false
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
        $success = Invoke-WithRetry -Command "docker push ${DOCKER_REGISTRY}/${PROJECT_NAME}-api:$DEPLOY_TAG"
        if (-not $success) { throw "Ошибка отправки серверного образа с тегом" }
        
        $success = Invoke-WithRetry -Command "docker push ${DOCKER_REGISTRY}/${PROJECT_NAME}-api:latest"
        if (-not $success) { throw "Ошибка отправки серверного образа latest" }
        
        Write-Success "Серверный образ собран и отправлен (тег: $DEPLOY_TAG)"
        
        # Сборка клиентского образа с уникальным тегом (frontend)
        Write-Log "📦 Сборка клиентского образа (frontend)..."
        $cmd = "docker build --no-cache -f Dockerfile.client --build-arg REACT_APP_SOCKET_URL=`"$SOCKET_URL`" -t ${DOCKER_REGISTRY}/${PROJECT_NAME}-client:$DEPLOY_TAG -t ${DOCKER_REGISTRY}/${PROJECT_NAME}-client:latest ."
        if ($Verbose) { Write-Info "Выполняем: $cmd" }
        Invoke-Expression $cmd

        if ($LASTEXITCODE -ne 0) {
            throw "Ошибка сборки клиентского образа (frontend)"
        }

        Write-Log "📤 Отправка клиентского образа (frontend)..."
        $success = Invoke-WithRetry -Command "docker push ${DOCKER_REGISTRY}/${PROJECT_NAME}-client:$DEPLOY_TAG"
        if (-not $success) { throw "Ошибка отправки клиентского образа (frontend) с тегом" }

        $success = Invoke-WithRetry -Command "docker push ${DOCKER_REGISTRY}/${PROJECT_NAME}-client:latest"
        if (-not $success) { throw "Ошибка отправки клиентского образа (frontend) latest" }

        Write-Success "Клиентский образ (frontend) собран и отправлен (тег: $DEPLOY_TAG)"
        
    } catch {
        Write-Error "Ошибка при сборке/отправке образов: $_"
        exit 1
    }
}

# Копирование файлов на ВМ С ЗАЩИТОЙ КОНФИГУРАЦИЙ
function Copy-Files-To-VM {
    if ($SkipCopy) {
        Write-Warning "Пропуск копирования файлов (параметр -SkipCopy)"
        return
    }
    Write-Log "📁 Копирование файлов на ВМ..."
    # Основные файлы, которые ВСЕГДА копируем
    $alwaysCopyFiles = @(
        "docker-compose.yml",
        "Dockerfile.client", 
        "Dockerfile.server",
        ".env",
        "justincase_routes.py",
        "justincase_calculator.py",
        "care_future_routes.py",
        "assessment_routes.py",
        "assessment_models.py",
        "assessment_questions.sql",
        "init_assessment_db.py",
        "questionnaire_models.py",
        "questionnaire_routes.py",
        "server.py"
    )
    try {
        # Создаем папку если не существует
        $cmd = "ssh $VM_USER@$VM_HOST 'mkdir -p /home/${VM_USER}/${PROJECT_NAME}'"
        $success = Invoke-WithRetry -Command $cmd
        if (-not $success) { throw "Не удалось создать папку на сервере" }
        # Копируем основные файлы по одному с паузами для стабильности
        foreach ($file in $alwaysCopyFiles) {
            if (Test-Path $file) {
                Write-Log "📋 Копируем $file..."
                Start-Sleep -Seconds 2
                # Для .py файлов кладём в отдельную папку src на сервере
                if ($file -like "*.py") {
                    $cmd = "ssh ${VM_USER}@${VM_HOST} 'mkdir -p /home/${VM_USER}/${PROJECT_NAME}/src'"
                    Invoke-WithRetry -Command $cmd
                    $cmd = "scp ${file} ${VM_USER}@${VM_HOST}:/home/${VM_USER}/${PROJECT_NAME}/src/"
                } else {
                    $cmd = "scp ${file} ${VM_USER}@${VM_HOST}:/home/${VM_USER}/${PROJECT_NAME}/"
                }
                $success = Invoke-WithRetry -Command $cmd -MaxAttempts 5 -DelaySeconds 10
                if (-not $success) {
                    throw "Ошибка копирования $file после нескольких попыток"
                }
                Write-Success "$file скопирован"
            } else {
                Write-Warning "Файл $file не найден, пропускаем"
            }
        }
        
        # ===== ЗАЩИТА NGINX КОНФИГУРАЦИИ =====
        Write-Log "🔐 Проверка nginx конфигурации на сервере..."
        
        # Проверяем существует ли nginx/default.conf на сервере
        $checkCmd = "ssh $SSH_OPTIONS ${VM_USER}@${VM_HOST} 'test -f /home/${VM_USER}/${PROJECT_NAME}/nginx/default.conf && echo exists || echo not_exists'"
        $nginxExists = Invoke-Expression $checkCmd
        
        if ($nginxExists -eq "exists" -and -not $ForceConfig) {
            Write-Warning "nginx/default.conf уже существует на сервере. Пропускаем копирование."
            Write-Info "Используйте -ForceConfig для принудительной перезаписи"
        } else {
            # Копируем nginx конфигурацию
            if (Test-Path "nginx") {
                Write-Log "📋 Копируем nginx конфигурацию..."
                
                # Создаем папку nginx на сервере
                $cmd = "ssh $SSH_OPTIONS ${VM_USER}@${VM_HOST} 'mkdir -p /home/${VM_USER}/${PROJECT_NAME}/nginx'"
                Invoke-WithRetry -Command $cmd
                
                Start-Sleep -Seconds 2
                
                # Копируем папку nginx
                $cmd = "scp $SSH_OPTIONS -r nginx/* ${VM_USER}@${VM_HOST}:/home/${VM_USER}/${PROJECT_NAME}/nginx/"
                $success = Invoke-WithRetry -Command $cmd -MaxAttempts 5 -DelaySeconds 10
                
                if ($success) {
                    Write-Success "nginx конфигурация скопирована"
                } else {
                    Write-Warning "Не удалось скопировать nginx конфигурацию"
                }
            }
        }
        
        # ===== ЗАЩИТА SSL СЕРТИФИКАТОВ =====
        Write-Log "🔐 Проверка SSL сертификатов на сервере..."
        
        $checkCmd = "ssh $SSH_OPTIONS ${VM_USER}@${VM_HOST} 'test -f /home/${VM_USER}/${PROJECT_NAME}/certs/fullchain.pem && echo exists || echo not_exists'"
        $certsExist = Invoke-Expression $checkCmd
        
        if ($certsExist -eq "exists" -and -not $ForceConfig) {
            Write-Warning "SSL сертификаты уже существуют на сервере. Пропускаем копирование."
            Write-Success "Используем существующие сертификаты на сервере."
        } else {
            # Копируем сертификаты если есть локально
            if (Test-Path "certs") {
                Write-Log "📋 Копируем SSL сертификаты..."
                
                # Создаем папку certs на сервере
                $cmd = "ssh $SSH_OPTIONS ${VM_USER}@${VM_HOST} 'mkdir -p /home/${VM_USER}/${PROJECT_NAME}/certs'"
                Invoke-WithRetry -Command $cmd
                
                Start-Sleep -Seconds 2
                
                # Копируем папку certs
                $cmd = "scp $SSH_OPTIONS -r certs/* ${VM_USER}@${VM_HOST}:/home/${VM_USER}/${PROJECT_NAME}/certs/"
                $success = Invoke-WithRetry -Command $cmd -MaxAttempts 5 -DelaySeconds 10
                
                if ($success) {
                    Write-Success "SSL сертификаты скопированы"
                } else {
                    Write-Warning "Не удалось скопировать SSL сертификаты"
                }
            } else {
                Write-Warning "Локальная папка certs не найдена"
            }
        }
        
        Write-Success "Все файлы скопированы на ВМ"
        
    } catch {
        Write-Error "Ошибка при копировании файлов: $_"
        
        # Предлагаем альтернативное решение
        Write-Info ""
        Write-Info "🔧 Альтернативное решение:"
        Write-Info "1. Попробуйте подключиться вручную:"
        Write-Info "   ssh $VM_USER@$VM_HOST"
        Write-Info ""
        Write-Info "2. Скопируйте файлы вручную:"
        Write-Info "   scp docker-compose.yml $VM_USER@${VM_HOST}:/home/$VM_USER/$PROJECT_NAME/"
        Write-Info "   scp Dockerfile.* $VM_USER@${VM_HOST}:/home/$VM_USER/$PROJECT_NAME/"
        Write-Info "   scp .env $VM_USER@${VM_HOST}:/home/$VM_USER/$PROJECT_NAME/"
        Write-Info ""
        Write-Info "3. Или используйте скрипт manual-cleanup.sh для очистки на сервере"
        
        exit 1
    }
}

# Деплой на ВМ
function Deploy-To-VM {
    if ($SkipDeploy) {
        Write-Warning "Пропуск деплоя на ВМ (параметр -SkipDeploy)"
        return
    }
    Write-Log "🚀 Деплой на виртуальную машину (тег: $DEPLOY_TAG)..."
    # Создаем bash скрипт для выполнения на сервере
    $scriptContent = @"
#!/bin/bash
set -e
cd /home/${VM_USER}/${PROJECT_NAME}
echo "🛑 Остановка контейнеров..."
docker compose down || echo "Контейнеры уже остановлены"
echo "🗑️ Удаление старых образов..."
docker image rm ${DOCKER_REGISTRY}/${PROJECT_NAME}-api:latest || true
docker image rm ${DOCKER_REGISTRY}/${PROJECT_NAME}-client:latest || true
echo "🧹 Очистка Docker кэша..."
docker system prune -f
echo "📥 Получение новых образов..."
docker pull ${DOCKER_REGISTRY}/${PROJECT_NAME}-api:latest
docker pull ${DOCKER_REGISTRY}/${PROJECT_NAME}-client:latest
echo "🚀 Запуск контейнеров..."
docker compose up -d --force-recreate
echo "⏳ Ожидание запуска контейнеров..."
sleep 20
echo "📊 Проверка статуса контейнеров..."
docker compose ps
echo "📋 Показ логов сервера..."
docker compose logs server --tail=30
echo "🎉 Деплой завершен! Тег образов: $DEPLOY_TAG"
"@
    # Создаем временный файл с правильными Unix переводами строк
    $tempScriptPath = [System.IO.Path]::GetTempFileName()
    
    # Записываем скрипт с LF переводами строк
    $scriptBytes = [System.Text.Encoding]::UTF8.GetBytes($scriptContent.Replace("`r`n", "`n"))
    [System.IO.File]::WriteAllBytes($tempScriptPath, $scriptBytes)
    
    try {
        Write-Log "🔗 Подключение к ВМ и выполнение деплоя..."
        
        # Копируем скрипт на ВМ
        $cmd = "scp $SSH_OPTIONS `"$tempScriptPath`" ${VM_USER}@${VM_HOST}:/tmp/deploy_script.sh"
        $success = Invoke-WithRetry -Command $cmd
        
        if (-not $success) {
            throw "Ошибка копирования скрипта на ВМ"
        }
        
        # Выполняем скрипт на ВМ
        $cmd = "ssh $SSH_OPTIONS ${VM_USER}@${VM_HOST} 'chmod +x /tmp/deploy_script.sh && bash /tmp/deploy_script.sh'"
        if ($Verbose) { Write-Info "Выполняем скрипт на ВМ: $cmd" }
        Invoke-Expression $cmd
        
        if ($LASTEXITCODE -ne 0) {
            throw "Ошибка выполнения команд на ВМ"
        }
        
        # Удаляем временный скрипт с ВМ
        $cmd = "ssh $SSH_OPTIONS ${VM_USER}@${VM_HOST} 'rm -f /tmp/deploy_script.sh'"
        Invoke-Expression $cmd
        
        Write-Success "Деплой на ВМ завершен успешно"
        
    } catch {
        Write-Error "Ошибка при деплое на ВМ: $_"
        Write-Info "Проверьте статус контейнеров: ssh $VM_USER@$VM_HOST 'cd $PROJECT_NAME && docker compose ps && docker compose logs --tail=50'"
        exit 1
    } finally {
        # Удаляем временный файл
        Remove-Item $tempScriptPath -ErrorAction SilentlyContinue
    }
}

# Проверка работоспособности
function Test-Deployment {
    Write-Log "🏥 Проверка работоспособности..."
    
    # Очистка кэша браузера
    Write-Log "🧹 Напоминание про кэш браузера..."
    Write-Info "Для обновления в браузере:"
    Write-Info "1. Обновите страницу (Ctrl+F5)"
    Write-Info "2. Очистите кэш браузера при необходимости"
    Write-Info "3. Проверьте работу приложения"
    
    # Проверка SSL статуса
    Write-Log "🔐 Проверка SSL..."
    $sslCheck = ssh "${VM_USER}@${VM_HOST}" "cd ${PROJECT_NAME} && test -f certs/fullchain.pem && echo 'SSL OK' || echo 'NO SSL'"
    if ($sslCheck -eq "SSL OK") {
        Write-Success "SSL сертификаты на месте"
    } else {
        Write-Warning "SSL сертификаты не найдены!"
    }
    
    try {
        # Проверяем HTTPS
        $response = Invoke-WebRequest -Uri "https://$VM_HOST" -Method GET -TimeoutSec 15 -SkipCertificateCheck -ErrorAction Stop
        
        if ($response.StatusCode -in @(200, 301, 302)) {
            Write-Success "HTTPS сайт доступен: https://rgszh-miniapp.org"
        }
    } catch {
        Write-Warning "HTTPS проверка не удалась: $($_.Exception.Message)"
        
        # Проверяем HTTP
        try {
            $response = Invoke-WebRequest -Uri "http://$VM_HOST" -Method GET -TimeoutSec 15 -ErrorAction Stop
            Write-Success "HTTP сайт доступен (должен редиректить на HTTPS)"
        } catch {
            Write-Warning "HTTP проверка тоже не удалась"
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
    Write-Host "🔐 SSL Protection: ENABLED" -ForegroundColor Green
    Write-Host "===============================================" -ForegroundColor Magenta
    Write-Host ""
    $startTime = Get-Date
    try {
        Test-Dependencies
        # Проверяем наличие всех ключевых файлов
        $mustExist = @("docker-compose.yml", "Dockerfile.client", "Dockerfile.server", ".env", "justincase_routes.py", "care_future_routes.py", "assessment_routes.py", "assessment_questions.sql", "questionnaire_routes.py", "server.py")
        foreach ($f in $mustExist) {
            if (-not (Test-Path $f)) {
                Write-Error "Ключевой файл отсутствует: $f"
                exit 1
            }
        }
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
        Write-Info "URL: https://rgszh-miniapp.org"
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
    .\deploy.ps1 [-SkipBuild] [-SkipCopy] [-SkipDeploy] [-ForceConfig] [-Verbose]

ПАРАМЕТРЫ:
    -SkipBuild    Пропустить сборку и отправку Docker образов
    -SkipCopy     Пропустить копирование файлов на ВМ
    -SkipDeploy   Пропустить деплой на ВМ
    -ForceConfig  ПРИНУДИТЕЛЬНО перезаписать nginx и SSL сертификаты
    -Verbose      Подробный вывод команд

ПРИМЕРЫ:
    .\deploy.ps1                         # Полный деплой (защита SSL)
    .\deploy.ps1 -SkipBuild             # Только копирование и деплой
    .\deploy.ps1 -ForceConfig           # Перезаписать ВСЕ конфигурации
    .\deploy.ps1 -Verbose               # С подробным выводом

ЗАЩИТА SSL:
    По умолчанию скрипт НЕ трогает:
    - /nginx/default.conf (если существует на сервере)
    - /certs/* (SSL сертификаты Let's Encrypt)
    
    Используйте -ForceConfig только если точно знаете что делаете!

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