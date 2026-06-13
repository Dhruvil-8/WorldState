-- ============================================================
-- WorldState — PostgreSQL Initialization
-- Runs once on first container startup
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "age";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Load AGE into the search path
SET search_path = ag_catalog, "$user", public;

-- Create the WorldState graph
SELECT create_graph('worldstate');

-- ============================================================
-- Run migration files in order
-- Reset search_path so tables are created in public schema
-- ============================================================
SET search_path = public;

\i /docker-entrypoint-initdb.d/migrations/001_create_sources.sql
\i /docker-entrypoint-initdb.d/migrations/002_create_documents.sql
\i /docker-entrypoint-initdb.d/migrations/003_create_events.sql
\i /docker-entrypoint-initdb.d/migrations/004_create_entities.sql
\i /docker-entrypoint-initdb.d/migrations/005_create_relationships.sql
\i /docker-entrypoint-initdb.d/migrations/006_create_risks.sql
\i /docker-entrypoint-initdb.d/migrations/007_create_world_state.sql
\i /docker-entrypoint-initdb.d/migrations/008_create_intelligence.sql
\i /docker-entrypoint-initdb.d/migrations/009_create_asset_prices.sql
