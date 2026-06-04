import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { recordPing } from "@/lib/uptime";

// Called by a cron job or Next.js cron (CRON_SECRET env guards it)
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const db = getDb();
  const hubs = db.prepare("SELECT hub_pubkey, hub_url FROM hubs").all() as { hub_pubkey: string; hub_url: string }[];
  const results = await Promise.allSettled(
    hubs.map(async (h) => {
      try {
        const res = await fetch(`${h.hub_url}/info`, { signal: AbortSignal.timeout(5000) });
        recordPing(h.hub_pubkey, res.ok);
        return { hub: h.hub_pubkey, ok: res.ok };
      } catch {
        recordPing(h.hub_pubkey, false);
        return { hub: h.hub_pubkey, ok: false };
      }
    })
  );
  return NextResponse.json({ checked: results.length });
}
