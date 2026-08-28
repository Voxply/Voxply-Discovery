/* Which languages this directory speaks.
 *
 * Adding one is a file in `locales/` and a line here — no code. The check in
 * `scripts/check-i18n.mjs` then refuses a locale that is missing keys, because
 * a half-translated page is worse than an English one: the reader cannot tell
 * which half they are getting.
 *
 * Deliberately not tied to the four the clients ship. A directory is read by
 * people deciding whether to arrive; a client is used by people who already
 * did. The two lists can and should diverge. */

export const LOCALES = ["en", "it"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/** Endonyms — a reader scanning the switcher looks for their own word. */
export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  it: "Italiano",
};

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/**
 * Best match for an `Accept-Language` header, or the default.
 *
 * Deliberately crude: it reads the primary subtag and ignores q-weights, so
 * `it-CH` picks Italian and anything unknown lands on English. A directory
 * that guesses wrong costs a reader one click on the switcher.
 */
export function negotiateLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;
  for (const part of acceptLanguage.split(",")) {
    const tag = part.split(";")[0].trim().toLowerCase().split("-")[0];
    if (isLocale(tag)) return tag;
  }
  return DEFAULT_LOCALE;
}
