# Скрипт для загрузки тарифов на ВМ
param(
    [string]$VmIp = "176.108.243.189"
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 === ЗАГРУЗКА ТАРИФОВ НА ВМ ===" -ForegroundColor Green
Write-Host "   ВМ: $VmIp" -ForegroundColor Yellow
Write-Host ""

try {
    # 1. Проверяем локальную базу данных
    Write-Host "🔍 Проверка локальной базы данных..." -ForegroundColor Cyan
    if (-not (Test-Path "miniapp.db")) {
        throw "Локальная база данных miniapp.db не найдена!"
    }
    
    $fileSize = (Get-Item "miniapp.db").Length
    Write-Host "   📊 Размер файла: $([math]::Round($fileSize/1MB, 2)) MB" -ForegroundColor Green
    
    # 2. Загружаем базу данных в Docker контейнер
    Write-Host ""
    Write-Host "📤 Загрузка базы данных в Docker контейнер на ВМ..." -ForegroundColor Cyan
    
    # Создаем временный файл для передачи в Docker
    Write-Host "   🔄 Копируем базу данных в контейнер сервера..."
    
    # Сначала загружаем файл на ВМ
    Write-Host "   📡 Загружаем файл на ВМ..."
    scp miniapp.db "root@${VmIp}:/root/miniapp_new.db"
    if ($LASTEXITCODE -ne 0) {
        throw "Ошибка загрузки файла на ВМ"
    }
    
    # Копируем файл в контейнер
    Write-Host "   📦 Копируем файл в контейнер..."
    ssh "root@$VmIp" "docker cp /root/miniapp_new.db rgszh-miniapp-server-1:/app/miniapp_new.db"
    if ($LASTEXITCODE -ne 0) {
        throw "Ошибка копирования в контейнер"
    }
    
    # 3. Заменяем базу данных в контейнере
    Write-Host "   🔄 Заменяем базу данных в контейнере..."
    ssh "root@$VmIp" "docker exec rgszh-miniapp-server-1 mv /app/miniapp_new.db /app/miniapp.db"
    if ($LASTEXITCODE -ne 0) {
        throw "Ошибка замены базы данных"
    }
    
    # 4. Перезапускаем сервер
    Write-Host "   🔄 Перезапускаем сервер..."
    ssh "root@$VmIp" "cd /root && docker-compose restart server"
    if ($LASTEXITCODE -ne 0) {
        throw "Ошибка перезапуска сервера"
    }
    
    # 5. Ждем запуска
    Write-Host "   ⏳ Ждем запуска сервера..."
    Start-Sleep -Seconds 15
    
    # 6. Проверяем статус
    Write-Host "   📊 Проверяем статус контейнеров..."
    ssh "root@$VmIp" "docker ps --filter name=rgszh-miniapp-server"
    
    Write-Host ""
    Write-Host "✅ База данных загружена!" -ForegroundColor Green
    
    # 7. Тестируем API
    Write-Host ""
    Write-Host "🧪 Тестирование API с корпоративными коэффициентами..." -ForegroundColor Cyan
    
    try {
        $testBody = @{
            age = 35
            gender = "Мужской"
            insuranceTerm = 5
            insuranceSum = 1000000
            includeAccidentInsurance = "да"
            criticalIllnessOption = "Лечение за рубежом"
            insuranceFrequency = "Ежегодно"
            email = "test@rgsl.ru"
        } | ConvertTo-Json
        
        Write-Host "   📡 Отправляем тестовый запрос..."
        $response = Invoke-WebRequest -Uri "https://$VmIp/api/proxy/calculator/save" -Method POST -Headers @{"Content-Type"="application/json"} -Body $testBody -SkipCertificateCheck
        
        $result = $response.Content | ConvertFrom-Json
        
        if ($result.success) {
            Write-Host "   ✅ API работает!" -ForegroundColor Green
            Write-Host "   💰 Стоимость: $($result.data.insuranceCost)" -ForegroundColor Yellow
            Write-Host "   📧 Email: $($result.data.email)" -ForegroundColor Yellow
            Write-Host "   📊 Частота: $($result.data.insuranceFrequency)" -ForegroundColor Yellow
        } else {
            Write-Host "   ⚠️  API вернул ошибку: $($result.error)" -ForegroundColor Red
        }
        
    } catch {
        Write-Host "   ⚠️  Ошибка тестирования API: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "   💡 Возможно, сервер еще запускается. Попробуйте тест позже." -ForegroundColor Yellow
    }
    
    # 8. Дополнительное тестирование с разными доменами
    Write-Host ""
    Write-Host "🎯 Тестирование корпоративных коэффициентов..." -ForegroundColor Cyan
    
    $testEmails = @(
        @{ email = "test@rgsl.ru"; expected = "+5%" },
        @{ email = "test@vtb.ru"; expected = "+20%" },
        @{ email = "test@external.com"; expected = "+30%/+35%" }
    )
    
    foreach ($test in $testEmails) {
        Write-Host "   📧 Тестируем $($test.email) (ожидаем $($test.expected))..."
        
        try {
            $testBody = @{
                age = 30
                gender = "Мужской"
                insuranceTerm = 10
                insuranceSum = 500000
                includeAccidentInsurance = "нет"
                criticalIllnessOption = "нет"
                insuranceFrequency = "Ежегодно"
                email = $test.email
            } | ConvertTo-Json
            
            $response = Invoke-WebRequest -Uri "https://$VmIp/api/justincase/calculate" -Method POST -Headers @{"Content-Type"="application/json"} -Body $testBody -SkipCertificateCheck
            $result = $response.Content | ConvertFrom-Json
            
            if ($result.success) {
                Write-Host "      ✅ Премия: $($result.data.final_premium) руб." -ForegroundColor Green
            } else {
                Write-Host "      ⚠️  Ошибка: $($result.error)" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "      ⚠️  Запрос не прошел: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
    
} catch {
    Write-Host ""
    Write-Host "❌ Ошибка: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 === ЗАГРУЗКА ЗАВЕРШЕНА ===" -ForegroundColor Green
Write-Host "   🌐 Фронтенд: https://$VmIp/" -ForegroundColor Yellow
Write-Host "   🔧 API: https://$VmIp/api/" -ForegroundColor Yellow
Write-Host "   💡 Корпоративные коэффициенты готовы к работе!" -ForegroundColor Yellow
