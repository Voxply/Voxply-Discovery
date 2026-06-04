import { NextRequest, NextResponse } from "next/server";
import { verifyAuthHeader } from "@/lib/missions-auth";
import { getSparkBalance, getCatalogItem, redeemItem } from "@/lib/missions-db";
import { signEntitlement } from "@/lib/missions-key";

export async function POST(req: NextRequest) {
  const auth = await verifyAuthHeader(req.headers.get("x-voxply-auth"));
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body?.item_id) return NextResponse.json({ error: "Missing item_id" }, { status: 400 });
  const item = getCatalogItem(body.item_id);
  if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });
  const balance = getSparkBalance(auth.pubkey!);
  if (balance < (item.cost_sparks as number)) return NextResponse.json({ error: "Insufficient balance" }, { status: 402 });
  const grantedAt = Math.floor(Date.now() / 1000);
  const sig = await signEntitlement(auth.pubkey!, body.item_id, grantedAt);
  redeemItem(auth.pubkey!, body.item_id, item.cost_sparks as number, grantedAt, sig);
  return NextResponse.json({ user_pubkey: auth.pubkey, item_id: body.item_id, granted_at: grantedAt, expires_at: null, service_sig: sig });
}
