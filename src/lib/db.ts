import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import type { HubListing, BotListing, BotListingInput, BotCommand, SkinListItem, SkinItem } from "./types";

// Overridable so a test topology never shares the dev database. A suite that
// writes into `data/discovery.db` is a suite whose second run disagrees with its
// first, for reasons that have nothing to do with the code under test.
const DATA_DIR = process.env.WAVVON_DISCOVERY_DATA_DIR
  ? path.resolve(process.env.WAVVON_DISCOVERY_DATA_DIR)
  : path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "discovery.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");
  migrate(_db);
  return _db;
}

export function initDb(db: Database.Database): void {
  migrate(db);
  _db = db;
}

function migrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS hubs (
      hub_pubkey         TEXT PRIMARY KEY,
      hub_url            TEXT NOT NULL,
      name               TEXT NOT NULL,
      description        TEXT,
      icon               TEXT,
      invite_only        INTEGER NOT NULL DEFAULT 0,
      min_security_level INTEGER NOT NULL DEFAULT 0,
      invite_code        TEXT,
      bio                TEXT NOT NULL DEFAULT '',
      tags               TEXT NOT NULL DEFAULT '[]',
      language           TEXT NOT NULL DEFAULT 'en',
      listed_at          TEXT NOT NULL,
      last_verified_at   TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_hubs_language ON hubs(language);
    CREATE INDEX IF NOT EXISTS idx_hubs_listed_at ON hubs(listed_at);

    CREATE TABLE IF NOT EXISTS bots (
      pubkey        TEXT PRIMARY KEY,
      name          TEXT NOT NULL,
      description   TEXT NOT NULL DEFAULT '',
      homepage_url  TEXT NOT NULL DEFAULT '',
      webhook_url   TEXT NOT NULL DEFAULT '',
      capabilities  TEXT NOT NULL DEFAULT '[]',
      commands      TEXT NOT NULL DEFAULT '[]',
      tags          TEXT NOT NULL DEFAULT '[]',
      listed_at     INTEGER NOT NULL,
      updated_at    INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_bots_listed_at ON bots(listed_at);

  `);

  // Client listings. Like skins, the signed document is kept whole in
  // `payload` and only the fields the browse page filters on are columns —
  // so a new field in the format costs no migration here.
  db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id            TEXT PRIMARY KEY,
      author_pubkey TEXT NOT NULL,
      name          TEXT NOT NULL,
      tagline       TEXT NOT NULL DEFAULT '',
      maintainer    TEXT NOT NULL DEFAULT '',
      official      INTEGER NOT NULL DEFAULT 0,
      platforms     TEXT NOT NULL DEFAULT '[]',
      languages     TEXT NOT NULL DEFAULT '[]',
      features      TEXT NOT NULL DEFAULT '[]',
      payload       TEXT NOT NULL,
      listed_at     TEXT NOT NULL,
      updated_at    TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_clients_author ON clients(author_pubkey);
    CREATE INDEX IF NOT EXISTS idx_clients_official ON clients(official);
  `);

  // Dropped with the uptime feature. A directory that probes every listed hub
  // pays a cost that grows with the catalogue and buys a number nobody browses
  // by; a broken listing is reported instead.
  db.exec(`DROP TABLE IF EXISTS hub_pings;`);

  // Dropped with the hub-creation wizard. Config templates only ever had one
  // consumer — a flow that built a hub for somebody. A hub is self-hosted now,
  // so its channel layout is set up on the hub itself.
  db.exec(`DROP TABLE IF EXISTS templates;`);

  db.exec(`
    CREATE TABLE IF NOT EXISTS analytics_cache (
      key         TEXT PRIMARY KEY,
      value       TEXT NOT NULL,
      computed_at TEXT NOT NULL
    );
  `);

  // Providers: operators who will run a hub for you. The old `farms` table
  // modelled the same offer under the deployment's name — a farm is the
  // server-side aggregate of hubs, which is not a thing this site lists.
  db.exec(`
    CREATE TABLE IF NOT EXISTS providers (
      provider_pubkey   TEXT PRIMARY KEY,
      provider_url      TEXT NOT NULL UNIQUE,
      name              TEXT NOT NULL,
      description       TEXT NOT NULL DEFAULT '',
      icon              TEXT,
      pricing_tiers     TEXT NOT NULL DEFAULT '[]',
      accepting         INTEGER NOT NULL DEFAULT 1,
      listed_at         TEXT NOT NULL,
      last_verified_at  TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_providers_name ON providers(name);
  `);
  db.exec(`DROP TABLE IF EXISTS farms;`);

  // Dropped with the hub-creation wizard: a bootstrap token was how a hub
  // somebody else provisioned learned what it was meant to be.
  db.exec(`DROP TABLE IF EXISTS bootstrap_tokens;`);

  db.exec(`
    CREATE TABLE IF NOT EXISTS skins (
      id             TEXT PRIMARY KEY,
      author_pubkey  TEXT NOT NULL,
      name           TEXT NOT NULL,
      base           TEXT NOT NULL,
      swatch_bg      TEXT NOT NULL,
      swatch_surface TEXT NOT NULL,
      swatch_accent  TEXT NOT NULL,
      payload        TEXT NOT NULL,
      featured       INTEGER NOT NULL DEFAULT 0,
      listed_at      INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_skins_author ON skins(author_pubkey);
    CREATE INDEX IF NOT EXISTS idx_skins_listed_at ON skins(listed_at DESC);
    CREATE INDEX IF NOT EXISTS idx_skins_base ON skins(base);
  `);
}

interface HubRow {
  hub_pubkey: string;
  hub_url: string;
  name: string;
  description: string | null;
  icon: string | null;
  invite_only: number;
  min_security_level: number;
  invite_code: string | null;
  bio: string;
  tags: string;
  language: string;
  listed_at: string;
  last_verified_at: string;
}

function rowToListing(row: HubRow): HubListing {
  return {
    ...row,
    invite_only: row.invite_only === 1,
    tags: JSON.parse(row.tags) as string[],
  };
}

export interface ListOptions {
  q?: string;
  tag?: string | string[];
  language?: string | string[];
  /** Undefined means both; true or false narrows to one. */
  inviteOnly?: boolean;
  page?: number;
}

export function listHubs(opts: ListOptions = {}): { hubs: HubListing[]; total: number } {
  const db = getDb();
  const page = Math.max(1, opts.page ?? 1);
  const limit = 20;
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (opts.q) {
    conditions.push("(name LIKE ? OR bio LIKE ?)");
    params.push(`%${opts.q}%`, `%${opts.q}%`);
  }
  // Several languages read as "any of these"; several tags read as "all of
  // these". Different because a hub speaks one language but carries many tags.
  const languages = opts.language ? (Array.isArray(opts.language) ? opts.language : [opts.language]) : [];
  if (languages.length > 0) {
    conditions.push(`language IN (${languages.map(() => "?").join(", ")})`);
    params.push(...languages);
  }
  if (opts.inviteOnly !== undefined) {
    conditions.push("invite_only = ?");
    params.push(opts.inviteOnly ? 1 : 0);
  }

  const tags = opts.tag ? (Array.isArray(opts.tag) ? opts.tag : [opts.tag]) : [];
  for (const tag of tags) {
    conditions.push("EXISTS (SELECT 1 FROM json_each(hubs.tags) WHERE json_each.value = ?)");
    params.push(tag);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const rows = db.prepare(`SELECT * FROM hubs ${where} ORDER BY listed_at DESC LIMIT ? OFFSET ?`)
    .all([...params, limit, offset]) as HubRow[];
  const { count } = db.prepare(`SELECT COUNT(*) as count FROM hubs ${where}`)
    .get(params) as { count: number };

  return { hubs: rows.map(rowToListing), total: count };
}

/* Keys are stored as `ed25519:<hex>` but URLs carry the hex alone, because a
 * colon in a path segment does not survive the router. Both forms resolve. */
function keyVariants(pubkey: string): [string, string] {
  const hex = pubkey.startsWith("ed25519:") ? pubkey.slice(8) : pubkey;
  return [pubkey, pubkey === hex ? `ed25519:${hex}` : hex];
}

export function getHub(pubkey: string): HubListing | null {
  const db = getDb();
  const [given, other] = keyVariants(pubkey);
  const row = db
    .prepare("SELECT * FROM hubs WHERE hub_pubkey = ? OR hub_pubkey = ?")
    .get(given, other) as HubRow | undefined;
  return row ? rowToListing(row) : null;
}

export function upsertHub(listing: Omit<HubListing, "listed_at" | "last_verified_at"> & {
  listed_at?: string; last_verified_at?: string;
}): HubListing {
  const db = getDb();
  const now = new Date().toISOString();
  const existing = getHub(listing.hub_pubkey);

  db.prepare(`
    INSERT INTO hubs (hub_pubkey, hub_url, name, description, icon, invite_only,
      min_security_level, invite_code, bio, tags, language, listed_at, last_verified_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(hub_pubkey) DO UPDATE SET
      hub_url = excluded.hub_url,
      name = excluded.name,
      description = excluded.description,
      icon = excluded.icon,
      invite_only = excluded.invite_only,
      min_security_level = excluded.min_security_level,
      invite_code = excluded.invite_code,
      bio = excluded.bio,
      tags = excluded.tags,
      language = excluded.language,
      last_verified_at = excluded.last_verified_at
  `).run(
    listing.hub_pubkey,
    listing.hub_url,
    listing.name,
    listing.description ?? null,
    listing.icon ?? null,
    listing.invite_only ? 1 : 0,
    listing.min_security_level,
    listing.invite_code ?? null,
    listing.bio,
    JSON.stringify(listing.tags),
    listing.language,
    existing?.listed_at ?? now,
    now,
  );

  return getHub(listing.hub_pubkey)!;
}

export function deleteHub(pubkey: string): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM hubs WHERE hub_pubkey = ?").run(pubkey);
  return result.changes > 0;
}

interface BotRow {
  pubkey: string;
  name: string;
  description: string;
  homepage_url: string;
  webhook_url: string;
  capabilities: string;
  commands: string;
  tags: string;
  listed_at: number;
  updated_at: number;
}

function botRowToListing(row: BotRow): BotListing {
  return {
    ...row,
    capabilities: JSON.parse(row.capabilities) as string[],
    commands: JSON.parse(row.commands) as BotCommand[],
    tags: JSON.parse(row.tags) as string[],
  };
}

export function listBots(opts: { search?: string; tag?: string | string[] } = {}): BotListing[] {
  const db = getDb();
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (opts.search) {
    conditions.push("(name LIKE ? OR description LIKE ?)");
    params.push(`%${opts.search}%`, `%${opts.search}%`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const rows = db.prepare(`SELECT * FROM bots ${where} ORDER BY listed_at DESC`)
    .all(params) as BotRow[];

  let bots = rows.map(botRowToListing);

  const wanted = opts.tag ? (Array.isArray(opts.tag) ? opts.tag : [opts.tag]) : [];
  if (wanted.length > 0) {
    bots = bots.filter((b) => wanted.every((t) => b.tags.includes(t)));
  }

  return bots;
}

export function getBot(pubkey: string): BotListing | undefined {
  const db = getDb();
  const [given, other] = keyVariants(pubkey);
  const row = db
    .prepare("SELECT * FROM bots WHERE pubkey = ? OR pubkey = ?")
    .get(given, other) as BotRow | undefined;
  return row ? botRowToListing(row) : undefined;
}

export function upsertBot(data: BotListingInput): void {
  const db = getDb();
  const now = Date.now();
  const existing = getBot(data.pubkey);

  db.prepare(`
    INSERT INTO bots (pubkey, name, description, homepage_url, webhook_url, capabilities, commands, tags, listed_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(pubkey) DO UPDATE SET
      name = excluded.name,
      description = excluded.description,
      homepage_url = excluded.homepage_url,
      webhook_url = excluded.webhook_url,
      capabilities = excluded.capabilities,
      commands = excluded.commands,
      tags = excluded.tags,
      updated_at = excluded.updated_at
  `).run(
    data.pubkey,
    data.name,
    data.description,
    data.homepage_url,
    data.webhook_url,
    JSON.stringify(data.capabilities),
    JSON.stringify(data.commands),
    JSON.stringify(data.tags),
    existing?.listed_at ?? now,
    now,
  );
}

export function deleteBot(pubkey: string): void {
  const db = getDb();
  db.prepare("DELETE FROM bots WHERE pubkey = ?").run(pubkey);
}

// ---- Skins ----

export interface SkinRow {
  id: string;
  author_pubkey: string;
  name: string;
  base: string;
  swatch_bg: string;
  swatch_surface: string;
  swatch_accent: string;
  payload: string;
  featured: number;
  listed_at: number;
}

function skinRowToItem(row: SkinRow): SkinItem {
  return { ...row };
}

function skinRowToListItem(row: SkinRow): SkinListItem {
  const { payload: _payload, ...rest } = row;
  void _payload;
  return rest;
}

export function registerSkin(row: SkinRow): void {
  const db = getDb();
  db.prepare(`
    INSERT OR REPLACE INTO skins
      (id, author_pubkey, name, base, swatch_bg, swatch_surface, swatch_accent, payload, featured, listed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    row.id,
    row.author_pubkey,
    row.name,
    row.base,
    row.swatch_bg,
    row.swatch_surface,
    row.swatch_accent,
    row.payload,
    row.featured,
    row.listed_at,
  );
}

export function getSkin(id: string): SkinItem | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM skins WHERE id = ?").get(id) as SkinRow | undefined;
  return row ? skinRowToItem(row) : null;
}

export function deleteSkin(id: string): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM skins WHERE id = ?").run(id);
  return result.changes > 0;
}

export interface ListSkinsOptions {
  q?: string;
  base?: string;
  page?: number;
}

export function listSkins(opts: ListSkinsOptions = {}): { skins: SkinListItem[]; total: number } {
  const db = getDb();
  const page = Math.max(1, opts.page ?? 1);
  const limit = 20;
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (opts.q) {
    conditions.push("name LIKE ?");
    params.push(`%${opts.q}%`);
  }
  if (opts.base) {
    conditions.push("base = ?");
    params.push(opts.base);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const rows = db.prepare(
    `SELECT * FROM skins ${where} ORDER BY featured DESC, listed_at DESC LIMIT ? OFFSET ?`
  ).all([...params, limit, offset]) as SkinRow[];
  const { count } = db.prepare(`SELECT COUNT(*) as count FROM skins ${where}`)
    .get(params) as { count: number };

  return { skins: rows.map(skinRowToListItem), total: count };
}

/* Facet counts for the hub rail.
 *
 * Tags and languages are open sets — whatever hubs declare — so the rail is
 * built from the data rather than from a list kept in the code. */

export function hubTagCounts(): Array<{ value: string; count: number }> {
  return getDb()
    .prepare(
      `SELECT json_each.value AS value, COUNT(*) AS count
         FROM hubs, json_each(hubs.tags)
        GROUP BY value ORDER BY count DESC, value`
    )
    .all() as Array<{ value: string; count: number }>;
}

export function hubLanguageCounts(): Array<{ value: string; count: number }> {
  return getDb()
    .prepare(
      `SELECT language AS value, COUNT(*) AS count
         FROM hubs GROUP BY language ORDER BY count DESC, value`
    )
    .all() as Array<{ value: string; count: number }>;
}

export function hubAccessCounts(): { open: number; invite: number } {
  const rows = getDb()
    .prepare("SELECT invite_only, COUNT(*) AS n FROM hubs GROUP BY invite_only")
    .all() as Array<{ invite_only: number; n: number }>;
  return {
    open: rows.find((r) => r.invite_only === 0)?.n ?? 0,
    invite: rows.find((r) => r.invite_only === 1)?.n ?? 0,
  };
}

export function botTagCounts(): Array<{ value: string; count: number }> {
  return getDb()
    .prepare(
      `SELECT json_each.value AS value, COUNT(*) AS count
         FROM bots, json_each(bots.tags)
        GROUP BY value ORDER BY count DESC, value`
    )
    .all() as Array<{ value: string; count: number }>;
}
