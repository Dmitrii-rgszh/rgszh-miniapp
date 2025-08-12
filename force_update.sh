#!/bin/bash

# Скрипт принудительного обновления контейнеров на VM
echo "🚀 Принудительное обновление контейнеров на VM..."

# Остановка контейнеров
echo "⏹️ Остановка контейнеров..."
docker-compose down --remove-orphans

# Удаление старых образов для принудительного обновления
echo "🗑️ Удаление старых образов..."
docker rmi -f zerotlt/rgszh-miniapp-server:latest || true
docker rmi -f zerotlt/rgszh-miniapp-client:latest || true

# Подтягивание новых образов
echo "⬇️ Загрузка новых образов..."
docker pull zerotlt/rgszh-miniapp-server:latest
docker pull zerotlt/rgszh-miniapp-client:latest

# Запуск контейнеров
echo "▶️ Запуск обновленных контейнеров..."
docker-compose up -d

echo "✅ Обновление завершено!"

# Проверка статуса
echo "📊 Статус контейнеров:"
docker-compose ps

echo "📝 Логи сервера:"
docker-compose logs server --tail=20
