#!/bin/bash

# Скрипт установки SSL сертификатов Let's Encrypt для rgszh-miniapp.org

set -e

echo "🔐 Установка SSL сертификатов Let's Encrypt..."

# Обновление системы
echo "📦 Обновление системы..."
sudo apt update

# Установка certbot
echo "🛠️ Установка certbot..."
sudo apt install -y certbot

# Остановка nginx если запущен
echo "🛑 Остановка существующих сервисов..."
sudo systemctl stop nginx 2>/dev/null || true
cd /home/admin/rgszh-miniapp && docker compose down 2>/dev/null || true

# Получение сертификата для домена rgszh-miniapp.org
echo "🔐 Получение SSL сертификата для rgszh-miniapp.org..."
sudo certbot certonly \
  --standalone \
  --non-interactive \
  --agree-tos \
  --email admin@rgszh-miniapp.org \
  -d rgszh-miniapp.org \
  -d www.rgszh-miniapp.org

# Создание папки для SSL сертификатов в проекте
echo "📁 Создание папки SSL..."
mkdir -p /home/admin/rgszh-miniapp/ssl

# Копирование сертификатов
echo "📋 Копирование сертификатов..."
sudo cp /etc/letsencrypt/live/rgszh-miniapp.org/fullchain.pem /home/admin/rgszh-miniapp/ssl/
sudo cp /etc/letsencrypt/live/rgszh-miniapp.org/privkey.pem /home/admin/rgszh-miniapp/ssl/
sudo chown admin:admin /home/admin/rgszh-miniapp/ssl/*
sudo chmod 644 /home/admin/rgszh-miniapp/ssl/fullchain.pem
sudo chmod 600 /home/admin/rgszh-miniapp/ssl/privkey.pem

# Создание задачи автообновления
echo "⏰ Настройка автообновления сертификатов..."
echo "0 12 * * * /usr/bin/certbot renew --quiet && cp /etc/letsencrypt/live/rgszh-miniapp.org/fullchain.pem /home/admin/rgszh-miniapp/ssl/ && cp /etc/letsencrypt/live/rgszh-miniapp.org/privkey.pem /home/admin/rgszh-miniapp/ssl/ && cd /home/admin/rgszh-miniapp && docker compose restart proxy" | sudo crontab -

echo "✅ SSL сертификаты установлены успешно!"
echo "📁 Сертификаты доступны в: /home/admin/rgszh-miniapp/ssl/"
echo "🔄 Автообновление настроено через cron"

# Запуск приложения
echo "🚀 Запуск приложения..."
cd /home/admin/rgszh-miniapp && docker compose up -d

echo "🎉 Готово! Сайт доступен по HTTPS: https://rgszh-miniapp.org"
