import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getBot } from "@/lib/db";
import {
  BOT_CAPABILITIES,
  BOT_CAPABILITY_LABELS,
  BOT_CAPABILITY_MEANINGS,
  type BotCapability,
} from "@/lib/facets";
import { DOCS, GITHUB } from "@/lib/links";
import { CopyButton } from "@/components/CopyButton";
import { Avatar, MetaRow, Note, SectionLabel, Tag, VerifiedBadge } from "@/components/ui";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pubkey: string }>;
}): Promise<Metadata> {
  const { pubkey } = await params;
  const bot = getBot(pubkey);
  if (!bot) return { title: "Bot not found" };
  return { title: bot.name, description: bot.description };
}

const INVITE_STEPS = [
  <>
    Open your hub, then <span className="font-mono text-text-dim">Settings → Bots</span>.
  </>,
  <>
    Paste the key into <span className="font-mono text-text-dim">Invite</span>.
  </>,
  <>Pick the channels it may see, and confirm.</>,
];

export default async function BotDetailPage({
  params,
}: {
  params: Promise<{ pubkey: string }>;
}) {
  const { pubkey } = await params;
  const bot = getBot(pubkey);
  if (!bot) notFound();

  const asked = new Set(bot.capabilities);
  const reportUrl = `${GITHUB.discovery}/issues/new?title=${encodeURIComponent(
    `Broken listing: ${bot.name}`
  )}&body=${encodeURIComponent(`Bot: ${bot.name}\nKey: ${bot.pubkey}\n\nWhat is wrong:\n`)}`;

  return (
    <>
      <section className="px-12 pt-7">
        <div className="mx-auto flex max-w-[1200px] items-center gap-2 font-mono text-xs text-text-faint">
          <Link href="/bots" className="text-text-muted">
            bots
          </Link>
          <span>/</span>
          <span>{bot.name}</span>
        </div>
      </section>

      <section className="border-b border-border px-12 pt-7 pb-9">
        <div className="mx-auto flex max-w-[1200px] items-start gap-[22px] max-sm:flex-col">
          <Avatar name={bot.name} size={84} accent />
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <h1 className="text-[38px] leading-[1.1] font-bold tracking-[-1.1px] max-sm:text-3xl">
              {bot.name}
            </h1>
            <p className="max-w-[640px] text-[17px] leading-relaxed text-text-muted text-pretty">
              {bot.description}
            </p>
            <div className="flex flex-wrap items-center gap-1.5">
              {bot.tags.map((tag) => (
                <Tag key={tag} label={tag} href={`/bots?tag=${encodeURIComponent(tag)}`} />
              ))}
              {bot.tags.length > 0 ? <span className="mx-1.5 h-[3px] w-[3px] rounded-full bg-border" /> : null}
              <span className="font-mono text-[11px] text-text-faint">
                {bot.commands.length} command{bot.commands.length === 1 ? "" : "s"} · updated{" "}
                {new Date(bot.updated_at).toISOString().slice(0, 10)}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="flex-1 px-12 pt-10 pb-20">
        <div className="mx-auto grid max-w-[1200px] grid-cols-[minmax(0,1fr)_340px] items-start gap-10 max-lg:grid-cols-1">
          <div className="flex flex-col gap-8">
            {bot.commands.length > 0 ? (
              <div className="flex flex-col gap-3">
                <SectionLabel>Commands</SectionLabel>
                <div className="overflow-hidden rounded-xl border border-border">
                  {bot.commands.map((command) => (
                    <div
                      key={command.name}
                      className="flex items-start gap-5 border-b border-border bg-bg-elevated px-5 py-4 last:border-b-0 max-sm:flex-col max-sm:gap-1"
                    >
                      <span className="w-[168px] shrink-0 font-mono text-[13px] text-accent">
                        {command.name}
                      </span>
                      <span className="text-sm leading-relaxed text-text-muted">
                        {command.description}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="flex flex-col gap-3">
              <div className="flex items-baseline gap-3">
                <SectionLabel>What it asks for</SectionLabel>
                <span className="ml-auto font-mono text-[11px] text-text-ghost">
                  you grant these per channel
                </span>
              </div>
              <div className="overflow-hidden rounded-xl border border-border">
                {BOT_CAPABILITIES.map((capability: BotCapability) => {
                  const granted = asked.has(capability);
                  return (
                    <div
                      key={capability}
                      className="flex items-center gap-3.5 border-b border-border px-5 py-3.5 last:border-b-0 max-sm:flex-col max-sm:items-start max-sm:gap-1.5"
                    >
                      {granted ? (
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="var(--success)"
                          strokeWidth="2.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="shrink-0"
                          aria-label="requested"
                        >
                          <path d="m5 12.5 4.5 4.5L19 7.5" />
                        </svg>
                      ) : (
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="var(--text-ghost)"
                          strokeWidth="2.4"
                          strokeLinecap="round"
                          className="shrink-0"
                          aria-label="not requested"
                        >
                          <path d="m7 7 10 10M17 7 7 17" />
                        </svg>
                      )}
                      <span
                        className={`w-[190px] shrink-0 text-sm ${granted ? "text-text" : "text-text-faint"}`}
                      >
                        {BOT_CAPABILITY_LABELS[capability]}
                      </span>
                      <span className="text-[13px] leading-relaxed text-text-muted">
                        {granted ? BOT_CAPABILITY_MEANINGS[capability] : "Not requested."}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[13px] leading-relaxed text-text-faint">
                Declared by the author in the listing. Your hub is what actually enforces it — a bot
                cannot take a permission you did not grant, whatever its listing says.
              </p>
            </div>

            <Note>
              A bot runs on its author&rsquo;s machine, not on your hub. Yours sends it events over a
              webhook and it answers over the same API a person would use. Nothing is installed, and
              removing it is one click.
            </Note>
          </div>

          <aside className="flex flex-col gap-4">
            <div className="flex flex-col gap-3.5 rounded-xl border border-accent-border bg-bg-elevated p-5">
              <SectionLabel>Add it to your hub</SectionLabel>
              <div className="rounded-md border border-border bg-bg-sunken p-3">
                <span className="font-mono text-[11px] leading-relaxed break-all text-text-muted">
                  {bot.pubkey}
                </span>
              </div>
              <CopyButton value={bot.pubkey} label="Copy public key" variant="primary" />
              <ol className="flex flex-col gap-2.5 pt-1">
                {INVITE_STEPS.map((step, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="mt-px flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-surface font-mono text-[10px] font-bold text-text-muted">
                      {i + 1}
                    </span>
                    <span className="text-[13px] leading-relaxed text-text-muted">{step}</span>
                  </li>
                ))}
              </ol>
              <p className="text-xs leading-relaxed text-text-faint">
                Needs the Bots permission on your hub. You are not signing up for anything here.
              </p>
            </div>

            <div className="flex flex-col gap-3 rounded-xl border border-border bg-bg-elevated p-5">
              <SectionLabel>Details</SectionLabel>
              {bot.homepage_url ? (
                <MetaRow label="Homepage">
                  <a href={bot.homepage_url} rel="noreferrer nofollow">
                    {bot.homepage_url.replace(/^https?:\/\//, "")}
                  </a>
                </MetaRow>
              ) : null}
              <MetaRow label="Listed">{new Date(bot.listed_at).toISOString().slice(0, 10)}</MetaRow>
              <MetaRow label="Updated">{new Date(bot.updated_at).toISOString().slice(0, 10)}</MetaRow>
              <VerifiedBadge label="Listing signature verified" />
            </div>

            <div className="flex flex-col gap-2.5 rounded-xl border border-border bg-bg-elevated p-5">
              <p className="text-xs leading-relaxed text-text-faint">
                This directory did not write, review or run this bot. Everything above is what its
                author declared.
              </p>
              <a
                href={reportUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center rounded border border-border py-2.5 text-xs font-medium text-text-muted hover:border-border-strong hover:text-text"
              >
                Report a broken listing
              </a>
              <Link href={DOCS.bots} className="text-center font-mono text-xs">
                how bots work &rarr;
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
