"""Consensus Agent — Resolves contradictions and consolidates information between colliding events."""

import json
import logging

from worldstate_ai.config import settings
from worldstate_ai.models import EventCollisionPayload, ConsensusEventResponse
from worldstate_ai.services.gemini_client import call_gemini_with_retry

logger = logging.getLogger(__name__)

async def resolve_event_collision(payload: EventCollisionPayload) -> ConsensusEventResponse:
    """Invokes Gemini to resolve conflicting or colliding events and produce a consensus."""
    if not settings.gemini_api_key or settings.gemini_api_key == "your_gemini_api_key_here":
        # Fallback stub behavior if API key is not configured
        return ConsensusEventResponse(
            resolved_title=payload.existing_title,
            resolved_description=f"{payload.existing_description} (Consolidated: {payload.new_description})",
            resolved_severity=(payload.existing_severity + payload.new_severity) / 2.0,
            resolved_confidence=(payload.existing_confidence + payload.new_confidence) / 2.0,
            source_count_increment=1,
            timeline_entry="Merged events locally without LLM resolution."
        )

    prompt = f"""You are an elite intelligence consensus engine. Two events have been identified as referencing the same underlying geopolitical or economic situation, but they come from different updates or documents.
Your task is to compare them, resolve any factual contradictions or discrepancies (e.g. casualty counts, statements, severity), and merge them into a single consolidated, highly professional intelligence entry.

---
[Existing Event Entry]
Title: {payload.existing_title}
Description: {payload.existing_description}
Severity Rating: {payload.existing_severity}
Confidence Rating: {payload.existing_confidence}

---
[New Colliding Event Update]
Title: {payload.new_title}
Description: {payload.new_description}
Severity Rating: {payload.new_severity}
Confidence Rating: {payload.new_confidence}

---
Guidelines for resolution:
1. Resolved Title: Synthesize a clean, professional title.
2. Resolved Description: Synthesize the events. If they conflict or contradict (e.g. source A reports a blockade but source B disputes it), explicitly note the contradiction or dispute in a professional, objective tone (e.g. "While early sources reported a complete shutdown, subsequent updates indicate partial operations continue under dispute"). Include a short chronological timeline if relevant.
3. Resolved Severity: Evaluate the resolved severity on a scale of 0 to 10.
4. Resolved Confidence: Set a confidence rating between 0.0 and 1.0.
5. Timeline Entry: Provide a single-sentence update entry summarizing the modification (e.g. "Consolidated initial reports with updates regarding blockade status").

Return the result as a valid JSON object ONLY. No markdown formatting.
JSON format must contain EXACTLY the following keys:
- "resolved_title" (string)
- "resolved_description" (string)
- "resolved_severity" (float)
- "resolved_confidence" (float)
- "timeline_entry" (string)
"""

    try:
        response_text = await call_gemini_with_retry(prompt)
        
        # Clean up code blocks if present
        text = response_text.strip()
        if text.startswith("```"):
            parts = text.split("\n", 1)
            if len(parts) > 1:
                text = parts[1]
            else:
                text = parts[0][3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()

        data = json.loads(text)
        return ConsensusEventResponse(
            resolved_title=data.get("resolved_title", payload.existing_title),
            resolved_description=data.get("resolved_description", payload.existing_description),
            resolved_severity=float(data.get("resolved_severity", payload.existing_severity)),
            resolved_confidence=float(data.get("resolved_confidence", payload.existing_confidence)),
            source_count_increment=1,
            timeline_entry=data.get("timeline_entry", "Consolidated updates.")
        )
    except Exception as e:
        logger.error(f"Error during Gemini event collision resolution: {e}. Raw response: {response_text if 'response_text' in locals() else 'None'}")
        return ConsensusEventResponse(
            resolved_title=payload.existing_title,
            resolved_description=f"{payload.existing_description} (Error during resolution: {payload.new_description})",
            resolved_severity=(payload.existing_severity + payload.new_severity) / 2.0,
            resolved_confidence=(payload.existing_confidence + payload.new_confidence) / 2.0,
            source_count_increment=1,
            timeline_entry="Merged events after system error."
        )
