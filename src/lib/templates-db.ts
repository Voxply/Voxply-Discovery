import { getDb } from "./db";

export interface TemplateRow {
  template_id: string;
  name: string;
  description: string;
  author_pubkey: string;
  version: string;
  payload: string;
  signature: string;
  tags: string;
  listed_at: string;
  last_verified_at: string;
}

export interface TemplateListing {
  template_id: string;
  name: string;
  description: string;
  author_pubkey: string;
  version: string;
  tags: string[];
  listed_at: string;
}

export interface TemplateRecord extends TemplateListing {
  payload: string;
  signature: string;
  last_verified_at: string;
}

function rowToRecord(row: TemplateRow): TemplateRecord {
  return {
    ...row,
    tags: JSON.parse(row.tags) as string[],
  };
}

export function getTemplate(templateId: string): TemplateRecord | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM templates WHERE template_id = ?").get(templateId) as TemplateRow | undefined;
  return row ? rowToRecord(row) : null;
}

export type RegisterResult = { status: "created" } | { status: "updated" } | { status: "forbidden" };

export function registerTemplate(input: {
  template_id: string;
  name: string;
  description?: string;
  author_pubkey: string;
  version?: string;
  payload: string;
  signature: string;
  tags?: string[];
}): RegisterResult {
  const db = getDb();
  const existing = getTemplate(input.template_id);

  if (existing && existing.author_pubkey !== input.author_pubkey) {
    return { status: "forbidden" };
  }

  const now = new Date().toISOString();
  const isNew = !existing;

  db.prepare(`
    INSERT INTO templates(template_id, name, description, author_pubkey, version, payload, signature, tags, listed_at, last_verified_at)
    VALUES(?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(template_id) DO UPDATE SET
      name=excluded.name,
      description=excluded.description,
      version=excluded.version,
      payload=excluded.payload,
      signature=excluded.signature,
      tags=excluded.tags,
      last_verified_at=excluded.last_verified_at
  `).run(
    input.template_id,
    input.name,
    input.description ?? "",
    input.author_pubkey,
    input.version ?? "1.0.0",
    input.payload,
    input.signature,
    JSON.stringify(input.tags ?? []),
    existing?.listed_at ?? now,
    now,
  );

  return isNew ? { status: "created" } : { status: "updated" };
}

export type DeleteResult = { status: "deleted" } | { status: "not_found" } | { status: "forbidden" };

export function deleteTemplate(templateId: string, authorPubkey: string): DeleteResult {
  const db = getDb();
  const existing = getTemplate(templateId);

  if (!existing) return { status: "not_found" };
  if (existing.author_pubkey !== authorPubkey) return { status: "forbidden" };

  db.prepare("DELETE FROM templates WHERE template_id = ?").run(templateId);
  return { status: "deleted" };
}

export function listTemplates(opts: { q?: string; tag?: string } = {}): TemplateListing[] {
  const db = getDb();
  const conditions: string[] = [];
  const params: string[] = [];

  if (opts.q) {
    conditions.push("(name LIKE ? OR description LIKE ?)");
    params.push(`%${opts.q}%`, `%${opts.q}%`);
  }
  if (opts.tag) {
    conditions.push("tags LIKE ?");
    params.push(`%"${opts.tag}"%`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const rows = db.prepare(
    `SELECT template_id, name, description, author_pubkey, version, tags, listed_at FROM templates ${where} ORDER BY listed_at DESC LIMIT 50`
  ).all(...params) as Array<Omit<TemplateRow, "payload" | "signature" | "last_verified_at">>;

  return rows.map((row) => ({
    ...row,
    tags: JSON.parse(row.tags) as string[],
  }));
}
