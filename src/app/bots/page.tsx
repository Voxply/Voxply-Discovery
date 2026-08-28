import Link from "next/link";
import type { Metadata } from "next";
import { botTagCounts, listBots } from "@/lib/db";
import { DOCS, keyParam } from "@/lib/links";
import { Avatar, EmptyState, PageIntro, Tag } from "@/components/ui";
import { CopyButton } from "@/components/CopyButton";
import {
  hasAnyFilter,
  OpenFacet,
  type Params,
  RailLayout,
  ResetFilters,
  SearchBox,
} from "@/components/Facets";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Bots",
  description: "A bot is an Ed25519 key that speaks the same API you do. Copy it, invite it, done.",
};

const BASE = "/bots";
const FILTER_KEYS = ["q", "tag"];

function one(params: Params, key: string): string | undefined {
  const raw = params[key];
  return Array.isArray(raw) ? raw[0] : raw;
}

function many(params: Params, key: string): string[] {
  const raw = params[key];
  return raw === undefined ? [] : Array.isArray(raw) ? raw : [raw];
}

/** `ed25519:0123…89ab` — enough to recognise, short enough to sit in a row. */
function shortKey(pubkey: string): string {
  const hex = pubkey.startsWith("ed25519:") ? pubkey.slice(8) : pubkey;
  return hex.length > 12 ? `ed25519:${hex.slice(0, 4)}…${hex.slice(-4)}` : pubkey;
}

export default async function BotsPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const bots = listBots({ search: one(params, "q"), tag: many(params, "tag") });
  const total = listBots({}).length;
  const tagCounts = botTagCounts();
  const filtered = hasAnyFilter(params, FILTER_KEYS);

  return (
    <>
      <PageIntro title="Bots">
        A bot is an Ed25519 key that speaks the same API you do. To add one, copy its public key and
        paste it into your hub under{" "}
        <span className="font-mono text-text-dim">Settings → Bots → Invite</span>. Nothing is installed
        on the hub, and the bot only sees the channels you give it.
      </PageIntro>

      <RailLayout
        rail={
          <>
            <SearchBox name="q" placeholder="Search bots" defaultValue={one(params, "q")} hidden={params} />

            <OpenFacet
              title="Tag"
              first
              options={tagCounts.map((t) => ({ value: t.value, label: t.value, count: t.count }))}
              paramKey="tag"
              basePath={BASE}
              params={params}
              filterPlaceholder="Filter tags"
              showAll={one(params, "tag_all") === "1"}
              note="Bots pick their own tags when they publish, so this list is as messy or as tidy as their authors are."
            />

            {filtered ? <ResetFilters href={BASE} /> : null}
          </>
        }
      >
        <div className="flex items-baseline gap-2.5">
          <span className="font-mono text-[13px] text-text">{bots.length}</span>
          <span className="text-[13px] text-text-faint">
            {filtered ? `of ${total} bots match` : bots.length === 1 ? "bot published" : "bots published"}
          </span>
          {filtered ? (
            <Link href={BASE} className="ml-auto font-mono text-xs">
              show all &rarr;
            </Link>
          ) : null}
        </div>

        {bots.length === 0 ? (
          <EmptyState
            title={
              filtered
                ? "No bots match those filters."
                : "No bot has been published yet. A bot is a keypair and a webhook — nothing to approve."
            }
          >
            <Link href={filtered ? BASE : DOCS.bots} className="font-mono text-xs">
              {filtered ? "clear filters →" : "how bots work →"}
            </Link>
          </EmptyState>
        ) : (
          <div className="grid grid-cols-3 gap-[18px] max-xl:grid-cols-2 max-md:grid-cols-1">
            {bots.map((bot) => (
              <article
                key={bot.pubkey}
                className="flex flex-col gap-3.5 rounded-[14px] border border-border bg-bg-elevated p-[22px] transition-colors hover:border-border-strong"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={bot.name} size={44} />
                  <Link
                    href={`/bots/${keyParam(bot.pubkey)}`}
                    className="min-w-0 text-base font-semibold text-text hover:text-accent"
                  >
                    {bot.name}
                  </Link>
                </div>

                <p className="line-clamp-3 text-sm leading-relaxed text-text-muted">
                  {bot.description || "No description supplied."}
                </p>

                {bot.commands.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {bot.commands.slice(0, 3).map((command) => (
                      <Tag key={command.name} label={command.name} />
                    ))}
                    {bot.commands.length > 3 ? (
                      <span className="px-0.5 py-[3px] font-mono text-[11px] text-text-faint">
                        +{bot.commands.length - 3}
                      </span>
                    ) : null}
                  </div>
                ) : null}

                <div className="mt-auto flex items-center gap-2 border-t border-border-hairline pt-2.5">
                  <span className="truncate font-mono text-[11px] text-text-faint">
                    {shortKey(bot.pubkey)}
                  </span>
                  <span className="ml-auto">
                    <CopyButton value={bot.pubkey} label="copy key" />
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="mt-3 flex items-center gap-6 rounded-[14px] border border-border bg-bg-sunken px-6 py-6 max-sm:flex-col max-sm:items-start">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-lg font-semibold tracking-[-0.3px]">A bot is just a keypair and a webhook</h2>
            <p className="max-w-[500px] text-sm leading-relaxed text-text-muted">
              No approval, no token to request from us. Generate a key, answer the webhook, publish the
              listing signed with that key.
            </p>
          </div>
          <Link
            href={DOCS.bots}
            className="shrink-0 rounded-full border border-border-strong px-5 py-2.5 text-sm font-medium text-text transition-colors hover:border-text-muted hover:text-text sm:ml-auto"
          >
            How bots work
          </Link>
        </div>
      </RailLayout>
    </>
  );
}
