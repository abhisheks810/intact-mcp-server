# Tool Reference

## `list_strategy_docs`

Lists markdown documents under `STRATEGY_ROOT`.

Input:

```json
{}
```

## `read_strategy_doc`

Reads a strategy markdown document.

Input:

```json
{
  "path": "docs/00_executive_blueprint.md"
}
```

## `search_strategy_docs`

Searches strategy markdown documents.

Input:

```json
{
  "query": "accessibility",
  "limit": 10
}
```

## `create_product_brief`

Creates a product opportunity brief under `data/product-briefs`.

Required fields:

- `product_name`
- `thesis`
- `target_customer`
- `problem`
- `proposed_solution`

Optional fields:

- `revenue_hypothesis`
- `risks`
- `success_metrics`

## `create_agent_spec`

Creates an agent spec under `data/agent-specs`.

Required fields:

- `agent_name`
- `purpose`
- `product_line`

Optional fields:

- `allowed_tools`
- `forbidden_actions`
- `human_approvals`
- `evaluation_metrics`

## `record_decision`

Creates a markdown decision record under `data/decisions`.

Required fields:

- `title`
- `context`
- `decision`
- `consequences`

Optional fields:

- `status`: `proposed`, `accepted`, `rejected`, or `superseded`

## `list_decisions`

Lists decision records created by this server.

Input:

```json
{}
```

## `list_workspace_artifacts`

Lists generated artifacts under the configured `INTACT_WORKSPACE`.

Returned artifact kinds:

- `decisions`
- `product-briefs`
- `agent-specs`
- `research-notes`
- `map-platform-tasks`
- `map-platform-patch-proposals`
- `map-platform-change-requests`
- `map-platform-implementation-results`
- `agent-runs`

Input:

```json
{}
```

## `read_workspace_artifact`

Reads a generated markdown artifact.

Input:

```json
{
  "path": "agent-specs/map-platform/00-map-product-strategist.md"
}
```

## `run_review_checklist`

Generates a checklist for manual review.

Supported domains:

- `business`
- `market`
- `product`
- `architecture`
- `agent`
- `health`
- `accessibility`
- `launch`

Input:

```json
{
  "domain": "agent",
  "subject": "Maps Data Agent"
}
```

## `create_research_note`

Creates a research note under `data/research-notes`.

Required fields:

- `title`
- `topic`
- `summary`

Optional fields:

- `sources`
- `implications`

## `list_map_platform_files`

Lists readable source, config, and documentation files in `MAP_PLATFORM_ROOT`.

Input:

```json
{}
```

## `read_map_platform_file`

Reads one source/config/docs file from `MAP_PLATFORM_ROOT`.

Input:

```json
{
  "path": "backend/main.py"
}
```

The server blocks path escapes, large files, and unsupported binary file types.

## `get_map_platform_file_metadata`

Returns file size and `sha256` for a readable map-platform file. Use this before scoped writes.

Input:

```json
{
  "path": "geocoder/app.py"
}
```

## `search_map_platform`

Searches readable files in `MAP_PLATFORM_ROOT`.

Input:

```json
{
  "query": "geocode",
  "limit": 20
}
```

## `map_platform_git_status`

Returns short git status for `MAP_PLATFORM_ROOT`.

Input:

```json
{}
```

Output:

- Includes `capabilities` flags that reflect whether the current runtime can write to `MAP_PLATFORM_ROOT` and its `.git/` directory (helpful when finalization steps like `git fetch` or `git worktree remove` are blocked by sandbox permissions).

## `doctor_map_platform_verify`

Diagnoses common sandbox/readonly failures for `./scripts/verify.sh` and validates the latest exported sandbox-safe verification patch under `exports/map-platform/patches/`.

Use `dry_run` to see planned checks without running `git apply --check` (useful for smoke tests).

Input:

```json
{
  "patch_hint": "make-verify-sandbox-safe",
  "timeout_ms": 1500,
  "dry_run": true
}
```

Output:

- `summary.verify_script_supports_skip_frontend_build` indicates whether `SKIP_FRONTEND_BUILD=1 ./scripts/verify.sh` is supported.
- `patch_checks.applies_cleanly` / `patch_checks.reverse_applies_cleanly` mirrors `git apply --check` / `git apply --check --reverse` against the exported patch.
- `actions` includes the suggested patch-apply commands (in a writable environment) and the post-apply `SKIP_FRONTEND_BUILD=1` escape hatch.

## `doctor_map_platform_dev_interface`

Performs a quick QA pass against the local development UI stack (frontend/backend/geocoder/custom router/OSRM) to help diagnose common "Get Route" failures.

Use `dry_run` to see the planned checks without issuing network requests (useful for smoke tests).

Input:

```json
{
  "patch_hint": "fix-route-load-failed",
  "backend_url": "http://localhost:8000",
  "frontend_url": "http://localhost:3001",
  "geocoder_url": "http://localhost:8080",
  "custom_router_url": "http://localhost:8090",
  "osrm_url": "http://localhost:5001",
  "origin": "28.6139,77.2090",
  "destination": "28.6129,77.2295",
  "timeout_ms": 1500,
  "dry_run": true
}
```

Output:

- `summary` counts checks that are both HTTP-successful and not a JSON `{ "error": ... }` / `{ "detail": ... }` payload (and pass basic response-shape checks).
- `environment.can_listen_localhost` reports whether this runtime can bind a localhost listening socket (useful when the automation sandbox cannot start the dev stack itself).
- `repo_status.map_platform` includes a short `git status` snapshot for the configured `MAP_PLATFORM_ROOT`, including:
  - branch divergence (ahead/behind) plus recent commit summaries when the branch is ahead, and
  - `worktrees` from `git worktree list --porcelain` (useful for spotting stale/broken Codex worktrees), and
  - `capabilities` flags that indicate whether `.git/FETCH_HEAD` and `.git/worktrees/` are writable (useful for explaining why sync/push/worktree cleanup is blocked in some sandboxes).
- `checks` may include:
  - `extracted_error` for JSON error responses.
  - `contract_error` for HTTP-successful responses that are missing an expected shape (for example a route response missing `geometry`).
- When `dry_run=true`, `remediation_patch` shows the latest exported patch match (when present) under `exports/map-platform/patches/`.
- `actions` may include suggested remediation commands (for example applying an exported patch for known local-dev routing failures).

## `doctor_map_platform_place_contract`

Validates that the map-platform backend `/geocode` endpoint returns a non-empty `Place[]` response that matches the MVP contract (including accessibility metadata defaults).

Use `dry_run` to see the planned check without issuing network requests (useful for smoke tests).

Input:

```json
{
  "backend_url": "http://localhost:8000",
  "address": "Connaught Place, Delhi",
  "limit": 1,
  "timeout_ms": 1500,
  "dry_run": true
}
```

Output:

- `checks[0].missing_fields` and `checks[0].type_errors` explain contract mismatches.
- `actions` includes a repo-local `curl` command and a suggested backend start command.

## `create_map_platform_agent_task`

Creates a scoped map-platform task note under `data/map-platform-tasks`.

Input:

```json
{
  "title": "Define MVP place schema",
  "agent": "geo-data-agent",
  "objective": "Define the minimum place schema for local discovery and accessibility metadata.",
  "scope": ["Review backend and geocoder shape", "Propose schema fields"],
  "files_allowed": ["backend/", "geocoder/", "docs/"],
  "verification": ["Run backend tests when available"],
  "risks": ["Schema changes may affect frontend assumptions"]
}
```

## `create_map_platform_patch_proposal`

Creates a reviewable patch proposal under `data/map-platform-patch-proposals`.

This tool does not edit the `map_platform` repository. It records proposed changes for review.

Input:

```json
{
  "title": "Add MVP place schema",
  "task_path": "map-platform-tasks/2026-04-25-define-mvp-place-schema.md",
  "agent": "geo-data-agent",
  "summary": "Introduce a place schema covering local discovery, landmark aliases, provenance, confidence, and accessibility review state.",
  "target_files": ["backend/main.py", "geocoder/app.py", "frontend/src/App.jsx"],
  "proposed_changes": [
    {
      "file": "backend/main.py",
      "change": "Add Pydantic models for Place, Coordinates, Provenance, and AccessibilityMetadata.",
      "rationale": "The backend needs a stable place contract before frontend and geocoder features expand."
    }
  ],
  "patch": "# Optional unified diff goes here",
  "verification": ["Run backend tests", "Run frontend build"],
  "risks": ["Frontend may depend on current response shape"],
  "rollback": "Do not merge the implementation patch; no repository files are modified by this proposal."
}
```

## `list_map_platform_patch_proposals`

Lists reviewable map-platform patch proposals.

Input:

```json
{}
```

## `read_map_platform_patch_proposal`

Reads one map-platform patch proposal.

Input:

```json
{
  "path": "map-platform-patch-proposals/2026-04-25-example.md"
}
```

## `create_map_platform_change_request`

Creates an approved scope artifact required by `write_map_platform_file`.

Input:

```json
{
  "title": "Implement MVP place contract",
  "proposal_path": "map-platform-patch-proposals/2026-04-25-add-mvp-place-contract.md",
  "agent": "geo-data-agent",
  "objective": "Implement the accepted Place contract while preserving route compatibility.",
  "allowed_files": ["geocoder/app.py", "backend/routers/geocode.py", "frontend/src/components/SearchBar.jsx", "README.md"],
  "verification": ["./scripts/verify.sh"],
  "approval_note": "Approved by project owner for supervised implementation."
}
```

## `write_map_platform_file`

Writes a complete text file in `MAP_PLATFORM_ROOT`.

Requirements:

- Server must be started with `MAP_PLATFORM_WRITE_ENABLED=true`.
- `change_request_path` must point to a workspace markdown change request.
- Target file or directory must be listed under the change request's `Allowed Files`.
- `expected_sha256` must match the current file hash.

Input:

```json
{
  "path": "geocoder/app.py",
  "content": "complete new file content",
  "expected_sha256": "current-file-sha256",
  "change_request_path": "map-platform-change-requests/2026-04-25-implement-mvp-place-contract.md",
  "approval_note": "Approved supervised write."
}
```

## `record_map_platform_implementation_result`

Records verification results after implementation.

Input:

```json
{
  "title": "MVP place contract implementation",
  "change_request_path": "map-platform-change-requests/2026-04-25-implement-mvp-place-contract.md",
  "changed_files": ["geocoder/app.py", "frontend/src/components/SearchBar.jsx"],
  "commands_run": ["./scripts/verify.sh"],
  "result": "passed",
  "notes": "Python compile and frontend build passed.",
  "residual_risks": ["API smoke test still requires running services."]
}
```

## `record_agent_run`

Records which agent role ran during an automation/manual cycle.

Input:

```json
{
  "agent": "routing-tiles-agent",
  "automation_id": "map-platform-daily-agent-loop",
  "product": "map-platform",
  "summary": "Implemented custom router phase 1.",
  "inputs_read": ["docs/daily_agent_operating_model.md", "data/map-platform-tasks/..."],
  "tasks_considered": ["custom router phase 1"],
  "changes_made": ["Added custom_router service"],
  "artifacts_written": ["data/map-platform-implementation-results/..."],
  "verification": ["./scripts/verify.sh passed"],
  "deferred": ["OSM PBF parsing"],
  "blockers": [],
  "next_recommended_agent": "routing-tiles-agent",
  "status": "completed"
}
```

## `list_agent_runs`

Lists agent run logs.

Input:

```json
{}
```

## `read_agent_run`

Reads one agent run log.

Input:

```json
{
  "path": "agent-runs/2026-04-25T19-00-routing-tiles-agent.md"
}
```
