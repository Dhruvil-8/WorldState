"""Graph Reasoning Service — Performs graph walks on entity relationships to discover cascading systemic risks."""

import json
import logging
import psycopg
from worldstate_ai.config import settings
from worldstate_ai.models import CascadingRiskForecast
from worldstate_ai.services.gemini_client import call_gemini_with_retry

logger = logging.getLogger(__name__)

async def generate_cascading_risks() -> list[dict]:
    """Scans the database for active events, walks the entity relationship graph downstream,

    and uses Gemini to forecast cascading risks.
    """
    logger.info("Starting graph reasoning and vulnerability analysis cycle...")

    try:
        async with await psycopg.AsyncConnection.connect(settings.postgres_dsn) as conn:
            async with conn.cursor() as cur:
                # 1. Fetch top active events (last 7 days, severity >= 5.0)
                await cur.execute("""
                    SELECT e.id, e.title, e.description, e.severity, e.category, e.event_type
                    FROM events e
                    WHERE e.status IN ('detected', 'verified', 'active', 'monitoring')
                      AND e.severity >= 5.0
                      AND e.first_seen_at >= NOW() - INTERVAL '7 days'
                    ORDER BY e.severity DESC
                    LIMIT 10
                """)
                events = await cur.fetchall()
                if not events:
                    logger.info("No high-severity active events found for graph reasoning.")
                    return []

                logger.info(f"Analyzing dependency paths for {len(events)} active events.")

                scenarios_created = []

                for event_id, event_title, event_desc, event_sev, event_cat, event_type in events:
                    # 2. Find entities directly involved in this event
                    await cur.execute("""
                        SELECT entity_id, role 
                        FROM event_entities 
                        WHERE event_id = %s
                    """, (event_id,))
                    involved_entities = await cur.fetchall()
                    if not involved_entities:
                        continue

                    for entity_id, role in involved_entities:
                        # 3. Perform a 2-hop downstream relationship walk from the involved entity
                        # e.g., (Event Entity) -[r1]-> (Intermediate Entity) -[r2]-> (Target Entity)
                        await cur.execute("""
                            SELECT 
                                e1.id as e1_id, e1.name as e1_name, e1.importance as e1_imp,
                                r1.relationship_type as r1_type, r1.strength as r1_str,
                                e2.id as e2_id, e2.name as e2_name, e2.importance as e2_imp,
                                r2.relationship_type as r2_type, r2.strength as r2_str,
                                e3.id as e3_id, e3.name as e3_name, e3.importance as e3_imp
                            FROM entities e1
                            JOIN relationships r1 ON r1.source_entity_id = e1.id
                            JOIN entities e2 ON r1.target_entity_id = e2.id
                            JOIN relationships r2 ON r2.source_entity_id = e2.id
                            JOIN entities e3 ON r2.target_entity_id = e3.id
                            WHERE e1.id = %s
                              AND e3.importance >= 60
                              AND e1.id != e3.id
                            LIMIT 3
                        """, (entity_id,))
                        paths = await cur.fetchall()
                        
                        for path in paths:
                            e1_id, e1_name, e1_imp, r1_type, r1_str, e2_id, e2_name, e2_imp, r2_type, r2_str, e3_id, e3_name, e3_imp = path
                            
                            # Check if we have already generated a risk scenario for this specific trigger event and final target
                            await cur.execute("""
                                SELECT id FROM cascading_risks 
                                WHERE %s = ANY(trigger_event_ids)
                                  AND %s = ANY(impacted_entity_ids)
                            """, (event_id, e3_id))
                            exists = await cur.fetchone()
                            if exists:
                                continue

                            # 4. Invoke LLM to generate the scenario
                            logger.info(f"Generating cascading risk for path: {e1_name} -> {e2_name} -> {e3_name} triggered by event '{event_title}'")
                            
                            scenario = await _analyze_path_risk(
                                event_title, event_desc, float(event_sev),
                                e1_name, r1_type, float(r1_str),
                                e2_name, r2_type, float(r2_str),
                                e3_name, float(e3_imp)
                            )
                            
                            if not scenario:
                                continue

                            # 5. Insert scenario into database
                            await cur.execute("""
                                INSERT INTO cascading_risks (title, scenario, severity, confidence, impacted_entity_ids, trigger_event_ids)
                                VALUES (%s, %s, %s, %s, %s, %s)
                                RETURNING id
                            """, (
                                scenario.title,
                                scenario.scenario,
                                scenario.severity,
                                scenario.confidence,
                                [e1_id, e2_id, e3_id],
                                [event_id]
                            ))
                            new_id = await cur.fetchone()
                            await conn.commit()

                            scenarios_created.append({
                                "id": str(new_id[0]),
                                "title": scenario.title,
                                "severity": scenario.severity,
                            })
                            
                return scenarios_created
    except Exception as e:
        logger.error(f"Error during graph reasoning cycle: {e}")
        return []

async def _analyze_path_risk(
    event_title: str, event_desc: str, event_severity: float,
    e1_name: str, r1_type: str, r1_str: float,
    e2_name: str, r2_type: str, r2_str: float,
    e3_name: str, e3_imp: float
) -> CascadingRiskForecast | None:
    """Invokes Gemini to analyze a path of dependencies and generate a risk forecast."""
    if not settings.gemini_api_key or settings.gemini_api_key == "your_gemini_api_key_here":
        return None

    prompt = f"""You are a senior geopolitical risk and intelligence strategist.
Analyze the following multi-hop dependency path and the triggering event, and draft a professional, deep intelligence report describing how this event could propagate and trigger cascading impacts downstream.

[Trigger Event]
Title: {event_title}
Severity: {event_severity}/10
Description: {event_desc}

[Dependency Path]
1. The event directly affects the entity: "{e1_name}".
2. "{e1_name}" {r1_type} "{e2_name}" (Link Strength: {r1_str}/1.0).
3. "{e2_name}" {r2_type} "{e3_name}" (Link Strength: {r2_str}/1.0).
Note: "{e3_name}" is a critical system entity with an importance score of {e3_imp}/100.

Draft a detailed cascading risk scenario.
Include:
- Title: A professional intelligence headline (e.g. "Export Restriction on X threatens Downstream Aerospace Operations").
- Scenario Narrative: 2-3 paragraphs in markdown format. Explain the direct impact, the propagation mechanism (how it spreads from {e1_name} through {e2_name} to {e3_name}), and the final strategic implications for "{e3_name}". Avoid generic summaries; write a realistic, sophisticated intelligence report.
- Cascading Severity: 0-10 scale rating the cumulative risk/severity at the final node.
- Confidence: 0-1 scale.

Return the result as a valid JSON object ONLY. No markdown formatting.
JSON format must contain EXACTLY the following keys:
- "title" (string)
- "scenario" (string)
- "severity" (float)
- "confidence" (float)
"""
    try:
        response_text = await call_gemini_with_retry(prompt)
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
        return CascadingRiskForecast(
            title=data.get("title", f"Cascading Risk: {e3_name}"),
            scenario=data.get("scenario", "Path dependency alert."),
            severity=float(data.get("severity", event_severity)),
            confidence=float(data.get("confidence", 0.7))
        )
    except Exception as e:
        logger.error(f"Error calling Gemini for path risk analysis: {e}. Raw response: {response_text if 'response_text' in locals() else 'None'}")
        return None
