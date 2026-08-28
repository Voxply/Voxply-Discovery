import Link from "next/link";
import type { Metadata } from "next";
import { hubAccessCounts, hubLanguageCounts, hubTagCounts, listHubs } from "@/lib/db";
import { languageName } from "@/lib/facets";
import { deepLink, DOCS, keyParam } from "@/lib/links";
import { Avatar, EmptyState, PageIntro, Tag } from "@/components/ui";
import { getDictionary } from "@/i18n";
import { isLocale, type Locale } from "@/i18n/config";
import {
  ClosedFacet,
  hasAnyFilter,
  OpenFacet,
  type Params,
  RailLayout,
  ResetFilters,
  SearchBox,
} from "@/components/Facets";

export const dynamic = "force-dynamic";

const FILTER_KEYS = ["q", "tag", "language", "access"];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = getDictionary(isLocale(locale) ? locale : "en");
  return { title: t("hubs.title"), description: t("hubs.intro") };
}

function one(params: Params, key: string): string | undefined {
  const raw = params[key];
  return Array.isArray(raw) ? raw[0] : raw;
}

function many(params: Params, key: string): string[] {
  const raw = params[key];
  return raw === undefined ? [] : Array.isArray(raw) ? raw : [raw];
}

export default async function HubsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Params>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "en";
  const t = getDictionary(locale);
  const base = `/${locale}/hubs`;

  const query = await searchParams;
  const access = many(query, "access");
  // Both boxes ticked says the same thing as neither.
  const inviteOnly = access.length === 1 ? access[0] === "invite" : undefined;

  const { hubs, total } = listHubs({
    q: one(query, "q"),
    tag: many(query, "tag"),
    language: many(query, "language"),
    inviteOnly,
  });

  const allHubs = listHubs({}).total;
  const tagCounts = hubTagCounts();
  const languageCounts = hubLanguageCounts();
  const accessCounts = hubAccessCounts();
  const filtered = hasAnyFilter(query, FILTER_KEYS);

  return (
    <>
      <PageIntro title={t("hubs.title")}>{t("hubs.intro")}</PageIntro>

      <RailLayout
        rail={
          <>
            <SearchBox name="q" placeholder={t("hubs.search")} defaultValue={one(query, "q")} hidden={query} />

            <OpenFacet
              title={t("hubs.facet.tag")}
              first
              options={tagCounts.map((x) => ({ value: x.value, label: x.value, count: x.count }))}
              paramKey="tag"
              basePath={base}
              params={query}
              filterPlaceholder={t("facet.filter_tags")}
              showAll={one(query, "tag_all") === "1"}
              t={t}
            />

            <OpenFacet
              title={t("hubs.facet.language")}
              options={languageCounts.map((x) => ({
                value: x.value,
                label: languageName(x.value),
                count: x.count,
              }))}
              paramKey="language"
              basePath={base}
              params={query}
              filterPlaceholder={t("facet.filter_languages")}
              showAll={one(query, "language_all") === "1"}
              note={t("hubs.facet.language_note")}
              t={t}
            />

            <ClosedFacet
              title={t("hubs.facet.access")}
              options={[
                { value: "open", label: t("hubs.access.open"), count: accessCounts.open },
                { value: "invite", label: t("hubs.access.invite"), count: accessCounts.invite },
              ]}
              paramKey="access"
              basePath={base}
              params={query}
            />

            {filtered ? <ResetFilters href={base} t={t} /> : null}
          </>
        }
      >
        <div className="flex items-baseline gap-2.5">
          <span className="font-mono text-[13px] text-text">{total}</span>
          <span className="text-[13px] text-text-faint">
            {filtered
              ? t("hubs.count.matching", { total: allHubs })
              : total === 1
                ? t("hubs.count.listed_one")
                : t("hubs.count.listed_other")}
          </span>
          {filtered ? (
            <Link href={base} className="ml-auto font-mono text-xs">
              {t("ui.show_all")} &rarr;
            </Link>
          ) : null}
        </div>

        {hubs.length === 0 ? (
          <EmptyState title={filtered ? t("hubs.empty.filtered") : t("hubs.empty.none")}>
            <Link href={filtered ? base : DOCS.operatorGuide} className="font-mono text-xs">
              {filtered ? t("hubs.empty.clear") : t("hubs.empty.run")}
            </Link>
          </EmptyState>
        ) : (
          <div className="grid grid-cols-3 gap-[18px] max-xl:grid-cols-2 max-md:grid-cols-1">
            {hubs.map((hub) => (
              <article
                key={hub.hub_pubkey}
                className="flex flex-col gap-3.5 rounded-[14px] border border-border bg-bg-elevated p-[22px] transition-colors hover:border-border-strong"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={hub.name} icon={hub.icon} accent />
                  <Link
                    href={`${base}/${keyParam(hub.hub_pubkey)}`}
                    className="min-w-0 text-base font-semibold text-text hover:text-accent"
                  >
                    {hub.name}
                  </Link>
                  {hub.invite_only ? (
                    <span
                      title={t("hubs.access.invite")}
                      className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-surface"
                    >
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="var(--text-muted)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <rect x="4" y="10.5" width="16" height="10" rx="2" />
                        <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
                      </svg>
                    </span>
                  ) : null}
                </div>

                <p className="line-clamp-3 text-sm leading-relaxed text-text-muted">
                  {hub.bio || hub.description || t("hubs.card.no_description")}
                </p>

                {hub.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {hub.tags.slice(0, 3).map((tag) => (
                      <Tag key={tag} label={tag} href={`${base}?tag=${encodeURIComponent(tag)}`} />
                    ))}
                  </div>
                ) : null}

                <a href={deepLink(hub.hub_url, hub.invite_code)} className="mt-auto pt-1 font-mono text-xs">
                  {t("hubs.card.open")}
                </a>
              </article>
            ))}
          </div>
        )}

        <div className="mt-3 flex items-center gap-6 rounded-[14px] border border-border bg-bg-sunken px-6 py-6 max-sm:flex-col max-sm:items-start">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-lg font-semibold tracking-[-0.3px]">{t("hubs.cta.title")}</h2>
            <p className="max-w-[480px] text-sm leading-relaxed text-text-muted">{t("hubs.cta.body")}</p>
          </div>
          <Link
            href={DOCS.operatorGuide}
            className="shrink-0 rounded-full border border-border-strong px-5 py-2.5 text-sm font-medium text-text transition-colors hover:border-text-muted hover:text-text sm:ml-auto"
          >
            {t("hubs.cta.button")}
          </Link>
        </div>
      </RailLayout>
    </>
  );
}
