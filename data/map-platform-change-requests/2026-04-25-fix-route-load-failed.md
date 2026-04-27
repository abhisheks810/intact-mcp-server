# Fix "Load failed" On Get Route (Local Dev Default)

Created: 2026-04-25T23:49:00-04:00
Agent: backend-api-agent
Repository: /Users/abhisheksrivastava/map_platform
Status: approved-for-scoped-work
Related proposal: map-platform-patch-proposals/2026-04-25-fix-route-load-failed.md

## Objective

Resolve the user feedback item: the UI should show a route after pressing **Get Route** in the local daily-review workflow.

## Allowed Files

- scripts/start-backend.sh
- scripts/dev-local-stack.sh
- docs/development_interface.md
- README.md
- backend/routers/route.py

## Verification

- `./scripts/verify.sh`
- `./scripts/dev-local-stack.sh`
- Browser UI: confirm **Get Route** works for Delhi example coordinates.

## Approval Note

Approved based on `data/user-feedback/map-platform-feedback.md` tested at 2026-04-25 23:36 EDT requesting that routing works in the UI.
