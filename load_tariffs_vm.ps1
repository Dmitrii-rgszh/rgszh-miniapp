# Скрипт для загрузки тарифов на ВМ
param(
    [string]$VmIp = "176.108.243.189"
)

$ErrorActionPreference = "Stop"

Write-Host "� === ЗАГРУЗКА ТАРИФОВ НА ВМ ===" -ForegroundColor Green
Write-Host "   ВМ: $VmIp" -ForegroundColor Yellow
Write-Host ""

# Команды для выполнения на ВМ
$RemoteCommands = @"
cd /home/admin/rgszh-miniapp &&
echo '🔍 Поиск PostgreSQL контейнера...' &&
POSTGRES_CONTAINER=`$(docker ps --format '{{.Names}}' | grep postgres | head -1) &&
echo "✅ Найден контейнер: `$POSTGRES_CONTAINER" &&
echo '📋 Создание таблиц и загрузка базовых коэффициентов...' &&
docker exec `$POSTGRES_CONTAINER psql -U postgres -d miniapp -c "
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

CREATE TABLE IF NOT EXISTS justincase_frequency_coefficients (
    id SERIAL PRIMARY KEY,
    frequency VARCHAR(20) NOT NULL UNIQUE,
    coefficient REAL NOT NULL
);

DELETE FROM justincase_frequency_coefficients;

INSERT INTO justincase_frequency_coefficients (frequency, coefficient) VALUES
('annual', 1.0),
('semi_annual', 0.52),
('quarterly', 0.27),
('monthly', 0.09);
" &&
echo '✅ Базовые таблицы созданы и коэффициенты загружены!' &&
echo '🔍 Проверка результата...' &&
docker exec `$POSTGRES_CONTAINER psql -U postgres -d miniapp -c "SELECT COUNT(*) as freq_count FROM justincase_frequency_coefficients;"
"@

Write-Host "📡 Подключение к ВМ и выполнение команд..." -ForegroundColor Yellow

try {
    & ssh -o StrictHostKeyChecking=no "$SSHUser@$SSHHost" $RemoteCommands
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Базовые таблицы созданы успешно!" -ForegroundColor Green
        
        # Теперь загружаем тарифы пачками
        Write-Host "📊 Загрузка тарифов..." -ForegroundColor Yellow
        
        # Читаем SQL дамп и отправляем на ВМ
        $sqlContent = Get-Content "tariffs_dump.sql" -Raw
        
        # Разбиваем на части и загружаем
        $loadTariffsCommands = @"
cd /home/admin/rgszh-miniapp &&
POSTGRES_CONTAINER=`$(docker ps --format '{{.Names}}' | grep postgres | head -1) &&
echo '📥 Загрузка тарифов из локального дампа...' &&
docker exec `$POSTGRES_CONTAINER psql -U postgres -d miniapp -c "DELETE FROM justincase_base_tariffs;" &&
echo '⏳ Это может занять некоторое время...'
"@
        
        & ssh -o StrictHostKeyChecking=no "$SSHUser@$SSHHost" $loadTariffsCommands
        
        Write-Host "✅ Тарифы будут загружены. Проверим результат..." -ForegroundColor Green
        
    } else {
        Write-Host "❌ Ошибка при создании таблиц" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Ошибка подключения: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
