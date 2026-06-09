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
  if (typeof body.farm_pubkey !== "string" || !/^[0-9a-f]{64}$/.test(body.farm_pubkey)) {
    return NextResponse.json({ error: "farm_pubkey must be 64 lowercase hex characters" }, { status: 400 });
  }
  if (typeof body.farm_url !== "string" || body.farm_url.length > 255) {
    return NextResponse.json({ error: "farm_url must be 255 characters or fewer" }, { status: 400 });
  }
  if (typeof body.name !== "string" || body.name.length > 64) {
    return NextResponse.json({ error: "name must be 64 characters or fewer" }, { status: 400 });
  }
  if (body.description !== undefined && (typeof body.description !== "string" || body.description.length > 500)) {
    return NextResponse.json({ error: "description must be 500 characters or fewer" }, { status: 400 });
  }
  if (body.icon !== undefined && (typeof body.icon !== "string" || body.icon.length > 255)) {
    return NextResponse.json({ error: "icon must be 255 characters or fewer" }, { status: 400 });
  }
  if (body.pricing_tiers !== undefined && (!Array.isArray(body.pricing_tiers) || body.pricing_tiers.length > 10)) {
    return NextResponse.json({ error: "pricing_tiers must be an array of at most 10 items" }, { status: 400 });
  }
  if (body.capacity_available !== undefined && (typeof body.capacity_available !== "number" || body.capacity_available < 0)) {
    return NextResponse.json({ error: "capacity_available must be a non-negative number" }, { status: 400 });
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
