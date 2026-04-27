# Start Map Platform Deep Agent Pack

Status: accepted
Date: 2026-04-25

## Context

The organisation strategy identifies the India-first map/local-discovery product as the recommended first software wedge. The MCP server currently provides strategy documents, planning artifacts, decisions, and checklists.

Agents should not receive production or destructive permissions before specs and guardrails exist.

## Decision

Create a map-platform agent pack before connecting agents to write-capable repository, CI, browser, or deployment tools.

The initial agents are:

- Map Product Strategist
- Geo Data Agent
- Backend API Agent
- Frontend UX Agent
- Accessibility Layer Agent
- Routing and Tiles Agent
- QA and Evaluation Agent
- Platform Infra Agent

## Consequences

The next implementation step is to connect an orchestrator to both `intact-mcp-server` and a safe repository tool for `/Users/abhisheksrivastava/map_platform`.

Write access should remain scoped and human-reviewed until the agents demonstrate reliable planning, implementation, and verification.
