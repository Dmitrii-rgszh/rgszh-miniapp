#!/usr/bin/env pwsh
# Универсальный скрипт деплоя miniapp

param(
    [string]$VmIp = "176.108.243.189",
    [string]$DockerUser = "zerotlt",
    [switch]$SkipBuild,
    [switch]$SkipTest
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 === УНИВЕРСАЛЬНЫЙ ДЕПЛОЙ MINIAPP ===" -ForegroundColor Green
Write-Host "   ВМ: $VmIp" -ForegroundColor Yellow
Write-Host "   Docker Hub: $DockerUser" -ForegroundColor Yellow
if ($SkipBuild) { Write-Host "   ⏭️  Пропуск сборки" -ForegroundColor Yellow }
if ($SkipTest) { Write-Host "   ⏭️  Пропуск тестов" -ForegroundColor Yellow }
Write-Host ""

if (-not $SkipBuild) {
    # 1. Сборка образов локально
    Write-Host "🔨 Сборка Docker образов..." -ForegroundColor Cyan

    # Сборка сервера
    Write-Host "   🔧 Собираю сервер..."
    docker build -f Dockerfile.server -t "${DockerUser}/rgszh-miniapp-server:latest" .
    if ($LASTEXITCODE -ne 0) { throw "Ошибка сборки сервера" }

    # Сборка клиента
    Write-Host "   🌐 Собираю клиент..."
    docker build -f Dockerfile.client -t "${DockerUser}/rgszh-miniapp-client:latest" .
    if ($LASTEXITCODE -ne 0) { throw "Ошибка сборки клиента" }

    Write-Host "✅ Образы собраны" -ForegroundColor Green

    # 2. Пуш в Docker Hub
    Write-Host ""
    Write-Host "📤 Загрузка образов в Docker Hub..." -ForegroundColor Cyan

    Write-Host "   🔐 Проверяю авторизацию..."
    $loginResult = docker system info 2>&1 | Select-String "Username"
    if (-not $loginResult) {
        Write-Host "   🔑 Требуется авторизация в Docker Hub..."
        docker login
        if ($LASTEXITCODE -ne 0) { throw "Ошибка авторизации" }
    }

    Write-Host "   ⬆️  Пушу сервер..."
    docker push "${DockerUser}/rgszh-miniapp-server:latest"
    if ($LASTEXITCODE -ne 0) { throw "Ошибка пуша сервера" }

    Write-Host "   ⬆️  Пушу клиент..."  
    docker push "${DockerUser}/rgszh-miniapp-client:latest"
    if ($LASTEXITCODE -ne 0) { throw "Ошибка пуша клиента" }

    Write-Host "✅ Образы загружены в Docker Hub" -ForegroundColor Green
}

# 3. Деплой на ВМ
Write-Host ""
Write-Host "�️  Деплой на ВМ $VmIp..." -ForegroundColor Cyan

$deployScript = @"
#!/bin/bash
set -e

cd /home/admin/rgszh-miniapp

echo "📥 Подтягиваем новые образы..."
docker-compose pull server

echo "🔄 Перезапускаем сервер..."
docker-compose down server
docker-compose up -d server

echo "⏳ Ждем запуска сервиса..."
sleep 15

echo "📊 Статус сервисов:"
docker-compose ps

echo "✅ Деплой завершен!"
"@

Write-Host "   � Запускаю команды деплоя на ВМ..."

Write-Host "   📥 Подтягиваем новые образы..."
ssh admin@$VmIp "cd /home/admin/rgszh-miniapp && docker-compose pull server"

Write-Host "   🔄 Перезапускаем сервер..."
ssh admin@$VmIp "cd /home/admin/rgszh-miniapp && docker-compose stop server"
ssh admin@$VmIp "cd /home/admin/rgszh-miniapp && docker-compose up -d server"

Write-Host "   ⏳ Ждем запуска сервиса..."
Start-Sleep -Seconds 15

Write-Host "   📊 Проверяем статус..."
ssh admin@$VmIp "cd /home/admin/rgszh-miniapp && docker-compose ps"

if ($LASTEXITCODE -ne 0) { throw "Ошибка деплоя на ВМ" }

if (-not $SkipTest) {
    # 4. Проверка работоспособности
    Write-Host ""
    Write-Host "🧪 Проверка работоспособности..." -ForegroundColor Cyan

    $testUrl = "https://${VmIp}/api/justincase/info"
    Write-Host "   📡 Проверяю доступность API: $testUrl"

    try {
        $response = Invoke-RestMethod -Uri $testUrl -TimeoutSec 10 -SkipCertificateCheck
        Write-Host "✅ API доступен" -ForegroundColor Green
        Write-Host "   Статус: $($response.status)" -ForegroundColor Yellow
        
    } catch {
        Write-Host "⚠️  API недоступен: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "🎉 === ДЕПЛОЙ ЗАВЕРШЕН ===" -ForegroundColor Green
Write-Host "   🌐 Фронтенд: https://${VmIp}/" -ForegroundColor Yellow
Write-Host "   🔧 API: https://${VmIp}/api/" -ForegroundColor Yellow
Write-Host "   📊 JustInCase: https://${VmIp}/api/justincase/calculate" -ForegroundColor Yellow
Write-Host ""
Write-Host "💡 Для тестирования коэффициентов запустите:" -ForegroundColor Cyan
Write-Host "   .\test-frequency-api.ps1" -ForegroundColor White
