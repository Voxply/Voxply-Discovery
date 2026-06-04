import { NextRequest, NextResponse } from "next/server";
import { verifyAdminBearer } from "@/lib/missions-auth";
import { getDb } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!verifyAdminBearer(req.headers.get("authorization"))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  const fields = ["title", "description", "reward_sparks", "attestation_url", "verify_callback_url", "expires_at", "active"].filter(f => f in body);
  if (fields.length === 0) return NextResponse.json({ ok: true });
  const sql = `UPDATE missions SET ${fields.map(f => `${f} = ?`).join(", ")} WHERE id = ?`;
  getDb().prepare(sql).run(...fields.map(f => body[f] as unknown), id);
  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!verifyAdminBearer(req.headers.get("authorization"))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const mission = getDb().prepare("SELECT * FROM missions WHERE id = ?").get(id);
  const count = (getDb().prepare("SELECT COUNT(*) as n FROM completions WHERE mission_id = ?").get(id) as { n: number }).n;
  return NextResponse.json({ mission, completions: count });
}
