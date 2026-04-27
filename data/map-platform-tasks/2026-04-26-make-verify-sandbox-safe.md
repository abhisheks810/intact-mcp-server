# Make `./scripts/verify.sh` Sandbox-Safe

Created: 2026-04-26T08:07:30Z
Agent: qa-evaluation-agent (supervised)
Repository: /Users/abhisheksrivastava/map_platform
Status: implemented

## Objective

Ensure `./scripts/verify.sh` succeeds in sandboxed/readonly environments by **skipping the frontend build** when `frontend/` is not writable (even if `frontend/node_modules` is installed).

## Current State / Next Step

- Implementation result: `data/map-platform-implementation-results/2026-04-26-verify-script-sandbox-safe-present.md`
- Observed: `/Users/abhisheksrivastava/map_platform/scripts/verify.sh` already contains the skip behavior on `main` (commit `08fd21a`).
- If you encounter a checkout that still runs an unconditional frontend build, apply the exported patch:
  - `/Users/abhisheksrivastava/intact-mcp-server/exports/map-platform/patches/2026-04-26-make-verify-sandbox-safe.patch`

```bash
cd /Users/abhisheksrivastava/map_platform
git apply /Users/abhisheksrivastava/intact-mcp-server/exports/map-platform/patches/2026-04-26-make-verify-sandbox-safe.patch
./scripts/verify.sh
```

## Context

In the Codex `workspace-write` sandbox, frontend verification currently fails with:

- `EPERM: operation not permitted` when Vite attempts to write a temporary `vite.config.js.timestamp-...` file under `frontend/`.

This prevents agents from running the standard verification loop, even though backend Python compile checks can pass.

## Repro (Observed)

Previously (2026-04-26), running `./scripts/verify.sh` could fail during `vite build` with an error of the form:

- `EPERM: operation not permitted, open '/Users/abhisheksrivastava/map_platform/frontend/vite.config.js.timestamp-...mjs'`

Now, `/Users/abhisheksrivastava/map_platform/scripts/verify.sh` skips the frontend build when `frontend/` is not writable, which unblocks verification for tasks that depend on `./scripts/verify.sh` (for example `data/map-platform-tasks/2026-04-25-fix-route-load-failed.md`).

## Scope

- Update `scripts/verify.sh` to:
  - support an explicit `SKIP_FRONTEND_BUILD=1` escape hatch; and
  - auto-skip the frontend build if `frontend/` is not writable.

## Files Allowed

- scripts/verify.sh

## Verification

- In `/Users/abhisheksrivastava/map_platform`:
  - `./scripts/verify.sh` exits `0` and prints the skip message when `frontend/` is not writable.
- Patch sanity:
  - `git apply --check --reverse /Users/abhisheksrivastava/intact-mcp-server/exports/map-platform/patches/2026-04-26-make-verify-sandbox-safe.patch`

## Risks

- Skipping the frontend build in restricted environments can hide frontend build regressions; this is acceptable for sandboxed agent loops but should still be run in a writable environment before any release workflow.
