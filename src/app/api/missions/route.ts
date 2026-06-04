import { NextResponse } from "next/server";
import { getActiveMissions } from "@/lib/missions-db";
import { signMissionList } from "@/lib/missions-key";

export async function GET() {
  const missions = getActiveMissions();
  const now = Math.floor(Date.now() / 1000);
  const envelope: Record<string, unknown> = {
    v: 1,
    issued_at: now,
    expires_at: now + 3600,
    missions,
    signature: "",
  };
  envelope.signature = await signMissionList(envelope);
  return NextResponse.json(envelope);
}
