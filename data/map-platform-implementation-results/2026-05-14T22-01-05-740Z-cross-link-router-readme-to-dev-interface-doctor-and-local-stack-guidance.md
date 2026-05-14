# Cross-link router README to dev-interface doctor and local stack guidance

Created: 2026-05-14T22:01:05.740Z
Repository: /tmp/map-platform-agent-ira5gn1n/worktree
Result: passed
Change request: map-platform-change-requests/2026-05-14T22-00-29-187Z-cross-link-router-readme-to-dev-interface-doctor-and-local-stack-guidance.md

## Changed Files

- router/README.md

## Commands Run

- TBD

## Notes

Updated router/README.md to clarify that OSRM checks at localhost:5001 only apply when the backend is explicitly configured with ROUTER_PROVIDER=osrm, documented the default non-Docker custom-router path, and added a cross-link to the existing dev-interface doctor workflow for faster local diagnosis.

## Residual Risks

- Documentation-only change; commands were not executed in this run, so runtime behavior and script availability were not re-verified here.
