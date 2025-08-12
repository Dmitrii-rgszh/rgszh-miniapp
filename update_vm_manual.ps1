# PowerShell скрипт для обновления VM через альтернативные методы
# Поскольку SSH ключи недоступны, попробуем другие способы

Write-Host "🚀 === ОБНОВЛЕНИЕ VM ЧЕРЕЗ АЛЬТЕРНАТИВНЫЕ МЕТОДЫ ===" -ForegroundColor Green

$vmIP = "176.108.243.189"
$serverImage = "zerotlt/rgszh-miniapp-server:latest"
$clientImage = "zerotlt/rgszh-miniapp-client:latest"

Write-Host "📊 Статус образов в Docker Hub:" -ForegroundColor Yellow

# Проверяем, что образы успешно загружены в Docker Hub
try {
    Write-Host "🔍 Проверяем сервер образ..."
    $serverCheck = Invoke-RestMethod -Uri "https://hub.docker.com/v2/repositories/zerotlt/rgszh-miniapp-server/tags/" -Method Get
    if ($serverCheck.results) {
        Write-Host "✅ Сервер образ найден в Docker Hub" -ForegroundColor Green
        $latestServer = $serverCheck.results | Where-Object { $_.name -eq "latest" } | Select-Object -First 1
        if ($latestServer) {
            Write-Host "📅 Последнее обновление: $($latestServer.last_updated)" -ForegroundColor Cyan
        }
    }
} catch {
    Write-Host "⚠️ Не удалось проверить сервер образ: $($_.Exception.Message)" -ForegroundColor Yellow
}

try {
    Write-Host "🔍 Проверяем клиент образ..."
    $clientCheck = Invoke-RestMethod -Uri "https://hub.docker.com/v2/repositories/zerotlt/rgszh-miniapp-client/tags/" -Method Get
    if ($clientCheck.results) {
        Write-Host "✅ Клиент образ найден в Docker Hub" -ForegroundColor Green
        $latestClient = $clientCheck.results | Where-Object { $_.name -eq "latest" } | Select-Object -First 1
        if ($latestClient) {
            Write-Host "📅 Последнее обновление: $($latestClient.last_updated)" -ForegroundColor Cyan
        }
    }
} catch {
    Write-Host "⚠️ Не удалось проверить клиент образ: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "🔧 КОМАНДЫ ДЛЯ РУЧНОГО ОБНОВЛЕНИЯ НА VM:" -ForegroundColor Yellow
Write-Host "Выполните эти команды на сервере ${vmIP}:" -ForegroundColor White

$commands = @(
    "cd /opt/miniapp",
    "docker-compose down --remove-orphans",
    "docker rmi -f zerotlt/rgszh-miniapp-server:latest || true",
    "docker rmi -f zerotlt/rgszh-miniapp-client:latest || true", 
    "docker pull zerotlt/rgszh-miniapp-server:latest",
    "docker pull zerotlt/rgszh-miniapp-client:latest",
    "docker-compose up -d",
    "docker-compose ps",
    "docker-compose logs server --tail=20"
)

foreach ($cmd in $commands) {
    Write-Host "  $cmd" -ForegroundColor Cyan
}

Write-Host "📋 АЛЬТЕРНАТИВНЫЕ МЕТОДЫ:" -ForegroundColor Yellow
Write-Host "1. Через Portainer (если установлен): http://${vmIP}:9000" -ForegroundColor White
Write-Host "2. Через веб-хуки для CI/CD" -ForegroundColor White  
Write-Host "3. Через панель управления хостинга" -ForegroundColor White

Write-Host "`n🧪 ТЕСТ ПОСЛЕ ОБНОВЛЕНИЯ:" -ForegroundColor Yellow
Write-Host "python test_recommend_endpoint.py" -ForegroundColor Cyan

Write-Host "`n✅ ГОТОВО! Образы собраны и загружены в Docker Hub." -ForegroundColor Green
Write-Host "Остается только обновить контейнеры на VM." -ForegroundColor White
