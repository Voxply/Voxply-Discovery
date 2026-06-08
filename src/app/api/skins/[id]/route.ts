import { NextRequest, NextResponse } from "next/server";
import { getSkin, deleteSkin } from "@/lib/db";
import { verifySignature } from "@/lib/verify";

interface Ctx { params: Promise<{ id: string }> }

// Uint8Array → lowercase hex
function bytesToHex(b: Uint8Array): string {
  return Array.from(b)
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}

// base64url → Uint8Array
function base64urlToBytes(b64: string): Uint8Array {
  const padded = b64.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const bin = atob(padded + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const skin = getSkin(id);
  if (!skin) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(skin);
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const skin = getSkin(id);
  if (!skin) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: { author_pubkey: string; sig: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body.author_pubkey !== "string" || typeof body.sig !== "string") {
    return NextResponse.json({ error: "Missing author_pubkey or sig" }, { status: 400 });
  }

  if (skin.author_pubkey !== body.author_pubkey) {
    return NextResponse.json({ error: "author_pubkey does not match" }, { status: 403 });
  }

  // Verify signature over "delete:<id>"
  const message = `delete:${id}`;
  let sigHex: string;
  let pubkeyHex: string;
  try {
    sigHex = bytesToHex(base64urlToBytes(body.sig));
    const rawPubkey = body.author_pubkey.startsWith("ed25519:")
      ? body.author_pubkey.slice(8)
      : body.author_pubkey;
    pubkeyHex = rawPubkey;
  } catch {
    return NextResponse.json({ error: "Invalid sig or author_pubkey encoding" }, { status: 400 });
  }

  const valid = await verifySignature(pubkeyHex, sigHex, message);
  if (!valid) return NextResponse.json({ error: "Invalid signature" }, { status: 403 });

  deleteSkin(id);
  return new NextResponse(null, { status: 204 });
}
