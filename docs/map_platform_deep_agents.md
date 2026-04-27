# Map Platform Deep Agents

## Purpose

These agents exist to improve and maintain `/Users/abhisheksrivastava/map_platform` while keeping the organisation strategy in scope.

The map platform should be treated as the first consumer wedge for the larger organisation:

- India-first local discovery;
- landmark-aware search;
- accessibility metadata;
- future sign-language service integration;
- shared identity, consent, observability, and agent workflows.

## Repository Assumption

Canonical local repo:

```text
/Users/abhisheksrivastava/map_platform
```

Observed components:

```text
backend/
frontend/
geocoder/
router/
tileserver/
docker-compose.yml
```

## Agent Set

| Agent | Primary Responsibility | Write Scope |
| --- | --- | --- |
| Map Product Strategist | Translate organisation strategy into map-platform roadmap and feature briefs | Docs, product briefs, decision proposals |
| Geo Data Agent | Improve places, geocoding, local-language, and landmark data workflows | Data schemas, ingestion docs, geocoder tests |
| Backend API Agent | Maintain backend contracts, API correctness, validation, and observability | `backend/`, API docs, tests |
| Frontend UX Agent | Improve map UI, search UX, accessibility UI, responsive behavior | `frontend/`, UI tests |
| Accessibility Layer Agent | Design and maintain accessibility metadata and sign-language integration points | Shared schemas, frontend/backend accessibility paths |
| Routing and Tiles Agent | Maintain routing/tileserver integration and operational correctness | `router/`, `tileserver/`, compose docs |
| QA and Evaluation Agent | Run tests, create regression checks, verify strategy alignment | Test files, QA reports |
| Platform Infra Agent | Maintain local/dev infra, Docker Compose, environment docs, CI plans | `docker-compose.yml`, Dockerfiles, infra docs |

## Initial Agent Responsibilities

### Map Product Strategist

Inputs:

- strategy docs from `STRATEGY_ROOT`;
- current `map_platform` README;
- open decisions and product briefs.

Outputs:

- roadmap proposals;
- feature opportunity briefs;
- decision records;
- prioritization notes.

Must not:

- edit runtime code;
- create implementation without a scoped brief.

### Geo Data Agent

Focus areas:

- POI schema;
- address normalization;
- landmark-first search;
- OSM/open-data source evaluation;
- provenance and confidence scoring;
- community correction workflow.

Must require review for:

- canonical data model changes;
- data-source licensing decisions;
- mass data mutation.

### Backend API Agent

Focus areas:

- API schema;
- input validation;
- error handling;
- observability;
- auth/consent integration readiness;
- search/geocoder/router integration boundaries.

Must verify:

- backend tests;
- API compatibility;
- Docker/local run path.

### Frontend UX Agent

Focus areas:

- search workflow;
- place detail pages;
- accessibility metadata display;
- mobile usability;
- low-bandwidth behavior;
- visual regression checks.

Must verify:

- build;
- responsive layout;
- core search/place-detail flows.

### Accessibility Layer Agent

Focus areas:

- accessible place metadata;
- sign-language content hooks;
- captions/text/audio alternatives;
- review workflow for generated accessibility content;
- low-literacy and multilingual UX implications.

Must require review for:

- generated sign-language content;
- health or public-service instructions;
- accessibility claims.

### Routing and Tiles Agent

Focus areas:

- router service integration;
- tileserver service integration;
- local map rendering path;
- service health checks;
- fallback behavior.

Must verify:

- docker compose startup path;
- service dependency assumptions.

### QA and Evaluation Agent

Focus areas:

- regression tests;
- smoke tests;
- API contract tests;
- browser checks;
- strategy-alignment checklist.

Must report:

- exact commands run;
- failures and residual risks;
- unverified areas.

### Platform Infra Agent

Focus areas:

- Dockerfiles;
- compose orchestration;
- environment variable docs;
- local development setup;
- CI plan;
- observability plan.

Must require review for:

- production deployment changes;
- secrets handling;
- destructive migration steps.

## Standard Agent Workflow

1. Read strategy docs through `intact-mcp-server`.
2. Search for relevant constraints.
3. Inspect `map_platform` code.
4. Create or update an agent task note.
5. Propose implementation scope.
6. Apply changes only inside allowed write scope.
7. Run tests/builds.
8. Record any architectural decision.
9. Produce a review packet.

## First Practical Feature Tracks

### Track 1: Strategy-Aligned Baseline

Goal:

- make `map_platform` explicit about its role as the first India-first map wedge.

Work:

- update project docs;
- define MVP workflows;
- define service boundaries;
- add missing run/test documentation.

### Track 2: Place Search and POI Model

Goal:

- define the minimum usable place model for local discovery.

Work:

- place schema;
- search endpoint contract;
- landmark aliases;
- provenance fields;
- accessibility fields.

### Track 3: Accessibility Metadata Layer

Goal:

- make accessibility a first-class place detail concept.

Work:

- backend data fields;
- frontend display;
- review-state model;
- sign-language media hook.

### Track 4: Local Dev and QA Reliability

Goal:

- make the repo consistently runnable and testable.

Work:

- compose validation;
- backend smoke tests;
- frontend build checks;
- service health checks.

## Do Not Automate Yet

Do not give agents these capabilities initially:

- production deployment;
- cloud account writes;
- secrets access;
- mass data deletion;
- health-data access;
- unreviewed generated sign-language content publication.
