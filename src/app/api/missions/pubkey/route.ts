import { NextResponse } from "next/server";
import { getPublicKeyHex } from "@/lib/missions-key";

export async function GET() {
  return NextResponse.json({ pubkey: await getPublicKeyHex() });
}
