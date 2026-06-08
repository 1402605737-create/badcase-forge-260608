export const APP_SLUG = "badcase-forge-260608";
export const DB_SCHEMA = "badcase_forge_260608";
export const DB_ROLE = "badcase_forge_260608_app";
export const EXPECTED_FRONTEND_ORIGIN = "https://badcase-forge-260608-web.vercel.app";

export const TABLES = {
  badCases: `${DB_SCHEMA}.bad_cases`,
  agentRuns: `${DB_SCHEMA}.agent_runs`,
  evalCases: `${DB_SCHEMA}.eval_cases`,
  regressionResults: `${DB_SCHEMA}.regression_results`
} as const;
