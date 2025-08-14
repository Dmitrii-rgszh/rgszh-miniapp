#!/usr/bin/env pwsh
# Принудительный деплой с очисткой кэша

Write-Host "🔥 ПРИНУДИТЕЛЬНЫЙ ДЕПЛОЙ С ОЧИСТКОЙ КЭША" -ForegroundColor Red
Write-Host "🗑️  Очищаем Docker кэш на ВМ..." -ForegroundColor Yellow

# Параметры
$VM_IP = "176.108.243.189"
$DOCKER_USER = "zerotlt"

# Генерируем уникальную версию
$VERSION = Get-Date -Format "yyyyMMdd-HHmmss"
Write-Host "📦 Версия: $VERSION" -ForegroundColor Cyan

# 1. Собираем образы с новой версией
Write-Host "🔨 Пересборка образов..." -ForegroundColor Green
npm run build
docker build --no-cache -t "${DOCKER_USER}/rgszh-miniapp-server:${VERSION}" -t "${DOCKER_USER}/rgszh-miniapp-server:latest" -f Dockerfile.server .
docker build --no-cache -t "${DOCKER_USER}/rgszh-miniapp-client:${VERSION}" -t "${DOCKER_USER}/rgszh-miniapp-client:latest" -f Dockerfile.client .

# 2. Загружаем в Docker Hub
Write-Host "📤 Загрузка образов..." -ForegroundColor Green
docker push "${DOCKER_USER}/rgszh-miniapp-server:${VERSION}"
docker push "${DOCKER_USER}/rgszh-miniapp-server:latest"
docker push "${DOCKER_USER}/rgszh-miniapp-client:${VERSION}"
docker push "${DOCKER_USER}/rgszh-miniapp-client:latest"

# 3. Принудительно очищаем кэш на ВМ и деплоим
Write-Host "🧹 Очистка кэша на ВМ..." -ForegroundColor Yellow

$CLEANUP_SCRIPT = @"
#!/bin/bash
set -e

echo "🛑 Останавливаем контейнеры..."
cd /root
docker-compose down

echo "🗑️ Удаляем старые образы..."
docker rmi zerotlt/rgszh-miniapp-server:latest || true
docker rmi zerotlt/rgszh-miniapp-client:latest || true
docker image prune -f

echo "📥 Загружаем новые образы..."
docker-compose pull

echo "🚀 Запускаем обновлённые контейнеры..."
docker-compose up -d

echo "⏳ Ждём запуска..."
sleep 10

echo "📊 Статус контейнеров:"
docker-compose ps

echo "✅ Деплой завершён!"
"@

# Создаём временный файл скрипта
$TEMP_SCRIPT = "cleanup-deploy.sh"
$CLEANUP_SCRIPT | Out-File -FilePath $TEMP_SCRIPT -Encoding UTF8

# Копируем и выполняем на ВМ
Write-Host "🚀 Выполняем деплой на ВМ..." -ForegroundColor Green
scp $TEMP_SCRIPT "root@${VM_IP}:/tmp/"
ssh "root@${VM_IP}" "chmod +x /tmp/$TEMP_SCRIPT && /tmp/$TEMP_SCRIPT"

# Удаляем временный файл
Remove-Item $TEMP_SCRIPT -Force

Write-Host "🎉 ПРИНУДИТЕЛЬНЫЙ ДЕПЛОЙ ЗАВЕРШЁН!" -ForegroundColor Green
Write-Host "🌐 Проверьте: https://$VM_IP/" -ForegroundColor Cyan
Write-Host "💡 Обновите страницу с Ctrl+F5 для сброса кэша браузера" -ForegroundColor Yellow
