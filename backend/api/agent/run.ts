import { randomUUID } from "node:crypto";
import { TABLES } from "../_lib/constants.js";
import { getPool } from "../_lib/db.js";
import { runDeepSeekAgent, type BadCaseInput } from "../_lib/deepseek.js";
import { applyCors, methodNotAllowed } from "../_lib/http.js";
import type { VercelRequest, VercelResponse } from "../_lib/vercel.js";

function parseInput(body: unknown): BadCaseInput {
  const value = body as Partial<BadCaseInput> | undefined;
  if (
    !value ||
    typeof value.title !== "string" ||
    typeof value.user_intent !== "string" ||
    typeof value.expected_answer !== "string" ||
    typeof value.actual_answer !== "string"
  ) {
    throw new Error("title, user_intent, expected_answer and actual_answer are required");
  }

  return {
    title: value.title.slice(0, 255),
    source: typeof value.source === "string" ? value.source.slice(0, 120) : "线上 Agent",
    user_intent: value.user_intent,
    expected_answer: value.expected_answer,
    actual_answer: value.actual_answer,
    evidence: Array.isArray(value.evidence) ? value.evidence.filter((item): item is string => typeof item === "string") : []
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (applyCors(req, res)) return;
  if (req.method !== "POST") {
    methodNotAllowed(res, ["POST", "OPTIONS"]);
    return;
  }

  try {
    const input = parseInput(req.body);
    const agentOutput = await runDeepSeekAgent(input);
    const caseId = `BC-${Date.now()}`;
    const pool = getPool();
    const client = await pool.connect();

    try {
      await client.query("begin");
      await client.query(
        `insert into ${TABLES.badCases}
          (id, title, source, severity, status, failure_mode, affected_users, confidence, user_intent,
           expected_answer, actual_answer, root_cause, risk, owner)
         values ($1, $2, $3, $4, '已诊断', $5, 1, 90, $6, $7, $8, $9, $10, 'DeepSeek Agent')`,
        [
          caseId,
          input.title,
          input.source,
          agentOutput.result.severity,
          agentOutput.result.failure_mode,
          input.user_intent,
          input.expected_answer,
          input.actual_answer,
          agentOutput.result.root_cause,
          agentOutput.result.risk
        ]
      );

      const run = await client.query<{ id: string }>(
        `insert into ${TABLES.agentRuns}
          (bad_case_id, provider, model, mode, input_json, output_json, human_gate_required, latency_ms, token_usage_json)
         values ($1, 'deepseek', $2, 'supervised', $3::jsonb, $4::jsonb, $5, $6, $7::jsonb)
         returning id::text`,
        [
          caseId,
          agentOutput.model,
          JSON.stringify(input),
          JSON.stringify(agentOutput.result),
          agentOutput.result.human_gate_required,
          agentOutput.latency_ms,
          JSON.stringify(agentOutput.token_usage)
        ]
      );

      for (const evalCase of agentOutput.result.eval_cases.slice(0, 10)) {
        await client.query(
          `insert into ${TABLES.evalCases}
            (id, bad_case_id, prompt, assertion, risk, status, created_by_agent_run)
           values ($1, $2, $3, $4, $5, 'active', $6)`,
          [
            `EV-${randomUUID()}`,
            caseId,
            evalCase.prompt,
            evalCase.assertion,
            evalCase.risk,
            run.rows[0].id
          ]
        );
      }

      await client.query("commit");
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }

    res.status(200).json({
      ok: true,
      fallback: false,
      case_id: caseId,
      model: agentOutput.model,
      latency_ms: agentOutput.latency_ms,
      agent_trace: agentOutput.trace,
      result: agentOutput.result
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      fallback: false,
      error: error instanceof Error ? error.message : "unknown_agent_error"
    });
  }
}
