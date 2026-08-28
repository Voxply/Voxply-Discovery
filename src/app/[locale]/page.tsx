import Link from "next/link";
import { listBots, listHubs } from "@/lib/db";
import { countClients } from "@/lib/clients-db";
import { PillLink } from "@/components/ui";
import { DOCS } from "@/lib/links";
import { getDictionary } from "@/i18n";
import { isLocale } from "@/i18n/config";

export const dynamic = "force-dynamic";

const FEATURE_ICONS = {
  voice: (
    <>
      <path d="M3 12.5v-1M7 13V8M11 13V4.5M15 13V6.5M19 13v-3" />
      <path d="M4 17h16M8 20h8" />
    </>
  ),
  dms: (
    <>
      <rect x="4" y="10.5" width="16" height="10" rx="2.4" />
      <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
    </>
  ),
  federation: (
    <>
      <circle cx="6" cy="7" r="2.6" />
      <circle cx="18" cy="7" r="2.6" />
      <circle cx="12" cy="17.5" r="2.6" />
      <path d="M8.4 8.4 10.6 15.4M15.6 8.4 13.4 15.4M8.6 7h6.8" />
    </>
  ),
  identity: (
    <>
      <circle cx="8.5" cy="12" r="4" />
      <path d="M12.5 12H21M17.5 12v3.5M20 12v2.5" />
    </>
  ),
} as const;

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : "en";
  const t = getDictionary(locale);
  const home = `/${locale}`;

  const counts = [
    { value: listHubs({}).total, label: t("home.counts.hubs"), href: `${home}/hubs` },
    { value: countClients(), label: t("home.counts.clients"), href: `${home}/clients` },
    { value: listBots({}).length, label: t("home.counts.bots"), href: `${home}/bots` },
  ];

  const guarantees = [
    { ok: true, key: "data" },
    { ok: true, key: "protocol" },
    { ok: true, key: "licence" },
    { ok: false, key: "young" },
  ] as const;

  const starts = [
    { key: "join", href: `${home}/hubs`, aside: `${home}/clients`, primary: true },
    { key: "host", href: DOCS.operatorGuide, aside: `${home}/providers`, primary: false },
    { key: "build", href: DOCS.openapi, aside: `${home}/clients`, primary: false },
  ] as const;

  return (
    <>
      <section className="px-12 pt-28 pb-22 max-sm:px-6 max-sm:pt-16">
        <div className="mx-auto flex max-w-[900px] flex-col items-center gap-6 text-center">
          <h1 className="text-[62px] leading-[1.06] font-bold tracking-[-2.2px] text-pretty max-md:text-[42px] max-md:tracking-[-1.4px]">
            {t("home.hero.title")}
          </h1>
          <p className="max-w-[660px] text-xl leading-relaxed text-text-muted text-pretty max-md:text-lg">
            {t("home.hero.body")}
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2.5">
            <PillLink href={`${home}/hubs`}>{t("home.hero.find")}</PillLink>
            <PillLink href={DOCS.operatorGuide} variant="secondary">
              {t("home.hero.host")}
            </PillLink>
          </div>
          <p className="pt-1.5 font-mono text-xs text-text-faint">{t("home.hero.meta")}</p>
        </div>
      </section>

      <section className="px-12 max-sm:px-6">
        <div className="mx-auto grid max-w-[1200px] grid-cols-3 overflow-hidden rounded-2xl border border-border bg-bg-elevated max-sm:grid-cols-1">
          {counts.map(({ value, label, href }) => (
            <Link
              key={label}
              href={href}
              className="flex flex-col items-center gap-1.5 border-border px-5 py-8 transition-colors hover:bg-surface not-last:border-r max-sm:not-last:border-r-0 max-sm:not-last:border-b"
            >
              <span className="font-mono text-[38px] leading-none font-medium text-accent">{value}</span>
              <span className="text-sm text-text-muted">{label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="px-12 py-24 max-sm:px-6">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-12">
          <div className="flex flex-col items-center gap-3.5 text-center">
            <h2 className="text-[40px] leading-[1.1] font-bold tracking-[-1.3px] max-md:text-3xl">
              {t("home.what.title")}
            </h2>
            <p className="max-w-[640px] text-[17px] leading-relaxed text-text-muted text-pretty">
              {t("home.what.body")}
            </p>
          </div>

          <div className="grid grid-cols-4 gap-5 max-lg:grid-cols-2 max-sm:grid-cols-1">
            {(Object.keys(FEATURE_ICONS) as Array<keyof typeof FEATURE_ICONS>).map((key) => (
              <div key={key} className="flex flex-col gap-3.5">
                <span className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-accent-sunken">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    {FEATURE_ICONS[key]}
                  </svg>
                </span>
                <h3 className="text-lg font-semibold tracking-[-0.3px]">
                  {t(`home.feature.${key}.title`)}
                </h3>
                <p className="text-sm leading-relaxed text-text-muted">{t(`home.feature.${key}.body`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-bg-sunken px-12 py-24 max-sm:px-6">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-11">
          <h2 className="text-center text-[40px] leading-[1.1] font-bold tracking-[-1.3px] max-md:text-3xl">
            {t("home.start.title")}
          </h2>

          <div className="grid grid-cols-3 gap-5 max-lg:grid-cols-1">
            {starts.map((card) => (
              <article
                key={card.key}
                className="flex flex-col gap-4 rounded-2xl border border-border bg-bg-elevated p-7"
              >
                <span className="font-mono text-[11px] font-medium tracking-[1.6px] text-accent uppercase">
                  {t(`home.start.${card.key}.eyebrow`)}
                </span>
                <h3 className="text-[23px] font-semibold tracking-[-0.5px]">
                  {t(`home.start.${card.key}.title`)}
                </h3>
                <p className="text-[15px] leading-relaxed text-text-muted">
                  {t(`home.start.${card.key}.body`)}
                </p>
                <div className="mt-auto flex flex-col gap-2.5 pt-1.5">
                  <Link
                    href={card.href}
                    className={
                      card.primary
                        ? "rounded-full bg-accent py-3 text-center text-sm font-semibold text-accent-text transition-colors hover:bg-accent-hover hover:text-accent-text"
                        : "rounded-full border border-border-strong py-3 text-center text-sm font-medium text-text transition-colors hover:border-text-muted hover:text-text"
                    }
                  >
                    {t(`home.start.${card.key}.cta`)}
                  </Link>
                  <Link
                    href={card.aside}
                    className="text-center text-[13px] text-text-muted hover:text-text"
                  >
                    {t(`home.start.${card.key}.aside`)}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-12 py-24 max-sm:px-6">
        <div className="mx-auto grid max-w-[1200px] grid-cols-2 items-start gap-18 max-lg:grid-cols-1 max-lg:gap-10">
          <div className="flex flex-col gap-5">
            <h2 className="text-[40px] leading-[1.1] font-bold tracking-[-1.3px] text-pretty max-md:text-3xl">
              {t("home.noserver.title")}
            </h2>
            <p className="text-base leading-[1.75] text-text-muted text-pretty">
              {t("home.noserver.body1")}
            </p>
            <p className="text-base leading-[1.75] text-text-muted text-pretty">
              {t("home.noserver.body2")}
            </p>
            <Link href={DOCS.architecture} className="pt-1 text-[15px] font-medium">
              {t("home.noserver.link")}
            </Link>
          </div>

          <div className="flex flex-col overflow-hidden rounded-2xl border border-border">
            {guarantees.map((item) => (
              <div
                key={item.key}
                className="flex items-start gap-3.5 p-[22px] not-last:border-b not-last:border-border"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={item.ok ? "var(--success)" : "var(--warning)"}
                  strokeWidth="2.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mt-[3px] shrink-0"
                  aria-hidden="true"
                >
                  {item.ok ? (
                    <path d="m5 12.5 4.5 4.5L19 7.5" />
                  ) : (
                    <>
                      <path d="M12 4.5 2.8 20h18.4z" />
                      <path d="M12 10v4M12 17.2v.2" />
                    </>
                  )}
                </svg>
                <div className="flex flex-col gap-1">
                  <span className="text-[15px] font-semibold">
                    {t(`home.guarantee.${item.key}.title`)}
                  </span>
                  <span className="text-sm leading-relaxed text-text-muted">
                    {t(`home.guarantee.${item.key}.body`)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-12 pb-24 max-sm:px-6">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-5 rounded-[20px] border border-accent-border bg-bg-elevated px-10 py-16 text-center max-sm:px-6">
          <h2 className="max-w-[640px] text-[38px] leading-[1.1] font-bold tracking-[-1.3px] text-pretty max-md:text-3xl">
            {t("home.cta.title")}
          </h2>
          <p className="max-w-[520px] text-base leading-relaxed text-text-muted text-pretty">
            {t("home.cta.body")}
          </p>
          <div className="pt-1.5">
            <PillLink href={`${home}/hubs`}>{t("home.hero.find")}</PillLink>
          </div>
        </div>
      </section>
    </>
  );
}
