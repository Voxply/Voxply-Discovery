import { getDb } from "./db";

/* Providers — people who will run a hub for you.
 *
 * Not the same thing as a farm. A farm is the server-side aggregate of hubs
 * somebody operates; a provider is an operator who offers space on theirs.
 * Discovery lists the offer, not the deployment, so the noun here is
 * "provider" and the farm concept stays where it belongs, on the server. */

export interface PricingTier {
  name: string;
  price_cents?: number;
  max_members?: number;
}

interface ProviderRow {
  provider_pubkey: string;
  provider_url: string;
  name: string;
  description: string;
  icon: string | null;
  pricing_tiers: string;
  accepting: number;
  listed_at: string;
  last_verified_at: string;
}

export interface ProviderListing {
  provider_pubkey: string;
  provider_url: string;
  name: string;
  description: string;
  icon: string | null;
  pricing_tiers: PricingTier[];
  /** Whether the operator says they have room for another hub right now. */
  accepting: boolean;
  listed_at: string;
  last_verified_at: string;
}

function parseTiers(json: string): PricingTier[] {
  try {
    const value: unknown = JSON.parse(json);
    if (!Array.isArray(value)) return [];
    return value.filter(
      (t): t is PricingTier => typeof t === "object" && t !== null && typeof (t as PricingTier).name === "string"
    );
  } catch {
    return [];
  }
}

function rowToListing(row: ProviderRow): ProviderListing {
  return {
    ...row,
    pricing_tiers: parseTiers(row.pricing_tiers),
    accepting: row.accepting === 1,
  };
}

export function listProviders(opts: { freeTier?: boolean; accepting?: boolean } = {}): ProviderListing[] {
  const rows = getDb()
    .prepare("SELECT * FROM providers ORDER BY name COLLATE NOCASE")
    .all() as ProviderRow[];
  let providers = rows.map(rowToListing);

  if (opts.accepting) providers = providers.filter((p) => p.accepting);
  if (opts.freeTier) {
    providers = providers.filter((p) =>
      p.pricing_tiers.some((t) => t.price_cents === 0 || t.name.toLowerCase() === "free")
    );
  }
  return providers;
}

export function getProvider(pubkey: string): ProviderListing | null {
  const row = getDb()
    .prepare("SELECT * FROM providers WHERE provider_pubkey = ?")
    .get(pubkey) as ProviderRow | undefined;
  return row ? rowToListing(row) : null;
}

export function upsertProvider(provider: {
  provider_pubkey: string;
  provider_url: string;
  name: string;
  description?: string;
  icon?: string | null;
  pricing_tiers?: PricingTier[];
  accepting?: boolean;
}): void {
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `INSERT INTO providers
         (provider_pubkey, provider_url, name, description, icon, pricing_tiers, accepting, listed_at, last_verified_at)
       VALUES (?,?,?,?,?,?,?,?,?)
       ON CONFLICT(provider_pubkey) DO UPDATE SET
         provider_url = excluded.provider_url,
         name = excluded.name,
         description = excluded.description,
         icon = excluded.icon,
         pricing_tiers = excluded.pricing_tiers,
         accepting = excluded.accepting,
         last_verified_at = excluded.last_verified_at`
    )
    .run(
      provider.provider_pubkey,
      provider.provider_url,
      provider.name,
      provider.description ?? "",
      provider.icon ?? null,
      JSON.stringify(provider.pricing_tiers ?? []),
      provider.accepting === false ? 0 : 1,
      now,
      now
    );
}

export function removeProvider(pubkey: string): boolean {
  return getDb().prepare("DELETE FROM providers WHERE provider_pubkey = ?").run(pubkey).changes > 0;
}

export function countProviders(): number {
  return (getDb().prepare("SELECT COUNT(*) AS n FROM providers").get() as { n: number }).n;
}
