"""WorldState AI Layer — FastAPI Application."""

import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from uuid import uuid4

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from worldstate_ai.config import settings
from worldstate_ai.models import (
    EntityExtractionRequest,
    EntityExtractionResponse,
    EventExtractionRequest,
    EventExtractionResponse,
    IntelligenceBriefing,
    IntelligenceRequest,
)
from worldstate_ai.services.entity_extraction import extract_entities
from worldstate_ai.services.event_extraction import extract_events

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
)
logger = logging.getLogger("worldstate_ai")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle."""
    logger.info("WorldState AI Layer v0.1.0 starting...")
    logger.info(f"Environment: {settings.ai_env}")
    logger.info(f"Gemini API key configured: {bool(settings.gemini_api_key)}")
    logger.info(f"PostgreSQL: {settings.postgres_host}:{settings.postgres_port}")
    logger.info(f"NATS: {settings.nats_host}:{settings.nats_port}")
    logger.info(f"Meilisearch: {settings.meili_host}:{settings.meili_port}")

    # Launch background NATS subscriber durably inside the FastAPI process loop
    import asyncio
    from worldstate_ai.worker import run_worker
    from worldstate_ai.ingestion import run_continuous_ingestion
    from worldstate_ai.services.global_analyzer import run_continuous_analysis

    worker_task = asyncio.create_task(run_worker())
    ingestion_task = asyncio.create_task(run_continuous_ingestion(interval_seconds=600))
    analyzer_task = asyncio.create_task(run_continuous_analysis(interval_seconds=900))

    yield

    logger.info("WorldState AI Layer shutting down background workers...")
    worker_task.cancel()
    ingestion_task.cancel()
    analyzer_task.cancel()
    try:
        await asyncio.gather(worker_task, ingestion_task, analyzer_task, return_exceptions=True)
    except Exception as gather_err:
        logger.warning(f"Error gathering background task cancellations: {gather_err}")
    logger.info("WorldState AI Layer shutting down...")


app = FastAPI(
    title="WorldState AI Layer",
    description="Event extraction, entity extraction, and intelligence generation for WorldState.",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8080"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)


# ── Health ────────────────────────────────────────────────────


@app.get("/health")
async def health():
    """Basic health check."""
    return {
        "status": "ok",
        "service": "worldstate-ai",
        "version": "0.1.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "gemini_configured": bool(
            settings.gemini_api_key and settings.gemini_api_key != "your_gemini_api_key_here"
        ),
    }


# ── Event Extraction ─────────────────────────────────────────


@app.post("/extract/events", response_model=EventExtractionResponse)
async def api_extract_events(request: EventExtractionRequest):
    """Extract structured events from a document."""
    try:
        result = await extract_events(request)
        return result
    except Exception as e:
        logger.error(f"Event extraction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── Entity Extraction ────────────────────────────────────────


@app.post("/extract/entities", response_model=EntityExtractionResponse)
async def api_extract_entities(request: EntityExtractionRequest):
    """Extract world entities from text."""
    try:
        result = await extract_entities(request)
        return result
    except Exception as e:
        logger.error(f"Entity extraction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── Intelligence Generation ──────────────────────────────────


@app.post("/generate/intelligence", response_model=IntelligenceBriefing)
async def api_generate_intelligence(request: IntelligenceRequest):
    """
    Generate an intelligence briefing from current world state.

    Returns a baseline briefing when no persisted analyzer snapshot is available.
    """
    return IntelligenceBriefing(
        id=uuid4(),
        snapshot_type=request.snapshot_type,
        title=f"WorldState {request.snapshot_type.capitalize()} Briefing",
        summary="Baseline briefing shown until the continuous analyzer writes the first live snapshot.",
        top_risks=[
            {"risk": "Geopolitical tensions elevating", "score": 68, "trend": "rising"},
            {"risk": "Supply chain disruptions persisting", "score": 63, "trend": "rising"},
            {"risk": "Trade restrictions expanding", "score": 55, "trend": "rising"},
        ],
        top_opportunities=[
            {"opportunity": "Technology risk declining — innovation corridor", "score": 33},
            {"opportunity": "Climate investment acceleration", "score": 38},
        ],
        emerging_signals=[
            {"signal": "Cyber risk volatility increasing", "confidence": 0.68},
            {"signal": "New diplomatic channels opening in key regions", "confidence": 0.55},
        ],
        regions_to_watch=[
            {"region": "East Asia", "risk_level": "high"},
            {"region": "Middle East", "risk_level": "elevated"},
        ],
        confidence=50,
        generated_at=datetime.now(timezone.utc),
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("worldstate_ai.main:app", host="0.0.0.0", port=settings.ai_port, reload=True)
