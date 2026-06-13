-- ============================================================
-- 007: World State
-- The heart of the system — continuously updated world model
-- Append-only time-series: every snapshot is preserved
-- ============================================================

CREATE TABLE IF NOT EXISTS world_state (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    global_stability    INTEGER NOT NULL CHECK (global_stability BETWEEN 0 AND 100),
    geopolitical_risk   INTEGER NOT NULL CHECK (geopolitical_risk BETWEEN 0 AND 100),
    economic_risk       INTEGER NOT NULL CHECK (economic_risk BETWEEN 0 AND 100),
    financial_risk      INTEGER NOT NULL CHECK (financial_risk BETWEEN 0 AND 100),
    supply_chain_risk   INTEGER NOT NULL CHECK (supply_chain_risk BETWEEN 0 AND 100),
    energy_risk         INTEGER NOT NULL CHECK (energy_risk BETWEEN 0 AND 100),
    food_security_risk  INTEGER NOT NULL CHECK (food_security_risk BETWEEN 0 AND 100),
    cyber_risk          INTEGER NOT NULL CHECK (cyber_risk BETWEEN 0 AND 100),
    climate_risk        INTEGER NOT NULL CHECK (climate_risk BETWEEN 0 AND 100),
    trade_risk          INTEGER NOT NULL CHECK (trade_risk BETWEEN 0 AND 100),
    technology_risk     INTEGER NOT NULL CHECK (technology_risk BETWEEN 0 AND 100),
    confidence          INTEGER NOT NULL DEFAULT 50 CHECK (confidence BETWEEN 0 AND 100),
    reasoning           TEXT,
    metadata            JSONB DEFAULT '{}',
    measured_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_world_state_time ON world_state(measured_at DESC);
