-- ============================================================
-- 001: Sources
-- Where information originates (Reuters, BBC, government sites, etc.)
-- ============================================================

CREATE TABLE IF NOT EXISTS sources (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(255) NOT NULL UNIQUE,
    source_type     VARCHAR(50) NOT NULL CHECK (source_type IN (
                        'news', 'government', 'central_bank', 'research',
                        'rss', 'economic_calendar', 'commodity_feed',
                        'weather', 'disaster', 'social', 'other'
                    )),
    url             TEXT,
    country         VARCHAR(100) DEFAULT 'Global',
    trust_score     NUMERIC(4,2) DEFAULT 0.50 CHECK (trust_score BETWEEN 0 AND 1),
    active          BOOLEAN DEFAULT true,
    config          JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sources_type ON sources(source_type);
CREATE INDEX idx_sources_active ON sources(active);
