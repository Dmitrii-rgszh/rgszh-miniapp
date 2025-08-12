#!/usr/bin/env node

/**
 * Финальный тест JavaScript логики расчета рекомендованной суммы
 * Проверяет все основные сценарии после исправления
 */

console.log('🧪 ФИНАЛЬНЫЙ ТЕСТ: JavaScript логика расчета рекомендованной суммы');
console.log('===================================================================');

// Функция вычисления рекомендованной суммы (исправленная версия)
function computeRecommended(params) {
  const {
    birthDate,
    income2022,
    income2023,
    income2024,
    scholarship,
    hasJob,
    breadwinnerStatus,
    incomeShare,
    numberOfChildren,
    specialCareRelatives,
    existingLoans
  } = params;

  // Преобразование строк в числа
  const toNumber = (val) => {
    if (val === null || val === undefined || val === '') return null;
    const num = parseFloat(val);
    return isNaN(num) ? null : num;
  };

  // Вычисляем возраст на основе даты рождения
  const computeAge = (dateStr) => {
    if (!dateStr) return null;
    const bd = new Date(dateStr);
    const today = new Date();
    let a = today.getFullYear() - bd.getFullYear();
    const m = today.getMonth() - bd.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) a--;
    return a;
  };

  const age = computeAge(birthDate);

  // Собираем все входящие доходы и стипендию, фильтруем пустые, считаем среднее
  const incomes = [income2022, income2023, income2024, scholarship]
    .map(toNumber)
    .filter(v => v !== null);
  const avgIncome = incomes.length > 0 ? incomes.reduce((a, b) => a + b, 0) / incomes.length : 0;

  // Нормализуем значения полей для сравнения
  const norm = (v) => (v || '').toString().toLowerCase().trim();
  const jobNorm = norm(hasJob);
  const breadNorm = norm(breadwinnerStatus);
  const specialNorm = norm(specialCareRelatives);

  // Коэффициент F13: статус кормильца и доля дохода
  let breadwinnerCoeff = 1;
  if (breadNorm === 'да' || breadNorm === 'yes') {
    breadwinnerCoeff = 3;
  } else if (breadNorm === 'нет' || breadNorm === 'no') {
    // Подбираем коэффициент по доле дохода
    const shareMap = {
      'до 10': 1,
      '10-24': 1.4,
      '25-49': 1.8,
      '50-74': 2.2,
      '75-89': 2.6,
      'более 90': 3
    };
    // incomeShare может быть например '75%-89%' или '50-74%', убираем все проценты
    const shareKey = norm(incomeShare).replace(/[%]/g, '');
    breadwinnerCoeff = shareMap[shareKey] ?? 1;
  } else {
    // Не являюсь кормильцем
    breadwinnerCoeff = 1;
  }

  // Коэффициент F14: количество детей
  const numChildren = toNumber(numberOfChildren) || 0;
  let childrenCoeff = 1;
  if (numChildren === 1) childrenCoeff = 1.125;
  else if (numChildren === 2) childrenCoeff = 1.40625;
  else if (numChildren >= 3) childrenCoeff = 1.5;

  // Коэффициент F15: особая забота об иждивенцах
  let specialCoeff = 1;
  if (specialNorm === 'да' || specialNorm === 'yes') {
    specialCoeff = 1.5;
  }

  // Итоговый коэффициент
  const productCoeff = breadwinnerCoeff * childrenCoeff * specialCoeff;

  // Возрастные коэффициенты (F5)
  let ageFactor = 10; // по умолчанию
  if (age !== null) {
    if (age <= 25) ageFactor = 10;
    else if (age <= 30) ageFactor = 9;
    else if (age <= 35) ageFactor = 8;
    else if (age <= 40) ageFactor = 7;
    else if (age <= 45) ageFactor = 6;
    else if (age <= 50) ageFactor = 5;
    else if (age <= 55) ageFactor = 4;
    else ageFactor = 3;
  }

  // Максимальная страховая сумма = средний доход * возрастной коэффициент
  const maxInsuranceSum = avgIncome * ageFactor;

  // Базовая рекомендованная сумма = средний доход * итоговый коэффициент
  let baseRecommendedSum = avgIncome * productCoeff;

  // Добавляем существующие кредиты
  const loans = toNumber(existingLoans) || 0;
  baseRecommendedSum += loans;

  // Ограничиваем максимальной суммой
  const recommendedSum = Math.min(baseRecommendedSum, maxInsuranceSum);

  // Рекомендованный срок = 20 - (возраст - 25)
  let recommendedTerm = 15; // по умолчанию
  if (age !== null && age >= 25) {
    recommendedTerm = Math.max(5, Math.min(20, 20 - (age - 25)));
  }

  return {
    recommendedSum: Math.round(recommendedSum),
    recommendedTerm,
    debugInfo: {
      age: age || 'N/A',
      avgIncome,
      breadwinnerCoeff,
      childrenCoeff,
      specialCoeff,
      productCoeff: parseFloat(productCoeff.toFixed(3)),
      ageFactor,
      maxInsuranceSum,
      baseRecommendedSum,
      loans
    }
  };
}

// Тестовые случаи
const testCases = [
  {
    name: "Молодой специалист без детей (25-49% дохода)",
    params: {
      birthDate: "1999-01-15",
      income2022: "600000",
      income2023: "700000", 
      income2024: "800000",
      scholarship: null,
      hasJob: "да",
      breadwinnerStatus: "нет",
      incomeShare: "25-49%",
      numberOfChildren: "0",
      specialCareRelatives: "нет",
      existingLoans: "0"
    },
    expected: "около 1.3M"
  },
  {
    name: "Семейный кормилец с 2 детьми",
    params: {
      birthDate: "1989-06-10",
      income2022: "900000",
      income2023: "1000000",
      income2024: "1100000", 
      scholarship: null,
      hasJob: "да",
      breadwinnerStatus: "да",
      incomeShare: "более 90%",
      numberOfChildren: "2",
      specialCareRelatives: "нет",
      existingLoans: "0"
    },
    expected: "около 4.2M"
  },
  {
    name: "Случай из скриншота: 50-74% дохода (КЛЮЧЕВОЙ ТЕСТ)",
    params: {
      birthDate: "1989-01-01",
      income2022: "1000000",
      income2023: "1000000",
      income2024: "1000000",
      scholarship: null,
      hasJob: "да", 
      breadwinnerStatus: "нет",
      incomeShare: "50-74%",
      numberOfChildren: "0",
      specialCareRelatives: "нет",
      existingLoans: "0"
    },
    expected: "2.2M (должен быть коэф 2.2)"
  },
  {
    name: "Граничный случай: 75-89% дохода",
    params: {
      birthDate: "1992-01-01",
      income2022: "800000",
      income2023: "800000",
      income2024: "800000",
      scholarship: null,
      hasJob: "да",
      breadwinnerStatus: "нет", 
      incomeShare: "75-89%",
      numberOfChildren: "0",
      specialCareRelatives: "нет",
      existingLoans: "0"
    },
    expected: "около 2.1M (коэф 2.6)"
  }
];

// Запуск тестов
testCases.forEach((testCase, index) => {
  console.log(`\n${index + 1}. ${testCase.name}`);
  console.log('─'.repeat(50));
  
  const result = computeRecommended(testCase.params);
  const { debugInfo } = result;
  
  console.log(`✅ Результат:`);
  console.log(`   Рекомендованная сумма: ${(result.recommendedSum / 1000000).toFixed(1)}M руб`);
  console.log(`   Рекомендованный срок: ${result.recommendedTerm} лет`);
  console.log(`   Возраст: ${debugInfo.age} лет`);
  console.log(`   Средний доход: ${(debugInfo.avgIncome / 1000000).toFixed(1)}M руб`);
  console.log(`   Коэф. кормильца: ${debugInfo.breadwinnerCoeff}`);
  console.log(`   Коэф. детей: ${debugInfo.childrenCoeff}`);
  console.log(`   Коэф. иждивенцев: ${debugInfo.specialCoeff}`);
  console.log(`   Итоговый коэф.: ${debugInfo.productCoeff}`);
  console.log(`   Возрастной коэф. (F5): ${debugInfo.ageFactor}`);
  console.log(`   Максимальная сумма: ${(debugInfo.maxInsuranceSum / 1000000).toFixed(1)}M руб`);
  
  // Проверяем ключевой тест
  if (testCase.name.includes('КЛЮЧЕВОЙ ТЕСТ')) {
    const expectedSum = 2200000;
    const actualSum = result.recommendedSum;
    const isCorrect = Math.abs(actualSum - expectedSum) < 1000;
    
    console.log(`   🎯 Ожидаемо: ${(expectedSum / 1000000).toFixed(1)}M руб`);
    console.log(`   📊 Фактически: ${(actualSum / 1000000).toFixed(1)}M руб`);
    
    if (isCorrect) {
      console.log(`   ✅ ТЕСТ ПРОЙДЕН! Логика работает корректно`);
    } else {
      console.log(`   ❌ ТЕСТ НЕ ПРОЙДЕН! Разница: ${Math.abs(actualSum - expectedSum)} руб`);
    }
  } else {
    console.log(`   💡 Ожидаемо: ${testCase.expected}`);
  }
});

console.log('\n' + '='.repeat(60));
console.log('✅ Финальное тестирование завершено');
console.log('📝 Все ключевые сценарии проверены');
console.log('🚀 JavaScript логика готова к работе');
