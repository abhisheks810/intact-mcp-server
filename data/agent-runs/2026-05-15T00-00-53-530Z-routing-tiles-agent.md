# Agent Run: routing-tiles-agent

Created: 2026-05-15T00:00:53.531047Z
Agent: routing-tiles-agent
Automation: intact-agent-runner-launchd-map-platform
Product: map-platform
Status: completed
Next recommended agent: routing-tiles-agent

## Summary

Completed the scoped docs task by updating router/README.md with a backend mode verification subsection, then recorded the implementation result. No further action is needed for this task.

## Inputs Read

- host_strategy README.md and docs/
- data/agent-specs/map-platform/
- data/map-platform-tasks/
- data/map-platform-patch-proposals/
- data/map-platform-implementation-results/
- data/agent-runs/
- data/user-feedback/
- git status for all allowed repos
- canonical loop preflight
- intact-mcp-server stdio tools

## Tasks Considered

- 2026-04-25-fix-route-load-failed.md
- 2026-04-25-define-mvp-place-schema.md
- 2026-04-26-improve-dev-interface-route-remediation.md
- 2026-04-26-dev-interface-doctor-dynamic-patch-selection.md
- 2026-04-25-custom-router-phase-1.md
- 2026-04-27-search-quality-v2-next-loop.md
- 2026-04-26-make-verify-sandbox-safe.md
- 2026-04-25-place-detail-panel.md

## Changes Made

- router/README.md

## Artifacts Written

- Agent-run artifact pending
- Implementation-result artifact pending

## Verification

- $ bash ./scripts/loop-preflight.sh --require-clean
cwd: /Users/abhisheksrivastava/map_platform
exit: 0
stdout:
-- DNS check (github.com)
OK
-- Git remote auth/connectivity check
OK
-- Canonical repo cleanliness check
OK
Preflight checks passed.
- Tool-loop actions:
- [
  {
    "action": {
      "tool": "read_map_platform_file",
      "args": {
        "path": "router/README.md"
      },
      "reason": "Inspect the current router troubleshooting/docs state to choose a small custom-routing reliability improvement aligned with the routing agent priority and recent README-focused tasks."
    }
  },
  {
    "tool_result": {
      "tool": "read_map_platform_file",
      "ok": true,
      "output": "# Router Local Verification\n\nThis document captures the minimum local checks for route service reliability during development.\n\n## Purpose\n\n- Confirm the routing service is reachable before testing the UI.\n- Make route failure modes easier to diagnose.\n- Provide a fallback checklist when the UI shows `load failed`.\n\n## Default local assumptions\n\nUnless your local setup intentionally overrides them, use these assumptions while debugging:\n\n- The router is expected to be reachable at `http://localhost:5001` when the backend is configured to use OSRM.\n- The default non-Docker local development flow uses the internal custom router at `http://localhost:8090`.\n- The backend usually remains the UI entry point at `http://localhost:8000`, even when it forwards route requests to OSRM or the custom router.\n- The UI should call the same backend and router mode that you validated with curl.\n- A mismatch between the UI target port and the running router port can appear in the browser as a generic `load failed` error.\n- The recommended non-Docker local development flow defaults to the internal custom router (`ROUTER_PROVIDER=intact`) rather than OSRM.\n\nIf your environment uses a different port, update the curl commands and verify the browser request matches that override exactly.\n\n## Choose the router mode first\n\nBefore debugging a route failure, confirm which router implementation your backend is using:\n\n- Non-Docker local development defaults to the internal custom router at `http://localhost:8090`.\n- OSRM debugging only applies when you intentionally start the backend with `ROUTER_PROVIDER=osrm`.\n- The browser may still call the backend `/route` endpoint rather than calling the router service directly.\n- If you are unsure which local services should be running, see `docs/development_interface.md`.\n\nTo force OSRM in local development:\n\n```bash\nROUTER_PROVIDER=osrm ./scripts/start-backend.sh\n```\n\nTo explicitly use the internal custom router instead:\n\n```bash\nROUTER_PROVIDER=intact ./scripts/start-backend.sh\n```\n\n## Match checks to the active router\n\nUse the endpoint that matches the backend mode for your session:\n\n- For `ROUTER_PROVIDER=intact`, verify the custom router at `http://localhost:8090`.\n- For `ROUTER_PROVIDER=osrm`, verify OSRM at `http://localhost:5001`.\n- Verify the backend `/route` endpoint at `http://localhost:8000/route` after the router-specific curl succeeds.\n- Do not treat a healthy OSRM process as proof that the UI is wired correctly if the backend is still using the custom router.\n- Do not treat a healthy custom-router process as proof that the browser is targeting the backend URL you expect.\n\nA quick way to avoid false negatives is to first confirm the backend mode, then run curl against that exact router host and port, then confirm the backend `/route` path also works.\n\n## Health checks\n\nVerify the route service is listening on the expected local port before opening the app UI.\n\n### Basic HTTP reachability\n\nFor OSRM mode:\n\n```bash\ncurl -i http://localhost:5001/\n```\n\nFor custom-router mode:\n\n```bash\ncurl -i http://localhost:8090/\n```\n\nExpected result:\n\n- Any non-network response confirms the process is reachable.\n- Connection refused or timeout means the router is not available to the UI.\n\n### Route API contract smoke test\n\nUse a simple request against the route endpoint with origin and destination coordinates.\n\nFor OSRM mode:\n\n```bash\ncurl -s \"http://localhost:5001/route?origin=77.5946,12.9716&destination=77.6097,12.9601\"\n```\n\nFor custom-router mode:\n\n```bash\ncurl -s \"http://localhost:8090/route?origin=77.5946,12.9716&destination=77.6097,12.9601\"\n```\n\nExpected result:\n\n- HTTP 200.\n- JSON response.\n- A route payload with coordinates, geometry, or steps depending on the active implementation.\n\nIf the service returns a structured error, the router is reachable and the issue is likely request formatting or data coverage rather than a full service outage.\n\n### Backend forwarding smoke test\n\nAfter the router-specific curl passes, verify the backend route endpoint that the UI typically uses:\n\n```bash\ncurl -s \"http://localhost:8000/route?origin=77.5946,12.9716&destination=77.6097,12.9601\"\n```\n\nExpected result:\n\n- HTTP 200 when the backend and active router agree on the mode and target port.\n- JSON response from the backend route contract.\n\nInterpretation:\n\n- If the router curl succeeds but the backend `/route` curl fails, the issue is likely backend configuration, provider selection, or a router host/port mismatch.\n- If the backend `/route` curl succeeds but the UI still fails, the issue is more likely in frontend request wiring, browser environment, or client-side error handling.\n- If both router and backend curls fail, focus first on local process startup and service reachability.\n\n## Automated diagnosis\n\nIf you are not sure whether the failure is caused by the frontend, backend, or router process, run the repo-local doctor first:\n\n```bash\n./scripts/doctor-dev-interface.sh\n```\n\nUse the doctor script before deeper manual debugging when:\n\n- the browser shows a generic `load failed` or network error,\n- you are unsure whether localhost services are actually up, or\n- you want a quick check of the backend `/route` path in the expected local configuration.\n\n## Browser network inspection\n\nIf curl succeeds but the UI still reports `load failed`, inspect the browser network request directly:\n\n1. Open developer tools and go to the **Network** tab.\n2. Press **Get Route** in the UI.\n3. Find the request to the route endpoint.\n4. Confirm the request URL uses the expected host, port, path, and query parameter names.\n5. Compare the browser response status or network error with the curl result.\n\nUseful signals:\n\n- No request in the network panel usually means the UI action did not trigger the API call.\n- A browser request to `localhost:5001` or `localhost:8090` instead of `localhost:8000` can indicate a frontend configuration mismatch for your session.\n- `ERR_CONNECTION_REFUSED`, timeout, or CORS-style browser errors usually indicate environment or connectivity issues rather than bad route data.\n- A visible HTTP error response means the router is reachable and returned a debuggable failure.\n\n## UI failure-mode checklist\n\nIf the development UI reports `load failed` after pressing **Get Route**:\n\n1. Confirm the browser request is targeting the expected route service host and port.\n2. Confirm the backend is using the router implementation you expect for this session.\n3. Run the curl checks above against the active router mode, not just OSRM by habit.\n4. Run the backend `/route` smoke test to confirm backend forwarding matches the router you validated directly.\n5. Run `./scripts/doctor-dev-interface.sh` to check the broader local stack.\n6. Verify origin and destination were both resolved to coordinates, not just label strings.\n7. Compare the UI request query parameter names with the route API contract.\n8. Check whether the selected coordinates are inside the local graph or extract coverage area.\n\n## Fallback behavior expectation\n\nThe preferred debugging sequence is:\n\n1. Distinguish router unavailable from router returned error.\n2. Confirm the backend `/route` path can forward to the active router.\n3. Surface actionable logs in the API or browser console.\n4. Preserve the resolved place inputs so a user can retry without retyping.\n\n## Suggested manual QA script\n\n1. Confirm whether the backend should be using OSRM or the internal custom router.\n2. Start the local routing service that matches that mode.\n3. Run the reachability check for the matching router port.\n4. Run the route API smoke test for the matching router port.\n5. Run the backend `/route` smoke test.\n6. Open the development UI.\n7. Trigger **Get Route** and inspect the browser network request if the UI still fails.\n8. Run the doctor script if the failure crosses frontend, backend, and router boundaries.\n",
      "data": "# Router Local Verification\n\nThis document captures the minimum local checks for route service reliability during development.\n\n## Purpose\n\n- Confirm the routing service is reachable before testing the UI.\n- Make route failure modes easier to diagnose.\n- Provide a fallback checklist when the UI shows `load failed`.\n\n## Default local assumptions\n\nUnless your local setup intentionally overrides them, use these assumptions while debugging:\n\n- The router is expected to be reachable at `http://localhost:5001` when the backend is configured to use OSRM.\n- The default non-Docker local development flow uses the internal custom router at `http://localhost:8090`.\n- The backend usually remains the UI entry point at `http://localhost:8000`, even when it forwards route requests to OSRM or the custom router.\n- The UI should call the same backend and router mode that you validated with curl.\n- A mismatch between the UI target port and the running router port can appear in the browser as a generic `load failed` error.\n- The recommended non-Docker local development flow defaults to the internal custom router (`ROUTER_PROVIDER=intact`) rather than OSRM.\n\nIf your environment uses a different port, update the curl commands and verify the browser request matches that override exactly.\n\n## Choose the router mode first\n\nBefore debugging a route failure, confirm which router implementation your backend is using:\n\n- Non-Docker local development defaults to the internal custom router at `http://localhost:8090`.\n- OSRM debugging only applies when you intentionally start the backend with `ROUTER_PROVIDER=osrm`.\n- The browser may still call the backend `/route` endpoint rather than calling the router service directly.\n- If you are unsure which local services should be running, see `docs/development_interface.md`.\n\nTo force OSRM in local development:\n\n```bash\nROUTER_PROVIDER=osrm ./scripts/start-backend.sh\n```\n\nTo explicitly use the internal custom router instead:\n\n```bash\nROUTER_PROVIDER=intact ./scripts/start-backend.sh\n```\n\n## Match checks to the active router\n\nUse the endpoint that matches the backend mode for your session:\n\n- For `ROUTER_PROVIDER=intact`, verify the custom router at `http://localhost:8090`.\n- For `ROUTER_PROVIDER=osrm`, verify OSRM at `http://localhost:5001`.\n- Verify the backend `/route` endpoint at `http://localhost:8000/route` after the router-specific curl succeeds.\n- Do not treat a healthy OSRM process as proof that the UI is wired correctly if the backend is still using the custom router.\n- Do not treat a healthy custom-router process as proof that the browser is targeting the backend URL you expect.\n\nA quick way to avoid false negatives is to first confirm the backend mode, then run curl against that exact router host and port, then confirm the backend `/route` path also works.\n\n## Health checks\n\nVerify the route service is listening on the expected local port before opening the app UI.\n\n### Basic HTTP reachability\n\nFor OSRM mode:\n\n```bash\ncurl -i http://localhost:5001/\n```\n\nFor custom-router mode:\n\n```bash\ncurl -i http://localhost:8090/\n```\n\nExpected result:\n\n- Any non-network response confirms the process is reachable.\n- Connection refused or timeout means the router is not available to the UI.\n\n### Route API contract smoke test\n\nUse a simple request against the route endpoint with origin and destination coordinates.\n\nFor OSRM mode:\n\n```bash\ncurl -s \"http://localhost:5001/route?origin=77.5946,12.9716&destination=77.6097,12.9601\"\n```\n\nFor custom-router mode:\n\n```bash\ncurl -s \"http://localhost:8090/route?origin=77.5946,12.9716&destination=77.6097,12.9601\"\n```\n\nExpected result:\n\n- HTTP 200.\n- JSON response.\n- A route payload with coordinates, geometry, or steps depending on the active implementation.\n\nIf the service returns a structured error, the router is reachable and the issue is likely request formatting or data coverage rather than a full service outage.\n\n### Backend forwarding smoke test\n\nAfter the router-specific curl passes, verify the backend route endpoint that the UI typically uses:\n\n```bash\ncurl -s \"http://localhost:8000/route?origin=77.5946,12.9716&destination=77.6097,12.9601\"\n```\n\nExpected result:\n\n- HTTP 200 when the backend and active router agree on the mode and target port.\n- JSON response from the backend route contract.\n\nInterpretation:\n\n- If the router curl succeeds but the backend `/route` curl fails, the issue is likely backend configuration, provider selection, or a router host/port mismatch.\n- If the backend `/route` curl succeeds but the UI still fails, the issue is more likely in frontend request wiring, browser environment, or client-side error handling.\n- If both router and backend curls fail, focus first on local process startup and service reachability.\n\n## Automated diagnosis\n\nIf you are not sure whether the failure is caused by the frontend, backend, or router process, run the repo-local doctor first:\n\n```bash\n./scripts/doctor-dev-interface.sh\n```\n\nUse the doctor script before deeper manual debugging when:\n\n- the browser shows a generic `load failed` or network error,\n- you are unsure whether localhost services are actually up, or\n- you want a quick check of the backend `/route` path in the expected local configuration.\n\n## Browser network inspection\n\nIf curl succeeds but the UI still reports `load failed`, inspect the browser network request directly:\n\n1. Open developer tools and go to the **Network** tab.\n2. Press **Get Route** in the UI.\n3. Find the request to the route endpoint.\n4. Confirm the request URL uses the expected host, port, path, and query parameter names.\n5. Compare the browser response status or network error with the curl result.\n\nUseful signals:\n\n- No request in the network panel usually means the UI action did not trigger the API call.\n- A browser request to `localhost:5001` or `localhost:8090` instead of `localhost:8000` can indicate a frontend configuration mismatch for your session.\n- `ERR_CONNECTION_REFUSED`, timeout, or CORS-style browser errors usually indicate environment or connectivity issues rather than bad route data.\n- A visible HTTP error response means the router is reachable and returned a debuggable failure.\n\n## UI failure-mode checklist\n\nIf the development UI reports `load failed` after pressing **Get Route**:\n\n1. Confirm the browser request is targeting the expected route service host and port.\n2. Confirm the backend is using the router implementation you expect for this session.\n3. Run the curl checks above against the active router mode, not just OSRM by habit.\n4. Run the backend `/route` smoke test to confirm backend forwarding matches the router you validated directly.\n5. Run `./scripts/doctor-dev-interface.sh` to check the broader local stack.\n6. Verify origin and destination were both resolved to coordinates, not just label strings.\n7. Compare the UI request query parameter names with the route API contract.\n8. Check whether the selected coordinates are inside the local graph or extract coverage area.\n\n## Fallback behavior expectation\n\nThe preferred debugging sequence is:\n\n1. Distinguish router unavailable from router returned error.\n2. Confirm the backend `/route` path can forward to the active router.\n3. Surface actionable logs in the API or browser console.\n4. Preserve the resolved place inputs so a user can retry without retyping.\n\n## Suggested manual QA script\n\n1. Confirm whether the backend should be using OSRM or the internal custom router.\n2. Start the local routing service that matches that mode.\n3. Run the reachability check for the matching router port.\n4. Run the route API smoke test for the matching router port.\n5. Run the backend `/route` smoke test.\n6. Open the development UI.\n7. Trigger **Get Route** and inspect the browser network request if the UI still fails.\n8. Run the doctor script if the failure crosses frontend, backend, and router boundaries.\n"
    }
  },
  {
    "action": {
      "tool": "create_map_platform_change_request",
      "args": {
        "title": "Clarify router README with backend mode verification step",
        "agent": "routing-tiles-agent",
        "objective": "Make local routing troubleshooting more reliable by documenting how to confirm the backend router provider before running curl checks.",
        "allowed_files": [
          "router/README.md"
        ],
        "verification": [
          "Review router/README.md for a concise backend mode verification subsection aligned with existing local verification guidance."
        ],
        "approval_note": "Scoped docs-only clarification in router/README.md to reduce false-negative local route debugging."
      },
      "reason": "Need an approved scoped change request before writing the README, and this is a small commit-worthy documentation improvement aligned with the routing reliability task."
    }
  },
  {
    "tool_result": {
      "tool": "create_map_platform_change_request",
      "ok": true,
      "output": "{\n  \"created\": \"/Users/abhisheksrivastava/intact-mcp-server/data/map-platform-change-requests/2026-05-15T00-00-18-523Z-clarify-router-readme-with-backend-mode-verification-step.md\",\n  \"path\": \"map-platform-change-requests/2026-05-15T00-00-18-523Z-clarify-router-readme-with-backend-mode-verification-step.md\",\n  \"status\": \"approved-for-scoped-work\"\n}",
      "data": {
        "created": "/Users/abhisheksrivastava/intact-mcp-server/data/map-platform-change-requests/2026-05-15T00-00-18-523Z-clarify-router-readme-with-backend-mode-verification-step.md",
        "path": "map-platform-change-requests/2026-05-15T00-00-18-523Z-clarify-router-readme-with-backend-mode-verification-step.md",
        "status": "approved-for-scoped-work"
      }
    }
  },
  {
    "action": {
      "tool": "get_map_platform_file_metadata",
      "args": {
        "path": "router/README.md"
      },
      "reason": "Need current sha256 for existing router/README.md before making the scoped documentation update approved in the change request."
    }
  },
  {
    "tool_result": {
      "tool": "get_map_platform_file_metadata",
      "ok": true,
      "output": "{\n  \"path\": \"router/README.md\",\n  \"bytes\": 7891,\n  \"sha256\": \"ef8cd6a96327eb933540c8bf418b02e63477bdaeba32fc412f0e611a0e4e78fd\"\n}",
      "data": {
        "path": "router/README.md",
        "bytes": 7891,
        "sha256": "ef8cd6a96327eb933540c8bf418b02e63477bdaeba32fc412f0e611a0e4e78fd"
      }
    }
  },
  {
    "action": {
      "tool": "write_map_platform_file",
      "args": {
        "path": "router/README.md",
        "expected_sha256": "ef8cd6a96327eb933540c8bf418b02e63477bdaeba32fc412f0e611a0e4e78fd",
        "change_request_path": "map-platform-change-requests/2026-05-15T00-00-18-523Z-clarify-router-readme-with-backend-mode-verification-step.md",
        "approval_note": "Scoped docs-only clarification in router/README.md to reduce false-negative local route debugging.",
        "content": "# Router Local Verification\n\nThis document captures the minimum local checks for route service reliability during development.\n\n## Purpose\n\n- Confirm the routing service is reachable before testing the UI.\n- Make route failure modes easier to diagnose.\n- Provide a fallback checklist when the UI shows `load failed`.\n\
- Generated diff:
- diff --git a/router/README.md b/router/README.md
index 9f5b3b7..d134e54 100644
--- a/router/README.md
+++ b/router/README.md
@@ -30,6 +30,17 @@ Before debugging a route failure, confirm which router implementation your backe
 - The browser may still call the backend `/route` endpoint rather than calling the router service directly.
 - If you are unsure which local services should be running, see `docs/development_interface.md`.

+### Verify the backend mode you actually started
+
+Before trusting any router curl result, verify the backend startup mode you launched for this session:
+
+- Check the shell command, terminal history, or launch script you used to start the backend.
+- If you did not explicitly set `ROUTER_PROVIDER=osrm`, assume local development is using `ROUTER_PROVIDER=intact`.
+- Re-check the backend logs or startup output after a restart so you do not debug a stale assumption.
+- If the browser, backend, and router checks disagree, treat the backend provider selection as the source of truth for which router port should answer.
+
+This step helps avoid a common false negative: validating OSRM on `localhost:5001` even though the backend is still forwarding requests to the custom router on `localhost:8090`.
+
 To force OSRM in local development:

 ```bash

- Raw model responses:
- {"tool":"read_map_platform_file","args":{"path":"router/README.md"},"reason":"Inspect the current router troubleshooting/docs state to choose a small custom-routing reliability improvement aligned with the routing agent priority and recent README-focused tasks."}
---
{"tool":"create_map_platform_change_request","args":{"title":"Clarify router README with backend mode verification step","agent":"routing-tiles-agent","objective":"Make local routing troubleshooting more reliable by documenting how to confirm the backend router provider before running curl checks.","allowed_files":["router/README.md"],"verification":["Review router/README.md for a concise backend mode verification subsection aligned with existing local verification guidance."],"approval_note":"Scoped docs-only clarification in router/README.md to reduce false-negative local route debugging."},"reason":"Need an approved scoped change request before writing the README, and this is a small commit-worthy documentation improvement aligned with the routing reliability task."}
{"tool":"create_map_platform_change_request","args":{"title":"Clarify router README with backend mode verification step","agent":"routing-tiles-agent","objective":"Make local routing troubleshooting more reliable by documenting how to confirm the backend router provider before running curl checks.","allowed_files":["router/README.md"],"verification":["Review router/README.md for a concise backend mode verification subsection aligned with existing local verification guidance."],"approval_note":"Scoped docs-only clarification in router/README.md to reduce false-negative local route debugging."},"reason":"Need an approved scoped change request before writing the README, and this is a small commit-worthy documentation improvement aligned with the routing reliability task."}
---
{"tool":"get_map_platform_file_metadata","args":{"path":"router/README.md"},"reason":"Need current sha256 for existing router/README.md before making the scoped documentation update approved in the change request."}
{"tool":"get_map_platform_file_metadata","args":{"path":"router/README.md"},"reason":"Need current sha256 for existing router/README.md before making the scoped documentation update approved in the change request."}
---
{"tool":"write_map_platform_file","args":{"path":"router/README.md","expected_sha256":"ef8cd6a96327eb933540c8bf418b02e63477bdaeba32fc412f0e611a0e4e78fd","change_request_path":"map-platform-change-requests/2026-05-15T00-00-18-523Z-clarify-router-readme-with-backend-mode-verification-step.md","approval_note":"Scoped docs-only clarification in router/README.md to reduce false-negative local route debugging.","content":"# Router Local Verification\n\nThis document captures the minimum local checks for route service reliability during development.\n\n## Purpose\n\n- Confirm the routing service is reachable before testing the UI.\n- Make route failure modes easier to diagnose.\n- Provide a fallback checklist when the UI shows `load failed`.\n\n## Default local assumptions\n\nUnless your local setup intentionally overrides them, use these assumptions while debugging:\n\n- The router is expected to be reachable at `http://localhost:5001` when the backend is configured to use OSRM.\n- The default non-Docker local development flow uses the internal custom router at `http://localhost:8090`.\n- The backend usually remains the UI entry point at `http://localhost:8000`, even when it forwards route requests to OSRM or the custom router.\n- The UI should call the same backend and router mode that you validated with curl.\n- A mismatch between the UI target port and the running router port can appear in the browser as a generic `load failed` error.\n- The recommended non-Docker local development flow defaults to the internal custom router (`ROUTER_PROVIDER=intact`) rather than OSRM.\n\nIf your environment uses a different port, update the curl commands and verify the browser request matches that override exactly.\n\n## Choose the router mode first\n\nBefore debugging a route failure, confirm which router implementation your backend is using:\n\n- Non-Docker local development defaults to the internal custom router at `http://localhost:8090`.\n- OSRM debugging only applies when you intentionally start the backend with `ROUTER_PROVIDER=osrm`.\n- The browser may still call the backend `/route` endpoint rather than calling the router service directly.\n- If you are unsure which local services should be running, see `docs/development_interface.md`.\n\n### Verify the backend mode you actually started\n\nBefore trusting any router curl result, verify the backend startup mode you launched for this session:\n\n- Check the shell command, terminal history, or launch script you used to start the backend.\n- If you did not explicitly set `ROUTER_PROVIDER=osrm`, assume local development is using `ROUTER_PROVIDER=intact`.\n- Re-check the backend logs or startup output after a restart so you do not debug a stale assumption.\n- If the browser, backend, and router checks disagree, treat the backend provider selection as the source of truth for which router port should answer.\n\nThis step helps avoid a common false negative: validating OSRM on `localhost:5001` even though the backend is still forwarding requests to the custom router on `localhost:8090`.\n\nTo force OSRM in local development:\n\n```bash\nROUTER_PROVIDER=osrm ./scripts/start-backend.sh\n```\n\nTo explicitly use the internal custom router instead:\n\n```bash\nROUTER_PROVIDER=intact ./scripts/start-backend.sh\n```\n\n## Match checks to the active router\n\nUse the endpoint that matches the backend mode for your session:\n\n- For `ROUTER_PROVIDER=intact`, verify the custom router at `http://localhost:8090`.\n- For `ROUTER_PROVIDER=osrm`, verify OSRM at `http://localhost:5001`.\n- Verify the backend `/route` endpoint at `http://localhost:8000/route` after the router-specific curl succeeds.\n- Do not treat a healthy OSRM process as proof that the UI is wired correctly if the backend is still using the custom router.\n- Do not treat a healthy custom-router process as proof that the browser is targeting the backend URL you expect.\n\nA quick way to avoid false negatives is to first confirm the backend mode, then run curl against that exact router host and port, then confirm the backend `/route` path also works.\n\n## Health checks\n\nVerify the route service is listening on the expected local port before opening the app UI.\n\n### Basic HTTP reachability\n\nFor OSRM mode:\n\n```bash\ncurl -i http://localhost:5001/\n```\n\nFor custom-router mode:\n\n```bash\ncurl -i http://localhost:8090/\n```\n\nExpected result:\n\n- Any non-network response confirms the process is reachable.\n- Connection refused or timeout means the router is not available to the UI.\n\n### Route API contract smoke test\n\nUse a simple request against the route endpoint with origin and destination coordinates.\n\nFor OSRM mode:\n\n```bash\ncurl -s \"http://localhost:5001/route?origin=77.5946,12.9716&destination=77.6097,12.9601\"\n```\n\nFor custom-router mode:\n\n```bash\ncurl -s \"http://localhost:8090/route?origin=77.5946,12.9716&destination=77.6097,12.9601\"\n```\n\nExpected result:\n\n- HTTP 200.\n- JSON response.\n- A route payload with coordinates, geometry, or steps depending on the active implementation.\n\nIf the service returns a structured error, the router is reachable and the issue is likely request formatting or data coverage rather than a full service outage.\n\n### Backend forwarding smoke test\n\nAfter the router-specific curl passes, verify the backend route endpoint that the UI typically uses:\n\n```bash\ncurl -s \"http://localhost:8000/route?origin=77.5946,12.9716&destination=77.6097,12.9601\"\n```\n\nExpected result:\n\n- HTTP 200 when the backend and active router agree on the mode and target port.\n- JSON response from the backend route contract.\n\nInterpretation:\n\n- If the router curl succeeds but the backend `/route` curl fails, the issue is likely backend configuration, provider selection, or a router host/port mismatch.\n- If the backend `/route` curl succeeds but the UI still fails, the issue is more likely in frontend request wiring, browser environment, or client-side error handling.\n- If both router and backend curls fail, focus first on local process startup and service reachability.\n\n## Automated diagnosis\n\nIf you are not sure whether the failure is caused by the frontend, backend, or router process, run the repo-local doctor first:\n\n```bash\n./scripts/doctor-dev-interface.sh\n```\n\nUse the doctor script before deeper manual debugging when:\n\n- the browser shows a generic `load failed` or network error,\n- you are unsure whether localhost services are actually up, or\n- you want a quick check of the backend `/route` path in the expected local configuration.\n\n## Browser network inspection\n\nIf curl succeeds but the UI still reports `load failed`, inspect the browser network request directly:\n\n1. Open developer tools and go to the **Network** tab.\n2. Press **Get Route** in the UI.\n3. Find the request to the route endpoint.\n4. Confirm the request URL uses the expected host, port, path, and query parameter names.\n5. Compare the browser response status or network error with the curl result.\n\nUseful signals:\n\n- No request in the network panel usually means the UI action did not trigger the API call.\n- A browser request to `localhost:5001` or `localhost:8090` instead of `localhost:8000` can indicate a frontend configuration mismatch for your session.\n- `ERR_CONNECTION_REFUSED`, timeout, or CORS-style browser errors usually indicate environment or connectivity issues rather than bad route data.\n- A visible HTTP error response means the router is reachable and returned a debuggable failure.\n\n## UI failure-mode checklist\n\nIf the development UI reports `load failed` after pressing **Get Route**:\n\n1. Confirm the browser request is targeting the expected route service host and port.\n2. Confirm the backend is using the router implementation you expect for this session.\n3. Run the curl checks above against the active router mode, not just OSRM by habit.\n4. Run the backend `/route` smoke test to confirm backend forwarding matches the router you validated directly.\n5. Run `./scripts/doctor-dev-interface.sh` to check the broader local stack.\n6. Verify origin and destination were both resolved to coordinates, not just label strings.\n7. Compare the UI request query parameter names with the route API contract.\n8. Check whether the selected coordinates are inside the local graph or extract coverage area.\n\n## Fallback behavior expectation\n\nThe preferred debugging sequence is:\n\n1. Distinguish router unavailable from router returned error.\n2. Confirm the backend `/route` path can forward to the active router.\n3. Surface actionable logs in the API or browser console.\n4. Preserve the resolved place inputs so a user can retry without retyping.\n\n## Suggested manual QA script\n\n1. Confirm whether the backend should be using OSRM or the internal custom router.\n2. Start the local routing service that matches that mode.\n3. Run the reachability check for the matching router port.\n4. Run the route API smoke test for the matching router port.\n5. Run the backend `/route` smoke test.\n6. Open the development UI.\n7. Trigger **Get Route** and inspect the browser network request if the UI still fails.\n8. Run the doctor script if the failure crosses frontend, backend, and router boundaries.\n"}}
---
{"tool":"record_map_platform_implementation_result","args":{"title":"Clarify router README with backend mode verification step","change_request_path":"map-platform-change-requests/2026-05-15T00-00-18-523Z-clarify-router-readme-with-backend-mode-verification-step.md","changed_files":["router/README.md"],"commands_run":[],"result":"passed","notes":"Added a backend mode verification subsection to router/README.md so local route debugging starts by confirming the active ROUTER_PROVIDER before router-specific curl checks. This is a scoped docs-only reliability clarification.","residual_risks":["Documentation was not exercised by automated verification because the change is docs-only.","Developers may still have custom local ports or startup wrappers that require manual interpretation beyond the documented defaults."]}}
{"tool":"record_map_platform_implementation_result","args":{"title":"Clarify router README with backend mode verification step","change_request_path":"map-platform-change-requests/2026-05-15T00-00-18-523Z-clarify-router-readme-with-backend-mode-verification-step.md","changed_files":["router/README.md"],"commands_run":[],"result":"passed","notes":"Added a backend mode verification subsection to router/README.md so local route debugging starts by confirming the active ROUTER_PROVIDER before router-specific curl checks. This is a scoped docs-only reliability clarification.","residual_risks":["Documentation was not exercised by automated verification because the change is docs-only.","Developers may still have custom local ports or startup wrappers that require manual interpretation beyond the documented defaults."]}}
---
{"tool":"finish","args":{"status":"completed","summary":"Completed the scoped docs task by updating router/README.md with a backend mode verification subsection, then recorded the implementation result. No further action is needed for this task."}}
- $ git worktree add --detach /tmp/map-platform-agent-nnm3uv9e/worktree HEAD
cwd: /Users/abhisheksrivastava/map_platform
exit: 0
stdout:
HEAD is now at 1df95d9 agent-run: map-platform host iteration
stderr:
Preparing worktree (detached HEAD 1df95d9)
- $ git diff --check
cwd: /tmp/map-platform-agent-nnm3uv9e/worktree
exit: 0
- Generated diff validation:
- $ git apply --check --whitespace=nowarn -
cwd: /Users/abhisheksrivastava/map_platform
exit: 0
- $ bash ./scripts/verify.sh
cwd: /tmp/map-platform-agent-nnm3uv9e/worktree
exit: 0
stdout:
Skipping frontend build: frontend/node_modules is not installed.
Run: npm --prefix frontend install && npm --prefix frontend run build
stderr:
ssssssssssssssssssssssssss
----------------------------------------------------------------------
Ran 26 tests in 0.000s

OK (skipped=26)
- $ git apply --whitespace=nowarn -
cwd: /Users/abhisheksrivastava/map_platform
exit: 0
- $ git worktree remove --force /tmp/map-platform-agent-nnm3uv9e/worktree
cwd: /Users/abhisheksrivastava/map_platform
exit: 0
- $ git worktree prune
cwd: /Users/abhisheksrivastava/map_platform
exit: 0
- $ bash ./scripts/verify.sh
cwd: /tmp/map-platform-agent-nnm3uv9e/worktree
exit: 0
stdout:
Skipping frontend build: frontend/node_modules is not installed.
Run: npm --prefix frontend install && npm --prefix frontend run build
stderr:
ssssssssssssssssssssssssss
----------------------------------------------------------------------
Ran 26 tests in 0.000s

OK (skipped=26)
- map_platform: $ git status --porcelain -- router/README.md
cwd: /Users/abhisheksrivastava/map_platform
exit: 0
stdout:
M router/README.md
- map_platform: $ git add -- router/README.md
cwd: /Users/abhisheksrivastava/map_platform
exit: 0
- map_platform: $ git diff --cached --check
cwd: /Users/abhisheksrivastava/map_platform
exit: 0
- map_platform: $ git commit -m agent-run: map-platform host iteration
cwd: /Users/abhisheksrivastava/map_platform
exit: 0
stdout:
[main 3a9184d] agent-run: map-platform host iteration
 1 file changed, 11 insertions(+)
- map_platform: $ git push origin main
cwd: /Users/abhisheksrivastava/map_platform
exit: 0
stderr:
To github.com:abhisheks810/map_platform.git
   1df95d9..3a9184d  main -> main

## Deferred

- None

## Blockers

- None
