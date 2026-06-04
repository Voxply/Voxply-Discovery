import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { verifySignature } from "@/lib/verify";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = getDb().prepare("SELECT * FROM templates WHERE template_id = ?").get(id);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  if (!body?.author_pubkey || !body?.signature) {
    return NextResponse.json({ error: "Missing auth" }, { status: 400 });
  }
  const db = getDb();
  const row = db.prepare("SELECT author_pubkey FROM templates WHERE template_id = ?").get(id) as { author_pubkey: string } | undefined;
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (row.author_pubkey !== body.author_pubkey) {
    return NextResponse.json({ error: "Not author" }, { status: 403 });
  }
  const valid = await verifySignature(
    body.author_pubkey as string,
    body.signature as string,
    id,
  );
  if (!valid) return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  db.prepare("DELETE FROM templates WHERE template_id = ?").run(id);
  return NextResponse.json({ ok: true });
}
