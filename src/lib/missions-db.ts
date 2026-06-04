import { getDb } from "./db";

export function getActiveMissions() {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);
  return db.prepare(`
    SELECT m.id, s.name as sponsor, m.title, m.description,
           m.reward_sparks, m.attestation_url, m.expires_at,
           m.max_completions_per_user
    FROM missions m JOIN sponsors s ON s.id = m.sponsor_id
    WHERE m.active = 1 AND (m.expires_at IS NULL OR m.expires_at > ?)
  `).all(now);
}

export function getMission(id: string) {
  return getDb().prepare("SELECT * FROM missions WHERE id = ? AND active = 1").get(id) as Record<string, unknown> | undefined;
}

export function getSponsor(id: string) {
  return getDb().prepare("SELECT * FROM sponsors WHERE id = ?").get(id) as Record<string, unknown> | undefined;
}

export function isAlreadyClaimed(missionId: string, userPubkey: string): boolean {
  const row = getDb().prepare("SELECT 1 FROM completions WHERE mission_id = ? AND user_pubkey = ?").get(missionId, userPubkey);
  return !!row;
}

export function checkRateLimit(userPubkey: string): boolean {
  const db = getDb();
  const windowStart = Math.floor(Date.now() / 1000 / 3600) * 3600;
  const row = db.prepare("SELECT claim_count FROM claim_rate_limits WHERE user_pubkey = ? AND window_start = ?").get(userPubkey, windowStart) as { claim_count: number } | undefined;
  return !row || row.claim_count < 10;
}

export function recordClaim(missionId: string, userPubkey: string, ipHash: string, powLevel: number, rewardSparks: number) {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);
  const windowStart = Math.floor(now / 3600) * 3600;
  db.prepare("INSERT INTO completions(mission_id, user_pubkey, completed_at, ip_hash, pow_level) VALUES(?,?,?,?,?)").run(missionId, userPubkey, now, ipHash, powLevel);
  db.prepare("INSERT INTO spark_balances(user_pubkey, balance, updated_at) VALUES(?,?,?) ON CONFLICT(user_pubkey) DO UPDATE SET balance = balance + ?, updated_at = ?").run(userPubkey, rewardSparks, now, rewardSparks, now);
  db.prepare("INSERT INTO claim_rate_limits(user_pubkey, window_start, claim_count) VALUES(?,?,1) ON CONFLICT(user_pubkey, window_start) DO UPDATE SET claim_count = claim_count + 1").run(userPubkey, windowStart);
}

export function getSparkBalance(userPubkey: string): number {
  const row = getDb().prepare("SELECT balance FROM spark_balances WHERE user_pubkey = ?").get(userPubkey) as { balance: number } | undefined;
  return row?.balance ?? 0;
}

export function getEntitlements(userPubkey: string) {
  return getDb().prepare("SELECT * FROM entitlements WHERE user_pubkey = ?").all(userPubkey);
}

export function getCatalog() {
  const now = Math.floor(Date.now() / 1000);
  return getDb().prepare("SELECT * FROM cosmetic_catalog WHERE expires_at IS NULL OR expires_at > ?").all(now);
}

export function getCatalogItem(itemId: string) {
  return getDb().prepare("SELECT * FROM cosmetic_catalog WHERE item_id = ?").get(itemId) as Record<string, unknown> | undefined;
}

export function redeemItem(userPubkey: string, itemId: string, costSparks: number, grantedAt: number, signature: string) {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);
  db.prepare("UPDATE spark_balances SET balance = balance - ?, updated_at = ? WHERE user_pubkey = ?").run(costSparks, now, userPubkey);
  db.prepare("INSERT OR REPLACE INTO entitlements(user_pubkey, item_id, granted_at, expires_at, signature) VALUES(?,?,?,NULL,?)").run(userPubkey, itemId, grantedAt, signature);
}
