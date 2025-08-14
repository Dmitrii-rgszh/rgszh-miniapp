#!/usr/bin/env pwsh
# Принудительный деплой через прямой Docker API

Write-Host "🔥 ПРИНУДИТЕЛЬНОЕ ОБНОВЛЕНИЕ ЧЕРЕЗ DOCKER API" -ForegroundColor Red

$VM_IP = "176.108.243.189"

# Создаём команды для принудительного обновления
$COMMANDS = @"
# Останавливаем контейнеры
docker-compose down

# Принудительно удаляем образы
docker rmi zerotlt/rgszh-miniapp-server:latest -f
docker rmi zerotlt/rgszh-miniapp-client:latest -f  
docker image prune -f

# Загружаем свежие образы
docker pull zerotlt/rgszh-miniapp-server:latest
docker pull zerotlt/rgszh-miniapp-client:latest

# Запускаем с новыми образами
docker-compose up -d

# Показываем статус
docker-compose ps
"@

Write-Host "📝 Команды для выполнения на ВМ:" -ForegroundColor Yellow
Write-Host $COMMANDS -ForegroundColor White

Write-Host "`n🔧 Альтернативные способы:" -ForegroundColor Cyan
Write-Host "1. Подключитесь к ВМ и выполните команды выше" -ForegroundColor White
Write-Host "2. Или используйте Portainer/Docker UI на ВМ" -ForegroundColor White
Write-Host "3. Или настройте SSH ключи для автоматизации" -ForegroundColor White

Write-Host "`n🌐 После выполнения команд проверьте:" -ForegroundColor Green
Write-Host "   https://$VM_IP/" -ForegroundColor White
Write-Host "   (с Ctrl+F5 для сброса кэша браузера)" -ForegroundColor Yellow
