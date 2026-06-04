import { getDb } from "./db";
import crypto from "crypto";

export function createBootstrapToken(config: Record<string, unknown>): string {
  const token = crypto.randomBytes(32).toString("hex");
  const now = new Date();
  const expires = new Date(now.getTime() + 24 * 3600 * 1000);
  getDb()
    .prepare(
      "INSERT INTO bootstrap_tokens(token, config, created_at, expires_at) VALUES(?,?,?,?)"
    )
    .run(token, JSON.stringify(config), now.toISOString(), expires.toISOString());
  return token;
}

export function redeemBootstrapToken(
  token: string
): Record<string, unknown> | null {
  const db = getDb();
  const row = db
    .prepare(
      "SELECT config, expires_at, used FROM bootstrap_tokens WHERE token = ?"
    )
    .get(token) as
    | { config: string; expires_at: string; used: number }
    | undefined;
  if (!row || row.used || new Date(row.expires_at) < new Date()) return null;
  db.prepare("UPDATE bootstrap_tokens SET used = 1 WHERE token = ?").run(token);
  return JSON.parse(row.config) as Record<string, unknown>;
}
