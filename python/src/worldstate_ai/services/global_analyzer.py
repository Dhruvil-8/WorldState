"""WorldState Global Analyzer — Aggregates events and generates global state models & briefings."""

import asyncio
import json
import logging
from datetime import datetime, timezone
from uuid import uuid4
import psycopg
from psycopg.rows import dict_row
import networkx as nx

from worldstate_ai.config import settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
)
logger = logging.getLogger("worldstate_analyzer")


async def analyze_world_state_and_intelligence():
    """Query recent events, analyze global stability/risks with Gemini, and persist to DB."""
    logger.info("Initializing Global Analyzer run...")

    if not settings.gemini_api_key or settings.gemini_api_key == "your_gemini_api_key_here":
        logger.warning("Gemini API key not configured. Skipping Global Analyzer run.")
        return

    try:
        # 1. Fetch active events from PostgreSQL (last 48 hours to have enough context)
        async with await psycopg.AsyncConnection.connect(settings.postgres_dsn) as conn:
            async with conn.cursor(row_factory=dict_row) as cur:
                query = """
                    SELECT id, event_type, title, description, severity, confidence, category, first_seen_at
                    FROM events
                    WHERE first_seen_at > NOW() - INTERVAL '48 hours'
                    ORDER BY severity DESC
                """
                await cur.execute(query)
                events = await cur.fetchall()

                logger.info(f"Retrieved {len(events)} active events from the last 48 hours.")

                # If we have no events yet, fallback to dummy baseline to seed first-boot states
                event_summary = ""
                if len(events) == 0:
                    logger.info("No live events found. Using baseline global context for analysis.")
                    event_summary = "No recent major shocks registered. World state remains at stable baseline."
                else:
                    event_list = []
                    for idx, e in enumerate(events):
                        event_list.append(
                            f"{idx+1}. [{e['category'].upper()} - {e['event_type'].upper()}] "
                            f"{e['title']} (Severity: {e['severity']}/10, Confidence: {e['confidence']})"
                            f"\n   Description: {e['description'] or 'N/A'}"
                        )
                    event_summary = "\n\n".join(event_list)

                # 2. Trigger Gemini Multi-Polar OSINT Analysis
                logger.info("Calling Gemini AI to estimate Global World Model...")
                analysis_result = await _run_gemini_global_analysis(event_summary)

                if not analysis_result:
                    logger.error("Failed to parse Gemini Global Analysis. Aborting insert.")
                    return

                # 3. Compute early warning mathematical indicators (Phase 9)
                event_count = len(events)
                avg_severity = sum(float(e['severity']) for e in events) / event_count if event_count > 0 else 0
                narrative_stress_index = int(min(100, 30 + (event_count * 1.5) + (avg_severity * 4)))

                # 3. Compute early warning mathematical indicators using graph algorithms
                try:
                    _, risk_propagation_index = await calculate_graph_centrality_and_propagation(cur)
                except Exception as g_err:
                    logger.error(f"Failed to calculate graph centrality and propagation risk: {g_err}")
                    risk_propagation_index = 25

                # 4. Persist new Timeseries World State and Executive Briefing Snapshot atomically
                state_id = uuid4()
                snapshot_id = uuid4()
                now = datetime.now(timezone.utc)

                # Insert World State
                insert_state_query = """
                    INSERT INTO world_state (
                        id, global_stability, geopolitical_risk, economic_risk, financial_risk,
                        supply_chain_risk, energy_risk, food_security_risk, cyber_risk,
                        climate_risk, trade_risk, technology_risk, confidence, reasoning,
                        metadata, measured_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """
                await cur.execute(
                    insert_state_query,
                    (
                        state_id,
                        analysis_result["global_stability"],
                        analysis_result["geopolitical_risk"],
                        analysis_result["economic_risk"],
                        analysis_result["financial_risk"],
                        analysis_result["supply_chain_risk"],
                        analysis_result["energy_risk"],
                        analysis_result["food_security_risk"],
                        analysis_result["cyber_risk"],
                        analysis_result["climate_risk"],
                        analysis_result["trade_risk"],
                        analysis_result["technology_risk"],
                        analysis_result["world_state_confidence"],
                        analysis_result["world_state_reasoning"],
                        json.dumps({
                            "events_evaluated": len(events),
                            "risk_propagation_index": risk_propagation_index,
                            "narrative_stress_index": narrative_stress_index
                        }),
                        now
                    )
                )

                # Insert Intelligence Snapshot
                insert_snapshot_query = """
                    INSERT INTO intelligence_snapshots (
                        id, snapshot_type, title, summary, top_risks, top_opportunities,
                        regions_to_watch, critical_events, emerging_signals, second_order_effects,
                        third_order_effects, world_state_id, confidence, metadata, generated_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """
                await cur.execute(
                    insert_snapshot_query,
                    (
                        snapshot_id,
                        "daily",
                        analysis_result["briefing_title"],
                        analysis_result["briefing_summary"],
                        json.dumps(analysis_result.get("top_risks", [])),
                        json.dumps(analysis_result.get("top_opportunities", [])),
                        json.dumps(analysis_result.get("regions_to_watch", [])),
                        json.dumps([]),  # Critical events list
                        json.dumps(analysis_result.get("emerging_signals", [])),
                        json.dumps(analysis_result.get("second_order_effects", [])),
                        json.dumps(analysis_result.get("third_order_effects", [])),
                        state_id,
                        analysis_result["world_state_confidence"],
                        json.dumps({"live_analysis": True}),
                        now
                    )
                )

                await conn.commit()
                logger.info(f"Successfully calculated and persisted WorldState ({state_id}) and Snapshot ({snapshot_id}).")

    except Exception as e:
        logger.error(f"Global Analyzer loop failed: {e}")


from worldstate_ai.services.gemini_client import call_gemini_with_retry

async def _run_gemini_global_analysis(event_summary: str) -> dict | None:
    """Trigger Gemini to analyze the active event aggregates and return a structured JSON model."""
    try:
        prompt = f"""You are a senior global intelligence director. Analyze these raw OSINT (Open Source Intelligence) risk bulletins and compile a timeseries state estimation and an executive daily briefing.

### Multi-Polar Perspective Instructions:
Adopt a strictly neutral, multi-polar world perspective. Do NOT disproportionately focus on the United States or Western Europe. Heavily evaluate risk and stability indexes across rapid-growth global centers, emerging markets, and key trade corridors:
- South Asia / India (critical trade hub, maritime channels)
- Indo-Pacific / East Asia
- The Global South, Africa, and Latin America
- Critical mineral, oil, and shipping chokepoints

### Recent Active OSINT Events:
{event_summary}

### Prompt Instructions:
Calculate:
1. Overall Global Stability (0-100 index). High score = stable/peaceful; Low score = chaotic/volatile.
2. Risk scores (0-100) for all 10 categories: Geopolitical, Economic, Financial, Supply Chain, Energy, Food Security, Cyber, Climate, Trade, Technology.
3. A Daily Briefing title and executive summary (2-3 paragraphs) detailing what changed and why it matters globally.
4. Structured lists of top risks, opportunities, regions to watch, and emerging signals.
5. Extracted chains of second-order and third-order effects:
   - Second-order effects: direct consequences of the primary events (e.g. key trade lane blockade leads to shipping rate spikes).
   - Third-order effects: downstream consequences cascading from second-order events (e.g. shipping rate spikes lead to localized inflation).

Respond with a raw, valid JSON object containing exactly these keys:
- "global_stability": int
- "geopolitical_risk": int
- "economic_risk": int
- "financial_risk": int
- "supply_chain_risk": int
- "energy_risk": int
- "food_security_risk": int
- "cyber_risk": int
- "climate_risk": int
- "trade_risk": int
- "technology_risk": int
- "world_state_confidence": int (0-100)
- "world_state_reasoning": string
- "briefing_title": string
- "briefing_summary": string
- "top_risks": list of objects with keys ["risk" (string), "score" (int), "trend" (string: "rising"/"falling"/"stable")]
- "top_opportunities": list of objects with keys ["opportunity" (string), "score" (int)]
- "regions_to_watch": list of objects with keys ["region" (string), "risk_level" (string: "critical"/"high"/"elevated"/"low")]
- "emerging_signals": list of objects with keys ["signal" (string), "confidence" (float: 0.0-1.0)]
- "second_order_effects": list of objects with keys ["trigger" (string), "effect" (string), "impact_level" (string: "high"/"medium"/"low")]
- "third_order_effects": list of objects with keys ["trigger" (string), "effect" (string), "impact_level" (string: "high"/"medium"/"low")]

Do not include any markdown format or surrounding backticks. Return JSON only."""

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

        return json.loads(text)

    except Exception as e:
        logger.error(f"Gemini global analysis failed: {e}")
        return None



async def calculate_graph_centrality_and_propagation(cur):
    """Calculates PageRank and Betweenness Centrality directly over Apache AGE vertices,
    and runs Personalized PageRank to compute propagated risk down multi-hop actor dependencies.
    Updates the entities table with these new values.
    """
    logger.info("Executing Apache AGE Graph Centrality calculations...")

    # Set search path to include AGE
    await cur.execute("SET search_path = ag_catalog, \"$user\", public;")

    # Fetch all vertices from Apache AGE
    await cur.execute("""
        SELECT * FROM cypher('worldstate', $$
            MATCH (v:Entity)
            RETURN v.id, v.name, v.type
        $$) as (id agtype, name agtype, type agtype);
    """)
    vertices_rows = await cur.fetchall()

    # Helper to clean agtype strings
    def clean_agtype(val) -> str:
        if val is None:
            return ""
        s = str(val)
        if s.startswith('"') and s.endswith('"'):
            return s[1:-1]
        return s

    entities = []
    for row in vertices_rows:
        ent_id = clean_agtype(row["id"])
        ent_name = clean_agtype(row["name"])
        ent_type = clean_agtype(row["type"])
        if ent_id:
            entities.append({"id": ent_id, "name": ent_name, "type": ent_type})

    if not entities:
        logger.info("No vertices found in Apache AGE graph. Skipping centrality calculations.")
        return 0, 25

    # Fetch all edges from Apache AGE
    await cur.execute("""
        SELECT * FROM cypher('worldstate', $$
            MATCH (u:Entity)-[r]->(v:Entity)
            RETURN u.id, v.id, label(r), r.strength
        $$) as (source_id agtype, target_id agtype, label agtype, strength agtype);
    """)
    edges_rows = await cur.fetchall()

    # Construct a directed NetworkX graph
    G = nx.DiGraph()
    for ent in entities:
        G.add_node(ent["id"], name=ent["name"], type=ent["type"])

    for row in edges_rows:
        u = clean_agtype(row["source_id"])
        v = clean_agtype(row["target_id"])
        strength_str = clean_agtype(row["strength"])
        try:
            strength = float(strength_str)
        except ValueError:
            strength = 0.5

        if u and v and G.has_node(u) and G.has_node(v):
            G.add_edge(u, v, weight=strength)

    # 1. PageRank (Centrality / Influence)
    try:
        pageranks = nx.pagerank(G, alpha=0.85, weight="weight")
    except Exception as e:
        logger.warning(f"Failed calculating PageRank: {e}")
        pageranks = {node: 1.0 / len(G) for node in G.nodes}

    # 2. Betweenness Centrality (Chokepoints detection)
    try:
        # Betweenness centrality uses weights as distances, so high weight should mean closer.
        # To make high strength/weight mean stronger connection (and hence lower distance),
        # we can define distance = 1.0 / weight
        for u, v, d in G.edges(data=True):
            d["distance"] = 1.0 / max(0.01, d.get("weight", 0.5))
        betweenness = nx.betweenness_centrality(G, weight="distance", normalized=True)
    except Exception as e:
        logger.warning(f"Failed calculating Betweenness Centrality: {e}")
        betweenness = {node: 0.0 for node in G.nodes}

    # 3. Propagated Risk via Personalized PageRank
    # We find entities involved in recent active events (last 48 hours) and seed their severity as the personalization vector
    propagated_risks = {node: 0.0 for node in G.nodes}

    # Fetch entities linked to recent events and their event severity
    # Reset search path to public to run standard SQL relations query
    await cur.execute("SET search_path = public;")
    await cur.execute("""
        SELECT ee.entity_id, MAX(e.severity) as max_severity
        FROM event_entities ee
        JOIN events e ON ee.event_id = e.id
        WHERE e.first_seen_at > NOW() - INTERVAL '48 hours'
        GROUP BY ee.entity_id
    """)
    event_entities = await cur.fetchall()

    personalization = {}
    total_severity = 0.0
    for row in event_entities:
        ent_id = str(row["entity_id"])
        severity = float(row["max_severity"])
        if G.has_node(ent_id):
            personalization[ent_id] = severity
            total_severity += severity

    # If we have affected entities, run Personalized PageRank
    if personalization and total_severity > 0:
        # Normalize personalization vector
        for k in personalization:
            personalization[k] /= total_severity

        try:
            # Random walk with restart biased towards active event nodes
            # Represents how risk flows downstream
            propagated_risks = nx.pagerank(G, alpha=0.85, personalization=personalization, weight="weight")
        except Exception as e:
            logger.warning(f"Failed calculating Personalized PageRank: {e}")
            propagated_risks = {node: 0.0 for node in G.nodes}

    # 4. Write centrality metrics back to PostgreSQL entities table
    for node in G.nodes:
        pr = pageranks.get(node, 0.0)
        bc = betweenness.get(node, 0.0)
        prisk = propagated_risks.get(node, 0.0)

        update_query = """
            UPDATE entities
            SET pagerank = %s,
                betweenness = %s,
                propagated_risk = %s,
                updated_at = NOW()
            WHERE id = %s
        """
        await cur.execute(update_query, (pr, bc, prisk, node))

    # 5. Compute overall risk propagation index for the world state
    if total_severity > 0:
        # Baseline 25 + sum of propagated risk on non-source nodes scaled up
        non_source_risk = sum(prisk for node, prisk in propagated_risks.items() if node not in personalization)
        risk_propagation_index = int(min(100, 25 + (non_source_risk * 100 * 2.5)))
    else:
        risk_propagation_index = 25

    logger.info(f"Centrality calculations complete. Overall Risk Propagation Index: {risk_propagation_index}")
    return len(entities), risk_propagation_index


async def run_continuous_analysis(interval_seconds: int = 900):
    """Loop forever to calculate timeseries world states periodically."""
    logger.info("Starting continuous Global Analyzer loop...")
    
    # Wait 20 seconds on boot for migrations to finish and live RSS scraper to populate initial documents
    await asyncio.sleep(20)

    while True:
        try:
            await analyze_world_state_and_intelligence()
        except Exception as err:
            logger.error(f"Error in continuous analysis cycle: {err}")
        
        logger.info(f"Sleeping for {interval_seconds} seconds before next Global Analyzer cycle...")
        await asyncio.sleep(interval_seconds)
