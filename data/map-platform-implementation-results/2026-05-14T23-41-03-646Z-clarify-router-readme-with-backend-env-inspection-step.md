# Clarify router README with backend env inspection step

Created: 2026-05-14T23:41:03.646Z
Repository: /tmp/map-platform-agent-0jzstvip/worktree
Result: passed
Change request: map-platform-change-requests/2026-05-14T23-40-11-526Z-clarify-router-readme-with-backend-env-inspection-step.md

## Changed Files

- router/README.md

## Commands Run

- TBD

## Notes

Updated router/README.md with a backend ROUTER_PROVIDER inspection section, plus checklist and QA-script references so local route debugging starts by confirming the active backend provider before testing OSRM or custom-router endpoints.

## Residual Risks

- The process-inspection example using pgrep/ps may need adjustment on some developer environments depending on shell, process names, or platform-specific ps output.
- This is a documentation-only change and does not enforce provider detection in tooling or the app itself.
