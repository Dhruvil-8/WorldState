# ============================================================
# WorldState Python AI Layer — Dockerfile
# ============================================================

FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python package and dependencies
COPY pyproject.toml .
COPY src/ ./src/
RUN pip install --no-cache-dir .

EXPOSE 8000

HEALTHCHECK --interval=15s --timeout=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "worldstate_ai.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
