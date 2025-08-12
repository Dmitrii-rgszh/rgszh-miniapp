// Тест JavaScript логики расчета рекомендованной суммы
// Скопировано из JustincasePage.js

const computeRecommended = (params) => {
    const {
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
    } = params;

    // Преобразование строковых сумм в числа: удаляем точки/пробелы, парсим в int.
    const toNumber = (val) => {
        if (!val) return null;
        const cleaned = val.toString().replace(/[\.\s]/g, '');
        // Возвращаем null, если парсинг не удался
        const num = parseInt(cleaned, 10);
        return Number.isNaN(num) ? null : num;
    };

    // Вычисляем возраст на основе даты рождения; если дата не указана, age=null
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

    // Нормализуем значения полей для сравнения (lowercase, trimming)
    const norm = (v) => (v || '').toString().toLowerCase().trim();
    const jobNorm = norm(hasJob);
    const breadNorm = norm(breadwinnerStatus);
    const specialNorm = norm(specialCareRelatives);

    // Коэффициент F13: статус кормильца и доля дохода
    let breadwinnerCoeff = 1;
    console.log(`   DEBUG: breadNorm = "${breadNorm}", incomeShare = "${incomeShare}"`);
    
    if (breadNorm === 'да' || breadNorm === 'yes') {
        breadwinnerCoeff = 3;
        console.log(`   DEBUG: Единственный кормилец, коэф = 3`);
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
        console.log(`   DEBUG: shareKey = "${shareKey}"`);
        breadwinnerCoeff = shareMap[shareKey] ?? 1;
        console.log(`   DEBUG: Не единственный кормилец, доля "${shareKey}", коэф = ${breadwinnerCoeff}`);
    } else {
        // Не являюсь кормильцем
        breadwinnerCoeff = 1;
        console.log(`   DEBUG: Не кормилец, коэф = 1`);
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
        case '3 и более':
        case '3 и более.':
        case '3 и более':
        case '3 и более ': // различные варианты написания
        case '3 или более':
        case '3+':
            childrenCoeff = 1.523438;
            break;
        case '0':
        default:
            childrenCoeff = 1;
            break;
    }

    // Коэффициент F15: наличие родственников, требующих ухода
    const specialCoeff = (specialNorm === 'да' || specialNorm === 'yes') ? 1.3 : 1;

    // Итоговый коэффициент (произведение)
    const productCoeff = breadwinnerCoeff * childrenCoeff * specialCoeff;

    // Несзащищенные кредиты
    const loans = toNumber(unsecuredLoans) || 0;

    // Возрастной коэффициент F5 для риска «Смерть по любой причине»
    const getF5 = (a) => {
        if (a === null || a === undefined) return 3;
        if (a <= 34) return 10;
        if (a <= 44) return 8;
        if (a <= 49) return 7;
        if (a <= 54) return 6;
        if (a <= 59) return 5;
        return 3;
    };
    const f5 = getF5(age);

    // Вычисляем максимальную страховую сумму F18
    let maxSum;
    if (jobNorm === 'да' || jobNorm === 'yes') {
        maxSum = avgIncome * f5;
    } else if (jobNorm === 'работающий студент' || jobNorm === 'student') {
        maxSum = avgIncome * 10;
    } else {
        // Нет работы
        maxSum = 1_000_000;
    }

    // Базовая сумма: для безработных 1 000 000, иначе доход*коэффициенты + кредиты
    let baseSum;
    if (jobNorm === 'нет' || jobNorm === 'no') {
        baseSum = 1_000_000;
    } else {
        baseSum = avgIncome * productCoeff + loans;
    }

    // Конечная рекомендованная сумма: минимальное из baseSum и maxSum, округляем до 100 000
    let recSum = Math.min(baseSum, maxSum);
    recSum = Math.round(recSum / 100000) * 100000;

    // Рекомендуемый срок (D19)
    let recTerm = null;
    if (age !== null && age !== undefined) {
        if (age > 70) {
            recTerm = Math.max(75 - age, 0);
        } else {
            let term = 60 - age;
            if (term < 5) term = 5;
            if (term > 15) term = 15;
            recTerm = term;
        }
    }

    return { 
        recommendedSum: recSum, 
        recommendedTerm: recTerm,
        details: {
            age,
            avgIncome,
            breadwinnerCoeff,
            childrenCoeff,
            specialCoeff,
            productCoeff,
            loans,
            f5,
            maxSum,
            baseSum
        }
    };
};

// Тестовые случаи
const testCases = [
    {
        name: "Молодой специалист (25 лет)",
        data: {
            birthDate: "1999-01-01",
            hasJob: "да",
            income2022: "600000",
            income2023: "700000", 
            income2024: "800000",
            scholarship: "",
            unsecuredLoans: "0",
            breadwinnerStatus: "нет",
            incomeShare: "25-49%",
            childrenCount: "0",
            specialCareRelatives: "нет"
        }
    },
    {
        name: "Семейный кормилец (35 лет, 2 детей)",
        data: {
            birthDate: "1989-01-01",
            hasJob: "да", 
            income2022: "1000000",
            income2023: "1000000",
            income2024: "1000000",
            scholarship: "",
            unsecuredLoans: "0",
            breadwinnerStatus: "да",
            incomeShare: "75-89%",
            childrenCount: "2",
            specialCareRelatives: "нет"
        }
    },
    {
        name: "Случай из скриншота (35 лет, кормилец)",
        data: {
            birthDate: "1989-01-01",
            hasJob: "да",
            income2022: "1000000",
            income2023: "1000000",
            income2024: "1000000", 
            scholarship: "",
            unsecuredLoans: "0",
            breadwinnerStatus: "нет", // НЕ единственный кормилец, но есть доля дохода
            incomeShare: "50-74%", // Это должно дать коэффициент 2.2
            childrenCount: "0",
            specialCareRelatives: "нет"
        }
    }
];

function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

console.log("🧪 Тестирование JavaScript логики расчета рекомендованной суммы");
console.log("=" * 60);

testCases.forEach((testCase, index) => {
    console.log(`\n${index + 1}. ${testCase.name}`);
    console.log("-".repeat(40));
    
    try {
        const result = computeRecommended(testCase.data);
        const details = result.details;
        
        console.log(`✅ Результат:`);
        console.log(`   Рекомендованная сумма: ${formatNumber(result.recommendedSum)} руб`);
        console.log(`   Рекомендованный срок: ${result.recommendedTerm} лет`);
        console.log(`   Возраст: ${details.age} лет`);
        console.log(`   Средний доход: ${formatNumber(Math.round(details.avgIncome))} руб`);
        console.log(`   Коэф. кормильца: ${details.breadwinnerCoeff}`);
        console.log(`   Коэф. детей: ${details.childrenCoeff}`);
        console.log(`   Коэф. иждивенцев: ${details.specialCoeff}`);
        console.log(`   Итоговый коэф.: ${details.productCoeff.toFixed(3)}`);
        console.log(`   Кредиты: ${formatNumber(details.loans)} руб`);
        console.log(`   Возрастной коэф. (F5): ${details.f5}`);
        console.log(`   Максимальная сумма: ${formatNumber(details.maxSum)} руб`);
        console.log(`   Базовая сумма: ${formatNumber(Math.round(details.baseSum))} руб`);
        console.log(`   Коэф. к доходу: ${(result.recommendedSum / details.avgIncome).toFixed(2)}x`);
        
        // Сравнение с ожидаемым результатом для случая из скриншота
        if (testCase.name.includes("скриншота")) {
            const expected = 2200000;
            const difference = Math.abs(result.recommendedSum - expected);
            const percentDiff = (difference / expected * 100).toFixed(1);
            console.log(`   🎯 Ожидаемо: ${formatNumber(expected)} руб`);
            console.log(`   📊 Разница: ${formatNumber(difference)} руб (${percentDiff}%)`);
        }
        
    } catch (error) {
        console.log(`❌ Ошибка: ${error.message}`);
    }
});

console.log("\n" + "=".repeat(60));
console.log("✅ Тестирование завершено");
