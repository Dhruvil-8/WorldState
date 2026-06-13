# ARCHITECTURE.md

# WorldState Architecture

## Mission

WorldState is a World-scale open-source intelligence platform.

The objective is not to collect news.

The objective is not to answer user questions.

The objective is to continuously estimate the current state of the world using publicly available information and generate intelligence snapshots describing:

* What changed
* Why it matters
* Who is affected
* What risks are increasing
* What opportunities are emerging
* What should be monitored next

Financial intelligence is a downstream consumer of global intelligence.

Global intelligence is the primary domain.

---

# Design Principles

## Event-Centric Architecture

Most systems are document-centric.

WorldState is event-centric.

Example:

Bad:

Article → Search

Good:

Article → Event → Intelligence

---

## State-Based Architecture

Most systems answer questions.

WorldState maintains a continuously updated world model.

Every event modifies the world state.

Example:

Sanctions increase:

* Trade tension
* Supply chain risk
* Inflation pressure

The platform stores these state transitions.

---

## Intelligence First

Visualization is secondary.

The intelligence engine is the product.

Everything else supports intelligence generation.

---

# High Level Architecture

```text
                DATA SOURCES
                       │
                       ▼
              INGESTION LAYER
                       │
                       ▼
           NORMALIZATION LAYER
                       │
                       ▼
            EXTRACTION LAYER
                       │
          ┌────────────┴────────────┐
          ▼                         ▼
      EVENT STORE            ENTITY STORE
          │                         │
          └────────────┬────────────┘
                       ▼
                KNOWLEDGE GRAPH
                       │
                       ▼
                WORLD MODEL
                       │
                       ▼
                 RISK ENGINE
                       │
                       ▼
             INTELLIGENCE ENGINE
                       │
                       ▼
                   API LAYER
                       │
                       ▼
                   FRONTEND
```

---

# Technology Stack

## Frontend

Framework:
Next.js

Language:
TypeScript

UI:
Tailwind

Data Fetching:
TanStack Query

State:
Zustand

Charts:
ECharts

Reason:

Fast development.

Large ecosystem.

Excellent visualization support.

---

## Backend

Language:
Go

Reason:

Concurrency

Performance

Simple deployment

Low memory usage

Scalable microservices

---

## AI Layer

Language:
Python

Responsibilities:

Event extraction

Entity extraction

Classification

Reasoning

Forecasting

Report generation

LLM orchestration

Reason:

Best ecosystem.

---

# Databases

## PostgreSQL

Primary source of truth.

Stores:

Events

Entities

Metrics

Snapshots

Reports

Users

Configurations

---

## Neo4j

Stores:

Relationships

Dependencies

Supply chains

Geopolitical links

Economic connections

Event chains

Reason:

WorldState is fundamentally a graph problem.

---

## OpenSearch

Stores:

Documents

Articles

Reports

Embeddings

Search indexes

Reason:

Fast search and retrieval.

---

## Redis

Stores:

Caches

Rate limits

Session state

Hot intelligence data

---

# Service Architecture

## Ingestion Service

Language:
Go

Responsibilities:

Collect raw data.

Sources:

News

RSS

Government websites

Central banks

Economic calendars

Commodity feeds

Weather feeds

Disaster feeds

Output:

Raw documents

---

## Normalization Service

Language:
Go

Responsibilities:

Convert all sources into a common schema.

Output:

NormalizedDocument

---

## Event Extraction Service

Language:
Python

Responsibilities:

Identify events.

Examples:

Sanction

Election

Conflict

Trade restriction

Natural disaster

Policy change

Cyber incident

Output:

Event

---

## Entity Extraction Service

Language:
Python

Responsibilities:

Extract:

Countries

Organizations

People

Companies

Commodities

Industries

Infrastructure

Output:

Entity

---

## Entity Resolution Service

Language:
Python

Responsibilities:

Merge duplicates.

Example:

USA

United States

United States of America

becomes one entity.

---

## Graph Service

Language:
Go

Responsibilities:

Create relationships.

Examples:

Supplies

Imports

Exports

Competes

Allies

Sanctions

Produces

Consumes

---

## World Model Service

Language:
Go

Responsibilities:

Maintain world state.

Example:

{
"geopolitical_risk": 68,
"economic_risk": 55,
"energy_risk": 47
}

This is the heart of the system.

---

## Risk Engine

Language:
Go

Responsibilities:

Calculate:

Geopolitical risk

Economic risk

Supply chain risk

Energy risk

Climate risk

Financial risk

Food security risk

Cyber risk

---

## Intelligence Engine

Language:
Python

Responsibilities:

Generate:

Daily briefing

Hourly briefing

Weekly report

Emerging signals

Opportunities

Escalation alerts

Second-order effects

Third-order effects

This is the user-facing intelligence layer.

---

# Frontend Architecture

## Dashboard

Displays:

World State

Top Risks

Top Opportunities

Emerging Signals

Confidence Scores

---

## Intelligence Feed

Displays:

Generated intelligence.

Not raw news.

---

## Risk Matrix

Displays:

Risk category

Score

Trend

Confidence

---

## Event Explorer

Displays:

Structured events

Not articles

---

## Entity Explorer

Displays:

Countries

Companies

Organizations

Industries

Relationships

---

## Financial Intelligence

Displays:

Macro indicators

Asset impact

Market intelligence

Derived from global intelligence

---

# Scalability

All services communicate through NATS.

Benefits:

Loose coupling

Horizontal scaling

Event-driven architecture

Low operational complexity

---

# Non-Goals

WorldState is NOT:

A news aggregator

A chatbot

A social platform

A trading platform

A market screener

A prediction market

The purpose is intelligence generation.

Everything else is secondary.

---

# Success Definition

The system succeeds when it can reliably answer:

What changed?

Why does it matter?

Who is affected?

What risks are increasing?

What opportunities are emerging?

What should be watched next?

What is the current state of the world?
