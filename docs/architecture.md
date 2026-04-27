# Architecture

## Role In The Umbrella Platform

This server is the first shared MCP service. It is intentionally focused on low-risk operating memory:

- strategy documents;
- decision records;
- product briefs;
- agent specifications;
- research notes;
- review checklists.

It does not access production systems, cloud accounts, health data, payment systems, or user data.

## Boundaries

In scope:

- Read strategy markdown from `STRATEGY_ROOT`.
- Create generated planning artifacts under `INTACT_WORKSPACE`.
- Serve resources and tools over MCP stdio.

Out of scope:

- Production deployments.
- Secrets management.
- Live database mutation.
- Health-data access.
- Browser automation.
- External network research.

## Default Paths

| Variable | Default |
| --- | --- |
| `STRATEGY_ROOT` | `/Users/abhisheksrivastava/host_strategy` |
| `INTACT_WORKSPACE` | `./data` from this repository |
| `MAP_PLATFORM_ROOT` | `/Users/abhisheksrivastava/map_platform` |
| `MAP_PLATFORM_WRITE_ENABLED` | `false` unless set to `true` |

## MCP Methods Implemented

- `initialize`
- `ping`
- `tools/list`
- `tools/call`
- `resources/list`
- `resources/read`
- `notifications/*` as no-op notifications

## Data Model

Generated artifacts are markdown files:

```text
data/
  decisions/
  product-briefs/
  agent-specs/
  research-notes/
  map-platform-tasks/
  map-platform-patch-proposals/
  map-platform-change-requests/
  map-platform-implementation-results/
```

This is deliberate. Plain files are easy to review, diff, commit, and migrate into a database later.

## Security Model

The first version uses filesystem boundaries:

- Strategy reads are restricted to markdown files under `STRATEGY_ROOT`.
- Artifact writes are restricted to the configured workspace subfolders.
- No shell execution tool is exposed.
- No destructive/delete tool is exposed.
- Map platform repository tools are read-only plus task-note creation.
- Patch proposal tools create review artifacts only; they do not modify `map_platform`.
- File write tools require `MAP_PLATFORM_WRITE_ENABLED=true`.
- File write tools require current-file `sha256` to avoid overwriting unknown edits.
- File write tools require a change request that lists the target file or directory.

Future hosted versions should add:

- agent identity;
- per-tool authorization;
- append-only audit log;
- approval workflow for sensitive writes;
- tenant separation if used across projects.
