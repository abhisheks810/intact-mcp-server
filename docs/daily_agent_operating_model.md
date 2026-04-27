# Daily Agent Operating Model

## Goal

Run a repeatable development process across map platform first, then every future product/service:

- agents work during a bounded daily window;
- agents run multiple internal iterations per hour;
- development output is visible in a testable UI;
- every day ends with a short report PDF;
- user feedback becomes tomorrow's input;
- deployment remains limited to development/preview environments until production controls exist.

## Daily Window

Default development window:

- Development runs all day except the quiet window.
- Quiet window: 2:00 AM ET to 7:00 AM ET.
- Active hours: 12:00 AM-1:59 AM ET and 7:00 AM-11:59 PM ET.
- Agents run at least 3 internal iterations per hour: minute 0, 20, and 40.
- This is implemented as three separate hourly automations for reliability:
  - `map-platform-daily-agent-loop` at minute 0.
  - `map-platform-daily-agent-loop-20` at minute 20.
  - `map-platform-daily-agent-loop-40` at minute 40.
- Each development automation calls the self-hosted runner first:
  - `/Users/abhisheksrivastava/intact-agent-runner`
  - command: `npm run run:map`
- Each iteration should use the latest strategy docs, product docs, feedback, open tasks, agent run logs, and implementation results.
- If a task is blocked, record the blocker and pick another unblocked task.
- Routine progress should be written to artifacts, not surfaced to the user during the day.
- The user-facing summary remains the 10 PM daily report.

## Roles

| Role | Responsibility |
| --- | --- |
| Product Strategist Agent | Chooses tasks aligned with organisation strategy and latest feedback. |
| Implementation Agent | Implements scoped changes from accepted proposals/change requests. |
| QA Agent | Runs verification, checks UI/dev app state, records blockers. |
| Report Agent | Produces end-of-day markdown and PDF status reports. |

## Required Inputs

Each daily cycle should read:

- organisation strategy docs;
- product-specific docs;
- current task queue;
- patch proposals;
- change requests;
- implementation results;
- agent run logs;
- user feedback from the prior evening;
- git status for affected repos.

## Required Outputs

Each daily workday should produce:

- agent run logs;
- implementation result records;
- updated task/proposal/change request artifacts;
- updated deployed/dev UI state;
- end-of-day report markdown;
- end-of-day report PDF.

Each iteration should produce at minimum:

- one agent run log;
- any task/proposal/change-result artifacts needed to preserve context;
- verification notes when code or behavior changed.

## Deployment Policy

Until production infrastructure is explicitly defined:

- "deploy" means dev/preview deployment only;
- production credentials must not be available to agents;
- every production-impacting action requires explicit human approval;
- agents must record rollback instructions for any deployable change.

## Feedback Loop

The user reviews the dev UI after 10 PM ET and updates:

```text
data/user-feedback/map-platform-feedback.md
```

Next-day agents must treat this file as a primary input.

The user does not need to inspect routine intra-day logs unless debugging the automation. The 10 PM report is the normal control surface for strategy steering.

## Agent Run Logging

Every automation cycle must record an agent run under:

```text
data/agent-runs/
```

Each run must state:

- which agent role ran;
- which automation triggered it;
- what it read;
- what tasks it considered;
- what it changed;
- what artifacts it wrote;
- what it verified;
- what it deferred;
- what blocked it.

This is the audit layer that makes role-based agents visible even though Codex automation is the actual runner.

The self-hosted runner now writes agent-run logs directly. In the current no-key mode it selects the agent role and records planned work. Once an LLM provider is configured, it can become the primary execution host for individual deep agents.

## Cross-Product Standard

Every future product should use the same pattern:

```text
strategy
-> product docs
-> feedback
-> task
-> patch proposal
-> change request
-> implementation
-> verification
-> dev deployment
-> daily report
-> user feedback
```
