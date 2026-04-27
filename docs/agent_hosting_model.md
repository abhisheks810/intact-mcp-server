# Agent Hosting Model

## Direct Answer

The MCP server has started, but it does not independently run agents.

MCP separates responsibilities:

- **MCP server**: exposes resources and tools.
- **MCP client/orchestrator**: runs the agent loop, selects tools, maintains model context, and applies approvals.
- **Agents**: role-specific instructions plus tool permissions, usually executed by the orchestrator.

For `intact-mcp-server`, the correct next step is to make it the strategy and operating-memory server for map-platform agents. Then connect an orchestrator that can use:

- this MCP server for strategy, decisions, briefs, specs, and review checklists;
- a repository MCP/server or local filesystem tool for `/Users/abhisheksrivastava/map_platform`;
- test/CI tools for verification;
- browser tools for frontend validation;
- deployment tools later, behind approval.

## Minimum Viable Agent Hosting Stack

```text
Agent Orchestrator
  |
  |-- intact-mcp-server
  |     |-- strategy docs
  |     |-- decisions
  |     |-- product briefs
  |     |-- agent specs
  |
  |-- repo/filesystem tools
  |     |-- /Users/abhisheksrivastava/map_platform
  |     |-- currently exposed read-only through intact-mcp-server
  |
  |-- runtime/test tools
  |     |-- npm test/build
  |     |-- python tests
  |     |-- docker compose validation
  |
  |-- browser/QA tools
        |-- localhost screenshots
        |-- interaction checks
```

## Implementation Phases

### Phase 1: Spec and Guardrail Layer

Create agent specs, decision records, and review workflows.

This is implemented now in:

- `docs/map_platform_deep_agents.md`
- `data/agent-specs/map-platform/*.md`
- `data/decisions/`

### Phase 2: Repo-Aware Agents

Add an MCP server or tool bridge that safely exposes the `map_platform` repository:

- read files;
- search code;
- inspect git status;
- create scoped task notes;
- create reviewable patch proposals;
- write scoped files only after approval and hash checks;
- run tests;
- report diffs.

The current implementation covers read/search/status/task notes, reviewable patch proposals, change requests, scoped file writes behind `MAP_PLATFORM_WRITE_ENABLED=true`, and implementation-result records.

## Scoped Write Flow

1. Create or read a task.
2. Create or read a patch proposal.
3. Create a change request with allowed files.
4. Read file metadata and capture `sha256`.
5. Call `write_map_platform_file` with the full new file content.
6. Run verification commands.
7. Record the implementation result.

The write tool rejects:

- calls when `MAP_PLATFORM_WRITE_ENABLED` is not `true`;
- path escapes;
- unsupported binary file types;
- writes to files not listed in the change request;
- writes when the current `sha256` differs from the expected value.

### Phase 3: Product-Aware Automation

Agents can create feature plans and implementation tasks:

- maps UX;
- POI/search/geocoder improvements;
- routing integration;
- accessibility metadata;
- backend API contracts;
- tileserver operations.

### Phase 4: Controlled Maintenance Automation

Agents can run scheduled checks:

- dependency risk;
- broken builds;
- map service health;
- frontend visual regressions;
- data quality drift;
- strategy alignment drift.

## Required Controls

Before allowing agents to modify `map_platform`, require:

- clean git status check;
- explicit task scope;
- touched-file allowlist;
- test command requirement;
- no production deployment rights;
- decision record for architectural changes;
- review checklist for launch-impacting changes.
