import { NextRequest, NextResponse } from "next/server";
import { listBots, upsertBot } from "@/lib/db";
import { verifyListingSignature } from "@/lib/signed-listing";
import type { BotCommand, BotListingInput } from "@/lib/types";

const MAX_PAYLOAD_BYTES = 16384;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const bots = listBots({
    search: searchParams.get("search")?.slice(0, 100) ?? undefined,
    tag: searchParams.getAll("tag").map((t) => t.slice(0, 50)),
  });
  return NextResponse.json({ bots });
}

/** Anything wrong with the listing, as a message — or null if it is fine. */
export function validateBot(body: unknown, payloadBytes: number): string | null {
  if (payloadBytes > MAX_PAYLOAD_BYTES) return "payload must be 16 KB or smaller";
  if (typeof body !== "object" || body === null) return "payload is not an object";

  const b = body as Partial<BotListingInput>;
  if (typeof b.pubkey !== "string" || !/^[0-9a-f]{64}$/.test(b.pubkey)) {
    return "pubkey must be 64 lowercase hex characters";
  }
  if (typeof b.name !== "string" || b.name.trim() === "" || b.name.length > 64) {
    return "name is required and must be 64 characters or fewer";
  }
  if (b.description !== undefined && (typeof b.description !== "string" || b.description.length > 500)) {
    return "description must be 500 characters or fewer";
  }
  for (const field of ["homepage_url", "webhook_url"] as const) {
    const value = b[field];
    if (value !== undefined && (typeof value !== "string" || value.length > 255)) {
      return `${field} must be 255 characters or fewer`;
    }
  }
  if (b.commands !== undefined) {
    if (!Array.isArray(b.commands) || b.commands.length > 50) return "commands must be a list of at most 50";
    for (const command of b.commands as BotCommand[]) {
      if (typeof command?.name !== "string" || command.name.length > 40) {
        return "each command needs a name of 40 characters or fewer";
      }
    }
  }
  if (b.tags !== undefined && (!Array.isArray(b.tags) || b.tags.length > 20)) {
    return "tags must be a list of at most 20";
  }
  if (b.capabilities !== undefined && !Array.isArray(b.capabilities)) {
    return "capabilities must be a list";
  }
  return null;
}

/**
 * Publish or update a bot listing.
 *
 * The bot signs its own listing with its own key, the way a hub signs its own
 * and a client author signs theirs. Before this, the endpoint took a bare JSON
 * body and believed whatever `pubkey` it named — so anyone could claim a key,
 * overwrite somebody's listing, or delete it. A bot runs on its author's
 * machine and already speaks this API; proving the key costs it one signature.
 */
export async function POST(req: NextRequest) {
  let body: { payload?: unknown; sig?: unknown };
  try {
    body = (await req.json()) as { payload?: unknown; sig?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { payload, sig } = body;
  if (typeof payload !== "string" || typeof sig !== "string") {
    return NextResponse.json({ error: "Missing payload or sig" }, { status: 400 });
  }

  let listing: BotListingInput;
  try {
    listing = JSON.parse(payload) as BotListingInput;
  } catch {
    return NextResponse.json({ error: "payload is not valid JSON" }, { status: 400 });
  }

  const problem = validateBot(listing, Buffer.byteLength(payload, "utf8"));
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });

  if (!(await verifyListingSignature(payload, sig, listing.pubkey))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  upsertBot({
    ...listing,
    description: listing.description ?? "",
    homepage_url: listing.homepage_url ?? "",
    webhook_url: listing.webhook_url ?? "",
    capabilities: listing.capabilities ?? [],
    commands: listing.commands ?? [],
    tags: listing.tags ?? [],
  });
  return NextResponse.json({ ok: true }, { status: 201 });
}
