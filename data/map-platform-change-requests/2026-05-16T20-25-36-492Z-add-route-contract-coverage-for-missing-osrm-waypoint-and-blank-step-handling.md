# Add route contract coverage for missing OSRM waypoint and blank step handling

Created: 2026-05-16T20:25:36.495Z
Agent: backend-api-agent
Repository: /tmp/map-platform-agent-zc_vwhli/worktree
Status: approved-for-scoped-work
Related proposal: TBD

## Objective

Add a small, commit-worthy test-only improvement covering run_osrm_route behavior when OSRM returns fewer than two waypoints and when maneuver instructions are blank so routing contract regressions are caught.

## Allowed Files

- tests/test_route_contracts.py

## Verification

- python -m unittest tests.test_route_contracts

## Approval Note

Scoped test coverage addition only; no production behavior changes.
