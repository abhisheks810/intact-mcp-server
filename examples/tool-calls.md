# Example Tool Calls

## Search Strategy Docs

```json
{
  "name": "search_strategy_docs",
  "arguments": {
    "query": "MCP",
    "limit": 5
  }
}
```

## Record A Decision

```json
{
  "name": "record_decision",
  "arguments": {
    "title": "Start with strategy operating-memory MCP server",
    "context": "Future product agents need shared planning context before production access.",
    "decision": "Build a local stdio MCP server for strategy docs, briefs, specs, decisions, and checklists.",
    "consequences": "Later servers can depend on documented operating memory and review discipline.",
    "status": "accepted"
  }
}
```

## Inspect Map Platform Files

```json
{
  "name": "list_map_platform_files",
  "arguments": {}
}
```

## Search Map Platform

```json
{
  "name": "search_map_platform",
  "arguments": {
    "query": "geocode",
    "limit": 10
  }
}
```

## Create A Map Platform Agent Task

```json
{
  "name": "create_map_platform_agent_task",
  "arguments": {
    "title": "Define MVP place schema",
    "agent": "geo-data-agent",
    "objective": "Define minimum place fields for India-first local discovery and accessibility metadata.",
    "scope": ["Inspect backend and geocoder code", "Propose a schema and migration path"],
    "files_allowed": ["backend/", "geocoder/", "docs/"],
    "verification": ["Run backend tests when available"],
    "risks": ["Schema changes can break frontend assumptions"]
  }
}
```

## Create A Patch Proposal

```json
{
  "name": "create_map_platform_patch_proposal",
  "arguments": {
    "title": "Add MVP place schema",
    "task_path": "map-platform-tasks/2026-04-25-define-mvp-place-schema.md",
    "agent": "geo-data-agent",
    "summary": "Introduce a stable place schema for local discovery, landmark aliases, provenance, confidence, and accessibility metadata.",
    "target_files": ["backend/main.py", "geocoder/app.py", "frontend/src/App.jsx"],
    "proposed_changes": [
      {
        "file": "backend/main.py",
        "change": "Add typed place response models and return a stable contract.",
        "rationale": "Frontend and geocoder need a shared place contract before feature expansion."
      }
    ],
    "verification": ["Run backend tests", "Run frontend build"],
    "risks": ["Current frontend may rely on existing response shape"]
  }
}
```

## Create A Change Request

```json
{
  "name": "create_map_platform_change_request",
  "arguments": {
    "title": "Implement MVP place contract",
    "proposal_path": "map-platform-patch-proposals/2026-04-25-add-mvp-place-contract.md",
    "agent": "geo-data-agent",
    "objective": "Implement the accepted Place contract while preserving route compatibility.",
    "allowed_files": ["geocoder/app.py", "backend/routers/geocode.py", "frontend/src/components/SearchBar.jsx", "README.md"],
    "verification": ["./scripts/verify.sh"],
    "approval_note": "Approved by project owner for supervised implementation."
  }
}
```

## Record An Agent Run

```json
{
  "name": "record_agent_run",
  "arguments": {
    "agent": "routing-tiles-agent",
    "automation_id": "map-platform-daily-agent-loop",
    "product": "map-platform",
    "summary": "Implemented custom router phase 1.",
    "inputs_read": ["strategy docs", "custom router task", "map_platform route code"],
    "tasks_considered": ["Custom Router Phase 1"],
    "changes_made": ["Added fixture-backed custom_router service"],
    "artifacts_written": ["data/map-platform-implementation-results/2026-04-25-custom-router-phase-1.md"],
    "verification": ["./scripts/verify.sh passed"],
    "deferred": ["OSM PBF parsing"],
    "blockers": [],
    "next_recommended_agent": "routing-tiles-agent",
    "status": "completed"
  }
}
```
