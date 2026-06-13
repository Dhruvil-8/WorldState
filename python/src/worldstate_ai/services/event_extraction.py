"""Event extraction service — converts documents into structured events using Gemini."""

import json
import logging
import time

from worldstate_ai.config import settings
from worldstate_ai.models import (
    EventExtractionRequest,
    EventExtractionResponse,
    ExtractedEvent,
)

logger = logging.getLogger(__name__)

# Permitted database check constraints (from 003_create_events.sql)
ALLOWED_EVENT_TYPES = {
    "conflict", "military_action", "election", "sanction", "diplomatic_action", "border_dispute", "government_change",
    "interest_rate_change", "inflation_release", "gdp_release", "pmi_release", "employment_data", "debt_event",
    "tariff", "export_restriction", "import_restriction", "trade_agreement",
    "factory_shutdown", "port_congestion", "logistics_disruption",
    "oil_shock", "gas_shock", "food_shock", "metal_shock",
    "earthquake", "flood", "wildfire", "drought", "storm",
    "cyber_attack", "data_breach", "infrastructure_attack",
    "policy_change", "other"
}

ALLOWED_CATEGORIES = {
    "geopolitical", "economic", "trade", "supply_chain", "commodity", "environment", "cyber", "other"
}


def normalize_event(evt: ExtractedEvent) -> None:
    """Normalize extracted event properties to strictly match database check constraints."""
    # 1. Normalize Category
    cat = str(evt.category).lower().strip().replace(" ", "_")
    if cat not in ALLOWED_CATEGORIES:
        if "geo" in cat or "politics" in cat:
            evt.category = "geopolitical"
        elif "econ" in cat or "finance" in cat or "market" in cat:
            evt.category = "economic"
        elif "trade" in cat or "tariff" in cat or "export" in cat or "import" in cat:
            evt.category = "trade"
        elif "supply" in cat or "logistics" in cat or "port" in cat or "shipping" in cat or "transport" in cat:
            evt.category = "supply_chain"
        elif "metal" in cat or "oil" in cat or "energy" in cat or "gas" in cat or "resource" in cat:
            evt.category = "commodity"
        elif "hack" in cat or "ransomware" in cat or "cyber" in cat or "security" in cat:
            evt.category = "cyber"
        elif "weather" in cat or "quake" in cat or "climate" in cat or "seismic" in cat or "disaster" in cat:
            evt.category = "environment"
        else:
            evt.category = "other"
    else:
        evt.category = cat

    # 2. Normalize Event Type
    evt_type = str(evt.event_type).lower().strip().replace(" ", "_").replace("-", "_")
    if evt_type not in ALLOWED_EVENT_TYPES:
        if "ransomware" in evt_type or "cyber" in evt_type or "hack" in evt_type or "malware" in evt_type:
            evt.event_type = "cyber_attack"
        elif "data_breach" in evt_type or "leak" in evt_type:
            evt.event_type = "data_breach"
        elif "infrastructure_attack" in evt_type:
            evt.event_type = "infrastructure_attack"
        elif "drought" in evt_type:
            evt.event_type = "drought"
        elif "earthquake" in evt_type or "seismic" in evt_type or "tremor" in evt_type:
            evt.event_type = "earthquake"
        elif "flood" in evt_type or "inundation" in evt_type:
            evt.event_type = "flood"
        elif "storm" in evt_type or "hurricane" in evt_type or "typhoon" in evt_type or "cyclone" in evt_type:
            evt.event_type = "storm"
        elif "wildfire" in evt_type or "fire" in evt_type:
            evt.event_type = "wildfire"
        elif "sanction" in evt_type or "embargo" in evt_type:
            evt.event_type = "sanction"
        elif "tariff" in evt_type or "customs" in evt_type:
            evt.event_type = "tariff"
        elif "export" in evt_type:
            evt.event_type = "export_restriction"
        elif "import" in evt_type:
            evt.event_type = "import_restriction"
        elif "trade_agreement" in evt_type or "deal" in evt_type:
            evt.event_type = "trade_agreement"
        elif "interest" in evt_type or "rate_cut" in evt_type or "rate_hike" in evt_type or "rate_change" in evt_type:
            evt.event_type = "interest_rate_change"
        elif "inflation" in evt_type or "cpi" in evt_type or "ppi" in evt_type:
            evt.event_type = "inflation_release"
        elif "gdp" in evt_type:
            evt.event_type = "gdp_release"
        elif "pmi" in evt_type:
            evt.event_type = "pmi_release"
        elif "employment" in evt_type or "job" in evt_type or "payroll" in evt_type:
            evt.event_type = "employment_data"
        elif "debt" in evt_type or "default" in evt_type:
            evt.event_type = "debt_event"
        elif "factory" in evt_type or "shutdown" in evt_type or "halt" in evt_type or "plant_close" in evt_type:
            evt.event_type = "factory_shutdown"
        elif "port" in evt_type or "terminal" in evt_type or "congestion" in evt_type or "dock" in evt_type:
            evt.event_type = "port_congestion"
        elif "logistics" in evt_type or "disrupt" in evt_type or "shipping" in evt_type or "transit" in evt_type:
            evt.event_type = "logistics_disruption"
        elif "oil" in evt_type or "petroleum" in evt_type or "crude" in evt_type:
            evt.event_type = "oil_shock"
        elif "gas" in evt_type or "lng" in evt_type:
            evt.event_type = "gas_shock"
        elif "food" in evt_type or "agriculture" in evt_type or "grain" in evt_type or "wheat" in evt_type:
            evt.event_type = "food_shock"
        elif "metal" in evt_type or "copper" in evt_type or "gold" in evt_type or "lithium" in evt_type:
            evt.event_type = "metal_shock"
        elif "military" in evt_type or "army" in evt_type or "navy" in evt_type or "war" in evt_type or "strike" in evt_type or "troop" in evt_type:
            evt.event_type = "military_action"
        elif "election" in evt_type or "vote" in evt_type or "ballot" in evt_type:
            evt.event_type = "election"
        elif "conflict" in evt_type or "skirmish" in evt_type or "clash" in evt_type:
            evt.event_type = "conflict"
        elif "diplomat" in evt_type or "treaty" in evt_type or "summit" in evt_type or "alliance" in evt_type:
            evt.event_type = "diplomatic_action"
        elif "border" in evt_type or "demarcation" in evt_type:
            evt.event_type = "border_dispute"
        elif "government" in evt_type or "coup" in evt_type or "cabinet" in evt_type or "regime" in evt_type:
            evt.event_type = "government_change"
        elif "policy" in evt_type or "law" in evt_type or "regulation" in evt_type or "decree" in evt_type:
            evt.event_type = "policy_change"
        else:
            evt.event_type = "other"
    else:
        evt.event_type = evt_type


from worldstate_ai.services.gemini_client import call_gemini_with_retry, get_gemini_embedding

async def extract_events(request: EventExtractionRequest) -> EventExtractionResponse:
    """Extract events from a document using Gemini AI."""
    start = time.time()

    if settings.gemini_api_key and settings.gemini_api_key != "your_gemini_api_key_here":
        try:
            events = await _extract_with_gemini(request)
        except Exception as err:
            logger.error(f"Gemini event extraction failed: {err}")
            events = _stub_extract(request, reason=f"Gemini API call failed: {err}")
    else:
        logger.info("No Gemini API key configured — using stub extraction")
        events = _stub_extract(request, reason="Gemini API key not configured.")

    # Calculate vector embeddings for the extracted events
    if settings.gemini_api_key and settings.gemini_api_key != "your_gemini_api_key_here":
        for evt in events:
            try:
                text_to_embed = f"{evt.title}: {evt.description}"
                evt.embedding = await get_gemini_embedding(text_to_embed)
            except Exception as emb_err:
                logger.warning(f"Could not generate embedding for event '{evt.title}': {emb_err}")

    elapsed_ms = (time.time() - start) * 1000

    return EventExtractionResponse(
        document_id=request.document_id,
        events=events,
        processing_time_ms=round(elapsed_ms, 2),
    )


async def _extract_with_gemini(request: EventExtractionRequest) -> list[ExtractedEvent]:
    """Use Gemini to extract events from document text."""
    prompt = f"""You are a global intelligence analyst. Analyze this document and extract
structured events.

Permitted categories: [geopolitical, economic, trade, supply_chain, commodity, environment, cyber, other]

Permitted event_types:
- Geopolitical: [conflict, military_action, election, sanction, diplomatic_action, border_dispute, government_change]
- Economic: [interest_rate_change, inflation_release, gdp_release, pmi_release, employment_data, debt_event]
- Trade: [tariff, export_restriction, import_restriction, trade_agreement]
- Supply Chain: [factory_shutdown, port_congestion, logistics_disruption]
- Commodity: [oil_shock, gas_shock, food_shock, metal_shock]
- Environment: [earthquake, flood, wildfire, drought, storm]
- Cyber: [cyber_attack, data_breach, infrastructure_attack]
- Other: [policy_change, other]

For each event, you MUST provide:
- event_type: EXACTLY one of the permitted event_types from the list above. DO NOT return arbitrary strings.
- title: concise event title
- description: brief description
- severity: 0-10 scale
- confidence: 0-1 scale
- category: EXACTLY one of the permitted categories from the list above.
- entities: list of entity names involved
- location: an object with keys "name" (string), "latitude" (float, e.g. 23.5), and "longitude" (float, e.g. 121.5). Estimate the geographical coordinates (like regional centroid coordinates) if not explicitly mentioned in the text.

Document Title: {request.title}
Document Content: {request.content[:4000]}

Respond with valid JSON array of events only. No markdown formatting."""

    text = await call_gemini_with_retry(prompt)

    if text.startswith("```"):
        parts = text.split("\n", 1)
        if len(parts) > 1:
            text = parts[1]
        else:
            text = parts[0][3:]
    if text.endswith("```"):
        text = text[:-3]
    text = text.strip()

    raw_events = json.loads(text)
    extracted = []
    for evt_dict in raw_events:
        try:
            evt = ExtractedEvent(**evt_dict)
            normalize_event(evt)
            extracted.append(evt)
        except Exception as parse_err:
            logger.error(f"Failed parsing single extracted event: {parse_err}. Raw: {evt_dict}")
    
    return extracted


def _stub_extract(
    request: EventExtractionRequest,
    reason: str = "Gemini API key not configured.",
) -> list[ExtractedEvent]:
    """Return a stub event for pipeline testing."""
    return [
        ExtractedEvent(
            event_type="other",
            title=f"Event from: {request.title[:80]}",
            description=f"Stub event — {reason}",
            severity=5.0,
            confidence=0.3,
            category="other",
            entities=[],
        )
    ]

