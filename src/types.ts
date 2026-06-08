export type Severity = "P0" | "P1" | "P2" | "P3";

export type CaseStatus = "待分析" | "已诊断" | "已转评测" | "修复验证中";

export type FailureMode =
  | "检索漏召"
  | "幻觉编造"
  | "意图识别错误"
  | "上下文遗漏"
  | "拒答过度"
  | "语气不当"
  | "流程越权";

export type AgentStepStatus = "queued" | "running" | "done";

export type AgentTool =
  | "scan_conversations"
  | "cluster_failures"
  | "retrieve_policy"
  | "diff_prompt"
  | "generate_eval_pack"
  | "run_regression"
  | "draft_prd_ticket";

export interface BadCase {
  id: string;
  title: string;
  source: string;
  severity: Severity;
  status: CaseStatus;
  failureMode: FailureMode;
  affectedUsers: number;
  confidence: number;
  owner: string;
  userIntent: string;
  expected: string;
  actual: string;
  rootCause: string;
  risk: string;
  evidence: string[];
  agentRecommendation: string;
  fixPattern: string;
  evalCount: number;
  beforeScore: number;
  afterScore: number;
}

export interface AgentStep {
  id: string;
  name: string;
  role: string;
  tool: AgentTool;
  output: string;
}

export interface EvalCase {
  id: string;
  caseId: string;
  prompt: string;
  assertion: string;
  risk: Severity;
  result: "pass" | "fail" | "needs_review";
}

export interface ReleaseMetric {
  label: string;
  before: number;
  after: number;
  unit: string;
}
