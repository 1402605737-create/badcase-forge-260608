-- One-time administrator SQL for APP_SLUG: badcase-forge-260608
-- Execute manually in the existing Supabase SQL Editor.
-- Replace __DB_ROLE_PASSWORD__ locally only. Never commit the password-bearing SQL.
-- This file does not modify postgres credentials, public schema, other schemas, or other roles.

CREATE ROLE badcase_forge_260608_app
  LOGIN
  PASSWORD '__DB_ROLE_PASSWORD__'
  NOSUPERUSER
  NOCREATEDB
  NOCREATEROLE
  NOINHERIT
  NOREPLICATION
  NOBYPASSRLS;

CREATE SCHEMA badcase_forge_260608;

CREATE TABLE badcase_forge_260608.bad_cases (
  id text PRIMARY KEY,
  title varchar(255) NOT NULL,
  source varchar(120) NOT NULL,
  severity varchar(2) NOT NULL CHECK (severity IN ('P0', 'P1', 'P2', 'P3')),
  status varchar(32) NOT NULL,
  failure_mode varchar(64) NOT NULL,
  affected_users integer NOT NULL DEFAULT 0,
  confidence integer NOT NULL DEFAULT 0 CHECK (confidence BETWEEN 0 AND 100),
  user_intent text NOT NULL,
  expected_answer text NOT NULL,
  actual_answer text NOT NULL,
  root_cause text,
  risk text,
  owner varchar(64),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE badcase_forge_260608.agent_runs (
  id bigserial PRIMARY KEY,
  bad_case_id text NOT NULL REFERENCES badcase_forge_260608.bad_cases(id),
  provider varchar(32) NOT NULL DEFAULT 'deepseek',
  model varchar(64) NOT NULL DEFAULT 'deepseek-v4-flash',
  mode varchar(32) NOT NULL,
  input_json jsonb NOT NULL,
  output_json jsonb,
  human_gate_required boolean NOT NULL DEFAULT true,
  latency_ms integer,
  token_usage_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE badcase_forge_260608.eval_cases (
  id text PRIMARY KEY,
  bad_case_id text NOT NULL REFERENCES badcase_forge_260608.bad_cases(id),
  prompt text NOT NULL,
  assertion text NOT NULL,
  risk varchar(2) NOT NULL CHECK (risk IN ('P0', 'P1', 'P2', 'P3')),
  status varchar(32) NOT NULL DEFAULT 'active',
  created_by_agent_run bigint REFERENCES badcase_forge_260608.agent_runs(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE badcase_forge_260608.regression_results (
  id bigserial PRIMARY KEY,
  eval_case_id text NOT NULL REFERENCES badcase_forge_260608.eval_cases(id),
  experiment_name varchar(120) NOT NULL,
  model varchar(64) NOT NULL,
  prompt_version varchar(64) NOT NULL,
  rag_version varchar(64) NOT NULL,
  result varchar(16) NOT NULL CHECK (result IN ('pass', 'fail', 'needs_review')),
  judge_output_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX badcase_forge_260608_bad_cases_failure_mode_idx
  ON badcase_forge_260608.bad_cases(failure_mode);
CREATE INDEX badcase_forge_260608_bad_cases_severity_status_idx
  ON badcase_forge_260608.bad_cases(severity, status);
CREATE INDEX badcase_forge_260608_agent_runs_case_created_idx
  ON badcase_forge_260608.agent_runs(bad_case_id, created_at);
CREATE INDEX badcase_forge_260608_eval_cases_case_idx
  ON badcase_forge_260608.eval_cases(bad_case_id);
CREATE INDEX badcase_forge_260608_regression_results_eval_idx
  ON badcase_forge_260608.regression_results(eval_case_id);

INSERT INTO badcase_forge_260608.bad_cases
  (id, title, source, severity, status, failure_mode, affected_users, confidence, user_intent, expected_answer, actual_answer, root_cause, risk, owner)
VALUES
  ('BC-DEMO-001', '试用期离职结算被编造为固定 3 天到账', '企业 HR 知识库助手', 'P0', '待分析', '幻觉编造', 128, 91,
   '确认试用期离职后的工资结算周期。', '引用公司制度，不确定时转人工。', 'AI 承诺固定 3 个工作日到账。',
   '把审批时长错误泛化为工资到账承诺。', '劳动合规风险。', 'HR Ops'),
  ('BC-DEMO-002', '引用不存在的报销政策编号', '财务报销 Copilot', 'P1', '已转评测', '检索漏召', 64, 88,
   '查询客户晚餐招待费上限。', '返回真实政策编号和表格来源。', 'AI 引用了不存在的 FIN-EX-32。',
   '表格切块后丢失城市列。', '错误报销与审计风险。', 'Finance'),
  ('BC-DEMO-003', '设备型号已提供但仍重复追问', '售后客服 Agent', 'P2', '修复验证中', '上下文遗漏', 43, 79,
   '定位路由器无法联网原因。', '记住型号和错误码并进入排障。', 'AI 重复要求用户提供型号。',
   '摘要器丢失关键槽位。', '拉长解决时长。', 'CX');

GRANT CONNECT ON DATABASE postgres TO badcase_forge_260608_app;
GRANT USAGE ON SCHEMA badcase_forge_260608 TO badcase_forge_260608_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON badcase_forge_260608.bad_cases TO badcase_forge_260608_app;
GRANT SELECT, INSERT ON badcase_forge_260608.agent_runs TO badcase_forge_260608_app;
GRANT SELECT, INSERT, UPDATE ON badcase_forge_260608.eval_cases TO badcase_forge_260608_app;
GRANT SELECT, INSERT ON badcase_forge_260608.regression_results TO badcase_forge_260608_app;
GRANT USAGE, SELECT ON SEQUENCE badcase_forge_260608.agent_runs_id_seq TO badcase_forge_260608_app;
GRANT USAGE, SELECT ON SEQUENCE badcase_forge_260608.regression_results_id_seq TO badcase_forge_260608_app;

ALTER TABLE badcase_forge_260608.bad_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE badcase_forge_260608.agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE badcase_forge_260608.eval_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE badcase_forge_260608.regression_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY badcase_forge_260608_bad_cases_select
  ON badcase_forge_260608.bad_cases FOR SELECT TO badcase_forge_260608_app USING (true);
CREATE POLICY badcase_forge_260608_bad_cases_insert
  ON badcase_forge_260608.bad_cases FOR INSERT TO badcase_forge_260608_app WITH CHECK (true);
CREATE POLICY badcase_forge_260608_bad_cases_update
  ON badcase_forge_260608.bad_cases FOR UPDATE TO badcase_forge_260608_app USING (true) WITH CHECK (true);
CREATE POLICY badcase_forge_260608_bad_cases_delete
  ON badcase_forge_260608.bad_cases FOR DELETE TO badcase_forge_260608_app USING (true);

CREATE POLICY badcase_forge_260608_agent_runs_select
  ON badcase_forge_260608.agent_runs FOR SELECT TO badcase_forge_260608_app USING (true);
CREATE POLICY badcase_forge_260608_agent_runs_insert
  ON badcase_forge_260608.agent_runs FOR INSERT TO badcase_forge_260608_app WITH CHECK (true);

CREATE POLICY badcase_forge_260608_eval_cases_select
  ON badcase_forge_260608.eval_cases FOR SELECT TO badcase_forge_260608_app USING (true);
CREATE POLICY badcase_forge_260608_eval_cases_insert
  ON badcase_forge_260608.eval_cases FOR INSERT TO badcase_forge_260608_app WITH CHECK (true);
CREATE POLICY badcase_forge_260608_eval_cases_update
  ON badcase_forge_260608.eval_cases FOR UPDATE TO badcase_forge_260608_app USING (true) WITH CHECK (true);

CREATE POLICY badcase_forge_260608_regression_results_select
  ON badcase_forge_260608.regression_results FOR SELECT TO badcase_forge_260608_app USING (true);
CREATE POLICY badcase_forge_260608_regression_results_insert
  ON badcase_forge_260608.regression_results FOR INSERT TO badcase_forge_260608_app WITH CHECK (true);

SELECT count(*) AS demo_case_count FROM badcase_forge_260608.bad_cases;
SELECT rolname, rolcanlogin, rolsuper, rolcreaterole, rolcreatedb, rolreplication, rolbypassrls
FROM pg_roles
WHERE rolname = 'badcase_forge_260608_app';
