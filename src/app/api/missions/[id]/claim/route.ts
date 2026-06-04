import { NextRequest, NextResponse } from "next/server";
import { getMission, getSponsor, isAlreadyClaimed, checkRateLimit, recordClaim } from "@/lib/missions-db";
import { verifyPow, difficultyForReward } from "@/lib/pow";
import { createHash } from "crypto";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body || !body.user_pubkey || !body.attestation_token || !body.pow_nonce) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  const mission = getMission(id);
  if (!mission) return NextResponse.json({ error: "Mission not found" }, { status: 404 });
  if (isAlreadyClaimed(id, body.user_pubkey)) return NextResponse.json({ error: "Already claimed" }, { status: 409 });
  if (!checkRateLimit(body.user_pubkey)) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  const difficulty = difficultyForReward(mission.reward_sparks as number);
  if (!verifyPow(body.pow_nonce, id, body.user_pubkey, difficulty)) {
    return NextResponse.json({ error: "Invalid proof of work" }, { status: 400 });
  }
  // Verify sponsor exists
  const sponsor = getSponsor(mission.sponsor_id as string);
  if (!sponsor) return NextResponse.json({ error: "Sponsor not found" }, { status: 500 });
  // Attestation token verification: v1 trusts a well-formed token;
  // sponsor callback is optional and deferred to production per design doc.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const ipHash = createHash("sha256").update(ip).digest("hex").slice(0, 16);
  recordClaim(id, body.user_pubkey, ipHash, difficulty, mission.reward_sparks as number);
  return NextResponse.json({ ok: true, sparks_earned: mission.reward_sparks });
}
