import { getDb } from "./db";

export interface FarmRow {
  farm_pubkey: string;
  farm_url: string;
  name: string;
  description: string;
  icon: string | null;
  pricing_tiers: string;
  capacity_available: number;
  listed_at: string;
  last_verified_at: string;
}

export interface FarmListing {
  farm_pubkey: string;
  farm_url: string;
  name: string;
  description: string;
  icon: string | null;
  pricing_tiers: unknown[];
  capacity_available: number;
  listed_at: string;
  last_verified_at: string;
}

function rowToFarm(row: FarmRow): FarmListing {
  let pricing_tiers: unknown[] = [];
  try {
    const parsed = JSON.parse(row.pricing_tiers);
    pricing_tiers = Array.isArray(parsed) ? parsed : [];
  } catch {
    // malformed JSON — use empty array
  }
  return { ...row, pricing_tiers };
}

export function listFarms(opts: { hasFreeTier?: boolean } = {}): FarmListing[] {
  const db = getDb();
  let sql: string;
  if (opts.hasFreeTier) {
    sql =
      "SELECT * FROM farms WHERE pricing_tiers LIKE '%\"free\"%' OR pricing_tiers LIKE '%\"Free\"%' ORDER BY listed_at DESC LIMIT 50";
  } else {
    sql = "SELECT * FROM farms ORDER BY listed_at DESC LIMIT 50";
  }
  return (db.prepare(sql).all() as FarmRow[]).map(rowToFarm);
}

export function getFarm(farmPubkey: string): FarmListing | null {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM farms WHERE farm_pubkey = ?")
    .get(farmPubkey) as FarmRow | undefined;
  return row ? rowToFarm(row) : null;
}

export function upsertFarm(farm: {
  farm_pubkey: string;
  farm_url: string;
  name: string;
  description?: string;
  icon?: string;
  pricing_tiers?: unknown[];
  capacity_available?: number;
}): void {
  const db = getDb();
  const now = new Date().toISOString();
  const existing = getFarm(farm.farm_pubkey);
  db.prepare(
    `INSERT INTO farms(farm_pubkey, farm_url, name, description, icon, pricing_tiers, capacity_available, listed_at, last_verified_at)
     VALUES(?,?,?,?,?,?,?,?,?)
     ON CONFLICT(farm_pubkey) DO UPDATE SET
       farm_url=excluded.farm_url,
       name=excluded.name,
       description=excluded.description,
       icon=excluded.icon,
       pricing_tiers=excluded.pricing_tiers,
       capacity_available=excluded.capacity_available,
       last_verified_at=excluded.last_verified_at`
  ).run(
    farm.farm_pubkey,
    farm.farm_url,
    farm.name,
    farm.description ?? "",
    farm.icon ?? null,
    JSON.stringify(farm.pricing_tiers ?? []),
    farm.capacity_available ?? 0,
    existing?.listed_at ?? now,
    now
  );
}

export function removeFarm(farmPubkey: string): void {
  getDb().prepare("DELETE FROM farms WHERE farm_pubkey = ?").run(farmPubkey);
}
