# Make Dev-Interface Doctor Use Latest Route Patch

Created: 2026-04-26T14:26:48Z
Agent: Startup Strategy Architect & Lead Engineer (supervised)
Repository: /Users/abhisheksrivastava/intact-mcp-server
Status: implemented
Implementation result: map-platform-implementation-results/2026-04-26-dev-interface-doctor-dynamic-patch-selection.md

## Objective

Remove the hardcoded exported patch path in `doctor_map_platform_dev_interface` so the tool always recommends the latest matching remediation patch under `exports/map-platform/patches/`.

## Scope

- Add optional `patch_hint` input (defaults to `fix-route-load-failed`).
- Resolve the latest exported patch via `findLatestExportedPatch()` and use it in:
  - `dry_run` output (`remediation_patch`),
  - OSRM/provider-mismatch remediation actions (include a reverse-check command + apply command).
- Update tool docs to reflect the new input/output fields.

## Files Allowed

- src/server.js
- docs/tool_reference.md
- test/smoke-test.js (only if schema changes require it)

## Verification

- `npm test`

## Risks

- None expected; change is backwards compatible (optional input and additive output fields).
