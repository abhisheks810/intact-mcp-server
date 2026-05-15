# Clarify router README with startup verification steps

Created: 2026-05-15T00:20:43.811Z
Repository: /tmp/map-platform-agent-pyrhf6ou/worktree
Result: passed
Change request: map-platform-change-requests/2026-05-15T00-20-13-843Z-clarify-router-readme-with-startup-verification-steps.md

## Changed Files

- router/README.md

## Commands Run

- TBD

## Notes

Updated router/README.md with a quick startup verification checklist, explicit backend startup commands for intact and osrm modes, and quick port checks to reduce false-negative local debugging.

## Residual Risks

- Documentation guidance was not validated by executing local router or backend processes in this run.
- README may still drift if startup scripts or default ports change later without corresponding doc updates.
