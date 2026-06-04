import { NextRequest, NextResponse } from "next/server";
import { verifyAdminBearer } from "@/lib/missions-auth";
import { getDb } from "@/lib/db";

export async function POST(req: NextRequest) {
  if (!verifyAdminBearer(req.headers.get("authorization"))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body?.item_id || !body?.name || !body?.type || !body?.cost_sparks || !body?.asset_url) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  getDb().prepare("INSERT INTO cosmetic_catalog(item_id,name,type,description,cost_sparks,asset_url,expires_at) VALUES(?,?,?,?,?,?,?)").run(body.item_id, body.name, body.type, body.description ?? "", body.cost_sparks, body.asset_url, body.expires_at ?? null);
  return NextResponse.json({ ok: true }, { status: 201 });
}
