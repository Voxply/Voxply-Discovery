"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mark } from "./Mark";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n";

const NAV = ["hubs", "clients", "bots", "providers", "docs"] as const;

export function SiteHeader({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const t = getDictionary(locale);
  const home = `/${locale}`;

  return (
    <header className="flex h-[68px] items-center gap-9 border-b border-border px-12 max-sm:px-6">
      <Link href={home} className="flex items-center gap-[11px]">
        <Mark />
        <span className="font-mono text-[18px] font-bold tracking-[0.5px] text-text">wavvon</span>
      </Link>

      <nav className="ml-auto flex items-center gap-7 text-sm font-medium max-sm:gap-4 max-sm:text-[13px]">
        {NAV.map((key) => {
          const href = `${home}/${key}`;
          // `/en/hubs/<pubkey>` should still light up Hubs.
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={key}
              href={href}
              aria-current={active ? "page" : undefined}
              className={
                active
                  ? "border-b-2 border-accent pb-[3px] text-text"
                  : "text-text-dim transition-colors hover:text-text"
              }
            >
              {t(`nav.${key}`)}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
