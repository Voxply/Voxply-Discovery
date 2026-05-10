import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import type { HubListing } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "discovery.db");

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (_db) return _db;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");
  migrate(_db);
  return _db;
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
  language?: string;
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
  if (opts.language) {
    conditions.push("language = ?");
    params.push(opts.language);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const rows = db.prepare(`SELECT * FROM hubs ${where} ORDER BY listed_at DESC LIMIT ? OFFSET ?`)
    .all([...params, limit, offset]) as HubRow[];
  const { count } = db.prepare(`SELECT COUNT(*) as count FROM hubs ${where}`)
    .get(params) as { count: number };

  let hubs = rows.map(rowToListing);

  // Tag filtering — done in JS since SQLite JSON support varies
  const tags = opts.tag ? (Array.isArray(opts.tag) ? opts.tag : [opts.tag]) : [];
  if (tags.length > 0) {
    hubs = hubs.filter((h) => tags.every((t) => h.tags.includes(t)));
  }

  return { hubs, total: count };
}

export function getHub(pubkey: string): HubListing | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM hubs WHERE hub_pubkey = ?").get(pubkey) as HubRow | undefined;
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
