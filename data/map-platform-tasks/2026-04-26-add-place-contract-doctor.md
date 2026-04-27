# Add Place Contract Doctor Tool

Created: 2026-04-26T08:27:55Z
Agent: qa-evaluation-agent (supervised)
Repository: /Users/abhisheksrivastava/intact-mcp-server
Status: implemented
Implementation result: data/map-platform-implementation-results/2026-04-26-place-contract-doctor-tool.md

## Objective

Add a small MCP QA tool that validates the map-platform backend `/geocode` response matches the MVP `Place` contract (including accessibility metadata defaults), so local-discovery work (place detail panel, accessibility review UI) has a reliable diagnostic surface.

## Context

`map_platform` is moving from directions-only toward local discovery. The `/geocode` contract is the first shared surface between backend/geocoder and frontend. When the contract drifts, the UI fails in subtle ways (missing labels, missing accessibility review state, etc.).

## Scope

- Add a new MCP tool `doctor_map_platform_place_contract` to:
  - call `GET {backend_url}/geocode?address=...&limit=...`;
  - treat `{ "error": ... }` / `{ "detail": ... }` JSON as failures;
  - validate `Place[]` is non-empty and that `Place[0]` includes the documented keys/types from `map_platform/docs/place_contract.md`;
  - return actionable `actions[]` for manual repro (curl) and typical remediation.

## Files Allowed

- src/server.js
- docs/tool_reference.md
- README.md
- test/smoke-test.js

## Verification

- `npm test` in `/Users/abhisheksrivastava/intact-mcp-server`
- Smoke test asserts the tool appears in `tools/list` and supports `dry_run`.

## Risks

- False negatives if `/geocode` returns an empty array for the default address; keep the address configurable.
- Contract validation must not become overly strict; prefer “type + presence” checks over enforcing exact enum values.
