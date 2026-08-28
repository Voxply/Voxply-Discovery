"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isLocale, LOCALE_NAMES, LOCALES, type Locale } from "@/i18n/config";

/**
 * Swaps the locale segment of whatever path the reader is on, so switching
 * language keeps them on the page they were reading rather than sending them
 * home.
 *
 * Filters are not carried across: reading the query would mean
 * `useSearchParams`, which forces every statically prerendered page — all
 * fifty-six documentation pages — behind a Suspense boundary, to keep a
 * `?tag=` through a language switch.
 */
export function LocaleSwitcher({ locale, label }: { locale: Locale; label: string }) {
  const pathname = usePathname();

  function pathFor(target: Locale): string {
    const segments = pathname.split("/");
    if (isLocale(segments[1])) {
      segments[1] = target;
      return segments.join("/");
    }
    return `/${target}${pathname}`;
  }

  return (
    <nav aria-label={label} className="flex items-center gap-2">
      <span className="font-mono text-[11px] tracking-[1.4px] text-text-faint uppercase">{label}</span>
      {LOCALES.map((option) => (
        <Link
          key={option}
          href={pathFor(option)}
          hrefLang={option}
          aria-current={option === locale ? "true" : undefined}
          className={
            option === locale
              ? "font-mono text-xs text-text"
              : "font-mono text-xs text-text-muted transition-colors hover:text-text"
          }
        >
          {LOCALE_NAMES[option]}
        </Link>
      ))}
    </nav>
  );
}
