# Dev-Interface Doctor: Map Platform Git Capabilities

Timestamp (UTC): 2026-04-27T14:09:32Z
Result: implemented (intact-mcp-server tool improvement)

## What Changed

`map_platform_git_status` and `doctor_map_platform_dev_interface` now surface `repo_status.map_platform.capabilities`:

- `repo_root_writable`: whether `MAP_PLATFORM_ROOT` is writable in the current runtime.
- `git_dir_writable`: whether `MAP_PLATFORM_ROOT/.git/` is writable.
- `fetch_head_writable`: whether `.git/FETCH_HEAD` is writable (required for `git fetch` / `git pull`).
- `worktrees_dir_writable`: whether `.git/worktrees/` is writable (required for `git worktree remove` / `git worktree prune`).

When these are false, `doctor_map_platform_dev_interface` emits explicit `actions[]` entries explaining which finalization steps are expected to fail inside restricted sandboxes.

## Why This Matters

The map-platform daily loop requires upstream sync, push, and worktree cleanup. In some sandboxes those steps fail with `Operation not permitted` even when the code itself is correct. Making the capability limits explicit prevents wasted retries and provides immediate “run outside sandbox” guidance.

## Verification

- `cd /Users/abhisheksrivastava/intact-mcp-server && npm test` (PASS)
