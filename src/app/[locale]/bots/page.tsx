import Link from "next/link";
import type { Metadata } from "next";
import { botTagCounts, listBots } from "@/lib/db";
import { DOCS, keyParam } from "@/lib/links";
import { Avatar, EmptyState, PageIntro, Tag } from "@/components/ui";
import { CopyButton } from "@/components/CopyButton";
import { getDictionary } from "@/i18n";
import { isLocale, type Locale } from "@/i18n/config";
import {
  hasAnyFilter,
  OpenFacet,
  type Params,
  RailLayout,
  ResetFilters,
  SearchBox,
} from "@/components/Facets";

export const dynamic = "force-dynamic";

const FILTER_KEYS = ["q", "tag"];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = getDictionary(isLocale(locale) ? locale : "en");
  return { title: t("bots.title"), description: t("bots.intro.before") };
}

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

export default async function BotsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Params>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "en";
  const t = getDictionary(locale);
  const base = `/${locale}/bots`;

  const query = await searchParams;
  const bots = listBots({ search: one(query, "q"), tag: many(query, "tag") });
  const total = listBots({}).length;
  const tagCounts = botTagCounts();
  const filtered = hasAnyFilter(query, FILTER_KEYS);

  return (
    <>
      <PageIntro title={t("bots.title")}>
        {t("bots.intro.before")} <span className="font-mono text-text-dim">{t("bots.intro.path")}</span>
        {t("bots.intro.after")}
      </PageIntro>

      <RailLayout
        rail={
          <>
            <SearchBox name="q" placeholder={t("bots.search")} defaultValue={one(query, "q")} hidden={query} />

            <OpenFacet
              title={t("bots.facet.tag")}
              first
              options={tagCounts.map((x) => ({ value: x.value, label: x.value, count: x.count }))}
              paramKey="tag"
              basePath={base}
              params={query}
              filterPlaceholder={t("facet.filter_tags")}
              showAll={one(query, "tag_all") === "1"}
              note={t("bots.facet.tag_note")}
              t={t}
            />

            {filtered ? <ResetFilters href={base} t={t} /> : null}
          </>
        }
      >
        <div className="flex items-baseline gap-2.5">
          <span className="font-mono text-[13px] text-text">{bots.length}</span>
          <span className="text-[13px] text-text-faint">
            {filtered
              ? t("bots.count.matching", { total })
              : bots.length === 1
                ? t("bots.count_one")
                : t("bots.count_other")}
          </span>
          {filtered ? (
            <Link href={base} className="ml-auto font-mono text-xs">
              {t("ui.show_all")} &rarr;
            </Link>
          ) : null}
        </div>

        {bots.length === 0 ? (
          <EmptyState title={filtered ? t("bots.empty.filtered") : t("bots.empty.none")}>
            <Link href={filtered ? base : DOCS.bots} className="font-mono text-xs">
              {filtered ? t("bots.empty.clear") : t("bots.empty.how")}
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
                    href={`${base}/${keyParam(bot.pubkey)}`}
                    className="min-w-0 text-base font-semibold text-text hover:text-accent"
                  >
                    {bot.name}
                  </Link>
                </div>

                <p className="line-clamp-3 text-sm leading-relaxed text-text-muted">
                  {bot.description || t("bots.card.no_description")}
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
                    <CopyButton value={bot.pubkey} label={t("bots.card.copy_key")} copiedLabel={t("ui.copied")} />
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="mt-3 flex items-center gap-6 rounded-[14px] border border-border bg-bg-sunken px-6 py-6 max-sm:flex-col max-sm:items-start">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-lg font-semibold tracking-[-0.3px]">{t("bots.cta.title")}</h2>
            <p className="max-w-[500px] text-sm leading-relaxed text-text-muted">{t("bots.cta.body")}</p>
          </div>
          <Link
            href={DOCS.bots}
            className="shrink-0 rounded-full border border-border-strong px-5 py-2.5 text-sm font-medium text-text transition-colors hover:border-text-muted hover:text-text sm:ml-auto"
          >
            {t("bots.cta.button")}
          </Link>
        </div>
      </RailLayout>
    </>
  );
}
