# Dev-Interface Doctor Reports Sandbox Listen Capability

Created: 2026-04-26T18:30:13Z
Repository: /Users/abhisheksrivastava/intact-mcp-server
Result: implemented

## Outcome

`doctor_map_platform_dev_interface` now reports whether the current runtime can bind localhost listening sockets.

This helps distinguish:

- "The local stack is down" vs
- "This sandbox cannot start the local stack because binding ports is blocked (EPERM)."

## Changes

- Added `environment.can_listen_localhost` + `environment.listen_error` to `doctor_map_platform_dev_interface` output when `dry_run=false`.
- When all checks fail and `can_listen_localhost=false`, the tool includes an explicit action explaining that the dev stack must be started outside the sandbox.

## Verification

- `cd /Users/abhisheksrivastava/intact-mcp-server && npm test` (PASS)

## Notes

This does not change the tool’s `dry_run=true` behavior (no network requests issued); it only adds environment diagnostics to the executed run output.
