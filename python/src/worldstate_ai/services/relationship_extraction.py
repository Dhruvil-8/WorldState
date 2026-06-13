"""Relationship extraction service — identifies directional semantic links between entities using Gemini."""

import json
import logging
import time

from worldstate_ai.config import settings
from worldstate_ai.models import (
    RelationshipExtractionRequest,
    RelationshipExtractionResponse,
    ExtractedRelationship,
)

logger = logging.getLogger(__name__)

# Permitted database check constraints (from 005_create_relationships.sql)
ALLOWED_RELATIONSHIPS = {
    # Economic
    "imports_from", "exports_to", "produces", "consumes", "invests_in", "owns", "competes_with",
    # Political
    "allies_with", "opposes", "sanctions", "recognizes", "supports",
    # Supply Chain
    "supplies", "depends_on", "manufactures", "ships_through", "stores", "processes",
    # Financial/Analytical
    "correlates_with", "impacts", "benefits", "harms"
}


def normalize_relationship(rel: ExtractedRelationship) -> None:
    """Normalize extracted relationship properties to strictly match database check constraints."""
    rel_type = str(rel.relationship_type).lower().strip().replace(" ", "_").replace("-", "_")
    
    # Handle common casing or suffix/prefix mismatches
    if rel_type not in ALLOWED_RELATIONSHIPS:
        if "allies" in rel_type or "ally" in rel_type:
            rel.relationship_type = "allies_with"
        elif "oppose" in rel_type or "against" in rel_type:
            rel.relationship_type = "opposes"
        elif "sanction" in rel_type:
            rel.relationship_type = "sanctions"
        elif "depend" in rel_type or "reliant" in rel_type:
            rel.relationship_type = "depends_on"
        elif "supply" in rel_type or "supplier" in rel_type:
            rel.relationship_type = "supplies"
        elif "import" in rel_type:
            rel.relationship_type = "imports_from"
        elif "export" in rel_type:
            rel.relationship_type = "exports_to"
        elif "correlate" in rel_type or "link" in rel_type:
            rel.relationship_type = "correlates_with"
        elif "benefit" in rel_type or "help" in rel_type or "aid" in rel_type:
            rel.relationship_type = "benefits"
        elif "harm" in rel_type or "damage" in rel_type or "hurt" in rel_type:
            rel.relationship_type = "harms"
        elif "produce" in rel_type or "make" in rel_type:
            rel.relationship_type = "produces"
        elif "consume" in rel_type or "use" in rel_type:
            rel.relationship_type = "consumes"
        elif "invest" in rel_type:
            rel.relationship_type = "invests_in"
        elif "own" in rel_type or "possess" in rel_type:
            rel.relationship_type = "owns"
        elif "compete" in rel_type or "rival" in rel_type:
            rel.relationship_type = "competes_with"
        elif "recognize" in rel_type:
            rel.relationship_type = "recognizes"
        elif "support" in rel_type:
            rel.relationship_type = "supports"
        elif "manufacture" in rel_type:
            rel.relationship_type = "manufactures"
        elif "ship" in rel_type or "transit" in rel_type:
            rel.relationship_type = "ships_through"
        elif "store" in rel_type or "keep" in rel_type:
            rel.relationship_type = "stores"
        elif "process" in rel_type:
            rel.relationship_type = "processes"
        elif "impact" in rel_type or "affect" in rel_type:
            rel.relationship_type = "impacts"
        else:
            rel.relationship_type = "correlates_with"
    else:
        rel.relationship_type = rel_type


from worldstate_ai.services.gemini_client import call_gemini_with_retry

async def extract_relationships(request: RelationshipExtractionRequest) -> RelationshipExtractionResponse:
    """Extract directional relationships between a list of entities from a document using Gemini AI."""
    start = time.time()

    if not request.entities or len(request.entities) < 2:
        logger.info(f"Fewer than 2 entities provided for document {request.document_id} — skipping relationship extraction.")
        return RelationshipExtractionResponse(
            document_id=request.document_id,
            relationships=[],
            processing_time_ms=0
        )

    if settings.gemini_api_key and settings.gemini_api_key != "your_gemini_api_key_here":
        try:
            relationships = await _extract_with_gemini(request)
        except Exception as err:
            logger.error(f"Gemini relationship extraction failed: {err}")
            relationships = _stub_extract(request, reason=f"Gemini API call failed: {err}")
    else:
        logger.info("No Gemini API key configured — using stub relationship extraction")
        relationships = _stub_extract(request, reason="Gemini API key not configured.")

    elapsed_ms = (time.time() - start) * 1000

    return RelationshipExtractionResponse(
        document_id=request.document_id,
        relationships=relationships,
        processing_time_ms=round(elapsed_ms, 2),
    )


async def _extract_with_gemini(request: RelationshipExtractionRequest) -> list[ExtractedRelationship]:
    """Use Gemini to extract relationships between identified entities in document text."""
    entities_str = ", ".join([f"'{e}'" for e in request.entities])

    prompt = f"""You are a global intelligence analyst modeling risk networks like a Palantir system.
Analyze this document and extract directional semantic relationships between the provided entities.

Only analyze relationships between these specific entities: [{entities_str}]

Permitted relationship_types:
- Economic: [imports_from, exports_to, produces, consumes, invests_in, owns, competes_with]
- Political: [allies_with, opposes, sanctions, recognizes, supports]
- Supply Chain: [supplies, depends_on, manufactures, ships_through, stores, processes]
- Financial/Analytical: [correlates_with, impacts, benefits, harms]

For each relationship, you MUST provide:
- source_entity: The name of the source entity (must EXACTLY match one from the list of provided entities).
- target_entity: The name of the target entity (must EXACTLY match one from the list of provided entities, and cannot equal source_entity).
- relationship_type: EXACTLY one of the permitted relationship_types from the list above.
- strength: float (0.0 to 1.0) indicating relationship intensity (e.g., strong alliance = 0.9, minor trade = 0.3)
- confidence: float (0.0 to 1.0) indicating your confidence level.

Document Title: {request.title}
Document Content: {request.content[:4000]}

Respond with valid JSON array of relationships only. No markdown formatting, no explanations, no backticks.
"""

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

    raw_rels = json.loads(text)
    extracted = []
    for rel_dict in raw_rels:
        try:
            src = rel_dict.get("source_entity")
            tgt = rel_dict.get("target_entity")
            
            matched_src = None
            matched_tgt = None
            for ent in request.entities:
                if ent.lower().strip() == str(src).lower().strip():
                    matched_src = ent
                if ent.lower().strip() == str(tgt).lower().strip():
                    matched_tgt = ent

            if not matched_src or not matched_tgt or matched_src == matched_tgt:
                continue

            rel_dict["source_entity"] = matched_src
            rel_dict["target_entity"] = matched_tgt

            rel = ExtractedRelationship(**rel_dict)
            normalize_relationship(rel)
            extracted.append(rel)
        except Exception as parse_err:
            logger.error(f"Failed parsing single extracted relationship: {parse_err}. Raw: {rel_dict}")
    
    return extracted


def _stub_extract(request: RelationshipExtractionRequest, reason: str = "Gemini API key not configured.") -> list[ExtractedRelationship]:
    """Return stub relationships for testing when Gemini is unavailable."""
    if len(request.entities) >= 2:
        return [
            ExtractedRelationship(
                source_entity=request.entities[0],
                target_entity=request.entities[1],
                relationship_type="correlates_with",
                strength=0.5,
                confidence=0.3,
            )
        ]
    return []

