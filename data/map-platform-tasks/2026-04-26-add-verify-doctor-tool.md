# Add Verify Doctor Tool

Created: 2026-04-26T13:27:41Z
Agent: Startup Strategy Architect & Lead Engineer (supervised)
Repository: /Users/abhisheksrivastava/intact-mcp-server
Status: implemented
Implementation result: data/map-platform-implementation-results/2026-04-26-verify-doctor-tool.md

## Objective

Unblock daily verification loops by adding an MCP-side diagnostic tool that:

- detects when `./scripts/verify.sh` is likely to fail in sandboxed/readonly environments (Vite `EPERM`), and
- validates whether the exported sandbox-safe verification patch is apply-ready.

## Scope

- Add MCP tool `doctor_map_platform_verify`.
- Document the tool in `docs/tool_reference.md`.
- Add smoke-test coverage (`npm test`).

## Files Allowed

- src/server.js
- docs/tool_reference.md
- test/smoke-test.js

## Verification

- `npm test`

## Risks

- This tool executes `git apply --check` against the configured `MAP_PLATFORM_ROOT`; keep checks fast and read-only.
