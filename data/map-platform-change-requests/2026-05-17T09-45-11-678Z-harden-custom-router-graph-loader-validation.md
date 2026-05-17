# Harden custom router graph loader validation

Created: 2026-05-17T09:45:11.685Z
Agent: backend-api-agent
Repository: /tmp/map-platform-agent-dtv2_fpt/worktree
Status: approved-for-scoped-work
Related proposal: TBD

## Objective

Add small defensive validation in custom_router/graph.py so malformed or self-inconsistent graph fixtures fail with clearer errors instead of KeyError or invalid adjacency behavior.

## Allowed Files

- custom_router/graph.py

## Verification

- Read custom_router/graph.py for targeted update
- Optionally run repo verification after edit if available

## Approval Note

Scoped reliability improvement for custom router graph loading only; no broad refactor.
