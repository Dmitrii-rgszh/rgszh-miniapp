#!/usr/bin/env pwsh
# Простой скрипт деплоя для обновления сервера

param(
    [string]$VmIp = "176.108.243.189"
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 === БЫСТРЫЙ ДЕПЛОЙ СЕРВЕРА ===" -ForegroundColor Green
Write-Host "   ВМ: $VmIp" -ForegroundColor Yellow
Write-Host ""

try {
    Write-Host "📥 Подтягиваем новый образ сервера..." -ForegroundColor Cyan
    ssh admin@$VmIp "cd /home/admin/rgszh-miniapp && docker compose pull server"
    
    Write-Host "🔄 Перезапускаем сервер..." -ForegroundColor Cyan
    ssh admin@$VmIp "cd /home/admin/rgszh-miniapp && docker compose stop server"
    ssh admin@$VmIp "cd /home/admin/rgszh-miniapp && docker compose up -d server"
    
    Write-Host "⏳ Ждем запуска сервиса..." -ForegroundColor Yellow
    Start-Sleep -Seconds 20
    
    Write-Host "📊 Проверяем статус..." -ForegroundColor Cyan
    ssh admin@$VmIp "cd /home/admin/rgszh-miniapp && docker compose ps"
    
    Write-Host ""
    Write-Host "🧪 Тестируем новый эндпоинт..." -ForegroundColor Cyan
    
    $testUrl = "https://${VmIp}/api/justincase/recommend-sum"
    
    try {
        $testPayload = @{
            birthDate = "1990-01-01"
            hasJob = $true
            income2023 = "1000000"
        } | ConvertTo-Json
        
        $response = Invoke-RestMethod -Uri $testUrl -Method POST -Body $testPayload -ContentType "application/json" -TimeoutSec 10 -SkipCertificateCheck -ErrorAction Stop
        Write-Host "✅ Эндпоинт recommend-sum работает!" -ForegroundColor Green
        Write-Host "   Рекомендованная сумма: $($response.data.recommended_sum)" -ForegroundColor Yellow
    } catch {
        if ($_.Exception.Response.StatusCode -eq 400) {
            Write-Host "✅ Эндпоинт recommend-sum работает! (400 - ошибка валидации нормальна)" -ForegroundColor Green
        } elseif ($_.Exception.Response.StatusCode -eq 405) {
            Write-Host "❌ Эндпоинт НЕ обновился! Все еще 405 Method Not Allowed" -ForegroundColor Red
        } else {
            Write-Host "⚠️ Статус: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
            Write-Host "   Сообщение: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
    
    Write-Host ""
    Write-Host "✅ === ДЕПЛОЙ ЗАВЕРШЕН ===" -ForegroundColor Green
    Write-Host "   🌐 Приложение: https://${VmIp}/" -ForegroundColor Yellow
    Write-Host "   🔧 API: https://${VmIp}/api/justincase/health" -ForegroundColor Yellow
    
} catch {
    Write-Host "❌ Ошибка деплоя: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
