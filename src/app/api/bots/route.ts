import { NextRequest, NextResponse } from "next/server";
import { listBots, upsertBot } from "@/lib/db";
import type { BotListingInput } from "@/lib/types";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const bots = listBots({
    search: searchParams.get("search") ?? undefined,
    tag: searchParams.get("tag") ?? undefined,
  });
  return NextResponse.json(bots);
}

export async function POST(req: NextRequest) {
  let body: BotListingInput;
  try {
    body = await req.json() as BotListingInput;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const err = validateBot(body);
  if (err) return err;

  upsertBot(body);
  return NextResponse.json({ ok: true }, { status: 201 });
}

export function validateBot(body: BotListingInput): NextResponse | null {
  const { pubkey, name } = body;

  if (!pubkey || !name) {
    return NextResponse.json({ error: "pubkey and name are required" }, { status: 400 });
  }
  if (!/^[0-9a-f]{64}$/.test(pubkey)) {
    return NextResponse.json({ error: "pubkey must be 64 lowercase hex characters" }, { status: 400 });
  }
  if (name.length > 64) {
    return NextResponse.json({ error: "name must be 64 characters or fewer" }, { status: 400 });
  }
  if (body.description && body.description.length > 500) {
    return NextResponse.json({ error: "description must be 500 characters or fewer" }, { status: 400 });
  }
  if (body.homepage_url && body.homepage_url.length > 255) {
    return NextResponse.json({ error: "homepage_url must be 255 characters or fewer" }, { status: 400 });
  }
  if (body.webhook_url && body.webhook_url.length > 255) {
    return NextResponse.json({ error: "webhook_url must be 255 characters or fewer" }, { status: 400 });
  }

  return null;
}
