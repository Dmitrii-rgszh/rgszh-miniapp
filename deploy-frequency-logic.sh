#!/bin/bash

# Деплой с новой логикой коэффициентов периодичности
echo "🚀 Деплой новой логики коэффициентов периодичности на ВМ"

# Обновляем docker-compose для использования нового образа
sed -i 's|dmitriirgs/rgszh-miniapp-server:.*|zerotlt/rgszh-miniapp-server:20250812-frequency-logic|g' docker-compose.yml

echo "✅ docker-compose.yml обновлен"

# Останавливаем сервер
docker-compose down rgszh-miniapp-server

# Подтягиваем новый образ  
docker pull zerotlt/rgszh-miniapp-server:20250812-frequency-logic

# Запускаем обновленный сервер
docker-compose up -d rgszh-miniapp-server

# Ждем запуска
sleep 10

# Проверяем статус
docker-compose ps rgszh-miniapp-server

echo "🏁 Деплой завершен!"
