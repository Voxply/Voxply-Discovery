import { getDb } from "./db";

export interface AnalyticsData {
  total_hubs: number;
  active_hubs: number;
  total_bots: number;
  total_games: number;
  top_tags: Array<{ tag: string; count: number }>;
  registrations_per_week: Array<{ week: string; count: number }>;
  computed_at: string;
}

export function computeAnalytics(): AnalyticsData {
  const db = getDb();
  const total_hubs = (db.prepare("SELECT COUNT(*) as n FROM hubs").get() as { n: number }).n;
  const total_bots = (db.prepare("SELECT COUNT(*) as n FROM bots").get() as { n: number }).n ?? 0;

  // Active hubs: had at least one successful ping in last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400 * 1000).toISOString();
  const active_hubs =
    (
      db
        .prepare(
          "SELECT COUNT(DISTINCT hub_pubkey) as n FROM hub_pings WHERE success = 1 AND checked_at >= ?"
        )
        .get(sevenDaysAgo) as { n: number }
    ).n ?? 0;

  // Top tags — parsed from each hub's JSON tags array
  const all_tags = db
    .prepare("SELECT tags FROM hubs WHERE tags IS NOT NULL AND tags != '[]'")
    .all() as Array<{ tags: string }>;
  const tagCounts: Record<string, number> = {};
  for (const row of all_tags) {
    try {
      const tags: string[] = JSON.parse(row.tags);
      for (const t of tags) tagCounts[t] = (tagCounts[t] ?? 0) + 1;
    } catch {
      // malformed JSON — skip
    }
  }
  const top_tags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag, count]) => ({ tag, count }));

  // Registrations per week (last 12 weeks)
  const registrations_per_week = db
    .prepare(
      `SELECT strftime('%Y-W%W', listed_at) as week, COUNT(*) as count
       FROM hubs WHERE listed_at >= date('now', '-12 weeks')
       GROUP BY week ORDER BY week`
    )
    .all() as Array<{ week: string; count: number }>;

  // Games table may not exist in all schemas — degrade gracefully
  let total_games = 0;
  try {
    total_games = (db.prepare("SELECT COUNT(*) as n FROM games").get() as { n: number })?.n ?? 0;
  } catch {
    // table not present yet
  }

  return {
    total_hubs,
    active_hubs,
    total_bots,
    total_games,
    top_tags,
    registrations_per_week,
    computed_at: new Date().toISOString(),
  };
}

export function getCachedAnalytics(): AnalyticsData | null {
  const db = getDb();
  const row = db
    .prepare("SELECT value, computed_at FROM analytics_cache WHERE key = 'main'")
    .get() as { value: string; computed_at: string } | undefined;
  if (!row) return null;
  const age = Date.now() - new Date(row.computed_at).getTime();
  if (age > 3600 * 1000) return null; // 1-hour TTL
  return JSON.parse(row.value) as AnalyticsData;
}

export function refreshAnalytics(): AnalyticsData {
  const data = computeAnalytics();
  const db = getDb();
  db.prepare(
    "INSERT OR REPLACE INTO analytics_cache(key, value, computed_at) VALUES('main', ?, ?)"
  ).run(JSON.stringify(data), data.computed_at);
  return data;
}
