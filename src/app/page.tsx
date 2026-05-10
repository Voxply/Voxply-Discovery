import { listHubs } from "@/lib/db";
import { HubCard } from "@/components/HubCard";
import { SearchBar } from "@/components/SearchBar";

interface PageProps {
  searchParams: Promise<{ q?: string; tag?: string; language?: string; page?: string }>;
}

export default async function HomePage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const { hubs, total } = listHubs({
    q: sp.q,
    tag: sp.tag,
    language: sp.language,
    page: Number(sp.page ?? 1),
  });

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Find your community</h1>
        <p className="text-neutral-400">
          Browse Voxply hubs listed by their operators. Click any hub to preview
          it, then open it directly in the Voxply app.
        </p>
      </div>

      <SearchBar defaultQ={sp.q} defaultLanguage={sp.language} defaultTag={sp.tag} />

      <div className="mt-6 text-sm text-neutral-500 mb-4">
        {total === 0 ? "No hubs found" : `${total} hub${total === 1 ? "" : "s"}`}
        {sp.q ? ` matching "${sp.q}"` : ""}
      </div>

      {hubs.length === 0 ? (
        <div className="text-center py-16 text-neutral-500">
          <p className="text-lg">No hubs here yet.</p>
          <p className="mt-2">
            <a href="/submit" className="text-indigo-400 hover:text-indigo-300">
              Be the first to list yours →
            </a>
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {hubs.map((hub) => (
            <HubCard key={hub.hub_pubkey} hub={hub} />
          ))}
        </div>
      )}
    </div>
  );
}
