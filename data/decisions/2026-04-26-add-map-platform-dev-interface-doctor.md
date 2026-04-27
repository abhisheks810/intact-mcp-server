# Add Map Platform Dev-Interface Doctor Tool

Status: accepted
Date: 2026-04-26

## Context

Map platform user feedback reports that pressing **Get Route** can show a generic "load failed" error in the dev UI when local routing services are not running (or the backend defaults to an unavailable router).

During daily supervised iterations, agents need a fast, consistent, and non-destructive way to diagnose which local dev services are up (frontend, backend, geocoder, custom router, OSRM) before proposing changes or asking for manual troubleshooting.

## Decision

Add a new MCP tool, `doctor_map_platform_dev_interface`, to `intact-mcp-server` that:

- supports a `dry_run` mode (no network calls) for smoke tests and safe introspection;
- performs quick HTTP checks against the expected localhost endpoints; and
- returns structured output with lightweight hints for common routing failures.

## Consequences

- QA and supervised agent runs can quickly identify whether the "load failed" symptom is due to backend reachability, OSRM availability, or custom router health.
- The tool does not modify `map_platform` and does not require any secrets.
- A future improvement can tighten the heuristics by matching known FastAPI error formats and adding stack-specific remediation links to patch proposals.
