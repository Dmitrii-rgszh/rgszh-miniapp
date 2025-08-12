#!/bin/bash
# Simple update script without emoji
echo "Starting container update..."

cd /opt/miniapp || exit 1

echo "Stopping containers..."
docker-compose down --remove-orphans

echo "Removing old images..."
docker rmi -f zerotlt/rgszh-miniapp-server:latest || true
docker rmi -f zerotlt/rgszh-miniapp-client:latest || true

echo "Pulling new images..."
docker pull zerotlt/rgszh-miniapp-server:latest
docker pull zerotlt/rgszh-miniapp-client:latest

echo "Starting updated containers..."
docker-compose up -d

echo "Checking status..."
docker-compose ps

echo "Update completed!"
