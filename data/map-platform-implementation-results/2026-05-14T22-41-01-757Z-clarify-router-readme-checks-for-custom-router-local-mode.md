# Clarify router README checks for custom-router local mode

Created: 2026-05-14T22:41:01.757Z
Repository: /tmp/map-platform-agent-dxcqrjn9/worktree
Result: passed
Change request: map-platform-change-requests/2026-05-14T22-40-19-931Z-clarify-router-readme-checks-for-custom-router-local-mode.md

## Changed Files

- router/README.md

## Commands Run

- Reviewed router/README.md for consistency with docs/development_interface.md

## Notes

Updated router/README.md to distinguish default custom-router local mode from OSRM mode, added mode-specific reachability and route smoke-test examples for ports 8090 and 5001, and clarified that troubleshooting should target the active backend router provider.

## Residual Risks

- Documentation guidance was aligned against docs/development_interface.md but not exercised against live local services in this run.
