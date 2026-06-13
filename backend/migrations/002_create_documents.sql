-- ============================================================
-- 002: Documents
-- Raw immutable information from sources
-- ============================================================

CREATE TABLE IF NOT EXISTS documents (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id       UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    content         TEXT NOT NULL,
    summary         TEXT,
    url             TEXT,
    language        VARCHAR(10) DEFAULT 'en',
    published_at    TIMESTAMPTZ,
    ingested_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    content_hash    VARCHAR(64) NOT NULL UNIQUE,
    metadata        JSONB DEFAULT '{}',
    processed       BOOLEAN DEFAULT false,

    -- Full-text search vector
    search_vector   tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(summary, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(content, '')), 'C')
    ) STORED
);

CREATE INDEX idx_documents_source ON documents(source_id);
CREATE INDEX idx_documents_published ON documents(published_at DESC);
CREATE INDEX idx_documents_ingested ON documents(ingested_at DESC);
CREATE INDEX idx_documents_processed ON documents(processed);
CREATE INDEX idx_documents_search ON documents USING GIN(search_vector);
CREATE INDEX idx_documents_hash ON documents(content_hash);
