"""Unit tests for WorldState AI extraction services and robust parser logic."""

import json
import pytest
from uuid import uuid4

from worldstate_ai.models import EventExtractionRequest, EntityExtractionRequest
from worldstate_ai.services.event_extraction import extract_events, _stub_extract as stub_events
from worldstate_ai.services.entity_extraction import extract_entities, _stub_extract as stub_entities

# Helper function to emulate LLM markdown block parsing
def parse_markdown_json(text: str) -> dict:
    """Robust parser logic being tested."""
    text = text.strip()
    if text.startswith("```"):
        parts = text.split("\n", 1)
        if len(parts) > 1:
            text = parts[1]
        else:
            text = parts[0][3:]
    if text.endswith("```"):
        text = text[:-3]
    return json.loads(text.strip())

def test_robust_json_cleaning():
    """Verify that different LLM codeblock markdown wrappers are correctly sanitized and parsed."""
    # Scenario A: Standard JSON markdown
    input_a = "```json\n{\"status\": \"active\", \"severity\": 8.5}\n```"
    res_a = parse_markdown_json(input_a)
    assert res_a["status"] == "active"
    assert res_a["severity"] == 8.5

    # Scenario B: Triple ticks without language indicator
    input_b = "```\n{\"status\": \"resolved\", \"severity\": 2.1}\n```"
    res_b = parse_markdown_json(input_b)
    assert res_b["status"] == "resolved"
    assert res_b["severity"] == 2.1

    # Scenario C: Single line triple ticks
    input_c = "```{\"status\": \"monitoring\"}```"
    res_c = parse_markdown_json(input_c)
    assert res_c["status"] == "monitoring"

    # Scenario D: Unwrapped raw JSON
    input_d = "{\"status\": \"detected\"}"
    res_d = parse_markdown_json(input_d)
    assert res_d["status"] == "detected"

def test_event_extraction_fallback_stubs():
    """Verify that event extraction returns stub results correctly when no API keys are present."""
    doc_id = uuid4()
    req = EventExtractionRequest(
        document_id=doc_id,
        title="Bilateral Tariff Adjustments Announced",
        content="Raw content for trade tariffs."
    )
    
    stubs = stub_events(req)
    assert len(stubs) == 1
    assert stubs[0].event_type == "other"
    assert "Tariff Adjustments" in stubs[0].title
    assert stubs[0].category == "other"

@pytest.mark.asyncio
async def test_api_extract_events_stub_flow():
    """Test that extract_events gracefully delegates to stub extraction when key is unconfigured."""
    doc_id = uuid4()
    req = EventExtractionRequest(
        document_id=doc_id,
        title="Test Document",
        content="Test content text."
    )
    
    res = await extract_events(req)
    assert res.document_id == doc_id
    assert len(res.events) == 1
    assert res.events[0].event_type == "other"
    assert res.processing_time_ms > 0

def test_entity_extraction_fallback_stubs():
    """Verify that entity extraction returns fallback stubs correctly."""
    req = EntityExtractionRequest(
        text="Apple is a tech company located in Cupertino."
    )
    
    stubs = stub_entities(req)
    assert len(stubs) == 1
    assert stubs[0].name == "Unknown Entity"
    assert stubs[0].entity_type == "organization"
    assert stubs[0].importance == 50

@pytest.mark.asyncio
async def test_api_extract_entities_stub_flow():
    """Test that extract_entities runs cleanly through the fallback pipeline."""
    req = EntityExtractionRequest(
        text="Test entity text."
    )
    
    res = await extract_entities(req)
    assert len(res.entities) == 1
    assert res.entities[0].name == "Unknown Entity"
    assert res.processing_time_ms > 0
