import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const runtimeFiles = [
  new URL("../api/health.ts", import.meta.url),
  new URL("../api/agent/run.ts", import.meta.url),
  new URL("../api/_lib/db.ts", import.meta.url)
];

test("production runtime contains no DDL", async () => {
  const contents = await Promise.all(runtimeFiles.map((file) => readFile(file, "utf8")));
  const runtime = contents.join("\n").toUpperCase();
  const forbidden = ["CREATE TABLE", "CREATE INDEX", "ALTER TABLE", "DROP TABLE", "CREATE SCHEMA"];

  for (const statement of forbidden) {
    assert.equal(runtime.includes(statement), false, `runtime unexpectedly contains ${statement}`);
  }
});

test("database queries use the isolated schema", async () => {
  const agent = await readFile(new URL("../api/agent/run.ts", import.meta.url), "utf8");
  const health = await readFile(new URL("../api/health.ts", import.meta.url), "utf8");

  assert.match(agent, /TABLES\.badCases/);
  assert.match(agent, /TABLES\.agentRuns/);
  assert.match(agent, /TABLES\.evalCases/);
  assert.match(health, /TABLES\.badCases/);
  assert.equal(agent.includes("search_path"), false);
  assert.equal(health.includes("search_path"), false);
});

test("CORS default is the dedicated frontend origin", async () => {
  const constants = await import("../api/_lib/constants.js");
  assert.equal(constants.EXPECTED_FRONTEND_ORIGIN, "https://badcase-forge-260608-web.vercel.app");
});

test("database verifier checks role isolation privileges", async () => {
  const verifier = await readFile(new URL("../scripts/verify-db.mjs", import.meta.url), "utf8");
  assert.match(verifier, /has_schema_privilege\(current_user, 'badcase_forge_260608', 'USAGE'\)/);
  assert.match(verifier, /has_schema_privilege\(current_user, 'public', 'CREATE'\)/);
  assert.match(verifier, /has_database_privilege\(current_user, current_database\(\), 'CREATE'\)/);
});

test("agent output normalizes eval risk before database writes", async () => {
  const { normalizeAgentResult } = await import("../api/_lib/deepseek.js");
  const normalized = normalizeAgentResult({
    failure_mode: "x".repeat(80),
    severity: "P1",
    root_cause: "root",
    risk: "risk",
    fix_plan: ["fix"],
    eval_cases: [{ prompt: "prompt", assertion: "assertion", risk: "P0/P1" as "P0" }],
    human_gate_required: false
  });

  assert.equal(normalized.failure_mode.length, 64);
  assert.equal(normalized.eval_cases[0].risk, "P1");
  assert.equal(normalized.human_gate_required, true);
});
