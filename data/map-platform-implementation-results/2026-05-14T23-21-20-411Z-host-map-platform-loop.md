# Implementation Result: host map-platform loop

Created: 2026-05-14T23:21:20.411959Z
Status: completed

## Summary

Model did not return finish before the action budget; runner evaluated the generated diff deterministically.

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
      "reason": "Inspect the current router integration and troubleshooting docs to identify the smallest custom-routing reliability or QA follow-up we can patch in a single bounded change."
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
      "tool": "search_map_platform",
      "args": {
        "query": "doctor-dev-interface.sh",
        "limit": 10
      },
      "reason": "Locate references to the doctor script so the next small docs or verification-oriented change can be scoped consistently with existing development guidance."
    }
  },
  {
    "tool_result": {
      "tool": "search_map_platform",
      "ok": true,
      "output": "{\n  \"query\": \"doctor-dev-interface.sh\",\n  \"matches\": [\n    {\n      \"path\": \"docs/agent-runs/2026-04-26T18-27-16Z-supervised-dev-interface-doctor-script.md\",\n      \"line\": 32,\n      \"text\": \"- /Users/abhisheksrivastava/map_platform/scripts/doctor-dev-interface.sh\"\n    },\n    {\n      \"path\": \"docs/agent-runs/2026-04-26T18-27-16Z-supervised-dev-interface-doctor-script.md\",\n      \"line\": 35,\n      \"text\": \"- Documented `./scripts/doctor-dev-interface.sh` under local smoke tests.\"\n    },\n    {\n      \"path\": \"docs/agent-runs/2026-04-26T18-27-16Z-supervised-dev-interface-doctor-script.md\",\n      \"line\": 40,\n      \"text\": \"- `bash -n scripts/doctor-dev-interface.sh` (PASS)\"\n    },\n    {\n      \"path\": \"docs/agent-runs/2026-04-27T15-05-10Z-supervised-map-platform-loop-00.md\",\n      \"line\": 40,\n      \"text\": \"- next steps: `./scripts/dev-local-stack.sh` or `./scripts/doctor-dev-interface.sh`\"\n    },\n    {\n      \"path\": \"docs/agent-runs/2026-04-27T15-05-10Z-supervised-map-platform-loop-00.md\",\n      \"line\": 80,\n      \"text\": \"./scripts/doctor-dev-interface.sh\"\n    },\n    {\n      \"path\": \"docs/agent-runs/2026-04-27T16-05-44Z-supervised-map-platform-loop-00.md\",\n      \"line\": 44,\n      \"text\": \"- /Users/abhisheksrivastava/map_platform/scripts/doctor-dev-interface.sh\"\n    },\n    {\n      \"path\": \"docs/agent-runs/2026-04-27T16-05-44Z-supervised-map-platform-loop-00.md\",\n      \"line\": 52,\n      \"text\": \"- `cd /Users/abhisheksrivastava/map_platform && ./scripts/doctor-dev-interface.sh`\"\n    },\n    {\n      \"path\": \"docs/development_interface.md\",\n      \"line\": 192,\n      \"text\": \"./scripts/doctor-dev-interface.sh\"\n    },\n    {\n      \"path\": \"docs/implementation-results/2026-04-26-dev-interface-doctor-script.md\",\n      \"line\": 11,\n      \"text\": \"- Added `./scripts/doctor-dev-interface.sh` to probe:\"\n    },\n    {\n      \"path\": \"docs/implementation-results/2026-04-26-dev-interface-doctor-script.md\",\n      \"line\": 20,\n      \"text\": \"- /Users/abhisheksrivastava/map_platform/scripts/doctor-dev-interface.sh\"\n    }\n  ],\n  \"total_matches\": 20\n}",
      "data": {
        "query": "doctor-dev-interface.sh",
        "matches": [
          {
            "path": "docs/agent-runs/2026-04-26T18-27-16Z-supervised-dev-interface-doctor-script.md",
            "line": 32,
            "text": "- /Users/abhisheksrivastava/map_platform/scripts/doctor-dev-interface.sh"
          },
          {
            "path": "docs/agent-runs/2026-04-26T18-27-16Z-supervised-dev-interface-doctor-script.md",
            "line": 35,
            "text": "- Documented `./scripts/doctor-dev-interface.sh` under local smoke tests."
          },
          {
            "path": "docs/agent-runs/2026-04-26T18-27-16Z-supervised-dev-interface-doctor-script.md",
            "line": 40,
            "text": "-
- Generated diff:
- diff --git a/docs/development_interface.md b/docs/development_interface.md
index f03ca94..562f216 100644
--- a/docs/development_interface.md
+++ b/docs/development_interface.md
@@ -179,13 +179,30 @@ ROUTER_PROVIDER=intact ./scripts/start-backend.sh

 ## Local Smoke Tests

+Choose the smoke-test commands that match the router mode your backend is using for the current session.
+
+### Default non-Docker local mode (`ROUTER_PROVIDER=intact`)
+
 ```bash
 curl http://localhost:8000/
 curl "http://localhost:8000/geocode?address=Connaught%20Place%2C%20Delhi&limit=1"
 curl http://localhost:8090/
 curl "http://localhost:8090/route?origin=28.6314022,77.2193791&destination=28.6129,77.2295"
+curl "http://localhost:8000/route?origin=28.6314022,77.2193791&destination=28.6129,77.2295"
 ```

+### OSRM local mode (`ROUTER_PROVIDER=osrm`)
+
+```bash
+curl http://localhost:8000/
+curl "http://localhost:8000/geocode?address=Connaught%20Place%2C%20Delhi&limit=1"
+curl http://localhost:5001/
+curl "http://localhost:5001/route?origin=28.6314022,77.2193791&destination=28.6129,77.2295"
+curl "http://localhost:8000/route?origin=28.6314022,77.2193791&destination=28.6129,77.2295"
+```
+
+If the router-specific curl succeeds but the backend `/route` curl fails, check backend provider selection and router host/port configuration before debugging the frontend.
+
 Or run the automated dev-interface doctor:

 ```bash

- Raw model responses:
- {"tool":"read_map_platform_file","args":{"path":"router/README.md"},"reason":"Inspect the current router integration and troubleshooting docs to identify the smallest custom-routing reliability or QA follow-up we can patch in a single bounded change."}
---
{"tool":"search_map_platform","args":{"query":"doctor-dev-interface.sh", "limit": 10},"reason":"Locate references to the doctor script so the next small docs or verification-oriented change can be scoped consistently with existing development guidance."}
{"tool":"search_map_platform","args":{"query":"doctor-dev-interface.sh","limit":10},"reason":"Locate references to the doctor script so the next small docs or verification-oriented change can be scoped consistently with existing development guidance."}
---
{"tool":"read_map_platform_file","args":{"path":"docs/development_interface.md"},"reason":"Inspect the main development interface guide around the doctor-script references so I can identify a small, coherent documentation improvement to make next."}
{"tool":"read_map_platform_file","args":{"path":"docs/development_interface.md"},"reason":"Inspect the main development interface guide around the doctor-script references so I can identify a small, coherent documentation improvement to make next."}
---
{"tool":"create_map_platform_change_request","args":{"title":"Clarify local smoke tests by router mode","agent":"report-agent","objective":"Make local development verification clearer by documenting separate smoke-test commands for custom-router and OSRM modes in docs/development_interface.md.","allowed_files":["docs/development_interface.md"],"verification":["Documentation review for accuracy against existing router README guidance"],"approval_note":"Approved scoped docs-only clarification to align local smoke tests with active router mode and reduce false-negative routing checks."},"reason":"Create the required scoped change request before editing the development guide with a small, commit-worthy router-mode clarification."}
{"tool":"create_map_platform_change_request","args":{"title":"Clarify local smoke tests by router mode","agent":"report-agent","objective":"Make local development verification clearer by documenting separate smoke-test commands for custom-router and OSRM modes in docs/development_interface.md.","allowed_files":["docs/development_interface.md"],"verification":["Documentation review for accuracy against existing router README guidance"],"approval_note":"Approved scoped docs-only clarification to align local smoke tests with active router mode and reduce false-negative routing checks."},"reason":"Create the required scoped change request before editing the development guide with a small, commit-worthy router-mode clarification."}
---
{"tool":"get_map_platform_file_metadata","args":{"path":"docs/development_interface.md"},"reason":"Fetch current file hash before updating the development guide with router-mode-specific smoke test clarifications."}
{"tool":"get_map_platform_file_metadata","args":{"path":"docs/development_interface.md"},"reason":"Fetch current file hash before updating the development guide with router-mode-specific smoke test clarifications."}
---
{"tool":"write_map_platform_file","args":{"path":"docs/development_interface.md","content":"# Development Interface\n\nThis project should always expose a testable development interface for daily review.\n\n## Default Local URLs\n\n| Service | URL | Purpose |\n| --- | --- | --- |\n| Frontend | http://localhost:3000 | Main development UI |\n| Backend | http://localhost:8000 | FastAPI gateway |\n| Geocoder | http://localhost:8080 | Nominatim proxy |\n| Custom Router | http://localhost:8090 | Internal OSRM replacement path |\n| Router | http://localhost:5001 | OSRM route service |\n| Tileserver | http://localhost:8081 | Optional local tiles |\n\nThe frontend examples below may also appear on `http://localhost:5173` when launched with the repo Vite script. Use the actual terminal-reported frontend URL for your session when validating backend and router connectivity.\n\n## Start Full Stack\n\nUse Docker Compose when you want the closest local integration environment:\n\n```bash\ndocker-compose up --build\n```\n\nThe router requires prepared OSRM data under `data/`. If routing data is missing, geocoding and frontend work can still be developed independently, but route calls will fail.\n\nFor realistic road routing in the local Docker stack, prepare the Northern Zone OSRM data first:\n\n```bash\n./scripts/download-osm-extract.sh\n./scripts/build-osrm-routing-data.sh\nROUTER_PROVIDER=osrm docker compose up --build\n```\n\nFor broader northern Tier-1/Tier-2 city coverage, switch to India-wide extract and matching router env:\n\n```bash\nEXTRACT_SLUG=india DATASET=india-latest ./scripts/download-osm-extract.sh\nDATASET=india-latest ROUTER_REGION=india ./scripts/build-osrm-routing-data.sh\nROUTER_REGION=india ROUTER_DATASET=india-latest ROUTER_PROVIDER=osrm docker compose up --build\n```\n\nTo scale coverage region-by-region (without loading all-India at once), run multiple OSRM shards and broker in backend:\n\n```bash\n# Build each region separately (example names)\nDATASET=northern-zone-latest ROUTER_REGION=northern-zone ./scripts/build-osrm-routing-data.sh\nDATASET=region-b-latest ROUTER_REGION=region-b ./scripts/build-osrm-routing-data.sh\nDATASET=region-c-latest ROUTER_REGION=region-c ./scripts/build-osrm-routing-data.sh\n\n# Start shard routers\nROUTER_REGION_B=region-b ROUTER_DATASET_B=region-b-latest \\\nROUTER_REGION_C=region-c ROUTER_DATASET_C=region-c-latest \\\nROUTER_REGION_D=region-d ROUTER_DATASET_D=region-d-latest \\\ndocker compose --profile multi_osrm up -d router router_b router_c router_d\n\n# Backend chooses the shard where both endpoints snap within threshold\nOSRM_ROUTER_HOSTS=\"north=http://router:5000,rb=http://router_b:5000,rc=http://router_c:5000,rd=http://router_d:5000\" \\\nROUTER_PROVIDER=osrm docker compose up -d backend\n```\n\nNotes:\n- This achieves incremental **intra-city** coverage.\n- For cross-country routing between distant regions, a wider connected dataset is still required.\n\nOne-command startup for the current north+central+eastern shard layout:\n\n```bash\n./scripts/start-regional-osrm-stack.sh\n```\n\nFor six-zone India coverage plus cross-region routes:\n\n```bash\n./scripts/download-missing-india-zone-extracts.sh\n./scripts/build-missing-india-zone-routing-data.sh\nOSRM_THREADS=2 ./scripts/build-india-merged-routing-data.sh\n./scripts/start-regional-osrm-stack.sh\n```\n\nNotes:\n- Zonal Docker routers (`5001`-`5006`) cover local routing quality.\n- Merged global router (`0.0.0.0:5007` on host, consumed as `host.docker.internal:5007` by backend) handles cross-region trips.\n- `./scripts/start-regional-osrm-stack.sh` now launches the full integrated stack and auto-wires global fallback.\n- Backend fallback to global graph is automatic when no zonal shard covers both endpoints.\n\n### Manual Launch (Integrated Stack)\n\nUse this when you want the complete integrated map platform service with full routing fallback:\n\n```bash\ncd /Users/abhisheksrivastava/map_platform\n./scripts/start-regional-osrm-stack.sh\n./scripts/dev-frontend.sh\n```\n\nThen open:\n\n- UI: http://localhost:5173 (or the Vite port printed in terminal)\n- Backend: http://localhost:8000\n\nQuick validation:\n\n```bash\ncurl \"http://localhost:8000/route?origin=28.1834229,80.7131272&destination=17.3616024,78.4746421\"\n```\n\nExpected in response:\n- `\"router_name\":\"india-merged\"`\n- `\"used_global_fallback\":true`\n\n## Start Frontend Only\n\nUse this when reviewing frontend-only changes:\n\n```bash\nnpm --prefix frontend install\nnpm --prefix frontend run dev -- --host 0.0.0.0\n```\n\nThe frontend expects the backend at `http://localhost:8000` unless `VITE_API_BASE` is changed.\n\n## Start Local App Without Docker\n\nThis is the recommended path for daily review when OSRM routing data is not prepared.\n\nTerminal 1:\n\n```bash\n./scripts/setup-local-python.sh\n./scripts/start-geocoder.sh\n```\n\nTerminal 2:\n\n```bash\n./scripts/start-custom-router.sh\n```\n\nTerminal 3:\n\n```bash\n./scripts/start-backend.sh\n```\n\nTerminal 4:\n\n```bash\n./scripts/dev-frontend.sh\n```\n\nOr start all three processes from one terminal:\n\n```bash\n./scripts/dev-local-stack.sh\n```\n\nExpected URLs:\n\n- Frontend: http://localhost:3000, or the next free Vite port if 3000 is busy. In some repo-local flows the frontend may instead start on http://localhost:5173, so prefer the URL printed by the frontend terminal.\n- Backend: http://localhost:8000\n- Geocoder: http://localhost:8080\n- Custom Router: http://localhost:8090\n\nBy default, the non-Docker local dev path uses the internal `custom_router` (`ROUTER_PROVIDER=intact`).\n\nTo force OSRM in local dev (when OSRM is running at `http://localhost:5001`):\n\n```bash\nROUTER_PROVIDER=osrm ./scripts/start-backend.sh\n```\n\nTo explicitly test the internal custom router:\n\n```bash\nROUTER_PROVIDER=intact ./scripts/start-backend.sh\n```\n\n## Local Smoke Tests\n\nChoose the smoke-test commands that match the router mode your backend is using for the current session.\n\n### Default non-Docker local mode (`ROUTER_PROVIDER=intact`)\n\n```bash\ncurl http://localhost:8000/\ncurl \"http://localhost:8000/geocode?address=Connaught%20Place%2C%20Delhi&limit=1\"\ncurl http://localhost:8090/\ncurl \"http://localhost:8090/route?origin=28.6314022,77.2193791&destination=28.6129,77.2295\"\ncurl \"http://localhost:8000/route?origin=28.6314022,77.2193791&destination=28.6129,77.2295\"\n```\n\n### OSRM local mode (`ROUTER_PROVIDER=osrm`)\n\n```bash\ncurl http://localhost:8000/\ncurl \"http://localhost:8000/geocode?address=Connaught%20Place%2C%20Delhi&limit=1\"\ncurl http://localhost:5001/\ncurl \"http://localhost:5001/route?origin=28.6314022,77.2193791&destination=28.6129,77.2295\"\ncurl \"http://localhost:8000/route?origin=28.6314022,77.2193791&destination=28.6129,77.2295\"\n```\n\nIf the router-specific curl succeeds but the backend `/route` curl fails, check backend provider selection and router host/port configuration before debugging the frontend.\n\nOr run the automated dev-interface doctor:\n\n```bash\n./scripts/doctor-dev-interface.sh\n```\n\n## Verify Current Build\n\n```bash\n./scripts/verify.sh\n```\n\nThis runs Python compile checks and the frontend production build when dependencies are installed.\n\n## Agent Loop Publish Guardrails\n\nUse these scripts to make loop runs fail fast on environment issues and finish only after clean push/finalize:\n\n```bash\n# Preflight: run before development work\nbash ./scripts/loop-preflight.sh --require-clean\n\n# Finalize: run at the end of a successful loop\nbash ./scripts/loop-finalize.sh \\\n  --commit-message \"scoped loop change summary\" \\\n  --worktree-path \"/Users/abhisheksrivastava/.codex/worktrees/<id>/map_platform\"\n```\n\n`loop-preflight.sh` checks remote configuration, DNS resolution for GitHub, and remote auth reachability.\n`loop-finalize.sh` runs verification, fast-forward sync, commit/push with retries, clean-status enforcement, and best-effort worktree prune.\n\nIf preflight fails, mark the loop as failed immediately and do not continue development inside that run.\n\n## Routing Quality Baseline\n\nUse two benchmark tracks:\n\n```bash\n./scripts/routing-quality-baseline.py \\\n  --dataset data/routing_baseline/northern_current_coverage.json \\\n  --backend-base-url http://localhost:8000\n\n./scripts/routing-quality-baseline.py \\\n  --dataset data/routing_baseline/northern_target_tier1_tier2.json \\\n  --backend-base-url http://localhost:8000\n```\n\nArtifacts are written to:\n\n- `data/routing_baseline/reports/*.json`\n- `data/routing_baseline/reports/*.md`\n\nFor raw OSRM diagnostics (HTTP code, `code`, snapped waypoints, distance/duration):\n\n```bash\n./scripts/osrm-route-diagnostics.py \\\n  --dataset data/routing_baseline/northern_target_tier1_tier2.json \\\n  --osrm-base-url http://localhost:5001 \\\n  --start-index 8 \\\n  --max-cases 7\n```\n\nIf route responses return `outside_osrm_coverage` or very large snap distances, the loaded OSRM graph does not cover requested points. Rebuild and run with a broader extract.\n\n## Address Search Quality Benchmark\n\nGenerate the benchmark dataset (initial 250 cases):\n\n```bash\npython3 scripts/generate-address-search-benchmark.py --cases 250\n```\n\nGenerate the expanded v2 dataset (500 cases):\n\n```bash\npython3 scripts/generate-address-search-benchmark.py \\\n  --version v2 \\\n  --cases 500 \\\n  --output data/search_quality/address_ranking_benchmark_v2_500.json\n```\n\nEvaluate deterministic ranking quality:\n\n```bash\npython3 scripts/evaluate-address-search-quality.py \\\n  --dataset data/search_quality/address_ranking_benchmark_v1_250.json \\\n  --min-top1 0.75 \\\n  --min-top3 0.90 \\\n  --min-routeable 0.90\n```\n\nReports are written to:\n\n- `data/search_quality/reports/latest.json`\n- `data/search_quality/reports/latest.md`\n\n## Daily Review Loop\n\nAt the end of each workday:\n\n1. Open the frontend URL.\n2. Test newly listed features from the daily report.\n3. Record feedback in the shared feedback document:\n   - `/Users/abhisheksrivastava/intact-mcp-server/data/user-feedback/map-platform-feedback.md`\n4. Agents use that feedback as input during the next 10 AM ET work cycle.\n\n## Development Artifacts\n\n- Agent run logs (scoped, per iteration): `docs/agent-runs/`\n- Implementation results (what shipped in local dev): `docs/implementation-results/`\n\n## Verification Notes\n\n`./scripts/verify.sh` compiles backend Python with `PYTHONPYCACHEPREFIX` set to a writable `/tmp` path. It runs the frontend production build when `frontend/node_modules` is installed and `frontend/` is writable. In restricted automation environments where Vite cannot create temporary config files under `frontend/`, the script skips the frontend build explicitly instead of failing with an `EPERM` sandbox error.\n","expected_sha256":"6ca570a9614b7c7f52558a00dc93a2893148901008be485ab51d529223fc7994","change_request_path":"map-platform-change-requests/2026-05-14T23-20-20-094Z-clarify-local-smoke-tests-by-router-mode.md","approval_note":"Approved scoped docs-only clarification to align local smoke tests with active router mode and reduce false-negative routing checks."}}
---
{"tool":"record_map_platform_implementation_result","args":{"title":"Clarify local smoke tests by router mode","change_request_path":"map-platform-change-requests/2026-05-14T23-20-20-094Z-clarify-local-smoke-tests-by-router-mode.md","changed_files":["docs/development_interface.md"],"commands_run":[],"result":"passed","notes":"Updated the development interface guide to split local smoke tests by active router mode, added backend /route verification for both custom-router and OSRM paths, and documented the key interpretation when router-specific curl passes but backend forwarding fails.","residual_risks":["Documentation change was reviewed against existing router README guidance, but no live service verification was run in this loop."]}}
{"tool":"record_map_platform_implementation_result","args":{"title":"Clarify local smoke tests by router mode","change_request_path":"map-platform-change-requests/2026-05-14T23-20-20-094Z-clarify-local-smoke-tests-by-router-mode.md","changed_files":["docs/development_interface.md"],"commands_run":[],"result":"passed","notes":"Updated the development interface guide to split local smoke tests by active router mode, added backend /route verification for both custom-router and OSRM paths, and documented the key interpretation when router-specific curl passes but backend forwarding fails.","residual_risks":["Documentation change was reviewed against existing router README guidance, but no live service verification was run in this loop."]}}
---
{"finish":{"status":"completed","summary":"Completed a scoped docs-only change in docs/development_interface.md to clarify local smoke tests by active router mode, recorded under the approved change request and implementation result.","changed_files":["docs/development_interface.md"],"verification":["Documentation review for accuracy against existing router README guidance"],"residual_risks":["No live service verification was run in this loop; guidance was aligned by documentation review only."]}}
---
{"status":"finished","summary":"Completed a scoped docs-only change in docs/development_interface.md clarifying local smoke tests by active router mode, created and used change request map-platform-change-requests/2026-05-14T23-20-20-094Z-clarify-local-smoke-tests-by-router-mode.md, and recorded the implementation result as passed."}
---
{"finish":{"message":"Completed the scoped docs change and recorded the implementation result. No further MCP action is required."}}
---
{"finish":{"message":"Completed the scoped docs change and recorded the implementation result. No further tool action is required for this task."}}
---
{"finish":{"title":"Clarify local smoke tests by router mode","summary":"Completed a scoped docs-only change to docs/development_interface.md, wrote the update successfully, and recorded the implementation result. No further MCP action is required for this task.","changed_files":["docs/development_interface.md"],"change_request_path":"map-platform-change-requests/2026-05-14T23-20-20-094Z-clarify-local-smoke-tests-by-router-mode.md","implementation_result":"passed"}}
- $ git worktree add --detach /tmp/map-platform-agent-xy8ifza3/worktree HEAD
cwd: /Users/abhisheksrivastava/map_platform
exit: 0
stdout:
HEAD is now at 6796830 agent-run: map-platform host iteration
stderr:
Preparing worktree (detached HEAD 6796830)
- $ git diff --check
cwd: /tmp/map-platform-agent-xy8ifza3/worktree
exit: 0
- Generated diff validation:
- $ git apply --check --whitespace=nowarn -
cwd: /Users/abhisheksrivastava/map_platform
exit: 0
- $ bash ./scripts/verify.sh
cwd: /tmp/map-platform-agent-xy8ifza3/worktree
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
- $ git worktree remove --force /tmp/map-platform-agent-xy8ifza3/worktree
cwd: /Users/abhisheksrivastava/map_platform
exit: 0
- $ git worktree prune
cwd: /Users/abhisheksrivastava/map_platform
exit: 0
- $ bash ./scripts/verify.sh
cwd: /tmp/map-platform-agent-xy8ifza3/worktree
exit: 0
stdout:
Skipping frontend build: frontend/node_modules is not installed.
Run: npm --prefix frontend install && npm --prefix frontend run build
stderr:
ssssssssssssssssssssssssss
----------------------------------------------------------------------
Ran 26 tests in 0.000s

OK (skipped=26)
- map_platform: $ git status --porcelain -- docs/development_interface.md
cwd: /Users/abhisheksrivastava/map_platform
exit: 0
stdout:
M docs/development_interface.md
- map_platform: $ git add -- docs/development_interface.md
cwd: /Users/abhisheksrivastava/map_platform
exit: 0
- map_platform: $ git diff --cached --check
cwd: /Users/abhisheksrivastava/map_platform
exit: 0
- map_platform: $ git commit -m agent-run: map-platform host iteration
cwd: /Users/abhisheksrivastava/map_platform
exit: 0
stdout:
[main 1df95d9] agent-run: map-platform host iteration
 1 file changed, 17 insertions(+)
- map_platform: $ git push origin main
cwd: /Users/abhisheksrivastava/map_platform
exit: 0
stderr:
To github.com:abhisheks810/map_platform.git
   6796830..1df95d9  main -> main

## Git Finalization

- map_platform: $ git status --porcelain -- docs/development_interface.md
cwd: /Users/abhisheksrivastava/map_platform
exit: 0
stdout:
M docs/development_interface.md
- map_platform: $ git add -- docs/development_interface.md
cwd: /Users/abhisheksrivastava/map_platform
exit: 0
- map_platform: $ git diff --cached --check
cwd: /Users/abhisheksrivastava/map_platform
exit: 0
- map_platform: $ git commit -m agent-run: map-platform host iteration
cwd: /Users/abhisheksrivastava/map_platform
exit: 0
stdout:
[main 1df95d9] agent-run: map-platform host iteration
 1 file changed, 17 insertions(+)
- map_platform: $ git push origin main
cwd: /Users/abhisheksrivastava/map_platform
exit: 0
stderr:
To github.com:abhisheks810/map_platform.git
   6796830..1df95d9  main -> main

## Blockers

- None
