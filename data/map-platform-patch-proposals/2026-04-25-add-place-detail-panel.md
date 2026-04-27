# Add Place Detail Panel

Created: 2026-04-25T18:26:00-04:00
Agent: frontend-ux-agent
Repository: /Users/abhisheksrivastava/map_platform
Status: proposed
Related task: map-platform-tasks/2026-04-25-place-detail-panel.md

## Summary

Add a frontend place-detail panel powered by the MVP `Place` contract. This gives the user a visible development surface for local discovery and creates a natural place to add accessibility metadata, provenance, and future sign-language hooks.

## Target Files

- frontend/src/App.jsx
- frontend/src/components/SearchBar.jsx
- frontend/src/components/PlaceDetailPanel.jsx
- frontend/src/index.css

## Proposed Changes

### frontend/src/App.jsx

Track `selectedPlace` state and render `PlaceDetailPanel` when a geocode suggestion is selected.

Rationale:

The app currently only produces route results. A selected place state is the first local-discovery UI boundary.

### frontend/src/components/SearchBar.jsx

Accept an optional `setSelectedPlace` callback and call it when users select a suggestion.

Rationale:

The search component already receives rich `Place` objects. It should pass them upward without disrupting route coordinates.

### frontend/src/components/PlaceDetailPanel.jsx

Create a compact panel that displays place name, category, address, coordinates, confidence, provenance source/license, and accessibility review state.

Rationale:

The user needs a reviewable interface for current feature progress.

### frontend/src/index.css

Add compact styles for the place-detail panel that fit inside the existing floating panel.

Rationale:

The new UI should not obscure the map or break the current route workflow.

## Patch

Apply-ready patch exported at:

- `/Users/abhisheksrivastava/intact-mcp-server/exports/map-platform/patches/2026-04-26-add-place-detail-panel.patch`

Apply:

```bash
cd /Users/abhisheksrivastava/map_platform
git apply /Users/abhisheksrivastava/intact-mcp-server/exports/map-platform/patches/2026-04-26-add-place-detail-panel.patch
```

Change request (pending approval):

- `data/map-platform-change-requests/2026-04-26-add-place-detail-panel.md`

Patch validation (2026-04-26):

- `git apply --check /Users/abhisheksrivastava/intact-mcp-server/exports/map-platform/patches/2026-04-26-add-place-detail-panel.patch` (PASS)
- `git apply --check --reverse /Users/abhisheksrivastava/intact-mcp-server/exports/map-platform/patches/2026-04-26-add-place-detail-panel.patch` (FAIL, not applied yet)

Patch content:

```diff
diff --git a/frontend/src/App.jsx b/frontend/src/App.jsx
index 217f1e1..57e9da7 100644
--- a/frontend/src/App.jsx
+++ b/frontend/src/App.jsx
@@ -2,11 +2,13 @@ import { useState } from "react";
 import MapView from "./components/MapView";
 import SearchBar from "./components/SearchBar";
 import RouteInstructions from "./components/RouteInstructions";
+import PlaceDetailPanel from "./components/PlaceDetailPanel";

 export default function App() {
   const [routeData, setRouteData] = useState(null);
   const [loading, setLoading] = useState(false);
   const [errorMsg, setErrorMsg] = useState("");
+  const [selectedPlace, setSelectedPlace] = useState(null);

   return (
     <div className="app">
@@ -24,8 +26,13 @@ export default function App() {
           setRouteData={setRouteData}
           setLoading={setLoading}
           setErrorMsg={setErrorMsg}
+          setSelectedPlace={setSelectedPlace}
         />

+        {selectedPlace && (
+          <PlaceDetailPanel place={selectedPlace} onClear={() => setSelectedPlace(null)} />
+        )}
+
         {loading && <div style={{ marginTop: 8, fontSize: 14, color: "#6b7280" }}>Finding the best route…</div>}
         {errorMsg && (
           <div style={{ marginTop: 8, fontSize: 14, color: "#b91c1c", background: "#fef2f2", border: "1px solid #fee2e2", borderRadius: 8, padding: 8 }}>

diff --git a/frontend/src/components/SearchBar.jsx b/frontend/src/components/SearchBar.jsx
index 4664839..1f66560 100644
--- a/frontend/src/components/SearchBar.jsx
+++ b/frontend/src/components/SearchBar.jsx
@@ -26,7 +26,7 @@ function placeSublabel(place) {
   return parts.join(" · ");
 }

-export default function SearchBar({ setRouteData, setLoading, setErrorMsg }) {
+export default function SearchBar({ setRouteData, setLoading, setErrorMsg, setSelectedPlace }) {
   const [origin, setOrigin] = useState("");
   const [destination, setDestination] = useState("");
   const [suggestO, setSuggestO] = useState([]);
@@ -118,7 +118,16 @@ export default function SearchBar({ setRouteData, setLoading, setErrorMsg }) {
         {showSO && suggestO.length > 0 && (
           <div className="suggest">
             {suggestO.map((s, i) => (
-              <button key={i} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { setOrigin(s.value); setShowSO(false); }}>
+              <button
+                key={i}
+                type="button"
+                onMouseDown={(e) => e.preventDefault()}
+                onClick={() => {
+                  setOrigin(s.value);
+                  setShowSO(false);
+                  if (typeof setSelectedPlace === "function") setSelectedPlace(s.place);
+                }}
+              >
                 <div className="truncate">{s.label}</div>
                 <div className="sublabel">{s.sublabel || s.value}</div>
               </button>
@@ -140,7 +149,16 @@ export default function SearchBar({ setRouteData, setLoading, setErrorMsg }) {
         {showSD && suggestD.length > 0 && (
           <div className="suggest">
             {suggestD.map((s, i) => (
-              <button key={i} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { setDestination(s.value); setShowSD(false); }}>
+              <button
+                key={i}
+                type="button"
+                onMouseDown={(e) => e.preventDefault()}
+                onClick={() => {
+                  setDestination(s.value);
+                  setShowSD(false);
+                  if (typeof setSelectedPlace === "function") setSelectedPlace(s.place);
+                }}
+              >
                 <div className="truncate">{s.label}</div>
                 <div className="sublabel">{s.sublabel || s.value}</div>
               </button>

diff --git a/b/frontend/src/components/PlaceDetailPanel.jsx b/frontend/src/components/PlaceDetailPanel.jsx
new file mode 100644
index 0000000..610b5b1
--- /dev/null
+++ b/frontend/src/components/PlaceDetailPanel.jsx
@@ -0,0 +1,100 @@
+function maybeString(value) {
+  if (value === null || value === undefined) return "";
+  return String(value);
+}
+
+function maybeNumber(value) {
+  if (value === null || value === undefined) return "";
+  const n = Number(value);
+  return Number.isFinite(n) ? n : "";
+}
+
+function displayValue(value, fallback = "unknown") {
+  const s = maybeString(value).trim();
+  return s ? s : fallback;
+}
+
+export default function PlaceDetailPanel({ place, onClear }) {
+  if (!place || typeof place !== "object") return null;
+
+  const provenance = place.provenance && typeof place.provenance === "object" ? place.provenance : {};
+  const accessibility = place.accessibility && typeof place.accessibility === "object" ? place.accessibility : {};
+
+  const title = displayValue(place.name || place.display_name, "Selected Place");
+  const subtitleParts = [];
+  subtitleParts.push(displayValue(place.category));
+  if (place.address_text) subtitleParts.push(maybeString(place.address_text));
+
+  const subtitle = subtitleParts.filter(Boolean).join(" · ");
+  const lat = maybeNumber(place.lat);
+  const lon = maybeNumber(place.lon);
+  const confidence = maybeNumber(place.confidence);
+
+  return (
+    <div className="placePanel" aria-label="Selected place details">
+      <div className="placePanelHeader">
+        <div style={{ minWidth: 0 }}>
+          <div className="placePanelTitle truncate">{title}</div>
+          {subtitle ? <div className="placePanelSubtitle truncate">{subtitle}</div> : null}
+        </div>
+        <button type="button" className="btn" onClick={onClear} aria-label="Clear selected place">
+          Clear
+        </button>
+      </div>
+
+      <dl className="placePanelDl">
+        <div className="placePanelItem">
+          <dt>Place ID</dt>
+          <dd><code className="placePanelCode">{displayValue(place.id, "(missing)")}</code></dd>
+        </div>
+        <div className="placePanelItem">
+          <dt>Coordinates</dt>
+          <dd><code className="placePanelCode">{lat !== "" && lon !== "" ? `${lat},${lon}` : "unknown"}</code></dd>
+        </div>
+        <div className="placePanelItem">
+          <dt>Confidence</dt>
+          <dd>{confidence !== "" ? `${Math.round(confidence * 100)}%` : "unknown"}</dd>
+        </div>
+        <div className="placePanelItem">
+          <dt>Review Status</dt>
+          <dd>{displayValue(place.review_status)}</dd>
+        </div>
+        <div className="placePanelItem">
+          <dt>Source</dt>
+          <dd>{displayValue(provenance.source)}</dd>
+        </div>
+        <div className="placePanelItem">
+          <dt>License</dt>
+          <dd>{displayValue(provenance.license)}</dd>
+        </div>
+      </dl>
+
+      <div className="placePanelSectionTitle">Accessibility (unverified metadata)</div>
+      <div className="placePanelNote">
+        Do not treat these as verified claims until reviewed.
+      </div>
+      <dl className="placePanelDl placePanelDlSingle">
+        <div className="placePanelItem">
+          <dt>Wheelchair Access</dt>
+          <dd>{displayValue(accessibility.wheelchair_access)}</dd>
+        </div>
+        <div className="placePanelItem">
+          <dt>Step-free Access</dt>
+          <dd>{displayValue(accessibility.step_free_access)}</dd>
+        </div>
+        <div className="placePanelItem">
+          <dt>Accessible Parking</dt>
+          <dd>{displayValue(accessibility.accessible_parking)}</dd>
+        </div>
+        <div className="placePanelItem">
+          <dt>Sign Language Support</dt>
+          <dd>{displayValue(accessibility.sign_language_support)}</dd>
+        </div>
+        <div className="placePanelItem">
+          <dt>Accessibility Review Status</dt>
+          <dd>{displayValue(accessibility.review_status)}</dd>
+        </div>
+      </dl>
+    </div>
+  );
+}

diff --git a/frontend/src/index.css b/frontend/src/index.css
index 497b089..9c5ce12 100644
--- a/frontend/src/index.css
+++ b/frontend/src/index.css
@@ -215,3 +215,78 @@ html, body, #root {
 *::-webkit-scrollbar { width: 10px; }
 *::-webkit-scrollbar-thumb { background: #d4d4d8; border-radius: 9999px; }
 *::-webkit-scrollbar-thumb:hover { background: #a1a1aa; }
+/* ===== Place detail panel ===== */
+.placePanel {
+  margin-top: 12px;
+  border-top: 1px solid #f3f4f6;
+  padding-top: 12px;
+}
+
+.placePanelHeader {
+  display: flex;
+  align-items: flex-start;
+  justify-content: space-between;
+  gap: 8px;
+}
+
+.placePanelTitle {
+  font-size: 14px;
+  font-weight: 600;
+  color: #111827;
+}
+
+.placePanelSubtitle {
+  margin-top: 2px;
+  font-size: 12px;
+  color: #6b7280;
+}
+
+.placePanelDl {
+  margin: 10px 0 0 0;
+  display: grid;
+  grid-template-columns: 1fr 1fr;
+  gap: 10px 12px;
+}
+
+.placePanelDlSingle {
+  grid-template-columns: 1fr;
+}
+
+.placePanelItem dt {
+  font-size: 11px;
+  color: #6b7280;
+}
+
+.placePanelItem dd {
+  margin: 2px 0 0 0;
+  font-size: 13px;
+  color: #111827;
+}
+
+.placePanelCode {
+  display: inline-block;
+  font-size: 12px;
+  padding: 6px 8px;
+  border-radius: 8px;
+  border: 1px solid #e5e7eb;
+  background: #f9fafb;
+  overflow: auto;
+  max-width: 100%;
+}
+
+.placePanelSectionTitle {
+  margin-top: 10px;
+  font-size: 12px;
+  font-weight: 600;
+  color: #374151;
+}
+
+.placePanelNote {
+  margin-top: 4px;
+  font-size: 11px;
+  color: #6b7280;
+}
+
+@media (max-width: 420px) {
+  .placePanelDl { grid-template-columns: 1fr; }
+}
```

## Verification

- ./scripts/verify.sh
- Open the active Vite URL and confirm the panel does not break the route form.
- With backend running, search for a place and confirm selected metadata renders.

## Risks

- Backend/geocoder must be running for full interaction testing.
- Accessibility metadata defaults must be displayed as unverified.

## Rollback

Remove `PlaceDetailPanel`, remove selected-place state, and revert SearchBar callback changes.
