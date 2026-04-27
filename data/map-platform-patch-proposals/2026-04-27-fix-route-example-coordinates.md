# Patch Proposal: Fix Route Example Coordinates (Custom Router Coverage)

Created: 2026-04-27T16:08:58Z
Agent: Codex (supervised)
Repository: /Users/abhisheksrivastava/map_platform
Status: accepted-for-supervised-implementation
Related change request: map-platform-change-requests/2026-04-27-fix-route-example-coordinates.md

## Summary

The default `./scripts/doctor-dev-interface.sh` route probe uses `28.6139,77.2090` as the origin. In the current `custom_router` Delhi-core fixture, that origin snaps **~1755m** to the nearest node, exceeding the fixture max snap threshold (**1500m**). The doctor then fails by default even when the stack is otherwise correct.

This patch switches the default origin to a known-good in-fixture coordinate (`Connaught Place`: `28.6314022,77.2193791`) and aligns README and UI placeholder guidance with the same example.

## Patch

Apply:

```bash
cd /Users/abhisheksrivastava/map_platform
git apply /Users/abhisheksrivastava/intact-mcp-server/exports/map-platform/patches/2026-04-27-fix-route-example-coordinates.patch
```

## Verification

```bash
cd /Users/abhisheksrivastava/map_platform
git apply --check /Users/abhisheksrivastava/intact-mcp-server/exports/map-platform/patches/2026-04-27-fix-route-example-coordinates.patch
./scripts/doctor-dev-interface.sh
./scripts/verify.sh
```

## Rollback

Revert:

- `scripts/doctor-dev-interface.sh` default origin
- README quick-test backend route example
- Search bar origin placeholder coordinate
