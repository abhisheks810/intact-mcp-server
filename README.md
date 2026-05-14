# Intact MCP Server

`intact-mcp-server` is the first internal MCP server for the umbrella organisation strategy workspace.

It exposes the most immediately useful shared operating layer:

- strategy documents as MCP resources;
- product and agent planning templates as resources;
- tools for searching docs, creating product briefs, creating agent specs, recording decisions, and running review checklists;
- a durable local workspace for generated operating artifacts.

This server is intentionally dependency-light. It implements MCP stdio framing directly in Node.js so it can run before the rest of the platform is bootstrapped.

## Why This Server First

From the strategy pack, the highest-leverage first MCP server is not a production deployer or a health-data agent. Those require mature permissioning and domain controls.

The most needed first server is a **strategy and operating-memory MCP server** because every later product agent needs:

- access to the same product strategy;
- a consistent way to create briefs/specs;
- a decision log;
- review checklists;
- documented constraints before writing code or touching data.

## Repository Layout

| Path | Purpose |
| --- | --- |
| `src/server.js` | MCP stdio server implementation. |
| `docs/` | Server documentation and operating guidance. |
| `examples/` | Example MCP client config and tool payloads. |
| `templates/` | Templates used by the server tools. |
| `data/` | Generated decisions, briefs, specs, and notes. |
| `test/` | Lightweight smoke tests. |

## Requirements

- Node.js 20 or newer.
- No npm install is required for the current implementation.

## Run

```bash
npm start
```

By default, the server reads strategy docs from:

```bash
/Users/abhisheksrivastava/host_strategy
```

By default, the map platform repo path is:

```bash
/Users/abhisheksrivastava/map_platform
```

Override paths if needed:

```bash
STRATEGY_ROOT=/path/to/strategy \
INTACT_WORKSPACE=/path/to/generated/artifacts \
MAP_PLATFORM_ROOT=/path/to/map_platform \
npm start
```

Scoped repository writes are disabled by default. Enable them only for an approved implementation session:

```bash
MAP_PLATFORM_WRITE_ENABLED=true npm start
```

Even when enabled, writes require a change request, an allowed file entry, and the current file `sha256`.

## Smoke Test

```bash
npm test
```

The smoke test starts the server over stdio, sends MCP `initialize`, `tools/list`, `resources/list`, and a sample tool call, then exits.

## MCP Client Config Example

See [examples/mcp-client-config.json](examples/mcp-client-config.json).

## Current Tool Surface

- `list_strategy_docs`
- `read_strategy_doc`
- `search_strategy_docs`
- `create_product_brief`
- `create_agent_spec`
- `record_decision`
- `list_decisions`
- `list_workspace_artifacts`
- `read_workspace_artifact`
- `run_review_checklist`
- `create_research_note`
- `list_map_platform_files`
- `list_map_platform_directory`
- `read_map_platform_file`
- `search_map_platform`
- `map_platform_git_status`
- `map_platform_git_diff`
- `run_map_platform_verify`
- `doctor_map_platform_verify`
- `doctor_map_platform_dev_interface`
- `doctor_map_platform_place_contract`
- `create_map_platform_agent_task`
- `create_map_platform_patch_proposal`
- `list_map_platform_patch_proposals`
- `read_map_platform_patch_proposal`
- `get_map_platform_file_metadata`
- `create_map_platform_change_request`
- `write_map_platform_file`
- `record_map_platform_implementation_result`
- `record_agent_run`
- `list_agent_runs`
- `read_agent_run`

Details are in [docs/tool_reference.md](docs/tool_reference.md).

## Map Platform Deep Agents

The first agent pack is documented in [docs/map_platform_deep_agents.md](docs/map_platform_deep_agents.md).

These are not background daemons inside this MCP server. MCP servers expose tools and context; an MCP client or orchestrator runs the agents and calls this server. The current implementation provides the planning memory, specs, and guardrails those agents need before they are connected to code-editing, GitHub, CI, browser, or deployment tools.
