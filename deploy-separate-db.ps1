# deploy-separate-db.ps1 - PowerShell скрипт для деплоя RGSZH MiniApp с отдельной БД
# РАЗДЕЛЕННАЯ АРХИТЕКТУРА: БД отдельно, приложение отдельно

param(
    [switch]$SkipBuild,
    [switch]$SkipCopy,
    [switch]$SkipDeploy,
    [switch]$ForceConfig,
    [switch]$Verbose,
    [switch]$DeployDB,
    [switch]$DeployApp
)

# Настройки
$VM_USER = "admin"
$VM_HOST = "176.109.109.47"
$DOCKER_REGISTRY = "zerotlt"
$PROJECT_NAME = "rgszh-miniapp"
$DB_PROJECT_NAME = "postgres-db"
$APP_PROJECT_NAME = "rgszh-app"
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
        Write-Info "Установите недостающие компоненты и повторите"
        exit 1
    }
    
    Write-Success "Все зависимости найдены"
}

# Деплой базы данных
function Deploy-Database {
    Write-Log "🗄️ Деплой базы данных..."
    
    try {
        # Создаем папку для БД на ВМ
        $cmd = "ssh $SSH_OPTIONS ${VM_USER}@${VM_HOST} 'mkdir -p /home/${VM_USER}/${DB_PROJECT_NAME}'"
        Invoke-WithRetry -Command $cmd
        
        # Копируем файлы БД
        $dbFiles = @(
            "Dockerfile.postgres",
            "docker-compose.db.yml", 
            "assessment_schema.sql",
            "assessment_questions.sql"
        )
        
        foreach ($file in $dbFiles) {
            if (Test-Path $file) {
                Write-Log "📋 Копируем $file для БД..."
                $cmd = "scp $SSH_OPTIONS $file ${VM_USER}@${VM_HOST}:/home/${VM_USER}/${DB_PROJECT_NAME}/"
                $success = Invoke-WithRetry -Command $cmd
                
                if ($success) {
                    Write-Success "$file скопирован"
                } else {
                    throw "Ошибка копирования $file"
                }
            } else {
                Write-Warning "Файл $file не найден"
            }
        }
        
        # Запускаем БД
        Write-Log "🚀 Запуск базы данных..."
        $cmd = "ssh $SSH_OPTIONS ${VM_USER}@${VM_HOST} 'cd /home/${VM_USER}/${DB_PROJECT_NAME} && docker compose -f docker-compose.db.yml down && docker volume rm postgres-db_postgres_data 2>/dev/null || true && docker compose -f docker-compose.db.yml up -d --build'"
        $success = Invoke-WithRetry -Command $cmd
        
        if ($success) {
            Write-Success "База данных запущена"
            
            # Проверяем статус БД
            Start-Sleep -Seconds 10
            $cmd = "ssh $SSH_OPTIONS ${VM_USER}@${VM_HOST} 'cd /home/${VM_USER}/${DB_PROJECT_NAME} && docker compose -f docker-compose.db.yml ps'"
            Invoke-Expression $cmd
            
        } else {
            throw "Ошибка запуска базы данных"
        }
        
    } catch {
        Write-Error "Ошибка деплоя БД: $_"
        throw $_
    }
}

# Деплой приложения
function Deploy-Application {
    Write-Log "🚀 Деплой приложения..."
    
    try {
        # Создаем папку для приложения на ВМ
        $cmd = "ssh $SSH_OPTIONS ${VM_USER}@${VM_HOST} 'mkdir -p /home/${VM_USER}/${APP_PROJECT_NAME}'"
        Invoke-WithRetry -Command $cmd
        
        # Копируем файлы приложения
        $appFiles = @(
            "docker-compose.app.yml",
            "Dockerfile.server",
            "Dockerfile.client",
            "server.py",
            "requirements.txt",
            "nginx/default.conf"
        )
        
        foreach ($file in $appFiles) {
            if (Test-Path $file) {
                Write-Log "📋 Копируем $file для приложения..."
                $cmd = "scp $SSH_OPTIONS $file ${VM_USER}@${VM_HOST}:/home/${VM_USER}/${APP_PROJECT_NAME}/"
                $success = Invoke-WithRetry -Command $cmd
                
                if ($success) {
                    Write-Success "$file скопирован"
                } else {
                    throw "Ошибка копирования $file"
                }
            } else {
                Write-Warning "Файл $file не найден"
            }
        }
        
        # Копируем папку src
        if (Test-Path "src") {
            Write-Log "📋 Копируем папку src..."
            $cmd = "scp $SSH_OPTIONS -r src ${VM_USER}@${VM_HOST}:/home/${VM_USER}/${APP_PROJECT_NAME}/"
            $success = Invoke-WithRetry -Command $cmd
            
            if ($success) {
                Write-Success "Папка src скопирована"
            } else {
                throw "Ошибка копирования src"
            }
        }
        
        # Копируем package.json
        if (Test-Path "package.json") {
            Write-Log "📋 Копируем package.json..."
            $cmd = "scp $SSH_OPTIONS package.json ${VM_USER}@${VM_HOST}:/home/${VM_USER}/${APP_PROJECT_NAME}/"
            $success = Invoke-WithRetry -Command $cmd
            
            if ($success) {
                Write-Success "package.json скопирован"
            } else {
                throw "Ошибка копирования package.json"
            }
        }
        
        # Запускаем приложение
        Write-Log "🚀 Запуск приложения..."
        $cmd = "ssh $SSH_OPTIONS ${VM_USER}@${VM_HOST} 'cd /home/${VM_USER}/${APP_PROJECT_NAME} && docker compose -f docker-compose.app.yml down && docker compose -f docker-compose.app.yml up -d --build'"
        $success = Invoke-WithRetry -Command $cmd
        
        if ($success) {
            Write-Success "Приложение запущено"
            
            # Проверяем статус приложения
            Start-Sleep -Seconds 10
            $cmd = "ssh $SSH_OPTIONS ${VM_USER}@${VM_HOST} 'cd /home/${VM_USER}/${APP_PROJECT_NAME} && docker compose -f docker-compose.app.yml ps'"
            Invoke-Expression $cmd
            
        } else {
            throw "Ошибка запуска приложения"
        }
        
    } catch {
        Write-Error "Ошибка деплоя приложения: $_"
        throw $_
    }
}

# Проверка деплоя
function Test-Deployment {
    Write-Log "🏥 Проверка работоспособности..."
    
    # Проверка БД
    Write-Log "🗄️ Проверка базы данных..."
    $dbStatus = ssh $SSH_OPTIONS ${VM_USER}@${VM_HOST} "cd /home/${VM_USER}/${DB_PROJECT_NAME} && docker compose -f docker-compose.db.yml ps"
    Write-Info "Статус БД: $dbStatus"
    
    # Проверка приложения
    Write-Log "🚀 Проверка приложения..."
    $appStatus = ssh $SSH_OPTIONS ${VM_USER}@${VM_HOST} "cd /home/${VM_USER}/${APP_PROJECT_NAME} && docker compose -f docker-compose.app.yml ps"
    Write-Info "Статус приложения: $appStatus"
    
    # Проверка подключения к БД
    Write-Log "🔗 Проверка подключения к БД..."
    $dbConnection = ssh $SSH_OPTIONS ${VM_USER}@${VM_HOST} "docker exec rgszh-postgres psql -U postgres -d postgres -c 'SELECT COUNT(*) as questions_count FROM questions;'"
    Write-Info "Количество вопросов в БД: $dbConnection"
    
    # Очистка кэша Telegram
    Write-Log "🧹 Напоминание про кэш Telegram..."
    Write-Info "Для обновления в Telegram:"
    Write-Info "1. Закройте MiniApp в Telegram"
    Write-Info "2. Очистите кэш Telegram: Настройки → Данные и память → Очистить кэш"
    Write-Info "3. Перезапустите Telegram"
    Write-Info "4. Откройте MiniApp заново"
    
    Write-Info "Для детальной диагностики используйте:"
    Write-Info "ssh $VM_USER@$VM_HOST 'cd /home/$VM_USER/$DB_PROJECT_NAME && docker compose -f docker-compose.db.yml logs'"
    Write-Info "ssh $VM_USER@$VM_HOST 'cd /home/$VM_USER/$APP_PROJECT_NAME && docker compose -f docker-compose.app.yml logs'"
}

# Главная функция
function Main {
    Write-Host ""
    Write-Host "===============================================" -ForegroundColor Magenta
    Write-Host "🚀 RGSZH MiniApp Separate DB Deployment" -ForegroundColor Magenta
    Write-Host "🏷️ Deploy Tag: $DEPLOY_TAG" -ForegroundColor Magenta
    Write-Host "🗄️ Database: Separate Container" -ForegroundColor Green
    Write-Host "🚀 Application: Separate Container" -ForegroundColor Green
    Write-Host "===============================================" -ForegroundColor Magenta
    Write-Host ""
    
    $startTime = Get-Date
    
    try {
        Test-Dependencies
        
        if ($DeployDB -or (-not $DeployApp)) {
            Deploy-Database
        }
        
        if ($DeployApp -or (-not $DeployDB)) {
            Deploy-Application
        }
        
        Test-Deployment
        
        $endTime = Get-Date
        $duration = $endTime - $startTime
        
        Write-Host ""
        Write-Host "===============================================" -ForegroundColor Magenta
        Write-Success "Деплой завершен успешно! 🎉"
        Write-Info "Тег образов: $DEPLOY_TAG"
        Write-Info "Время выполнения: $($duration.Minutes)м $($duration.Seconds)с"
        Write-Info "База данных: $VM_HOST:1112"
        Write-Info "Приложение: https://rgszh-miniapp.org"
        Write-Host "===============================================" -ForegroundColor Magenta
        
    } catch {
        Write-Error "Критическая ошибка: $_"
        exit 1
    }
}

# Показ справки
function Show-Help {
    Write-Host @"
RGSZH MiniApp Separate DB Deployment Script

ИСПОЛЬЗОВАНИЕ:
    .\deploy-separate-db.ps1 [-SkipBuild] [-SkipCopy] [-SkipDeploy] [-ForceConfig] [-Verbose] [-DeployDB] [-DeployApp]

ПАРАМЕТРЫ:
    -SkipBuild    Пропустить сборку и отправку Docker образов
    -SkipCopy     Пропустить копирование файлов на ВМ
    -SkipDeploy   Пропустить деплой на ВМ
    -ForceConfig  ПРИНУДИТЕЛЬНО перезаписать nginx и SSL сертификаты
    -Verbose      Подробный вывод команд
    -DeployDB     Деплоить только базу данных
    -DeployApp    Деплоить только приложение

ПРИМЕРЫ:
    .\deploy-separate-db.ps1                    # Полный деплой (БД + приложение)
    .\deploy-separate-db.ps1 -DeployDB          # Только база данных
    .\deploy-separate-db.ps1 -DeployApp         # Только приложение
    .\deploy-separate-db.ps1 -Verbose           # С подробным выводом

АРХИТЕКТУРА:
    - База данных: отдельный контейнер PostgreSQL на порту 1112
    - Приложение: отдельные контейнеры для backend и frontend
    - Связь: приложение подключается к БД по IP адресу ВМ

ТРЕБОВАНИЯ:
    - Docker Desktop
    - Git Bash или WSL (для scp/ssh команд)
    - SSH доступ к ВМ 176.108.243.189

"@ -ForegroundColor Cyan
}

# Обработка параметров командной строки
if ($args -contains "--help" -or $args -contains "-h") {
    Show-Help
    exit 0
}

# Запуск основной функции
Main 