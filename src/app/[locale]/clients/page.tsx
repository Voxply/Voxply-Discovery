import Link from "next/link";
import type { Metadata } from "next";
import { clientFacetCounts, countClients, listClients } from "@/lib/clients-db";
import { CLIENT_PLATFORMS, FILTERABLE_FEATURES, languageName } from "@/lib/facets";
import { DOCS } from "@/lib/links";
import { Avatar, Chip, EmptyState, PageIntro } from "@/components/ui";
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

const FILTER_KEYS = ["q", "platform", "language", "feature", "publisher"];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = getDictionary(isLocale(locale) ? locale : "en");
  return { title: t("clients.title"), description: t("clients.intro") };
}

function one(params: Params, key: string): string | undefined {
  const raw = params[key];
  return Array.isArray(raw) ? raw[0] : raw;
}

function many(params: Params, key: string): string[] {
  const raw = params[key];
  return raw === undefined ? [] : Array.isArray(raw) ? raw : [raw];
}

function LanguageLine({ tags, only }: { tags: string[]; only: (lang: string) => string }) {
  return (
    <div className="flex items-center gap-2 border-t border-border-hairline pt-2.5">
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--text-faint)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0"
        aria-hidden="true"
      >
        <path d="M4 6.5h9M8.5 6.5V4.5M10.6 6.5c0 3.6-2.6 6.4-6 7.6M6 9.6c.9 2 2.6 3.4 4.8 4.1" />
        <path d="m13 19.5 3.4-8 3.4 8M14.2 17h5.2" />
      </svg>
      <span className="font-mono text-[11px] text-text-muted">
        {tags.length === 1
          ? only(tags[0].toUpperCase())
          : tags.map((x) => x.toUpperCase()).join(" · ")}
      </span>
    </div>
  );
}

export default async function ClientsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Params>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "en";
  const t = getDictionary(locale);
  const base = `/${locale}/clients`;

  const query = await searchParams;
  const publisher = many(query, "publisher");
  const official = publisher.length === 1 ? publisher[0] === "official" : undefined;

  const clients = listClients({
    q: one(query, "q"),
    platform: many(query, "platform"),
    language: many(query, "language"),
    feature: many(query, "feature"),
    official,
  });

  const total = countClients();
  const platformCounts = clientFacetCounts("platforms");
  const languageCounts = clientFacetCounts("languages");
  const featureCounts = clientFacetCounts("features");
  const officialCount = listClients({ official: true }).length;
  const filtered = hasAnyFilter(query, FILTER_KEYS);

  const countOf = (rows: Array<{ value: string; count: number }>, value: string) =>
    rows.find((r) => r.value === value)?.count ?? 0;

  return (
    <>
      <PageIntro title={t("clients.title")}>{t("clients.intro")}</PageIntro>

      <RailLayout
        rail={
          <>
            <SearchBox
              name="q"
              placeholder={t("clients.search")}
              defaultValue={one(query, "q")}
              hidden={query}
            />

            <ClosedFacet
              title={t("clients.facet.platform")}
              first
              options={CLIENT_PLATFORMS.map((p) => ({
                value: p,
                label: t(`platform.${p}`),
                count: countOf(platformCounts, p),
              }))}
              paramKey="platform"
              basePath={base}
              params={query}
            />

            <OpenFacet
              title={t("clients.facet.language")}
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
              note={t("clients.facet.language_note")}
              t={t}
            />

            <ClosedFacet
              title={t("clients.facet.supports")}
              options={FILTERABLE_FEATURES.map((x) => ({
                value: x,
                label: t(`feature.${x}`),
                count: countOf(featureCounts, x),
              }))}
              paramKey="feature"
              basePath={base}
              params={query}
            />

            <ClosedFacet
              title={t("clients.facet.publisher")}
              options={[
                { value: "official", label: t("clients.publisher.official"), count: officialCount },
                {
                  value: "community",
                  label: t("clients.publisher.community"),
                  count: total - officialCount,
                },
              ]}
              paramKey="publisher"
              basePath={base}
              params={query}
            />

            {filtered ? <ResetFilters href={base} t={t} /> : null}
          </>
        }
      >
        <div className="flex items-baseline gap-2.5">
          <span className="font-mono text-[13px] text-text">{clients.length}</span>
          <span className="text-[13px] text-text-faint">
            {filtered
              ? t("clients.count.matching", { total })
              : clients.length === 1
                ? t("clients.count_one")
                : t("clients.count_other")}
          </span>
          {filtered ? (
            <Link href={base} className="ml-auto font-mono text-xs">
              {t("ui.show_all")} &rarr;
            </Link>
          ) : null}
        </div>

        {clients.length === 0 ? (
          <EmptyState title={filtered ? t("clients.empty.filtered") : t("clients.empty.none")}>
            <Link href={filtered ? base : DOCS.openapi} className="font-mono text-xs">
              {filtered ? t("clients.empty.clear") : t("clients.empty.spec")}
            </Link>
          </EmptyState>
        ) : (
          <div className="grid grid-cols-3 gap-[18px] max-xl:grid-cols-2 max-md:grid-cols-1">
            {clients.map((client) => (
              <article
                key={client.id}
                className="flex flex-col gap-3.5 rounded-[14px] border border-border bg-bg-elevated p-[22px] transition-colors hover:border-border-strong"
              >
                <div className="flex items-start gap-3">
                  <Avatar name={client.name} accent={client.official} />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <Link
                      href={`${base}/${client.id}`}
                      className="text-base font-semibold text-text hover:text-accent"
                    >
                      {client.name}
                    </Link>
                    <span
                      className={`font-mono text-[10px] tracking-[0.7px] uppercase ${
                        client.official ? "text-accent" : "text-text-faint"
                      }`}
                    >
                      {client.official
                        ? t("clients.card.official")
                        : client.maintainer || t("clients.card.community")}
                    </span>
                  </div>
                </div>

                <p className="line-clamp-3 text-sm leading-relaxed text-text-muted">{client.tagline}</p>

                <div className="mt-auto flex flex-wrap gap-1.5">
                  {client.platforms.map((platform) => (
                    <Chip key={platform} label={platform} />
                  ))}
                </div>

                {client.languages.length > 0 ? (
                  <LanguageLine
                    tags={client.languages}
                    only={(lang) => t("clients.card.language_only", { lang })}
                  />
                ) : null}
              </article>
            ))}
          </div>
        )}

        <div className="mt-3 flex items-center gap-6 rounded-[14px] border border-border bg-bg-sunken px-6 py-6 max-sm:flex-col max-sm:items-start">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-lg font-semibold tracking-[-0.3px]">{t("clients.cta.title")}</h2>
            <p className="max-w-[460px] text-sm leading-relaxed text-text-muted">{t("clients.cta.body")}</p>
          </div>
          <Link
            href={DOCS.hubDiscovery}
            className="shrink-0 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-text transition-colors hover:bg-accent-hover hover:text-accent-text sm:ml-auto"
          >
            {t("clients.cta.button")}
          </Link>
        </div>
      </RailLayout>
    </>
  );
}
