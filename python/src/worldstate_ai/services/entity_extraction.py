"""Entity extraction service — identifies world entities from text using Gemini."""

import json
import logging
import time

from worldstate_ai.config import settings
from worldstate_ai.models import (
    EntityExtractionRequest,
    EntityExtractionResponse,
    ExtractedEntity,
)

logger = logging.getLogger(__name__)


from worldstate_ai.services.gemini_client import call_gemini_with_retry

async def extract_entities(request: EntityExtractionRequest) -> EntityExtractionResponse:
    """Extract entities from text using Gemini AI."""
    start = time.time()

    if settings.gemini_api_key and settings.gemini_api_key != "your_gemini_api_key_here":
        try:
            entities = await _extract_with_gemini(request)
        except Exception as err:
            logger.error(f"Gemini entity extraction failed: {err}")
            entities = _stub_extract(request, reason=f"Gemini API call failed: {err}")
    else:
        logger.info("No Gemini API key configured — using stub entity extraction")
        entities = _stub_extract(request, reason="Gemini API key not configured.")

    elapsed_ms = (time.time() - start) * 1000

    return EntityExtractionResponse(
        entities=entities,
        processing_time_ms=round(elapsed_ms, 2),
    )


async def _extract_with_gemini(request: EntityExtractionRequest) -> list[ExtractedEntity]:
    """Use Gemini to extract entities from text."""
    prompt = f"""You are a global intelligence analyst. Identify all significant entities in
this text. For each entity, provide:
- name: the primary name
- entity_type: one of [country, region, city, organization, company, industry, commodity,
  currency, person, military_unit, infrastructure, technology, financial_asset, policy,
  treaty, port, shipping_route, energy_asset]
- aliases: alternative names
- importance: 0-100 scale (100 = critical global importance)
- confidence: 0-1 scale

Text: {request.text[:4000]}

Respond with valid JSON array of entities only. No markdown formatting."""

    text = await call_gemini_with_retry(prompt)

    text = text.strip()
    if text.startswith("```"):
        parts = text.split("\n", 1)
        if len(parts) > 1:
            text = parts[1]
        else:
            text = parts[0][3:]
    if text.endswith("```"):
        text = text[:-3]
    text = text.strip()

    raw_entities = json.loads(text)
    return [ExtractedEntity(**ent) for ent in raw_entities]


def _stub_extract(request: EntityExtractionRequest, reason: str = "Gemini API key not configured.") -> list[ExtractedEntity]:
    """Return stub entities for pipeline testing."""
    return [
        ExtractedEntity(
            name="Unknown Entity",
            entity_type="organization",
            aliases=[],
            importance=50,
            confidence=0.3,
        )
    ]

