#!/bin/bash

# Скрипт для выполнения на ВМ - загрузка тарифов в PostgreSQL
echo "Загрузка тарифов в PostgreSQL на ВМ..."

# Проверяем есть ли контейнер PostgreSQL
CONTAINER_NAME=$(docker ps --format "table {{.Names}}" | grep postgres | head -1)

if [ -z "$CONTAINER_NAME" ]; then
    echo "❌ PostgreSQL контейнер не найден!"
    exit 1
fi

echo "✅ Найден PostgreSQL контейнер: $CONTAINER_NAME"

# Создаем SQL дамп прямо на ВМ
cat > /tmp/tariffs_dump.sql << 'EOF'
-- Создание и заполнение таблицы тарифов JustInCase

CREATE TABLE IF NOT EXISTS justincase_base_tariffs (
    id SERIAL PRIMARY KEY,
    period INTEGER NOT NULL,
    age INTEGER NOT NULL,
    gender VARCHAR(1) NOT NULL,
    death_rate NUMERIC(10,8) NOT NULL,
    disability_rate NUMERIC(10,8) NOT NULL,
    death_accident_rate NUMERIC(10,8),
    death_traffic_rate NUMERIC(10,8),
    trauma_rate NUMERIC(10,8),
    kz_rf_payment NUMERIC(12,2),
    kz_abroad_payment NUMERIC(12,2),
    additional_rate NUMERIC(6,4),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tariffs_age_gender_period ON justincase_base_tariffs (age, gender, period);

-- Очистка таблицы
DELETE FROM justincase_base_tariffs;

-- Создание и заполнение таблицы коэффициентов частоты
CREATE TABLE IF NOT EXISTS justincase_frequency_coefficients (
    id SERIAL PRIMARY KEY,
    frequency VARCHAR(20) NOT NULL UNIQUE,
    coefficient REAL NOT NULL
);

-- Очистка таблицы
DELETE FROM justincase_frequency_coefficients;

-- Заполнение коэффициентами
INSERT INTO justincase_frequency_coefficients (frequency, coefficient) VALUES
('annual', 1.0),
('semi_annual', 0.52),
('quarterly', 0.27),
('monthly', 0.09);

EOF

echo "📥 Создан базовый SQL дамп"

# Копируем SQL файл в контейнер
docker cp /tmp/tariffs_dump.sql $CONTAINER_NAME:/tmp/tariffs_dump.sql

echo "📋 Выполняем SQL команды..."

# Выполняем SQL дамп
docker exec $CONTAINER_NAME psql -U postgres -d miniapp -f /tmp/tariffs_dump.sql

echo "✅ Базовые таблицы созданы!"

# Проверяем результат
echo "🔍 Проверяем загрузку..."
docker exec $CONTAINER_NAME psql -U postgres -d miniapp -c "SELECT COUNT(*) as tariffs_count FROM justincase_base_tariffs;"
docker exec $CONTAINER_NAME psql -U postgres -d miniapp -c "SELECT COUNT(*) as freq_count FROM justincase_frequency_coefficients;"

echo "✅ Загрузка завершена!"
