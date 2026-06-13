# DATA_MODEL.md

# WorldState Data Model

## Philosophy

The world is represented through four primary concepts:

1. Events
2. Entities
3. Relationships
4. World State

Everything in the system must ultimately map to one of these concepts.

Articles, reports, tweets, government releases and market data are only sources.

They are not first-class objects.

---

# Core Object Hierarchy

```text
Source
   ↓
Document
   ↓
Event
   ↓
Entity
   ↓
Relationship
   ↓
World State
   ↓
Intelligence
```

---

# 1. Source

Represents where information originates.

Examples:

Reuters

Government Website

Central Bank

Research Institute

RSS Feed

Economic Calendar

Commodity Feed

---

## Source Schema

```json
{
  "id": "src_123",
  "name": "Reuters",
  "type": "news",
  "trust_score": 0.92,
  "country": "Global",
  "active": true
}
```

---

# 2. Document

Raw information.

Documents are immutable.

Documents are never edited.

---

## Document Schema

```json
{
  "id": "doc_123",
  "source_id": "src_123",
  "title": "...",
  "content": "...",
  "published_at": "...",
  "language": "en",
  "url": "...",
  "hash": "...",
  "ingested_at": "..."
}
```

---

# 3. Event

The most important object.

Everything meaningful becomes an event.

Events are the foundation of intelligence.

---

## Event Categories

### Geopolitical

Conflict

Military Action

Election

Sanction

Diplomatic Action

Border Dispute

Government Change

---

### Economic

Interest Rate Change

Inflation Release

GDP Release

PMI Release

Employment Data

Debt Event

---

### Trade

Tariff

Export Restriction

Import Restriction

Trade Agreement

---

### Supply Chain

Factory Shutdown

Port Congestion

Logistics Disruption

---

### Commodity

Oil Shock

Gas Shock

Food Shock

Metal Shock

---

### Environment

Earthquake

Flood

Wildfire

Drought

Storm

---

### Cyber

Cyber Attack

Data Breach

Infrastructure Attack

---

## Event Schema

```json
{
  "id": "evt_123",

  "event_type": "sanction",

  "title": "New sanctions announced",

  "description": "...",

  "timestamp": "...",

  "severity": 8.2,

  "confidence": 0.88,

  "source_count": 12,

  "status": "active",

  "country_ids": [
    "country_us",
    "country_cn"
  ],

  "entity_ids": [
    "entity_1",
    "entity_2"
  ]
}
```

---

# Event Severity

Scale:

```text
0-2   Low
3-4   Moderate
5-6   Significant
7-8   High
9-10  Critical
```

---

# Event Lifecycle

```text
Detected
↓
Verified
↓
Active
↓
Monitoring
↓
Resolved
↓
Archived
```

---

# 4. Entity

Represents any meaningful object in the world.

---

## Entity Types

Country

Region

City

Organization

Company

Industry

Commodity

Currency

Person

Military Unit

Infrastructure

Technology

Financial Asset

Policy

Treaty

Port

Shipping Route

Energy Asset

---

## Entity Schema

```json
{
  "id": "entity_123",

  "type": "country",

  "name": "China",

  "aliases": [
    "PRC",
    "People's Republic of China"
  ],

  "description": "...",

  "active": true
}
```

---

# Entity Importance

Stores long-term importance.

Scale:

```text
0-100
```

Examples:

United States = 100

China = 100

Taiwan = 92

TSMC = 91

OPEC = 88

Rare Earths = 85

---

# 5. Relationship

Relationships create intelligence.

Without relationships there is no world model.

---

## Relationship Types

### Economic

ImportsFrom

ExportsTo

Produces

Consumes

InvestsIn

Owns

CompetesWith

---

### Political

AlliesWith

Opposes

Sanctions

Recognizes

Supports

---

### Supply Chain

Supplies

DependsOn

Manufactures

ShipsThrough

Stores

Processes

---

### Financial

CorrelatesWith

Impacts

Benefits

Harms

---

## Relationship Schema

```json
{
  "id": "rel_123",

  "source_entity": "entity_a",

  "target_entity": "entity_b",

  "relationship_type": "Supplies",

  "strength": 0.84,

  "confidence": 0.91,

  "created_at": "...",

  "updated_at": "..."
}
```

---

# 6. Event Impact

Events modify entities.

---

## Event Impact Schema

```json
{
  "id": "impact_123",

  "event_id": "evt_123",

  "entity_id": "entity_123",

  "impact_type": "negative",

  "impact_score": -0.67,

  "confidence": 0.88
}
```

---

# 7. Risk Model

WorldState measures risk.

Risk categories are first-class objects.

---

## Risk Categories

Geopolitical

Economic

Financial

Energy

Supply Chain

Climate

Cyber

Food Security

Trade

Technology

---

## Risk Score Schema

```json
{
  "risk_type": "geopolitical",

  "score": 72,

  "trend": "rising",

  "confidence": 84,

  "updated_at": "..."
}
```

---

# 8. World State

The heart of the system.

Represents the current estimated state of the world.

Generated continuously.

---

## World State Schema

```json
{
  "timestamp": "...",

  "global_stability": 74,

  "geopolitical_risk": 68,

  "economic_risk": 57,

  "financial_risk": 48,

  "supply_chain_risk": 63,

  "energy_risk": 52,

  "food_security_risk": 41,

  "cyber_risk": 45,

  "confidence": 86
}
```

---

# 9. Intelligence Snapshot

Generated output.

This is what users consume.

---

## Snapshot Schema

```json
{
  "timestamp": "...",

  "top_risks": [],

  "top_opportunities": [],

  "regions_to_watch": [],

  "critical_events": [],

  "emerging_signals": [],

  "confidence": 84
}
```

---

# 10. Time Series Model

Every score is historical.

Nothing is overwritten.

Everything is versioned.

---

## Example

```text
Day 1

Geopolitical Risk
62

Day 2

Geopolitical Risk
65

Day 3

Geopolitical Risk
69
```

This allows trend detection.

---

# Intelligence Rule

The system must never reason directly from documents.

The intelligence pipeline must always be:

```text
Document
↓
Event
↓
Entity
↓
Relationship
↓
Risk
↓
World State
↓
Intelligence
```

This rule is mandatory.

Any feature that bypasses this pipeline weakens the integrity of the world model.

---

# Success Definition

WorldState succeeds when it can represent:

Events

Entities

Relationships

Risk

World State

using a consistent schema that remains stable as the system scales from thousands to millions of events.
