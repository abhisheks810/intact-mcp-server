# Dev Interface Route Remediation Heuristics

Created: 2026-04-26T12:48:44Z
Repository: /Users/abhisheksrivastava/intact-mcp-server
Result: passed
Task: map-platform-tasks/2026-04-26-improve-dev-interface-route-remediation.md

## Outcome

`doctor_map_platform_dev_interface` now suggests the right remediation for backend `/route` failures more reliably:

- Detects OSRM-related failures by matching OSRM host/path patterns (not only the literal string `"osrm"`).
- Suggests applying the exported “default to custom router in non-Docker local dev” patch when:
  - `backend_route` is failing, and
  - OSRM checks are failing, and
  - custom_router checks indicate the custom router is up.
- Suggests forcing OSRM routing when the custom router appears down but OSRM is reachable.

## Changed Files

- /Users/abhisheksrivastava/intact-mcp-server/src/server.js

## Verification

- `npm test` in `/Users/abhisheksrivastava/intact-mcp-server`

## Notes

This keeps the MCP-side QA loop actionable even when backend error strings are generic, reducing time-to-fix for the “Get Route → load failed” feedback class.
