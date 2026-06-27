import { getDb } from "@/lib/db";
import { TagChip } from "@/components/TagChip";

interface TemplateRow {
  template_id: string;
  name: string;
  description: string;
  author_pubkey: string;
  version: string;
  tags: string;
  listed_at: string;
}

interface PageProps {
  searchParams: Promise<{ q?: string; tag?: string }>;
}

function parseTagsSafe(s: string): string[] {
  try {
    const parsed = JSON.parse(s);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default async function TemplatesPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const db = getDb();

  let query = "SELECT template_id, name, description, author_pubkey, version, tags, listed_at FROM templates WHERE 1=1";
  const params: string[] = [];
  if (sp.q) {
    query += " AND (name LIKE ? OR description LIKE ?)";
    params.push(`%${sp.q}%`, `%${sp.q}%`);
  }
  if (sp.tag) {
    query += ` AND tags LIKE ?`;
    params.push(`%"${sp.tag}"%`);
  }
  query += " ORDER BY listed_at DESC LIMIT 50";

  const rows = db.prepare(query).all(...params) as TemplateRow[];

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Hub config templates</h1>
        <p className="text-neutral-400 max-w-2xl">
          Signed starter configs for Wavvon hubs. Pick a template when creating
          a hub to pre-fill channels, roles, and settings.
        </p>
      </div>

      <form className="flex gap-3 mb-8">
        <input
          name="q"
          defaultValue={sp.q}
          placeholder="Search templates…"
          className="flex-1 px-4 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-sm placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm transition-colors"
        >
          Search
        </button>
        {(sp.q || sp.tag) && (
          <a
            href="/templates"
            className="px-4 py-2 rounded-lg border border-neutral-700 text-neutral-400 text-sm hover:border-neutral-500 transition-colors"
          >
            Clear
          </a>
        )}
      </form>

      <p className="text-sm text-neutral-500 mb-4">
        {rows.length} template{rows.length !== 1 ? "s" : ""}
        {sp.q ? ` matching "${sp.q}"` : ""}
      </p>

      {rows.length === 0 ? (
        <div className="text-center py-20 text-neutral-600">
          <p className="text-lg mb-2">No templates listed yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((t) => {
            const tags = parseTagsSafe(t.tags);
            return (
              <div
                key={t.template_id}
                id={t.template_id}
                className="flex flex-col bg-neutral-900 border border-neutral-800 rounded-xl p-4 hover:border-neutral-600 transition-colors"
              >
                <div className="flex-1">
                  <h2 className="font-semibold text-neutral-100 leading-tight mb-1">
                    {t.name}
                  </h2>
                  <p className="text-xs text-neutral-500 mb-2">v{t.version}</p>
                  {t.description && (
                    <p className="text-sm text-neutral-400 line-clamp-2 mb-3">
                      {t.description}
                    </p>
                  )}
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {tags.slice(0, 4).map((tag) => (
                        <TagChip key={tag} tag={tag} href={`/templates?tag=${tag}`} />
                      ))}
                      {tags.length > 4 && (
                        <span className="text-xs text-neutral-600">+{tags.length - 4}</span>
                      )}
                    </div>
                  )}
                  <p className="text-xs text-neutral-600 font-mono truncate">
                    By {t.author_pubkey.slice(0, 16)}…
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-neutral-800">
                  <a
                    href={`/new?template_id=${encodeURIComponent(t.template_id)}`}
                    className="block w-full text-center py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-medium transition-colors"
                  >
                    Use this template
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
