import { NextRequest, NextResponse } from "next/server";
import { listProviders } from "@/lib/providers-db";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const providers = listProviders({
    freeTier: searchParams.get("free") === "true",
    accepting: searchParams.get("accepting") === "true",
  });
  return NextResponse.json({ providers, total: providers.length });
}
