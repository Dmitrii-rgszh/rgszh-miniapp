#!/bin/bash
# manual-cleanup.sh - Скрипт для ручной очистки и перезапуска контейнеров на сервере
# Использование: ssh admin@176.109.110.217 'bash -s' < manual-cleanup.sh

set -e

echo "🧹 RGSZH MiniApp - Ручная очистка и перезапуск"
echo "=============================================="

cd /home/admin/rgszh-miniapp

echo "📊 Текущее состояние контейнеров:"
docker compose ps

echo ""
echo "🛑 Остановка всех контейнеров..."
docker compose down

echo ""
echo "🗑️ Удаление ВСЕХ образов проекта..."
docker images | grep "zerotlt/rgszh-miniapp" | awk '{print $3}' | xargs -r docker rmi -f || true

echo ""
echo "🧹 Полная очистка Docker системы..."
docker container prune -f
docker image prune -a -f
docker volume prune -f
docker network prune -f
docker system prune -a -f

echo ""
echo "📥 Загрузка свежих образов..."
docker pull zerotlt/rgszh-miniapp-api:latest
docker pull zerotlt/rgszh-miniapp:latest

echo ""
echo "🚀 Запуск контейнеров..."
docker compose up -d --force-recreate --remove-orphans

echo ""
echo "⏳ Ожидание запуска (20 секунд)..."
sleep 20

echo ""
echo "📊 Новое состояние контейнеров:"
docker compose ps

echo ""
echo "📋 Последние логи:"
docker compose logs --tail=50

echo ""
echo "✅ Очистка и перезапуск завершены!"
echo ""
echo "⚠️  ВАЖНО для Telegram:"
echo "1. Закройте MiniApp в Telegram"
echo "2. Очистите кэш: Настройки → Данные и память → Очистить кэш"
echo "3. Перезапустите Telegram"
echo "4. Откройте MiniApp заново"