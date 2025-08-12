#!/usr/bin/env pwsh
# Тест API с коэффициентами периодичности

param(
    [string]$VmIp = "176.108.243.189"
)

Write-Host "🧪 === ТЕСТ API С КОЭФФИЦИЕНТАМИ ПЕРИОДИЧНОСТИ ===" -ForegroundColor Green
Write-Host "   ВМ: $VmIp" -ForegroundColor Yellow
Write-Host ""

# Проверка доступности API
$infoUrl = "https://${VmIp}/api/justincase/info"
Write-Host "📡 Проверяю доступность API: $infoUrl" -ForegroundColor Cyan

# Игнорируем SSL сертификат для самоподписанного
[System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}

try {
    $response = Invoke-RestMethod -Uri $infoUrl -TimeoutSec 10 -SkipCertificateCheck
    Write-Host "✅ API доступен" -ForegroundColor Green
    Write-Host "   Название: $($response.data.name)" -ForegroundColor Yellow
    Write-Host "   Версия: $($response.data.version)" -ForegroundColor Yellow
} catch {
    Write-Host "❌ API недоступен: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Проверьте, что сервер запущен и доступен по адресу $VmIp" -ForegroundColor Yellow
    return
}

# Тестовые данные для расчета
$testData = @{
    age = 30
    gender = "m"
    term_years = 10
    sum_insured = 2000000
    include_accident = $true
    include_critical_illness = $true
    critical_illness_type = "rf"
}

# Периодичности для тестирования
$frequencies = @(
    @{ key = "annual"; name = "Ежегодно"; expected_coeff = 1.0000; payments = 1 },
    @{ key = "semi_annual"; name = "Полугодие"; expected_coeff = 0.5100; payments = 2 },
    @{ key = "quarterly"; name = "Поквартально"; expected_coeff = 0.2575; payments = 4 },
    @{ key = "monthly"; name = "Ежемесячно"; expected_coeff = 0.0867; payments = 12 }
)

$calcUrl = "https://${VmIp}/api/justincase/calculate"
$results = @{}

Write-Host ""
Write-Host "🧮 Тестирование расчета с разными периодичностями..." -ForegroundColor Cyan
Write-Host "   Параметры:" -ForegroundColor Yellow
Write-Host "     Возраст: $($testData.age) лет" -ForegroundColor Gray
Write-Host "     Пол: $($testData.gender)" -ForegroundColor Gray
Write-Host "     Срок: $($testData.term_years) лет" -ForegroundColor Gray
Write-Host "     Страховая сумма: $($testData.sum_insured.ToString('N0')) руб" -ForegroundColor Gray
Write-Host "     НС: $($testData.include_accident)" -ForegroundColor Gray
Write-Host "     КЗ: $($testData.include_critical_illness)" -ForegroundColor Gray
Write-Host ""

foreach ($freq in $frequencies) {
    $testRequest = $testData.Clone()
    $testRequest.payment_frequency = $freq.key
    
    Write-Host "   📊 Тест: $($freq.name)" -ForegroundColor White
    Write-Host "      Ожидаемый коэффициент: $($freq.expected_coeff)" -ForegroundColor Gray
    Write-Host "      Платежей в год: $($freq.payments)" -ForegroundColor Gray
    
    try {
        $result = Invoke-RestMethod -Uri $calcUrl -Method POST -Body ($testRequest | ConvertTo-Json) -ContentType "application/json" -TimeoutSec 15 -SkipCertificateCheck
        
        if ($result.success) {
            $results[$freq.key] = $result.data
            
            # Основные данные - теперь final_premium это размер одного платежа
            $payment_amount = $result.data.final_premium
            $annual_total = $result.data.total_annual_premium
            $coefficient = $result.data.frequency_coefficient
            $per_payment_coeff = $result.data.per_payment_coefficient
            $payments_per_year = $result.data.payments_per_year
            
            Write-Host "      ✅ Расчет успешен" -ForegroundColor Green
            Write-Host "         💰 Размер одного платежа: $($payment_amount.ToString('N2')) руб" -ForegroundColor Green
            Write-Host "         📅 Общая годовая сумма: $($annual_total.ToString('N2')) руб" -ForegroundColor Green
            Write-Host "         🔢 Коэффициент частоты: $coefficient" -ForegroundColor Green
            Write-Host "         📊 Коэффициент платежа: $per_payment_coeff" -ForegroundColor Green
            Write-Host "         🗓️  Платежей в год: $payments_per_year" -ForegroundColor Green
            
            # Детализация по рискам за один платеж
            if ($result.data.per_payment_breakdown) {
                $ppb = $result.data.per_payment_breakdown
                Write-Host "         📋 Размер одного платежа по рискам:" -ForegroundColor Cyan
                Write-Host "           Смерть: $($ppb.death.ToString('N2')) руб" -ForegroundColor Gray
                Write-Host "           Инвалидность: $($ppb.disability.ToString('N2')) руб" -ForegroundColor Gray
                Write-Host "           НС: $($ppb.accident.ToString('N2')) руб" -ForegroundColor Gray
                Write-Host "           КЗ: $($ppb.critical.ToString('N2')) руб" -ForegroundColor Gray
            }
            
            # Годовые суммы с учетом коэффициентов
            if ($result.data.annual_breakdown) {
                $abr = $result.data.annual_breakdown
                Write-Host "         📅 Годовые суммы по рискам:" -ForegroundColor Cyan
                Write-Host "           Смерть: $($abr.death.ToString('N2')) руб" -ForegroundColor Gray
                Write-Host "           Инвалидность: $($abr.disability.ToString('N2')) руб" -ForegroundColor Gray
                Write-Host "           НС: $($abr.accident.ToString('N2')) руб" -ForegroundColor Gray
                Write-Host "           КЗ: $($abr.critical.ToString('N2')) руб" -ForegroundColor Gray
            }
            
        } else {
            Write-Host "      ❌ Ошибка расчета: $($result.message)" -ForegroundColor Red
        }
    } catch {
        Write-Host "      ❌ Исключение: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
}

# Сравнительная таблица
if ($results.Count -gt 0) {
    Write-Host "📊 === СРАВНИТЕЛЬНАЯ ТАБЛИЦА РЕЗУЛЬТАТОВ ===" -ForegroundColor Green
    Write-Host ""
    
    $header = "{0,-15} {1,-8} {2,-10} {3,-15} {4,-15} {5,-10}" -f "Периодичность", "Коэфф.", "Платежей", "За платеж", "Годовая", "Доплата"
    Write-Host $header -ForegroundColor Yellow
    Write-Host ("-" * 80) -ForegroundColor Gray
    
    $baseAnnual = if ($results.annual) { $results.annual.total_annual_premium } else { 0 }
    
    foreach ($freq in $frequencies) {
        if ($results[$freq.key]) {
            $r = $results[$freq.key]
            $payment_amount = $r.final_premium  # Размер одного платежа
            $annual_total = $r.total_annual_premium  # Годовая сумма
            $coefficient = $r.frequency_coefficient
            $payments = $r.payments_per_year
            $markup = if ($baseAnnual -gt 0) { (($annual_total / $baseAnnual - 1) * 100) } else { 0 }
            
            $row = "{0,-15} {1,-8:F4} {2,-10} {3,-15:N0} {4,-15:N0} {5,-10:F1}%" -f $freq.name, $coefficient, $payments, $payment_amount, $annual_total, $markup
            Write-Host $row -ForegroundColor White
        }
    }
    
    Write-Host ("-" * 80) -ForegroundColor Gray
}

Write-Host ""
Write-Host "🎉 Тестирование завершено!" -ForegroundColor Green
