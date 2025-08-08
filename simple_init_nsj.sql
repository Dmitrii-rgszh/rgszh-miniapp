-- simple_init_nsj.sql - Инициализация таблиц калькулятора НСЖ

-- Таблица тарифных коэффициентов
CREATE TABLE IF NOT EXISTS nsj_risk_rates (
    id SERIAL PRIMARY KEY,
    age_from INTEGER NOT NULL,
    age_to INTEGER NOT NULL,
    survival_rate DECIMAL(10,6) NOT NULL DEFAULT 0,
    death_immediate_rate DECIMAL(10,6) NOT NULL DEFAULT 0,
    death_deferred_rate DECIMAL(10,6) NOT NULL DEFAULT 0,
    investment_rate DECIMAL(10,6) NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_age_range UNIQUE (age_from, age_to),
    CHECK (age_from <= age_to),
    CHECK (age_from >= 0 AND age_to <= 100)
);

-- Таблица коэффициентов выкупа
CREATE TABLE IF NOT EXISTS nsj_redemption_rates (
    id SERIAL PRIMARY KEY,
    contract_year INTEGER NOT NULL,
    contract_term INTEGER NOT NULL,
    redemption_coefficient DECIMAL(6,3) NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_year_term UNIQUE (contract_year, contract_term),
    CHECK (contract_year >= 1 AND contract_year <= 20),
    CHECK (contract_term >= 5 AND contract_term <= 20),
    CHECK (contract_year <= contract_term),
    CHECK (redemption_coefficient >= 0 AND redemption_coefficient <= 1)
);

-- Таблица настроек калькулятора
CREATE TABLE IF NOT EXISTS nsj_calculator_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    description TEXT,
    value_type VARCHAR(20) DEFAULT 'string',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица результатов расчетов
CREATE TABLE IF NOT EXISTS nsj_calculations (
    id SERIAL PRIMARY KEY,
    calculation_uuid VARCHAR(36) NOT NULL UNIQUE,
    email VARCHAR(255),
    birth_date DATE NOT NULL,
    gender VARCHAR(10) NOT NULL,
    calculation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    contract_term INTEGER NOT NULL,
    calculation_type VARCHAR(20) NOT NULL,
    input_amount BIGINT NOT NULL,
    premium_amount BIGINT NOT NULL,
    insurance_sum BIGINT NOT NULL,
    accumulated_capital BIGINT NOT NULL,
    program_income BIGINT NOT NULL,
    tax_deduction BIGINT DEFAULT 0,
    age_at_start INTEGER NOT NULL,
    age_at_end INTEGER NOT NULL,
    payment_frequency VARCHAR(20) DEFAULT 'annual',
    redemption_values JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_agent TEXT,
    ip_address INET,
    CHECK (contract_term >= 5 AND contract_term <= 20),
    CHECK (calculation_type IN ('from_premium', 'from_sum')),
    CHECK (gender IN ('male', 'female')),
    CHECK (age_at_start >= 0 AND age_at_start <= 100),
    CHECK (input_amount > 0)
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_nsj_risk_rates_age ON nsj_risk_rates (age_from, age_to);
CREATE INDEX IF NOT EXISTS idx_nsj_redemption_year_term ON nsj_redemption_rates (contract_year, contract_term);
CREATE INDEX IF NOT EXISTS idx_nsj_settings_key ON nsj_calculator_settings (setting_key, is_active);
CREATE INDEX IF NOT EXISTS idx_nsj_calculations_uuid ON nsj_calculations (calculation_uuid);
CREATE INDEX IF NOT EXISTS idx_nsj_calculations_email ON nsj_calculations (email);
CREATE INDEX IF NOT EXISTS idx_nsj_calculations_date ON nsj_calculations (created_at);

-- Базовые настройки
INSERT INTO nsj_calculator_settings (setting_key, setting_value, description, value_type) VALUES
('min_premium_amount', '100000', 'Минимальный страховой взнос в рублях', 'integer'),
('max_premium_amount', '50000000', 'Максимальный страховой взнос в рублях', 'integer'),
('min_insurance_sum', '500000', 'Минимальная страховая сумма в рублях', 'integer'),
('max_insurance_sum', '100000000', 'Максимальная страховая сумма в рублях', 'integer'),
('min_age', '18', 'Минимальный возраст страхователя', 'integer'),
('max_age', '63', 'Максимальный возраст страхователя', 'integer'),
('min_contract_term', '5', 'Минимальный срок договора в годах', 'integer'),
('max_contract_term', '20', 'Максимальный срок договора в годах', 'integer'),
('tax_deduction_rate_standard', '0.13', 'Ставка налогового вычета до 5 млн', 'decimal'),
('tax_deduction_rate_high', '0.15', 'Ставка налогового вычета свыше 5 млн', 'decimal'),
('tax_deduction_limit', '120000', 'Лимит налогового вычета в год', 'integer'),
('cashback_rate', '0.06', 'Ставка кэшбэка (6%)', 'decimal'),
('program_name', 'Забота о будущем Ультра', 'Название программы НСЖ', 'string'),
('currency', 'RUB', 'Валюта расчетов', 'string'),
('payment_frequency_default', 'annual', 'Периодичность оплаты по умолчанию', 'string')
ON CONFLICT (setting_key) DO NOTHING;

-- Тарифные коэффициенты
TRUNCATE TABLE nsj_risk_rates RESTART IDENTITY CASCADE;

INSERT INTO nsj_risk_rates (age_from, age_to, survival_rate, death_immediate_rate, death_deferred_rate, investment_rate) VALUES
(18, 18, 0.869500, 0.073400, 0.015700, 0.041400),
(19, 19, 0.854700, 0.081100, 0.017800, 0.046400),
(20, 20, 0.839100, 0.089500, 0.019900, 0.051500),
(21, 25, 0.825000, 0.095000, 0.022000, 0.055000),
(26, 30, 0.810000, 0.100000, 0.025000, 0.060000),
(31, 35, 0.795000, 0.110000, 0.030000, 0.065000),
(36, 40, 0.780000, 0.120000, 0.035000, 0.070000),
(41, 45, 0.765000, 0.130000, 0.040000, 0.075000),
(46, 50, 0.750000, 0.140000, 0.045000, 0.080000),
(51, 55, 0.735000, 0.150000, 0.050000, 0.085000),
(56, 60, 0.720000, 0.160000, 0.055000, 0.090000),
(61, 63, 0.705000, 0.170000, 0.060000, 0.095000);

-- Коэффициенты выкупа
TRUNCATE TABLE nsj_redemption_rates RESTART IDENTITY CASCADE;

INSERT INTO nsj_redemption_rates (contract_year, contract_term, redemption_coefficient) VALUES
-- Срок 5 лет
(1, 5, 0.000), (2, 5, 0.250), (3, 5, 0.500), (4, 5, 0.750), (5, 5, 1.000),
-- Срок 10 лет
(1, 10, 0.000), (2, 10, 0.150), (3, 10, 0.300), (4, 10, 0.450), (5, 10, 0.600),
(6, 10, 0.700), (7, 10, 0.800), (8, 10, 0.850), (9, 10, 0.900), (10, 10, 1.000),
-- Срок 15 лет
(1, 15, 0.000), (2, 15, 0.100), (3, 15, 0.200), (4, 15, 0.300), (5, 15, 0.400),
(6, 15, 0.500), (7, 15, 0.600), (8, 15, 0.650), (9, 15, 0.700), (10, 15, 0.750),
(11, 15, 0.800), (12, 15, 0.825), (13, 15, 0.850), (14, 15, 0.875), (15, 15, 1.000),
-- Срок 20 лет
(1, 20, 0.000), (2, 20, 0.075), (3, 20, 0.150), (4, 20, 0.225), (5, 20, 0.300),
(6, 20, 0.375), (7, 20, 0.450), (8, 20, 0.500), (9, 20, 0.550), (10, 20, 0.600),
(11, 20, 0.650), (12, 20, 0.700), (13, 20, 0.725), (14, 20, 0.750), (15, 20, 0.775),
(16, 20, 0.800), (17, 20, 0.825), (18, 20, 0.850), (19, 20, 0.875), (20, 20, 1.000);

-- Проверяем результат
SELECT 'nsj_risk_rates' as table_name, COUNT(*) as records FROM nsj_risk_rates
UNION ALL
SELECT 'nsj_redemption_rates' as table_name, COUNT(*) as records FROM nsj_redemption_rates
UNION ALL
SELECT 'nsj_calculator_settings' as table_name, COUNT(*) as records FROM nsj_calculator_settings;
