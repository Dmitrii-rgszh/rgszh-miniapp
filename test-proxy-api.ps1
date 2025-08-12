#!/usr/bin/env pwsh
# Тест прокси API (то что использует фронтенд)

$ErrorActionPreference = "Stop"

$VmIp = "176.108.243.189"

$testData = @{
    age = 30
    gender = "Мужской"
    insuranceTerm = 10
    insuranceSum = 2000000
    accidentPackage = "yes"
    criticalPackage = "yes"
    treatmentRegion = "russia"
    sportPackage = "no"
    paymentFrequency = "ежемесячно"
}

$proxyUrl = "https://${VmIp}/api/proxy/calculator/save"

Write-Host "🧪 === ТЕСТ ПРОКСИ API (КАК ФРОНТЕНД) ===" -ForegroundColor Green
Write-Host "   📋 Параметры:" -ForegroundColor Yellow
Write-Host "     Возраст: $($testData.age) лет" -ForegroundColor Gray
Write-Host "     Пол: $($testData.gender)" -ForegroundColor Gray
Write-Host "     Срок: $($testData.insuranceTerm) лет" -ForegroundColor Gray
Write-Host "     Страховая сумма: $($testData.insuranceSum.ToString('N0')) руб" -ForegroundColor Gray
Write-Host "     Периодичность: $($testData.paymentFrequency)" -ForegroundColor Gray
Write-Host ""

try {
    $result = Invoke-RestMethod -Uri $proxyUrl -Method POST -Body ($testData | ConvertTo-Json) -ContentType "application/json" -TimeoutSec 15 -SkipCertificateCheck
    
    if ($result.success -and $result.calculation_result) {
        $calc = $result.calculation_result
        
        Write-Host "✅ Прокси API работает!" -ForegroundColor Green
        Write-Host ""
        
        Write-Host "💰 === РАЗМЕРЫ МЕСЯЧНЫХ ПЛАТЕЖЕЙ === " -ForegroundColor Cyan
        Write-Host "   basePremium (смерть + инвалидность): $($calc.basePremium) руб" -ForegroundColor White
        Write-Host "   criticalPremium (критические заболевания): $($calc.criticalPremium) руб" -ForegroundColor White
        Write-Host "   accidentPremium (несчастный случай): $($calc.accidentPremium) руб" -ForegroundColor White
        Write-Host "   totalPremium (ИТОГО): $($calc.totalPremium) руб" -ForegroundColor Yellow
        Write-Host ""
        
        Write-Host "📊 === ДЕТАЛИЗАЦИЯ ПО РИСКАМ (МЕСЯЧНО) ===" -ForegroundColor Cyan
        Write-Host "   deathPremium (смерть): $($calc.deathPremium) руб" -ForegroundColor White
        Write-Host "   disabilityPremium (инвалидность): $($calc.disabilityPremium) руб" -ForegroundColor White
        Write-Host "   accidentDeathPremium (НС смерть): $($calc.accidentDeathPremium.ToString('F2')) руб" -ForegroundColor White
        Write-Host "   trafficDeathPremium (НС ДТП): $($calc.trafficDeathPremium.ToString('F2')) руб" -ForegroundColor White
        Write-Host "   injuryPremium (НС травмы): $($calc.injuryPremium.ToString('F2')) руб" -ForegroundColor White
        Write-Host ""
        
        Write-Host "✅ === ПРОВЕРКА ИСПРАВЛЕНИЯ === ✅" -ForegroundColor Green
        
        # Проверяем, что deathPremium и disabilityPremium теперь месячные, а не годовые
        $expectedDeath = 397.95  # Из прямого API
        $expectedDisability = 50.29  # Из прямого API
        
        $deathDiff = [Math]::Abs($calc.deathPremium - $expectedDeath)
        $disabilityDiff = [Math]::Abs($calc.disabilityPremium - $expectedDisability)
        
        if ($deathDiff -lt 1 -and $disabilityDiff -lt 1) {
            Write-Host "   ✅ deathPremium и disabilityPremium показывают МЕСЯЧНЫЕ суммы!" -ForegroundColor Green
        } else {
            Write-Host "   ❌ deathPremium и disabilityPremium все еще показывают ГОДОВЫЕ суммы!" -ForegroundColor Red
            Write-Host "   Ожидалось: death=$expectedDeath, disability=$expectedDisability" -ForegroundColor Red
            Write-Host "   Получено: death=$($calc.deathPremium), disability=$($calc.disabilityPremium)" -ForegroundColor Red
        }
        
    } else {
        Write-Host "❌ Ошибка прокси API: $($result.message)" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ Исключение: $($_.Exception.Message)" -ForegroundColor Red
}
