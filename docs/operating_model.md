# Operating Model

## Intended Use

Use this server as the memory and review layer for future agents.

Recommended first consumers:

1. Product strategy agent.
2. Maps/local-intelligence planning agent.
3. Accessibility planning agent.
4. Architecture review agent.

## Workflow

1. Read relevant strategy docs through MCP resources.
2. Search the strategy pack for constraints and prior thinking.
3. Create or update product briefs.
4. Create agent specs before implementing new agents.
5. Record major decisions.
6. Run checklists before implementation, launch, or production access.

## Review Discipline

Any agent created for a product line should have an agent spec before it receives tools.

Minimum fields:

- purpose;
- product line;
- allowed tools;
- forbidden actions;
- required human approvals;
- evaluation metrics.

## Promotion Path

This server can later become hosted. Before hosting it:

- add authentication;
- add authorization per tool;
- add append-only audit events;
- add backup policy;
- decide whether generated artifacts remain files or move to a database.
