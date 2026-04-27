# Dev-Interface Doctor: Map Platform Worktree Visibility

Timestamp (UTC): 2026-04-27T15:07:44Z
Result: implemented (intact-mcp-server tool improvement)

## What Changed

`repo_status.map_platform` now includes `worktrees` (parsed from `git worktree list --porcelain`) so the daily loop can quickly spot:

- stale Codex worktrees under `/Users/abhisheksrivastava/.codex/worktrees/*/map_platform`, and
- broken worktrees that can cause confusing `git status` output or VS Code Source Control noise.

`doctor_map_platform_dev_interface` also emits a remediation `actions[]` entry that lists the detected Codex worktrees and suggests cleanup commands (`git worktree remove --force …` and `git worktree prune`).

## Why This Matters

The daily loop requires worktree cleanup to keep the workspace tidy between iterations. When `.git/worktrees/` is not writable inside a sandbox, cleanup fails with `Operation not permitted`. Surfacing the worktree list (and a single consolidated cleanup action) makes the failure mode obvious and provides “run outside sandbox” commands without rediscovery.

## Verification

- `cd /Users/abhisheksrivastava/intact-mcp-server && npm test` (PASS)
