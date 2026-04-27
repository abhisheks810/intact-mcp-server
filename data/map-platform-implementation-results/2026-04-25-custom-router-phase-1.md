# Custom Router Phase 1

Created: 2026-04-25T18:55:00-04:00
Repository: /Users/abhisheksrivastava/map_platform
Result: passed
Change request: map-platform-patch-proposals/2026-04-25-custom-router-phase-1.md

## Changed Files

- custom_router/app.py
- custom_router/graph.py
- custom_router/algorithms.py
- custom_router/fixtures/delhi_core.json
- custom_router/requirements.txt
- custom_router/Dockerfile
- backend/routers/route.py
- docker-compose.yml
- scripts/setup-local-python.sh
- scripts/start-backend.sh
- scripts/start-custom-router.sh
- scripts/dev-local-stack.sh
- scripts/verify.sh
- docs/custom_router.md
- docs/development_interface.md
- README.md

## Commands Run

- ./scripts/setup-local-python.sh
- ./scripts/start-custom-router.sh
- BACKEND_PORT=8002 ROUTER_PROVIDER=intact ./scripts/start-backend.sh
- curl http://localhost:8090/
- curl "http://localhost:8090/route?origin=28.6314022,77.2193791&destination=28.6129,77.2295"
- curl "http://localhost:8002/route?origin=28.6314022,77.2193791&destination=28.6129,77.2295"
- ./scripts/verify.sh
- npm test

## Notes

Implemented the first internal routing service replacement path. The custom router uses a small Delhi-core fixture graph, nearest-node snapping, and Dijkstra shortest path. The backend can now switch between OSRM and the internal router using `ROUTER_PROVIDER=osrm|intact`. Direct custom-router calls and backend-provider calls both returned route geometry compatible with the frontend.

## Residual Risks

- The custom router is fixture-backed only; it does not parse OSM data yet.
- It snaps to graph nodes, not road edges.
- It does not support one-way restrictions, turn restrictions, live weights, road profiles, or real instruction generation yet.
- The default backend provider remains OSRM until the internal router supports real OSM graph artifacts.
