import Link from "next/link";
import type { Metadata } from "next";
import { countFreeTier, countProviders, listProviders } from "@/lib/providers";
import { DOCS, GITHUB } from "@/lib/links";
import { Avatar, Note, PageIntro } from "@/components/ui";
import { getDictionary } from "@/i18n";
import { isLocale, type Locale } from "@/i18n/config";
import { ClosedFacet, hasAnyFilter, type Params, RailLayout, ResetFilters } from "@/components/Facets";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = getDictionary(isLocale(locale) ? locale : "en");
  return { title: t("providers.title"), description: t("providers.intro") };
}

export default async function ProvidersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Params>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "en";
  const t = getDictionary(locale);
  const base = `/${locale}/providers`;

  const query = await searchParams;
  const raw = query.offer;
  const offer = raw === undefined ? [] : Array.isArray(raw) ? raw : [raw];

  const providers = listProviders({ freeTier: offer.includes("free") });
  const total = countProviders();
  const filtered = hasAnyFilter(query, ["offer"]);

  return (
    <>
      <PageIntro title={t("providers.title")}>{t("providers.intro")}</PageIntro>

      <RailLayout
        rail={
          <>
            <ClosedFacet
              title={t("providers.facet.offer")}
              first
              options={[{ value: "free", label: t("providers.offer.free"), count: countFreeTier() }]}
              paramKey="offer"
              basePath={base}
              params={query}
            />
            {filtered ? <ResetFilters href={base} t={t} /> : null}

            <div className="flex flex-col gap-2.5 border-t border-border pt-[22px]">
              <span className="font-mono text-[11px] font-medium tracking-[1.4px] text-text-faint uppercase">
                {t("providers.how.title")}
              </span>
              <p className="text-xs leading-relaxed text-text-faint">{t("providers.how.body")}</p>
              <a
                href={`${GITHUB.discovery}/blob/develop/src/data/providers.json`}
                rel="noreferrer"
                className="font-mono text-xs"
              >
                {t("providers.how.suggest")}
              </a>
            </div>
          </>
        }
      >
        <div className="flex items-baseline gap-2.5">
          <span className="font-mono text-[13px] text-text">{providers.length}</span>
          <span className="text-[13px] text-text-faint">
            {filtered
              ? t("providers.count.matching", { total })
              : providers.length === 1
                ? t("providers.count_one")
                : t("providers.count_other")}
          </span>
          {filtered ? (
            <Link href={base} className="ml-auto font-mono text-xs">
              {t("ui.show_all")} &rarr;
            </Link>
          ) : null}
        </div>

        {providers.length === 0 ? (
          <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-border-strong bg-bg-elevated p-8">
            <span className="font-mono text-[32px] leading-none font-medium text-text-ghost">0</span>
            <p className="max-w-[560px] text-sm leading-relaxed text-text-muted">
              {filtered ? t("providers.empty.filtered") : t("providers.empty.none")}
            </p>
            <Link href={filtered ? base : DOCS.operatorGuide} className="font-mono text-xs">
              {filtered ? t("providers.empty.clear") : t("providers.empty.guide")}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-[18px] max-md:grid-cols-1">
            {providers.map((provider) => (
              <article
                key={provider.url}
                className="flex flex-col gap-3.5 rounded-[14px] border border-border bg-bg-elevated p-[22px] transition-colors hover:border-border-strong"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={provider.name} />
                  <a
                    href={provider.url}
                    rel="noreferrer nofollow"
                    className="min-w-0 text-base font-semibold text-text hover:text-accent"
                  >
                    {provider.name}
                  </a>
                  {provider.freeTier ? (
                    <span className="ml-auto shrink-0 rounded-full border border-success-border bg-success-bg px-2.5 py-0.5 font-mono text-[10px] tracking-[0.6px] text-success uppercase">
                      {t("providers.card.free_tier")}
                    </span>
                  ) : null}
                </div>

                <p className="text-sm leading-relaxed text-text-muted">{provider.description}</p>

                {provider.pricing || provider.regions?.length ? (
                  <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-text-faint">
                    {provider.pricing ? <span>{provider.pricing}</span> : null}
                    {provider.pricing && provider.regions?.length ? (
                      <span className="h-[3px] w-[3px] rounded-full bg-border" />
                    ) : null}
                    {provider.regions?.length ? <span>{provider.regions.join(" · ")}</span> : null}
                  </div>
                ) : null}

                <a
                  href={provider.url}
                  rel="noreferrer nofollow"
                  className="mt-auto pt-1 font-mono text-xs"
                >
                  {t("providers.card.visit")}
                </a>
              </article>
            ))}
          </div>
        )}

        <Note>{t("providers.note")}</Note>

        <div className="mt-1 flex items-center gap-6 rounded-[14px] border border-border bg-bg-sunken px-6 py-6 max-sm:flex-col max-sm:items-start">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-lg font-semibold tracking-[-0.3px]">{t("providers.cta.title")}</h2>
            <p className="max-w-[480px] text-sm leading-relaxed text-text-muted">
              {t("providers.cta.body_before")}{" "}
              <span className="font-mono">{t("providers.cta.command")}</span>{" "}
              {t("providers.cta.body_after")}
            </p>
          </div>
          <Link
            href={DOCS.operatorGuide}
            className="shrink-0 rounded-full border border-border-strong px-5 py-2.5 text-sm font-medium text-text transition-colors hover:border-text-muted hover:text-text sm:ml-auto"
          >
            {t("providers.cta.button")}
          </Link>
        </div>
      </RailLayout>
    </>
  );
}
