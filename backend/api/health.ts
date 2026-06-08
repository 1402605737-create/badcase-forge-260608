import { DB_ROLE, TABLES } from "./_lib/constants.js";
import { getPool } from "./_lib/db.js";
import { applyCors, methodNotAllowed } from "./_lib/http.js";
import type { VercelRequest, VercelResponse } from "./_lib/vercel.js";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (applyCors(req, res)) return;
  if (req.method !== "GET") {
    methodNotAllowed(res, ["GET", "OPTIONS"]);
    return;
  }

  const deepseekConfigured = Boolean(process.env.DEEPSEEK_API_KEY);

  try {
    const pool = getPool();
    const identity = await pool.query<{ current_database: string; current_user: string }>(
      "select current_database() as current_database, current_user as current_user"
    );
    const count = await pool.query<{ case_count: string }>(
      `select count(*)::text as case_count from ${TABLES.badCases}`
    );
    const currentUser = identity.rows[0]?.current_user ?? null;

    res.status(200).json({
      ok: true,
      database: "postgres",
      database_connected: true,
      current_database: identity.rows[0]?.current_database ?? null,
      current_user: currentUser,
      expected_user: DB_ROLE,
      role_isolated: currentUser === DB_ROLE,
      deepseek_configured: deepseekConfigured,
      case_count: Number(count.rows[0]?.case_count ?? 0)
    });
  } catch (error) {
    res.status(200).json({
      ok: false,
      database: "postgres",
      database_connected: false,
      current_user: null,
      expected_user: DB_ROLE,
      role_isolated: false,
      deepseek_configured: deepseekConfigured,
      case_count: 0,
      database_error: error instanceof Error ? error.message : "unknown_database_error"
    });
  }
}
