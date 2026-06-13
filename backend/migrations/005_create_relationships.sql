-- ============================================================
-- 005: Relationships
-- Connections between entities — the foundation of intelligence
-- ============================================================

CREATE TABLE IF NOT EXISTS relationships (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_entity_id    UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    target_entity_id    UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    relationship_type   VARCHAR(30) NOT NULL CHECK (relationship_type IN (
                            -- Economic
                            'imports_from', 'exports_to', 'produces', 'consumes',
                            'invests_in', 'owns', 'competes_with',
                            -- Political
                            'allies_with', 'opposes', 'sanctions', 'recognizes', 'supports',
                            -- Supply Chain
                            'supplies', 'depends_on', 'manufactures', 'ships_through',
                            'stores', 'processes',
                            -- Financial
                            'correlates_with', 'impacts', 'benefits', 'harms'
                        )),
    strength            NUMERIC(4,2) DEFAULT 0.50 CHECK (strength BETWEEN 0 AND 1),
    confidence          NUMERIC(4,2) DEFAULT 0.50 CHECK (confidence BETWEEN 0 AND 1),
    metadata            JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(source_entity_id, target_entity_id, relationship_type)
);

CREATE INDEX idx_relationships_source ON relationships(source_entity_id);
CREATE INDEX idx_relationships_target ON relationships(target_entity_id);
CREATE INDEX idx_relationships_type ON relationships(relationship_type);
CREATE INDEX idx_relationships_strength ON relationships(strength DESC);
