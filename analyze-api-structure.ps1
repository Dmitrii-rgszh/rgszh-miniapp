#!/usr/bin/env pwsh
# Полный анализ структуры ответа API

$ErrorActionPreference = "Stop"

$VmIp = "176.108.243.189"

$testData = @{
    age = 30
    gender = "m"
    term_years = 10
    sum_insured = 2000000
    include_accident = $true
    include_critical_illness = $true
    critical_illness_type = "rf"
    payment_frequency = "monthly"
}

$calcUrl = "https://${VmIp}/api/justincase/calculate"

Write-Host "🔍 === ПОЛНЫЙ АНАЛИЗ СТРУКТУРЫ API ОТВЕТА ===" -ForegroundColor Green
Write-Host ""

try {
    $result = Invoke-RestMethod -Uri $calcUrl -Method POST -Body ($testData | ConvertTo-Json) -ContentType "application/json" -TimeoutSec 15 -SkipCertificateCheck
    
    if ($result.success) {
        $data = $result.data
        
        Write-Host "✅ === ОСНОВНЫЕ ПОЛЯ (ДОЛЖНЫ БЫТЬ МЕСЯЧНЫМИ) ===" -ForegroundColor Cyan
        Write-Host "   base_premium: $($data.base_premium) руб" -ForegroundColor White
        Write-Host "   critical_illness_premium: $($data.critical_illness_premium) руб" -ForegroundColor White
        Write-Host "   accident_premium: $($data.accident_premium) руб" -ForegroundColor White
        Write-Host "   final_premium: $($data.final_premium) руб" -ForegroundColor White
        Write-Host ""
        
        Write-Host "📊 === PER_PAYMENT_BREAKDOWN (МЕСЯЧНЫЕ) ===" -ForegroundColor Cyan
        $ppb = $data.per_payment_breakdown
        Write-Host "   death: $($ppb.death) руб" -ForegroundColor White
        Write-Host "   disability: $($ppb.disability) руб" -ForegroundColor White
        Write-Host "   accident: $($ppb.accident) руб" -ForegroundColor White
        Write-Host "   critical: $($ppb.critical) руб" -ForegroundColor White
        Write-Host "   base: $($ppb.base) руб" -ForegroundColor White
        Write-Host "   total: $($ppb.total) руб" -ForegroundColor White
        Write-Host ""
        
        Write-Host "📅 === ANNUAL_BREAKDOWN (ГОДОВЫЕ) ===" -ForegroundColor Cyan
        if ($data.annual_breakdown) {
            $ab = $data.annual_breakdown
            Write-Host "   death: $($ab.death) руб" -ForegroundColor Yellow
            Write-Host "   disability: $($ab.disability) руб" -ForegroundColor Yellow
            Write-Host "   accident: $($ab.accident) руб" -ForegroundColor Yellow
            Write-Host "   critical: $($ab.critical) руб" -ForegroundColor Yellow
            Write-Host "   base: $($ab.base) руб" -ForegroundColor Yellow
        } else {
            Write-Host "   Нет поля annual_breakdown!" -ForegroundColor Red
        }
        Write-Host ""
        
        Write-Host "📈 === BASE_ANNUAL_AMOUNTS (БАЗОВЫЕ ГОДОВЫЕ) ===" -ForegroundColor Cyan
        if ($data.base_annual_amounts) {
            $baa = $data.base_annual_amounts
            Write-Host "   base_premium: $($baa.base_premium) руб" -ForegroundColor Yellow
            Write-Host "   critical_illness_premium: $($baa.critical_illness_premium) руб" -ForegroundColor Yellow
            Write-Host "   accident_premium: $($baa.accident_premium) руб" -ForegroundColor Yellow
            Write-Host "   total_annual_premium: $($baa.total_annual_premium) руб" -ForegroundColor Yellow
        } else {
            Write-Host "   Нет поля base_annual_amounts!" -ForegroundColor Red
        }
        Write-Host ""
        
        Write-Host "⚠️  === ПОТЕНЦИАЛЬНАЯ ПРОБЛЕМА ===" -ForegroundColor Red
        Write-Host "   Если фронтенд использует annual_breakdown или base_annual_amounts" -ForegroundColor Yellow
        Write-Host "   вместо основных полей, то показываются годовые суммы!" -ForegroundColor Yellow
        Write-Host ""
        
        Write-Host "✅ === ПРАВИЛЬНЫЕ ПОЛЯ ДЛЯ ФРОНТЕНДА ===" -ForegroundColor Green
        Write-Host "   Для отображения размера платежа использовать:" -ForegroundColor White
        Write-Host "   - base_premium (для основной программы)" -ForegroundColor Cyan
        Write-Host "   - critical_illness_premium (для КЗ)" -ForegroundColor Cyan
        Write-Host "   - accident_premium (для НС)" -ForegroundColor Cyan
        Write-Host "   - per_payment_breakdown.death (смерть)" -ForegroundColor Cyan
        Write-Host "   - per_payment_breakdown.disability (инвалидность)" -ForegroundColor Cyan
        
    } else {
        Write-Host "❌ Ошибка: $($result.message)" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ Исключение: $($_.Exception.Message)" -ForegroundColor Red
}
