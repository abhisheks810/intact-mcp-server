# Improve Dev Interface Route Remediation Heuristics

Created: 2026-04-26T12:48:44Z
Agent: Startup Strategy Architect & Lead Engineer (supervised)
Repository: /Users/abhisheksrivastava/intact-mcp-server
Status: implemented
Implementation result: map-platform-implementation-results/2026-04-26-dev-interface-route-remediation-heuristics.md

## Objective

Improve `doctor_map_platform_dev_interface` so backend `/route` failures produce the correct remediation guidance even when the backend error payload does not explicitly mention the router provider (OSRM vs custom_router).

## Scope

- Recognize OSRM-related backend failures by host/path heuristics, not just literal `"osrm"` strings.
- Correlate `backend_route` failure with `osrm_route` / `custom_router_*` checks to suggest the correct next step.
- Keep the tool output shape stable (no breaking schema changes).

## Files Allowed

- src/server.js
- docs/tool_reference.md (only if output fields change)
- test/smoke-test.js (only if new behavior requires coverage)

## Verification

- `npm test` (smoke test)

## Risks

- Heuristics could suggest the wrong remediation if services are partially up; keep checks conservative and keep manual `curl` actions.
