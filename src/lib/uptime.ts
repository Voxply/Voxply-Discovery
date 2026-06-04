import { getDb } from "./db";

export function recordPing(hubPubkey: string, success: boolean) {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare("INSERT INTO hub_pings(hub_pubkey, checked_at, success) VALUES(?,?,?)").run(hubPubkey, now, success ? 1 : 0);
  // Prune rows older than 30 days
  const cutoff = new Date(Date.now() - 30 * 86400 * 1000).toISOString();
  db.prepare("DELETE FROM hub_pings WHERE checked_at < ?").run(cutoff);
}

export function getUptime7d(hubPubkey: string): number | null {
  const db = getDb();
  const cutoff = new Date(Date.now() - 7 * 86400 * 1000).toISOString();
  const row = db.prepare(
    "SELECT COUNT(*) as total, SUM(success) as successes FROM hub_pings WHERE hub_pubkey = ? AND checked_at >= ?"
  ).get(hubPubkey, cutoff) as { total: number; successes: number } | undefined;
  if (!row || row.total === 0) return null;
  return Math.round((row.successes / row.total) * 100);
}
