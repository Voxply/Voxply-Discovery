import { listFarms } from "@/lib/farms-db";
import type { FarmListing } from "@/lib/farms-db";

interface PageProps {
  searchParams: Promise<{ has_free_tier?: string }>;
}

interface PricingTier {
  name?: string;
  max_members?: number;
  [key: string]: unknown;
}

function TierBadge({ tier }: { tier: PricingTier }) {
  const label = tier.name ?? "tier";
  const isFree =
    label.toLowerCase() === "free" ||
    (typeof tier.price_cents === "number" && tier.price_cents === 0);
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
        isFree
          ? "bg-green-900/50 text-green-400 border border-green-800"
          : "bg-neutral-800 text-neutral-300 border border-neutral-700"
      }`}
    >
      {label}
      {typeof tier.max_members === "number" && ` · ${tier.max_members} members`}
    </span>
  );
}

function FarmCard({ farm }: { farm: FarmListing }) {
  const tiers = farm.pricing_tiers as PricingTier[];
  const joinHref =
    farm.farm_url
      ? `/new?farm=${encodeURIComponent(farm.farm_url)}`
      : "#";

  return (
    <div className="flex flex-col bg-neutral-900 border border-neutral-800 rounded-xl p-5 hover:border-neutral-600 transition-colors">
      <div className="flex items-start gap-3 mb-3">
        {farm.icon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={farm.icon}
            alt=""
            width={40}
            height={40}
            className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center flex-shrink-0">
            <span className="text-lg">F</span>
          </div>
        )}
        <div className="min-w-0">
          <h2 className="font-semibold text-neutral-100 leading-tight truncate">{farm.name}</h2>
          <p className="text-xs text-neutral-500 font-mono truncate">{farm.farm_url}</p>
        </div>
      </div>

      {farm.description && (
        <p className="text-sm text-neutral-400 line-clamp-2 mb-3">{farm.description}</p>
      )}

      {tiers.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {tiers.map((tier, i) => (
            <TierBadge key={i} tier={tier} />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-auto pt-3 border-t border-neutral-800">
        <span className="text-xs text-neutral-500">
          {farm.capacity_available > 0
            ? `${farm.capacity_available} slot${farm.capacity_available !== 1 ? "s" : ""} available`
            : "Capacity unknown"}
        </span>
        <a
          href={joinHref}
          className="px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors"
        >
          Join
        </a>
      </div>
    </div>
  );
}

export default async function FarmsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const hasFreeTier = sp.has_free_tier === "true";
  const farms = listFarms({ hasFreeTier });

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Farm providers</h1>
        <p className="text-neutral-400 max-w-2xl">
          Managed infrastructure providers that host Voxply hubs for communities
          that prefer not to run their own server.
        </p>
      </div>

      <div className="flex gap-3 mb-6 text-sm">
        <a
          href="/farms"
          className={`px-3 py-1.5 rounded-md border transition-colors ${
            !hasFreeTier
              ? "border-indigo-500 text-indigo-300"
              : "border-neutral-700 text-neutral-400 hover:border-neutral-500"
          }`}
        >
          All farms
        </a>
        <a
          href="/farms?has_free_tier=true"
          className={`px-3 py-1.5 rounded-md border transition-colors ${
            hasFreeTier
              ? "border-indigo-500 text-indigo-300"
              : "border-neutral-700 text-neutral-400 hover:border-neutral-500"
          }`}
        >
          Free tier only
        </a>
      </div>

      <p className="text-sm text-neutral-500 mb-4">
        {farms.length} farm provider{farms.length !== 1 ? "s" : ""}
        {hasFreeTier ? " with a free tier" : ""}
      </p>

      {farms.length === 0 ? (
        <div className="text-center py-20 text-neutral-600">
          <p className="text-lg mb-2">No farms listed yet.</p>
          <p className="text-sm">
            Farm operators can self-register via{" "}
            <code className="font-mono text-neutral-500">POST /api/farms</code>.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {farms.map((farm) => (
            <FarmCard key={farm.farm_pubkey} farm={farm} />
          ))}
        </div>
      )}
    </div>
  );
}
