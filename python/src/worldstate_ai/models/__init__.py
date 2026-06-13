"""Pydantic models for WorldState AI layer."""

from datetime import datetime
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class EventExtractionRequest(BaseModel):
    """Request to extract events from a document."""

    document_id: UUID
    title: str
    content: str
    source_name: str = ""


class ExtractedEvent(BaseModel):
    """An event extracted from a document."""

    event_type: str
    title: str
    description: str = ""
    severity: float = Field(ge=0, le=10, default=5.0)
    confidence: float = Field(ge=0, le=1, default=0.5)
    category: str = "other"
    entities: list[str] = Field(default_factory=list)
    location: dict | None = None
    embedding: list[float] | None = None


class EventExtractionResponse(BaseModel):
    """Response containing extracted events."""

    document_id: UUID
    events: list[ExtractedEvent] = Field(default_factory=list)
    processing_time_ms: float = 0


class EntityExtractionRequest(BaseModel):
    """Request to extract entities from text."""

    text: str
    context: str = ""


class ExtractedEntity(BaseModel):
    """An entity extracted from text."""

    name: str
    entity_type: str
    aliases: list[str] = Field(default_factory=list)
    importance: int = Field(ge=0, le=100, default=50)
    confidence: float = Field(ge=0, le=1, default=0.5)


class EntityExtractionResponse(BaseModel):
    """Response containing extracted entities."""

    entities: list[ExtractedEntity] = Field(default_factory=list)
    processing_time_ms: float = 0


class IntelligenceRequest(BaseModel):
    """Request to generate an intelligence briefing."""

    snapshot_type: str = "daily"
    focus_areas: list[str] = Field(default_factory=list)


class IntelligenceBriefing(BaseModel):
    """Generated intelligence briefing."""

    id: UUID = Field(default_factory=uuid4)
    snapshot_type: str = "daily"
    title: str
    summary: str
    top_risks: list[dict] = Field(default_factory=list)
    top_opportunities: list[dict] = Field(default_factory=list)
    emerging_signals: list[dict] = Field(default_factory=list)
    regions_to_watch: list[dict] = Field(default_factory=list)
    confidence: int = Field(ge=0, le=100, default=50)
    generated_at: datetime = Field(default_factory=datetime.utcnow)


class ExtractedRelationship(BaseModel):
    """A semantic relationship extracted between two entities."""

    source_entity: str
    target_entity: str
    relationship_type: str
    strength: float = Field(ge=0, le=1, default=0.5)
    confidence: float = Field(ge=0, le=1, default=0.5)


class RelationshipExtractionRequest(BaseModel):
    """Request to extract semantic relationships from text given known entities."""

    document_id: UUID
    title: str
    content: str
    entities: list[str] = Field(default_factory=list)


class RelationshipExtractionResponse(BaseModel):
    """Response containing extracted relationships."""

    document_id: UUID
    relationships: list[ExtractedRelationship] = Field(default_factory=list)
    processing_time_ms: float = 0

