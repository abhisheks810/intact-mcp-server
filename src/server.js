#!/usr/bin/env node
import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { access, mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { constants, existsSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const SERVER_NAME = "intact-mcp-server";
const SERVER_VERSION = "0.1.0";
const PROTOCOL_VERSION = "2024-11-05";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const strategyRoot = path.resolve(
  process.env.STRATEGY_ROOT || "/Users/abhisheksrivastava/host_strategy",
);
const workspaceRoot = path.resolve(
  process.env.INTACT_WORKSPACE || path.join(process.cwd(), "data"),
);
const mapPlatformRoot = path.resolve(
  process.env.MAP_PLATFORM_ROOT || "/Users/abhisheksrivastava/map_platform",
);
const mapPlatformWriteEnabled = process.env.MAP_PLATFORM_WRITE_ENABLED === "true";

const artifactDirs = {
  decisions: path.join(workspaceRoot, "decisions"),
  productBriefs: path.join(workspaceRoot, "product-briefs"),
  agentSpecs: path.join(workspaceRoot, "agent-specs"),
  researchNotes: path.join(workspaceRoot, "research-notes"),
  mapPlatformTasks: path.join(workspaceRoot, "map-platform-tasks"),
  mapPlatformPatchProposals: path.join(workspaceRoot, "map-platform-patch-proposals"),
  mapPlatformChangeRequests: path.join(workspaceRoot, "map-platform-change-requests"),
  mapPlatformImplementationResults: path.join(workspaceRoot, "map-platform-implementation-results"),
  agentRuns: path.join(workspaceRoot, "agent-runs"),
};

const textEncoder = new TextEncoder();
const execFileAsync = promisify(execFile);
let inputBuffer = Buffer.alloc(0);
const ignoredRepoDirs = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  ".next",
  ".vite",
  "__pycache__",
  ".pytest_cache",
  ".venv",
  "venv",
]);
const ignoredRepoFiles = new Set([".DS_Store"]);
const repoTextExtensions = new Set([
  ".cjs",
  ".css",
  ".html",
  ".js",
  ".json",
  ".jsx",
  ".md",
  ".mjs",
  ".py",
  ".txt",
  ".ts",
  ".tsx",
  ".yml",
  ".yaml",
]);

function nowStamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function slugify(value) {
  return String(value || "untitled")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "untitled";
}

function assertObject(value, name) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${name} must be an object`);
  }
}

function requireString(args, key) {
  const value = args[key];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${key} is required`);
  }
  return value.trim();
}

function requireOptionalUrl(args, key) {
  const value = args[key];
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") throw new Error(`${key} must be a string`);
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  try {
    // eslint-disable-next-line no-new
    new URL(trimmed);
  } catch {
    throw new Error(`${key} must be a valid URL`);
  }
  return trimmed;
}

function requireOptionalString(args, key) {
  const value = args[key];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") throw new Error(`${key} must be a string`);
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function parseLatLon(value) {
  if (typeof value !== "string") throw new Error("Coordinate must be a string");
  const parts = value.split(",").map((part) => part.trim());
  if (parts.length !== 2) throw new Error(`Invalid coordinate format: ${value}`);
  const lat = Number(parts[0]);
  const lon = Number(parts[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw new Error(`Invalid coordinate numbers: ${value}`);
  }
  return { lat, lon };
}

function coerceExecString(value) {
  if (!value) return "";
  if (Buffer.isBuffer(value)) return value.toString("utf8");
  return String(value);
}

function execErrorSummary(error) {
  if (!error) return "";
  const stdout = coerceExecString(error.stdout).trim();
  const stderr = coerceExecString(error.stderr).trim();
  return (stderr || stdout || error.message || "").trim();
}

function parseGitStatusBranchLine(line) {
  const raw = typeof line === "string" ? line.trim() : String(line || "").trim();
  const fallback = {
    raw,
    summary: raw,
    head: null,
    upstream: null,
    ahead: 0,
    behind: 0,
    detached: false,
  };
  if (!raw.startsWith("##")) return fallback;

  const rest = raw.replace(/^##\s*/, "");
  const result = { ...fallback, summary: rest };
  if (rest.startsWith("HEAD")) {
    result.detached = true;
    result.head = "HEAD";
    return result;
  }

  const bracketIndex = rest.indexOf(" [");
  const withoutCounts = bracketIndex === -1 ? rest : rest.slice(0, bracketIndex);
  const countsPart = bracketIndex === -1 ? "" : rest.slice(bracketIndex + 2).replace(/\]$/, "");

  const [headPart, upstreamPart] = (() => {
    const split = withoutCounts.split("...");
    if (split.length >= 2) {
      return [split[0], split[1]];
    }
    return [withoutCounts, null];
  })();

  const headToken = String(headPart || "").trim().split(/\s+/)[0];
  if (headToken) result.head = headToken;

  const upstreamToken = upstreamPart ? String(upstreamPart).trim().split(/\s+/)[0] : "";
  if (upstreamToken) result.upstream = upstreamToken;

  const aheadMatch = countsPart.match(/ahead\s+(\d+)/);
  const behindMatch = countsPart.match(/behind\s+(\d+)/);
  if (aheadMatch) result.ahead = Number(aheadMatch[1]) || 0;
  if (behindMatch) result.behind = Number(behindMatch[1]) || 0;

  return result;
}

function parseGitWorktreeListPorcelain(text) {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trimEnd());

  const worktrees = [];
  let current = null;

  const flush = () => {
    if (!current) return;
    worktrees.push(current);
    current = null;
  };

  for (const line of lines) {
    if (!line) continue;
    if (line.startsWith("worktree ")) {
      flush();
      current = { path: line.slice("worktree ".length).trim(), head: null, branch: null, detached: false };
      continue;
    }
    if (!current) continue;

    if (line.startsWith("HEAD ")) {
      current.head = line.slice("HEAD ".length).trim() || null;
      continue;
    }
    if (line.startsWith("branch ")) {
      current.branch = line.slice("branch ".length).trim() || null;
      continue;
    }
    if (line === "detached") {
      current.detached = true;
      continue;
    }
    if (line.startsWith("locked")) {
      current.locked = line.slice("locked".length).trim() || true;
      continue;
    }
    if (line.startsWith("prunable")) {
      current.prunable = line.slice("prunable".length).trim() || true;
      continue;
    }
  }

  flush();
  return worktrees;
}

async function mapPlatformGitStatusShort({ timeoutMs = 5000 } = {}) {
  const gitDir = path.join(mapPlatformRoot, ".git");
  const fetchHeadPath = path.join(gitDir, "FETCH_HEAD");
  const worktreesDir = path.join(gitDir, "worktrees");
  const gitDirWritable = await isPathWritable(gitDir);
  const capabilities = {
    repo_root_writable: await isPathWritable(mapPlatformRoot),
    git_dir_writable: gitDirWritable,
    fetch_head_writable: existsSync(fetchHeadPath)
      ? await isPathWritable(fetchHeadPath)
      : gitDirWritable,
    worktrees_dir_writable: existsSync(worktreesDir)
      ? await isPathWritable(worktreesDir)
      : gitDirWritable,
  };

  let worktrees = [];
  let worktreesError = null;
  try {
    const { stdout } = await execFileAsync("git", ["worktree", "list", "--porcelain"], {
      cwd: mapPlatformRoot,
      timeout: timeoutMs,
      maxBuffer: 1024 * 1024,
    });
    worktrees = parseGitWorktreeListPorcelain(stdout);
  } catch (error) {
    worktrees = [];
    worktreesError = execErrorSummary(error) || "unknown error";
  }

  try {
    const { stdout } = await execFileAsync("git", ["status", "--porcelain=v1", "--branch"], {
      cwd: mapPlatformRoot,
      timeout: timeoutMs,
      maxBuffer: 1024 * 1024,
    });
    const rawLines = stdout.trim().split(/\r?\n/).filter(Boolean);
    const branchLine = rawLines[0] && rawLines[0].startsWith("##") ? rawLines[0] : null;
    const branch = branchLine ? parseGitStatusBranchLine(branchLine) : null;
    const statusLines = branchLine ? rawLines.slice(1) : rawLines;

    let recentCommitsAhead = [];
    if (branch && !branch.detached && branch.upstream && Number(branch.ahead) > 0) {
      try {
        const { stdout: logStdout } = await execFileAsync(
          "git",
          ["log", "--oneline", "--decorate", "-n", "5", `${branch.upstream}..HEAD`],
          {
            cwd: mapPlatformRoot,
            timeout: timeoutMs,
            maxBuffer: 1024 * 1024,
          },
        );
        recentCommitsAhead = logStdout
          .trim()
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean);
      } catch {
        recentCommitsAhead = [];
      }
    }

    return {
      ok: true,
      root: mapPlatformRoot,
      clean: statusLines.length === 0,
      status: statusLines,
      branch,
      recent_commits_ahead: recentCommitsAhead,
      worktrees,
      worktrees_error: worktreesError,
      capabilities,
    };
  } catch (error) {
    return {
      ok: false,
      root: mapPlatformRoot,
      error: execErrorSummary(error) || "unknown error",
      worktrees,
      worktrees_error: worktreesError,
      capabilities,
    };
  }
}

async function isPathWritable(absolutePath) {
  try {
    await access(absolutePath, constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

async function findLatestExportedPatch({ hint }) {
  const patchesDir = path.join(repoRoot, "exports", "map-platform", "patches");
  if (!existsSync(patchesDir)) return null;
  const entries = await readdir(patchesDir, { withFileTypes: true });
  const candidates = entries
    .filter(
      (entry) =>
        entry.isFile() && entry.name.endsWith(".patch") && entry.name.toLowerCase().includes(hint),
    )
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
  if (candidates.length === 0) return null;
  const filename = candidates[candidates.length - 1];
  return {
    filename,
    absolute: path.join(patchesDir, filename),
    relative: path.join("exports", "map-platform", "patches", filename),
  };
}

async function fetchWithTimeout(url, { timeoutMs = 1500 } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = Date.now();
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { "user-agent": `${SERVER_NAME}/${SERVER_VERSION}` },
      signal: controller.signal,
    });
    const bodyText = await response.text();
    return {
      ok: response.ok,
      status: response.status,
      contentType: response.headers.get("content-type") || "",
      bodyText,
      ms: Date.now() - startedAt,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function probeLocalListenCapability({ timeoutMs = 250 } = {}) {
  return await new Promise((resolve) => {
    const server = net.createServer();
    let settled = false;

    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        server.close(() => resolve(result));
      } catch {
        resolve(result);
      }
    };

    const timer = setTimeout(() => {
      finish({ ok: false, error: `timeout after ${timeoutMs}ms` });
    }, timeoutMs);

    server.on("error", (error) => {
      const message =
        error && typeof error === "object" && "code" in error && typeof error.code === "string"
          ? `${error.code}: ${error.message || ""}`.trim()
          : error instanceof Error
            ? error.message
            : String(error);
      finish({ ok: false, error: message });
    });

    server.listen(0, "127.0.0.1", () => {
      finish({ ok: true });
    });
  });
}

async function ensureWorkspace() {
  await mkdir(workspaceRoot, { recursive: true });
  await Promise.all(Object.values(artifactDirs).map((dir) => mkdir(dir, { recursive: true })));
}

async function walkMarkdownFiles(root) {
  if (!existsSync(root)) return [];
  const results = [];

  async function walk(current) {
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === ".git" || entry.name === "node_modules") continue;
        await walk(absolute);
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        const relative = path.relative(root, absolute);
        results.push({ absolute, relative });
      }
    }
  }

  await walk(root);
  return results.sort((a, b) => a.relative.localeCompare(b.relative));
}

async function walkRepoFiles(root) {
  if (!existsSync(root)) return [];
  const results = [];

  async function walk(current) {
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (ignoredRepoDirs.has(entry.name)) continue;
        await walk(absolute);
      } else if (entry.isFile() && !ignoredRepoFiles.has(entry.name)) {
        const relative = path.relative(root, absolute);
        results.push({ absolute, relative });
      }
    }
  }

  await walk(root);
  return results.sort((a, b) => a.relative.localeCompare(b.relative));
}

async function walkWorkspaceArtifacts() {
  const roots = [
    ["decisions", artifactDirs.decisions],
    ["product-briefs", artifactDirs.productBriefs],
    ["agent-specs", artifactDirs.agentSpecs],
    ["research-notes", artifactDirs.researchNotes],
    ["map-platform-tasks", artifactDirs.mapPlatformTasks],
    ["map-platform-patch-proposals", artifactDirs.mapPlatformPatchProposals],
    ["map-platform-change-requests", artifactDirs.mapPlatformChangeRequests],
    ["map-platform-implementation-results", artifactDirs.mapPlatformImplementationResults],
    ["agent-runs", artifactDirs.agentRuns],
  ];
  const artifacts = [];
  for (const [kind, root] of roots) {
    const files = await walkMarkdownFiles(root);
    for (const file of files) {
      artifacts.push({
        kind,
        path: `${kind}/${file.relative}`,
        absolute: file.absolute,
      });
    }
  }
  return artifacts.sort((a, b) => a.path.localeCompare(b.path));
}

function safePathInside(root, relativePath, label) {
  const safePath = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, "");
  const absolute = path.resolve(root, safePath);
  if (!absolute.startsWith(root + path.sep) && absolute !== root) {
    throw new Error(`Path escapes ${label}`);
  }
  return absolute;
}

function safeJsonParse(text) {
  if (typeof text !== "string" || !text.trim()) return { ok: false, value: null };
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false, value: null };
  }
}

async function readMarkdownByRelativePath(relativePath) {
  const absolute = safePathInside(strategyRoot, relativePath, "strategy root");
  if (!absolute.endsWith(".md")) {
    throw new Error("Only markdown strategy documents can be read");
  }
  return readFile(absolute, "utf8");
}

async function readWorkspaceArtifact(relativePath) {
  const absolute = safePathInside(workspaceRoot, relativePath, "workspace root");
  if (!absolute.endsWith(".md")) {
    throw new Error("Only markdown workspace artifacts can be read");
  }
  return readFile(absolute, "utf8");
}

async function readMapPlatformFile(relativePath) {
  const absolute = safePathInside(mapPlatformRoot, relativePath, "map platform root");
  const extension = path.extname(absolute);
  if (!repoTextExtensions.has(extension) && path.basename(absolute) !== "Dockerfile") {
    throw new Error(`Unsupported file type for MCP read: ${extension || path.basename(absolute)}`);
  }
  const info = await stat(absolute);
  if (info.size > 200_000) {
    throw new Error("File too large for MCP read; inspect it with a narrower tool first");
  }
  return readFile(absolute, "utf8");
}

async function listMapPlatformDirectory(relativePath, { limit = 120 } = {}) {
  const absolute = safePathInside(mapPlatformRoot, relativePath || ".", "map platform root");
  const info = await stat(absolute);
  if (!info.isDirectory()) {
    throw new Error(`${relativePath || "."} is not a directory`);
  }
  const entries = await readdir(absolute, { withFileTypes: true });
  const visible = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.isDirectory() && ignoredRepoDirs.has(entry.name)) continue;
    if (entry.isFile() && ignoredRepoFiles.has(entry.name)) continue;
    const childAbsolute = path.join(absolute, entry.name);
    const childRelative = path.relative(mapPlatformRoot, childAbsolute);
    visible.push({
      path: childRelative + (entry.isDirectory() ? "/" : ""),
      type: entry.isDirectory() ? "directory" : entry.isFile() ? "file" : "other",
    });
    if (visible.length >= limit) break;
  }
  return visible;
}

async function getMapPlatformFileInfo(relativePath) {
  const absolute = safePathInside(mapPlatformRoot, relativePath, "map platform root");
  const content = await readMapPlatformFile(relativePath);
  const info = await stat(absolute);
  return {
    path: relativePath,
    absolute,
    bytes: info.size,
    sha256: createHash("sha256").update(content).digest("hex"),
  };
}

async function getOptionalMapPlatformFileInfo(relativePath) {
  const absolute = safePathInside(mapPlatformRoot, relativePath, "map platform root");
  if (!existsSync(absolute)) {
    return {
      path: relativePath,
      absolute,
      exists: false,
      bytes: 0,
      sha256: null,
    };
  }
  const metadata = await getMapPlatformFileInfo(relativePath);
  return { ...metadata, exists: true };
}

function extractAllowedFiles(changeRequestText) {
  const lines = changeRequestText.split(/\r?\n/);
  const allowed = [];
  let inAllowedFiles = false;
  for (const line of lines) {
    if (line.startsWith("## ")) {
      inAllowedFiles = line.trim() === "## Allowed Files";
      continue;
    }
    if (inAllowedFiles && line.startsWith("- ")) {
      const value = line.slice(2).trim();
      if (value && value !== "No files approved") allowed.push(value);
    }
  }
  return allowed;
}

function isPathAllowedByChangeRequest(relativePath, allowedFiles) {
  return allowedFiles.some((allowed) => {
    const normalized = allowed.replace(/^\/+/, "");
    if (normalized.endsWith("/")) return relativePath.startsWith(normalized);
    return relativePath === normalized || relativePath.startsWith(`${normalized}/`);
  });
}

function textContent(text) {
  return { content: [{ type: "text", text }] };
}

function jsonContent(value) {
  return textContent(JSON.stringify(value, null, 2));
}

function tool(name, description, properties = {}, required = []) {
  return {
    name,
    description,
    inputSchema: {
      type: "object",
      properties,
      required,
      additionalProperties: false,
    },
  };
}

function markdownList(values, fallback = "TBD") {
  return Array.isArray(values) && values.length
    ? values.map((value) => `- ${value}`).join("\n")
    : `- ${fallback}`;
}

const mapPlatformAgentNames = [
  "map-product-strategist",
  "geo-data-agent",
  "backend-api-agent",
  "frontend-ux-agent",
  "accessibility-layer-agent",
  "routing-tiles-agent",
  "qa-evaluation-agent",
  "platform-infra-agent",
  "report-agent",
];

const tools = [
  tool("list_strategy_docs", "List markdown documents available in the strategy workspace."),
  tool(
    "read_strategy_doc",
    "Read one strategy markdown document by relative path.",
    { path: { type: "string", description: "Relative markdown path, for example docs/00_executive_blueprint.md." } },
    ["path"],
  ),
  tool(
    "search_strategy_docs",
    "Search strategy markdown documents for a case-insensitive query.",
    {
      query: { type: "string" },
      limit: { type: "number", minimum: 1, maximum: 50, default: 10 },
    },
    ["query"],
  ),
  tool(
    "create_product_brief",
    "Create a product opportunity brief in the MCP workspace.",
    {
      product_name: { type: "string" },
      thesis: { type: "string" },
      target_customer: { type: "string" },
      problem: { type: "string" },
      proposed_solution: { type: "string" },
      revenue_hypothesis: { type: "string" },
      risks: { type: "array", items: { type: "string" }, default: [] },
      success_metrics: { type: "array", items: { type: "string" }, default: [] },
    },
    ["product_name", "thesis", "target_customer", "problem", "proposed_solution"],
  ),
  tool(
    "create_agent_spec",
    "Create an MCP/agent specification in the MCP workspace.",
    {
      agent_name: { type: "string" },
      purpose: { type: "string" },
      product_line: { type: "string" },
      allowed_tools: { type: "array", items: { type: "string" }, default: [] },
      forbidden_actions: { type: "array", items: { type: "string" }, default: [] },
      human_approvals: { type: "array", items: { type: "string" }, default: [] },
      evaluation_metrics: { type: "array", items: { type: "string" }, default: [] },
    },
    ["agent_name", "purpose", "product_line"],
  ),
  tool(
    "record_decision",
    "Record an architecture/product/strategy decision as a markdown ADR-style note.",
    {
      title: { type: "string" },
      context: { type: "string" },
      decision: { type: "string" },
      consequences: { type: "string" },
      status: { type: "string", enum: ["proposed", "accepted", "rejected", "superseded"], default: "proposed" },
    },
    ["title", "context", "decision", "consequences"],
  ),
  tool("list_decisions", "List decision records created by this MCP server."),
  tool("list_workspace_artifacts", "List generated MCP workspace artifacts: decisions, product briefs, agent specs, and research notes."),
  tool(
    "read_workspace_artifact",
    "Read a generated MCP workspace artifact by relative path.",
    { path: { type: "string", description: "Relative artifact path, for example agent-specs/map-platform/00-map-product-strategist.md." } },
    ["path"],
  ),
  tool("list_map_platform_files", "List readable source/config/docs files in the configured map_platform repository."),
  tool(
    "list_map_platform_directory",
    "List immediate files and directories under one repo-relative map_platform directory. Use this for directory inspection instead of reading a directory as a file.",
    {
      path: { type: "string", default: ".", description: "Relative directory path, for example router or docs." },
      limit: { type: "number", minimum: 1, maximum: 250, default: 120 },
    },
    [],
  ),
  tool(
    "read_map_platform_file",
    "Read a source/config/docs file from the configured map_platform repository.",
    { path: { type: "string", description: "Relative file path, for example backend/main.py." } },
    ["path"],
  ),
  tool(
    "get_map_platform_file_metadata",
    "Return size and sha256 metadata for a readable map_platform file.",
    { path: { type: "string", description: "Relative file path, for example geocoder/app.py." } },
    ["path"],
  ),
  tool(
    "search_map_platform",
    "Search readable map_platform files for a case-insensitive query.",
    {
      query: { type: "string" },
      limit: { type: "number", minimum: 1, maximum: 50, default: 20 },
    },
    ["query"],
  ),
  tool("map_platform_git_status", "Return short git status for the configured map_platform repository."),
  tool("map_platform_git_diff", "Return the current map_platform working tree diff as generated by Git."),
  tool(
    "run_map_platform_verify",
    "Run the repo-local map_platform verification command in the configured checkout.",
    {
      timeout_ms: { type: "number", minimum: 1000, maximum: 300000, default: 300000 },
    },
    [],
  ),
  tool(
    "doctor_map_platform_verify",
    "Diagnose sandboxed `./scripts/verify.sh` failures and validate the latest exported sandbox-safe verification patch.",
    {
      patch_hint: {
        type: "string",
        default: "make-verify-sandbox-safe",
        description: "Substring used to locate the exported patch under exports/map-platform/patches/.",
      },
      timeout_ms: { type: "number", minimum: 250, maximum: 10000, default: 1500 },
      dry_run: { type: "boolean", default: false },
    },
    [],
  ),
  tool(
    "doctor_map_platform_dev_interface",
    "Check the local map-platform dev stack endpoints (backend/geocoder/router/frontend) and diagnose common 'Get Route' failures.",
    {
      patch_hint: {
        type: "string",
        default: "fix-route-load-failed",
        description: "Substring used to locate an exported remediation patch under exports/map-platform/patches/.",
      },
      backend_url: { type: "string", default: "http://localhost:8000" },
      frontend_url: { type: "string", default: "http://localhost:3001" },
      geocoder_url: { type: "string", default: "http://localhost:8080" },
      custom_router_url: { type: "string", default: "http://localhost:8090" },
      osrm_url: { type: "string", default: "http://localhost:5001" },
      origin: { type: "string", default: "28.6139,77.2090", description: "Origin in 'lat,lon' format." },
      destination: { type: "string", default: "28.6129,77.2295", description: "Destination in 'lat,lon' format." },
      timeout_ms: { type: "number", minimum: 250, maximum: 10000, default: 1500 },
      dry_run: { type: "boolean", default: false },
    },
    [],
  ),
  tool(
    "doctor_map_platform_place_contract",
    "Validate that the map-platform backend `/geocode` endpoint returns the MVP `Place` contract (including accessibility metadata defaults).",
    {
      backend_url: { type: "string", default: "http://localhost:8000" },
      address: { type: "string", default: "Connaught Place, Delhi" },
      limit: { type: "number", minimum: 1, maximum: 10, default: 1 },
      timeout_ms: { type: "number", minimum: 250, maximum: 10000, default: 1500 },
      dry_run: { type: "boolean", default: false },
    },
    [],
  ),
  tool(
    "create_map_platform_agent_task",
    "Create a scoped task note for map_platform agents before implementation starts.",
    {
      title: { type: "string" },
      agent: {
        type: "string",
        enum: mapPlatformAgentNames,
      },
      objective: { type: "string" },
      scope: { type: "array", items: { type: "string" }, default: [] },
      files_allowed: { type: "array", items: { type: "string" }, default: [] },
      verification: { type: "array", items: { type: "string" }, default: [] },
      risks: { type: "array", items: { type: "string" }, default: [] },
    },
    ["title", "agent", "objective"],
  ),
  tool(
    "create_map_platform_patch_proposal",
    "Create a reviewable patch proposal for map_platform without modifying repository files.",
    {
      title: { type: "string" },
      task_path: {
        type: "string",
        description: "Optional workspace artifact path for the related task, for example map-platform-tasks/2026-04-25-define-mvp-place-schema.md.",
      },
      agent: {
        type: "string",
        enum: mapPlatformAgentNames,
      },
      summary: { type: "string" },
      target_files: { type: "array", items: { type: "string" }, default: [] },
      proposed_changes: {
        type: "array",
        items: {
          type: "object",
          properties: {
            file: { type: "string" },
            change: { type: "string" },
            rationale: { type: "string" },
          },
          required: ["file", "change"],
          additionalProperties: false,
        },
        default: [],
      },
      patch: {
        type: "string",
        description: "Optional unified diff or pseudo-diff. This is stored for review only and is not applied.",
      },
      verification: { type: "array", items: { type: "string" }, default: [] },
      risks: { type: "array", items: { type: "string" }, default: [] },
      rollback: { type: "string" },
    },
    ["title", "agent", "summary"],
  ),
  tool("list_map_platform_patch_proposals", "List reviewable map_platform patch proposals."),
  tool(
    "read_map_platform_patch_proposal",
    "Read a map_platform patch proposal by filename or workspace artifact path.",
    {
      path: {
        type: "string",
        description: "Proposal filename or path, for example map-platform-patch-proposals/2026-04-25-example.md.",
      },
    },
    ["path"],
  ),
  tool(
    "create_map_platform_change_request",
    "Create a scoped change request before using write-capable map_platform tools.",
    {
      title: { type: "string" },
      proposal_path: {
        type: "string",
        description: "Related patch proposal path, for example map-platform-patch-proposals/2026-04-25-add-mvp-place-contract.md.",
      },
      agent: {
        type: "string",
        enum: mapPlatformAgentNames,
      },
      objective: { type: "string" },
      allowed_files: { type: "array", items: { type: "string" }, default: [] },
      verification: { type: "array", items: { type: "string" }, default: [] },
      approval_note: { type: "string" },
    },
    ["title", "agent", "objective", "approval_note"],
  ),
  tool(
    "write_map_platform_file",
    "Write a complete text file in map_platform with strict hash and approval guards. Requires MAP_PLATFORM_WRITE_ENABLED=true.",
    {
      path: { type: "string" },
      content: { type: "string" },
      expected_sha256: {
        type: ["string", "null"],
        description: "Current sha256 from get_map_platform_file_metadata for existing files, or null only when creating a new file.",
      },
      change_request_path: {
        type: "string",
        description: "Workspace artifact path for the approved change request.",
      },
      approval_note: { type: "string" },
    },
    ["path", "content", "expected_sha256", "change_request_path", "approval_note"],
  ),
  tool(
    "record_map_platform_implementation_result",
    "Record verification results and residual risks after a map_platform implementation.",
    {
      title: { type: "string" },
      change_request_path: { type: "string" },
      changed_files: { type: "array", items: { type: "string" }, default: [] },
      commands_run: { type: "array", items: { type: "string" }, default: [] },
      result: { type: "string", enum: ["passed", "failed", "partial"] },
      notes: { type: "string" },
      residual_risks: { type: "array", items: { type: "string" }, default: [] },
    },
    ["title", "result", "notes"],
  ),
  tool(
    "record_agent_run",
    "Record which agent ran, what it read, changed, verified, and deferred.",
    {
      agent: {
        type: "string",
        enum: mapPlatformAgentNames,
      },
      automation_id: {
        type: "string",
        description: "Automation id or manual run label, for example map-platform-daily-agent-loop.",
      },
      product: { type: "string", default: "map-platform" },
      summary: { type: "string" },
      inputs_read: { type: "array", items: { type: "string" }, default: [] },
      tasks_considered: { type: "array", items: { type: "string" }, default: [] },
      changes_made: { type: "array", items: { type: "string" }, default: [] },
      artifacts_written: { type: "array", items: { type: "string" }, default: [] },
      verification: { type: "array", items: { type: "string" }, default: [] },
      deferred: { type: "array", items: { type: "string" }, default: [] },
      blockers: { type: "array", items: { type: "string" }, default: [] },
      next_recommended_agent: {
        type: "string",
        enum: mapPlatformAgentNames,
      },
      status: { type: "string", enum: ["completed", "partial", "blocked"], default: "completed" },
    },
    ["agent", "automation_id", "summary", "status"],
  ),
  tool("list_agent_runs", "List recorded agent run logs."),
  tool(
    "read_agent_run",
    "Read an agent run log by filename or workspace artifact path.",
    {
      path: {
        type: "string",
        description: "Run filename or path, for example agent-runs/2026-04-25T19-00-routing-tiles-agent.md.",
      },
    },
    ["path"],
  ),
  tool(
    "run_review_checklist",
    "Generate a review checklist packet for a domain.",
    {
      domain: {
        type: "string",
        enum: ["business", "market", "product", "architecture", "agent", "health", "accessibility", "launch"],
      },
      subject: { type: "string" },
    },
    ["domain", "subject"],
  ),
  tool(
    "create_research_note",
    "Create a dated research note with source references and implications.",
    {
      title: { type: "string" },
      topic: { type: "string" },
      summary: { type: "string" },
      sources: { type: "array", items: { type: "string" }, default: [] },
      implications: { type: "array", items: { type: "string" }, default: [] },
    },
    ["title", "topic", "summary"],
  ),
];

const checklistQuestions = {
  business: [
    "Is the target customer specific?",
    "Is the pain frequent or urgent?",
    "Is there a clear willingness-to-pay path?",
    "Does this wedge help the umbrella platform?",
    "Can this be validated in 30-90 days?",
    "What would make us kill or pause this idea?",
  ],
  market: [
    "Who are the direct competitors?",
    "Who are the substitute competitors?",
    "What do users already do today?",
    "What is the India-specific insight?",
    "What distribution channel can we realistically access?",
  ],
  product: [
    "What is the smallest usable workflow?",
    "What user action must happen repeatedly?",
    "What data must be correct for the product to work?",
    "Where can AI help without creating unacceptable risk?",
    "Is accessibility built into the primary workflow?",
  ],
  architecture: [
    "Does this reuse existing platform services?",
    "Is source-of-truth data clearly defined?",
    "Is provenance tracked?",
    "Are environments separated?",
    "Are observability and rollback plans defined?",
  ],
  agent: [
    "What exact workflow will the agent improve?",
    "Which tools does the agent need?",
    "What can the agent read?",
    "What can the agent write?",
    "What actions need human approval?",
    "Is every action auditable?",
  ],
  health: [
    "What claim is being made?",
    "Is the product wellness, decision support, screening, diagnosis, or treatment?",
    "Has a clinician reviewed the language?",
    "What happens if the AI is wrong?",
    "Is consent clear and revocable?",
  ],
  accessibility: [
    "Were Deaf/sign-language users or experts involved?",
    "Is the domain constrained enough for quality?",
    "Is generated content reviewed before publication?",
    "Does the product work for low-bandwidth users?",
    "Is the interface usable in Indian language contexts?",
  ],
  launch: [
    "What is the pilot scope?",
    "Who are the first users?",
    "What metrics determine success?",
    "What support process exists?",
    "What is the rollback plan?",
    "What data will be collected and why?",
  ],
};

async function callTool(name, args = {}) {
  assertObject(args, "arguments");
  await ensureWorkspace();

  if (name === "list_strategy_docs") {
    const files = await walkMarkdownFiles(strategyRoot);
    const docs = await Promise.all(files.map(async (file) => {
      const info = await stat(file.absolute);
      return { path: file.relative, bytes: info.size };
    }));
    return jsonContent({ strategyRoot, docs });
  }

  if (name === "read_strategy_doc") {
    const relativePath = requireString(args, "path");
    return textContent(await readMarkdownByRelativePath(relativePath));
  }

  if (name === "search_strategy_docs") {
    const query = requireString(args, "query").toLowerCase();
    const limit = Number.isFinite(args.limit) ? Math.max(1, Math.min(50, Number(args.limit))) : 10;
    const files = await walkMarkdownFiles(strategyRoot);
    const matches = [];
    for (const file of files) {
      const content = await readFile(file.absolute, "utf8");
      const lines = content.split(/\r?\n/);
      lines.forEach((line, index) => {
        if (line.toLowerCase().includes(query)) {
          matches.push({
            path: file.relative,
            line: index + 1,
            text: line.trim(),
          });
        }
      });
    }
    return jsonContent({ query, matches: matches.slice(0, limit), total_matches: matches.length });
  }

  if (name === "create_product_brief") {
    const productName = requireString(args, "product_name");
    const filePath = path.join(artifactDirs.productBriefs, `${nowStamp()}-${slugify(productName)}.md`);
    const content = [
      `# ${productName}`,
      "",
      `Created: ${new Date().toISOString()}`,
      "",
      "## One-Line Thesis",
      "",
      requireString(args, "thesis"),
      "",
      "## Target Customer",
      "",
      requireString(args, "target_customer"),
      "",
      "## Problem",
      "",
      requireString(args, "problem"),
      "",
      "## Proposed Solution",
      "",
      requireString(args, "proposed_solution"),
      "",
      "## Revenue Hypothesis",
      "",
      args.revenue_hypothesis || "TBD",
      "",
      "## Risks",
      "",
      ...(Array.isArray(args.risks) && args.risks.length ? args.risks.map((risk) => `- ${risk}`) : ["- TBD"]),
      "",
      "## Success Metrics",
      "",
      ...(Array.isArray(args.success_metrics) && args.success_metrics.length
        ? args.success_metrics.map((metric) => `- ${metric}`)
        : ["- TBD"]),
      "",
    ].join("\n");
    await writeFile(filePath, content, "utf8");
    return jsonContent({ created: filePath });
  }

  if (name === "create_agent_spec") {
    const agentName = requireString(args, "agent_name");
    const filePath = path.join(artifactDirs.agentSpecs, `${nowStamp()}-${slugify(agentName)}.md`);
    const content = [
      `# ${agentName}`,
      "",
      `Created: ${new Date().toISOString()}`,
      "",
      "## Purpose",
      "",
      requireString(args, "purpose"),
      "",
      "## Product Line",
      "",
      requireString(args, "product_line"),
      "",
      "## Allowed Tools",
      "",
      markdownList(args.allowed_tools),
      "",
      "## Forbidden Actions",
      "",
      markdownList(args.forbidden_actions, "Production writes without approval"),
      "",
      "## Required Human Approvals",
      "",
      markdownList(args.human_approvals, "Any destructive or production-impacting action"),
      "",
      "## Evaluation Metrics",
      "",
      markdownList(args.evaluation_metrics),
      "",
    ].join("\n");
    await writeFile(filePath, content, "utf8");
    return jsonContent({ created: filePath });
  }

  if (name === "record_decision") {
    const title = requireString(args, "title");
    const status = args.status || "proposed";
    const filePath = path.join(artifactDirs.decisions, `${nowStamp()}-${slugify(title)}.md`);
    const content = [
      `# ${title}`,
      "",
      `Status: ${status}`,
      `Date: ${new Date().toISOString()}`,
      "",
      "## Context",
      "",
      requireString(args, "context"),
      "",
      "## Decision",
      "",
      requireString(args, "decision"),
      "",
      "## Consequences",
      "",
      requireString(args, "consequences"),
      "",
    ].join("\n");
    await writeFile(filePath, content, "utf8");
    return jsonContent({ created: filePath, status });
  }

  if (name === "list_decisions") {
    if (!existsSync(artifactDirs.decisions)) return jsonContent({ decisions: [] });
    const entries = await readdir(artifactDirs.decisions, { withFileTypes: true });
    const decisions = entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
      .map((entry) => path.join(artifactDirs.decisions, entry.name))
      .sort();
    return jsonContent({ decisions });
  }

  if (name === "list_workspace_artifacts") {
    const artifacts = await walkWorkspaceArtifacts();
    return jsonContent({
      workspaceRoot,
      artifacts: artifacts.map(({ kind, path: artifactPath }) => ({ kind, path: artifactPath })),
    });
  }

  if (name === "read_workspace_artifact") {
    const relativePath = requireString(args, "path");
    return textContent(await readWorkspaceArtifact(relativePath));
  }

  if (name === "list_map_platform_files") {
    const files = await walkRepoFiles(mapPlatformRoot);
    const readable = files.filter((file) => {
      const extension = path.extname(file.relative);
      return repoTextExtensions.has(extension) || path.basename(file.relative) === "Dockerfile";
    });
    const withSizes = await Promise.all(readable.map(async (file) => {
      const info = await stat(file.absolute);
      return { path: file.relative, bytes: info.size };
    }));
    return jsonContent({ mapPlatformRoot, files: withSizes });
  }

  if (name === "list_map_platform_directory") {
    const relativePath = requireOptionalString(args, "path") || ".";
    const limit = Number.isFinite(args.limit) ? Math.max(1, Math.min(250, Number(args.limit))) : 120;
    return jsonContent({
      mapPlatformRoot,
      path: relativePath,
      entries: await listMapPlatformDirectory(relativePath, { limit }),
    });
  }

  if (name === "read_map_platform_file") {
    const relativePath = requireString(args, "path");
    return textContent(await readMapPlatformFile(relativePath));
  }

  if (name === "get_map_platform_file_metadata") {
    const relativePath = requireString(args, "path");
    const metadata = await getMapPlatformFileInfo(relativePath);
    return jsonContent({
      path: metadata.path,
      bytes: metadata.bytes,
      sha256: metadata.sha256,
    });
  }

  if (name === "search_map_platform") {
    const query = requireString(args, "query").toLowerCase();
    const limit = Number.isFinite(args.limit) ? Math.max(1, Math.min(50, Number(args.limit))) : 20;
    const files = await walkRepoFiles(mapPlatformRoot);
    const matches = [];
    for (const file of files) {
      const extension = path.extname(file.relative);
      if (!repoTextExtensions.has(extension) && path.basename(file.relative) !== "Dockerfile") continue;
      const info = await stat(file.absolute);
      if (info.size > 200_000) continue;
      const content = await readFile(file.absolute, "utf8");
      const lines = content.split(/\r?\n/);
      lines.forEach((line, index) => {
        if (line.toLowerCase().includes(query)) {
          matches.push({
            path: file.relative,
            line: index + 1,
            text: line.trim(),
          });
        }
      });
    }
    return jsonContent({ query, matches: matches.slice(0, limit), total_matches: matches.length });
  }

  if (name === "map_platform_git_status") {
    const { stdout } = await execFileAsync("git", ["status", "--short"], {
      cwd: mapPlatformRoot,
      timeout: 5000,
      maxBuffer: 1024 * 1024,
    });
    return jsonContent({
      mapPlatformRoot,
      clean: stdout.trim().length === 0,
      status: stdout.trim().split(/\r?\n/).filter(Boolean),
    });
  }

  if (name === "map_platform_git_diff") {
    const { stdout } = await execFileAsync("git", ["diff", "--binary"], {
      cwd: mapPlatformRoot,
      timeout: 10000,
      maxBuffer: 8 * 1024 * 1024,
    });
    return jsonContent({
      mapPlatformRoot,
      diff: stdout,
      empty: stdout.trim().length === 0,
    });
  }

  if (name === "run_map_platform_verify") {
    const timeoutMs = Number.isFinite(args.timeout_ms)
      ? Math.max(1000, Math.min(300000, Number(args.timeout_ms)))
      : 300000;
    try {
      const { stdout, stderr } = await execFileAsync("bash", ["./scripts/verify.sh"], {
        cwd: mapPlatformRoot,
        timeout: timeoutMs,
        maxBuffer: 8 * 1024 * 1024,
        env: {
          ...process.env,
          PYTHONPYCACHEPREFIX: process.env.PYTHONPYCACHEPREFIX || "/tmp/map_platform_pycache",
        },
      });
      return jsonContent({ ok: true, command: "bash ./scripts/verify.sh", stdout, stderr });
    } catch (error) {
      return jsonContent({
        ok: false,
        command: "bash ./scripts/verify.sh",
        stdout: coerceExecString(error.stdout),
        stderr: coerceExecString(error.stderr),
        error: execErrorSummary(error) || error.message || "verification failed",
      });
    }
  }

  if (name === "doctor_map_platform_verify") {
    const patchHint = (requireOptionalString(args, "patch_hint") || "make-verify-sandbox-safe")
      .toLowerCase()
      .trim();
    const timeoutMs = Number.isFinite(args.timeout_ms)
      ? Math.max(250, Math.min(10000, Number(args.timeout_ms)))
      : 1500;
    const dryRun = Boolean(args.dry_run);

    const verifyScriptPath = path.join(mapPlatformRoot, "scripts", "verify.sh");
    const frontendPath = path.join(mapPlatformRoot, "frontend");
    const frontendNodeModulesPath = path.join(frontendPath, "node_modules");

    const patch = await findLatestExportedPatch({ hint: patchHint });

    const planned = {
      map_platform_root: mapPlatformRoot,
      verify_script_path: verifyScriptPath,
      exported_patch: patch,
      checks: {
        frontend_exists: existsSync(frontendPath),
        frontend_writable: await isPathWritable(frontendPath),
        frontend_node_modules_exists: existsSync(frontendNodeModulesPath),
      },
      notes: [
        "This tool does not apply patches; it validates patch readiness with git apply --check and provides remediation commands.",
      ],
    };

    if (dryRun) {
      return jsonContent({ dry_run: true, ...planned });
    }

    const verifyScriptExists = existsSync(verifyScriptPath);
    const verifyScriptContent = verifyScriptExists ? await readFile(verifyScriptPath, "utf8") : "";
    const verifyScriptHasSkip = verifyScriptContent.includes("SKIP_FRONTEND_BUILD");

    const patchChecks = {
      found: Boolean(patch),
      applies_cleanly: null,
      reverse_applies_cleanly: null,
      error: null,
    };

    if (patch) {
      try {
        await execFileAsync("git", ["apply", "--check", patch.absolute], {
          cwd: mapPlatformRoot,
          timeout: timeoutMs,
          maxBuffer: 1024 * 1024,
        });
        patchChecks.applies_cleanly = true;
      } catch (error) {
        patchChecks.applies_cleanly = false;
        patchChecks.error = execErrorSummary(error);
      }

      try {
        await execFileAsync("git", ["apply", "--check", "--reverse", patch.absolute], {
          cwd: mapPlatformRoot,
          timeout: timeoutMs,
          maxBuffer: 1024 * 1024,
        });
        patchChecks.reverse_applies_cleanly = true;
      } catch (error) {
        patchChecks.reverse_applies_cleanly = false;
        patchChecks.error = patchChecks.error || execErrorSummary(error);
      }
    }

    const frontendWritable = planned.checks.frontend_writable;
    const frontendNodeModulesExists = planned.checks.frontend_node_modules_exists;

    const actions = [];
    if (!verifyScriptExists) {
      actions.push("Missing scripts/verify.sh in map_platform; ensure MAP_PLATFORM_ROOT points at the correct repo.");
    } else if (frontendNodeModulesExists && !frontendWritable && !verifyScriptHasSkip) {
      actions.push(
        "Verification likely fails with Vite EPERM in sandboxed environments because frontend/ is not writable but verify.sh still runs `npm run build`.",
      );
    }

    if (patch) {
      if (patchChecks.reverse_applies_cleanly) {
        actions.push(`Patch already applied: ${patch.relative}`);
      } else if (patchChecks.applies_cleanly) {
        actions.push("Apply the sandbox-safe verification patch in a writable environment:");
        actions.push(`cd ${mapPlatformRoot}`);
        actions.push(`git apply ${path.join(repoRoot, patch.relative)}`);
        actions.push("./scripts/verify.sh");
      } else {
        actions.push(`Exported patch did not apply cleanly: ${patch.relative}`);
        actions.push("Re-export the patch against the current verify.sh state (or update verify.sh manually).");
      }
    } else {
      actions.push(
        `No exported patch found matching patch_hint='${patchHint}' under exports/map-platform/patches/.`,
      );
    }

    actions.push(
      "After the patch is applied, you can force-skip the frontend build via: SKIP_FRONTEND_BUILD=1 ./scripts/verify.sh",
    );

    return jsonContent({
      summary: {
        map_platform_root: mapPlatformRoot,
        verify_script_exists: verifyScriptExists,
        verify_script_supports_skip_frontend_build: verifyScriptHasSkip,
        frontend_writable: frontendWritable,
        frontend_node_modules_exists: frontendNodeModulesExists,
        exported_patch_found: Boolean(patch),
        exported_patch_applies_cleanly: patchChecks.applies_cleanly,
        exported_patch_reverse_applies_cleanly: patchChecks.reverse_applies_cleanly,
      },
      patch_checks: patchChecks,
      actions,
      notes: planned.notes,
    });
  }

  if (name === "doctor_map_platform_dev_interface") {
    const patchHint = (requireOptionalString(args, "patch_hint") || "fix-route-load-failed")
      .toLowerCase()
      .trim();
    const backendUrl = requireOptionalUrl(args, "backend_url") || "http://localhost:8000";
    const frontendUrl = requireOptionalUrl(args, "frontend_url") || "http://localhost:3001";
    const geocoderUrl = requireOptionalUrl(args, "geocoder_url") || "http://localhost:8080";
    const customRouterUrl = requireOptionalUrl(args, "custom_router_url") || "http://localhost:8090";
    const osrmUrl = requireOptionalUrl(args, "osrm_url") || "http://localhost:5001";
    const origin = requireOptionalString(args, "origin") || "28.6139,77.2090";
    const destination = requireOptionalString(args, "destination") || "28.6129,77.2295";
    const timeoutMs = Number.isFinite(args.timeout_ms)
      ? Math.max(250, Math.min(10000, Number(args.timeout_ms)))
      : 1500;
    const dryRun = Boolean(args.dry_run);

    const baseConfig = {
      patch_hint: patchHint,
      backend_url: backendUrl,
      frontend_url: frontendUrl,
      geocoder_url: geocoderUrl,
      custom_router_url: customRouterUrl,
      osrm_url: osrmUrl,
      origin,
      destination,
      timeout_ms: timeoutMs,
    };

    const remediationPatch = await findLatestExportedPatch({ hint: patchHint });
    const remediationPatchReference = remediationPatch
      ? remediationPatch.relative
      : `exports/map-platform/patches/*${patchHint}*.patch`;

    const repoStatus = await mapPlatformGitStatusShort({ timeoutMs: Math.min(1500, timeoutMs) });

    const plannedChecks = [
      { name: "frontend_html", url: new URL("/", frontendUrl).toString() },
      { name: "backend_health", url: new URL("/", backendUrl).toString() },
      {
        name: "backend_geocode",
        url: new URL(
          `/geocode?${new URLSearchParams({ address: "Connaught Place, Delhi", limit: "1" })}`,
          backendUrl,
        ).toString(),
      },
      {
        name: "backend_route",
        url: new URL(`/route?${new URLSearchParams({ origin, destination })}`, backendUrl).toString(),
      },
      { name: "custom_router_health", url: new URL("/", customRouterUrl).toString() },
      {
        name: "custom_router_route",
        url: new URL(`/route?${new URLSearchParams({ origin, destination })}`, customRouterUrl).toString(),
      },
    ];

    const osrmHost = (() => {
      try {
        return new URL(osrmUrl).host.toLowerCase();
      } catch {
        return "";
      }
    })();

    const customRouterHost = (() => {
      try {
        return new URL(customRouterUrl).host.toLowerCase();
      } catch {
        return "";
      }
    })();

    try {
      const o = parseLatLon(origin);
      const d = parseLatLon(destination);
      plannedChecks.push({
        name: "osrm_route",
        url: new URL(
          `/route/v1/driving/${o.lon},${o.lat};${d.lon},${d.lat}?${new URLSearchParams({ overview: "false" })}`,
          osrmUrl,
        ).toString(),
      });
    } catch {
      plannedChecks.push({
        name: "osrm_route",
        url: null,
        note: "Skipped: origin/destination not parseable as lat,lon.",
      });
    }

    if (dryRun) {
      const dryRunActions = [];
      if (repoStatus.ok && !repoStatus.clean) {
        dryRunActions.push({
          action: "map_platform working tree is not clean",
          note: "Untracked/modified files can cause Source Control noise and hide the real changes from a daily loop. Review the short status below.",
          status: repoStatus.status.slice(0, 50),
        });
      } else if (!repoStatus.ok) {
        dryRunActions.push({
          action: "Unable to read map_platform git status",
          note: repoStatus.error,
        });
      }
      return jsonContent({
        dry_run: true,
        config: baseConfig,
        repo_status: { map_platform: repoStatus },
        checks: plannedChecks,
        remediation_patch: remediationPatch,
        actions: dryRunActions,
        notes: [
          "Call again with dry_run=false to execute HTTP checks against localhost dev services.",
          `If backend_route fails with OSRM unavailable, either start OSRM or switch the backend to use the custom router provider for local dev (see exported patch: ${remediationPatchReference}).`,
        ],
      });
    }

    const listenProbe = await probeLocalListenCapability({ timeoutMs: Math.min(500, timeoutMs) });

    const checks = await Promise.all(
      plannedChecks.map(async (check) => {
        if (!check.url) {
          return { ...check, ok: false, skipped: true };
        }
        try {
          const response = await fetchWithTimeout(check.url, { timeoutMs });
          const sample = response.bodyText.slice(0, 300);
          const maybeJson = response.contentType.toLowerCase().includes("json")
            ? safeJsonParse(response.bodyText)
            : { ok: false, value: null };
          const extractedError =
            maybeJson.ok && maybeJson.value && typeof maybeJson.value === "object"
              ? typeof maybeJson.value.error === "string"
                ? maybeJson.value.error
                : typeof maybeJson.value.detail === "string"
                  ? maybeJson.value.detail
                  : undefined
              : undefined;
          const logicalError = Boolean(extractedError);
          const contractError = (() => {
            if (!response.ok || logicalError) return undefined;
            if (!maybeJson.ok) {
              if (["backend_route", "custom_router_route", "osrm_route"].includes(check.name)) {
                return "Expected JSON response";
              }
              return undefined;
            }

            const value = maybeJson.value;
            if (!value || typeof value !== "object" || Array.isArray(value)) {
              if (["backend_route", "custom_router_route", "osrm_route"].includes(check.name)) {
                return "Expected JSON object response";
              }
              return undefined;
            }

            if (check.name === "backend_route" || check.name === "custom_router_route") {
              const geometry = value.geometry;
              if (!Array.isArray(geometry)) return "Route response missing geometry[]";
              if (geometry.length < 2) return "Route geometry[] must contain at least 2 points";
              const badPoint = geometry.find((point) => {
                if (!Array.isArray(point) || point.length < 2) return true;
                const lon = Number(point[0]);
                const lat = Number(point[1]);
                return !Number.isFinite(lon) || !Number.isFinite(lat);
              });
              if (badPoint) return "Route geometry[] points must be [lon,lat] numbers";
            }

            if (check.name === "osrm_route") {
              if (!Array.isArray(value.routes) || value.routes.length === 0) {
                return "OSRM response missing routes[]";
              }
            }

            return undefined;
          })();

          const hint = (() => {
            const errorText = (contractError || extractedError || sample).toLowerCase();
            if (
              (check.name === "backend_route" || check.name === "custom_router_route") &&
              contractError
            ) {
              return `Route response shape invalid: ${contractError}. Expected { geometry: [[lon,lat], ...] }.`;
            }
            if (check.name === "osrm_route" && contractError) {
              return `OSRM response shape invalid: ${contractError}. Ensure OSRM is running and reachable at osrm_url.`;
            }
            if (
              check.name === "backend_route" &&
              (logicalError || !response.ok) &&
              (errorText.includes("osrm") ||
                (osrmHost && errorText.includes(osrmHost)) ||
                errorText.includes("route/v1"))
            ) {
              return [
                "Backend route call indicates OSRM trouble.",
                "For local dev without OSRM, switch backend routing to the internal custom router provider.",
                `Patch available: ${remediationPatchReference}`,
              ].join(" ");
            }
            if (
              check.name === "backend_route" &&
              (logicalError || !response.ok) &&
              (errorText.includes("custom router") ||
                errorText.includes("custom_router") ||
                (customRouterHost && errorText.includes(customRouterHost)))
            ) {
              return "Backend route call indicates custom_router trouble; ensure custom_router is running at custom_router_url or switch ROUTER_PROVIDER=osrm (with OSRM running).";
            }
            if (check.name === "backend_route" && (logicalError || !response.ok)) {
              return "Backend route failed; inspect backend logs and router service health.";
            }
            if (check.name === "custom_router_route" && (logicalError || !response.ok)) {
              return "Custom router route failed; ensure custom_router is running and reachable.";
            }
            return undefined;
          })();
          return {
            name: check.name,
            url: check.url,
            ok: response.ok && !logicalError && !contractError,
            status: response.status,
            ms: response.ms,
            content_type: response.contentType,
            sample,
            extracted_error: extractedError,
            contract_error: contractError,
            hint,
          };
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          const hint =
            check.name === "backend_route"
              ? "Backend route endpoint unreachable; if the UI shows 'load failed', confirm backend is running and reachable at backend_url."
              : undefined;
          return { name: check.name, url: check.url, ok: false, error: message, hint };
        }
      }),
    );

    const okCount = checks.filter((check) => check.ok).length;
    const failCount = checks.length - okCount;

    const actions = [];
    if (repoStatus.capabilities && !repoStatus.capabilities.repo_root_writable) {
      actions.push({
        action: "Sandbox limitation: map_platform repo not writable",
        note: "This environment cannot write to MAP_PLATFORM_ROOT. Apply patches and run commit/push steps outside the sandbox.",
      });
    }
    if (repoStatus.capabilities && !repoStatus.capabilities.fetch_head_writable) {
      actions.push({
        action: "Sandbox limitation: git fetch blocked",
        note: "This environment cannot write .git/FETCH_HEAD, so git fetch/pull and some finalization steps will fail. Run sync outside the sandbox.",
      });
    }
    if (repoStatus.capabilities && !repoStatus.capabilities.worktrees_dir_writable) {
      actions.push({
        action: "Sandbox limitation: git worktree cleanup blocked",
        note: "This environment cannot write .git/worktrees, so git worktree remove/prune will fail. Run cleanup outside the sandbox.",
      });
    }
    const worktreeRows = Array.isArray(repoStatus.worktrees) ? repoStatus.worktrees : [];
    const codexWorktrees = worktreeRows.filter(
      (worktree) =>
        worktree &&
        typeof worktree.path === "string" &&
        worktree.path.includes("/.codex/worktrees/") &&
        worktree.path !== mapPlatformRoot,
    );
    if (codexWorktrees.length > 0) {
      actions.push({
        action: "Review/remove stale Codex map_platform worktrees",
        note: "Multiple Codex worktrees can create Source Control noise. Remove only the worktrees you no longer need, then run `git worktree prune`.",
        worktrees: codexWorktrees.slice(0, 10),
        suggested_commands: [
          `cd ${mapPlatformRoot} && git worktree list`,
          ...codexWorktrees.slice(0, 10).map((worktree) => `git worktree remove --force ${worktree.path}`),
          "git worktree prune",
        ],
      });
    }
    if (repoStatus.ok && !repoStatus.clean) {
      actions.push({
        action: "Review map_platform git status (clean up untracked files)",
        command: `cd ${mapPlatformRoot} && git status --short --branch`,
        note: "Decide whether these files should be committed (source) or ignored/removed (generated artifacts). Avoid committing local build outputs, node_modules, or secrets.",
        status: repoStatus.status.slice(0, 50),
      });
    } else if (!repoStatus.ok) {
      actions.push({
        action: "Unable to read map_platform git status",
        note: repoStatus.error,
      });
    }
    if (repoStatus.ok && repoStatus.branch) {
      const branch = repoStatus.branch;
      if (branch.detached) {
        actions.push({
          action: "Attach HEAD to a branch (avoid detached state)",
          command: `cd ${mapPlatformRoot} && git switch -c codex/${new Date().toISOString().slice(0, 10)}-daily-loop`,
          note: "Use a branch before committing/pushing so the daily loop can finalize cleanly.",
          status: branch.summary,
        });
      }
      if (Number(branch.behind) > 0) {
        actions.push({
          action: "Sync map_platform from upstream (fast-forward only)",
          command: `cd ${mapPlatformRoot} && git fetch origin && git pull --ff-only`,
          note: "If fetch is blocked in this environment (cannot write .git/FETCH_HEAD), run these commands outside the sandbox.",
          status: branch.summary,
        });
      }
      if (Number(branch.ahead) > 0) {
        actions.push({
          action: "Push local map_platform commits to origin",
          command:
            branch.head === "main"
              ? `cd ${mapPlatformRoot} && git push origin main`
              : `cd ${mapPlatformRoot} && git push -u origin HEAD`,
          note:
            branch.head === "main"
              ? "Pushes the local main branch to origin/main."
              : "Pushes the current branch to origin and sets upstream tracking.",
          status: branch.summary,
          recent_commits: Array.isArray(repoStatus.recent_commits_ahead)
            ? repoStatus.recent_commits_ahead.slice(0, 5)
            : [],
        });
      }
    }
    if (!listenProbe.ok && failCount === checks.length) {
      actions.push({
        action: "Sandbox limitation: cannot open localhost ports",
        note: `This environment cannot bind listening sockets (${listenProbe.error || "unknown error"}). Start the map_platform dev stack outside this sandbox and rerun this tool.`,
      });
    }
    const backendRoute = checks.find((check) => check.name === "backend_route");
    const osrmRoute = checks.find((check) => check.name === "osrm_route");
    const customRouterRoute = checks.find((check) => check.name === "custom_router_route");
    const customRouterHealth = checks.find((check) => check.name === "custom_router_health");
    if (backendRoute && !backendRoute.ok) {
      if (backendRoute.url) {
        actions.push({
          action: "Manual curl to inspect backend /route response",
          command: `curl \"${backendRoute.url}\"`,
        });
      }
      const hintText = String(backendRoute.hint || backendRoute.extracted_error || backendRoute.sample || "")
        .toLowerCase()
        .slice(0, 2000);
      const osrmDown = Boolean(osrmRoute && !osrmRoute.skipped && !osrmRoute.ok);
      const customRouterUp = Boolean(
        (customRouterHealth && !customRouterHealth.skipped && customRouterHealth.ok) ||
          (customRouterRoute && !customRouterRoute.skipped && customRouterRoute.ok),
      );
      const likelyOsrmIssue = hintText.includes("osrm") || hintText.includes("route/v1") || (osrmHost && hintText.includes(osrmHost));
      const likelyProviderMismatch = osrmDown && customRouterUp;

      if (likelyOsrmIssue || likelyProviderMismatch) {
        if (remediationPatch) {
          actions.push({
            action: "Check whether the route remediation patch is already applied",
            command: `cd ${mapPlatformRoot} && git apply --check --reverse ${remediationPatch.absolute}`,
            note: "If this command succeeds, the patch is likely already present in the working tree.",
          });
          actions.push({
            action: "Apply exported patch to default to custom router in non-Docker local dev",
            command: `cd ${mapPlatformRoot} && git apply ${remediationPatch.absolute}`,
            note: "If you cannot write to map_platform in this environment, apply this patch manually outside the sandbox.",
          });
        } else {
          actions.push({
            action: "Locate or re-export the route remediation patch",
            note: `No exported patch found under exports/map-platform/patches/ matching patch_hint='${patchHint}'.`,
          });
        }
      } else if (!customRouterUp && osrmRoute && !osrmRoute.skipped && osrmRoute.ok) {
        actions.push({
          action: "Force OSRM routing for local dev (if custom_router is down)",
          command: `cd ${mapPlatformRoot} && ROUTER_PROVIDER=osrm ./scripts/start-backend.sh`,
          note: "This requires OSRM to be running and reachable at osrm_url.",
        });
      }
    }

    return jsonContent({
      dry_run: false,
      config: baseConfig,
      repo_status: { map_platform: repoStatus },
      environment: {
        can_listen_localhost: Boolean(listenProbe.ok),
        listen_error: listenProbe.ok ? null : listenProbe.error || "unknown error",
      },
      summary: { ok: okCount, failed: failCount, total: checks.length },
      checks,
      actions,
    });
  }

  if (name === "doctor_map_platform_place_contract") {
    const backendUrl = requireOptionalUrl(args, "backend_url") || "http://localhost:8000";
    const address = requireOptionalString(args, "address") || "Connaught Place, Delhi";
    const limit = Number.isFinite(args.limit) ? Math.max(1, Math.min(10, Number(args.limit))) : 1;
    const timeoutMs = Number.isFinite(args.timeout_ms)
      ? Math.max(250, Math.min(10000, Number(args.timeout_ms)))
      : 1500;
    const dryRun = Boolean(args.dry_run);

    const checkUrl = new URL("/geocode", backendUrl);
    checkUrl.searchParams.set("address", address);
    checkUrl.searchParams.set("limit", String(limit));

    const baseConfig = {
      backend_url: backendUrl,
      address,
      limit,
      timeout_ms: timeoutMs,
    };

    const plannedCheck = {
      name: "backend_geocode_place_contract",
      url: checkUrl.toString(),
      note: "Validates the MVP Place contract described in map_platform/docs/place_contract.md.",
    };

    if (dryRun) {
      return jsonContent({
        dry_run: true,
        config: baseConfig,
        checks: [plannedCheck],
        notes: [
          "Call again with dry_run=false to fetch /geocode and validate the Place contract shape.",
          "If this fails, confirm the backend and geocoder are running and that /geocode returns Place[] (not raw Nominatim output).",
        ],
      });
    }

    const actions = [
      {
        action: "Manual curl to inspect Place[] response",
        command: `curl "${plannedCheck.url}"`,
      },
      {
        action: "Read contract doc (repo-local)",
        note: "See map_platform/docs/place_contract.md for the MVP Place shape and rules.",
      },
    ];

    try {
      const response = await fetchWithTimeout(plannedCheck.url, { timeoutMs });
      const sample = response.bodyText.slice(0, 400);
      const maybeJson = response.contentType.toLowerCase().includes("json")
        ? safeJsonParse(response.bodyText)
        : { ok: false, value: null };
      const extractedError =
        maybeJson.ok && maybeJson.value && typeof maybeJson.value === "object" && !Array.isArray(maybeJson.value)
          ? typeof maybeJson.value.error === "string"
            ? maybeJson.value.error
            : typeof maybeJson.value.detail === "string"
              ? maybeJson.value.detail
              : undefined
          : undefined;
      const logicalError = Boolean(extractedError);

      const missingFields = [];
      const typeErrors = [];

      const requiredKeys = [
        "id",
        "name",
        "display_name",
        "category",
        "address_text",
        "lat",
        "lon",
        "landmark_aliases",
        "provenance",
        "confidence",
        "accessibility",
        "review_status",
      ];

      const checkString = (obj, key) => {
        if (!(key in obj)) missingFields.push(key);
        else if (typeof obj[key] !== "string") typeErrors.push(`${key} must be a string`);
      };

      const checkNumber = (obj, key) => {
        if (!(key in obj)) missingFields.push(key);
        else if (!Number.isFinite(Number(obj[key]))) typeErrors.push(`${key} must be a number`);
      };

      const checkArray = (obj, key) => {
        if (!(key in obj)) missingFields.push(key);
        else if (!Array.isArray(obj[key])) typeErrors.push(`${key} must be an array`);
      };

      const checkObject = (obj, key) => {
        if (!(key in obj)) missingFields.push(key);
        else if (!obj[key] || typeof obj[key] !== "object" || Array.isArray(obj[key])) typeErrors.push(`${key} must be an object`);
      };

      let place = null;
      if (maybeJson.ok && Array.isArray(maybeJson.value) && maybeJson.value.length > 0) {
        const candidate = maybeJson.value[0];
        if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
          typeErrors.push("Place[0] must be an object");
        } else {
          place = candidate;
          requiredKeys.forEach((key) => {
            if (!(key in place)) missingFields.push(key);
          });

          checkString(place, "id");
          checkString(place, "display_name");
          checkString(place, "category");
          checkString(place, "address_text");
          checkNumber(place, "lat");
          checkNumber(place, "lon");
          checkArray(place, "landmark_aliases");
          checkObject(place, "provenance");
          checkObject(place, "accessibility");
          checkString(place, "review_status");

          if ("name" in place && place.name !== null && place.name !== undefined && typeof place.name !== "string") {
            typeErrors.push("name must be a string when present");
          }
          if ("confidence" in place && place.confidence !== null && place.confidence !== undefined && !Number.isFinite(Number(place.confidence))) {
            typeErrors.push("confidence must be a number when present");
          }

          if (place.provenance && typeof place.provenance === "object" && !Array.isArray(place.provenance)) {
            ["source", "source_id", "license", "retrieved_at"].forEach((key) => checkString(place.provenance, key));
          }

          if (place.accessibility && typeof place.accessibility === "object" && !Array.isArray(place.accessibility)) {
            [
              "wheelchair_access",
              "step_free_access",
              "accessible_parking",
              "sign_language_support",
              "review_status",
            ].forEach((key) => checkString(place.accessibility, key));
          }
        }
      } else if (maybeJson.ok && Array.isArray(maybeJson.value) && maybeJson.value.length === 0) {
        typeErrors.push("Expected Place[] to be non-empty for this check");
      } else if (maybeJson.ok) {
        typeErrors.push("Expected /geocode response to be a JSON array (Place[])");
      } else if (!response.contentType.toLowerCase().includes("json")) {
        typeErrors.push(`Expected JSON response but got content-type: ${response.contentType || "(missing)"}`);
      } else {
        typeErrors.push("Failed to parse JSON from /geocode response");
      }

      const hint = (() => {
        if (!response.ok || logicalError) {
          return "Backend /geocode is failing; ensure backend+geocoder are running and reachable at backend_url.";
        }
        if (missingFields.length || typeErrors.length) {
          return "Place contract mismatch; compare response to map_platform/docs/place_contract.md and ensure geocoder normalization is enabled.";
        }
        return undefined;
      })();

      if (hint) {
        actions.unshift({
          action: "Start backend stack (repo-local)",
          command: `cd ${mapPlatformRoot} && ./scripts/start-backend.sh`,
          note: "If you cannot run scripts in this environment, start the backend/geocoder via your normal local dev workflow.",
        });
      }

      const ok = response.ok && !logicalError && missingFields.length === 0 && typeErrors.length === 0;

      return jsonContent({
        dry_run: false,
        config: baseConfig,
        summary: { ok: ok ? 1 : 0, failed: ok ? 0 : 1, total: 1 },
        checks: [
          {
            name: plannedCheck.name,
            url: plannedCheck.url,
            ok,
            status: response.status,
            ms: response.ms,
            content_type: response.contentType,
            extracted_error: extractedError,
            sample,
            missing_fields: missingFields,
            type_errors: typeErrors,
            hint,
            place_keys: place && typeof place === "object" ? Object.keys(place).sort() : null,
          },
        ],
        actions,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      actions.unshift({
        action: "Start backend stack (repo-local)",
        command: `cd ${mapPlatformRoot} && ./scripts/start-backend.sh`,
      });
      return jsonContent({
        dry_run: false,
        config: baseConfig,
        summary: { ok: 0, failed: 1, total: 1 },
        checks: [
          {
            ...plannedCheck,
            ok: false,
            error: message,
            hint: "Backend /geocode unreachable; confirm backend is running and reachable at backend_url.",
          },
        ],
        actions,
      });
    }
  }

  if (name === "create_map_platform_agent_task") {
    const title = requireString(args, "title");
    const filePath = path.join(artifactDirs.mapPlatformTasks, `${nowStamp()}-${slugify(title)}.md`);
    const content = [
      `# ${title}`,
      "",
      `Created: ${new Date().toISOString()}`,
      `Agent: ${requireString(args, "agent")}`,
      `Repository: ${mapPlatformRoot}`,
      "",
      "## Objective",
      "",
      requireString(args, "objective"),
      "",
      "## Scope",
      "",
      markdownList(args.scope),
      "",
      "## Files Allowed",
      "",
      markdownList(args.files_allowed, "Read-only until explicitly approved"),
      "",
      "## Verification",
      "",
      markdownList(args.verification, "Define before implementation"),
      "",
      "## Risks",
      "",
      markdownList(args.risks, "TBD"),
      "",
    ].join("\n");
    await writeFile(filePath, content, "utf8");
    return jsonContent({ created: filePath });
  }

  if (name === "create_map_platform_patch_proposal") {
    const title = requireString(args, "title");
    const agent = requireString(args, "agent");
    const filePath = path.join(artifactDirs.mapPlatformPatchProposals, `${nowStamp()}-${slugify(title)}.md`);
    const proposedChanges = Array.isArray(args.proposed_changes) && args.proposed_changes.length
      ? args.proposed_changes.map((change) => [
        `### ${change.file || "Unspecified file"}`,
        "",
        change.change || "TBD",
        "",
        "Rationale:",
        "",
        change.rationale || "TBD",
      ].join("\n")).join("\n\n")
      : "TBD";
    const content = [
      `# ${title}`,
      "",
      `Created: ${new Date().toISOString()}`,
      `Agent: ${agent}`,
      `Repository: ${mapPlatformRoot}`,
      `Status: proposed`,
      args.task_path ? `Related task: ${args.task_path}` : "Related task: TBD",
      "",
      "## Summary",
      "",
      requireString(args, "summary"),
      "",
      "## Target Files",
      "",
      markdownList(args.target_files),
      "",
      "## Proposed Changes",
      "",
      proposedChanges,
      "",
      "## Patch",
      "",
      "```diff",
      args.patch || "# No concrete diff supplied. Proposal is conceptual.",
      "```",
      "",
      "## Verification",
      "",
      markdownList(args.verification, "Define before implementation"),
      "",
      "## Risks",
      "",
      markdownList(args.risks, "TBD"),
      "",
      "## Rollback",
      "",
      args.rollback || "Revert the reviewed code changes before merge. No repository files were modified by this proposal.",
      "",
    ].join("\n");
    await writeFile(filePath, content, "utf8");
    return jsonContent({ created: filePath, status: "proposed" });
  }

  if (name === "list_map_platform_patch_proposals") {
    if (!existsSync(artifactDirs.mapPlatformPatchProposals)) return jsonContent({ proposals: [] });
    const entries = await readdir(artifactDirs.mapPlatformPatchProposals, { withFileTypes: true });
    const proposals = entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
      .map((entry) => `map-platform-patch-proposals/${entry.name}`)
      .sort();
    return jsonContent({ proposals });
  }

  if (name === "read_map_platform_patch_proposal") {
    const requestedPath = requireString(args, "path");
    const proposalPath = requestedPath.startsWith("map-platform-patch-proposals/")
      ? requestedPath
      : `map-platform-patch-proposals/${requestedPath}`;
    return textContent(await readWorkspaceArtifact(proposalPath));
  }

  if (name === "create_map_platform_change_request") {
    const title = requireString(args, "title");
    const filePath = path.join(artifactDirs.mapPlatformChangeRequests, `${nowStamp()}-${slugify(title)}.md`);
    const content = [
      `# ${title}`,
      "",
      `Created: ${new Date().toISOString()}`,
      `Agent: ${requireString(args, "agent")}`,
      `Repository: ${mapPlatformRoot}`,
      `Status: approved-for-scoped-work`,
      args.proposal_path ? `Related proposal: ${args.proposal_path}` : "Related proposal: TBD",
      "",
      "## Objective",
      "",
      requireString(args, "objective"),
      "",
      "## Allowed Files",
      "",
      markdownList(args.allowed_files, "No files approved"),
      "",
      "## Verification",
      "",
      markdownList(args.verification, "Define before implementation"),
      "",
      "## Approval Note",
      "",
      requireString(args, "approval_note"),
      "",
    ].join("\n");
    await writeFile(filePath, content, "utf8");
    return jsonContent({
      created: filePath,
      path: `map-platform-change-requests/${path.basename(filePath)}`,
      status: "approved-for-scoped-work",
    });
  }

  if (name === "write_map_platform_file") {
    if (!mapPlatformWriteEnabled) {
      throw new Error("Map platform writes are disabled. Restart with MAP_PLATFORM_WRITE_ENABLED=true to allow scoped writes.");
    }
    const relativePath = requireString(args, "path");
    const expectedSha = args.expected_sha256 === null ? null : requireString(args, "expected_sha256");
    const changeRequestPath = requireString(args, "change_request_path");
    const approvalNote = requireString(args, "approval_note");
    const content = args.content;
    if (typeof content !== "string") throw new Error("content is required");
    const changeRequestText = await readWorkspaceArtifact(changeRequestPath);
    const allowedFiles = extractAllowedFiles(changeRequestText);
    if (!isPathAllowedByChangeRequest(relativePath, allowedFiles)) {
      throw new Error(`Refusing write: ${relativePath} is not listed in the change request allowed files`);
    }
    const current = await getOptionalMapPlatformFileInfo(relativePath);
    if (current.exists && current.sha256 !== expectedSha) {
      throw new Error(`Refusing write: current sha256 ${current.sha256} does not match expected ${expectedSha}`);
    }
    if (!current.exists && expectedSha !== null) {
      throw new Error("Refusing write: expected_sha256 must be null when creating a new file");
    }
    try {
      await mkdir(path.dirname(current.absolute), { recursive: true });
      await writeFile(current.absolute, content, "utf8");
    } catch (err) {
      const code = err && typeof err === "object" ? err.code : undefined;
      if (code === "EACCES" || code === "EPERM") {
        throw new Error(
          `Write blocked by filesystem permissions for ${current.absolute}. ` +
            `If running in a sandboxed environment, ensure MAP_PLATFORM_ROOT (${mapPlatformRoot}) points to a writable checkout.`,
        );
      }
      throw err;
    }
    const updated = await getMapPlatformFileInfo(relativePath);
    return jsonContent({
      path: relativePath,
      change_request_path: changeRequestPath,
      approval_note: approvalNote,
      previous_sha256: current.sha256,
      new_sha256: updated.sha256,
      bytes: updated.bytes,
    });
  }

  if (name === "record_map_platform_implementation_result") {
    const title = requireString(args, "title");
    const filePath = path.join(artifactDirs.mapPlatformImplementationResults, `${nowStamp()}-${slugify(title)}.md`);
    const content = [
      `# ${title}`,
      "",
      `Created: ${new Date().toISOString()}`,
      `Repository: ${mapPlatformRoot}`,
      `Result: ${requireString(args, "result")}`,
      args.change_request_path ? `Change request: ${args.change_request_path}` : "Change request: TBD",
      "",
      "## Changed Files",
      "",
      markdownList(args.changed_files),
      "",
      "## Commands Run",
      "",
      markdownList(args.commands_run),
      "",
      "## Notes",
      "",
      requireString(args, "notes"),
      "",
      "## Residual Risks",
      "",
      markdownList(args.residual_risks, "None recorded"),
      "",
    ].join("\n");
    await writeFile(filePath, content, "utf8");
    return jsonContent({ created: filePath, result: args.result });
  }

  if (name === "record_agent_run") {
    const agent = requireString(args, "agent");
    const status = requireString(args, "status");
    const filePath = path.join(artifactDirs.agentRuns, `${nowStamp()}-${slugify(agent)}.md`);
    const content = [
      `# Agent Run: ${agent}`,
      "",
      `Created: ${new Date().toISOString()}`,
      `Agent: ${agent}`,
      `Automation: ${requireString(args, "automation_id")}`,
      `Product: ${args.product || "map-platform"}`,
      `Status: ${status}`,
      args.next_recommended_agent ? `Next recommended agent: ${args.next_recommended_agent}` : "Next recommended agent: TBD",
      "",
      "## Summary",
      "",
      requireString(args, "summary"),
      "",
      "## Inputs Read",
      "",
      markdownList(args.inputs_read),
      "",
      "## Tasks Considered",
      "",
      markdownList(args.tasks_considered),
      "",
      "## Changes Made",
      "",
      markdownList(args.changes_made, "None"),
      "",
      "## Artifacts Written",
      "",
      markdownList(args.artifacts_written, "None"),
      "",
      "## Verification",
      "",
      markdownList(args.verification, "Not run"),
      "",
      "## Deferred",
      "",
      markdownList(args.deferred, "None"),
      "",
      "## Blockers",
      "",
      markdownList(args.blockers, "None"),
      "",
    ].join("\n");
    await writeFile(filePath, content, "utf8");
    return jsonContent({ created: filePath, status });
  }

  if (name === "list_agent_runs") {
    if (!existsSync(artifactDirs.agentRuns)) return jsonContent({ runs: [] });
    const entries = await readdir(artifactDirs.agentRuns, { withFileTypes: true });
    const runs = entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
      .map((entry) => `agent-runs/${entry.name}`)
      .sort();
    return jsonContent({ runs });
  }

  if (name === "read_agent_run") {
    const requestedPath = requireString(args, "path");
    const runPath = requestedPath.startsWith("agent-runs/")
      ? requestedPath
      : `agent-runs/${requestedPath}`;
    return textContent(await readWorkspaceArtifact(runPath));
  }

  if (name === "run_review_checklist") {
    const domain = requireString(args, "domain");
    const subject = requireString(args, "subject");
    if (!checklistQuestions[domain]) throw new Error(`Unknown checklist domain: ${domain}`);
    const content = [
      `# ${domain[0].toUpperCase()}${domain.slice(1)} Review: ${subject}`,
      "",
      `Generated: ${new Date().toISOString()}`,
      "",
      ...checklistQuestions[domain].map((question) => `- [ ] ${question}`),
      "",
    ].join("\n");
    return textContent(content);
  }

  if (name === "create_research_note") {
    const title = requireString(args, "title");
    const filePath = path.join(artifactDirs.researchNotes, `${nowStamp()}-${slugify(title)}.md`);
    const content = [
      `# ${title}`,
      "",
      `Created: ${new Date().toISOString()}`,
      "",
      "## Topic",
      "",
      requireString(args, "topic"),
      "",
      "## Summary",
      "",
      requireString(args, "summary"),
      "",
      "## Sources",
      "",
      markdownList(args.sources),
      "",
      "## Implications",
      "",
      markdownList(args.implications),
      "",
    ].join("\n");
    await writeFile(filePath, content, "utf8");
    return jsonContent({ created: filePath });
  }

  throw new Error(`Unknown tool: ${name}`);
}

async function listResources() {
  const docs = await walkMarkdownFiles(strategyRoot);
  const artifacts = await walkWorkspaceArtifacts();
  const mapPlatformFiles = await walkRepoFiles(mapPlatformRoot);
  const readableMapFiles = mapPlatformFiles.filter((file) => {
    const extension = path.extname(file.relative);
    return repoTextExtensions.has(extension) || path.basename(file.relative) === "Dockerfile";
  });
  return {
    resources: [
      ...docs.map((doc) => ({
        uri: `intact-strategy://${doc.relative}`,
        name: doc.relative,
        description: `Strategy workspace document: ${doc.relative}`,
        mimeType: "text/markdown",
      })),
      ...artifacts.map((artifact) => ({
        uri: `intact-workspace://${artifact.path}`,
        name: artifact.path,
        description: `Generated MCP workspace artifact: ${artifact.path}`,
        mimeType: "text/markdown",
      })),
      ...readableMapFiles.map((file) => ({
        uri: `map-platform://${file.relative}`,
        name: `map_platform/${file.relative}`,
        description: `Map platform repository file: ${file.relative}`,
        mimeType: "text/plain",
      })),
    ],
  };
}

async function readResource(uri) {
  if (typeof uri !== "string") {
    throw new Error("Unsupported resource URI");
  }
  let text;
  if (uri.startsWith("intact-strategy://")) {
    const relativePath = decodeURIComponent(uri.slice("intact-strategy://".length));
    text = await readMarkdownByRelativePath(relativePath);
  } else if (uri.startsWith("intact-workspace://")) {
    const relativePath = decodeURIComponent(uri.slice("intact-workspace://".length));
    text = await readWorkspaceArtifact(relativePath);
  } else if (uri.startsWith("map-platform://")) {
    const relativePath = decodeURIComponent(uri.slice("map-platform://".length));
    text = await readMapPlatformFile(relativePath);
  } else {
    throw new Error("Unsupported resource URI");
  }
  return {
    contents: [
      {
        uri,
        mimeType: "text/markdown",
        text,
      },
    ],
  };
}

async function handleRequest(message) {
  const { id, method, params } = message;

  if (method === "initialize") {
    return {
      protocolVersion: PROTOCOL_VERSION,
      capabilities: {
        tools: {},
        resources: {},
      },
      serverInfo: {
        name: SERVER_NAME,
        version: SERVER_VERSION,
      },
    };
  }

  if (method === "notifications/initialized" || method?.startsWith("notifications/")) {
    return undefined;
  }

  if (method === "ping") {
    return {};
  }

  if (method === "tools/list") {
    return { tools };
  }

  if (method === "tools/call") {
    assertObject(params, "params");
    return callTool(requireString(params, "name"), params.arguments || {});
  }

  if (method === "resources/list") {
    return listResources();
  }

  if (method === "resources/read") {
    assertObject(params, "params");
    return readResource(requireString(params, "uri"));
  }

  throw new Error(`Unsupported method: ${method}`);
}

function sendMessage(message) {
  const body = JSON.stringify(message);
  const bytes = textEncoder.encode(body);
  process.stdout.write(`Content-Length: ${bytes.length}\r\n\r\n${body}`);
}

async function dispatch(message) {
  if (!message || typeof message !== "object") return;

  if (!Object.prototype.hasOwnProperty.call(message, "id")) {
    try {
      await handleRequest(message);
    } catch (error) {
      process.stderr.write(`[${SERVER_NAME}] notification error: ${error.message}\n`);
    }
    return;
  }

  try {
    const result = await handleRequest(message);
    sendMessage({ jsonrpc: "2.0", id: message.id, result });
  } catch (error) {
    sendMessage({
      jsonrpc: "2.0",
      id: message.id,
      error: {
        code: -32000,
        message: error.message,
      },
    });
  }
}

function parseInput() {
  while (true) {
    const headerEnd = inputBuffer.indexOf("\r\n\r\n");
    if (headerEnd === -1) return;

    const header = inputBuffer.slice(0, headerEnd).toString("utf8");
    const match = /^Content-Length:\s*(\d+)/im.exec(header);
    if (!match) {
      inputBuffer = Buffer.alloc(0);
      throw new Error("Missing Content-Length header");
    }

    const length = Number(match[1]);
    const bodyStart = headerEnd + 4;
    const bodyEnd = bodyStart + length;
    if (inputBuffer.length < bodyEnd) return;

    const body = inputBuffer.slice(bodyStart, bodyEnd).toString("utf8");
    inputBuffer = inputBuffer.slice(bodyEnd);
    void dispatch(JSON.parse(body));
  }
}

async function main() {
  await ensureWorkspace();
  process.stdin.on("data", (chunk) => {
    inputBuffer = Buffer.concat([inputBuffer, chunk]);
    try {
      parseInput();
    } catch (error) {
      process.stderr.write(`[${SERVER_NAME}] parse error: ${error.message}\n`);
    }
  });
  process.stderr.write(
    `[${SERVER_NAME}] running. strategyRoot=${strategyRoot} workspaceRoot=${workspaceRoot} mapPlatformRoot=${mapPlatformRoot} mapPlatformWriteEnabled=${mapPlatformWriteEnabled}\n`,
  );
}

main().catch((error) => {
  const fingerprint = createHash("sha256").update(error.stack || error.message).digest("hex").slice(0, 12);
  process.stderr.write(`[${SERVER_NAME}] fatal ${fingerprint}: ${error.stack || error.message}\n`);
  process.exit(1);
});
