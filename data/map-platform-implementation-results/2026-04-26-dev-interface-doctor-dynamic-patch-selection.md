# Dev-Interface Doctor: Dynamic Patch Selection

Date: 2026-04-26T14:26:48Z
Agent: Startup Strategy Architect & Lead Engineer (supervised)
Repository: /Users/abhisheksrivastava/intact-mcp-server

## Summary

`doctor_map_platform_dev_interface` now selects the latest matching exported remediation patch under `exports/map-platform/patches/` instead of referencing a hardcoded filename.

## Changes

- Added optional input `patch_hint` (default: `fix-route-load-failed`).
- `dry_run=true` output now includes `remediation_patch` (when present).
- Remediation actions now:
  - include a `git apply --check --reverse ...` command to detect if the patch is already present,
  - apply the dynamically selected patch path (when available).

## Files Changed

- /Users/abhisheksrivastava/intact-mcp-server/src/server.js
- /Users/abhisheksrivastava/intact-mcp-server/docs/tool_reference.md

## Verification

- `cd /Users/abhisheksrivastava/intact-mcp-server && npm test` (PASS)

## Residual Risks / Follow-ups

- None for the MCP tool itself. If the exported patch set changes, `patch_hint` may need to be updated in callers.
