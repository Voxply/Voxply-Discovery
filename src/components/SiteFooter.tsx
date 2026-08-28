import Link from "next/link";
import { Mark } from "./Mark";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { DOCS, GITHUB } from "@/lib/links";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";

export function SiteFooter({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const home = `/${locale}`;

  const columns = [
    {
      title: t("footer.col.project"),
      links: [
        { label: t("footer.about"), href: DOCS.readme },
        { label: t("footer.architecture"), href: DOCS.architecture },
        { label: t("footer.comparison"), href: DOCS.comparison },
        { label: t("footer.roadmap"), href: DOCS.roadmap },
      ],
    },
    {
      title: t("footer.col.directory"),
      links: [
        { label: t("nav.hubs"), href: `${home}/hubs` },
        { label: t("nav.clients"), href: `${home}/clients` },
        { label: t("nav.bots"), href: `${home}/bots` },
        { label: t("nav.providers"), href: `${home}/providers` },
        { label: t("footer.run_own_directory"), href: GITHUB.discovery },
      ],
    },
    {
      title: t("footer.col.build"),
      links: [
        { label: t("footer.protocol_spec"), href: DOCS.openapi },
        { label: t("footer.write_client"), href: DOCS.client },
        { label: t("footer.write_bot"), href: DOCS.bots },
        { label: t("footer.wire_format"), href: DOCS.wireFormat },
      ],
    },
    {
      title: t("footer.col.operate"),
      links: [
        { label: t("footer.operator_guide"), href: DOCS.operatorGuide },
        { label: t("footer.hub_scaling"), href: DOCS.hubScaling },
        { label: t("footer.security_policy"), href: GITHUB.security },
        { label: t("footer.source"), href: GITHUB.org },
      ],
    },
  ];

  return (
    <footer className="mt-auto border-t border-border bg-bg-sunken px-12 pt-14 pb-8 max-sm:px-6">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-11">
        <div className="grid grid-cols-[1.6fr_repeat(4,minmax(0,1fr))] gap-8 max-lg:grid-cols-2 max-sm:grid-cols-1">
          <div className="flex flex-col gap-3.5">
            <div className="flex items-center gap-2.5">
              <Mark size={22} />
              <span className="font-mono text-base font-bold tracking-[0.5px] text-text">wavvon</span>
            </div>
            <p className="max-w-[260px] text-[13px] leading-relaxed text-text-faint">
              {t("footer.tagline")}
            </p>
          </div>

          {columns.map((column) => (
            <div key={column.title} className="flex flex-col gap-3">
              <span className="font-mono text-[11px] font-medium tracking-[1.4px] text-text-faint uppercase">
                {column.title}
              </span>
              {column.links.map(({ label, href }) => (
                <Link
                  key={label}
                  href={href}
                  className="text-sm text-text-muted transition-colors hover:text-text"
                >
                  {label}
                </Link>
              ))}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-6 border-t border-border pt-7 max-sm:flex-col max-sm:items-start max-sm:gap-3">
          <span className="font-mono text-xs text-text-ghost">{t("footer.licence")}</span>
          <LocaleSwitcher locale={locale} label={t("footer.language")} />
          <span className="font-mono text-xs text-text-ghost sm:ml-auto">{t("footer.optional")}</span>
        </div>
      </div>
    </footer>
  );
}
