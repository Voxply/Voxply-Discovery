import { NextRequest, NextResponse } from "next/server";
import { verifyAdminBearer } from "@/lib/missions-auth";
import { getDb } from "@/lib/db";
import { createHash } from "crypto";

export async function POST(req: NextRequest) {
  if (!verifyAdminBearer(req.headers.get("authorization"))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body?.id || !body?.name || !body?.api_key || !body?.signing_pubkey) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  const apiKeyHash = createHash("sha256").update(body.api_key).digest("hex");
  getDb().prepare("INSERT INTO sponsors(id,name,balance_credits,api_key_hash,signing_pubkey) VALUES(?,?,0,?,?)").run(body.id, body.name, apiKeyHash, body.signing_pubkey);
  return NextResponse.json({ ok: true }, { status: 201 });
}
