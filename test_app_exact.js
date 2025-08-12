#!/usr/bin/env node

/**
 * Тест с точными данными из приложения
 */

console.log('🧪 ТОЧНЫЙ ТЕСТ ДАННЫХ ИЗ ПРИЛОЖЕНИЯ');
console.log('==================================');

// Точная копия логики из JustincasePage.js
function testAppLogic() {
  // Данные точно как в приложении
  const childrenCount = "2";
  const breadwinnerStatus = "Нет";
  const incomeShare = "75%-89%";
  const specialCareRelatives = "Нет";
  
  // Нормализация
  const norm = (v) => (v || '').toString().toLowerCase().trim();
  
  console.log('📊 Входные данные:');
  console.log(`   childrenCount: "${childrenCount}"`);
  console.log(`   breadwinnerStatus: "${breadwinnerStatus}"`);
  console.log(`   incomeShare: "${incomeShare}"`);
  console.log(`   specialCareRelatives: "${specialCareRelatives}"`);
  console.log('');
  
  // Коэффициент кормильца
  const breadNorm = norm(breadwinnerStatus);
  let breadwinnerCoeff = 1;
  
  console.log(`🍞 Анализ статуса кормильца:`);
  console.log(`   breadNorm = "${breadNorm}"`);
  
  if (breadNorm === 'да' || breadNorm === 'yes') {
    breadwinnerCoeff = 3;
    console.log(`   Результат: единственный кормилец, коэф = 3`);
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
    console.log(`   shareKey = "${shareKey}"`);
    console.log(`   Результат: не единственный кормилец, коэф = ${breadwinnerCoeff}`);
  } else {
    breadwinnerCoeff = 1;
    console.log(`   Результат: не кормилец, коэф = 1`);
  }
  
  // Коэффициент детей
  const childrenKey = norm(childrenCount);
  let childrenCoeff;
  
  console.log(`👶 Анализ количества детей:`);
  console.log(`   childrenKey = "${childrenKey}"`);
  
  switch (childrenKey) {
    case '1':
      childrenCoeff = 1.25;
      console.log(`   Результат: 1 ребенок, коэф = 1.25`);
      break;
    case '2':
      childrenCoeff = 1.40625;
      console.log(`   Результат: 2 детей, коэф = 1.40625`);
      break;
    case '3 и более':
    case '3+':
      childrenCoeff = 1.523438;
      console.log(`   Результат: 3+ детей, коэф = 1.523438`);
      break;
    case '0':
    default:
      childrenCoeff = 1;
      console.log(`   Результат: нет детей или неизвестно, коэф = 1`);
      break;
  }
  
  // Коэффициент особой заботы
  const specialNorm = norm(specialCareRelatives);
  let specialCoeff = 1;
  
  console.log(`👴 Анализ особой заботы:`);
  console.log(`   specialNorm = "${specialNorm}"`);
  
  if (specialNorm === 'да' || specialNorm === 'yes') {
    specialCoeff = 1.5;
    console.log(`   Результат: есть особая забота, коэф = 1.5`);
  } else {
    specialCoeff = 1;
    console.log(`   Результат: нет особой заботы, коэф = 1`);
  }
  
  // Итоговый коэффициент
  const productCoeff = breadwinnerCoeff * childrenCoeff * specialCoeff;
  
  console.log('');
  console.log('🔢 ИТОГОВЫЙ РАСЧЕТ:');
  console.log(`   Коэф. кормильца: ${breadwinnerCoeff}`);
  console.log(`   Коэф. детей: ${childrenCoeff}`);
  console.log(`   Коэф. особой заботы: ${specialCoeff}`);
  console.log(`   Итоговый коэф: ${breadwinnerCoeff} × ${childrenCoeff} × ${specialCoeff} = ${productCoeff}`);
  
  // Расчет суммы
  const avgIncome = 1000000;
  const recommendedSum = avgIncome * productCoeff;
  
  console.log(`   Средний доход: ${avgIncome}`);
  console.log(`   Рекомендованная сумма: ${avgIncome} × ${productCoeff} = ${recommendedSum}`);
  console.log('');
  console.log(`📱 В приложении показано: 2.600.000 руб`);
  console.log(`💻 Наш расчет: ${recommendedSum.toLocaleString()} руб`);
  
  if (Math.abs(recommendedSum - 2600000) < 1000) {
    console.log(`✅ СОВПАДЕНИЕ! Логика работает корректно`);
  } else {
    console.log(`❌ РАСХОЖДЕНИЕ! Проблема в логике`);
  }
}

testAppLogic();
