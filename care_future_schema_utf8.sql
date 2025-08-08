-- care_future_schema_fixed.sql - Исправленная схема БД для калькулятора НСЖ

-- =============================================================================
-- ТАБЛИЦА 1: Тарифные коэффициенты по рискам и возрастам
-- =============================================================================
CREATE TABLE IF NOT EXISTS nsj_risk_rates (
    id SERIAL PRIMARY KEY,
    
    -- Возрастные параметры
    age_from INTEGER NOT NULL,  -- минимальный возраст
    age_to INTEGER NOT NULL,    -- максимальный возраст
    
    -- Коэффициенты по типам рисков (из листа "к_Тарифы по рискам")
    survival_rate DECIMAL(10,6) NOT NULL DEFAULT 0,     -- Дожитие (survival)
    death_immediate_rate DECIMAL(10,6) NOT NULL DEFAULT 0,  -- Смерть с немедленной выплатой
    death_deferred_rate DECIMAL(10,6) NOT NULL DEFAULT 0,   -- Смерть с отложенной выплатой  
    investment_rate DECIMAL(10,6) NOT NULL DEFAULT 0,       -- Инвестиционный риск
    
    -- Метаданные
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Индексы для быстрого поиска по возрасту
    CONSTRAINT unique_age_range UNIQUE (age_from, age_to),
    CHECK (age_from <= age_to),
    CHECK (age_from >= 0 AND age_to <= 100)  -- Расширили диапазон возрастов
);

-- Индекс для быстрого поиска по возрасту
CREATE INDEX IF NOT EXISTS idx_nsj_risk_rates_age ON nsj_risk_rates (age_from, age_to);

-- =============================================================================
-- ТАБЛИЦА 2: Коэффициенты выкупных сумм
-- =============================================================================
CREATE TABLE IF NOT EXISTS nsj_redemption_rates (
    id SERIAL PRIMARY KEY,
    
    -- Параметры договора
    contract_year INTEGER NOT NULL,    -- год действия договора (1-20)
    contract_term INTEGER NOT NULL,    -- общий срок договора (5-20 лет)
    
    -- Коэффициент выкупной суммы (из листа "к_Выкупные суммы")
    redemption_coefficient DECIMAL(6,3) NOT NULL DEFAULT 0,  -- от 0.0 до 1.0
    
    -- Метаданные
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ограничения
    CONSTRAINT unique_year_term UNIQUE (contract_year, contract_term),
    CHECK (contract_year >= 1 AND contract_year <= 20),
    CHECK (contract_term >= 5 AND contract_term <= 20),
    CHECK (contract_year <= contract_term),
    CHECK (redemption_coefficient >= 0 AND redemption_coefficient <= 1)
);

-- Индекс для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_nsj_redemption_year_term ON nsj_redemption_rates (contract_year, contract_term);

-- =============================================================================
-- ТАБЛИЦА 3: Основные настройки калькулятора
-- =============================================================================
CREATE TABLE IF NOT EXISTS nsj_calculator_settings (
    id SERIAL PRIMARY KEY,
    
    -- Название настройки (ключ)
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    
    -- Значение настройки  
    setting_value TEXT NOT NULL,
    
    -- Описание настройки
    description TEXT,
    
    -- Тип данных (для валидации)
    value_type VARCHAR(20) DEFAULT 'string', -- string, integer, decimal, boolean
    
    -- Метаданные
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Индекс для быстрого поиска
    CONSTRAINT nsj_settings_key_unique UNIQUE (setting_key)
);

CREATE INDEX IF NOT EXISTS idx_nsj_settings_key ON nsj_calculator_settings (setting_key, is_active);

-- =============================================================================
-- ТАБЛИЦА 4: Результаты расчетов (для истории и кэширования)
-- =============================================================================
CREATE TABLE IF NOT EXISTS nsj_calculations (
    id SERIAL PRIMARY KEY,
    
    -- Идентификация расчета
    calculation_uuid VARCHAR(36) NOT NULL UNIQUE,  -- UUID для поиска
    email VARCHAR(255), -- email клиента (может быть NULL)
    
    -- Входные параметры
    birth_date DATE NOT NULL,
    gender VARCHAR(10) NOT NULL, -- 'male', 'female'
    calculation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    contract_term INTEGER NOT NULL, -- срок в годах (5-20)
    
    -- Тип расчета и входная сумма
    calculation_type VARCHAR(20) NOT NULL, -- 'from_premium', 'from_sum'
    input_amount BIGINT NOT NULL, -- входная сумма (взнос или страховая сумма)
    
    -- Результаты расчета
    premium_amount BIGINT NOT NULL,        -- страховой взнос
    insurance_sum BIGINT NOT NULL,         -- страховая сумма 
    accumulated_capital BIGINT NOT NULL,   -- накопленный капитал
    program_income BIGINT NOT NULL,        -- доход по программе
    tax_deduction BIGINT DEFAULT 0,        -- налоговый вычет
    
    -- Дополнительные параметры
    age_at_start INTEGER NOT NULL,         -- возраст на начало
    age_at_end INTEGER NOT NULL,           -- возраст на окончание
    payment_frequency VARCHAR(20) DEFAULT 'annual', -- ежегодно, ежемесячно и т.д.
    
    -- Выкупные суммы по годам (JSON массив)
    redemption_values JSONB,  -- [{"year": 1, "amount": 0}, {"year": 2, "amount": 500000}, ...]
    
    -- Метаданные
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_agent TEXT,
    ip_address INET,
    
    -- Индексы
    CHECK (contract_term >= 5 AND contract_term <= 20),
    CHECK (calculation_type IN ('from_premium', 'from_sum')),
    CHECK (gender IN ('male', 'female')),
    CHECK (age_at_start >= 0 AND age_at_start <= 100),  -- Расширили возрастные ограничения
    CHECK (input_amount > 0)
);

-- Индексы для быстрого поиска расчетов
CREATE INDEX IF NOT EXISTS idx_nsj_calculations_uuid ON nsj_calculations (calculation_uuid);
CREATE INDEX IF NOT EXISTS idx_nsj_calculations_email ON nsj_calculations (email);
CREATE INDEX IF NOT EXISTS idx_nsj_calculations_date ON nsj_calculations (created_at);
CREATE INDEX IF NOT EXISTS idx_nsj_calculations_params ON nsj_calculations (birth_date, gender, contract_term);

-- =============================================================================
-- БАЗОВЫЕ НАСТРОЙКИ КАЛЬКУЛЯТОРА
-- =============================================================================

-- Вставляем основные настройки калькулятора (если их еще нет)
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
