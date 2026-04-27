# Fix "Load failed" On Get Route

Created: 2026-04-25T23:49:00-04:00
Agent: backend-api-agent
Repository: /Users/abhisheksrivastava/map_platform
Status: accepted-for-supervised-implementation
Related task: map-platform-tasks/2026-04-25-fix-route-load-failed.md

## Summary

Make the default non-Docker local dev path route successfully by defaulting to the internal `custom_router` provider (and returning clearer errors when OSRM is unavailable).

## Target Files

- scripts/start-backend.sh
- scripts/dev-local-stack.sh
- docs/development_interface.md
- README.md
- backend/routers/route.py

## Proposed Changes

### scripts/start-backend.sh

When `ROUTER_PROVIDER` is not set:

- default to `intact` for the non-Docker path (`ROUTER_HOST` is `http://localhost:5001`);
- otherwise keep `osrm` as the default (e.g. Docker Compose internal network).

Rationale:

This makes the documented daily-review path work even when OSRM data is not prepared.

### scripts/dev-local-stack.sh

No change required if `scripts/start-backend.sh` selects the provider automatically. (Optional: explicitly `export ROUTER_PROVIDER=intact` for clarity.)

### backend/routers/route.py

Catch OSRM connection/timeout errors and return a JSON error response instead of allowing an unhandled exception to bubble out.

Rationale:

The frontend currently shows a generic fetch failure. Returning JSON errors makes failures debuggable and keeps the UI stable.

### docs/README

Update dev-interface docs to state the default routing provider for the non-Docker path and how to override back to OSRM when desired.

## Patch

Verified against `/Users/abhisheksrivastava/map_platform` on 2026-04-26.

Apply:

```bash
cd /Users/abhisheksrivastava/map_platform
git apply /Users/abhisheksrivastava/intact-mcp-server/exports/map-platform/patches/2026-04-26-fix-route-load-failed.patch
```

Patch:

```diff
--- a/README.md
+++ b/README.md
@@ -67,7 +67,8 @@
 Tileserver (optional) → http://localhost:8081

 2a. Start Local Dev Stack Without Docker
-Use this for daily review when OSRM data is not prepared:
+Use this for daily review when OSRM data is not prepared.
+By default, `./scripts/start-backend.sh` selects `ROUTER_PROVIDER=intact` for the non-Docker local stack. To force OSRM, set `ROUTER_PROVIDER=osrm` (and ensure OSRM is running on `http://localhost:5001`).
 ./scripts/setup-local-python.sh
 ./scripts/start-geocoder.sh
 ./scripts/start-custom-router.sh
@@ -80,7 +81,7 @@
 3. Quick Tests
 Backend health: curl http://localhost:8000/
 Geocode via backend proxy: curl "http://localhost:8000/geocode?address=Connaught%20Place%2C%20Delhi&limit=1"
-Route via backend: curl "http://localhost:8000/route?origin=28.6139,77.2090&destination=28.6129,77.2295"
+Route via backend (defaults to custom router in non-Docker local dev): curl "http://localhost:8000/route?origin=28.6139,77.2090&destination=28.6129,77.2295"
 Route via custom router: curl "http://localhost:8090/route?origin=28.6314022,77.2193791&destination=28.6129,77.2295"
 Route directly from OSRM: curl "http://localhost:5001/route/v1/driving/77.2090,28.6139;77.2295,28.6129?overview=false"


--- a/backend/routers/route.py
+++ b/backend/routers/route.py
@@ -32,20 +32,30 @@
 def route_with_intact(origin: str, destination: str):
     url = f"{CUSTOM_ROUTER_HOST}/route"
     params = {"origin": origin, "destination": destination}
-    with httpx.Client(timeout=15) as client:
-        r = client.get(url, params=params)
-        r.raise_for_status()
-        return r.json()
+    try:
+        with httpx.Client(timeout=15) as client:
+            r = client.get(url, params=params)
+            r.raise_for_status()
+            return r.json()
+    except httpx.RequestError:
+        return {"error": f"Custom router unavailable at {CUSTOM_ROUTER_HOST}. Start it or set ROUTER_PROVIDER=osrm."}
+    except httpx.HTTPStatusError as exc:
+        return {"error": f"Custom router error ({exc.response.status_code})."}


 def route_with_osrm(origin: str, destination: str, o_lat: float, o_lon: float, d_lat: float, d_lon: float):
     url = f"{ROUTER_HOST}/route/v1/driving/{o_lon},{o_lat};{d_lon},{d_lat}"
     params = {"overview": "full", "geometries": "geojson", "steps": "true"}
-    with httpx.Client(timeout=30) as client:
-        r = client.get(url, params=params)
-        # If OSRM isn’t ready or port mapping wrong, this will raise
-        r.raise_for_status()
-        data = r.json()
+    try:
+        with httpx.Client(timeout=30) as client:
+            r = client.get(url, params=params)
+            # If OSRM isn’t ready or port mapping wrong, this will raise
+            r.raise_for_status()
+            data = r.json()
+    except httpx.RequestError:
+        return {"error": f"OSRM unavailable at {ROUTER_HOST}. Start OSRM or set ROUTER_PROVIDER=intact."}
+    except httpx.HTTPStatusError as exc:
+        return {"error": f"OSRM error ({exc.response.status_code})."}

     if not data.get("routes"):
         return {"error": "No route found"}

--- a/docs/development_interface.md
+++ b/docs/development_interface.md
@@ -76,9 +76,17 @@
 - Geocoder: http://localhost:8080
 - Custom Router: http://localhost:8090

-By default, route calls still use OSRM at `http://localhost:5001`. To test the internal custom router:
+By default, the non-Docker local dev path uses the internal `custom_router` (`ROUTER_PROVIDER=intact`).

+To force OSRM in local dev (when OSRM is running at `http://localhost:5001`):
+
 ```bash
+ROUTER_PROVIDER=osrm ./scripts/start-backend.sh
+```
+
+To explicitly test the internal custom router:
+
+```bash
 ROUTER_PROVIDER=intact ./scripts/start-backend.sh
 ```


--- a/scripts/start-backend.sh
+++ b/scripts/start-backend.sh
@@ -12,7 +12,15 @@
 export GEOCODER_HOST="${GEOCODER_HOST:-http://localhost:8080}"
 export ROUTER_HOST="${ROUTER_HOST:-http://localhost:5001}"
 export CUSTOM_ROUTER_HOST="${CUSTOM_ROUTER_HOST:-http://localhost:8090}"
-export ROUTER_PROVIDER="${ROUTER_PROVIDER:-osrm}"
+if [ -z "${ROUTER_PROVIDER:-}" ]; then
+  if [ "$ROUTER_HOST" = "http://localhost:5001" ]; then
+    export ROUTER_PROVIDER="intact"
+  else
+    export ROUTER_PROVIDER="osrm"
+  fi
+else
+  export ROUTER_PROVIDER
+fi

 exec "$VENV/bin/uvicorn" main:app \
   --app-dir "$ROOT/backend" \
```

## Verification

- `./scripts/verify.sh`
- `./scripts/dev-local-stack.sh` then use the UI **Get Route** for Delhi example coordinates.

## Rollback

- Set `ROUTER_PROVIDER=osrm` in local dev.
- Revert the default-provider logic in `scripts/start-backend.sh`.
