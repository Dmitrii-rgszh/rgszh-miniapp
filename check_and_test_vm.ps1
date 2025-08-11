# Проверка структуры таблицы и загрузка тарифов на ВМ
param(
    [string]$SSHHost = "176.108.243.189", 
    [string]$SSHUser = "admin"
)

Write-Host "🔍 Проверка структуры таблицы на ВМ..." -ForegroundColor Green

# Команды для проверки структуры таблицы
$CheckStructureCommands = @"
cd /home/admin/rgszh-miniapp &&
POSTGRES_CONTAINER=`$(docker ps --format '{{.Names}}' | grep postgres | head -1) &&
echo "✅ Контейнер: `$POSTGRES_CONTAINER" &&
echo "📋 Структура таблицы justincase_base_tariffs:" &&
docker exec `$POSTGRES_CONTAINER psql -U postgres -d miniapp -c "\d justincase_base_tariffs"
"@

& ssh -o StrictHostKeyChecking=no "$SSHUser@$SSHHost" $CheckStructureCommands

Write-Host "`n🔧 Создание тестовой записи для проверки..." -ForegroundColor Yellow

# Команды для создания тестовой записи
$TestInsertCommands = @"
cd /home/admin/rgszh-miniapp &&
POSTGRES_CONTAINER=`$(docker ps --format '{{.Names}}' | grep postgres | head -1) &&
echo "📝 Добавление тестовой записи..." &&
docker exec `$POSTGRES_CONTAINER psql -U postgres -d miniapp -c "
INSERT INTO justincase_base_tariffs (period, age, gender, death_rate, disability_rate, death_accident_rate, death_traffic_rate, trauma_rate, kz_rf_payment, kz_abroad_payment, additional_rate) 
VALUES (5, 35, 'm', 0.00258300, 0.00040700, 0.00096800, 0.00024200, 0.00158400, 8840.00, 51390.00, 0.0800)
ON CONFLICT DO NOTHING;
" &&
echo "🔍 Проверка записи:" &&
docker exec `$POSTGRES_CONTAINER psql -U postgres -d miniapp -c "SELECT * FROM justincase_base_tariffs WHERE age = 35 AND gender = 'm' AND period = 5;"
"@

& ssh -o StrictHostKeyChecking=no "$SSHUser@$SSHHost" $TestInsertCommands
