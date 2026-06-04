import { NextRequest, NextResponse } from "next/server";
import { redeemBootstrapToken } from "@/lib/bootstrap-db";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const token = body.token;
  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }
  const config = redeemBootstrapToken(token);
  if (!config) {
    return NextResponse.json(
      { error: "Invalid, expired, or already used token" },
      { status: 410 }
    );
  }
  return NextResponse.json(config);
}
