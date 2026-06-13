# Contributing to WorldState

Thank you for contributing to WorldState — a world-scale open-source intelligence platform.

## Development Setup

See [docs/SETUP.md](docs/SETUP.md) for full local development instructions.

## Branch Strategy

- `main` — Stable, always deployable
- `develop` — Integration branch
- `feature/*` — Feature branches
- `fix/*` — Bug fix branches

## Commit Messages

Use conventional commits:

```
feat: add event extraction pipeline
fix: resolve entity deduplication issue
docs: update ARCHITECTURE.md
chore: update dependencies
```

## Code Style

### Go
- Follow [Effective Go](https://go.dev/doc/effective_go)
- Run `gofmt` before committing
- Use meaningful package names

### Python
- Follow PEP 8
- Use [Ruff](https://docs.astral.sh/ruff/) for linting
- Type hints required for function signatures

### TypeScript
- Strict mode enabled
- Use functional components with hooks
- Follow Next.js App Router conventions

## Pull Request Process

1. Create a feature branch from `develop`
2. Write tests for new functionality
3. Ensure all tests pass
4. Update documentation if needed
5. Submit PR with clear description

## Architecture Principles

Before contributing, read [ARCHITECTURE.md](ARCHITECTURE.md). Key rules:

1. **Event-centric**: Every feature must fit the event pipeline
2. **Intelligence-first**: No direct reasoning from documents
3. **Pipeline integrity**: Document → Event → Entity → Relationship → Risk → Intelligence

Any feature that bypasses this pipeline weakens the world model.
