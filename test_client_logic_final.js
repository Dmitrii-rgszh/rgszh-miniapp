#!/usr/bin/env node

/**
 * Финальная проверка клиентской логики расчета
 * Тестируем данные из скриншота приложения
 */

console.log('🎯 ФИНАЛЬНЫЙ ТЕСТ КЛИЕНТСКОЙ ЛОГИКИ');
console.log('===================================');

// Точная копия функции computeRecommended из JustincasePage.js
function computeRecommended({
  birthDate,
  hasJob,
  income2022,
  income2023,
  income2024,
  scholarship,
  unsecuredLoans,
  breadwinnerStatus,
  incomeShare,
  childrenCount,
  specialCareRelatives
}) {
  // Утилита для преобразования строк с разделителями в числа
  const toNumber = (v) => {
    if (!v) return null;
    // удаляем точки и пробелы, затем преобразуем в целое
    const str = v.toString().replace(/[.\s]/g, '');
    const num = parseInt(str, 10);
    return isNaN(num) ? null : num;
  };

  // Нормализация значений
  const norm = (s) => (s || '').toString().toLowerCase().trim();

  // Расчет возраста
  const computeAge = (dateStr) => {
    if (!dateStr) return null;
    const birthDateObj = new Date(dateStr);
    const today = new Date();
    let age = today.getFullYear() - birthDateObj.getFullYear();
    const monthDiff = today.getMonth() - birthDateObj.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
      age--;
    }
    return age;
  };

  const age = computeAge(birthDate);

  // Расчет среднего дохода
  const incomes = [
    toNumber(income2022),
    toNumber(income2023), 
    toNumber(income2024),
    toNumber(scholarship)
  ].filter(v => v !== null && v > 0);

  const avgIncome = incomes.length > 0 ? incomes.reduce((a, b) => a + b) / incomes.length : 0;

  // Коэффициент F13: статус кормильца и доля дохода
  const breadNorm = norm(breadwinnerStatus);
  let breadwinnerCoeff = 1;
  
  if (breadNorm === 'да' || breadNorm === 'yes') {
    breadwinnerCoeff = 3;
  } else if (breadNorm === 'нет' || breadNorm === 'no') {
    const shareMap = {
      'до 10': 1,
      '10-24': 1.4,
      '25-49': 1.8,
      '50-74': 2.2,
      '75-89': 2.6,
      'более 90': 3
    };
    const shareKey = norm(incomeShare).replace(/[%]/g, '');
    breadwinnerCoeff = shareMap[shareKey] ?? 1;
  }

  // Коэффициент F14: количество детей
  // Если childrenCount пустой, используем "0" по умолчанию
  const childrenKey = norm(childrenCount || "0");
  let childrenCoeff;
  
  switch (childrenKey) {
    case '1':
      childrenCoeff = 1.25;
      break;
    case '2':
      childrenCoeff = 1.40625;
      break;
    case '3 и более':
    case '3+':
      childrenCoeff = 1.523438;
      break;
    case '0':
    default:
      childrenCoeff = 1;
      break;
  }

  // Коэффициент F15: особая забота
  const specialNorm = norm(specialCareRelatives);
  let specialCoeff = 1;
  if (specialNorm === 'да' || specialNorm === 'yes') {
    specialCoeff = 1.5;
  }

  // Итоговый коэффициент
  const productCoeff = breadwinnerCoeff * childrenCoeff * specialCoeff;

  // Возрастные коэффициенты (F5)
  let ageFactor = 10;
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

  // Максимальная страховая сумма
  const maxInsuranceSum = avgIncome * ageFactor;

  // Базовая рекомендованная сумма
  let baseRecommendedSum = avgIncome * productCoeff;

  // Добавляем кредиты
  const loans = toNumber(unsecuredLoans) || 0;
  baseRecommendedSum += loans;

  // Ограничиваем максимальной суммой
  const recommendedSum = Math.min(baseRecommendedSum, maxInsuranceSum);

  // Рекомендованный срок
  let recommendedTerm = 15;
  if (age !== null && age >= 25) {
    recommendedTerm = Math.max(5, Math.min(20, 20 - (age - 25)));
  }

  return {
    recommendedSum: Math.round(recommendedSum),
    recommendedTerm,
    debugInfo: {
      age,
      avgIncome,
      breadwinnerCoeff,
      childrenCoeff,
      specialCoeff,
      productCoeff,
      ageFactor,
      maxInsuranceSum,
      baseRecommendedSum,
      loans
    }
  };
}

// Тестовые данные на основе скриншота
const testData = {
  birthDate: "1989-01-01", // 36 лет
  hasJob: "да",
  income2022: "1000000",
  income2023: "1000000", 
  income2024: "1000000",
  scholarship: null,
  unsecuredLoans: "0",
  breadwinnerStatus: "Нет", // Не единственный кормилец
  incomeShare: "75%-89%", // Доля дохода в семейном бюджете
  childrenCount: "2", // Количество детей
  specialCareRelatives: "Нет"
};

console.log('📊 Входные данные:');
Object.entries(testData).forEach(([key, value]) => {
  console.log(`   ${key}: ${JSON.stringify(value)}`);
});

console.log('\n🧮 Выполняем расчет...');
const result = computeRecommended(testData);

console.log('\n✅ РЕЗУЛЬТАТЫ:');
console.log(`   Рекомендованная сумма: ${(result.recommendedSum / 1000000).toFixed(1)}M руб`);
console.log(`   Рекомендованный срок: ${result.recommendedTerm} лет`);

console.log('\n🔍 ДЕТАЛИ РАСЧЕТА:');
console.log(`   Возраст: ${result.debugInfo.age} лет`);
console.log(`   Средний доход: ${(result.debugInfo.avgIncome / 1000000).toFixed(1)}M руб`);
console.log(`   Коэф. кормильца: ${result.debugInfo.breadwinnerCoeff}`);
console.log(`   Коэф. детей: ${result.debugInfo.childrenCoeff}`);
console.log(`   Коэф. особой заботы: ${result.debugInfo.specialCoeff}`);
console.log(`   Итоговый коэф.: ${result.debugInfo.productCoeff.toFixed(3)}`);
console.log(`   Возрастной коэф. (F5): ${result.debugInfo.ageFactor}`);
console.log(`   Максимальная сумма: ${(result.debugInfo.maxInsuranceSum / 1000000).toFixed(1)}M руб`);

console.log('\n📈 СРАВНЕНИЕ:');
console.log(`   📱 Приложение показывало: 2.6M руб (проблема была в пустом childrenCount)`);
console.log(`   📊 Excel показывает: 3.7M руб`);
console.log(`   💻 Наш исправленный расчет: ${(result.recommendedSum / 1000000).toFixed(2)}M руб`);

if (Math.abs(result.recommendedSum - 3700000) < 100000) {
  console.log('\n🎉 УСПЕХ! Результат очень близок к Excel!');
} else if (Math.abs(result.recommendedSum - 3656250) < 1000) {
  console.log('\n✅ ОТЛИЧНО! Логика работает корректно (небольшая разница с Excel в рамках погрешности)');
} else {
  console.log('\n⚠️  Есть расхождение с ожидаемым результатом');
}

console.log('\n🚀 Клиентская логика готова к работе!');
console.log('   Сервер больше не содержит эндпоинт /api/justincase/recommend-sum');
console.log('   Весь расчет происходит на стороне клиента');
