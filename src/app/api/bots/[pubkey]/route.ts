import { NextRequest, NextResponse } from "next/server";
import { getBot, upsertBot, deleteBot } from "@/lib/db";
import { validateBot } from "../route";
import type { BotListingInput } from "@/lib/types";

interface Ctx { params: Promise<{ pubkey: string }> }

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { pubkey } = await params;
  const bot = getBot(pubkey);
  if (!bot) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(bot);
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { pubkey } = await params;
  if (!getBot(pubkey)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: BotListingInput;
  try {
    body = await req.json() as BotListingInput;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.pubkey !== pubkey) {
    return NextResponse.json({ error: "pubkey mismatch" }, { status: 400 });
  }

  const err = validateBot(body);
  if (err) return err;

  upsertBot(body);
  return NextResponse.json(getBot(pubkey));
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { pubkey } = await params;
  if (!getBot(pubkey)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  deleteBot(pubkey);
  return new NextResponse(null, { status: 204 });
}
