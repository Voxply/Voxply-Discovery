import { getCachedAnalytics, refreshAnalytics } from "@/lib/analytics";
import type { AnalyticsData } from "@/lib/analytics";

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
      <p className="text-sm text-neutral-500 mb-1">{label}</p>
      <p className="text-3xl font-bold text-neutral-100">{value.toLocaleString()}</p>
    </div>
  );
}

export default function AnalyticsPage() {
  const data: AnalyticsData = getCachedAnalytics() ?? refreshAnalytics();

  const maxTagCount = data.top_tags[0]?.count ?? 1;
  const maxWeekCount = Math.max(...data.registrations_per_week.map((r) => r.count), 1);

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Ecosystem analytics</h1>
        <p className="text-neutral-400 max-w-2xl">
          Aggregate counts of the Wavvon registry — operator-published metadata only.
          No user data, no message data, no tracking.
        </p>
        <p className="text-xs text-neutral-600 mt-2">
          Last computed: {new Date(data.computed_at).toLocaleString()} (refreshes hourly)
        </p>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        <StatCard label="Total hubs" value={data.total_hubs} />
        <StatCard label="Active hubs (7d)" value={data.active_hubs} />
        <StatCard label="Bots" value={data.total_bots} />
        <StatCard label="Games" value={data.total_games} />
      </div>

      {/* Top tags */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-4">Top hub tags</h2>
        {data.top_tags.length === 0 ? (
          <p className="text-neutral-500 text-sm">No tags recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {data.top_tags.map(({ tag, count }) => (
              <div key={tag} className="flex items-center gap-3">
                <span className="w-32 text-sm text-neutral-300 truncate">{tag}</span>
                <div className="flex-1 bg-neutral-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-indigo-500 h-2 rounded-full"
                    style={{ width: `${Math.round((count / maxTagCount) * 100)}%` }}
                  />
                </div>
                <span className="w-8 text-right text-xs text-neutral-500">{count}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Weekly registrations */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Hub registrations (last 12 weeks)</h2>
        {data.registrations_per_week.length === 0 ? (
          <p className="text-neutral-500 text-sm">No registrations in this window.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left text-neutral-500 border-b border-neutral-800">
                  <th className="pb-2 pr-6 font-medium">Week</th>
                  <th className="pb-2 pr-6 font-medium">New hubs</th>
                  <th className="pb-2 font-medium w-full">Chart</th>
                </tr>
              </thead>
              <tbody>
                {data.registrations_per_week.map(({ week, count }) => (
                  <tr key={week} className="border-b border-neutral-900">
                    <td className="py-1.5 pr-6 font-mono text-neutral-400">{week}</td>
                    <td className="py-1.5 pr-6 text-neutral-100">{count}</td>
                    <td className="py-1.5">
                      <div className="bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-indigo-500 h-1.5 rounded-full"
                          style={{ width: `${Math.round((count / maxWeekCount) * 100)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
