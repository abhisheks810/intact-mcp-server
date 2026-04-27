import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const serverPath = path.join(repoRoot, "src", "server.js");

let nextId = 1;
let buffer = Buffer.alloc(0);
const pending = new Map();

function encode(message) {
  const body = JSON.stringify(message);
  return `Content-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`;
}

function parseMessages(onMessage) {
  while (true) {
    const headerEnd = buffer.indexOf("\r\n\r\n");
    if (headerEnd === -1) return;
    const header = buffer.slice(0, headerEnd).toString("utf8");
    const match = /^Content-Length:\s*(\d+)/im.exec(header);
    if (!match) throw new Error("Missing Content-Length");
    const length = Number(match[1]);
    const bodyStart = headerEnd + 4;
    const bodyEnd = bodyStart + length;
    if (buffer.length < bodyEnd) return;
    const body = buffer.slice(bodyStart, bodyEnd).toString("utf8");
    buffer = buffer.slice(bodyEnd);
    onMessage(JSON.parse(body));
  }
}

const child = spawn("node", [serverPath], {
  cwd: repoRoot,
  env: {
    ...process.env,
    STRATEGY_ROOT: "/Users/abhisheksrivastava/host_strategy",
    INTACT_WORKSPACE: path.join(repoRoot, "data", "test-smoke"),
    MAP_PLATFORM_ROOT: "/Users/abhisheksrivastava/map_platform",
  },
  stdio: ["pipe", "pipe", "pipe"],
});

child.stdout.on("data", (chunk) => {
  buffer = Buffer.concat([buffer, chunk]);
  parseMessages((message) => {
    const handler = pending.get(message.id);
    if (handler) {
      pending.delete(message.id);
      handler(message);
    }
  });
});

child.stderr.on("data", (chunk) => {
  process.stderr.write(chunk);
});

function request(method, params = undefined) {
  const id = nextId++;
  const message = { jsonrpc: "2.0", id, method };
  if (params !== undefined) message.params = params;
  child.stdin.write(encode(message));
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`Timed out waiting for ${method}`));
    }, 5000);
    pending.set(id, (response) => {
      clearTimeout(timeout);
      if (response.error) reject(new Error(response.error.message));
      else resolve(response.result);
    });
  });
}

async function main() {
  const init = await request("initialize", {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "smoke-test", version: "0.1.0" },
  });
  if (init.serverInfo.name !== "intact-mcp-server") throw new Error("Unexpected server name");

  const listedTools = await request("tools/list");
  if (!listedTools.tools.some((tool) => tool.name === "search_strategy_docs")) {
    throw new Error("search_strategy_docs missing");
  }
  if (!listedTools.tools.some((tool) => tool.name === "doctor_map_platform_dev_interface")) {
    throw new Error("doctor_map_platform_dev_interface missing");
  }
  if (!listedTools.tools.some((tool) => tool.name === "doctor_map_platform_place_contract")) {
    throw new Error("doctor_map_platform_place_contract missing");
  }
  if (!listedTools.tools.some((tool) => tool.name === "doctor_map_platform_verify")) {
    throw new Error("doctor_map_platform_verify missing");
  }

  const resources = await request("resources/list");
  if (!Array.isArray(resources.resources)) throw new Error("resources/list returned invalid shape");

  const search = await request("tools/call", {
    name: "search_strategy_docs",
    arguments: { query: "accessibility", limit: 3 },
  });
  if (!search.content?.[0]?.text) throw new Error("search returned no text content");

  const mapFiles = await request("tools/call", {
    name: "list_map_platform_files",
    arguments: {},
  });
  if (!mapFiles.content?.[0]?.text.includes("backend/main.py")) {
    throw new Error("map_platform file listing did not include backend/main.py");
  }

  const mapRead = await request("tools/call", {
    name: "read_map_platform_file",
    arguments: { path: "README.md" },
  });
  if (!mapRead.content?.[0]?.text) throw new Error("map_platform file read returned no content");

  const mapStatus = await request("tools/call", {
    name: "map_platform_git_status",
    arguments: {},
  });
  if (!mapStatus.content?.[0]?.text.includes("mapPlatformRoot")) {
    throw new Error("map_platform git status returned invalid content");
  }

  const doctorDryRun = await request("tools/call", {
    name: "doctor_map_platform_dev_interface",
    arguments: { dry_run: true },
  });
  if (!doctorDryRun.content?.[0]?.text.includes("\"dry_run\": true")) {
    throw new Error("doctor_map_platform_dev_interface dry_run returned invalid content");
  }

  const placeContractDryRun = await request("tools/call", {
    name: "doctor_map_platform_place_contract",
    arguments: { dry_run: true },
  });
  if (!placeContractDryRun.content?.[0]?.text.includes("\"dry_run\": true")) {
    throw new Error("doctor_map_platform_place_contract dry_run returned invalid content");
  }

  const verifyDoctorDryRun = await request("tools/call", {
    name: "doctor_map_platform_verify",
    arguments: { dry_run: true },
  });
  if (!verifyDoctorDryRun.content?.[0]?.text.includes("\"dry_run\": true")) {
    throw new Error("doctor_map_platform_verify dry_run returned invalid content");
  }

  const metadata = await request("tools/call", {
    name: "get_map_platform_file_metadata",
    arguments: { path: "README.md" },
  });
  if (!metadata.content?.[0]?.text.includes("sha256")) {
    throw new Error("map_platform metadata returned invalid content");
  }

  const proposal = await request("tools/call", {
    name: "create_map_platform_patch_proposal",
    arguments: {
      title: "Smoke Test Patch Proposal",
      agent: "geo-data-agent",
      summary: "Verify patch proposal creation through MCP.",
      target_files: ["backend/main.py"],
      proposed_changes: [
        {
          file: "backend/main.py",
          change: "No-op smoke proposal.",
          rationale: "Exercise proposal artifact creation.",
        },
      ],
      verification: ["npm test"],
      risks: ["None; proposal only"],
    },
  });
  if (!proposal.content?.[0]?.text.includes("map-platform-patch-proposals")) {
    throw new Error("patch proposal creation returned invalid content");
  }

  const proposals = await request("tools/call", {
    name: "list_map_platform_patch_proposals",
    arguments: {},
  });
  if (!proposals.content?.[0]?.text.includes("smoke-test-patch-proposal")) {
    throw new Error("patch proposal listing did not include smoke proposal");
  }

  const changeRequest = await request("tools/call", {
    name: "create_map_platform_change_request",
    arguments: {
      title: "Smoke Test Change Request",
      proposal_path: "map-platform-patch-proposals/smoke-test-patch-proposal.md",
      agent: "geo-data-agent",
      objective: "Verify change request creation through MCP.",
      allowed_files: ["README.md"],
      verification: ["npm test"],
      approval_note: "Smoke test only; no repository write.",
    },
  });
  if (!changeRequest.content?.[0]?.text.includes("map-platform-change-requests")) {
    throw new Error("change request creation returned invalid content");
  }

  const agentRun = await request("tools/call", {
    name: "record_agent_run",
    arguments: {
      agent: "qa-evaluation-agent",
      automation_id: "smoke-test",
      product: "map-platform",
      summary: "Verified agent run logging.",
      inputs_read: ["test/smoke-test.js"],
      tasks_considered: ["MCP smoke test"],
      changes_made: ["None"],
      artifacts_written: ["agent-runs smoke record"],
      verification: ["record_agent_run returned a path"],
      deferred: ["None"],
      blockers: [],
      next_recommended_agent: "qa-evaluation-agent",
      status: "completed",
    },
  });
  if (!agentRun.content?.[0]?.text.includes("agent-runs")) {
    throw new Error("agent run creation returned invalid content");
  }

  const agentRuns = await request("tools/call", {
    name: "list_agent_runs",
    arguments: {},
  });
  if (!agentRuns.content?.[0]?.text.includes("qa-evaluation-agent")) {
    throw new Error("agent run listing did not include smoke run");
  }

  console.log("smoke test passed");
}

main()
  .finally(() => child.kill())
  .catch((error) => {
    console.error(error);
    child.kill();
    process.exit(1);
  });
