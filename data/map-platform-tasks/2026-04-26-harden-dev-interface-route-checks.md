# Harden Dev-Interface Route Checks

Created: 2026-04-26T08:46:25Z
Agent: Startup Strategy Architect & Lead Engineer (supervised)
Repository: /Users/abhisheksrivastava/intact-mcp-server
Status: implemented
Implementation result: data/map-platform-implementation-results/2026-04-26-dev-interface-route-contract-checks.md

## Objective

Ensure the MCP QA tool `doctor_map_platform_dev_interface` treats **route responses** as failures when they are HTTP-successful but missing the expected route shape (especially `geometry`), so the “Get Route → load failed” class of issues is easier to diagnose.

## Context

Map-platform local-dev failures often present as a UI “load failed” while the backend still returns `200 OK` with JSON payloads that contain an error (`{ "error": ... }` / `{ "detail": ... }`) or are missing critical route fields. The MCP-side “doctor” tool should catch these cases without requiring the user to manually inspect logs.

## Scope

- Update `doctor_map_platform_dev_interface` to:
  - validate `backend_route` and `custom_router_route` responses include `geometry: [[lon,lat], ...]`;
  - validate `osrm_route` responses include `routes[]` (basic sanity);
  - surface `contract_error` for shape failures; and
  - include an explicit manual `curl` action for the backend route endpoint when it fails.

## Files Allowed

- src/server.js
- docs/tool_reference.md
- test/smoke-test.js (only if needed)

## Verification

- npm test

## Risks

- The checks could be too strict for future route providers; keep validation limited to “presence + basic type” (not exact schemas).
