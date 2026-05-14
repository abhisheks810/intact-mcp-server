# Clarify router README smoke tests for backend-mode mismatches

Created: 2026-05-14T23:01:14.746Z
Repository: /tmp/map-platform-agent-hvvthvoe/worktree
Result: passed
Change request: map-platform-change-requests/2026-05-14T23-00-21-584Z-clarify-router-readme-smoke-tests-for-backend-mode-mismatches.md

## Changed Files

- router/README.md

## Commands Run

- TBD

## Notes

Updated router/README.md to add backend /route forwarding smoke-test guidance, clarify that the UI usually calls the backend rather than the router directly, and document how to interpret router-vs-backend-vs-frontend failures in local routing diagnosis.

## Residual Risks

- Documentation was not runtime-verified in this loop; curl examples assume the documented localhost ports remain current.
- Related guidance in docs/development_interface.md still uses a shorter smoke-test flow and may diverge slightly from the expanded router README troubleshooting sequence.
