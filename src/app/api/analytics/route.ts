import { NextResponse } from "next/server";
import { getCachedAnalytics, refreshAnalytics } from "@/lib/analytics";

export async function GET() {
  const cached = getCachedAnalytics();
  const data = cached ?? refreshAnalytics();
  return NextResponse.json(data);
}
