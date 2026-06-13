-- ============================================================
-- 008: Intelligence Snapshots
-- Generated intelligence output — what users consume
-- ============================================================

CREATE TABLE IF NOT EXISTS intelligence_snapshots (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    snapshot_type       VARCHAR(20) NOT NULL DEFAULT 'hourly' CHECK (snapshot_type IN (
                            'hourly', 'daily', 'weekly', 'alert', 'custom'
                        )),
    title               TEXT NOT NULL,
    summary             TEXT NOT NULL,
    top_risks           JSONB DEFAULT '[]',
    top_opportunities   JSONB DEFAULT '[]',
    regions_to_watch    JSONB DEFAULT '[]',
    critical_events     JSONB DEFAULT '[]',
    emerging_signals    JSONB DEFAULT '[]',
    second_order_effects JSONB DEFAULT '[]',
    third_order_effects JSONB DEFAULT '[]',
    world_state_id      UUID REFERENCES world_state(id),
    confidence          INTEGER NOT NULL DEFAULT 50 CHECK (confidence BETWEEN 0 AND 100),
    metadata            JSONB DEFAULT '{}',
    generated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_intelligence_type ON intelligence_snapshots(snapshot_type);
CREATE INDEX idx_intelligence_time ON intelligence_snapshots(generated_at DESC);
