# Clarify local smoke tests by router mode

Created: 2026-05-14T23:21:02.079Z
Repository: /tmp/map-platform-agent-xy8ifza3/worktree
Result: passed
Change request: map-platform-change-requests/2026-05-14T23-20-20-094Z-clarify-local-smoke-tests-by-router-mode.md

## Changed Files

- docs/development_interface.md

## Commands Run

- TBD

## Notes

Updated the development interface guide to split local smoke tests by active router mode, added backend /route verification for both custom-router and OSRM paths, and documented the key interpretation when router-specific curl passes but backend forwarding fails.

## Residual Risks

- Documentation change was reviewed against existing router README guidance, but no live service verification was run in this loop.
