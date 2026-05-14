# Implementation Result: host map-platform loop

Created: 2026-05-14T22:20:54.822111Z
Status: completed

## Summary

Completed a scoped documentation update in docs/development_interface.md to clarify that local frontend sessions may run on localhost:3000 or localhost:5173 and that developers should trust the terminal-reported frontend URL when validating backend/router connectivity. Change request created, file updated, and implementation result recorded.

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
      "reason": "Inspect current routing troubleshooting guidance so the next bounded task can improve dev-interface reliability/custom router documentation without duplicating recent work."
    }
  },
  {
    "tool_result": {
      "tool": "read_map_platform_file",
      "ok": true,
      "output": "# Router Local Verification\n\nThis document captures the minimum local checks for route service reliability during development.\n\n## Purpose\n\n- Confirm the routing service is reachable before testing the UI.\n- Make route failure modes easier to diagnose.\n- Provide a fallback checklist when the UI shows `load failed`.\n\n## Default local assumptions\n\nUnless your local setup intentionally overrides them, use these assumptions while debugging:\n\n- The router is expected to be reachable at `http://localhost:5001` when the backend is configured to use OSRM.\n- The UI should call the same host and port that you validated with curl.\n- A mismatch between the UI target port and the running router port can appear in the browser as a generic `load failed` error.\n- The recommended non-Docker local development flow defaults to the internal custom router (`ROUTER_PROVIDER=intact`) rather than OSRM.\n\nIf your environment uses a different port, update the curl commands and verify the browser request matches that override exactly.\n\n## Choose the router mode first\n\nBefore debugging a route failure, confirm which router implementation your backend is using:\n\n- Non-Docker local development defaults to the internal custom router at `http://localhost:8090`.\n- OSRM debugging only applies when you intentionally start the backend with `ROUTER_PROVIDER=osrm`.\n- If you are unsure which local services should be running, see `docs/development_interface.md`.\n\nTo force OSRM in local development:\n\n```bash\nROUTER_PROVIDER=osrm ./scripts/start-backend.sh\n```\n\nTo explicitly use the internal custom router instead:\n\n```bash\nROUTER_PROVIDER=intact ./scripts/start-backend.sh\n```\n\n## Health checks\n\nVerify the route service is listening on the expected local port before opening the app UI.\n\n### Basic HTTP reachability\n\n```bash\ncurl -i http://localhost:5001/\n```\n\nExpected result:\n\n- Any non-network response confirms the process is reachable.\n- Connection refused or timeout means the router is not available to the UI.\n\n### Route API contract smoke test\n\nUse a simple request against the route endpoint with origin and destination coordinates.\n\n```bash\ncurl -s \"http://localhost:5001/route?origin=77.5946,12.9716&destination=77.6097,12.9601\"\n```\n\nExpected result:\n\n- HTTP 200.\n- JSON response.\n- A route payload with coordinates, geometry, or steps depending on the active implementation.\n\nIf the service returns a structured error, the router is reachable and the issue is likely request formatting or data coverage rather than a full service outage.\n\n## Automated diagnosis\n\nIf you are not sure whether the failure is caused by the frontend, backend, or router process, run the repo-local doctor first:\n\n```bash\n./scripts/doctor-dev-interface.sh\n```\n\nUse the doctor script before deeper manual debugging when:\n\n- the browser shows a generic `load failed` or network error,\n- you are unsure whether localhost services are actually up, or\n- you want a quick check of the backend `/route` path in the expected local configuration.\n\n## Browser network inspection\n\nIf curl succeeds but the UI still reports `load failed`, inspect the browser network request directly:\n\n1. Open developer tools and go to the **Network** tab.\n2. Press **Get Route** in the UI.\n3. Find the request to the route endpoint.\n4. Confirm the request URL uses the expected host, port, path, and query parameter names.\n5. Compare the browser response status or network error with the curl result.\n\nUseful signals:\n\n- No request in the network panel usually means the UI action did not trigger the API call.\n- `ERR_CONNECTION_REFUSED`, timeout, or CORS-style browser errors usually indicate environment or connectivity issues rather than bad route data.\n- A visible HTTP error response means the router is reachable and returned a debuggable failure.\n\n## UI failure-mode checklist\n\nIf the development UI reports `load failed` after pressing **Get Route**:\n\n1. Confirm the browser request is targeting the expected route service host and port.\n2. Confirm the backend is using the router implementation you expect for this session.\n3. Run the curl checks above outside the browser.\n4. Run `./scripts/doctor-dev-interface.sh` to check the broader local stack.\n5. Verify origin and destination were both resolved to coordinates, not just label strings.\n6. Compare the UI request query parameter names with the route API contract.\n7. Check whether the selected coordinates are inside the local graph or extract coverage area.\n\n## Fallback behavior expectation\n\nThe preferred debugging sequence is:\n\n1. Distinguish router unavailable from router returned error.\n2. Surface actionable logs in the API or browser console.\n3. Preserve the resolved place inputs so a user can retry without retyping.\n\n## Suggested manual QA script\n\n1. Confirm whether the backend should be using OSRM or the internal custom router.\n2. Start the local routing service.\n3. Run the reachability check.\n4. Run the route API smoke test.\n5. Open the development UI.\n6. Trigger **Get Route** and inspect the browser network request if the UI still fails.\n7. Run the doctor script if the failure crosses frontend, backend, and router boundaries.\n",
      "data": "# Router Local Verification\n\nThis document captures the minimum local checks for route service reliability during development.\n\n## Purpose\n\n- Confirm the routing service is reachable before testing the UI.\n- Make route failure modes easier to diagnose.\n- Provide a fallback checklist when the UI shows `load failed`.\n\n## Default local assumptions\n\nUnless your local setup intentionally overrides them, use these assumptions while debugging:\n\n- The router is expected to be reachable at `http://localhost:5001` when the backend is configured to use OSRM.\n- The UI should call the same host and port that you validated with curl.\n- A mismatch between the UI target port and the running router port can appear in the browser as a generic `load failed` error.\n- The recommended non-Docker local development flow defaults to the internal custom router (`ROUTER_PROVIDER=intact`) rather than OSRM.\n\nIf your environment uses a different port, update the curl commands and verify the browser request matches that override exactly.\n\n## Choose the router mode first\n\nBefore debugging a route failure, confirm which router implementation your backend is using:\n\n- Non-Docker local development defaults to the internal custom router at `http://localhost:8090`.\n- OSRM debugging only applies when you intentionally start the backend with `ROUTER_PROVIDER=osrm`.\n- If you are unsure which local services should be running, see `docs/development_interface.md`.\n\nTo force OSRM in local development:\n\n```bash\nROUTER_PROVIDER=osrm ./scripts/start-backend.sh\n```\n\nTo explicitly use the internal custom router instead:\n\n```bash\nROUTER_PROVIDER=intact ./scripts/start-backend.sh\n```\n\n## Health checks\n\nVerify the route service is listening on the expected local port before opening the app UI.\n\n### Basic HTTP reachability\n\n```bash\ncurl -i http://localhost:5001/\n```\n\nExpected result:\n\n- Any non-network response confirms the process is reachable.\n- Connection refused or timeout means the router is not available to the UI.\n\n### Route API contract smoke test\n\nUse a simple request against the route endpoint with origin and destination coordinates.\n\n```bash\ncurl -s \"http://localhost:5001/route?origin=77.5946,12.9716&destination=77.6097,12.9601\"\n```\n\nExpected result:\n\n- HTTP 200.\n- JSON response.\n- A route payload with coordinates, geometry, or steps depending on the active implementation.\n\nIf the service returns a structured error, the router is reachable and the issue is likely request formatting or data coverage rather than a full service outage.\n\n## Automated diagnosis\n\nIf you are not sure whether the failure is caused by the frontend, backend, or router process, run the repo-local doctor first:\n\n```bash\n./scripts/doctor-dev-interface.sh\n```\n\nUse the doctor script before deeper manual debugging when:\n\n- the browser shows a generic `load failed` or network error,\n- you are unsure whether localhost services are actually up, or\n- you want a quick check of the backend `/route` path in the expected local configuration.\n\n## Browser network inspection\n\nIf curl succeeds but the UI still reports `load failed`, inspect the browser network request directly:\n\n1. Open developer tools and go to the **Network** tab.\n2. Press **Get Route** in the UI.\n3. Find the request to the route endpoint.\n4. Confirm the request URL uses the expected host, port, path, and query parameter names.\n5. Compare the browser response status or network error with the curl result.\n\nUseful signals:\n\n- No request in the network panel usually means the UI action did not trigger the API call.\n- `ERR_CONNECTION_REFUSED`, timeout, or CORS-style browser errors usually indicate environment or connectivity issues rather than bad route data.\n- A visible HTTP error response means the router is reachable and returned a debuggable failure.\n\n## UI failure-mode checklist\n\nIf the development UI reports `load failed` after pressing **Get Route**:\n\n1. Confirm the browser request is targeting the expected route service host and port.\n2. Confirm the backend is using the router implementation you expect for this session.\n3. Run the curl checks above outside the browser.\n4. Run `./scripts/doctor-dev-interface.sh` to check the broader local stack.\n5. Verify origin and destination were both resolved to coordinates, not just label strings.\n6. Compare the UI request query parameter names with the route API contract.\n7. Check whether the selected coordinates are inside the local graph or extract coverage area.\n\n## Fallback behavior expectation\n\nThe preferred debugging sequence is:\n\n1. Distinguish router unavailable from router returned error.\n2. Surface actionable logs in the API or browser console.\n3. Preserve the resolved place inputs so a user can retry without retyping.\n\n## Suggested manual QA script\n\n1. Confirm whether the backend should be using OSRM or the internal custom router.\n2. Start the local routing service.\n3. Run the reachability check.\n4. Run the route API smoke test.\n5. Open the development UI.\n6. Trigger **Get Route** and inspect the browser network request if the UI still fails.\n7. Run the doctor script if the failure crosses frontend, backend, and router boundaries.\n"
    }
  },
  {
    "action": {
      "tool": "read_map_platform_file",
      "args": {
        "path": "docs/development_interface.md"
      },
      "reason": "Inspect related local development guidance to identify a small, consistent doc fix around router-mode defaults and troubleshooting before making a scoped change."
    }
  },
  {
    "tool_result": {
      "tool": "read_map_platform_file",
      "ok": true,
      "output": "# Development Interface\n\nThis project should always expose a testable development interface for daily review.\n\n## Default Local URLs\n\n| Service | URL | Purpose |\n| --- | --- | --- |\n| Frontend | http://localhost:3000 | Main development UI |\n| Backend | http://localhost:8000 | FastAPI gateway |\n| Geocoder | http://localhost:8080 | Nominatim proxy |\n| Custom Router | http://localhost:8090 | Internal OSRM replacement path |\n| Router | http://localhost:5001 | OSRM route service |\n| Tileserver | http://localhost:8081 | Optional local tiles |\n\n## Start Full Stack\n\nUse Docker Compose when you want the closest local integration environment:\n\n```bash\ndocker-compose up --build\n```\n\nThe router requires prepared OSRM data under `data/`. If routing data is missing, geocoding and frontend work can still be developed independently, but route calls will fail.\n\nFor realistic road routing in the local Docker stack, prepare the Northern Zone OSRM data first:\n\n```bash\n./scripts/download-osm-extract.sh\n./scripts/build-osrm-routing-data.sh\nROUTER_PROVIDER=osrm docker compose up --build\n```\n\nFor broader northern Tier-1/Tier-2 city coverage, switch to India-wide extract and matching router env:\n\n```bash\nEXTRACT_SLUG=india DATASET=india-latest ./scripts/download-osm-extract.sh\nDATASET=india-latest ROUTER_REGION=india ./scripts/build-osrm-routing-data.sh\nROUTER_REGION=india ROUTER_DATASET=india-latest ROUTER_PROVIDER=osrm docker compose up --build\n```\n\nTo scale coverage region-by-region (without loading all-India at once), run multiple OSRM shards and broker in backend:\n\n```bash\n# Build each region separately (example names)\nDATASET=northern-zone-latest ROUTER_REGION=northern-zone ./scripts/build-osrm-routing-data.sh\nDATASET=region-b-latest ROUTER_REGION=region-b ./scripts/build-osrm-routing-data.sh\nDATASET=region-c-latest ROUTER_REGION=region-c ./scripts/build-osrm-routing-data.sh\n\n# Start shard routers\nROUTER_REGION_B=region-b ROUTER_DATASET_B=region-b-latest \\\nROUTER_REGION_C=region-c ROUTER_DATASET_C=region-c-latest \\\nROUTER_REGION_D=region-d ROUTER_DATASET_D=region-d-latest \\\ndocker compose --profile multi_osrm up -d router router_b router_c router_d\n\n# Backend chooses the shard where both endpoints snap within threshold\nOSRM_ROUTER_HOSTS=\"north=http://router:5000,rb=http://router_b:5000,rc=http://router_c:5000,rd=http://router_d:5000\" \\\nROUTER_PROVIDER=osrm docker compose up -d backend\n```\n\nNotes:\n- This achieves incremental **intra-city** coverage.\n- For cross-country routing between distant regions, a wider connected dataset is still required.\n\nOne-command startup for the current north+central+eastern shard layout:\n\n```bash\n./scripts/start-regional-osrm-stack.sh\n```\n\nFor six-zone India coverage plus cross-region routes:\n\n```bash\n./scripts/download-missing-india-zone-extracts.sh\n./scripts/build-missing-india-zone-routing-data.sh\nOSRM_THREADS=2 ./scripts/build-india-merged-routing-data.sh\n./scripts/start-regional-osrm-stack.sh\n```\n\nNotes:\n- Zonal Docker routers (`5001`-`5006`) cover local routing quality.\n- Merged global router (`0.0.0.0:5007` on host, consumed as `host.docker.internal:5007` by backend) handles cross-region trips.\n- `./scripts/start-regional-osrm-stack.sh` now launches the full integrated stack and auto-wires global fallback.\n- Backend fallback to global graph is automatic when no zonal shard covers both endpoints.\n\n### Manual Launch (Integrated Stack)\n\nUse this when you want the complete integrated map platform service with full routing fallback:\n\n```bash\ncd /Users/abhisheksrivastava/map_platform\n./scripts/start-regional-osrm-stack.sh\n./scripts/dev-frontend.sh\n```\n\nThen open:\n\n- UI: http://localhost:5173 (or the Vite port printed in terminal)\n- Backend: http://localhost:8000\n\nQuick validation:\n\n```bash\ncurl \"http://localhost:8000/route?origin=28.1834229,80.7131272&destination=17.3616024,78.4746421\"\n```\n\nExpected in response:\n- `\"router_name\":\"india-merged\"`\n- `\"used_global_fallback\":true`\n\n## Start Frontend Only\n\nUse this when reviewing frontend-only changes:\n\n```bash\nnpm --prefix frontend install\nnpm --prefix frontend run dev -- --host 0.0.0.0\n```\n\nThe frontend expects the backend at `http://localhost:8000` unless `VITE_API_BASE` is changed.\n\n## Start Local App Without Docker\n\nThis is the recommended path for daily review when OSRM routing data is not prepared.\n\nTerminal 1:\n\n```bash\n./scripts/setup-local-python.sh\n./scripts/start-geocoder.sh\n```\n\nTerminal 2:\n\n```bash\n./scripts/start-custom-router.sh\n```\n\nTerminal 3:\n\n```bash\n./scripts/start-backend.sh\n```\n\nTerminal 4:\n\n```bash\n./scripts/dev-frontend.sh\n```\n\nOr start all three processes from one terminal:\n\n```bash\n./scripts/dev-local-stack.sh\n```\n\nExpected URLs:\n\n- Frontend: http://localhost:3000, or the next free Vite port if 3000 is busy.\n- Backend: http://localhost:8000\n- Geocoder: http://localhost:8080\n- Custom Router: http://localhost:8090\n\nBy default, the non-Docker local dev path uses the internal `custom_router` (`ROUTER_PROVIDER=intact`).\n\nTo force OSRM in local dev (when OSRM is running at `http://localhost:5001`):\n\n```bash\nROUTER_PROVIDER=osrm ./scripts/start-backend.sh\n```\n\nTo explicitly test the internal custom router:\n\n```bash\nROUTER_PROVIDER=intact ./scripts/start-backend.sh\n```\n\n## Local Smoke Tests\n\n```bash\ncurl http://localhost:8000/\ncurl \"http://localhost:8000/geocode?address=Connaught%20Place%2C%20Delhi&limit=1\"\ncurl http://localhost:8090/\ncurl \"http://localhost:8090/route?origin=28.6314022,77.2193791&destination=28.6129,77.2295\"\n```\n\nOr run the automated dev-interface doctor:\n\n```bash\n./scripts/doctor-dev-interface.sh\n```\n\n## Verify Current Build\n\n```bash\n./scripts/verify.sh\n```\n\nThis runs Python compile checks and the frontend production build when dependencies are installed.\n\n## Agent Loop Publish Guardrails\n\nUse these scripts to make loop runs fail fast on environment issues and finish only after clean push/finalize:\n\n```bash\n# Preflight: run before development work\nbash ./scripts/loop-preflight.sh --require-clean\n\n# Finalize: run at the end of a successful loop\nbash ./scripts/loop-finalize.sh \\\n  --commit-message \"scoped loop change summary\" \\\n  --worktree-path \"/Users/abhisheksrivastava/.codex/worktrees/<id>/map_platform\"\n```\n\n`loop-preflight.sh` checks remote configuration, DNS resolution for GitHub, and remote auth reachability.\n`loop-finalize.sh` runs verification, fast-forward sync, commit/push with retries, clean-status enforcement, and best-effort worktree prune.\n\nIf preflight fails, mark the loop as failed immediately and do not continue development inside that run.\n\n## Routing Quality Baseline\n\nUse two benchmark tracks:\n\n```bash\n./scripts/routing-quality-baseline.py \\\n  --dataset data/routing_baseline/northern_current_coverage.json \\\n  --backend-base-url http://localhost:8000\n\n./scripts/routing-quality-baseline.py \\\n  --dataset data/routing_baseline/northern_target_tier1_tier2.json \\\n  --backend-base-url http://localhost:8000\n```\n\nArtifacts are written to:\n\n- `data/routing_baseline/reports/*.json`\n- `data/routing_baseline/reports/*.md`\n\nFor raw OSRM diagnostics (HTTP code, `code`, snapped waypoints, distance/duration):\n\n```bash\n./scripts/osrm-route-diagnostics.py \\\n  --dataset data/routing_baseline/northern_target_tier1_tier2.json \\\n  --osrm-base-url http://localhost:5001 \\\n  --start-index 8 \\\n  --max-cases 7\n```\n\nIf route responses return `outside_osrm_coverage` or very large snap distances, the loaded OSRM graph does not cover requested points. Rebuild and run with a broader extract.\n\n## Address Search Quality Benchmark\n\nGenerate the benchmark dataset (initial 250 cases):\n\n```bash\npython3 scripts/generate-address-search-benchmark.py --cases 250\n```\n\nGenerate the expanded v2 dataset (500 cases):\n\n```bash\npython3 scripts/generate-address-search-benchmark.py \\\n  --version v2 \\\n  --cases 500 \\\n  --output data/search_quality/address_ranking_benchmark_v2_500.json\n```\n\nEvaluate deterministic ranking quality:\n\n```bash\npython3 scripts/evaluate-address-search-quality.py \\\n  --dataset data/search_quality/address_ranking_benchmark_v1_250.json \\\n  --min-top1 0.75 \\\n  --min-top3 0.90 \\\n  --min-routeable 0.90\n```\n\nReports are written to:\n\n- `data/search_quality/reports/latest.json`\n-
- Generated diff:
- diff --git a/docs/development_interface.md b/docs/development_interface.md
index 9e78f4e..f03ca94 100644
--- a/docs/development_interface.md
+++ b/docs/development_interface.md
@@ -13,6 +13,8 @@ This project should always expose a testable development interface for daily rev
 | Router | http://localhost:5001 | OSRM route service |
 | Tileserver | http://localhost:8081 | Optional local tiles |

+The frontend examples below may also appear on `http://localhost:5173` when launched with the repo Vite script. Use the actual terminal-reported frontend URL for your session when validating backend and router connectivity.
+
 ## Start Full Stack

 Use Docker Compose when you want the closest local integration environment:
@@ -156,7 +158,7 @@ Or start all three processes from one terminal:

 Expected URLs:

-- Frontend: http://localhost:3000, or the next free Vite port if 3000 is busy.
+- Frontend: http://localhost:3000, or the next free Vite port if 3000 is busy. In some repo-local flows the frontend may instead start on http://localhost:5173, so prefer the URL printed by the frontend terminal.
 - Backend: http://localhost:8000
 - Geocoder: http://localhost:8080
 - Custom Router: http://localhost:8090

- Raw model responses:
- {"tool":"read_map_platform_file","args":{"path":"router/README.md"},"reason":"Inspect current routing troubleshooting guidance so the next bounded task can improve dev-interface reliability/custom router documentation without duplicating recent work."}
---
{"tool":"read_map_platform_file","args":{"path":"docs/development_interface.md"},"reason":"Inspect related local development guidance to identify a small, consistent doc fix around router-mode defaults and troubleshooting before making a scoped change."}
{"tool":"read_map_platform_file","args":{"path":"docs/development_interface.md"},"reason":"Inspect related local development guidance to identify a small, consistent doc fix around router-mode defaults and troubleshooting before making a scoped change."}
---
{"tool":"create_map_platform_change_request","args":{"title":"Clarify frontend local port in development interface docs","agent":"report-agent","objective":"Make the recommended non-Docker development interface documentation consistent with the actual frontend local URL examples by clarifying the Vite default port and reducing confusion during router troubleshooting.","allowed_files":["docs/development_interface.md"],"verification":["Review docs/development_interface.md for consistent frontend local URL guidance"],"approval_note":"Scoped documentation-only clarification to improve local development troubleshooting consistency."}}
{}
---
{"tool":"get_map_platform_file_metadata","args":{"path":"docs/development_interface.md"},"reason":"Fetch current file hash before making the scoped documentation clarification in docs/development_interface.md."}
{"tool":"get_map_platform_file_metadata","args":{"path":"docs/development_interface.md"},"reason":"Fetch current file hash before making the scoped documentation clarification in docs/development_interface.md."}
---
{"tool":"write_map_platform_file","args":{"path":"docs/development_interface.md","expected_sha256":"852fc41fd2d893ceca8cd9fcbfabd5b9f7cad58eb4fa9d784ecee0ab0a74b5c2","change_request_path":"map-platform-change-requests/2026-05-14T22-20-17-131Z-clarify-frontend-local-port-in-development-interface-docs.md","approval_note":"Scoped documentation-only clarification to improve local development troubleshooting consistency.","content":"# Development Interface\n\nThis project should always expose a testable development interface for daily review.\n\n## Default Local URLs\n\n| Service | URL | Purpose |\n| --- | --- | --- |\n| Frontend | http://localhost:3000 | Main development UI |\n| Backend | http://localhost:8000 | FastAPI gateway |\n| Geocoder | http://localhost:8080 | Nominatim proxy |\n| Custom Router | http://localhost:8090 | Internal OSRM replacement path |\n| Router | http://localhost:5001 | OSRM route service |\n| Tileserver | http://localhost:8081 | Optional local tiles |\n\nThe frontend examples below may also appear on `http://localhost:5173` when launched with the repo Vite script. Use the actual terminal-reported frontend URL for your session when validating backend and router connectivity.\n\n## Start Full Stack\n\nUse Docker Compose when you want the closest local integration environment:\n\n```bash\ndocker-compose up --build\n```\n\nThe router requires prepared OSRM data under `data/`. If routing data is missing, geocoding and frontend work can still be developed independently, but route calls will fail.\n\nFor realistic road routing in the local Docker stack, prepare the Northern Zone OSRM data first:\n\n```bash\n./scripts/download-osm-extract.sh\n./scripts/build-osrm-routing-data.sh\nROUTER_PROVIDER=osrm docker compose up --build\n```\n\nFor broader northern Tier-1/Tier-2 city coverage, switch to India-wide extract and matching router env:\n\n```bash\nEXTRACT_SLUG=india DATASET=india-latest ./scripts/download-osm-extract.sh\nDATASET=india-latest ROUTER_REGION=india ./scripts/build-osrm-routing-data.sh\nROUTER_REGION=india ROUTER_DATASET=india-latest ROUTER_PROVIDER=osrm docker compose up --build\n```\n\nTo scale coverage region-by-region (without loading all-India at once), run multiple OSRM shards and broker in backend:\n\n```bash\n# Build each region separately (example names)\nDATASET=northern-zone-latest ROUTER_REGION=northern-zone ./scripts/build-osrm-routing-data.sh\nDATASET=region-b-latest ROUTER_REGION=region-b ./scripts/build-osrm-routing-data.sh\nDATASET=region-c-latest ROUTER_REGION=region-c ./scripts/build-osrm-routing-data.sh\n\n# Start shard routers\nROUTER_REGION_B=region-b ROUTER_DATASET_B=region-b-latest \\\nROUTER_REGION_C=region-c ROUTER_DATASET_C=region-c-latest \\\nROUTER_REGION_D=region-d ROUTER_DATASET_D=region-d-latest \\\ndocker compose --profile multi_osrm up -d router router_b router_c router_d\n\n# Backend chooses the shard where both endpoints snap within threshold\nOSRM_ROUTER_HOSTS=\"north=http://router:5000,rb=http://router_b:5000,rc=http://router_c:5000,rd=http://router_d:5000\" \\\nROUTER_PROVIDER=osrm docker compose up -d backend\n```\n\nNotes:\n- This achieves incremental **intra-city** coverage.\n- For cross-country routing between distant regions, a wider connected dataset is still required.\n\nOne-command startup for the current north+central+eastern shard layout:\n\n```bash\n./scripts/start-regional-osrm-stack.sh\n```\n\nFor six-zone India coverage plus cross-region routes:\n\n```bash\n./scripts/download-missing-india-zone-extracts.sh\n./scripts/build-missing-india-zone-routing-data.sh\nOSRM_THREADS=2 ./scripts/build-india-merged-routing-data.sh\n./scripts/start-regional-osrm-stack.sh\n```\n\nNotes:\n- Zonal Docker routers (`5001`-`5006`) cover local routing quality.\n- Merged global router (`0.0.0.0:5007` on host, consumed as `host.docker.internal:5007` by backend) handles cross-region trips.\n- `./scripts/start-regional-osrm-stack.sh` now launches the full integrated stack and auto-wires global fallback.\n- Backend fallback to global graph is automatic when no zonal shard covers both endpoints.\n\n### Manual Launch (Integrated Stack)\n\nUse this when you want the complete integrated map platform service with full routing fallback:\n\n```bash\ncd /Users/abhisheksrivastava/map_platform\n./scripts/start-regional-osrm-stack.sh\n./scripts/dev-frontend.sh\n```\n\nThen open:\n\n- UI: http://localhost:5173 (or the Vite port printed in terminal)\n- Backend: http://localhost:8000\n\nQuick validation:\n\n```bash\ncurl \"http://localhost:8000/route?origin=28.1834229,80.7131272&destination=17.3616024,78.4746421\"\n```\n\nExpected in response:\n- `\"router_name\":\"india-merged\"`\n- `\"used_global_fallback\":true`\n\n## Start Frontend Only\n\nUse this when reviewing frontend-only changes:\n\n```bash\nnpm --prefix frontend install\nnpm --prefix frontend run dev -- --host 0.0.0.0\n```\n\nThe frontend expects the backend at `http://localhost:8000` unless `VITE_API_BASE` is changed.\n\n## Start Local App Without Docker\n\nThis is the recommended path for daily review when OSRM routing data is not prepared.\n\nTerminal 1:\n\n```bash\n./scripts/setup-local-python.sh\n./scripts/start-geocoder.sh\n```\n\nTerminal 2:\n\n```bash\n./scripts/start-custom-router.sh\n```\n\nTerminal 3:\n\n```bash\n./scripts/start-backend.sh\n```\n\nTerminal 4:\n\n```bash\n./scripts/dev-frontend.sh\n```\n\nOr start all three processes from one terminal:\n\n```bash\n./scripts/dev-local-stack.sh\n```\n\nExpected URLs:\n\n- Frontend: http://localhost:3000, or the next free Vite port if 3000 is busy. In some repo-local flows the frontend may instead start on http://localhost:5173, so prefer the URL printed by the frontend terminal.\n- Backend: http://localhost:8000\n- Geocoder: http://localhost:8080\n- Custom Router: http://localhost:8090\n\nBy default, the non-Docker local dev path uses the internal `custom_router` (`ROUTER_PROVIDER=intact`).\n\nTo force OSRM in local dev (when OSRM is running at `http://localhost:5001`):\n\n```bash\nROUTER_PROVIDER=osrm ./scripts/start-backend.sh\n```\n\nTo explicitly test the internal custom router:\n\n```bash\nROUTER_PROVIDER=intact ./scripts/start-backend.sh\n```\n\n## Local Smoke Tests\n\n```bash\ncurl http://localhost:8000/\ncurl \"http://localhost:8000/geocode?address=Connaught%20Place%2C%20Delhi&limit=1\"\ncurl http://localhost:8090/\ncurl \"http://localhost:8090/route?origin=28.6314022,77.2193791&destination=28.6129,77.2295\"\n```\n\nOr run the automated dev-interface doctor:\n\n```bash\n./scripts/doctor-dev-interface.sh\n```\n\n## Verify Current Build\n\n```bash\n./scripts/verify.sh\n```\n\nThis runs Python compile checks and the frontend production build when dependencies are installed.\n\n## Agent Loop Publish Guardrails\n\nUse these scripts to make loop runs fail fast on environment issues and finish only after clean push/finalize:\n\n```bash\n# Preflight: run before development work\nbash ./scripts/loop-preflight.sh --require-clean\n\n# Finalize: run at the end of a successful loop\nbash ./scripts/loop-finalize.sh \\\n  --commit-message \"scoped loop change summary\" \\\n  --worktree-path \"/Users/abhisheksrivastava/.codex/worktrees/<id>/map_platform\"\n```\n\n`loop-preflight.sh` checks remote configuration, DNS resolution for GitHub, and remote auth reachability.\n`loop-finalize.sh` runs verification, fast-forward sync, commit/push with retries, clean-status enforcement, and best-effort worktree prune.\n\nIf preflight fails, mark the loop as failed immediately and do not continue development inside that run.\n\n## Routing Quality Baseline\n\nUse two benchmark tracks:\n\n```bash\n./scripts/routing-quality-baseline.py \\\n  --dataset data/routing_baseline/northern_current_coverage.json \\\n  --backend-base-url http://localhost:8000\n\n./scripts/routing-quality-baseline.py \\\n  --dataset data/routing_baseline/northern_target_tier1_tier2.json \\\n  --backend-base-url http://localhost:8000\n```\n\nArtifacts are written to:\n\n- `data/routing_baseline/reports/*.json`\n- `data/routing_baseline/reports/*.md`\n\nFor raw OSRM diagnostics (HTTP code, `code`, snapped waypoints, distance/duration):\n\n```bash\n./scripts/osrm-route-diagnostics.py \\\n  --dataset data/routing_baseline/northern_target_tier1_tier2.json \\\n  --osrm-base-url http://localhost:5001 \\\n  --start-index 8 \\\n  --max-cases 7\n```\n\nIf route responses return `outside_osrm_coverage` or very large snap distances, the loaded OSRM graph does not cover requested points. Rebuild and run with a broader extract.\n\n## Address Search Quality Benchmark\n\nGenerate the benchmark dataset (initial 250 cases):\n\n```bash\npython3 scripts/generate-address-search-benchmark.py --cases 250\n```\n\nGenerate the expanded v2 dataset (500 cases):\n\n```bash\npython3 scripts/generate-address-search-benchmark.py \\\n  --version v2 \\\n  --cases 500 \\\n  --output data/search_quality/address_ranking_benchmark_v2_500.json\n```\n\nEvaluate deterministic ranking quality:\n\n```bash\npython3 scripts/evaluate-address-search-quality.py \\\n  --dataset data/search_quality/address_ranking_benchmark_v1_250.json \\\n  --min-top1 0.75 \\\n  --min-top3 0.90 \\\n  --min-routeable 0.90\n```\n\nReports are written to:\n\n- `data/search_quality/reports/latest.json`\n- `data/search_quality/reports/latest.md`\n\n## Daily Review Loop\n\nAt the end of each workday:\n\n1. Open the frontend URL.\n2. Test newly listed features from the daily report.\n3. Record feedback in the shared feedback document:\n   - `/Users/abhisheksrivastava/intact-mcp-server/data/user-feedback/map-platform-feedback.md`\n4. Agents use that feedback as input during the next 10 AM ET work cycle.\n\n## Development Artifacts\n\n- Agent run logs (scoped, per iteration): `docs/agent-runs/`\n- Implementation results (what shipped in local dev): `docs/implementation-results/`\n\n## Verification Notes\n\n`./scripts/verify.sh` compiles backend Python with `PYTHONPYCACHEPREFIX` set to a writable `/tmp` path. It runs the frontend production build when `frontend/node_modules` is installed and `frontend/` is writable. In restricted automation environments where Vite cannot create temporary config files under `frontend/`, the script skips the frontend build explicitly instead of failing with an `EPERM` sandbox error.\n"}}
---
{"tool":"record_map_platform_implementation_result","args":{"title":"Clarify frontend local port in development interface docs","change_request_path":"map-platform-change-requests/2026-05-14T22-20-17-131Z-clarify-frontend-local-port-in-development-interface-docs.md","changed_files":["docs/development_interface.md"],"commands_run":[],"result":"passed","notes":"Updated development interface documentation to clarify that frontend local sessions may use either localhost:3000 or the repo Vite default localhost:5173, and instructed developers to trust the terminal-reported frontend URL when validating backend and router connectivity.","residual_risks":["router/README.md still references frontend troubleshooting context separately and may benefit from matching wording in a future docs-only pass","No runtime verification was needed because this was a scoped documentation clarification only"]}}
---
{"tool":"finish","args":{"status":"completed","summary":"Completed a scoped documentation update in docs/development_interface.md to clarify that local frontend sessions may run on localhost:3000 or localhost:5173 and that developers should trust the terminal-reported frontend URL when validating backend/router connectivity. Change request created, file updated, and implementation result recorded."}}
- $ git worktree add --detach /tmp/map-platform-agent-z2n4vi0f/worktree HEAD
cwd: /Users/abhisheksrivastava/map_platform
exit: 0
stdout:
HEAD is now at 77064f8 agent-run: map-platform host iteration
stderr:
Preparing worktree (detached HEAD 77064f8)
- $ git diff --check
cwd: /tmp/map-platform-agent-z2n4vi0f/worktree
exit: 0
- Generated diff validation:
- $ git apply --check --whitespace=nowarn -
cwd: /Users/abhisheksrivastava/map_platform
exit: 0
- $ bash ./scripts/verify.sh
cwd: /tmp/map-platform-agent-z2n4vi0f/worktree
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
- $ git worktree remove --force /tmp/map-platform-agent-z2n4vi0f/worktree
cwd: /Users/abhisheksrivastava/map_platform
exit: 0
- $ git worktree prune
cwd: /Users/abhisheksrivastava/map_platform
exit: 0
- $ bash ./scripts/verify.sh
cwd: /tmp/map-platform-agent-z2n4vi0f/worktree
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
[main 9c66fb6] agent-run: map-platform host iteration
 1 file changed, 3 insertions(+), 1 deletion(-)
- map_platform: $ git push origin main
cwd: /Users/abhisheksrivastava/map_platform
exit: 0
stderr:
To github.com:abhisheks810/map_platform.git
   77064f8..9c66fb6  main -> main

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
[main 9c66fb6] agent-run: map-platform host iteration
 1 file changed, 3 insertions(+), 1 deletion(-)
- map_platform: $ git push origin main
cwd: /Users/abhisheksrivastava/map_platform
exit: 0
stderr:
To github.com:abhisheks810/map_platform.git
   77064f8..9c66fb6  main -> main

## Blockers

- None
