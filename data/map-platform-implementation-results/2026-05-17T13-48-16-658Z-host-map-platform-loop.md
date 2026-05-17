# Implementation Result: host map-platform loop

Created: 2026-05-17T13:48:16.658937Z
Status: completed_with_blockers

## Summary

Tool-loop implementation did not produce a patch.

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
        "path": "custom_router/graph.py"
      },
      "reason": "Inspect the custom router graph artifact loader to find a small, bounded reliability improvement in custom router work before making a scoped change."
    }
  },
  {
    "tool_result": {
      "tool": "read_map_platform_file",
      "ok": true,
      "output": "from __future__ import annotations\n\nfrom dataclasses import dataclass\nfrom math import asin, cos, radians, sin, sqrt\nfrom pathlib import Path\nimport json\n\n\n@dataclass(frozen=True)\nclass Node:\n    id: str\n    name: str\n    lat: float\n    lon: float\n\n\n@dataclass(frozen=True)\nclass Edge:\n    source: str\n    target: str\n    name: str\n    distance_m: float\n    speed_kph: float\n    geometry: list[list[float]]\n\n    @property\n    def duration_s(self) -> float:\n        if self.speed_kph <= 0:\n            return float(\"inf\")\n        return self.distance_m / (self.speed_kph * 1000 / 3600)\n\n\n@dataclass\nclass Graph:\n    nodes: dict[str, Node]\n    adjacency: dict[str, list[Edge]]\n\n    def node(self, node_id: str) -> Node:\n        return self.nodes[node_id]\n\n    def neighbors(self, node_id: str) -> list[Edge]:\n        return self.adjacency.get(node_id, [])\n\n    def nearest_node(self, lat: float, lon: float) -> tuple[Node, float]:\n        best_node = None\n        best_distance = float(\"inf\")\n        for node in self.nodes.values():\n            distance = haversine_m(lat, lon, node.lat, node.lon)\n            if distance < best_distance:\n                best_node = node\n                best_distance = distance\n        if best_node is None:\n            raise ValueError(\"Routing graph has no nodes\")\n        return best_node, best_distance\n\n\ndef haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:\n    radius_m = 6371000\n    dlat = radians(lat2 - lat1)\n    dlon = radians(lon2 - lon1)\n    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2\n    c = 2 * asin(sqrt(a))\n    return radius_m * c\n\n\ndef load_graph(path: Path) -> Graph:\n    raw = json.loads(path.read_text(encoding=\"utf-8\"))\n    nodes = {\n        item[\"id\"]: Node(\n            id=item[\"id\"],\n            name=item[\"name\"],\n            lat=float(item[\"lat\"]),\n            lon=float(item[\"lon\"]),\n        )\n        for item in raw[\"nodes\"]\n    }\n    adjacency: dict[str, list[Edge]] = {node_id: [] for node_id in nodes}\n    for item in raw[\"edges\"]:\n        edge = Edge(\n            source=item[\"from\"],\n            target=item[\"to\"],\n            name=item[\"name\"],\n            distance_m=float(item[\"distance_m\"]),\n            speed_kph=float(item[\"speed_kph\"]),\n            geometry=item.get(\"geometry\") or [\n                [nodes[item[\"from\"]].lon, nodes[item[\"from\"]].lat],\n                [nodes[item[\"to\"]].lon, nodes[item[\"to\"]].lat],\n            ],\n        )\n        reverse = Edge(\n            source=item[\"to\"],\n            target=item[\"from\"],\n            name=item[\"name\"],\n            distance_m=float(item[\"distance_m\"]),\n            speed_kph=float(item[\"speed_kph\"]),\n            geometry=list(reversed(edge.geometry)),\n        )\n        adjacency.setdefault(edge.source, []).append(edge)\n        adjacency.setdefault(reverse.source, []).append(reverse)\n    return Graph(nodes=nodes, adjacency=adjacency)\n",
      "data": "from __future__ import annotations\n\nfrom dataclasses import dataclass\nfrom math import asin, cos, radians, sin, sqrt\nfrom pathlib import Path\nimport json\n\n\n@dataclass(frozen=True)\nclass Node:\n    id: str\n    name: str\n    lat: float\n    lon: float\n\n\n@dataclass(frozen=True)\nclass Edge:\n    source: str\n    target: str\n    name: str\n    distance_m: float\n    speed_kph: float\n    geometry: list[list[float]]\n\n    @property\n    def duration_s(self) -> float:\n        if self.speed_kph <= 0:\n            return float(\"inf\")\n        return self.distance_m / (self.speed_kph * 1000 / 3600)\n\n\n@dataclass\nclass Graph:\n    nodes: dict[str, Node]\n    adjacency: dict[str, list[Edge]]\n\n    def node(self, node_id: str) -> Node:\n        return self.nodes[node_id]\n\n    def neighbors(self, node_id: str) -> list[Edge]:\n        return self.adjacency.get(node_id, [])\n\n    def nearest_node(self, lat: float, lon: float) -> tuple[Node, float]:\n        best_node = None\n        best_distance = float(\"inf\")\n        for node in self.nodes.values():\n            distance = haversine_m(lat, lon, node.lat, node.lon)\n            if distance < best_distance:\n                best_node = node\n                best_distance = distance\n        if best_node is None:\n            raise ValueError(\"Routing graph has no nodes\")\n        return best_node, best_distance\n\n\ndef haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:\n    radius_m = 6371000\n    dlat = radians(lat2 - lat1)\n    dlon = radians(lon2 - lon1)\n    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2\n    c = 2 * asin(sqrt(a))\n    return radius_m * c\n\n\ndef load_graph(path: Path) -> Graph:\n    raw = json.loads(path.read_text(encoding=\"utf-8\"))\n    nodes = {\n        item[\"id\"]: Node(\n            id=item[\"id\"],\n            name=item[\"name\"],\n            lat=float(item[\"lat\"]),\n            lon=float(item[\"lon\"]),\n        )\n        for item in raw[\"nodes\"]\n    }\n    adjacency: dict[str, list[Edge]] = {node_id: [] for node_id in nodes}\n    for item in raw[\"edges\"]:\n        edge = Edge(\n            source=item[\"from\"],\n            target=item[\"to\"],\n            name=item[\"name\"],\n            distance_m=float(item[\"distance_m\"]),\n            speed_kph=float(item[\"speed_kph\"]),\n            geometry=item.get(\"geometry\") or [\n                [nodes[item[\"from\"]].lon, nodes[item[\"from\"]].lat],\n                [nodes[item[\"to\"]].lon, nodes[item[\"to\"]].lat],\n            ],\n        )\n        reverse = Edge(\n            source=item[\"to\"],\n            target=item[\"from\"],\n            name=item[\"name\"],\n            distance_m=float(item[\"distance_m\"]),\n            speed_kph=float(item[\"speed_kph\"]),\n            geometry=list(reversed(edge.geometry)),\n        )\n        adjacency.setdefault(edge.source, []).append(edge)\n        adjacency.setdefault(reverse.source, []).append(reverse)\n    return Graph(nodes=nodes, adjacency=adjacency)\n"
    }
  },
  {
    "action": {
      "tool": "search_map_platform",
      "args": {
        "query": "load_graph(",
        "limit": 10
      },
      "reason": "Find callers and nearby tests for custom_router.load_graph so I can choose one small safe reliability change and update the right scoped file(s)."
    }
  },
  {
    "tool_result": {
      "tool": "search_map_platform",
      "ok": true,
      "output": "{\n  \"query\": \"load_graph(\",\n  \"matches\": [\n    {\n      \"path\": \"custom_router/app.py\",\n      \"line\": 14,\n      \"text\": \"graph: Graph = load_graph(GRAPH_PATH)\"\n    },\n    {\n      \"path\": \"custom_router/graph.py\",\n      \"line\": 66,\n      \"text\": \"def load_graph(path: Path) -> Graph:\"\n    }\n  ],\n  \"total_matches\": 2\n}",
      "data": {
        "query": "load_graph(",
        "matches": [
          {
            "path": "custom_router/app.py",
            "line": 14,
            "text": "graph: Graph = load_graph(GRAPH_PATH)"
          },
          {
            "path": "custom_router/graph.py",
            "line": 66,
            "text": "def load_graph(path: Path) -> Graph:"
          }
        ],
        "total_matches": 2
      }
    }
  },
  {
    "action": {
      "tool": "read_map_platform_file",
      "args": {
        "path": "custom_router/app.py"
      },
      "reason": "Inspect the custom router startup path to choose a single small reliability improvement in graph loading and ensure any change in custom_router/graph.py fits current app behavior."
    }
  },
  {
    "tool_result": {
      "tool": "read_map_platform_file",
      "ok": true,
      "output": "from pathlib import Path\n\nfrom fastapi import FastAPI, HTTPException, Query\n\nfrom algorithms import shortest_path\nfrom graph import Graph, load_graph\n\n\nGRAPH_PATH = Path(__file__).resolve().parent / \"fixtures\" / \"delhi_core.json\"\nMAX_SNAP_DISTANCE_M = 1500\nSNAP_WARNING_THRESHOLD_M = 500\n\napp = FastAPI(title=\"Intact Custom Router\")\ngraph: Graph = load_graph(GRAPH_PATH)\n\n\ndef parse_latlon(value: str) -> tuple[float, float]:\n    if \",\" not in value:\n        raise ValueError(\"Expected lat,lon\")\n    lat_text, lon_text = [part.strip() for part in value.split(\",\", 1)]\n    return float(lat_text), float(lon_text)\n\n\ndef path_geometry(result) -> list[list[float]]:\n    geometry: list[list[float]] = []\n    for edge in result.edges:\n        edge_geometry = edge.geometry\n        if geometry and edge_geometry and geometry[-1] == edge_geometry[0]:\n            geometry.extend(edge_geometry[1:])\n        else:\n            geometry.extend(edge_geometry)\n    return geometry\n\n\n@app.get(\"/\")\ndef root():\n    return {\n        \"message\": \"Intact custom router ready\",\n        \"graph\": GRAPH_PATH.name,\n        \"nodes\": len(graph.nodes),\n    }\n\n\n@app.get(\"/route\")\ndef route(\n    origin: str = Query(..., description=\"lat,lon\"),\n    destination: str = Query(..., description=\"lat,lon\"),\n):\n    try:\n        origin_lat, origin_lon = parse_latlon(origin)\n        destination_lat, destination_lon = parse_latlon(destination)\n    except Exception:\n        raise HTTPException(status_code=400, detail=\"Invalid origin/destination. Use 'lat,lon'.\")\n\n    origin_node, origin_snap_m = graph.nearest_node(origin_lat, origin_lon)\n    destination_node, destination_snap_m = graph.nearest_node(destination_lat, destination_lon)\n    if origin_snap_m > MAX_SNAP_DISTANCE_M or destination_snap_m > MAX_SNAP_DISTANCE_M:\n        return {\n            \"error\": (\n                \"Route is outside the current custom router coverage area. \"\n                \"Use ROUTER_PROVIDER=osrm with prepared OSRM road data for realistic city-wide routing.\"\n            ),\n            \"code\": \"outside_custom_router_coverage\",\n            \"max_snap_distance_m\": MAX_SNAP_DISTANCE_M,\n            \"snapped_origin\": {\n                \"id\": origin_node.id,\n                \"name\": origin_node.name,\n                \"lat\": origin_node.lat,\n                \"lon\": origin_node.lon,\n                \"distance_m\": round(origin_snap_m, 1),\n            },\n            \"snapped_destination\": {\n                \"id\": destination_node.id,\n                \"name\": destination_node.name,\n                \"lat\": destination_node.lat,\n                \"lon\": destination_node.lon,\n                \"distance_m\": round(destination_snap_m, 1),\n            },\n        }\n\n    result = shortest_path(graph, origin_node.id, destination_node.id)\n    if result is None:\n        return {\"error\": \"No route found\"}\n\n    geometry = path_geometry(result)\n    if not geometry:\n        return {\"error\": \"No route found between distinct road nodes\"}\n    warnings = []\n    if origin_snap_m > SNAP_WARNING_THRESHOLD_M:\n        warnings.append(f\"Origin snapped {round(origin_snap_m)}m to {origin_node.name}\")\n    if destination_snap_m > SNAP_WARNING_THRESHOLD_M:\n        warnings.append(f\"Destination snapped {round(destination_snap_m)}m to {destination_node.name}\")\n\n    return {\n        \"provider\": \"intact\",\n        \"origin\": origin,\n        \"destination\": destination,\n        \"snapped_origin\": {\n            \"id\": origin_node.id,\n            \"name\": origin_node.name,\n            \"lat\": origin_node.lat,\n            \"lon\": origin_node.lon,\n            \"distance_m\": round(origin_snap_m, 1),\n        },\n        \"snapped_destination\": {\n            \"id\": destination_node.id,\n            \"name\": destination_node.name,\n            \"lat\": destination_node.lat,\n            \"lon\": destination_node.lon,\n            \"distance_m\": round(destination_snap_m, 1),\n        },\n        \"distance_km\": round(result.distance_m / 1000, 2),\n        \"duration_min\": round(result.duration_s / 60, 1),\n        \"steps\": [f\"Take {edge.name} toward {graph.node(edge.target).name}\" for edge in result.edges],\n        \"geometry\": geometry,\n        \"warnings\": warnings,\n    }\n",
      "data": "from pathlib import Path\n\nfrom fastapi import FastAPI, HTTPException, Query\n\nfrom algorithms import shortest_path\nfrom graph import Graph, load_graph\n\n\nGRAPH_PATH = Path(__file__).resolve().parent / \"fixtures\" / \"delhi_core.json\"\nMAX_SNAP_DISTANCE_M = 1500\nSNAP_WARNING_THRESHOLD_M = 500\n\napp = FastAPI(title=\"Intact Custom Router\")\ngraph: Graph = load_graph(GRAPH_PATH)\n\n\ndef parse_latlon(value: str) -> tuple[float, float]:\n    if \",\" not in value:\n        raise ValueError(\"Expected lat,lon\")\n    lat_text, lon_text = [part.strip() for part in value.split(\",\", 1)]\n    return float(lat_text), float(lon_text)\n\n\ndef path_geometry(result) -> list[list[float]]:\n    geometry: list[list[float]] = []\n    for edge in result.edges:\n        edge_geometry = edge.geometry\n        if geometry and edge_geometry and geometry[-1] == edge_geometry[0]:\n            geometry.extend(edge_geometry[1:])\n        else:\n            geometry.extend(edge_geometry)\n    return geometry\n\n\n@app.get(\"/\")\ndef root():\n    return {\n        \"message\": \"Intact custom router ready\",\n        \"graph\": GRAPH_PATH.name,\n        \"nodes\": len(graph.nodes),\n    }\n\n\n@app.get(\"/route\")\ndef route(\n    origin: str = Query(..., description=\"lat,lon\"),\n    destination: str = Query(..., description=\"lat,lon\"),\n):\n    try:\n        origin_lat, origin_lon = parse_latlon(origin)\n        destination_lat, destination_lon = parse_latlon(destination)\n    except Exception:\n        raise HTTPException(status_code=400, detail=\"Invalid origin/destination. Use 'lat,lon'.\")\n\n    origin_node, origin_snap_m = graph.nearest_node(origin_lat, origin_lon)\n    destination_node, destination_snap_m = graph.nearest_node(destination_lat, destination_lon)\n    if origin_snap_m > MAX_SNAP_DISTANCE_M or destination_snap_m > MAX_SNAP_DISTANCE_M:\n        return {\n            \"error\": (\n                \"Route is outside the current custom router coverage area. \"\n                \"Use ROUTER_PROVIDER=osrm with prepared OSRM road data for realistic city-wide routing.\"\n            ),\n            \"code\": \"outside_custom_router_coverage\",\n            \"max_snap_distance_m\": MAX_SNAP_DISTANCE_M,\n            \"snapped_origin\": {\n                \"id\": origin_node.id,\n                \"name\": origin_node.name,\n                \"lat\": origin_node.lat,\n                \"lon\": origin_node.lon,\n                \"distance_m\": round(origin_snap_m, 1),\n            },\n            \"snapped_destination\": {\n                \"id\": destination_node.id,\n                \"name\": destination_node.name,\n                \"lat\": destination_node.lat,\n                \"lon\": destination_node.lon,\n                \"distance_m\": round(destination_snap_m, 1),\n            },\n        }\n\n    result = shortest_path(graph, origin_node.id, destination_node.id)\n    if result is None:\n        return {\"error\": \"No route found\"}\n\n    geometry = path_geometry(result)\n    if not geometry:\n        return {\"error\": \"No route found between distinct road nodes\"}\n    warnings = []\n    if origin_snap_m > SNAP_WARNING_THRESHOLD_M:\n        warnings.append(f\"Origin snapped {round(origin_snap_m)}m to {origin_node.name}\")\n    if destination_snap_m > SNAP_WARNING_THRESHOLD_M:\n        warnings.append(f\"Destination snapped {round(destination_snap_m)}m to {destination_node.name}\")\n\n    return {\n        \"provider\": \"intact\",\n        \"origin\": origin,\n        \"destination\": destination,\n        \"snapped_origin\": {\n            \"id\": origin_node.id,\n            \"name\": origin_node.name,\n            \"lat\": origin_node.lat,\n            \"lon\": origin_node.lon,\n            \"distance_m\": round(origin_snap_m, 1),\n        },\n        \"snapped_destination\": {\n            \"id\": destination_node.id,\n            \"name\": destination_node.name,\n            \"lat\": destination_node.lat,\n            \"lon\": destination_node.lon,\n            \"distance_m\": round(destination_snap_m, 1),\n        },\n        \"distance_km\": round(result.distance_m / 1000, 2),\n        \"duration_min\": round(result.duration_s / 60, 1),\n        \"steps\": [f\"Take {edge.name} toward {graph.node(edge.target).name}\" for edge in result.edges],\n        \"geometry\": geometry,\n        \"warnings\": warnings,\n    }\n"
    }
  },
  {
    "action": {
      "tool": "create_map_platform_change_request",
      "args": {
        "title": "Harden custom router graph loader validation",
        "agent": "backend-api-agent",
        "objective": "Add small defensive validation in custom_router/graph.py so malformed or self-inconsistent graph fixtures fail with clearer errors instead of KeyError or invalid adjacency behavior.",
        "allowed_files": [
          "custom_router/graph.py"
        ],
        "verification": [
          "Read custom_router/graph.py for targeted update",
          "Optionally run repo verification after edit if available"
        ],
        "approval_note": "Scoped reliability improvement for custom router graph loading only; no broad refactor."
      },
      "reason": "I have identified a small, commit-worthy backend reliability task in the custom router graph loader and must create a scoped change request before any write-capable action."
    }
  },
  {
    "tool_result": {
      "tool": "create_map_platform_change_request",
      "ok": true,
      "output": "{\n  \"created\": \"/Users/abhisheksrivastava/intact-mcp-server/data/map-platform-change-requests/2026-05-17T09-45-11-678Z-harden-custom-router-graph-loader-validation.md\",\n  \"path\": \"map-platform-change-requests/2026-05-17T09-45-11-678Z-harden-custom-router-graph-loader-validation.md\",\n  \"status\": \"approved-for-scoped-work\"\n}",
      "data": {
        "created": "/Users/abhisheksrivastava/intact-mcp-server/data/map-platform-change-requests/2026-05-17T09-45-11-678Z-harden-custom-router-graph-loader-validation.md",
        "path": "map-platform-change-requests/2026-05-17T09-45-11-678Z-harden-custom-router-graph-loader-validation.md",
        "status": "approved-for-scoped-work"
      }
    }
  },
  {
    "action": {
      "tool": "get_map_platform_file_metadata",
      "args": {
        "path": "custom_router/graph.py"
      },
      "reason": "Fetch current hash for custom_router/graph.py before making the scoped loader-validation edit approved in the change request."
    }
  },
  {
    "tool_result": {
      "tool": "get_map_platform_file_metadata",
      "ok": true,
      "output": "{\n  \"path\": \"custom_router/graph.py\",\n  \"bytes\": 2937,\n  \"sha256\": \"a182d1a509f751405b9af71703dfff3b1b4fb8189d4805b2834bcf9f12caee1a\"\n}",
      "data": {
        "path": "custom_router/graph.py",
        "bytes": 2937,
        "sha256": "a182d1a509f751405b9af71703dfff3b1b4fb8189d4805b2834bcf9f12caee1a"
      }
    }
  },
  {
    "action": {
      "tool": "write_map_platform_file",
      "args": {
        "path": "custom_router/graph.py",
        "content": "from __future__ import annotations\n\nfrom dataclasses import dataclass\nfrom math import asin, cos, radians, sin, sqrt\nfrom pathlib import Path\nimport json\n\n\n@dataclass(frozen=True)\nclass Node:\n    id: str\n    name: str\
- Generated diff:
- None
- Raw model responses:
- {"tool":"read_map_platform_file","args":{"path":"custom_router/graph.py"},"reason":"Inspect the custom router graph artifact loader to find a small, bounded reliability improvement in custom router work before making a scoped change."}
---
{"tool":"search_map_platform","args":{"query":"load_graph(", "limit":10},"reason":"Find callers and nearby tests for custom_router.load_graph so I can choose one small safe reliability change and update the right scoped file(s)."}
{"tool":"search_map_platform","args":{"query":"load_graph(", "limit":10},"reason":"Find callers and nearby tests for custom_router.load_graph so I can choose one small safe reliability change and update the right scoped file(s)."}
---
{"tool":"read_map_platform_file","args":{"path":"custom_router/app.py"},"reason":"Inspect the custom router startup path to choose a single small reliability improvement in graph loading and ensure any change in custom_router/graph.py fits current app behavior."}
{"tool":"read_map_platform_file","args":{"path":"custom_router/app.py"},"reason":"Inspect the custom router startup path to choose a single small reliability improvement in graph loading and ensure any change in custom_router/graph.py fits current app behavior."}
---
{"tool":"create_map_platform_change_request","args":{"title":"Harden custom router graph loader validation","agent":"backend-api-agent","objective":"Add small defensive validation in custom_router/graph.py so malformed or self-inconsistent graph fixtures fail with clearer errors instead of KeyError or invalid adjacency behavior.","allowed_files":["custom_router/graph.py"],"verification":["Read custom_router/graph.py for targeted update","Optionally run repo verification after edit if available"],"approval_note":"Scoped reliability improvement for custom router graph loading only; no broad refactor."},"reason":"I have identified a small, commit-worthy backend reliability task in the custom router graph loader and must create a scoped change request before any write-capable action."}
{"tool":"create_map_platform_change_request","args":{"title":"Harden custom router graph loader validation","agent":"backend-api-agent","objective":"Add small defensive validation in custom_router/graph.py so malformed or self-inconsistent graph fixtures fail with clearer errors instead of KeyError or invalid adjacency behavior.","allowed_files":["custom_router/graph.py"],"verification":["Read custom_router/graph.py for targeted update","Optionally run repo verification after edit if available"],"approval_note":"Scoped reliability improvement for custom router graph loading only; no broad refactor."},"reason":"I have identified a small, commit-worthy backend reliability task in the custom router graph loader and must create a scoped change request before any write-capable action."}
---
{"tool":"get_map_platform_file_metadata","args":{"path":"custom_router/graph.py"},"reason":"Fetch current hash for custom_router/graph.py before making the scoped loader-validation edit approved in the change request."}
{"tool":"get_map_platform_file_metadata","args":{"path":"custom_router/graph.py"},"reason":"Fetch current hash for custom_router/graph.py before making the scoped loader-validation edit approved in the change request."}
---
{"tool":"write_map_platform_file","args":{"path":"custom_router/graph.py","content":"from __future__ import annotations\n\nfrom dataclasses import dataclass\nfrom math import asin, cos, radians, sin, sqrt\nfrom pathlib import Path\nimport json\n\n\n@dataclass(frozen=True)\nclass Node:\n    id: str\n    name: str\n    lat: float\n    lon: float\n\n\n@dataclass(frozen=True)\nclass Edge:\n    source: str\n    target: str\n    name: str\n    distance_m: float\n    speed_kph: float\n    geometry: list[list[float]]\n\n    @property\n    def duration_s(self) -> float:\n        if self.speed_kph <= 0:\n            return float(\"inf\")\n        return self.distance_m / (self.speed_kph * 1000 / 3600)\n\n\n@dataclass\nclass Graph:\n    nodes: dict[str, Node]\n    adjacency: dict[str, list[Edge]]\n\n    def node(self, node_id: str) -> Node:\n        return self.nodes[node_id]\n\n    def neighbors(self, node_id: str) -> list[Edge]:\n        return self.adjacency.get(node_id, [])\n\n    def nearest_node(self, lat: float, lon: float) -> tuple[Node, float]:\n        best_node = None\n        best_distance = float(\"inf\")\n        for node in self.nodes.values():\n            distance = haversine_m(lat, lon, node.lat, node.lon)\n            if distance < best_distance:\n                best_node = node\n                best_distance = distance\n        if best_node is None:\n            raise ValueError(\"Routing graph has no nodes\")\n        return best_node, best_distance\n\n\ndef haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:\n    radius_m = 6371000\n    dlat = radians(lat2 - lat1)\n    dlon = radians(lon2 - lon1)\n    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2\n    c = 2 * asin(sqrt(a))\n    return radius_m * c\n\n\ndef load_graph(path: Path) -> Graph:\n    raw = json.loads(path.read_text(encoding=\"utf-8\"))\n    raw_nodes = raw.get(\"nodes\")\n    raw_edges = raw.get(\"edges\")\n    if not isinstance(raw_nodes, list):\n        raise ValueError(\"Routing graph must contain a 'nodes' list\")\n    if not isinstance(raw_edges, list):\n        raise ValueError(\"Routing graph must contain an 'edges' list\")\n\n    nodes: dict[str, Node] = {}\n    for item in raw_nodes:\n        node_id = item[\"id\"]\n        if node_id in nodes:\n            raise ValueError(f\"Routing graph contains duplicate node id: {node_id}\")\n        nodes[node_id] = Node(\n            id=node_id,\n            name=item[\"name\"],\n            lat=float(item[\"lat\"]),\n            lon=float(item[\"lon\"]),\n        )\n\n    adjacency: dict[str, list[Edge]] = {node_id: [] for node_id in nodes}\n    for item in raw_edges:\n        source = item[\"from\"]\n        target = item[\"to\"]\n        if source not in nodes:\n            raise ValueError(f\"Routing graph edge references unknown source node: {source}\")\n        if target not in nodes:\n            raise ValueError(f\"Routing graph edge references unknown target node: {target}\")\n\n        geometry = item.get(\"geometry\") or [\n            [nodes[source].lon, nodes[source].lat],\n            [nodes[target].lon, nodes[target].lat],\n        ]\n        edge = Edge(\n            source=source,\n            target=target,\n            name=item[\"name\"],\n            distance_m=float(item[\"distance_m\"]),\n            speed_kph=float(item[\"speed_kph\"]),\n            geometry=geometry,\n        )\n        reverse = Edge(\n            source=target,\n            target=source,\n            name=item[\"name\"],\n            distance_m=float(item[\"distance_m\"]),\n            speed_kph=float(item[\"speed_kph\"]),\n            geometry=list(reversed(edge.geometry)),\n        )\n        adjacency[edge.source].append(edge)\n        adjacency[reverse.source].append(reverse)\n    return Graph(nodes=nodes, adjacency=adjacency)\n","expected_sha256":"a182d1a509f751405b9af71703dfff3b1b4fb8189d4805b2834bcf9f12caee1a","change_request_path":"map-platform-change-requests/2026-05-17T09-45-11-678Z-harden-custom-router-graph-loader-validation.md","approval_note":"Scoped reliability improvement for custom router graph loading only; no broad refactor."},"reason":"Apply the approved small reliability change in custom_router/graph.py by validating required graph sections, duplicate node ids, and edge references before building adjacency."}
{"tool":"write_map_platform_file","args":{"path":"custom_router/graph.py","content":"from __future__ import annotations\n\nfrom dataclasses import dataclass\nfrom math import asin, cos, radians, sin, sqrt\nfrom pathlib import Path\nimport json\n\n\n@dataclass(frozen=True)\nclass Node:\n    id: str\n    name: str\n    lat: float\n    lon: float\n\n\n@dataclass(frozen=True)\nclass Edge:\n    source: str\n    target: str\n    name: str\n    distance_m: float\n    speed_kph: float\n    geometry: list[list[float]]\n\n    @property\n    def duration_s(self) -> float:\n        if self.speed_kph <= 0:\n            return float(\"inf\")\n        return self.distance_m / (self.speed_kph * 1000 / 3600)\n\n\n@dataclass\nclass Graph:\n    nodes: dict[str, Node]\n    adjacency: dict[str, list[Edge]]\n\n    def node(self, node_id: str) -> Node:\n        return self.nodes[node_id]\n\n    def neighbors(self, node_id: str) -> list[Edge]:\n        return self.adjacency.get(node_id, [])\n\n    def nearest_node(self, lat: float, lon: float) -> tuple[Node, float]:\n        best_node = None\n        best_distance = float(\"inf\")\n        for node in self.nodes.values():\n            distance = haversine_m(lat, lon, node.lat, node.lon)\n            if distance < best_distance:\n                best_node = node\n                best_distance = distance\n        if best_node is None:\n            raise ValueError(\"Routing graph has no nodes\")\n        return best_node, best_distance\n\n\ndef haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:\n    radius_m = 6371000\n    dlat = radians(lat2 - lat1)\n    dlon = radians(lon2 - lon1)\n    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2\n    c = 2 * asin(sqrt(a))\n    return radius_m * c\n\n\ndef load_graph(path: Path) -> Graph:\n    raw = json.loads(path.read_text(encoding=\"utf-8\"))\n    raw_nodes = raw.get(\"nodes\")\n    raw_edges = raw.get(\"edges\")\n    if not isinstance(raw_nodes, list):\n        raise ValueError(\"Routing graph must contain a 'nodes' list\")\n    if not isinstance(raw_edges, list):\n        raise ValueError(\"Routing graph must contain an 'edges' list\")\n\n    nodes: dict[str, Node] = {}\n    for item in raw_nodes:\n        node_id = item[\"id\"]\n        if node_id in nodes:\n            raise ValueError(f\"Routing graph contains duplicate node id: {node_id}\")\n        nodes[node_id] = Node(\n            id=node_id,\n            name=item[\"name\"],\n            lat=float(item[\"lat\"]),\n            lon=float(item[\"lon\"]),\n        )\n\n    adjacency: dict[str, list[Edge]] = {node_id: [] for node_id in nodes}\n    for item in raw_edges:\n        source = item[\"from\"]\n        target = item[\"to\"]\n        if source not in nodes:\n            raise ValueError(f\"Routing graph edge references unknown source node: {source}\")\n        if target not in nodes:\n            raise ValueError(f\"Routing graph edge references unknown target node: {target}\")\n\n        geometry = item.get(\"geometry\") or [\n            [nodes[source].lon, nodes[source].lat],\n            [nodes[target].lon, nodes[target].lat],\n        ]\n        edge = Edge(\n            source=source,\n            target=target,\n            name=item[\"name\"],\n            distance_m=float(item[\"distance_m\"]),\n            speed_kph=float(item[\"speed_kph\"]),\n            geometry=geometry,\n        )\n        reverse = Edge(\n            source=target,\n            target=source,\n            name=item[\"name\"],\n            distance_m=float(item[\"distance_m\"]),\n            speed_kph=float(item[\"speed_kph\"]),\n            geometry=list(reversed(edge.geometry)),\n        )\n        adjacency[edge.source].append(edge)\n        adjacency[reverse.source].append(reverse)\n    return Graph(nodes=nodes, adjacency=adjacency)\n","expected_sha256":"a182d1a509f751405b9af71703dfff3b1b4fb8189d4805b2834bcf9f12caee1a","change_request_path":"map-platform-change-requests/2026-05-17T09-45-11-678Z-harden-custom-router-graph-loader-validation.md","approval_note":"Scoped reliability improvement for custom router graph loading only; no broad refactor."},"reason":"Apply the approved small reliability change in custom_router/graph.py by validating required graph sections, duplicate node ids, and edge references before building adjacency."}
- Verification not run.
- No finalization attempted because no verified patch was applied.
- Canonical repo was not modified until generated diff passed validation and verification.

## Git Finalization

- No finalization attempted because no verified patch was applied.
- Canonical repo was not modified until generated diff passed validation and verification.

## Blockers

- The read operation timed out
- No repository files changed.
- Verification failed
