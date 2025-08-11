# Загрузка тарифов на ВМ с правильной структурой
param(
    [string]$SSHHost = "176.108.243.189", 
    [string]$SSHUser = "admin"
)

Write-Host "📊 Загрузка тарифов на ВМ с правильной структурой..." -ForegroundColor Green

# Команды для загрузки тестовой записи
$LoadTestCommands = @"
cd /home/admin/rgszh-miniapp &&
POSTGRES_CONTAINER=`$(docker ps --format '{{.Names}}' | grep postgres | head -1) &&
echo "📝 Добавление тестовой записи с правильной структурой..." &&
docker exec `$POSTGRES_CONTAINER psql -U postgres -d miniapp -c "
INSERT INTO justincase_base_tariffs (term_years, age, gender, death_rate, disability_rate, accident_death_rate, traffic_death_rate, injury_rate, critical_illness_rf_fee, critical_illness_abroad_fee, coefficient_i) 
VALUES (5, 35, 'm', 0.00258300, 0.00040700, 0.00096800, 0.00024200, 0.00158400, 8840.00, 51390.00, 0.0800)
ON CONFLICT (term_years, age, gender) DO UPDATE SET
    death_rate = EXCLUDED.death_rate,
    disability_rate = EXCLUDED.disability_rate,
    accident_death_rate = EXCLUDED.accident_death_rate,
    traffic_death_rate = EXCLUDED.traffic_death_rate,
    injury_rate = EXCLUDED.injury_rate,
    critical_illness_rf_fee = EXCLUDED.critical_illness_rf_fee,
    critical_illness_abroad_fee = EXCLUDED.critical_illness_abroad_fee,
    coefficient_i = EXCLUDED.coefficient_i;
" &&
echo "🔍 Проверка записи:" &&
docker exec `$POSTGRES_CONTAINER psql -U postgres -d miniapp -c "SELECT * FROM justincase_base_tariffs WHERE age = 35 AND gender = 'm' AND term_years = 5;" &&
echo "📊 Общее количество записей:" &&
docker exec `$POSTGRES_CONTAINER psql -U postgres -d miniapp -c "SELECT COUNT(*) as total_tariffs FROM justincase_base_tariffs;"
"@

& ssh -o StrictHostKeyChecking=no "$SSHUser@$SSHHost" $LoadTestCommands

Write-Host "`n✅ Тест завершен! Теперь соберем и развернем исправленный API..." -ForegroundColor Green
