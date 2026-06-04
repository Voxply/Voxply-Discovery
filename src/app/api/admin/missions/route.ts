import { NextRequest, NextResponse } from "next/server";
import { verifyAdminBearer } from "@/lib/missions-auth";
import { getDb } from "@/lib/db";

export async function POST(req: NextRequest) {
  if (!verifyAdminBearer(req.headers.get("authorization"))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body?.id || !body?.sponsor_id || !body?.title || !body?.reward_sparks || !body?.attestation_url) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  getDb().prepare("INSERT INTO missions(id,sponsor_id,title,description,reward_sparks,attestation_url,verify_callback_url,expires_at,max_completions_per_user) VALUES(?,?,?,?,?,?,?,?,?)").run(body.id, body.sponsor_id, body.title, body.description ?? "", body.reward_sparks, body.attestation_url, body.verify_callback_url ?? null, body.expires_at ?? null, body.max_completions_per_user ?? 1);
  return NextResponse.json({ ok: true }, { status: 201 });
}
