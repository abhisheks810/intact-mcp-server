# Implementation Result: Route Example Coordinates Inside Custom Router Coverage

Date: 2026-04-27
Agent: Startup Strategy Architect & Lead Engineer (supervised)
Repository: /Users/abhisheksrivastava/map_platform

## Summary

Exported a patch that fixes the default route example coordinates used by:

- `./scripts/doctor-dev-interface.sh` (default origin), and
- README / UI guidance.

This prevents false negatives where the dev-interface doctor fails by default under `ROUTER_PROVIDER=intact` because the origin is outside the Delhi-core fixture snap radius.

## Root Cause

The `custom_router` fixture uses `MAX_SNAP_DISTANCE_M = 1500`. The prior doctor default origin (`28.6139,77.2090`) snaps about **1755m** to the nearest node in `custom_router/fixtures/delhi_core.json`, triggering an `outside_custom_router_coverage` response even when the stack is healthy.

## Patch

- `/Users/abhisheksrivastava/intact-mcp-server/exports/map-platform/patches/2026-04-27-fix-route-example-coordinates.patch`

## Verification

- Patch readiness:
  - `cd /Users/abhisheksrivastava/map_platform && git apply --check /Users/abhisheksrivastava/intact-mcp-server/exports/map-platform/patches/2026-04-27-fix-route-example-coordinates.patch` (PASS)
  - `cd /Users/abhisheksrivastava/map_platform && git apply --check --reverse /Users/abhisheksrivastava/intact-mcp-server/exports/map-platform/patches/2026-04-27-fix-route-example-coordinates.patch` (FAIL; patch not yet applied)

## Next Steps

1. Apply the patch to `/Users/abhisheksrivastava/map_platform`.
2. Run `./scripts/dev-local-stack.sh` and confirm `./scripts/doctor-dev-interface.sh` passes with defaults.
3. Re-test dev UI **Get Route** using the updated placeholder / README example coordinates.
