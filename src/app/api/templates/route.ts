import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { verifySignature } from "@/lib/verify";

// GET /api/templates — browse catalog
export async function GET(req: NextRequest) {
  const db = getDb();
  const q = req.nextUrl.searchParams.get("q")?.slice(0, 100) ?? null;
  const tag = req.nextUrl.searchParams.get("tag")?.slice(0, 50) ?? null;
  let query = "SELECT template_id, name, description, author_pubkey, version, tags, listed_at FROM templates WHERE 1=1";
  const params: string[] = [];
  if (q) { query += " AND (name LIKE ? OR description LIKE ?)"; params.push(`%${q}%`, `%${q}%`); }
  if (tag) { query += " AND tags LIKE ?"; params.push(`%"${tag}"%`); }
  query += " ORDER BY listed_at DESC LIMIT 50";
  const rows = db.prepare(query).all(...params);
  return NextResponse.json({ templates: rows });
}

// POST /api/templates — self-submit a template
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  if (!body?.template_id || !body?.name || !body?.author_pubkey || !body?.payload || !body?.signature) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  if (typeof body.template_id !== "string" || body.template_id.length > 64) {
    return NextResponse.json({ error: "template_id must be a string of 64 chars or fewer" }, { status: 400 });
  }
  if (typeof body.name !== "string" || body.name.length > 64) {
    return NextResponse.json({ error: "name must be 64 characters or fewer" }, { status: 400 });
  }
  if (body.description !== undefined && (typeof body.description !== "string" || body.description.length > 500)) {
    return NextResponse.json({ error: "description must be 500 characters or fewer" }, { status: 400 });
  }
  if (body.version !== undefined && (typeof body.version !== "string" || body.version.length > 20)) {
    return NextResponse.json({ error: "version must be 20 characters or fewer" }, { status: 400 });
  }
  if (!Array.isArray(body.tags) && body.tags !== undefined) {
    return NextResponse.json({ error: "tags must be an array" }, { status: 400 });
  }
  if (Array.isArray(body.tags) && (body.tags.length > 20 || body.tags.some((t) => typeof t !== "string" || t.length > 50))) {
    return NextResponse.json({ error: "tags must be at most 20 strings of 50 chars each" }, { status: 400 });
  }
  // Verify: signature covers canonical JSON of payload field
  const payloadStr = typeof body.payload === "string" ? body.payload : JSON.stringify(body.payload);
  if (payloadStr.length > 65536) {
    return NextResponse.json({ error: "payload must be 64 KB or smaller" }, { status: 400 });
  }
  const valid = await verifySignature(
    body.author_pubkey as string,
    body.signature as string,
    payloadStr,
  );
  if (!valid) return NextResponse.json({ error: "Invalid signature" }, { status: 400 });

  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO templates(template_id, name, description, author_pubkey, version, payload, signature, tags, listed_at, last_verified_at)
    VALUES(?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(template_id) DO UPDATE SET
      name=excluded.name, description=excluded.description,
      version=excluded.version, payload=excluded.payload,
      signature=excluded.signature, tags=excluded.tags,
      last_verified_at=excluded.last_verified_at
  `).run(
    body.template_id as string,
    body.name as string,
    (body.description as string | undefined) ?? "",
    body.author_pubkey as string,
    (body.version as string | undefined) ?? "1.0.0",
    payloadStr,
    body.signature as string,
    JSON.stringify(Array.isArray(body.tags) ? body.tags : []),
    now,
    now,
  );
  return NextResponse.json({ ok: true }, { status: 201 });
}
