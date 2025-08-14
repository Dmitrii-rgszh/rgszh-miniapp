# Скрипт для проверки статуса и логов контейнера на ВМ
param(
    [string]$VmIp = "176.108.243.189"
)

Write-Host "🔍 === ДИАГНОСТИКА КОНТЕЙНЕРА НА ВМ ===" -ForegroundColor Green
Write-Host "   ВМ: $VmIp" -ForegroundColor Yellow
Write-Host ""

try {
    Write-Host "📊 Статус контейнера сервера..." -ForegroundColor Cyan
    ssh "root@$VmIp" "docker ps --filter name=rgszh-miniapp-server"
    
    Write-Host ""
    Write-Host "📋 Логи запуска сервера (последние 30 строк)..." -ForegroundColor Cyan
    ssh "root@$VmIp" "docker logs rgszh-miniapp-server-1 --tail 30"
    
    Write-Host ""
    Write-Host "🔍 Проверка файла базы данных в контейнере..." -ForegroundColor Cyan
    ssh "root@$VmIp" "docker exec rgszh-miniapp-server-1 ls -la /app/miniapp.db"
    
    Write-Host ""
    Write-Host "📊 Проверка размера базы данных..." -ForegroundColor Cyan
    ssh "root@$VmIp" "docker exec rgszh-miniapp-server-1 du -h /app/miniapp.db"
    
} catch {
    Write-Host "❌ Ошибка диагностики: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎯 === ДИАГНОСТИКА ЗАВЕРШЕНА ===" -ForegroundColor Green
