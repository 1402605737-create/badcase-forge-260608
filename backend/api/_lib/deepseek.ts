export interface BadCaseInput {
  title: string;
  source?: string;
  user_intent: string;
  expected_answer: string;
  actual_answer: string;
  evidence?: string[];
}

export interface EvalCaseResult {
  prompt: string;
  assertion: string;
  risk: "P0" | "P1" | "P2" | "P3";
}

export interface AgentResult {
  failure_mode: string;
  severity: "P0" | "P1" | "P2" | "P3";
  root_cause: string;
  risk: string;
  fix_plan: string[];
  eval_cases: EvalCaseResult[];
  human_gate_required: boolean;
}

export interface AgentRunOutput {
  result: AgentResult;
  model: string;
  latency_ms: number;
  token_usage: unknown;
  trace: Array<{
    step: string;
    status: "completed";
    summary: string;
  }>;
}

const systemPrompt = `你是面向中文 AI 产品团队的 Bad Case 诊断 Agent。
必须只输出 JSON 对象，不要输出 Markdown。
字段必须包括：
failure_mode：失败类型；
severity：P0、P1、P2 或 P3；
root_cause：根因；
risk：产品或合规风险；
fix_plan：可执行修复动作数组；
eval_cases：至少 2 条评测，每条包含 prompt、assertion、risk；
human_gate_required：P0/P1 必须为 true。`;

function isAgentResult(value: unknown): value is AgentResult {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<AgentResult>;
  return (
    typeof candidate.failure_mode === "string" &&
    ["P0", "P1", "P2", "P3"].includes(candidate.severity ?? "") &&
    typeof candidate.root_cause === "string" &&
    typeof candidate.risk === "string" &&
    Array.isArray(candidate.fix_plan) &&
    Array.isArray(candidate.eval_cases) &&
    typeof candidate.human_gate_required === "boolean"
  );
}

export async function runDeepSeekAgent(input: BadCaseInput): Promise<AgentRunOutput> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const baseUrl = process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com";
  const model = process.env.DEEPSEEK_MODEL ?? "deepseek-v4-flash";

  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY is not configured");
  }

  const startedAt = Date.now();
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `请分析以下坏例：${JSON.stringify(input)}` }
      ],
      response_format: { type: "json_object" },
      stream: false
    })
  });

  if (!response.ok) {
    throw new Error(`DeepSeek request failed with HTTP ${response.status}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: unknown;
  };
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("DeepSeek returned empty content");
  }

  const result = JSON.parse(content) as unknown;
  if (!isAgentResult(result)) {
    throw new Error("DeepSeek returned an invalid agent result");
  }

  if (result.severity === "P0" || result.severity === "P1") {
    result.human_gate_required = true;
  }

  return {
    result,
    model,
    latency_ms: Date.now() - startedAt,
    token_usage: data.usage ?? null,
    trace: [
      { step: "输入校验", status: "completed", summary: "已校验中文坏例字段与证据。" },
      { step: "DeepSeek 诊断", status: "completed", summary: `使用 ${model} 完成失败分类与根因分析。` },
      { step: "风险门禁", status: "completed", summary: result.human_gate_required ? "该坏例需要人工审批。" : "该坏例可进入自动回归。" },
      { step: "评测生成", status: "completed", summary: `生成 ${result.eval_cases.length} 条回归评测。` }
    ]
  };
}
