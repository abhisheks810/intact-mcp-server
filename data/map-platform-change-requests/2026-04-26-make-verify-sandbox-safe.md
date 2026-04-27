# Make `./scripts/verify.sh` Sandbox-Safe

Created: 2026-04-26T08:07:30Z
Agent: qa-evaluation-agent (supervised)
Repository: /Users/abhisheksrivastava/map_platform
Status: pending-approval
Related proposal: map-platform-patch-proposals/2026-04-26-make-verify-sandbox-safe.md

## Objective

Enable repeatable `./scripts/verify.sh` runs under sandbox/readonly constraints by skipping the frontend build when `frontend/` is not writable.

## Allowed Files

- scripts/verify.sh

## Verification

- `./scripts/verify.sh` should:
  - pass Python compile checks; and
  - skip the frontend build with a clear message when `frontend/` is not writable.

## Approval Note

This is a low-risk QA/dev-loop reliability change, but it alters the default verification behavior in restricted environments. Approve before applying to `/Users/abhisheksrivastava/map_platform`.

## Update (2026-04-26)

`/Users/abhisheksrivastava/map_platform/scripts/verify.sh` on `main` already contains the sandbox-safe skip behavior. See:

- Implementation result: `data/map-platform-implementation-results/2026-04-26-verify-script-sandbox-safe-present.md`
