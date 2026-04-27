# Make `./scripts/verify.sh` Sandbox-Safe

Created: 2026-04-26T08:07:30Z
Agent: qa-evaluation-agent (supervised)
Repository: /Users/abhisheksrivastava/map_platform
Status: proposed
Related task: map-platform-tasks/2026-04-26-make-verify-sandbox-safe.md

## Summary

Allow `./scripts/verify.sh` to run in sandboxed/readonly environments by skipping the frontend build when `frontend/` is not writable, while keeping backend Python compile checks as the baseline.

## Note

As of 2026-04-26, `/Users/abhisheksrivastava/map_platform` on `main` already contains the skip behavior. This patch is kept for older/local checkouts that still run an unconditional frontend build.

## Target Files

- scripts/verify.sh

## Proposed Changes

### scripts/verify.sh

- Add an explicit `SKIP_FRONTEND_BUILD=1` escape hatch.
- When `frontend/node_modules` is present but `frontend/` is not writable, skip `npm --prefix frontend run build` with a clear message (avoids Vite `EPERM` temp-file writes).

## Patch

Apply:

```bash
cd /Users/abhisheksrivastava/map_platform
git apply /Users/abhisheksrivastava/intact-mcp-server/exports/map-platform/patches/2026-04-26-make-verify-sandbox-safe.patch
```

Patch:

```diff
--- a/scripts/verify.sh
+++ b/scripts/verify.sh
@@ -18,6 +18,11 @@
-if [ -d "$ROOT/frontend/node_modules" ]; then
-  npm --prefix "$ROOT/frontend" run build
+if [ "${SKIP_FRONTEND_BUILD:-0}" = "1" ]; then
+  echo "Skipping frontend build: SKIP_FRONTEND_BUILD=1."
+elif [ ! -w "$ROOT/frontend" ]; then
+  echo "Skipping frontend build: frontend/ is not writable in this environment."
+  echo "Run locally with a writable frontend tree: npm --prefix frontend run build"
+elif [ -d "$ROOT/frontend/node_modules" ]; then
+  npm --prefix "$ROOT/frontend" run build
 else
   echo "Skipping frontend build: frontend/node_modules is not installed."
   echo "Run: npm --prefix frontend install && npm --prefix frontend run build"
 fi
```

## Verification

- In a checkout missing the skip behavior, `git apply --check` against `/Users/abhisheksrivastava/map_platform`.
- In a checkout that already contains the skip behavior, `git apply --check --reverse` should pass.
- In a sandboxed environment, `./scripts/verify.sh` should complete without error and print a clear skip message when `frontend/` is not writable.

## Rollback

- Revert the added writability/`SKIP_FRONTEND_BUILD` checks and restore unconditional `npm --prefix frontend run build` when `frontend/node_modules` exists.
