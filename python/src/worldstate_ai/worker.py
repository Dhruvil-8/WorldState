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
)
from worldstate_ai.services.entity_extraction import extract_entities
from worldstate_ai.services.event_extraction import extract_events
from worldstate_ai.services.relationship_extraction import extract_relationships

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
                "id": None,  # Let Go backend assign UUID or keep it null
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
        # Reject message so it can be retried durably
        await msg.nak()


async def run_worker():
    """Main worker initialization and event loop.

    Uses pull_subscribe to avoid deliver_group conflicts with the Go backend's
    push consumers.  The WORLDSTATE stream is created by the Go backend
    (with FileStorage + 7-day MaxAge), so we only wait for it here instead
    of trying to add_stream with a different config.
    """
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

        # Wait for the Go backend to create the WORLDSTATE stream.
        # Retry a few times in case the backend hasn't started yet.
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

        # Use pull_subscribe — avoids deliver_group / queue-subscription conflicts.
        sub = await js.pull_subscribe(
            subject="worldstate.document.ingested",
            durable="ws-ai-extraction-worker",
        )
        logger.info("Pull-subscribed to 'worldstate.document.ingested'. Listening for events...")

        # Continuously fetch and process messages
        while True:
            try:
                messages = await sub.fetch(batch=5, timeout=5)
                for msg in messages:
                    await process_document(msg)
                    await asyncio.sleep(4.0)  # Gemini Free Tier (15 RPM) rate-limiting safeguard
            except asyncio.TimeoutError:
                pass  # No messages available, loop again
            except Exception as e:
                if "timeout" in str(e).lower() or "fetch" in str(e).lower():
                    pass  # nats.py may raise its own timeout variant
                else:
                    logger.error(f"Error fetching messages: {e}")
                    await asyncio.sleep(1)

    except Exception as e:
        logger.error(f"Worker startup failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    try:
        asyncio.run(run_worker())
    except KeyboardInterrupt:
        logger.info("Worker stopped by user.")
