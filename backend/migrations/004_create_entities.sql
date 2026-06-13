-- ============================================================
-- 004: Entities
-- Any meaningful object in the world
-- ============================================================

CREATE TABLE IF NOT EXISTS entities (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type     VARCHAR(30) NOT NULL CHECK (entity_type IN (
                        'country', 'region', 'city', 'organization', 'company',
                        'industry', 'commodity', 'currency', 'person',
                        'military_unit', 'infrastructure', 'technology',
                        'financial_asset', 'policy', 'treaty', 'port',
                        'shipping_route', 'energy_asset'
                    )),
    name            VARCHAR(500) NOT NULL,
    canonical_name  VARCHAR(500) NOT NULL,
    aliases         TEXT[] DEFAULT '{}',
    description     TEXT,
    importance      INTEGER DEFAULT 50 CHECK (importance BETWEEN 0 AND 100),
    active          BOOLEAN DEFAULT true,
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(canonical_name, entity_type)
);

CREATE INDEX idx_entities_type ON entities(entity_type);
CREATE INDEX idx_entities_name ON entities(canonical_name);
CREATE INDEX idx_entities_importance ON entities(importance DESC);
CREATE INDEX idx_entities_active ON entities(active);
CREATE INDEX idx_entities_aliases ON entities USING GIN(aliases);
-- Trigram index for fuzzy entity search
CREATE INDEX idx_entities_name_trgm ON entities USING GIN(canonical_name gin_trgm_ops);

-- Junction table: which entities are involved in which events
CREATE TABLE IF NOT EXISTS event_entities (
    event_id        UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    entity_id       UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    role            VARCHAR(50) DEFAULT 'involved',
    PRIMARY KEY (event_id, entity_id)
);
