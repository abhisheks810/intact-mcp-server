# Map Platform Tasks (Artifacts)

This directory is the **task queue** for the map-platform daily agent loop.

Each task should be short, scoped, and link to the corresponding artifacts as they are created:

- `../map-platform-patch-proposals/` (optional) — concrete diffs and rollout plan.
- `../map-platform-change-requests/` — human-approved scope + verification plan.
- `../map-platform-implementation-results/` — what shipped (or what was blocked) + verification.

## Status (convention)

Tasks may include a `Status:` line near the top. Use these values when possible:

- `proposed` — needs proposal and/or change request.
- `approved-for-scoped-work` — change request approved; ready to implement.
- `implemented` — implementation result exists and verification recorded.
- `blocked` — cannot proceed; state the blocker and point to the next step.

## Sandbox note

In the Codex `workspace-write` sandbox, `/Users/abhisheksrivastava/map_platform` may not be writable.

When blocked, prefer exporting/applying a patch and recording explicit apply instructions (path + `git apply` command) rather than trying to mutate the repo directly.
