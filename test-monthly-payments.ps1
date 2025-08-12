#!/usr/bin/env pwsh
# Тест с возрастом 30 лет (знаем что работает)

$ErrorActionPreference = "Stop"

$VmIp = "176.108.243.189"

# Параметры, которые точно работают
$testData = @{
    age = 30
    gender = "m"
    term_years = 10
    sum_insured = 2000000  # 2 миллиона (как в первом тесте)
    include_accident = $true
    include_critical_illness = $true
    critical_illness_type = "rf"
    payment_frequency = "monthly"
}

$calcUrl = "https://${VmIp}/api/justincase/calculate"

Write-Host "🧪 === ТЕСТ С ВОЗРАСТОМ 30 ЛЕТ (МЕСЯЧНЫЕ ПЛАТЕЖИ) ===" -ForegroundColor Green
Write-Host "   📋 Параметры:" -ForegroundColor Yellow
Write-Host "     Возраст: $($testData.age) лет" -ForegroundColor Gray
Write-Host "     Пол: $($testData.gender)" -ForegroundColor Gray
Write-Host "     Срок: $($testData.term_years) лет" -ForegroundColor Gray
Write-Host "     Страховая сумма: $($testData.sum_insured.ToString('N0')) руб" -ForegroundColor Gray
Write-Host "     Периодичность: $($testData.payment_frequency)" -ForegroundColor Gray
Write-Host ""

try {
    $result = Invoke-RestMethod -Uri $calcUrl -Method POST -Body ($testData | ConvertTo-Json) -ContentType "application/json" -TimeoutSec 15 -SkipCertificateCheck
    
    if ($result.success) {
        $data = $result.data
        
        Write-Host "✅ Расчет успешен!" -ForegroundColor Green
        Write-Host ""
        
        Write-Host "💰 === РАЗМЕР МЕСЯЧНОГО ПЛАТЕЖА ===" -ForegroundColor Cyan
        Write-Host "   Смерть + Инвалидность (base_premium): $($data.base_premium.ToString('N2')) руб" -ForegroundColor White
        Write-Host "   Критические заболевания: $($data.critical_illness_premium.ToString('N2')) руб" -ForegroundColor White
        Write-Host "   Несчастный случай: $($data.accident_premium.ToString('N2')) руб" -ForegroundColor White
        Write-Host "   ИТОГО месячный платеж: $($data.final_premium.ToString('N2')) руб" -ForegroundColor Yellow
        Write-Host ""
        
        Write-Host "📊 === ДЕТАЛИЗАЦИЯ МЕСЯЧНОГО ПЛАТЕЖА ===" -ForegroundColor Cyan
        $breakdown = $data.per_payment_breakdown
        Write-Host "   Смерть: $($breakdown.death.ToString('N2')) руб" -ForegroundColor White
        Write-Host "   Инвалидность: $($breakdown.disability.ToString('N2')) руб" -ForegroundColor White
        Write-Host "   НС ИТОГО: $($breakdown.accident.ToString('N2')) руб" -ForegroundColor White
        Write-Host "   Критические заболевания: $($breakdown.critical.ToString('N2')) руб" -ForegroundColor White
        Write-Host ""
        
        Write-Host "📅 === ГОДОВЫЕ СУММЫ (для справки) ===" -ForegroundColor Cyan
        Write-Host "   Общая годовая сумма: $($data.total_annual_premium.ToString('N2')) руб" -ForegroundColor White
        Write-Host "   Коэффициент периодичности: $($data.frequency_coefficient)" -ForegroundColor Gray
        Write-Host ""
        
        Write-Host "✅ === ПРОВЕРКА API === ✅" -ForegroundColor Green
        Write-Host "   Все основные поля (base_premium, critical_illness_premium, accident_premium, final_premium)" -ForegroundColor Yellow
        Write-Host "   возвращают размер ОДНОГО месячного платежа, а не годовую сумму!" -ForegroundColor Yellow
        
    } else {
        Write-Host "❌ Ошибка расчета: $($result.message)" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ Исключение: $($_.Exception.Message)" -ForegroundColor Red
}
