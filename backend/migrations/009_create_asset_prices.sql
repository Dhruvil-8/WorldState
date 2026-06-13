-- ============================================================
-- 009: Asset Price History
-- Tracks historical prices for commodities, indexes, currencies
-- ============================================================

CREATE TABLE IF NOT EXISTS asset_price_history (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_id       UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    price           NUMERIC(18, 4) NOT NULL,
    change          NUMERIC(18, 4) NOT NULL,
    change_percent  NUMERIC(8, 4) NOT NULL,
    timestamp       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_asset_price_history_entity ON asset_price_history(entity_id);
CREATE INDEX idx_asset_price_history_time ON asset_price_history(timestamp DESC);
