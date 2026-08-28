import { DOC_RAW, GITHUB } from "./links";

/* The documentation lives in Wavvon-docs, not here.
 *
 * This registry is the allowlist that makes rendering it safe: a slug maps to
 * one known path in that repo, so `/docs/<anything>` can never be talked into
 * fetching an arbitrary file. Adding a page means adding a line — which is the
 * point, because an index nobody curates is a list of broken links. */

export interface DocEntry {
  slug: string;
  /** Path inside the Wavvon-docs repo. */
  path: string;
}

export interface DocSection {
  id: string;
  entries: DocEntry[];
}

/* Titles are not here. A page's title is `doc.<slug>` in the dictionaries and
 * a section's is `docs.section.<id>`, so the registry holds only what is the
 * same in every language: which slug maps to which file. */

const d = (slug: string, path = `docs/${slug}.md`): DocEntry => ({ slug, path });

export const DOC_SECTIONS: DocSection[] = [
  {
    id: "using",
    entries: [
      d("getting-started"),
      d("client"),
      d("browser-client"),
      d("identity-recovery"),
      d("data-export"),
      d("custom-themes"),
      d("accessibility"),
    ],
  },
  {
    id: "operating",
    entries: [
      d("hub-operator-guide"),
      d("hosting"),
      d("hub-operations"),
      d("hub-scaling"),
      d("hub-admin-panel"),
      d("federation"),
      d("alliances"),
    ],
  },
  {
    id: "building",
    entries: [
      d("ws-protocol"),
      d("wire-format"),
      d("bots"),
      d("bot-capability-layer"),
      d("gaming"),
      d("hub-discovery"),
    ],
  },
  {
    id: "reference",
    entries: [
      d("data-model"),
      d("e2e-encryption"),
      d("decisions"),
      d("shipped-log"),
      d("roadmap", "ROADMAP.md"),
      d("glossary"),
    ],
  },
];

/** Pages worth putting in front of somebody who has just arrived. */
export const START_HERE: DocEntry[] = [
  { slug: "getting-started", path: "docs/getting-started.md" },
  { slug: "architecture", path: "docs/architecture.md" },
  { slug: "comparison", path: "COMPARISON.md" },
];

/* The API reference is YAML, not prose — it belongs on the index as a link
 * out, never as a page this renderer tries to format. */
export const API_REFERENCE = {
  filename: "openapi.yaml",
  href: `${GITHUB.docs}/blob/main/openapi.yaml`,
};

const BY_SLUG = new Map<string, DocEntry>(
  [...DOC_SECTIONS.flatMap((s) => s.entries), ...START_HERE].map((entry) => [entry.slug, entry])
);

export function getDocEntry(slug: string): DocEntry | undefined {
  return BY_SLUG.get(slug);
}

export function allDocSlugs(): string[] {
  return [...BY_SLUG.keys()];
}

/** The section a page sits in, for the breadcrumb and the sidebar. */
export function sectionOf(slug: string): DocSection | undefined {
  return DOC_SECTIONS.find((section) => section.entries.some((e) => e.slug === slug));
}

/** Previous and next within the flattened reading order. */
export function neighbours(slug: string): { prev?: DocEntry; next?: DocEntry } {
  const flat = DOC_SECTIONS.flatMap((s) => s.entries);
  const i = flat.findIndex((e) => e.slug === slug);
  if (i === -1) return {};
  return { prev: flat[i - 1], next: flat[i + 1] };
}

export function rawUrl(entry: DocEntry): string {
  return `${DOC_RAW}/${entry.path}`;
}

export function editUrl(entry: DocEntry): string {
  return `${GITHUB.docs}/edit/main/${entry.path}`;
}

/**
 * Fetch the markdown source. Returns null when the docs repo cannot be
 * reached — the page then says so and points at GitHub, rather than
 * pretending the document does not exist.
 */
export async function fetchDoc(entry: DocEntry): Promise<string | null> {
  try {
    const res = await fetch(rawUrl(entry), { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}
