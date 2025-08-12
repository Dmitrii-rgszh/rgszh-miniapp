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
    # Сборка свежих образов для всех сервисов (бэкенда и фронтенда)
    Write-Host "🔧 Собираем новые Docker-образы (server и frontend)..." -ForegroundColor Cyan
    ssh admin@$VmIp "cd /home/admin/rgszh-miniapp && docker compose build --pull"

    # Публикация образов в реестр (если указан image в docker-compose.yml)
    Write-Host "⬆️  Публикуем образы в реестр..." -ForegroundColor Cyan
    ssh admin@$VmIp "cd /home/admin/rgszh-miniapp && docker compose push"

    # Перезапуск всех сервисов
    Write-Host "🔄 Перезапускаем сервисы..." -ForegroundColor Cyan
    ssh admin@$VmIp "cd /home/admin/rgszh-miniapp && docker compose stop"
    ssh admin@$VmIp "cd /home/admin/rgszh-miniapp && docker compose up -d"

    Write-Host "⏳ Ждем запуска контейнеров..." -ForegroundColor Yellow
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
