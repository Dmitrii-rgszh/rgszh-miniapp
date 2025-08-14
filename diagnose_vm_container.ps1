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
    Write-Host "📋 Логи запуска сервера (последние 20 строк)..." -ForegroundColor Cyan
    ssh "root@$VmIp" "docker logs rgszh-miniapp-server-1 --tail 20"
    
    Write-Host ""
    Write-Host "🔍 Проверка файла базы данных в контейнере..." -ForegroundColor Cyan
    ssh "root@$VmIp" "docker exec rgszh-miniapp-server-1 ls -la /app/miniapp.db"
    
    Write-Host ""
    Write-Host "📊 Проверка размера базы данных..." -ForegroundColor Cyan
    ssh "root@$VmIp" "docker exec rgszh-miniapp-server-1 du -h /app/miniapp.db"
    
    Write-Host ""
    Write-Host "🧪 Проверка таблиц в базе данных..." -ForegroundColor Cyan
    ssh "root@$VmIp" "docker exec rgszh-miniapp-server-1 python3 -c \"
import sqlite3
conn = sqlite3.connect('/app/miniapp.db')
cursor = conn.cursor()
cursor.execute('SELECT name FROM sqlite_master WHERE type=\\\"table\\\"')
tables = cursor.fetchall()
for table in tables:
    table_name = table[0]
    cursor.execute(f'SELECT COUNT(*) FROM {table_name}')
    count = cursor.fetchone()[0]
    print(f'{table_name}: {count} записей')
conn.close()
\""
    
} catch {
    Write-Host "❌ Ошибка диагностики: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎯 === ДИАГНОСТИКА ЗАВЕРШЕНА ===" -ForegroundColor Green
