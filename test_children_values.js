#!/usr/bin/env node

/**
 * Тест различных значений childrenCount
 */

console.log('🧪 ТЕСТ ЗНАЧЕНИЙ CHILDRENCOUNT');
console.log('=============================');

function testChildrenCount(value, label) {
  console.log(`\n📊 Тест: ${label} (значение: ${JSON.stringify(value)})`);
  
  const norm = (v) => (v || '').toString().toLowerCase().trim();
  const childrenKey = norm(value);
  let childrenCoeff;
  
  console.log(`   childrenKey после norm(): "${childrenKey}"`);
  
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
  
  const breadwinnerCoeff = 2.6; // Фиксированный для теста
  const specialCoeff = 1;
  const productCoeff = breadwinnerCoeff * childrenCoeff * specialCoeff;
  const avgIncome = 1000000;
  const result = avgIncome * productCoeff;
  
  console.log(`   Итоговый результат: ${result.toLocaleString()} руб`);
  
  return result;
}

// Тестируем разные варианты
const tests = [
  ["2", "Строка '2'"],
  [2, "Число 2"],
  ["", "Пустая строка"],
  [null, "null"],
  [undefined, "undefined"],
  ["0", "Строка '0'"],
  [0, "Число 0"]
];

tests.forEach(([value, label]) => {
  const result = testChildrenCount(value, label);
  if (Math.abs(result - 2600000) < 1000) {
    console.log(`   ✅ СОВПАДЕНИЕ с приложением!`);
  }
});

console.log('\n🔍 АНАЛИЗ:');
console.log('   Если в приложении 2.600.000 руб, то childrenCount обрабатывается как пустое значение');
console.log('   Нужно проверить, правильно ли передается childrenCount из формы');
