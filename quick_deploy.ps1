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
    Write-Host "✅ === ДЕПЛОЙ ЗАВЕРШЕН ===" -ForegroundColor Green
    Write-Host "   🌐 Приложение: https://${VmIp}/" -ForegroundColor Yellow
    Write-Host "   🔧 API: https://${VmIp}/api/justincase/health" -ForegroundColor Yellow
    
} catch {
    Write-Host "❌ Ошибка деплоя: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
