-- ============================================================
-- Migration: 010_create_cascading_risks.sql
-- Create table to store deep cascading risk analysis reports
-- ============================================================

CREATE TABLE IF NOT EXISTS cascading_risks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    scenario TEXT NOT NULL,
    severity DOUBLE PRECISION NOT NULL,
    confidence DOUBLE PRECISION NOT NULL,
    impacted_entity_ids UUID[] NOT NULL,
    trigger_event_ids UUID[] NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
