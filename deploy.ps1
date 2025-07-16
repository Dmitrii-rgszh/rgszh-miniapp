# deploy.ps1 - PowerShell скрипт для деплоя RGSZH MiniApp

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

# Сборка и отправка образов
function Build-And-Push-Images {
    if ($SkipBuild) {
        Write-Warning "Пропуск сборки образов (параметр -SkipBuild)"
        return
    }
    
    Write-Log "🐳 Сборка и отправка Docker образов..."
    
    try {
        # Сборка серверного образа
        Write-Log "📦 Сборка серверного образа..."
        $cmd = "docker build --no-cache -f Dockerfile.server -t ${DOCKER_REGISTRY}/${PROJECT_NAME}-api:prod ."
        
        if ($Verbose) { Write-Info "Выполняем: $cmd" }
        Invoke-Expression $cmd
        
        if ($LASTEXITCODE -ne 0) {
            throw "Ошибка сборки серверного образа"
        }
        
        Write-Log "📤 Отправка серверного образа..."
        $cmd = "docker push ${DOCKER_REGISTRY}/${PROJECT_NAME}-api:prod"
        
        if ($Verbose) { Write-Info "Выполняем: $cmd" }
        Invoke-Expression $cmd
        
        if ($LASTEXITCODE -ne 0) {
            throw "Ошибка отправки серверного образа"
        }
        
        Write-Success "Серверный образ собран и отправлен"
        
        # Сборка клиентского образа
        Write-Log "📦 Сборка клиентского образа..."
        $cmd = "docker build --no-cache -f Dockerfile.client --build-arg REACT_APP_SOCKET_URL=`"$SOCKET_URL`" -t ${DOCKER_REGISTRY}/${PROJECT_NAME}:prod ."
        
        if ($Verbose) { Write-Info "Выполняем: $cmd" }
        Invoke-Expression $cmd
        
        if ($LASTEXITCODE -ne 0) {
            throw "Ошибка сборки клиентского образа"
        }
        
        Write-Log "📤 Отправка клиентского образа..."
        $cmd = "docker push ${DOCKER_REGISTRY}/${PROJECT_NAME}:prod"
        
        if ($Verbose) { Write-Info "Выполняем: $cmd" }
        Invoke-Expression $cmd
        
        if ($LASTEXITCODE -ne 0) {
            throw "Ошибка отправки клиентского образа"
        }
        
        Write-Success "Клиентский образ собран и отправлен"
        
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

# Деплой на ВМ
function Deploy-To-VM {
    if ($SkipDeploy) {
        Write-Warning "Пропуск деплоя на ВМ (параметр -SkipDeploy)"
        return
    }
    
    Write-Log "🚀 Деплой на виртуальную машину..."
    
    # Скрипт для выполнения на ВМ
    $vmScript = @"
set -e
cd ~/${PROJECT_NAME}
echo "🔄 Восстановление docker-compose.yml из git..."
git checkout -- docker-compose.yml
echo "🛑 Остановка контейнеров..."
docker-compose down
echo "🗑️ Удаление старых образов..."
docker image rm ${DOCKER_REGISTRY}/${PROJECT_NAME}-api:prod || true
docker image rm ${DOCKER_REGISTRY}/${PROJECT_NAME}:prod || true
echo "📥 Получение новых образов..."
docker-compose pull
echo "🚀 Запуск обновленных контейнеров..."
docker-compose up -d
echo "📊 Проверка статуса контейнеров..."
docker-compose ps
echo "🎉 Деплой завершен успешно!"
"@
    
    try {
        Write-Log "🔗 Подключение к ВМ и выполнение деплоя..."
        
        $cmd = "ssh ${VM_USER}@${VM_HOST} `"$vmScript`""
        
        if ($Verbose) { Write-Info "Выполняем SSH команды на ВМ..." }
        Invoke-Expression $cmd
        
        if ($LASTEXITCODE -ne 0) {
            throw "Ошибка выполнения команд на ВМ"
        }
        
        Write-Success "Деплой на ВМ завершен успешно"
        
    } catch {
        Write-Error "Ошибка при деплое на ВМ: $_"
        exit 1
    }
}

# Проверка работоспособности
function Test-Deployment {
    Write-Log "🏥 Проверка работоспособности..."
    
    try {
        $response = Invoke-WebRequest -Uri "http://$VM_HOST" -Method GET -TimeoutSec 10 -ErrorAction Stop
        
        if ($response.StatusCode -in @(200, 301, 302)) {
            Write-Success "Сайт доступен по адресу http://$VM_HOST"
        } else {
            Write-Warning "Сайт отвечает с кодом $($response.StatusCode)"
        }
    } catch {
        Write-Warning "Сайт не отвечает или недоступен: $_"
        Write-Info "Проверьте логи контейнеров: ssh $VM_USER@$VM_HOST 'cd $PROJECT_NAME && docker-compose logs'"
    }
}

# Главная функция
function Main {
    Write-Host ""
    Write-Host "===============================================" -ForegroundColor Magenta
    Write-Host "🚀 RGSZH MiniApp Deployment Script (PowerShell)" -ForegroundColor Magenta
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