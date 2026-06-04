import { NextRequest, NextResponse } from "next/server";
import { listFarms, upsertFarm, removeFarm } from "@/lib/farms-db";
import { verifySignature } from "@/lib/verify";

export async function GET(req: NextRequest) {
  const hasFreeTier = req.nextUrl.searchParams.get("has_free_tier") === "true";
  return NextResponse.json({ farms: listFarms({ hasFreeTier }) });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  if (!body?.farm_pubkey || !body?.farm_url || !body?.name || !body?.signature) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Signature covers the canonical registration payload
  const payload = JSON.stringify({
    farm_pubkey: body.farm_pubkey,
    farm_url: body.farm_url,
    name: body.name,
  });
  const valid = await verifySignature(
    body.farm_pubkey as string,
    body.signature as string,
    payload
  );
  if (!valid) return NextResponse.json({ error: "Invalid signature" }, { status: 400 });

  upsertFarm({
    farm_pubkey: body.farm_pubkey as string,
    farm_url: body.farm_url as string,
    name: body.name as string,
    description: body.description as string | undefined,
    icon: body.icon as string | undefined,
    pricing_tiers: Array.isArray(body.pricing_tiers) ? body.pricing_tiers : undefined,
    capacity_available:
      typeof body.capacity_available === "number" ? body.capacity_available : undefined,
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  if (!body?.farm_pubkey || !body?.signature) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Signature covers the farm_pubkey string itself (deregistration proof)
  const valid = await verifySignature(
    body.farm_pubkey as string,
    body.signature as string,
    body.farm_pubkey as string
  );
  if (!valid) return NextResponse.json({ error: "Invalid signature" }, { status: 400 });

  removeFarm(body.farm_pubkey as string);
  return NextResponse.json({ ok: true });
}
