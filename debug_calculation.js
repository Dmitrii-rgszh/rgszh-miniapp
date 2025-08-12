#!/usr/bin/env node

/**
 * Отладка расчета для случая из скриншота
 * Приложение: 2.600.000 руб
 * Excel: 3.700.000 руб
 */

console.log('🔍 ОТЛАДКА: Анализ расхождения в расчетах');
console.log('==========================================');

// Данные из скриншота приложения
const appData = {
  birthDate: "1989-01-01", // Возраст 35
  income2021: "1000000",
  income2022: "1000000", 
  income2023: "1000000",
  scholarship: null,
  hasJob: "Да",
  breadwinnerStatus: "Нет", // Не единственный кормилец
  incomeShare: "75%-89%", // Доля дохода в семейном бюджете
  childrenCount: "2", // Количество детей
  specialCareRelatives: "Нет",
  existingLoans: "0"
};

// Функция расчета (текущая версия)
function computeRecommended(params) {
  const {
    birthDate,
    income2021,
    income2022,
    income2023,
    scholarship,
    hasJob,
    breadwinnerStatus,
    incomeShare,
    childrenCount,
    specialCareRelatives,
    existingLoans
  } = params;

  const toNumber = (val) => {
    if (val === null || val === undefined || val === '') return null;
    const num = parseFloat(val);
    return isNaN(num) ? null : num;
  };

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

  // Собираем доходы за 2021-2023 + стипендию
  const incomes = [income2021, income2022, income2023, scholarship]
    .map(toNumber)
    .filter(v => v !== null);
  const avgIncome = incomes.length > 0 ? incomes.reduce((a, b) => a + b, 0) / incomes.length : 0;

  const norm = (v) => (v || '').toString().toLowerCase().trim();
  const breadNorm = norm(breadwinnerStatus);
  const specialNorm = norm(specialCareRelatives);

  console.log('📊 Исходные данные:');
  console.log(`   Возраст: ${age} лет`);
  console.log(`   Доходы: [${incomes.join(', ')}]`);
  console.log(`   Средний доход: ${avgIncome} руб`);
  console.log(`   Статус кормильца: "${breadwinnerStatus}"`);
  console.log(`   Доля дохода: "${incomeShare}"`);
  console.log(`   Количество детей: ${childrenCount}`);
  console.log('');

  // Коэффициент F13: статус кормильца и доля дохода
  let breadwinnerCoeff = 1;
  if (breadNorm === 'да' || breadNorm === 'yes') {
    breadwinnerCoeff = 3;
    console.log('🍞 Коэффициент кормильца: 3 (единственный кормилец)');
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
    console.log(`🍞 Коэффициент кормильца: ${breadwinnerCoeff} (не единственный, доля "${shareKey}")`);
  } else {
    breadwinnerCoeff = 1;
    console.log('🍞 Коэффициент кормильца: 1 (не кормилец)');
  }

  // Коэффициент F14: количество детей
  const childrenKey = norm(childrenCount);
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
  console.log(`👶 Коэффициент детей: ${childrenCoeff} (детей: "${childrenKey}")`);

  // Коэффициент F15: особая забота об иждивенцах
  let specialCoeff = 1;
  if (specialNorm === 'да' || specialNorm === 'yes') {
    specialCoeff = 1.5;
  }
  console.log(`👴 Коэффициент иждивенцев: ${specialCoeff}`);

  // Итоговый коэффициент
  const productCoeff = breadwinnerCoeff * childrenCoeff * specialCoeff;
  console.log(`🔢 Итоговый коэффициент: ${breadwinnerCoeff} × ${childrenCoeff} × ${specialCoeff} = ${productCoeff.toFixed(3)}`);

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
  console.log(`📅 Возрастной коэффициент (F5): ${ageFactor} (возраст ${age})`);

  // Максимальная страховая сумма
  const maxInsuranceSum = avgIncome * ageFactor;
  console.log(`📈 Максимальная сумма: ${avgIncome} × ${ageFactor} = ${maxInsuranceSum} руб`);

  // Базовая рекомендованная сумма
  let baseRecommendedSum = avgIncome * productCoeff;
  console.log(`💰 Базовая рекомендованная: ${avgIncome} × ${productCoeff.toFixed(3)} = ${baseRecommendedSum} руб`);

  // Добавляем кредиты
  const loans = toNumber(existingLoans) || 0;
  baseRecommendedSum += loans;
  console.log(`💳 С учетом кредитов: ${baseRecommendedSum} + ${loans} = ${baseRecommendedSum} руб`);

  // Ограничиваем максимальной суммой
  const recommendedSum = Math.min(baseRecommendedSum, maxInsuranceSum);
  console.log(`🎯 Итоговая рекомендованная: min(${baseRecommendedSum}, ${maxInsuranceSum}) = ${recommendedSum} руб`);

  // Рекомендованный срок
  let recommendedTerm = 15;
  if (age !== null && age >= 25) {
    recommendedTerm = Math.max(5, Math.min(20, 20 - (age - 25)));
  }
  console.log(`⏰ Рекомендованный срок: ${recommendedTerm} лет`);

  return {
    recommendedSum: Math.round(recommendedSum),
    recommendedTerm
  };
}

console.log('🧮 РАСЧЕТ ПО ТЕКУЩЕЙ ЛОГИКЕ:');
console.log('─'.repeat(40));
const result = computeRecommended(appData);

console.log('');
console.log('📱 Результат в приложении: 2.600.000 руб');
console.log(`💻 Результат нашего расчета: ${result.recommendedSum.toLocaleString()} руб`);
console.log('📊 Результат в Excel: 3.700.000 руб');
console.log('');

// Анализ возможных причин расхождения
console.log('🔍 АНАЛИЗ РАСХОЖДЕНИЙ:');
console.log('─'.repeat(40));

console.log('1. Проверим, если бы использовался коэффициент 3.7:');
const coeffFor37M = 3700000 / 1000000;
console.log(`   Коэффициент для 3.7M: ${coeffFor37M}`);

console.log('2. Возможные варианты:');
console.log(`   - Единственный кормилец (3) + 2 детей (1.40625) = ${(3 * 1.40625).toFixed(3)}`);
console.log(`   - Не кормилец с долей "более 90%" (3) + 2 детей (1.40625) = ${(3 * 1.40625).toFixed(3)}`);
console.log(`   - Особая забота включена: ${(2.6 * 1.40625 * 1.5).toFixed(3)}`);

console.log('');
console.log('🤔 Возможные причины расхождения:');
console.log('   1. В Excel может использоваться статус "единственный кормилец"');
console.log('   2. Может быть включена "особая забота об иждивенцах"');
console.log('   3. Может использоваться доля дохода "более 90%"');
console.log('   4. Возможно разные источники данных о доходах');
