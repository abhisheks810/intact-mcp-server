# Define MVP Place Schema

Created: 2026-04-25T00:00:00.000Z
Agent: geo-data-agent
Repository: /Users/abhisheksrivastava/map_platform

## Objective

Define the minimum place schema needed for India-first local discovery, landmark-aware search, source provenance, and accessibility metadata.

## Scope

- Inspect current backend and geocoder code.
- Identify where place/search data should be represented.
- Propose fields for name, category, address, landmark aliases, coordinates, provenance, confidence, and accessibility metadata.
- Define how the frontend should consume place details without coupling to geocoder internals.

## Files Allowed

- backend/
- geocoder/
- frontend/src/
- docs/
- README.md

## Verification

- Confirm current repo git status before edits.
- Run backend tests if present.
- Run frontend build if frontend files change.
- Produce a short review packet with API/schema risks.

## Risks

- Schema changes can break frontend assumptions.
- Accessibility fields need review status to avoid unverified public claims.
- Imported data requires license/provenance tracking.
