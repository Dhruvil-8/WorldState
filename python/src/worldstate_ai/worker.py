"""WorldState AI Layer — NATS JetStream Asynchronous Processing Worker."""

import asyncio
import json
import logging
import sys
from uuid import UUID

from nats.aio.client import Client as NATS

from worldstate_ai.config import settings
from worldstate_ai.models import (
    EntityExtractionRequest,
    EventExtractionRequest,
    RelationshipExtractionRequest,
    EventCollisionPayload,
)
from worldstate_ai.services.entity_extraction import extract_entities
from worldstate_ai.services.event_extraction import extract_events
from worldstate_ai.services.relationship_extraction import extract_relationships
from worldstate_ai.services.consensus_agent import resolve_event_collision
from worldstate_ai.services.graph_reasoning import generate_cascading_risks
from worldstate_ai.services.gap_enricher import enrich_knowledge_gaps

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
)
logger = logging.getLogger("worldstate_worker")


async def process_document(msg):
    """Callback triggered on document ingestion events."""
    subject = msg.subject
    data = msg.data.decode()

    logger.info(f"Received document ingestion message on subject {subject}")

    try:
        # 1. Parse Go relational Document JSON payload
        doc = json.loads(data)
        doc_id = doc.get("id")
        title = doc.get("title")
        content = doc.get("content")

        if not doc_id or not content:
            logger.error("Invalid document payload received; missing id or content.")
            await msg.ack()
            return

        logger.info(f"Processing Document ID: {doc_id} ('{title[:60]}...')")

        # 2. Extract Events using Gemini AI / fallback
        event_req = EventExtractionRequest(
            document_id=UUID(doc_id),
            title=title or "Untitled",
            content=content,
        )
        logger.info(f"Extracting events for Document: {doc_id}")
        event_res = await extract_events(event_req)

        # Publish extracted events to NATS
        nc = msg._client
        js = nc.jetstream()

        for ext_evt in event_res.events:
            event_payload = {
                "id": None,
                "event_type": ext_evt.event_type,
                "title": ext_evt.title,
                "description": ext_evt.description,
                "severity": ext_evt.severity,
                "confidence": ext_evt.confidence,
                "source_count": 1,
                "status": "detected",
                "category": ext_evt.category,
                "document_ids": [doc_id],
                "entity_ids": [],
                "embedding": ext_evt.embedding,
            }
            evt_json = json.dumps(event_payload).encode()
            await js.publish("worldstate.event.extracted", evt_json)
            logger.info(f"Published extracted event: '{ext_evt.title}'")

        # 3. Extract Entities using Gemini AI / fallback
        entity_req = EntityExtractionRequest(text=content)
        logger.info(f"Extracting entities for Document: {doc_id}")
        entity_res = await extract_entities(entity_req)

        # Publish extracted entities to NATS
        for ext_ent in entity_res.entities:
            entity_payload = {
                "id": None,
                "entity_type": ext_ent.entity_type,
                "name": ext_ent.name,
                "canonical_name": ext_ent.name,
                "aliases": ext_ent.aliases,
                "description": f"Extracted via WorldState AI from Document {doc_id}",
                "importance": ext_ent.importance,
                "active": True,
            }
            ent_json = json.dumps(entity_payload).encode()
            await js.publish("worldstate.entity.extracted", ent_json)
            logger.info(f"Published extracted entity: '{ext_ent.name}'")

        # 4. Extract Relationships using Gemini AI / fallback
        entity_names = [ext_ent.name for ext_ent in entity_res.entities]
        rel_req = RelationshipExtractionRequest(
            document_id=UUID(doc_id),
            title=title or "Untitled",
            content=content,
            entities=entity_names,
        )
        logger.info(f"Extracting relationships for Document: {doc_id}")
        rel_res = await extract_relationships(rel_req)

        # Publish extracted relationships to NATS
        for ext_rel in rel_res.relationships:
            rel_payload = {
                "id": None,
                "source_entity": ext_rel.source_entity,
                "target_entity": ext_rel.target_entity,
                "relationship_type": ext_rel.relationship_type,
                "strength": ext_rel.strength,
                "confidence": ext_rel.confidence,
                "metadata": {
                    "document_id": doc_id,
                }
            }
            rel_json = json.dumps(rel_payload).encode()
            await js.publish("worldstate.relationship.extracted", rel_json)
            logger.info(f"Published extracted relationship: {ext_rel.source_entity} -> {ext_rel.relationship_type} -> {ext_rel.target_entity}")

        # 5. Acknowledge NATS message processing success
        await msg.ack()
        logger.info(f"Successfully processed Document: {doc_id}")

    except Exception as e:
        logger.error(f"Failed to process document message: {e}")
        await msg.nak()


async def process_collision(msg):
    """Callback triggered on event collisions to resolve contradictions via Consensus Agent."""
    data = msg.data.decode()
    logger.info("Received event collision message from Go backend.")

    try:
        payload_dict = json.loads(data)
        payload = EventCollisionPayload(**payload_dict)

        logger.info(f"Resolving collision: Existing ('{payload.existing_title}') vs New ('{payload.new_title}')")
        resolution = await resolve_event_collision(payload)

        # Publish resolution back to Go backend
        js = msg._client.jetstream()
        res_payload = {
            "existing_event_id": str(payload.existing_event_id),
            "resolved_title": resolution.resolved_title,
            "resolved_description": resolution.resolved_description,
            "resolved_severity": resolution.resolved_severity,
            "resolved_confidence": resolution.resolved_confidence,
            "timeline_entry": resolution.timeline_entry,
            "document_ids": payload.document_ids,
        }
        res_json = json.dumps(res_payload).encode()
        await js.publish("worldstate.event.resolved", res_json)
        logger.info(f"Published resolved event consensus for ID: {payload.existing_event_id}")
        await msg.ack()
    except Exception as e:
        logger.error(f"Failed to resolve event collision: {e}")
        await msg.nak()


async def graph_reasoning_loop():
    """Background loop that periodically runs graph walk risk analysis (every 60 seconds)."""
    await asyncio.sleep(15)  # Wait for startup migrations to apply
    while True:
        try:
            logger.info("[graph-reasoner] Starting automated graph walk risk check...")
            results = await generate_cascading_risks()
            if results:
                logger.info(f"[graph-reasoner] Successfully compiled {len(results)} cascading risk scenarios.")
        except Exception as e:
            logger.error(f"[graph-reasoner] Error in graph walk check: {e}")
        await asyncio.sleep(60)


async def gap_enricher_loop():
    """Background loop that periodically runs knowledge gap enrichment crawls (every 120 seconds)."""
    await asyncio.sleep(30)  # Wait for initial data population
    while True:
        try:
            logger.info("[gap-enricher] Starting automated knowledge graph gap scans...")
            enriched = await enrich_knowledge_gaps()
            if enriched:
                logger.info(f"[gap-enricher] Successfully enriched gaps for entities: {enriched}")
        except Exception as e:
            logger.error(f"[gap-enricher] Error in gap scanner: {e}")
        await asyncio.sleep(120)


async def run_worker():
    """Main worker initialization and event loop."""
    logger.info("Initializing WorldState AI Processing Worker...")
    logger.info(f"Connecting to NATS: {settings.nats_url}")

    nc = NATS()
    try:
        await nc.connect(
            servers=[settings.nats_url],
            name="worldstate-ai-worker",
            max_reconnect_attempts=10,
        )
        logger.info("Successfully connected to NATS server.")

        js = nc.jetstream()

        # Wait for NATS streams to exist
        stream_ready = False
        for attempt in range(30):
            try:
                await js.find_stream_name_by_subject("worldstate.document.ingested")
                stream_ready = True
                logger.info("WORLDSTATE stream found.")
                break
            except Exception:
                logger.info(f"Waiting for WORLDSTATE stream (attempt {attempt + 1}/30)...")
                await asyncio.sleep(2)

        if not stream_ready:
            logger.error("WORLDSTATE stream not found after 60s. Is the Go backend running?")
            sys.exit(1)

        # Pull subscription for ingested documents
        sub_doc = await js.pull_subscribe(
            subject="worldstate.document.ingested",
            durable="ws-ai-extraction-worker",
        )
        logger.info("Pull-subscribed to 'worldstate.document.ingested'.")

        # Pull subscription for event collisions
        sub_collision = await js.pull_subscribe(
            subject="worldstate.event.collision",
            durable="ws-ai-collision-resolver",
        )
        logger.info("Pull-subscribed to 'worldstate.event.collision'. Listening for event conflicts...")

        # Start autonomous background reasoning and enrichment agents
        asyncio.create_task(graph_reasoning_loop())
        asyncio.create_task(gap_enricher_loop())

        # Continuously fetch and process messages
        while True:
            try:
                # 1. Process documents
                doc_messages = await sub_doc.fetch(batch=2, timeout=1)
                for msg in doc_messages:
                    await process_document(msg)
                    await asyncio.sleep(4.0)  # Gemini rate limiting buffer
            except asyncio.TimeoutError:
                pass
            
            try:
                # 2. Process collisions
                collision_messages = await sub_collision.fetch(batch=2, timeout=1)
                for msg in collision_messages:
                    await process_collision(msg)
                    await asyncio.sleep(4.0)  # Gemini rate limiting buffer
            except asyncio.TimeoutError:
                pass
                
            await asyncio.sleep(0.5)

    except Exception as e:
        logger.error(f"Worker startup failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    try:
        asyncio.run(run_worker())
    except KeyboardInterrupt:
        logger.info("Worker stopped by user.")
