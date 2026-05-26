import { listBots } from "@/lib/db";
import { BotCard } from "@/components/BotCard";

interface Props {
  searchParams: Promise<{ search?: string; tag?: string }>;
}

export default async function BotsPage({ searchParams }: Props) {
  const { search, tag } = await searchParams;
  const bots = listBots({ search, tag });

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Bot directory</h1>
        <p className="text-neutral-400 max-w-2xl">
          Community-built bots for Voxply hubs. Copy a pubkey and paste it
          in Hub Settings → Bots → Invite to add one to your community.
        </p>
      </div>

      <form className="flex gap-3 mb-8">
        <input
          name="search"
          defaultValue={search}
          placeholder="Search bots…"
          className="flex-1 px-4 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-sm placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm transition-colors"
        >
          Search
        </button>
        {(search || tag) && (
          <a href="/bots" className="px-4 py-2 rounded-lg border border-neutral-700 text-neutral-400 text-sm hover:border-neutral-500 transition-colors">
            Clear
          </a>
        )}
      </form>

      <p className="text-sm text-neutral-500 mb-4">
        {bots.length} bot{bots.length !== 1 ? "s" : ""}
        {search ? ` matching "${search}"` : ""}
      </p>

      {bots.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bots.map((bot) => <BotCard key={bot.pubkey} bot={bot} />)}
        </div>
      ) : (
        <div className="text-center py-20 text-neutral-600">
          <p className="text-lg mb-2">No bots listed yet.</p>
          <a href="/bots/submit" className="text-indigo-400 hover:text-indigo-300">
            Be the first to list yours →
          </a>
        </div>
      )}
    </div>
  );
}
