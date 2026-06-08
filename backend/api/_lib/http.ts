import { EXPECTED_FRONTEND_ORIGIN } from "./constants.js";
import type { VercelRequest, VercelResponse } from "./vercel.js";

export function applyCors(req: VercelRequest, res: VercelResponse): boolean {
  const allowedOrigin = process.env.FRONTEND_ORIGIN ?? EXPECTED_FRONTEND_ORIGIN;
  const requestOrigin = req.headers.origin;

  if (requestOrigin === allowedOrigin) {
    res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
    res.setHeader("Vary", "Origin");
  }

  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Max-Age", "86400");

  if (req.method === "OPTIONS") {
    if (requestOrigin && requestOrigin !== allowedOrigin) {
      res.status(403).json({ ok: false, error: "origin_not_allowed" });
      return true;
    }
    res.status(204).end();
    return true;
  }

  return false;
}

export function methodNotAllowed(res: VercelResponse, allowed: string[]): void {
  res.setHeader("Allow", allowed.join(", "));
  res.status(405).json({ ok: false, error: "method_not_allowed" });
}
