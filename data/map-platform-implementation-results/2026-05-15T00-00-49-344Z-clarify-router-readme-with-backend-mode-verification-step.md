# Clarify router README with backend mode verification step

Created: 2026-05-15T00:00:49.344Z
Repository: /tmp/map-platform-agent-nnm3uv9e/worktree
Result: passed
Change request: map-platform-change-requests/2026-05-15T00-00-18-523Z-clarify-router-readme-with-backend-mode-verification-step.md

## Changed Files

- router/README.md

## Commands Run

- TBD

## Notes

Added a backend mode verification subsection to router/README.md so local route debugging starts by confirming the active ROUTER_PROVIDER before router-specific curl checks. This is a scoped docs-only reliability clarification.

## Residual Risks

- Documentation was not exercised by automated verification because the change is docs-only.
- Developers may still have custom local ports or startup wrappers that require manual interpretation beyond the documented defaults.
