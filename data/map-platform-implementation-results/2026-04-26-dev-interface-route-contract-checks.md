# Dev-Interface Route Contract Checks

Created: 2026-04-26T08:46:25Z
Repository: /Users/abhisheksrivastava/intact-mcp-server
Result: passed
Change request: direct supervised implementation (MCP server QA tool)

## Outcome

Hardened `doctor_map_platform_dev_interface` so it fails fast when route endpoints return `200 OK` but the response shape is invalid (missing/invalid `geometry` or OSRM `routes[]`). The tool now emits `contract_error` in `checks[]` and includes a manual `curl` action when the backend route check fails.

## Changed Files

- src/server.js
- docs/tool_reference.md

## Commands Run

- npm test

## Notes

This is an MCP-side QA improvement only; it does not modify `/Users/abhisheksrivastava/map_platform`.
