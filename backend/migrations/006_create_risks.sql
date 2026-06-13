-- ============================================================
-- 006: Risk Scores
-- Time-series risk measurements — nothing is overwritten
-- ============================================================

CREATE TABLE IF NOT EXISTS risk_scores (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    risk_type       VARCHAR(30) NOT NULL CHECK (risk_type IN (
                        'geopolitical', 'economic', 'financial', 'energy',
                        'supply_chain', 'cyber', 'climate', 'food_security',
                        'trade', 'technology'
                    )),
    score           INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
    trend           VARCHAR(10) NOT NULL DEFAULT 'stable' CHECK (trend IN (
                        'rising', 'falling', 'stable', 'volatile'
                    )),
    confidence      INTEGER NOT NULL DEFAULT 50 CHECK (confidence BETWEEN 0 AND 100),
    contributing_events UUID[] DEFAULT '{}',
    reasoning       TEXT,
    metadata        JSONB DEFAULT '{}',
    measured_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_risk_scores_type ON risk_scores(risk_type);
CREATE INDEX idx_risk_scores_measured ON risk_scores(measured_at DESC);
CREATE INDEX idx_risk_scores_type_time ON risk_scores(risk_type, measured_at DESC);

-- Event impact on entities
CREATE TABLE IF NOT EXISTS event_impacts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id        UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    entity_id       UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    impact_type     VARCHAR(10) NOT NULL CHECK (impact_type IN (
                        'positive', 'negative', 'neutral', 'mixed'
                    )),
    impact_score    NUMERIC(4,2) NOT NULL CHECK (impact_score BETWEEN -1 AND 1),
    confidence      NUMERIC(4,2) DEFAULT 0.50 CHECK (confidence BETWEEN 0 AND 1),
    description     TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_event_impacts_event ON event_impacts(event_id);
CREATE INDEX idx_event_impacts_entity ON event_impacts(entity_id);
