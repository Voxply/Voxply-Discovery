import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getHub } from "@/lib/db";
import { languageName } from "@/lib/facets";
import { deepLink, GITHUB } from "@/lib/links";
import { CopyButton } from "@/components/CopyButton";
import { Avatar, MetaRow, Note, SectionLabel, Tag, VerifiedBadge } from "@/components/ui";
import { getDictionary } from "@/i18n";
import { isLocale, type Locale } from "@/i18n/config";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; pubkey: string }>;
}): Promise<Metadata> {
  const { pubkey } = await params;
  const hub = getHub(pubkey);
  if (!hub) return { title: "Hub" };
  return { title: hub.name, description: hub.bio || hub.description || undefined };
}

function Badge({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex h-[26px] items-center gap-1.5 rounded-full border border-border bg-surface px-2.5">
      {icon}
      <span className="font-mono text-[11px] text-text-muted">{children}</span>
    </span>
  );
}

export default async function HubDetailPage({
  params,
}: {
  params: Promise<{ locale: string; pubkey: string }>;
}) {
  const { locale: rawLocale, pubkey } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "en";
  const t = getDictionary(locale);
  const hubsBase = `/${locale}/hubs`;

  const hub = getHub(pubkey);
  if (!hub) notFound();

  const wavvonUrl = deepLink(hub.hub_url, hub.invite_code);
  const reportUrl = `${GITHUB.discovery}/issues/new?title=${encodeURIComponent(
    t("hub.report.subject", { name: hub.name })
  )}&body=${encodeURIComponent(`Hub: ${hub.hub_url}\nKey: ${hub.hub_pubkey}\n\n`)}`;

  return (
    <>
      <section className="px-12 pt-7 max-sm:px-6">
        <div className="mx-auto flex max-w-[1200px] items-center gap-2 font-mono text-xs text-text-faint">
          <Link href={hubsBase} className="text-text-muted">
            {t("nav.hubs").toLowerCase()}
          </Link>
          <span>/</span>
          <span>{hub.name}</span>
        </div>
      </section>

      <section className="border-b border-border px-12 pt-7 pb-9 max-sm:px-6">
        <div className="mx-auto flex max-w-[1200px] items-start gap-[22px] max-sm:flex-col">
          <Avatar name={hub.name} icon={hub.icon} size={84} accent />
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <h1 className="text-[38px] leading-[1.1] font-bold tracking-[-1.1px] max-sm:text-3xl">
              {hub.name}
            </h1>

            <div className="flex flex-wrap items-center gap-2">
              <Badge icon={null}>{languageName(hub.language)}</Badge>
              <Badge
                icon={
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={hub.invite_only ? "var(--warning)" : "var(--success)"}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
                    <rect x="4" y="10.5" width="16" height="10" rx="2" />
                  </svg>
                }
              >
                {hub.invite_only ? t("hubs.access.invite") : t("hubs.access.open")}
              </Badge>
              <Badge
                icon={
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--info)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M12 3.2 4.5 6.2v5.4c0 4.6 3.1 8.1 7.5 9.2 4.4-1.1 7.5-4.6 7.5-9.2V6.2z" />
                  </svg>
                }
              >
                {t("hub.badge.security", { level: hub.min_security_level })}
              </Badge>
            </div>

            <div className="flex items-center gap-2.5 font-mono text-[13px] text-text-muted">
              <span className="truncate">{hub.hub_url}</span>
              <CopyButton value={hub.hub_url} label={t("ui.copy")} copiedLabel={t("ui.copied")} />
            </div>
          </div>
        </div>
      </section>

      <section className="flex-1 px-12 pt-10 pb-20 max-sm:px-6">
        <div className="mx-auto grid max-w-[1200px] grid-cols-[minmax(0,1fr)_340px] items-start gap-10 max-lg:grid-cols-1">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-3">
              <SectionLabel>{t("hub.about")}</SectionLabel>
              {hub.description ? (
                <p className="text-[17px] leading-relaxed text-pretty">{hub.description}</p>
              ) : null}
              {hub.bio ? (
                <p className="text-[15px] leading-[1.7] whitespace-pre-line text-text-muted text-pretty">
                  {hub.bio}
                </p>
              ) : null}
              {!hub.description && !hub.bio ? (
                <p className="text-[15px] text-text-faint">{t("hub.no_description")}</p>
              ) : null}
            </div>

            {hub.tags.length > 0 ? (
              <div className="flex flex-col gap-3">
                <SectionLabel>{t("hub.tags")}</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {hub.tags.map((tag) => (
                    <Tag key={tag} label={tag} href={`${hubsBase}?tag=${encodeURIComponent(tag)}`} />
                  ))}
                </div>
              </div>
            ) : null}

            <Note>{t("hub.note")}</Note>
          </div>

          <aside className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 rounded-xl border border-accent-border bg-bg-elevated p-5">
              <a
                href={wavvonUrl}
                className="flex items-center justify-center gap-2 rounded-full bg-accent py-3.5 text-sm font-semibold text-accent-text transition-colors hover:bg-accent-hover hover:text-accent-text"
              >
                {t("hub.open_in_wavvon")}
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M6 18 18 6M9.5 6H18v8.5" />
                </svg>
              </a>
              <p className="text-center font-mono text-[11px] break-all text-text-faint">{wavvonUrl}</p>

              <div className="flex items-center gap-2.5 py-1">
                <span className="h-px flex-1 bg-border" />
                <span className="font-mono text-[10px] tracking-[1.2px] text-text-ghost uppercase">
                  {t("hub.no_app")}
                </span>
                <span className="h-px flex-1 bg-border" />
              </div>

              <a
                href={hub.hub_url}
                rel="noreferrer"
                className="flex items-center justify-center rounded-full border border-border-strong py-3 text-[13px] font-medium text-text transition-colors hover:border-text-muted hover:text-text"
              >
                {t("hub.open_browser")}
              </a>
              <p className="text-center text-xs leading-relaxed text-text-faint">{t("hub.browser_note")}</p>
            </div>

            <div className="flex flex-col gap-3.5 rounded-xl border border-border bg-bg-elevated p-5">
              <SectionLabel>{t("hub.listing")}</SectionLabel>
              <div className="flex flex-col gap-1.5">
                <span className="font-mono text-[11px] tracking-[0.6px] text-text-faint uppercase">
                  {t("hub.pubkey")}
                </span>
                <div className="flex items-start gap-2">
                  <span className="font-mono text-[11px] leading-relaxed break-all text-text-muted">
                    {hub.hub_pubkey}
                  </span>
                  <CopyButton value={hub.hub_pubkey} label="" copiedLabel={t("ui.copied")} />
                </div>
              </div>
              <VerifiedBadge label={t("ui.verified")} />
              <MetaRow label={t("hub.first_listed")}>{hub.listed_at.slice(0, 10)}</MetaRow>
              <MetaRow label={t("hub.last_published")}>{hub.last_verified_at.slice(0, 10)}</MetaRow>
            </div>

            <div className="flex flex-col gap-2.5 rounded-xl border border-border bg-bg-elevated p-5">
              <SectionLabel>{t("hub.wrong.title")}</SectionLabel>
              <p className="text-[13px] leading-relaxed text-text-muted">{t("hub.wrong.body")}</p>
              <a
                href={reportUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded border border-border py-2.5 text-xs font-medium text-text-muted transition-colors hover:border-border-strong hover:text-text"
              >
                {t("ui.report_broken")}
              </a>
            </div>

            <p className="px-0.5 text-xs leading-relaxed text-text-faint">{t("hub.no_power")}</p>
          </aside>
        </div>
      </section>
    </>
  );
}
