"use client";
import { useState, useRef, useEffect } from "react";

interface SearchResult {
  type: string;
  id: string;
  name: string;
  description: string;
  url: string;
  icon: string | null;
  tags: string[];
}

interface SearchResponse {
  results: SearchResult[];
}

function resultHref(r: SearchResult): string {
  if (r.type === "hub") return `/hub/${r.id}`;
  if (r.type === "bot") return `/bots`;
  if (r.type === "template") return `/templates#${r.id}`;
  return r.url;
}

const TYPE_LABELS: Record<string, string> = {
  hub: "Hubs",
  bot: "Bots",
  template: "Templates",
};

export function GlobalSearchBar() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (q.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&types=hubs,bots,templates`);
        const data: SearchResponse = await res.json();
        setResults(data.results);
        setOpen(data.results.length > 0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
  }, [q]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Group by type
  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    (acc[r.type] ??= []).push(r);
    return acc;
  }, {});

  return (
    <div ref={containerRef} className="relative w-full max-w-xl">
      <input
        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 placeholder:text-neutral-600"
        placeholder="Search hubs, bots, templates…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
      />
      {loading && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-500">
          searching…
        </span>
      )}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-900 shadow-xl overflow-hidden">
          {Object.entries(grouped).map(([type, items]) => (
            <div key={type}>
              <div className="px-3 py-1 text-xs font-semibold text-neutral-500 bg-neutral-800/60">
                {TYPE_LABELS[type] ?? type}
              </div>
              {items.map((r) => (
                <a
                  key={r.id}
                  href={resultHref(r)}
                  className="flex flex-col px-3 py-2 hover:bg-neutral-800 transition-colors"
                  onClick={() => setOpen(false)}
                >
                  <span className="text-sm font-medium text-neutral-100">{r.name}</span>
                  {r.description && (
                    <span className="text-xs text-neutral-500 line-clamp-1">{r.description}</span>
                  )}
                </a>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
