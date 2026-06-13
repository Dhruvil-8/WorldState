# WorldState

**open-source intelligence platform.**

WorldState continuously estimates the current state of the world using publicly available information and generates intelligence snapshots describing what changed, why it matters, who is affected, and what risks are emerging.

> [!NOTE]
> This project is a complete rewrite extension of the original [GlobalNewsTracker](https://github.com/Dhruvil-8/GlobalNewsTracker) repository, introducing multi-polar intelligence analysis, vector-based event clustering, dynamic market feedback loops, and graph-based chokepoint diagnostics.

---

## Quick Start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) & Docker Compose
- [Go 1.23+](https://go.dev/doc/install) (for local backend development)
- [Python 3.11+](https://www.python.org/downloads/) (for local AI development)
- [Node.js 20+](https://nodejs.org/) (for local frontend development)

### One-Command Startup

```bash
# Copy environment variables
cp .env.example .env

# Start everything
docker compose up
```

Services will be available at:

| Service        | URL                        |
|----------------|----------------------------|
| Frontend       | http://localhost:3000       |
| Go Backend API | http://localhost:8080       |
| Python AI API  | http://localhost:8000       |
| Meilisearch    | http://localhost:7700       |
| NATS Monitor   | http://localhost:8222       |
| PostgreSQL     | localhost:5432              |
| Redis          | localhost:6379              |

---

## Tech Stack

| Layer          | Technology                              |
|----------------|-----------------------------------------|
| Frontend       | Next.js 16, TypeScript, Tailwind CSS    |
| Backend API    | Go, Chi Router                          |
| AI Layer       | Python, FastAPI, Gemini AI Studio       |
| Primary DB     | PostgreSQL 16                           |
| Graph DB       | Apache AGE (PostgreSQL extension)       |
| Search         | Meilisearch                             |
| Cache          | Redis 7                                 |
| Messaging      | NATS with JetStream                     |
| Infrastructure | Docker Compose                          |

---

## Project Structure

```text
WorldState/
├── frontend/        # Next.js dashboard
├── backend/         # Go API & services
├── python/          # Python AI layer
├── infrastructure/  # Database configs
├── docs/            # Documentation
└── docker-compose.yml
```

---

## Core Concepts

1. **Events** — Everything meaningful becomes an event (sanctions, elections, disasters)
2. **Entities** — World objects (countries, companies, people, commodities)
3. **Relationships** — How entities connect (supplies, sanctions, allies_with)
4. **World State** — Continuously updated risk model of the world
5. **Intelligence** — Generated insights from the world state

---

## Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — System design
- [docs/DATA_MODEL.md](docs/DATA_MODEL.md) — Data schemas
- [docs/ROADMAP.md](docs/ROADMAP.md) — Development phases
- [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) — How to contribute
- [docs/SETUP.md](docs/SETUP.md) — Local development guide

---

## License

MIT
