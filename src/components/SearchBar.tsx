"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";

interface Props {
  defaultQ?: string;
  defaultLanguage?: string;
  defaultTag?: string;
}

function SearchBarInner({ defaultQ, defaultLanguage, defaultTag }: Props) {
  const router = useRouter();
  const [q, setQ] = useState(defaultQ ?? "");
  const [language, setLanguage] = useState(defaultLanguage ?? "");

  function search(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (language) params.set("language", language);
    router.push(`/?${params.toString()}`);
  }

  return (
    <form onSubmit={search} className="flex gap-2">
      <input
        className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 placeholder:text-neutral-600"
        placeholder="Search hubs…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <input
        className="w-24 bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 placeholder:text-neutral-600"
        placeholder="lang"
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
      />
      <button
        type="submit"
        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors"
      >
        Search
      </button>
      {(defaultQ || defaultLanguage || defaultTag) && (
        <a href="/" className="px-4 py-2 border border-neutral-700 hover:border-neutral-500 rounded-lg text-sm text-neutral-400 transition-colors">
          Clear
        </a>
      )}
    </form>
  );
}

export function SearchBar(props: Props) {
  return (
    <Suspense>
      <SearchBarInner {...props} />
    </Suspense>
  );
}
