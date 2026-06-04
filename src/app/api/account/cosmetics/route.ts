import { NextRequest, NextResponse } from "next/server";
import { verifyAuthHeader } from "@/lib/missions-auth";
import { getEntitlements } from "@/lib/missions-db";

export async function GET(req: NextRequest) {
  const auth = await verifyAuthHeader(req.headers.get("x-voxply-auth"));
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });
  return NextResponse.json({ cosmetics: getEntitlements(auth.pubkey!) });
}
