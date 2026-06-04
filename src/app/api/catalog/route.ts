import { NextResponse } from "next/server";
import { getCatalog } from "@/lib/missions-db";

export async function GET() {
  return NextResponse.json({ catalog: getCatalog() });
}
