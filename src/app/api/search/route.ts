import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

interface SearchResult {
  type: string;
  id: string;
  name: string;
  description: string;
  url: string;
  icon: string | null;
  tags: string[];
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) return NextResponse.json({ results: [] });

  const types = req.nextUrl.searchParams.get("types")?.split(",") ?? ["hubs", "bots"];
  const db = getDb();
  const pattern = `%${q}%`;
  const results: SearchResult[] = [];

  if (types.includes("hubs")) {
    const rows = db.prepare(
      "SELECT hub_pubkey as id, name, bio as description, hub_url as url, icon, tags FROM hubs WHERE name LIKE ? OR bio LIKE ? OR tags LIKE ? LIMIT 5"
    ).all(pattern, pattern, pattern) as { id: string; name: string; description: string | null; url: string; icon: string | null; tags: string }[];
    results.push(...rows.map((r) => ({
      type: "hub",
      id: r.id,
      name: r.name,
      description: r.description ?? "",
      url: r.url,
      icon: r.icon,
      tags: tryParseJson(r.tags),
    })));
  }

  if (types.includes("bots")) {
    const rows = db.prepare(
      "SELECT pubkey as id, name, description, homepage_url as url, tags FROM bots WHERE name LIKE ? OR description LIKE ? LIMIT 5"
    ).all(pattern, pattern) as { id: string; name: string; description: string; url: string; tags: string }[];
    results.push(...rows.map((r) => ({
      type: "bot",
      id: r.id,
      name: r.name,
      description: r.description,
      url: r.url,
      icon: null,
      tags: tryParseJson(r.tags),
    })));
  }

  if (types.includes("templates")) {
    const rows = db.prepare(
      "SELECT template_id as id, name, description, author_pubkey as url, tags FROM templates WHERE name LIKE ? OR description LIKE ? OR tags LIKE ? LIMIT 5"
    ).all(pattern, pattern, pattern) as { id: string; name: string; description: string; url: string; tags: string }[];
    results.push(...rows.map((r) => ({
      type: "template",
      id: r.id,
      name: r.name,
      description: r.description,
      url: `/templates#${r.id}`,
      icon: null,
      tags: tryParseJson(r.tags),
    })));
  }

  return NextResponse.json({ results });
}

function tryParseJson(s: string): string[] {
  try {
    const parsed = JSON.parse(s);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
