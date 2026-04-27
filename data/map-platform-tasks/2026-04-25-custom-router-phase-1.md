# Custom Router Phase 1

Created: 2026-04-25T18:45:00-04:00
Agent: routing-tiles-agent
Repository: /Users/abhisheksrivastava/map_platform

## Objective

Start replacing OSRM with an internal routing service by adding a fixture-backed custom router and backend provider switching.

## Scope

- Add `custom_router/` service.
- Implement route search over a small fixture graph.
- Return the same route response shape currently expected by the frontend.
- Add backend provider switching with `ROUTER_PROVIDER=osrm|intact`.
- Keep OSRM available as the default until the custom router reaches real OSM graph support.

## Files Allowed

- custom_router/
- backend/routers/route.py
- docker-compose.yml
- scripts/
- docs/
- README.md

## Verification

- ./scripts/verify.sh
- Start custom router locally and call `/route`.
- Start backend with `ROUTER_PROVIDER=intact` and call `/route`.

## Risks

- Fixture routing is not real map routing yet.
- Snapping arbitrary coordinates to graph nodes must be explicit and simple in phase 1.
- Frontend route geometry must remain `[lon,lat]` pairs.
