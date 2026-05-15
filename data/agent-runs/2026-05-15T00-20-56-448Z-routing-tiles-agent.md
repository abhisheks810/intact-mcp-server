# Agent Run: routing-tiles-agent

Created: 2026-05-15T00:20:56.448972Z
Agent: routing-tiles-agent
Automation: intact-agent-runner-launchd-map-platform
Product: map-platform
Status: completed
Next recommended agent: routing-tiles-agent

## Summary

Tool-loop run finished.

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
      "reason": "Pick a small routing-reliability task in allowed scope by inspecting existing router troubleshooting docs for the next bounded improvement."
    }
  },
  {
    "tool_result": {
      "tool": "read_map_platform_file",
      "ok": true,
      "output": "# Router Local Verification\n\nThis document captures the minimum local checks for route service reliability during development.\n\n## Purpose\n\n- Confirm the routing service is reachable before testing the UI.\n- Make route failure modes easier to diagnose.\n- Provide a fallback checklist when the UI shows `load failed`.\n\n## Default local assumptions\n\nUnless your local setup intentionally overrides them, use these assumptions while debugging:\n\n- The router is expected to be reachable at `http://localhost:5001` when the backend is configured to use OSRM.\n- The default non-Docker local development flow uses the internal custom router at `http://localhost:8090`.\n- The backend usually remains the UI entry point at `http://localhost:8000`, even when it forwards route requests to OSRM or the custom router.\n- The UI should call the same backend and router mode that you validated with curl.\n- A mismatch between the UI target port and the running router port can appear in the browser as a generic `load failed` error.\n- The recommended non-Docker local development flow defaults to the internal custom router (`ROUTER_PROVIDER=intact`) rather than OSRM.\n\nIf your environment uses a different port, update the curl commands and verify the browser request matches that override exactly.\n\n## Choose the router mode first\n\nBefore debugging a route failure, confirm which router implementation your backend is using:\n\n- Non-Docker local development defaults to the internal custom router at `http://localhost:8090`.\n- OSRM debugging only applies when you intentionally start the backend with `ROUTER_PROVIDER=osrm`.\n- The browser may still call the backend `/route` endpoint rather than calling the router service directly.\n- If you are unsure which local services should be running, see `docs/development_interface.md`.\n\n### Verify the backend mode you actually started\n\nBefore trusting any router curl result, verify the backend startup mode you launched for this session:\n\n- Check the shell command, terminal history, or launch script you used to start the backend.\n- If you did not explicitly set `ROUTER_PROVIDER=osrm`, assume local development is using `ROUTER_PROVIDER=intact`.\n- Re-check the backend logs or startup output after a restart so you do not debug a stale assumption.\n- If the browser, backend, and router checks disagree, treat the backend provider selection as the source of truth for which router port should answer.\n\nThis step helps avoid a common false negative: validating OSRM on `localhost:5001` even though the backend is still forwarding requests to the custom router on `localhost:8090`.\n\nTo force OSRM in local development:\n\n```bash\nROUTER_PROVIDER=osrm ./scripts/start-backend.sh\n```\n\nTo explicitly use the internal custom router instead:\n\n```bash\nROUTER_PROVIDER=intact ./scripts/start-backend.sh\n```\n\n## Match checks to the active router\n\nUse the endpoint that matches the backend mode for your session:\n\n- For `ROUTER_PROVIDER=intact`, verify the custom router at `http://localhost:8090`.\n- For `ROUTER_PROVIDER=osrm`, verify OSRM at `http://localhost:5001`.\n- Verify the backend `/route` endpoint at `http://localhost:8000/route` after the router-specific curl succeeds.\n- Do not treat a healthy OSRM process as proof that the UI is wired correctly if the backend is still using the custom router.\n- Do not treat a healthy custom-router process as proof that the browser is targeting the backend URL you expect.\n\nA quick way to avoid false negatives is to first confirm the backend mode, then run curl against that exact router host and port, then confirm the backend `/route` path also works.\n\n## Health checks\n\nVerify the route service is listening on the expected local port before opening the app UI.\n\n### Basic HTTP reachability\n\nFor OSRM mode:\n\n```bash\ncurl -i http://localhost:5001/\n```\n\nFor custom-router mode:\n\n```bash\ncurl -i http://localhost:8090/\n```\n\nExpected result:\n\n- Any non-network response confirms the process is reachable.\n- Connection refused or timeout means the router is not available to the UI.\n\n### Route API contract smoke test\n\nUse a simple request against the route endpoint with origin and destination coordinates.\n\nFor OSRM mode:\n\n```bash\ncurl -s \"http://localhost:5001/route?origin=77.5946,12.9716&destination=77.6097,12.9601\"\n```\n\nFor custom-router mode:\n\n```bash\ncurl -s \"http://localhost:8090/route?origin=77.5946,12.9716&destination=77.6097,12.9601\"\n```\n\nExpected result:\n\n- HTTP 200.\n- JSON response.\n- A route payload with coordinates, geometry, or steps depending on the active implementation.\n\nIf the service returns a structured error, the router is reachable and the issue is likely request formatting or data coverage rather than a full service outage.\n\n### Backend forwarding smoke test\n\nAfter the router-specific curl passes, verify the backend route endpoint that the UI typically uses:\n\n```bash\ncurl -s \"http://localhost:8000/route?origin=77.5946,12.9716&destination=77.6097,12.9601\"\n```\n\nExpected result:\n\n- HTTP 200 when the backend and active router agree on the mode and target port.\n- JSON response from the backend route contract.\n\nInterpretation:\n\n- If the router curl succeeds but the backend `/route` curl fails, the issue is likely backend configuration, provider selection, or a router host/port mismatch.\n- If the backend `/route` curl succeeds but the UI still fails, the issue is more likely in frontend request wiring, browser environment, or client-side error handling.\n- If both router and backend curls fail, focus first on local process startup and service reachability.\n\n## Automated diagnosis\n\nIf you are not sure whether the failure is caused by the frontend, backend, or router process, run the repo-local doctor first:\n\n```bash\n./scripts/doctor-dev-interface.sh\n```\n\nUse the doctor script before deeper manual debugging when:\n\n- the browser shows a generic `load failed` or network error,\n- you are unsure whether localhost services are actually up, or\n- you want a quick check of the backend `/route` path in the expected local configuration.\n\n## Browser network inspection\n\nIf curl succeeds but the UI still reports `load failed`, inspect the browser network request directly:\n\n1. Open developer tools and go to the **Network** tab.\n2. Press **Get Route** in the UI.\n3. Find the request to the route endpoint.\n4. Confirm the request URL uses the expected host, port, path, and query parameter names.\n5. Compare the browser response status or network error with the curl result.\n\nUseful signals:\n\n- No request in the network panel usually means the UI action did not trigger the API call.\n- A browser request to `localhost:5001` or `localhost:8090` instead of `localhost:8000` can indicate a frontend configuration mismatch for your session.\n- `ERR_CONNECTION_REFUSED`, timeout, or CORS-style browser errors usually indicate environment or connectivity issues rather than bad route data.\n- A visible HTTP error response means the router is reachable and returned a debuggable failure.\n\n## UI failure-mode checklist\n\nIf the development UI reports `load failed` after pressing **Get Route**:\n\n1. Confirm the browser request is targeting the expected route service host and port.\n2. Confirm the backend is using the router implementation you expect for this session.\n3. Run the curl checks above against the active router mode, not just OSRM by habit.\n4. Run the backend `/route` smoke test to confirm backend forwarding matches the router you validated directly.\n5. Run `./scripts/doctor-dev-interface.sh` to check the broader local stack.\n6. Verify origin and destination were both resolved to coordinates, not just label strings.\n7. Compare the UI request query parameter names with the route API contract.\n8. Check whether the selected coordinates are inside the local graph or extract coverage area.\n\n## Fallback behavior expectation\n\nThe preferred debugging sequence is:\n\n1. Distinguish router unavailable from router returned error.\n2. Confirm the backend `/route` path can forward to the active router.\n3. Surface actionable logs in the API or browser console.\n4. Preserve the resolved place inputs so a user can retry without retyping.\n\n## Suggested manual QA script\n\n1. Confirm whether the backend should be using OSRM or the internal custom router.\n2. Start the local routing service that matches that mode.\n3. Run the reachability check for the matching router port.\n4. Run the route API smoke test for the matching router port.\n5. Run the backend `/route` smoke test.\n6. Open the development UI.\n7. Trigger **Get Route** and inspect the browser network request if the UI still fails.\n8. Run the doctor script if the failure crosses frontend, backend, and router boundaries.\n",
      "data": "# Router Local Verification\n\nThis document captures the minimum local checks for route service reliability during development.\n\n## Purpose\n\n- Confirm the routing service is reachable before testing the UI.\n- Make route failure modes easier to diagnose.\n- Provide a fallback checklist when the UI shows `load failed`.\n\n## Default local assumptions\n\nUnless your local setup intentionally overrides them, use these assumptions while debugging:\n\n- The router is expected to be reachable at `http://localhost:5001` when the backend is configured to use OSRM.\n- The default non-Docker local development flow uses the internal custom router at `http://localhost:8090`.\n- The backend usually remains the UI entry point at `http://localhost:8000`, even when it forwards route requests to OSRM or the custom router.\n- The UI should call the same backend and router mode that you validated with curl.\n- A mismatch between the UI target port and the running router port can appear in the browser as a generic `load failed` error.\n- The recommended non-Docker local development flow defaults to the internal custom router (`ROUTER_PROVIDER=intact`) rather than OSRM.\n\nIf your environment uses a different port, update the curl commands and verify the browser request matches that override exactly.\n\n## Choose the router mode first\n\nBefore debugging a route failure, confirm which router implementation your backend is using:\n\n- Non-Docker local development defaults to the internal custom router at `http://localhost:8090`.\n- OSRM debugging only applies when you intentionally start the backend with `ROUTER_PROVIDER=osrm`.\n- The browser may still call the backend `/route` endpoint rather than calling the router service directly.\n- If you are unsure which local services should be running, see `docs/development_interface.md`.\n\n### Verify the backend mode you actually started\n\nBefore trusting any router curl result, verify the backend startup mode you launched for this session:\n\n- Check the shell command, terminal history, or launch script you used to start the backend.\n- If you did not explicitly set `ROUTER_PROVIDER=osrm`, assume local development is using `ROUTER_PROVIDER=intact`.\n- Re-check the backend logs or startup output after a restart so you do not debug a stale assumption.\n- If the browser, backend, and router checks disagree, treat the backend provider selection as the source of truth for which router port should answer.\n\nThis step helps avoid a common false negative: validating OSRM on `localhost:5001` even though the backend is still forwarding requests to the custom router on `localhost:8090`.\n\nTo force OSRM in local development:\n\n```bash\nROUTER_PROVIDER=osrm ./scripts/start-backend.sh\n```\n\nTo explicitly use the internal custom router instead:\n\n```bash\nROUTER_PROVIDER=intact ./scripts/start-backend.sh\n```\n\n## Match checks to the active router\n\nUse the endpoint that matches the backend mode for your session:\n\n- For `ROUTER_PROVIDER=intact`, verify the custom router at `http://localhost:8090`.\n- For `ROUTER_PROVIDER=osrm`, verify OSRM at `http://localhost:5001`.\n- Verify the backend `/route` endpoint at `http://localhost:8000/route` after the router-specific curl succeeds.\n- Do not treat a healthy OSRM process as proof that the UI is wired correctly if the backend is still using the custom router.\n- Do not treat a healthy custom-router process as proof that the browser is targeting the backend URL you expect.\n\nA quick way to avoid false negatives is to first confirm the backend mode, then run curl against that exact router host and port, then confirm the backend `/route` path also works.\n\n## Health checks\n\nVerify the route service is listening on the expected local port before opening the app UI.\n\n### Basic HTTP reachability\n\nFor OSRM mode:\n\n```bash\ncurl -i http://localhost:5001/\n```\n\nFor custom-router mode:\n\n```bash\ncurl -i http://localhost:8090/\n```\n\nExpected result:\n\n- Any non-network response confirms the process is reachable.\n- Connection refused or timeout means the router is not available to the UI.\n\n### Route API contract smoke test\n\nUse a simple request against the route endpoint with origin and destination coordinates.\n\nFor OSRM mode:\n\n```bash\ncurl -s \"http://localhost:5001/route?origin=77.5946,12.9716&destination=77.6097,12.9601\"\n```\n\nFor custom-router mode:\n\n```bash\ncurl -s \"http://localhost:8090/route?origin=77.5946,12.9716&destination=77.6097,12.9601\"\n```\n\nExpected result:\n\n- HTTP 200.\n- JSON response.\n- A route payload with coordinates, geometry, or steps depending on the active implementation.\n\nIf the service returns a structured error, the router is reachable and the issue is likely request formatting or data coverage rather than a full service outage.\n\n### Backend forwarding smoke test\n\nAfter the router-specific curl passes, verify the backend route endpoint that the UI typically uses:\n\n```bash\ncurl -s \"http://localhost:8000/route?origin=77.5946,12.9716&destination=77.6097,12.9601\"\n```\n\nExpected result:\n\n- HTTP 200 when the backend and active router agree on the mode and target port.\n- JSON response from the backend route contract.\n\nInterpretation:\n\n- If the router curl succeeds but the backend `/route` curl fails, the issue is likely backend configuration, provider selection, or a router host/port mismatch.\n- If the backend `/route` curl succeeds but the UI still fails, the issue is more likely in frontend request wiring, browser environment, or client-side error handling.\n- If both router and backend curls fail, focus first on local process startup and service reachability.\n\n## Automated diagnosis\n\nIf you are not sure whether the failure is caused by the frontend, backend, or router process, run the repo-local doctor first:\n\n```bash\n./scripts/doctor-dev-interface.sh\n```\n\nUse the doctor script before deeper manual debugging when:\n\n- the browser shows a generic `load failed` or network error,\n- you are unsure whether localhost services are actually up, or\n- you want a quick check of the backend `/route` path in the expected local configuration.\n\n## Browser network inspection\n\nIf curl succeeds but the UI still reports `load failed`, inspect the browser network request directly:\n\n1. Open developer tools and go to the **Network** tab.\n2. Press **Get Route** in the UI.\n3. Find the request to the route endpoint.\n4. Confirm the request URL uses the expected host, port, path, and query parameter names.\n5. Compare the browser response status or network error with the curl result.\n\nUseful signals:\n\n- No request in the network panel usually means the UI action did not trigger the API call.\n- A browser request to `localhost:5001` or `localhost:8090` instead of `localhost:8000` can indicate a frontend configuration mismatch for your session.\n- `ERR_CONNECTION_REFUSED`, timeout, or CORS-style browser errors usually indicate environment or connectivity issues rather than bad route data.\n- A visible HTTP error response means the router is reachable and returned a debuggable failure.\n\n## UI failure-mode checklist\n\nIf the development UI reports `load failed` after pressing **Get Route**:\n\n1. Confirm the browser request is targeting the expected route service host and port.\n2. Confirm the backend is using the router implementation you expect for this session.\n3. Run the curl checks above against the active router mode, not just OSRM by habit.\n4. Run the backend `/route` smoke test to confirm backend forwarding matches the router you validated directly.\n5. Run `./scripts/doctor-dev-interface.sh` to check the broader local stack.\n6. Verify origin and destination were both resolved to coordinates, not just label strings.\n7. Compare the UI request query parameter names with the route API contract.\n8. Check whether the selected coordinates are inside the local graph or extract coverage area.\n\n## Fallback behavior expectation\n\nThe preferred debugging sequence is:\n\n1. Distinguish router unavailable from router returned error.\n2. Confirm the backend `/route` path can forward to the active router.\n3. Surface actionable logs in the API or browser console.\n4. Preserve the resolved place inputs so a user can retry without retyping.\n\n## Suggested manual QA script\n\n1. Confirm whether the backend should be using OSRM or the internal custom router.\n2. Start the local routing service that matches that mode.\n3. Run the reachability check for the matching router port.\n4. Run the route API smoke test for the matching router port.\n5. Run the backend `/route` smoke test.\n6. Open the development UI.\n7. Trigger **Get Route** and inspect the browser network request if the UI still fails.\n8. Run the doctor script if the failure crosses frontend, backend, and router boundaries.\n"
    }
  },
  {
    "action": {
      "tool": "create_map_platform_change_request",
      "args": {
        "title": "Clarify router README with startup verification steps",
        "agent": "routing-tiles-agent",
        "objective": "Make router local verification guidance more actionable by adding a short startup verification checklist tied to backend provider selection and local ports.",
        "allowed_files": [
          "router/README.md"
        ],
        "verification": [
          "Review router/README.md for consistent local startup and verification guidance"
        ],
        "approval_note": "Scoped documentation-only improvement to router troubleshooting guidance."
      },
      "reason": ""
    }
  },
  {
    "tool_result": {
      "tool": "create_map_platform_change_request",
      "ok": true,
      "output": "{\n  \"created\": \"/Users/abhisheksrivastava/intact-mcp-server/data/map-platform-change-requests/2026-05-15T00-20-13-843Z-clarify-router-readme-with-startup-verification-steps.md\",\n  \"path\": \"map-platform-change-requests/2026-05-15T00-20-13-843Z-clarify-router-readme-with-startup-verification-steps.md\",\n  \"status\": \"approved-for-scoped-work\"\n}",
      "data": {
        "created": "/Users/abhisheksrivastava/intact-mcp-server/data/map-platform-change-requests/2026-05-15T00-20-13-843Z-clarify-router-readme-with-startup-verification-steps.md",
        "path": "map-platform-change-requests/2026-05-15T00-20-13-843Z-clarify-router-readme-with-startup-verification-steps.md",
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
      "reason": "Need current sha256 before editing existing router/README.md for the a
- Generated diff:
- diff --git a/router/README.md b/router/README.md
index d134e54..6021d00 100644
--- a/router/README.md
+++ b/router/README.md
@@ -21,6 +21,39 @@ Unless your local setup intentionally overrides them, use these assumptions whil

 If your environment uses a different port, update the curl commands and verify the browser request matches that override exactly.

+## Quick startup verification checklist
+
+Use this short sequence immediately after starting local services so you confirm the expected mode before opening the UI:
+
+1. Start the backend with the provider you intend to test.
+2. Confirm whether you explicitly set `ROUTER_PROVIDER=osrm` or left the default `ROUTER_PROVIDER=intact`.
+3. Confirm the matching router process is listening on the expected port.
+4. Run one direct curl against the active router.
+5. Run one curl against the backend `/route` endpoint.
+6. Only then verify the same flow in the browser.
+
+Recommended startup commands:
+
+```bash
+ROUTER_PROVIDER=intact ./scripts/start-backend.sh
+```
+
+```bash
+ROUTER_PROVIDER=osrm ./scripts/start-backend.sh
+```
+
+Quick port checks:
+
+```bash
+curl -i http://localhost:8090/
+```
+
+```bash
+curl -i http://localhost:5001/
+```
+
+If you skip this sequence, it is easy to validate one router port while the backend is still configured to forward requests somewhere else.
+
 ## Choose the router mode first

 Before debugging a route failure, confirm which router implementation your backend is using:

- Raw model responses:
- {"tool":"read_map_platform_file","args":{"path":"router/README.md"},"reason":"Pick a small routing-reliability task in allowed scope by inspecting existing router troubleshooting docs for the next bounded improvement."}
---
{"tool":"create_map_platform_change_request","args":{"title":"Clarify router README with startup verification steps","agent":"routing-tiles-agent","objective":"Make router local verification guidance more actionable by adding a short startup verification checklist tied to backend provider selection and local ports.","allowed_files":["router/README.md"],"verification":["Review router/README.md for consistent local startup and verification guidance"],"approval_note":"Scoped documentation-only improvement to router troubleshooting guidance."}}
{}
---
{"tool":"get_map_platform_file_metadata","args":{"path":"router/README.md"},"reason":"Need current sha256 before editing existing router/README.md for the approved scoped documentation update."}
{"tool":"get_map_platform_file_metadata","args":{"path":"router/README.md"},"reason":"Need current sha256 before editing existing router/README.md for the approved scoped documentation update."}
---
{"tool":"write_map_platform_file","args":{"path":"router/README.md","expected_sha256":"9773819017d7d949713061029a43d3e904a658057d87541ea25b505d52198ea5","change_request_path":"map-platform-change-requests/2026-05-15T00-20-13-843Z-clarify-router-readme-with-startup-verification-steps.md","approval_note":"Scoped documentation-only improvement to router troubleshooting guidance.","content":"# Router Local Verification\n\nThis document captures the minimum local checks for route service reliability during development.\n\n## Purpose\n\n- Confirm the routing service is reachable before testing the UI.\n- Make route failure modes easier to diagnose.\n- Provide a fallback checklist when the UI shows `load failed`.\n\n## Default local assumptions\n\nUnless your local setup intentionally overrides them, use these assumptions while debugging:\n\n- The router is expected to be reachable at `http://localhost:5001` when the backend is configured to use OSRM.\n- The default non-Docker local development flow uses the internal custom router at `http://localhost:8090`.\n- The backend usually remains the UI entry point at `http://localhost:8000`, even when it forwards route requests to OSRM or the custom router.\n- The UI should call the same backend and router mode that you validated with curl.\n- A mismatch between the UI target port and the running router port can appear in the browser as a generic `load failed` error.\n- The recommended non-Docker local development flow defaults to the internal custom router (`ROUTER_PROVIDER=intact`) rather than OSRM.\n\nIf your environment uses a different port, update the curl commands and verify the browser request matches that override exactly.\n\n## Quick startup verification checklist\n\nUse this short sequence immediately after starting local services so you confirm the expected mode before opening the UI:\n\n1. Start the backend with the provider you intend to test.\n2. Confirm whether you explicitly set `ROUTER_PROVIDER=osrm` or left the default `ROUTER_PROVIDER=intact`.\n3. Confirm the matching router process is listening on the expected port.\n4. Run one direct curl against the active router.\n5. Run one curl against the backend `/route` endpoint.\n6. Only then verify the same flow in the browser.\n\nRecommended startup commands:\n\n```bash\nROUTER_PROVIDER=intact ./scripts/start-backend.sh\n```\n\n```bash\nROUTER_PROVIDER=osrm ./scripts/start-backend.sh\n```\n\nQuick port checks:\n\n```bash\ncurl -i http://localhost:8090/\n```\n\n```bash\ncurl -i http://localhost:5001/\n```\n\nIf you skip this sequence, it is easy to validate one router port while the backend is still configured to forward requests somewhere else.\n\n## Choose the router mode first\n\nBefore debugging a route failure, confirm which router implementation your backend is using:\n\n- Non-Docker local development defaults to the internal custom router at `http://localhost:8090`.\n- OSRM debugging only applies when you intentionally start the backend with `ROUTER_PROVIDER=osrm`.\n- The browser may still call the backend `/route` endpoint rather than calling the router service directly.\n- If you are unsure which local services should be running, see `docs/development_interface.md`.\n\n### Verify the backend mode you actually started\n\nBefore trusting any router curl result, verify the backend startup mode you launched for this session:\n\n- Check the shell command, terminal history, or launch script you used to start the backend.\n- If you did not explicitly set `ROUTER_PROVIDER=osrm`, assume local development is using `ROUTER_PROVIDER=intact`.\n- Re-check the backend logs or startup output after a restart so you do not debug a stale assumption.\n- If the browser, backend, and router checks disagree, treat the backend provider selection as the source of truth for which router port should answer.\n\nThis step helps avoid a common false negative: validating OSRM on `localhost:5001` even though the backend is still forwarding requests to the custom router on `localhost:8090`.\n\nTo force OSRM in local development:\n\n```bash\nROUTER_PROVIDER=osrm ./scripts/start-backend.sh\n```\n\nTo explicitly use the internal custom router instead:\n\n```bash\nROUTER_PROVIDER=intact ./scripts/start-backend.sh\n```\n\n## Match checks to the active router\n\nUse the endpoint that matches the backend mode for your session:\n\n- For `ROUTER_PROVIDER=intact`, verify the custom router at `http://localhost:8090`.\n- For `ROUTER_PROVIDER=osrm`, verify OSRM at `http://localhost:5001`.\n- Verify the backend `/route` endpoint at `http://localhost:8000/route` after the router-specific curl succeeds.\n- Do not treat a healthy OSRM process as proof that the UI is wired correctly if the backend is still using the custom router.\n- Do not treat a healthy custom-router process as proof that the browser is targeting the backend URL you expect.\n\nA quick way to avoid false negatives is to first confirm the backend mode, then run curl against that exact router host and port, then confirm the backend `/route` path also works.\n\n## Health checks\n\nVerify the route service is listening on the expected local port before opening the app UI.\n\n### Basic HTTP reachability\n\nFor OSRM mode:\n\n```bash\ncurl -i http://localhost:5001/\n```\n\nFor custom-router mode:\n\n```bash\ncurl -i http://localhost:8090/\n```\n\nExpected result:\n\n- Any non-network response confirms the process is reachable.\n- Connection refused or timeout means the router is not available to the UI.\n\n### Route API contract smoke test\n\nUse a simple request against the route endpoint with origin and destination coordinates.\n\nFor OSRM mode:\n\n```bash\ncurl -s \"http://localhost:5001/route?origin=77.5946,12.9716&destination=77.6097,12.9601\"\n```\n\nFor custom-router mode:\n\n```bash\ncurl -s \"http://localhost:8090/route?origin=77.5946,12.9716&destination=77.6097,12.9601\"\n```\n\nExpected result:\n\n- HTTP 200.\n- JSON response.\n- A route payload with coordinates, geometry, or steps depending on the active implementation.\n\nIf the service returns a structured error, the router is reachable and the issue is likely request formatting or data coverage rather than a full service outage.\n\n### Backend forwarding smoke test\n\nAfter the router-specific curl passes, verify the backend route endpoint that the UI typically uses:\n\n```bash\ncurl -s \"http://localhost:8000/route?origin=77.5946,12.9716&destination=77.6097,12.9601\"\n```\n\nExpected result:\n\n- HTTP 200 when the backend and active router agree on the mode and target port.\n- JSON response from the backend route contract.\n\nInterpretation:\n\n- If the router curl succeeds but the backend `/route` curl fails, the issue is likely backend configuration, provider selection, or a router host/port mismatch.\n- If the backend `/route` curl succeeds but the UI still fails, the issue is more likely in frontend request wiring, browser environment, or client-side error handling.\n- If both router and backend curls fail, focus first on local process startup and service reachability.\n\n## Automated diagnosis\n\nIf you are not sure whether the failure is caused by the frontend, backend, or router process, run the repo-local doctor first:\n\n```bash\n./scripts/doctor-dev-interface.sh\n```\n\nUse the doctor script before deeper manual debugging when:\n\n- the browser shows a generic `load failed` or network error,\n- you are unsure whether localhost services are actually up, or\n- you want a quick check of the backend `/route` path in the expected local configuration.\n\n## Browser network inspection\n\nIf curl succeeds but the UI still reports `load failed`, inspect the browser network request directly:\n\n1. Open developer tools and go to the **Network** tab.\n2. Press **Get Route** in the UI.\n3. Find the request to the route endpoint.\n4. Confirm the request URL uses the expected host, port, path, and query parameter names.\n5. Compare the browser response status or network error with the curl result.\n\nUseful signals:\n\n- No request in the network panel usually means the UI action did not trigger the API call.\n- A browser request to `localhost:5001` or `localhost:8090` instead of `localhost:8000` can indicate a frontend configuration mismatch for your session.\n- `ERR_CONNECTION_REFUSED`, timeout, or CORS-style browser errors usually indicate environment or connectivity issues rather than bad route data.\n- A visible HTTP error response means the router is reachable and returned a debuggable failure.\n\n## UI failure-mode checklist\n\nIf the development UI reports `load failed` after pressing **Get Route**:\n\n1. Confirm the browser request is targeting the expected route service host and port.\n2. Confirm the backend is using the router implementation you expect for this session.\n3. Run the curl checks above against the active router mode, not just OSRM by habit.\n4. Run the backend `/route` smoke test to confirm backend forwarding matches the router you validated directly.\n5. Run `./scripts/doctor-dev-interface.sh` to check the broader local stack.\n6. Verify origin and destination were both resolved to coordinates, not just label strings.\n7. Compare the UI request query parameter names with the route API contract.\n8. Check whether the selected coordinates are inside the local graph or extract coverage area.\n\n## Fallback behavior expectation\n\nThe preferred debugging sequence is:\n\n1. Distinguish router unavailable from router returned error.\n2. Confirm the backend `/route` path can forward to the active router.\n3. Surface actionable logs in the API or browser console.\n4. Preserve the resolved place inputs so a user can retry without retyping.\n\n## Suggested manual QA script\n\n1. Confirm whether the backend should be using OSRM or the internal custom router.\n2. Start the local routing service that matches that mode.\n3. Run the reachability check for the matching router port.\n4. Run the route API smoke test for the matching router port.\n5. Run the backend `/route` smoke test.\n6. Open the development UI.\n7. Trigger **Get Route** and inspect the browser network request if the UI still fails.\n8. Run the doctor script if the failure crosses frontend, backend, and router boundaries.\n"}}
---
{"tool":"record_map_platform_implementation_result","args":{"title":"Clarify router README with startup verification steps","change_request_path":"map-platform-change-requests/2026-05-15T00-20-13-843Z-clarify-router-readme-with-startup-verification-steps.md","changed_files":["router/README.md"],"commands_run":[],"result":"passed","notes":"Updated router/README.md with a quick startup verification checklist, explicit backend startup commands for intact and osrm modes, and quick port checks to reduce false-negative local debugging.","residual_risks":["Documentation guidance was not validated by executing local router or backend processes in this run.","README may still drift if startup scripts or default ports change later without corresponding doc updates."]}}
{"tool":"record_map_platform_implementation_result","args":{"title":"Clarify router README with startup verification steps","change_request_path":"map-platform-change-requests/2026-05-15T00-20-13-843Z-clarify-router-readme-with-startup-verification-steps.md","changed_files":["router/README.md"],"commands_run":[],"result":"passed","notes":"Updated router/README.md with a quick startup verification checklist, explicit backend startup commands for intact and osrm modes, and quick port checks to reduce false-negative local debugging.","residual_risks":["Documentation guidance was not validated by executing local router or backend processes in this run.","README may still drift if startup scripts or default ports change later without corresponding doc updates."]}}
---
{"finish":{"status":"completed","summary":"Completed a scoped documentation update in router/README.md adding startup verification guidance, wrote the approved change, and recorded implementation results."}}
---
{"status":"finished","summary":"Completed a scoped documentation update in router/README.md, recorded the implementation result, and there is no further tool action required."}
---
{"finish":{"status":"completed","message":"Completed scoped documentation update to router/README.md and recorded implementation result."}}
---
{"tool":"finish","args":{}}
- $ git worktree add --detach /tmp/map-platform-agent-pyrhf6ou/worktree HEAD
cwd: /Users/abhisheksrivastava/map_platform
exit: 0
stdout:
HEAD is now at 3a9184d agent-run: map-platform host iteration
stderr:
Preparing worktree (detached HEAD 3a9184d)
- $ git diff --check
cwd: /tmp/map-platform-agent-pyrhf6ou/worktree
exit: 0
- Generated diff validation:
- $ git apply --check --whitespace=nowarn -
cwd: /Users/abhisheksrivastava/map_platform
exit: 0
- $ bash ./scripts/verify.sh
cwd: /tmp/map-platform-agent-pyrhf6ou/worktree
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
- $ git worktree remove --force /tmp/map-platform-agent-pyrhf6ou/worktree
cwd: /Users/abhisheksrivastava/map_platform
exit: 0
- $ git worktree prune
cwd: /Users/abhisheksrivastava/map_platform
exit: 0
- $ bash ./scripts/verify.sh
cwd: /tmp/map-platform-agent-pyrhf6ou/worktree
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
[main 9584dfe] agent-run: map-platform host iteration
 1 file changed, 33 insertions(+)
- map_platform: $ git push origin main
cwd: /Users/abhisheksrivastava/map_platform
exit: 0
stderr:
To github.com:abhisheks810/map_platform.git
   3a9184d..9584dfe  main -> main

## Deferred

- None

## Blockers

- None
