#!/usr/bin/env pwsh
# Скрипт обновления frontend и диагностики проблемы

param(
    [string]$VmIp = "176.108.243.189"
)

$ErrorActionPreference = "Stop"

Write-Host "🔍 === ДИАГНОСТИКА И ОБНОВЛЕНИЕ FRONTEND ===" -ForegroundColor Green
Write-Host ""

try {
    Write-Host "📋 Проверяем логи сервера..." -ForegroundColor Cyan
    ssh admin@$VmIp "cd /home/admin/rgszh-miniapp && docker compose logs server --tail=20"
    
    Write-Host ""
    Write-Host "📥 Обновляем frontend..." -ForegroundColor Cyan
    ssh admin@$VmIp "cd /home/admin/rgszh-miniapp && docker compose pull frontend"
    ssh admin@$VmIp "cd /home/admin/rgszh-miniapp && docker compose stop frontend"
    ssh admin@$VmIp "cd /home/admin/rgszh-miniapp && docker compose up -d frontend"
    
    Write-Host "⏳ Ждем запуска frontend..." -ForegroundColor Yellow
    Start-Sleep -Seconds 15
    
    Write-Host ""
    Write-Host "📊 Проверяем статус всех контейнеров..." -ForegroundColor Cyan
    ssh admin@$VmIp "cd /home/admin/rgszh-miniapp && docker compose ps"
    
    Write-Host ""
    Write-Host "🧪 Проверяем nginx конфигурацию..." -ForegroundColor Cyan
    ssh admin@$VmIp "cd /home/admin/rgszh-miniapp && docker compose logs proxy --tail=10"
    
    Write-Host ""
    Write-Host "🔍 Тестируем маршрутизацию API..." -ForegroundColor Cyan
    
    # Тест через прямое подключение к серверу
    Write-Host "   🎯 Прямое подключение к серверу (порт 4000)..."
    try {
        $directUrl = "https://${VmIp}:4000/api/justincase/recommend-sum"
        $testPayload = @{
            birthDate = "1990-01-01"
            hasJob = $true
            income2023 = "1000000"
        } | ConvertTo-Json
        
        $directResponse = Invoke-RestMethod -Uri $directUrl -Method POST -Body $testPayload -ContentType "application/json" -TimeoutSec 10 -SkipCertificateCheck
        Write-Host "   ✅ Прямое подключение работает!" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ Прямое подключение: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Тест через nginx proxy
    Write-Host "   🌐 Подключение через nginx proxy (порт 443)..."
    try {
        $proxyUrl = "https://${VmIp}/api/justincase/recommend-sum"
        $proxyResponse = Invoke-RestMethod -Uri $proxyUrl -Method POST -Body $testPayload -ContentType "application/json" -TimeoutSec 10 -SkipCertificateCheck
        Write-Host "   ✅ Nginx proxy работает!" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ Nginx proxy: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "   🔧 Возможна проблема в конфигурации nginx" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "💡 === РЕКОМЕНДАЦИИ ===" -ForegroundColor Yellow
    Write-Host "1. Если прямое подключение работает, а proxy нет - проблема в nginx"
    Write-Host "2. Очистите кеш браузера и перезагрузите страницу"
    Write-Host "3. Проверьте консоль браузера (F12) на наличие ошибок JavaScript"
    Write-Host "4. Убедитесь, что используется HTTPS, а не HTTP"
    
} catch {
    Write-Host "❌ Ошибка: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
