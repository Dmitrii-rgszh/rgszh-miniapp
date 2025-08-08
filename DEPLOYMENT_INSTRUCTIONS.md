# Инструкция по деплою приложения на новый сервер

## Подготовка

1. **Образы Docker уже собраны и загружены в Docker Hub:**
   - `zerotlt/rgszh-miniapp-api:latest` - Backend сервер
   - `zerotlt/rgszh-miniapp-frontend:latest` - Frontend приложение

## Шаги деплоя на сервере 176.108.243.189

### 1. Установка Docker и Docker Compose
```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Добавление пользователя в группу docker
sudo usermod -aG docker $USER

# Установка Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Перезагрузка для применения изменений в группах
sudo reboot
```

### 2. Создание структуры проекта
```bash
# Создание папки проекта
mkdir -p /home/admin/rgszh-miniapp
cd /home/admin/rgszh-miniapp

# Создание папок для SSL сертификатов
mkdir -p certs
```

### 3. Копирование конфигурационных файлов

Скопировать на сервер файлы из архива `deployment-config.zip`:
- `docker-compose.yml`
- `.env` (с настройками SMTP и базы данных)
- `nginx-vm.conf`
- `certs/` (SSL сертификаты)

### 4. Получение SSL сертификатов

```bash
# Установка certbot
sudo apt install certbot python3-certbot-nginx -y

# Получение SSL сертификата для домена
sudo certbot certonly --standalone -d 176.108.243.189

# Копирование сертификатов в папку проекта
sudo cp /etc/letsencrypt/live/176.108.243.189/fullchain.pem certs/
sudo cp /etc/letsencrypt/live/176.108.243.189/privkey.pem certs/
sudo chown admin:admin certs/*
```

### 5. Запуск приложения

```bash
# Переход в папку проекта
cd /home/admin/rgszh-miniapp

# Загрузка образов и запуск контейнеров
docker compose up -d

# Проверка статуса контейнеров
docker compose ps

# Просмотр логов
docker compose logs -f
```

### 6. Инициализация базы данных

```bash
# Подключение к контейнеру с сервером для инициализации БД
docker compose exec server python init_assessment_db.py

# Загрузка 25 русских вопросов
docker compose exec server python -c "
import psycopg2
from sqlalchemy import create_engine, text
import os

# Подключение к БД
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:password@postgres:5432/miniapp')
engine = create_engine(DATABASE_URL)

# SQL для загрузки 25 вопросов (здесь будет полный SQL из questions_correct_structure.sql)
# ... (включить содержимое файла questions_correct_structure.sql)
"
```

### 7. Проверка работы

1. Откройте https://176.108.243.189 в браузере
2. Проверьте работу assessment: https://176.108.243.189/assessment
3. Пройдите тест полностью для проверки email отправки

## Настройки в .env файле

```env
# База данных
DATABASE_URL=postgresql://postgres:password@postgres:5432/miniapp
POSTGRES_DB=miniapp
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password

# SMTP настройки для отправки email
SMTP_SERVER=smtp.yandex.ru
SMTP_PORT=587
SMTP_USERNAME=rgszh-miniapp@yandex.ru
SMTP_PASSWORD=rbclbdyejwwxrisg
SMTP_FROM_EMAIL=rgszh-miniapp@yandex.ru
```

## Устранение неполадок

### Проблемы с SSL
- Убедитесь, что порты 80 и 443 открыты
- Проверьте правильность путей к сертификатам в nginx-vm.conf

### Проблемы с базой данных
- Проверьте логи PostgreSQL: `docker compose logs postgres`
- Убедитесь, что база данных инициализирована

### Проблемы с email
- Проверьте настройки SMTP в .env файле
- Убедитесь, что пароль приложения Yandex корректен

## Полезные команды

```bash
# Перезапуск всех сервисов
docker compose restart

# Обновление образов
docker compose pull
docker compose up -d

# Просмотр логов конкретного сервиса
docker compose logs -f server
docker compose logs -f frontend
docker compose logs -f postgres

# Очистка старых образов
docker system prune -f
```
