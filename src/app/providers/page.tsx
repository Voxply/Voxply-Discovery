import Link from "next/link";
import type { Metadata } from "next";
import { countProviders, listProviders } from "@/lib/providers-db";
import { DOCS } from "@/lib/links";
import { Avatar, EmptyState, Note, PageIntro } from "@/components/ui";
import {
  ClosedFacet,
  hasAnyFilter,
  type Params,
  RailLayout,
  ResetFilters,
} from "@/components/Facets";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Providers",
  description: "Operators who will run a hub for you, if you would rather not run one yourself.",
};

const BASE = "/providers";
const FILTER_KEYS = ["offer"];

function many(params: Params, key: string): string[] {
  const raw = params[key];
  return raw === undefined ? [] : Array.isArray(raw) ? raw : [raw];
}

function priceLabel(tier: { name: string; price_cents?: number; max_members?: number }): string {
  const free = tier.price_cents === 0 || tier.name.toLowerCase() === "free";
  const parts = [tier.name];
  if (!free && typeof tier.price_cents === "number") {
    parts.push(`${(tier.price_cents / 100).toFixed(2)}/mo`);
  }
  if (typeof tier.max_members === "number") parts.push(`${tier.max_members} members`);
  return parts.join(" · ");
}

export default async function ProvidersPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const offer = many(params, "offer");

  const providers = listProviders({
    freeTier: offer.includes("free"),
    accepting: offer.includes("accepting"),
  });
  const total = countProviders();
  const all = listProviders();
  const filtered = hasAnyFilter(params, FILTER_KEYS);

  return (
    <>
      <PageIntro title="Providers">
        Running a hub means running a server, and not everybody wants to. These operators will run one
        for you. They are other people making their own offer — this directory does not vet them, take a
        cut, or stand behind anything they promise.
      </PageIntro>

      <RailLayout
        rail={
          <>
            <ClosedFacet
              title="Offer"
              first
              options={[
                {
                  value: "free",
                  label: "Has a free tier",
                  count: all.filter((p) =>
                    p.pricing_tiers.some((t) => t.price_cents === 0 || t.name.toLowerCase() === "free")
                  ).length,
                },
                {
                  value: "accepting",
                  label: "Taking new hubs",
                  count: all.filter((p) => p.accepting).length,
                },
              ]}
              paramKey="offer"
              basePath={BASE}
              params={params}
            />
            {filtered ? <ResetFilters href={BASE} /> : null}
          </>
        }
      >
        <div className="flex items-baseline gap-2.5">
          <span className="font-mono text-[13px] text-text">{providers.length}</span>
          <span className="text-[13px] text-text-faint">
            {filtered ? `of ${total} providers match` : providers.length === 1 ? "provider" : "providers"}
          </span>
          {filtered ? (
            <Link href={BASE} className="ml-auto font-mono text-xs">
              show all &rarr;
            </Link>
          ) : null}
        </div>

        {providers.length === 0 ? (
          <EmptyState
            title={
              filtered
                ? "No provider matches those filters."
                : "Nobody is offering hosting here yet. Running your own hub takes one container and a database."
            }
          >
            <Link href={filtered ? BASE : DOCS.operatorGuide} className="font-mono text-xs">
              {filtered ? "clear filters →" : "read the operator guide →"}
            </Link>
          </EmptyState>
        ) : (
          <div className="grid grid-cols-2 gap-[18px] max-md:grid-cols-1">
            {providers.map((provider) => (
              <article
                key={provider.provider_pubkey}
                className="flex flex-col gap-3.5 rounded-[14px] border border-border bg-bg-elevated p-[22px]"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={provider.name} icon={provider.icon} />
                  <a
                    href={provider.provider_url}
                    rel="noreferrer nofollow"
                    className="min-w-0 text-base font-semibold text-text hover:text-accent"
                  >
                    {provider.name}
                  </a>
                  {!provider.accepting ? (
                    <span className="ml-auto shrink-0 rounded-full border border-border px-2 py-0.5 font-mono text-[10px] tracking-[0.6px] text-text-faint uppercase">
                      full
                    </span>
                  ) : null}
                </div>

                <p className="text-sm leading-relaxed text-text-muted">{provider.description}</p>

                {provider.pricing_tiers.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {provider.pricing_tiers.map((tier) => (
                      <span
                        key={tier.name}
                        className="rounded-full border border-border bg-surface px-2.5 py-[3px] font-mono text-[11px] text-text-muted"
                      >
                        {priceLabel(tier)}
                      </span>
                    ))}
                  </div>
                ) : null}

                <a
                  href={provider.provider_url}
                  rel="noreferrer nofollow"
                  className="mt-auto pt-1 font-mono text-xs"
                >
                  what they offer &rarr;
                </a>
              </article>
            ))}
          </div>
        )}

        <Note>
          A hosted hub is still your hub — the same software, the same keys, the same right to move it
          somewhere else. What you are buying is somebody else running the server. Read what they say
          about backups and about what happens when you leave, because this directory does not check
          either.
        </Note>

        <div className="mt-1 flex items-center gap-6 rounded-[14px] border border-border bg-bg-sunken px-6 py-6 max-sm:flex-col max-sm:items-start">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-lg font-semibold tracking-[-0.3px]">Rather run it yourself?</h2>
            <p className="max-w-[480px] text-sm leading-relaxed text-text-muted">
              One container and a PostgreSQL database. If you already run several, a farm keeps them
              together — that is a server-side thing, not something a client ever sees.
            </p>
          </div>
          <Link
            href={DOCS.operatorGuide}
            className="shrink-0 rounded-full border border-border-strong px-5 py-2.5 text-sm font-medium text-text transition-colors hover:border-text-muted hover:text-text sm:ml-auto"
          >
            Operator guide
          </Link>
        </div>
      </RailLayout>
    </>
  );
}
