# Скрипт для принудительной инициализации SQLite базы данных на ВМ
param(
    [string]$VmIp = "176.108.243.189"
)

Write-Host "🔧 === ПРИНУДИТЕЛЬНАЯ ИНИЦИАЛИЗАЦИЯ БД НА ВМ ===" -ForegroundColor Green
Write-Host "   ВМ: $VmIp" -ForegroundColor Yellow
Write-Host ""

try {
    Write-Host "📋 Проверяем логи сервера..." -ForegroundColor Cyan
    ssh "root@$VmIp" "docker logs rgszh-miniapp-server-1 --tail 20"
    
    Write-Host ""
    Write-Host "🔍 Проверяем файл базы данных в контейнере..." -ForegroundColor Cyan
    ssh "root@$VmIp" "docker exec rgszh-miniapp-server-1 ls -la /app/miniapp.db"
    
    Write-Host ""
    Write-Host "📊 Размер базы данных..." -ForegroundColor Cyan
    ssh "root@$VmIp" "docker exec rgszh-miniapp-server-1 du -h /app/miniapp.db"
    
    Write-Host ""
    Write-Host "🧪 Проверяем таблицы в базе данных..." -ForegroundColor Cyan
    ssh "root@$VmIp" "docker exec rgszh-miniapp-server-1 python3 -c 'import sqlite3; conn = sqlite3.connect(\"/app/miniapp.db\"); cursor = conn.cursor(); cursor.execute(\"SELECT name FROM sqlite_master WHERE type=\\\"table\\\"\"); tables = cursor.fetchall(); print(\"Таблицы:\", [t[0] for t in tables]); conn.close()'"
    
    Write-Host ""
    Write-Host "📊 Проверяем количество записей в таблицах..." -ForegroundColor Cyan
    ssh "root@$VmIp" "docker exec rgszh-miniapp-server-1 python3 -c 'import sqlite3; conn = sqlite3.connect(\"/app/miniapp.db\"); cursor = conn.cursor(); cursor.execute(\"SELECT COUNT(*) FROM nsj_tariffs\"); count = cursor.fetchone()[0]; print(f\"nsj_tariffs: {count} записей\"); conn.close()'"
    
    Write-Host ""
    Write-Host "🔄 Перезапускаем сервер с принудительной инициализацией..." -ForegroundColor Cyan
    ssh "root@$VmIp" "cd /root && docker-compose restart server"
    
    Write-Host ""
    Write-Host "⏳ Ждем запуска..."
    Start-Sleep -Seconds 15
    
    Write-Host ""
    Write-Host "🧪 Проверяем API после перезапуска..." -ForegroundColor Cyan
    $testBody = @{
        age = 18
        gender = "Мужской"
        insuranceTerm = 1
        insuranceSum = 100000
        includeAccidentInsurance = "нет"
        criticalIllnessOption = "нет"
        insuranceFrequency = "Ежегодно"
        email = "test@rgsl.ru"
    } | ConvertTo-Json
    
    try {
        $response = Invoke-WebRequest -Uri "https://$VmIp/api/proxy/calculator/save" -Method POST -Headers @{"Content-Type"="application/json"} -Body $testBody -SkipCertificateCheck
        $result = $response.Content | ConvertFrom-Json
        
        if ($result.success) {
            Write-Host "   ✅ API работает!" -ForegroundColor Green
            Write-Host "   💰 Стоимость: $($result.calculation_result.totalPremium)" -ForegroundColor Yellow
        } else {
            Write-Host "   ❌ Ошибка: $($result.error)" -ForegroundColor Red
        }
    } catch {
        Write-Host "   ❌ Запрос не прошел: $($_.Exception.Message)" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ Ошибка диагностики: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎯 === ДИАГНОСТИКА ЗАВЕРШЕНА ===" -ForegroundColor Green
