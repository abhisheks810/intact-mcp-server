# Clarify router README with backend forwarding diagnosis guidance

Created: 2026-05-18T15:51:41.444Z
Agent: routing-tiles-agent
Repository: /tmp/map-platform-agent-4jsouj8_/worktree
Status: approved-for-scoped-work
Related proposal: TBD

## Objective

Make router local verification guidance more actionable by adding a concise section that helps developers distinguish router reachability, backend forwarding mismatch, and frontend wiring issues during local route debugging.

## Allowed Files

- router/README.md

## Verification

- Review router/README.md for clear sequencing around direct router curl, backend /route curl, and browser network inspection.

## Approval Note

Scoped documentation-only improvement in router/README.md to reduce local routing diagnosis confusion.
