# ROADMAP.md

# WorldState Roadmap

## Vision

Build the most capable open-source intelligence platform possible using public information.

The system should continuously answer:

* What changed?
* Why does it matter?
* What risks are increasing?
* What opportunities are emerging?
* What should decision-makers watch next?

The roadmap prioritizes intelligence generation over visualization, prediction, and AI hype.

---

# Development Philosophy

## Build Intelligence First

Not:

Dashboard → UI → Charts

Instead:

Data → Events → World State → Intelligence

---

## Avoid Premature Complexity

Do NOT start with:

* Agents
* Multi-agent systems
* Forecasting
* Prediction markets
* Autonomous actions
* Complex microservices

Start with:

* Reliable ingestion
* Event extraction
* Entity extraction
* Risk scoring
* Intelligence generation

---

# Phase 0

## Foundation

Duration:
1–2 Weeks

Goal:

Create project foundation and standards.

Deliverables:

### Repository Setup

```text
frontend/
backend/
python/
docs/
infrastructure/
```

### Documentation

PROJECT_VISION.md

ARCHITECTURE.md

DATA_MODEL.md

ROADMAP.md

CONTRIBUTING.md

### Infrastructure

Docker

Docker Compose

PostgreSQL

Redis

OpenSearch

NATS

### CI/CD

GitHub Actions

Linting

Testing

Security Scans

---

Success Criteria

Single command startup.

```bash
docker compose up
```

Everything runs locally.

---

# Phase 1

## Data Collection

Duration:
2–4 Weeks

Goal:

Create reliable global information ingestion.

---

### News Sources

Reuters

AP

BBC

Al Jazeera

DW

Reuters RSS

Government RSS

Central Bank Releases

---

### Economic Sources

Interest Rates

Inflation

GDP

PMI

Employment

Trade Data

---

### Commodity Sources

Oil

Natural Gas

Gold

Silver

Copper

Agriculture

---

### Data Model

Store:

Source

Document

No intelligence yet.

---

Success Criteria

10,000+ documents ingested daily.

Near-zero ingestion failures.

---

# Phase 2

## Event Extraction Engine

Duration:
3–5 Weeks

Goal:

Convert documents into events.

---

Input

Document

---

Output

Event

---

Examples

Conflict

Election

Sanction

Trade Restriction

Cyber Attack

Natural Disaster

Policy Change

Interest Rate Change

Commodity Shock

---

Build

Event Classifier

Severity Scorer

Confidence Scorer

Deduplication Engine

---

Success Criteria

90%+ event extraction accuracy.

Duplicate reduction >80%.

---

# Phase 3

## Entity Intelligence Layer

Duration:
3–5 Weeks

Goal:

Build structured world objects.

---

Extract

Countries

Organizations

Companies

People

Industries

Commodities

Currencies

Ports

Infrastructure

---

Build

Entity Resolution

Alias Resolution

Canonical Naming

Importance Scoring

---

Success Criteria

Single canonical entity representation.

Example:

USA

United States

United States of America

becomes one object.

---

# Phase 4

## Relationship Engine

Duration:
4–6 Weeks

Goal:

Build world knowledge graph.

---

Relationship Types

ExportsTo

ImportsFrom

Produces

Consumes

CompetesWith

Supplies

AlliesWith

Sanctions

DependsOn

---

Graph Storage

Neo4j

---

Build

Graph Creation

Graph Updates

Relationship Confidence

Relationship Versioning

---

Success Criteria

Millions of graph relationships supported.

Sub-second graph queries.

---

# Phase 5

## World State Engine

Duration:
4–8 Weeks

Goal:

Create continuously updated world model.

---

Risk Categories

Geopolitical

Economic

Financial

Energy

Supply Chain

Cyber

Climate

Food Security

Technology

---

Build

Risk Scoring

Trend Analysis

State History

Confidence Scoring

---

Output

```json
{
  "global_stability": 74,
  "geopolitical_risk": 68,
  "economic_risk": 57
}
```

---

Success Criteria

World state updates hourly.

Historical trends maintained.

---

# Phase 6

## Intelligence Engine

Duration:
4–8 Weeks

Goal:

Generate intelligence from world state.

---

Daily Output

Top Risks

Top Opportunities

Critical Developments

Regions To Watch

Emerging Signals

---

Reasoning Layers

Direct Effects

Second-order Effects

Third-order Effects

---

Example

Oil Supply Disruption

↓

Oil Prices Rise

↓

Airline Costs Increase

↓

Inflation Pressure

↓

Central Bank Risk

---

Success Criteria

Hourly intelligence briefing.

Daily strategic briefing.

Weekly report.

---

# Phase 7

## Dashboard

Duration:
2–4 Weeks

Goal:

Present intelligence.

---

Homepage

Stability

Risk Matrix

Emerging Signals

Top Risks

Top Opportunities

---

Pages

World State

Events

Entities

Relationships

Reports

Financial Intelligence

---

Do NOT Build

Map

Chatbot

Social Features

---

Success Criteria

Decision-maker can understand the world in under 60 seconds.

---

# Phase 8

## Financial Intelligence

Duration:
4–6 Weeks

Goal:

Connect intelligence to markets.

---

Track

Equities

Commodities

Bonds

Currencies

Crypto

---

Build

Market Impact Engine

Sector Impact Engine

Macro Dashboard

Asset Intelligence

---

Example

Trade Restriction

↓

Supply Chain Stress

↓

Manufacturing Costs

↓

Sector Impact

---

Success Criteria

Every major event includes market implications.

---

# Phase 9

## Strategic Intelligence

Duration:
6–12 Weeks

Goal:

Move beyond event reporting.

---

Build

Escalation Detection

Early Warning System

Strategic Trend Detection

Narrative Analysis

Risk Propagation

---

Questions

What changed?

What matters?

What happens next?

---

Success Criteria

System identifies important developments before they become obvious.

---

# Phase 10

## Intelligence Platform

Duration:
Ongoing

Goal:

Maintain a continuously evolving world model.

---

Advanced Features

Scenario Analysis

Counterfactual Analysis

Causal Inference

Long-term Trend Detection

Supply Chain Intelligence

Strategic Forecasting

---

Future Research

Satellite Data

Shipping Intelligence

Energy Grid Intelligence

Scientific Research Monitoring

Patent Monitoring

Technology Intelligence

---

# Explicit Non-Goals

Until Phase 10

Do Not Build:

AI Agents

Autonomous Agents

Auto-Trading

Prediction Markets

Complex Simulations

Voice Interface

Mobile Apps

Custom LLM Training

---

# North Star Metrics

Data Quality

Event Accuracy

Entity Accuracy

Relationship Accuracy

Risk Score Reliability

Intelligence Quality

User Retention

Decision-Making Utility

---

# Final Objective

A user should be able to open WorldState and understand:

What is happening globally.

Why it matters.

Who is affected.

What risks are increasing.

What opportunities are emerging.

What should be watched next.

In less than 60 seconds.
