# Fix Route Example Coordinates (Custom Router Coverage)

Created: 2026-04-27T16:08:58Z
Agent: Startup Strategy Architect & Lead Engineer (supervised)
Repository: /Users/abhisheksrivastava/map_platform
Status: pending-approval
Related proposal: map-platform-patch-proposals/2026-04-27-fix-route-example-coordinates.md

## Objective

Ensure the default route example coordinates used by the daily-review workflow are inside the `custom_router` (Delhi core) fixture coverage so that:

- `./scripts/doctor-dev-interface.sh` passes with defaults when `ROUTER_PROVIDER=intact`, and
- README / UI placeholders point to a known-good “first route” example.

This directly supports the user feedback that **Get Route** should work in the dev UI.

## Allowed Files

- scripts/doctor-dev-interface.sh
- README.md
- frontend/src/components/SearchBar.jsx

## Patch

- `/Users/abhisheksrivastava/intact-mcp-server/exports/map-platform/patches/2026-04-27-fix-route-example-coordinates.patch`

## Verification

- Patch readiness:
  - `cd /Users/abhisheksrivastava/map_platform && git apply --check /Users/abhisheksrivastava/intact-mcp-server/exports/map-platform/patches/2026-04-27-fix-route-example-coordinates.patch`
  - `cd /Users/abhisheksrivastava/map_platform && git apply --check --reverse /Users/abhisheksrivastava/intact-mcp-server/exports/map-platform/patches/2026-04-27-fix-route-example-coordinates.patch`
- Manual stack check (writable local environment):
  - `./scripts/dev-local-stack.sh`
  - `./scripts/doctor-dev-interface.sh` (with defaults; should report `OK: backend route returned geometry`)

## Approval Note

Low-risk dev-interface/QA improvement. Approve before applying to `/Users/abhisheksrivastava/map_platform`.
