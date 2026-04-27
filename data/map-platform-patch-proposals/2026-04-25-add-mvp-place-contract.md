# Add MVP Place Contract

Created: 2026-04-25T00:00:00.000Z
Agent: geo-data-agent
Repository: /Users/abhisheksrivastava/map_platform
Status: accepted-and-implemented-supervised
Related task: map-platform-tasks/2026-04-25-define-mvp-place-schema.md

## Summary

Introduce a stable `Place` contract for `map_platform` before expanding beyond routing into India-first local discovery. The current geocoder returns only `lat`, `lon`, and `display_name`; that is insufficient for landmark-aware search, POI enrichment, provenance, confidence, accessibility metadata, and frontend place-detail experiences.

## Target Files

- geocoder/app.py
- backend/routers/geocode.py
- frontend/src/components/SearchBar.jsx
- frontend/src/App.jsx
- README.md

## Proposed Changes

### geocoder/app.py

Add normalized place response fields while preserving current fields during transition:

- `id`
- `name`
- `display_name`
- `category`
- `address_text`
- `lat`
- `lon`
- `landmark_aliases`
- `provenance`
- `confidence`
- `accessibility`
- `review_status`

Rationale:

The geocoder is the first place where raw Nominatim output can be normalized into an organisation-owned place contract. Keeping current fields avoids breaking the existing frontend route flow.

### backend/routers/geocode.py

Ensure backend geocode responses proxy the normalized place contract and document that `/geocode` returns `Place[]`.

Rationale:

The backend should expose stable contracts to the frontend even if geocoder internals later switch from Nominatim to PostGIS, cached POIs, or hybrid search.

### frontend/src/components/SearchBar.jsx

Update search result handling to tolerate richer place objects while continuing to use coordinates for route calculation.

Rationale:

The first UI path can stay directions-focused, but it should not hard-code itself to `display_name/lat/lon` only.

### frontend/src/App.jsx

Add a future-facing place-detail state boundary if search starts returning selected place metadata.

Rationale:

Local discovery requires place details. Adding a boundary now prevents route UI from becoming the only product model.

### README.md

Document `Place` as the MVP shared contract and note that accessibility fields are initially metadata with review status, not verified claims.

Rationale:

This keeps implementation aligned with the organisation strategy and avoids overstating accessibility correctness.

## Proposed Place Shape

```json
{
  "id": "osm:node:12345",
  "name": "Connaught Place",
  "display_name": "Connaught Place, New Delhi, Delhi, India",
  "category": "locality",
  "address_text": "Connaught Place, New Delhi",
  "lat": 28.6315,
  "lon": 77.2167,
  "landmark_aliases": ["CP", "Rajiv Chowk"],
  "provenance": {
    "source": "nominatim",
    "source_id": "12345",
    "license": "OSM/ODbL",
    "retrieved_at": "2026-04-25T00:00:00.000Z"
  },
  "confidence": 0.7,
  "accessibility": {
    "wheelchair_access": "unknown",
    "step_free_access": "unknown",
    "accessible_parking": "unknown",
    "sign_language_support": "unknown",
    "review_status": "unverified"
  },
  "review_status": "machine_imported"
}
```

## Patch

```diff
# Implemented as a supervised patch in map_platform.
# See implementation result:
# map-platform-implementation-results/2026-04-25-mvp-place-contract-implementation.md
```

## Verification

- Run backend tests if present.
- Run a manual geocode call through backend: `curl "http://localhost:8000/geocode?address=Connaught%20Place&limit=1"`.
- Run frontend build if `SearchBar.jsx` or `App.jsx` changes.
- Verify the old route search path still works.

## Risks

- Existing frontend code may assume `lat/lon/display_name` only.
- Nominatim fields may not reliably provide category/name/source id in all cases.
- Accessibility fields must default to `unknown/unverified`; otherwise the UI may imply verified accessibility claims.
- OSM/ODbL provenance and license obligations need explicit review before any derived database is published.

## Rollback

Do not merge implementation changes. This proposal does not modify `map_platform`. If implemented later, rollback by reverting the specific patch touching geocoder/backend/frontend files.
