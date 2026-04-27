# Place Contract Doctor Tool

Created: 2026-04-26T08:27:55Z
Repository: /Users/abhisheksrivastava/intact-mcp-server
Result: passed
Change request: direct supervised implementation (MCP server QA tool)

## Outcome

Added `doctor_map_platform_place_contract` to the MCP tool surface to validate that the local backend `/geocode` endpoint returns a non-empty `Place[]` matching `map_platform/docs/place_contract.md`, including accessibility metadata defaults.

## Changed Files

- src/server.js
- docs/tool_reference.md
- README.md
- test/smoke-test.js

## Commands Run

- npm test

## Notes

This tool complements `doctor_map_platform_dev_interface` by focusing on the local-discovery contract surface (Place schema) rather than routing and service health.
