import en from "./locales/en.json";
import de from "./locales/de.json";
import es from "./locales/es.json";
import fr from "./locales/fr.json";
import it from "./locales/it.json";
import pt from "./locales/pt.json";
import { DEFAULT_LOCALE, type Locale } from "./config";

/* Translation, in about forty lines.
 *
 * Flat dotted keys, the same convention `packages/i18n` uses in the clients
 * repo — so a translator moving between the two meets one format. No library:
 * every page here is a server component, so there is no provider to mount, no
 * context to hydrate, and nothing to send to the browser.
 *
 * A missing key falls back to English rather than rendering the key itself.
 * The reader gets a sentence in the wrong language, which is recoverable; a
 * page reading `hubs.intro` is not. `check-i18n` makes sure it cannot happen
 * anyway. */

const DICTIONARIES: Record<Locale, Record<string, string>> = { en, de, es, fr, it, pt };

export type Dictionary = ReturnType<typeof getDictionary>;

export function getDictionary(locale: Locale) {
  const strings = DICTIONARIES[locale] ?? DICTIONARIES[DEFAULT_LOCALE];
  const fallback = DICTIONARIES[DEFAULT_LOCALE];

  /**
   * Look up `key`, substituting `{name}` placeholders.
   *
   * Counts and names are interpolated rather than concatenated so a translator
   * can move them: "3 hubs listed" and "3 hub elencati" put the number in the
   * same place, but plenty of languages do not.
   */
  return function t(key: string, params?: Record<string, string | number>): string {
    const template = strings[key] ?? fallback[key] ?? key;
    if (!params) return template;
    return template.replace(/\{(\w+)\}/g, (whole, name: string) =>
      name in params ? String(params[name]) : whole
    );
  };
}

/** The keys English defines — what `check-i18n` measures every locale against. */
export function englishKeys(): string[] {
  return Object.keys(en);
}
