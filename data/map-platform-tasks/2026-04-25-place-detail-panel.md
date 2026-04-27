# Add Place Detail Panel

Created: 2026-04-25T18:26:00-04:00
Agent: frontend-ux-agent
Repository: /Users/abhisheksrivastava/map_platform
Status: proposed (apply-ready patch exported)

Patch:

- `/Users/abhisheksrivastava/intact-mcp-server/exports/map-platform/patches/2026-04-26-add-place-detail-panel.patch`

## Current State / Next Step

- Change request (pending approval): `data/map-platform-change-requests/2026-04-26-add-place-detail-panel.md`
- Patch apply-check:
  - `git apply --check /Users/abhisheksrivastava/intact-mcp-server/exports/map-platform/patches/2026-04-26-add-place-detail-panel.patch` (PASS, 2026-04-26)
  - `git apply --check --reverse /Users/abhisheksrivastava/intact-mcp-server/exports/map-platform/patches/2026-04-26-add-place-detail-panel.patch` (FAIL, not applied yet; 2026-04-26)
- If approved and `/Users/abhisheksrivastava/map_platform` is writable, apply the patch and run `./scripts/verify.sh`.

## Objective

Add a basic place-detail panel that uses the new `Place` contract so the map platform starts moving from directions-only toward local discovery.

## Scope

- Preserve the current origin/destination route workflow.
- Store the last selected geocode result as a `Place`.
- Show a compact place-detail panel in the frontend.
- Display name, category, address, coordinates, confidence, provenance, and accessibility review status.
- Keep accessibility values clearly marked as `unknown`/`unverified`.

## Files Allowed

- frontend/src/App.jsx
- frontend/src/components/SearchBar.jsx
- frontend/src/components/PlaceDetailPanel.jsx
- frontend/src/index.css
- docs/development_interface.md
- README.md

## Verification

- ./scripts/verify.sh
- Manual browser check at the active Vite dev URL.

## Risks

- The backend is not currently running locally, so full geocode interaction requires backend/geocoder startup.
- The UI must not imply accessibility metadata is verified.
- Route workflow should remain usable.
