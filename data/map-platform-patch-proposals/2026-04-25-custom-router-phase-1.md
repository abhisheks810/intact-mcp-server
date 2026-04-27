# Custom Router Phase 1

Created: 2026-04-25T18:45:00-04:00
Agent: routing-tiles-agent
Repository: /Users/abhisheksrivastava/map_platform
Status: accepted-for-supervised-implementation
Related task: map-platform-tasks/2026-04-25-custom-router-phase-1.md

## Summary

Add the first internal OSRM replacement path: a `custom_router` FastAPI service with a small fixture graph, Dijkstra routing, nearest-node snapping, and backend provider switching.

## Target Files

- custom_router/app.py
- custom_router/graph.py
- custom_router/algorithms.py
- custom_router/fixtures/delhi_core.json
- custom_router/requirements.txt
- custom_router/Dockerfile
- backend/routers/route.py
- docker-compose.yml
- scripts/start-custom-router.sh
- scripts/verify.sh
- docs/custom_router.md
- README.md

## Proposed Changes

### custom_router/

Create a minimal routing service that can run locally without OSRM data.

Rationale:

This gives the agents a real replacement path while avoiding premature India-scale graph complexity.

### backend/routers/route.py

Add `ROUTER_PROVIDER=osrm|intact`; use OSRM by default and call `CUSTOM_ROUTER_HOST` when provider is `intact`.

Rationale:

Provider switching lets the app compare OSRM and internal routing without breaking current deployments.

### docs/scripts

Document the phase-1 router limitations and startup path.

Rationale:

The development UI should remain testable every day.

## Verification

- Python compile checks.
- Custom router `/route` smoke test.
- Backend `/route` smoke test with `ROUTER_PROVIDER=intact`.
- Frontend build still passes.

## Risks

- Fixture graph only supports known Delhi-core coordinates initially.
- Real OSM parsing, edge snapping, turn restrictions, and instructions remain future phases.

## Rollback

Set `ROUTER_PROVIDER=osrm` or remove the `custom_router` service and backend provider branch.
