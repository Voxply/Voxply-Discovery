import { NextRequest, NextResponse } from "next/server";
import { deleteBot, getBot } from "@/lib/db";
import { verifyListingSignature } from "@/lib/signed-listing";

interface Ctx {
  params: Promise<{ pubkey: string }>;
}

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { pubkey } = await params;
  const bot = getBot(pubkey);
  if (!bot) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(bot);
}

/**
 * Removal is proved, not asserted: the caller signs the pubkey with the key
 * that published the listing. Nobody else can take a bot down — this directory
 * included. There is no PUT: publishing the same key again through `POST
 * /api/bots` updates the listing, and one write path is easier to reason about
 * than two.
 */
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { pubkey } = await params;
  const bot = getBot(pubkey);
  if (!bot) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const sig = req.headers.get("x-wavvon-signature");
  if (!sig) return NextResponse.json({ error: "Missing x-wavvon-signature" }, { status: 401 });

  if (!(await verifyListingSignature(bot.pubkey, sig, bot.pubkey))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  deleteBot(bot.pubkey);
  return new NextResponse(null, { status: 204 });
}
