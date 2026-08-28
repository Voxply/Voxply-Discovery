#!/usr/bin/env node
/* Every locale must define every key English defines.
 *
 * A missing key falls back to English at runtime, so a gap is invisible in
 * testing and shows up as one English sentence in the middle of an Italian
 * page. This turns that into a failed build. Extra keys are reported too:
 * they are dead weight, and usually the sign of a key renamed on one side. */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const DIR = "src/i18n/locales";
const REFERENCE = "en";

const load = (name) => JSON.parse(readFileSync(join(DIR, `${name}.json`), "utf8"));

const reference = load(REFERENCE);
const referenceKeys = Object.keys(reference);
const locales = readdirSync(DIR)
  .filter((f) => f.endsWith(".json"))
  .map((f) => f.replace(/\.json$/, ""))
  .filter((l) => l !== REFERENCE);

let failed = false;

for (const locale of locales) {
  const strings = load(locale);
  const keys = new Set(Object.keys(strings));
  const missing = referenceKeys.filter((k) => !keys.has(k));
  const extra = [...keys].filter((k) => !(k in reference));
  const untranslated = referenceKeys.filter(
    (k) => keys.has(k) && strings[k] === reference[k] && reference[k].length > 24
  );

  if (missing.length || extra.length) {
    failed = true;
    console.error(`\n${locale}: ${missing.length} missing, ${extra.length} extra`);
    for (const k of missing.slice(0, 20)) console.error(`  missing  ${k}`);
    for (const k of extra.slice(0, 20)) console.error(`  extra    ${k}`);
    if (missing.length > 20 || extra.length > 20) console.error("  …");
  } else {
    console.log(`${locale}: complete (${referenceKeys.length} keys)`);
  }

  // Not a failure: a short label can legitimately be identical across
  // languages. A long sentence that is identical is almost always a copy.
  if (untranslated.length) {
    console.warn(`${locale}: ${untranslated.length} long string(s) identical to English`);
    for (const k of untranslated.slice(0, 5)) console.warn(`  same as en  ${k}`);
  }
}

if (failed) process.exit(1);
console.log(`\nAll ${locales.length + 1} locales complete.`);
