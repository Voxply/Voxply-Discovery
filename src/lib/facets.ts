/* Facets come in two kinds, and the difference decides the control.
 *
 * CLOSED sets are finite and known here — platforms, the feature list. They
 * render as a plain checkbox list, and a listing that names something outside
 * the set is rejected rather than silently widening it.
 *
 * OPEN sets are whatever publishers declare — tags, interface languages. They
 * render as a searchable list with a count and a "show all" expander, because
 * the design has to survive the fortieth entry as well as the fourth. */

export const CLIENT_PLATFORMS = [
  "web",
  "windows",
  "macos",
  "linux",
  "android",
  "ios",
  "terminal",
] as const;

export type ClientPlatform = (typeof CLIENT_PLATFORMS)[number];

export const PLATFORM_LABELS: Record<ClientPlatform, string> = {
  web: "Web",
  windows: "Windows",
  macos: "macOS",
  linux: "Linux",
  android: "Android",
  ios: "iOS",
  terminal: "Terminal",
};

/** User-facing capabilities a client may implement, in display order. */
export const CLIENT_FEATURES = [
  "text",
  "voice",
  "screenshare",
  "video",
  "encrypted-dms",
  "alliances",
  "bots",
  "attachments",
  "games",
  "pairing",
  "recovery",
] as const;

export type ClientFeature = (typeof CLIENT_FEATURES)[number];

export const FEATURE_LABELS: Record<ClientFeature, string> = {
  text: "Text channels",
  voice: "Voice",
  screenshare: "Screen share",
  video: "Webcam video",
  "encrypted-dms": "End-to-end encrypted DMs",
  alliances: "Alliance channels",
  bots: "Bots",
  attachments: "Attachments",
  games: "Games",
  pairing: "Multi-device pairing",
  recovery: "Recovery phrase",
};

/** The handful of features worth offering as a browse filter. */
export const FILTERABLE_FEATURES: ClientFeature[] = [
  "voice",
  "encrypted-dms",
  "screenshare",
  "alliances",
  "games",
];

export function isClientPlatform(value: string): value is ClientPlatform {
  return (CLIENT_PLATFORMS as readonly string[]).includes(value);
}

export function isClientFeature(value: string): value is ClientFeature {
  return (CLIENT_FEATURES as readonly string[]).includes(value);
}

/* Language display names.
 *
 * `Intl.DisplayNames` knows every BCP-47 tag, so nothing here is a whitelist —
 * a client declaring `fi` gets "suomi" without this file changing. The map is
 * only a fallback for runtimes that answer with the raw tag. */
const FALLBACK_LANGUAGE_NAMES: Record<string, string> = {
  de: "Deutsch",
  en: "English",
  es: "Español",
  fr: "Français",
  it: "Italiano",
  ja: "日本語",
  pt: "Português",
};

export function languageName(tag: string): string {
  try {
    // Endonyms: a French speaker scanning the list looks for "Français".
    const name = new Intl.DisplayNames([tag], { type: "language" }).of(tag);
    if (name && name.toLowerCase() !== tag.toLowerCase()) return name;
  } catch {
    // Unknown or malformed tag — fall through.
  }
  return FALLBACK_LANGUAGE_NAMES[tag] ?? tag.toUpperCase();
}

/* Bot capabilities.
 *
 * A closed set, and deliberately so: the detail page shows what a bot did NOT
 * ask for as well as what it did, which only means something if the full list
 * is known here rather than inferred from whatever the listing happens to
 * mention. */
export const BOT_CAPABILITIES = [
  "commands",
  "post-messages",
  "read-messages",
  "post-media",
  "moderate",
  "mini-apps",
] as const;

export type BotCapability = (typeof BOT_CAPABILITIES)[number];

export const BOT_CAPABILITY_LABELS: Record<BotCapability, string> = {
  commands: "Slash commands",
  "post-messages": "Post messages",
  "read-messages": "Read messages",
  "post-media": "Post media",
  moderate: "Moderate",
  "mini-apps": "Mini-apps",
};

export const BOT_CAPABILITY_MEANINGS: Record<BotCapability, string> = {
  commands: "Registers its commands in the channels you add it to.",
  "post-messages": "Writes into the channels you add it to.",
  "read-messages": "Sees the conversation, not only the commands aimed at it.",
  "post-media": "Uploads images and files.",
  moderate: "Can time out, kick or ban, within the roles you give it.",
  "mini-apps": "Opens an embedded view inside the client.",
};

export function isBotCapability(value: string): value is BotCapability {
  return (BOT_CAPABILITIES as readonly string[]).includes(value);
}
