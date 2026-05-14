# Clarify router local verification with port and browser-network checks

Created: 2026-05-14T21:00:56.756Z
Repository: /tmp/map-platform-agent-je5hairn/worktree
Result: passed
Change request: map-platform-change-requests/2026-05-14T21-00-21-104Z-clarify-router-local-verification-with-port-and-browser-network-checks.md

## Changed Files

- router/README.md

## Commands Run

- read router/README.md

## Notes

Updated router/README.md with explicit default local port assumptions, browser network inspection steps, and a more actionable manual QA script for diagnosing UI 'load failed' routing issues. Verified the written file content by rereading it.

## Residual Risks

- Documentation references localhost:5001 as the default router endpoint and may need future adjustment if local defaults change.
- This was a docs-only update; no automated runtime verification was executed against a live router service or UI.
