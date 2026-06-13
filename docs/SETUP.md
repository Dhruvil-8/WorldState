# Local Development Setup

## Prerequisites

| Tool            | Version  | Install                                      |
|-----------------|----------|----------------------------------------------|
| Docker          | 24+      | https://docs.docker.com/get-docker/           |
| Docker Compose  | v2+      | Included with Docker Desktop                  |
| Go              | 1.23+    | https://go.dev/doc/install                    |
| Python          | 3.11+    | https://www.python.org/downloads/             |
| Node.js         | 20+      | https://nodejs.org/                           |
| Git             | latest   | https://git-scm.com/                          |

## Quick Start (Docker)

```bash
# 1. Clone the repository
git clone https://github.com/worldstate/worldstate.git
cd worldstate

# 2. Copy environment config
cp .env.example .env

# 3. (Optional) Add your Gemini API key to .env
# GEMINI_API_KEY=your_key_here

# 4. Start all services
docker compose up -d

# 5. Verify health
curl http://localhost:8080/api/health    # Go Backend
curl http://localhost:8000/health        # Python AI
curl http://localhost:7700/health        # Meilisearch
curl http://localhost:8222/varz          # NATS
```

## Local Development (Without Docker)

### Backend (Go)

```bash
cd backend
go mod download
go run ./cmd/server
```

Requires PostgreSQL, Redis, Meilisearch, and NATS running locally or via Docker.

### AI Layer (Python)

```bash
cd python
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -e ".[dev]"
uvicorn worldstate_ai.main:app --reload --port 8000
```

### Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

## Database Access

### PostgreSQL

```bash
docker exec -it ws-postgres psql -U worldstate -d worldstate
```

### Redis

```bash
docker exec -it ws-redis redis-cli -a changeme_redis_password
```

### Apache AGE (Graph Queries)

```sql
-- In psql:
LOAD 'age';
SET search_path = ag_catalog, "$user", public;

-- Example graph query
SELECT * FROM cypher('worldstate', $$
  MATCH (n) RETURN n LIMIT 10
$$) AS (result agtype);
```

## Useful Commands

```bash
# Rebuild all containers
docker compose build --no-cache

# View logs
docker compose logs -f backend
docker compose logs -f ai
docker compose logs -f postgres

# Stop everything
docker compose down

# Reset databases (destructive!)
docker compose down -v
```

## RAM Budget (~1 GB total for services)

| Service     | Expected RAM |
|-------------|-------------|
| PostgreSQL  | ~300 MB     |
| Redis       | ~50 MB      |
| Meilisearch | ~50 MB      |
| NATS        | ~30 MB      |
| Go Backend  | ~50 MB      |
| Python AI   | ~150 MB     |
| Next.js Dev | ~400 MB     |
