import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  allDocSlugs,
  DOC_SECTIONS,
  editUrl,
  fetchDoc,
  getDocEntry,
  neighbours,
  rawUrl,
  sectionOf,
} from "@/lib/docs";
import { renderMarkdown } from "@/lib/markdown";
import { GITHUB } from "@/lib/links";
import { Note } from "@/components/ui";
import { getDictionary, type Dictionary } from "@/i18n";
import { isLocale, LOCALES, type Locale } from "@/i18n/config";

export const revalidate = 3600;

export function generateStaticParams() {
  return LOCALES.flatMap((locale) => allDocSlugs().map((slug) => ({ locale, slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = getDictionary(isLocale(locale) ? locale : "en");
  return getDocEntry(slug) ? { title: t(`doc.${slug}`) } : { title: t("docs.not_found") };
}

function NavTree({ current, base, t }: { current: string; base: string; t: Dictionary }) {
  return (
    <>
      {DOC_SECTIONS.map((section) => (
        <div key={section.id} className="flex flex-col gap-[7px]">
          <span className="pb-[3px] font-mono text-[11px] font-medium tracking-[1.3px] text-text-faint uppercase">
            {t(`docs.section.${section.id}`)}
          </span>
          {section.entries.map((entry) => {
            const active = entry.slug === current;
            return (
              <Link
                key={entry.slug}
                href={`${base}/${entry.slug}`}
                aria-current={active ? "page" : undefined}
                className={
                  active
                    ? "-ml-px border-l-2 border-accent py-[5px] pl-[13px] text-sm font-medium text-text"
                    : "py-[5px] pl-3.5 text-sm text-text-muted hover:text-text"
                }
              >
                {t(`doc.${entry.slug}`)}
              </Link>
            );
          })}
          {section.id === "building" ? (
            <span className="flex items-center gap-2 py-[5px] pl-3.5 text-sm text-text-faint">
              {t("docs.libraries")}
              <span className="rounded-full border border-border px-1.5 py-px font-mono text-[9px] tracking-[0.6px] uppercase">
                {t("docs.libraries.soon")}
              </span>
            </span>
          ) : null}
        </div>
      ))}
    </>
  );
}

export default async function DocArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: rawLocale, slug } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "en";
  const t = getDictionary(locale);
  const base = `/${locale}/docs`;

  const entry = getDocEntry(slug);
  if (!entry) notFound();

  const source = await fetchDoc(entry);
  const doc = source ? renderMarkdown(source) : null;
  const section = sectionOf(slug);
  const { prev, next } = neighbours(slug);

  return (
    <div className="grid flex-1 grid-cols-[264px_minmax(0,1fr)_232px] max-xl:grid-cols-[264px_minmax(0,1fr)] max-lg:grid-cols-1">
      <aside className="flex flex-col gap-6 border-r border-border bg-[#0a0b0f] py-8 pr-6 pb-16 pl-12 max-lg:border-r-0 max-lg:border-b max-lg:px-12 max-sm:px-6">
        <Link href={base} className="font-mono text-xs text-text-muted hover:text-text">
          {t("docs.all_docs")}
        </Link>
        <NavTree current={slug} base={base} t={t} />
      </aside>

      <article className="min-w-0 px-14 pt-9 pb-18 max-md:px-6">
        <div className="flex max-w-[720px] flex-col">
          <div className="flex items-center gap-2 pb-[22px] font-mono text-xs text-text-faint">
            <Link href={base} className="text-text-muted">
              {t("docs.title").toLowerCase()}
            </Link>
            {section ? (
              <>
                <span>/</span>
                <span className="text-text-muted">
                  {t(`docs.section.${section.id}`).toLowerCase()}
                </span>
              </>
            ) : null}
            <span>/</span>
            <span>{t(`doc.${slug}`).toLowerCase()}</span>
          </div>

          <h1 className="pb-[18px] text-[42px] leading-[1.1] font-bold tracking-[-1.4px] max-sm:text-3xl">
            {doc?.title ?? t(`doc.${slug}`)}
          </h1>

          {doc ? (
            <div className="doc-prose" dangerouslySetInnerHTML={{ __html: doc.html }} />
          ) : (
            <Note tone="warning">
              {t("docs.fetch_failed.before")}{" "}
              <a href={rawUrl(entry)} rel="noreferrer">
                {t("docs.fetch_failed.link")}
              </a>
              .
            </Note>
          )}

          <div className="mt-8 flex items-center gap-4 border-t border-border pt-[22px] pb-7 max-sm:flex-col max-sm:items-start max-sm:gap-2">
            <span className="font-mono text-xs text-text-faint">
              {t("docs.source_line", { path: entry.path })}
            </span>
            <a href={editUrl(entry)} rel="noreferrer" className="font-mono text-xs sm:ml-auto">
              {t("docs.edit")}
            </a>
          </div>

          <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
            {prev ? (
              <Link
                href={`${base}/${prev.slug}`}
                className="flex flex-col gap-1.5 rounded-xl border border-border p-5 hover:border-border-strong"
              >
                <span className="font-mono text-[11px] tracking-[1px] text-text-faint uppercase">
                  {t("docs.previous")}
                </span>
                <span className="text-[15px] font-semibold text-text">{t(`doc.${prev.slug}`)}</span>
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link
                href={`${base}/${next.slug}`}
                className="flex flex-col items-end gap-1.5 rounded-xl border border-border p-5 text-right hover:border-border-strong"
              >
                <span className="font-mono text-[11px] tracking-[1px] text-text-faint uppercase">
                  {t("docs.next")}
                </span>
                <span className="text-[15px] font-semibold text-text">{t(`doc.${next.slug}`)}</span>
              </Link>
            ) : null}
          </div>
        </div>
      </article>

      <aside className="flex flex-col gap-3 border-l border-border py-9 pr-12 pb-16 pl-6 max-xl:hidden">
        {doc && doc.headings.length > 0 ? (
          <>
            <span className="font-mono text-[11px] font-medium tracking-[1.3px] text-text-faint uppercase">
              {t("docs.on_this_page")}
            </span>
            {doc.headings.map((heading) => (
              <a
                key={heading.id}
                href={`#${heading.id}`}
                className="py-[5px] pl-3.5 text-[13px] leading-relaxed text-text-muted hover:text-text"
              >
                {heading.text}
              </a>
            ))}
          </>
        ) : null}

        <div className="mt-4 flex flex-col gap-2.5 border-t border-border pt-[22px]">
          <span className="font-mono text-[11px] font-medium tracking-[1.3px] text-text-faint uppercase">
            {t("docs.elsewhere")}
          </span>
          <a href={GITHUB.docs} rel="noreferrer" className="text-[13px] text-text-muted hover:text-text">
            {t("docs.elsewhere.repo")}
          </a>
          <Link href={`/${locale}/hubs`} className="text-[13px] text-text-muted hover:text-text">
            {t("docs.elsewhere.hubs")}
          </Link>
          <Link href={`/${locale}/clients`} className="text-[13px] text-text-muted hover:text-text">
            {t("docs.elsewhere.clients")}
          </Link>
        </div>
      </aside>
    </div>
  );
}
