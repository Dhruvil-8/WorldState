-- ============================================================
-- 003: Events
-- The most important object. Everything meaningful becomes an event.
-- ============================================================

CREATE TABLE IF NOT EXISTS events (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type      VARCHAR(50) NOT NULL CHECK (event_type IN (
                        -- Geopolitical
                        'conflict', 'military_action', 'election', 'sanction',
                        'diplomatic_action', 'border_dispute', 'government_change',
                        -- Economic
                        'interest_rate_change', 'inflation_release', 'gdp_release',
                        'pmi_release', 'employment_data', 'debt_event',
                        -- Trade
                        'tariff', 'export_restriction', 'import_restriction', 'trade_agreement',
                        -- Supply Chain
                        'factory_shutdown', 'port_congestion', 'logistics_disruption',
                        -- Commodity
                        'oil_shock', 'gas_shock', 'food_shock', 'metal_shock',
                        -- Environment
                        'earthquake', 'flood', 'wildfire', 'drought', 'storm',
                        -- Cyber
                        'cyber_attack', 'data_breach', 'infrastructure_attack',
                        -- Other
                        'policy_change', 'other'
                    )),
    title           TEXT NOT NULL,
    description     TEXT,
    severity        NUMERIC(4,2) DEFAULT 0 CHECK (severity BETWEEN 0 AND 10),
    confidence      NUMERIC(4,2) DEFAULT 0 CHECK (confidence BETWEEN 0 AND 1),
    source_count    INTEGER DEFAULT 1,
    status          VARCHAR(20) DEFAULT 'detected' CHECK (status IN (
                        'detected', 'verified', 'active', 'monitoring', 'resolved', 'archived'
                    )),
    category        VARCHAR(30) NOT NULL CHECK (category IN (
                        'geopolitical', 'economic', 'trade', 'supply_chain',
                        'commodity', 'environment', 'cyber', 'other'
                    )),
    location        JSONB DEFAULT '{}',
    metadata        JSONB DEFAULT '{}',
    first_seen_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at     TIMESTAMPTZ,

    search_vector   tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(description, '')), 'B')
    ) STORED
);

CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_severity ON events(severity DESC);
CREATE INDEX idx_events_first_seen ON events(first_seen_at DESC);
CREATE INDEX idx_events_search ON events USING GIN(search_vector);

-- Junction table: which documents contributed to this event
CREATE TABLE IF NOT EXISTS event_documents (
    event_id        UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    document_id     UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    PRIMARY KEY (event_id, document_id)
);
