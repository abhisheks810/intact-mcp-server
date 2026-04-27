# Verify Script Doctor Tool

Created: 2026-04-26T13:27:41Z
Repository: /Users/abhisheksrivastava/intact-mcp-server
Result: passed
Task: map-platform-tasks/2026-04-26-add-verify-doctor-tool.md

## Outcome

Added MCP tool `doctor_map_platform_verify` to help diagnose the current verification blocker:

- Reports whether `map_platform/scripts/verify.sh` supports `SKIP_FRONTEND_BUILD=1`.
- Checks whether `map_platform/frontend/` is writable and whether `frontend/node_modules` is present.
- Locates the latest exported patch under `exports/map-platform/patches/` (by `patch_hint`) and validates:
  - `git apply --check` (patch applies cleanly), and
  - `git apply --check --reverse` (patch already applied).
- Emits actionable commands to apply the patch (in a writable environment) and re-run verification.

## Changed Files

- /Users/abhisheksrivastava/intact-mcp-server/src/server.js
- /Users/abhisheksrivastava/intact-mcp-server/docs/tool_reference.md
- /Users/abhisheksrivastava/intact-mcp-server/test/smoke-test.js

## Verification

- `npm test` in `/Users/abhisheksrivastava/intact-mcp-server`

## Notes

This tool does not modify `map_platform`; it is designed to keep the daily agent loop unblocked even when the repo is outside the sandbox write scope.
