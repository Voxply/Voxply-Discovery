"use client";
import type { BotListing } from "@/lib/types";
import { TagChip } from "./TagChip";
import { useState } from "react";

export function BotCard({ bot }: { bot: BotListing }) {
  const [copied, setCopied] = useState(false);

  function copyPubkey() {
    navigator.clipboard.writeText(bot.pubkey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const fingerprint = bot.pubkey.slice(0, 8) + "…";

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 flex flex-col gap-3 hover:border-neutral-700 transition-colors">
      <div>
        <div className="flex items-start justify-between gap-2">
          <h2 className="font-semibold text-neutral-100 leading-tight">{bot.name}</h2>
          <span className="font-mono text-xs text-neutral-500 shrink-0 mt-0.5">{fingerprint}</span>
        </div>
        {bot.description && (
          <p className="text-sm text-neutral-400 mt-1 line-clamp-2">{bot.description}</p>
        )}
      </div>

      {bot.capabilities.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {bot.capabilities.map((c) => <TagChip key={c} tag={c} />)}
        </div>
      )}

      {bot.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {bot.tags.map((t) => <TagChip key={t} tag={t} href={`/bots?tag=${t}`} />)}
        </div>
      )}

      {bot.commands.length > 0 && (
        <div className="text-xs text-neutral-500">
          Commands: {bot.commands.map(c => `/${c.name}`).join(" · ")}
        </div>
      )}

      <div className="flex gap-2 mt-auto pt-1">
        <button
          onClick={copyPubkey}
          className="flex-1 px-3 py-1.5 rounded-lg bg-indigo-950 hover:bg-indigo-900 text-indigo-300 text-sm transition-colors text-center"
        >
          {copied ? "Copied!" : "Copy pubkey"}
        </button>
        {bot.homepage_url && (
          <a
            href={bot.homepage_url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg border border-neutral-700 hover:border-neutral-500 text-neutral-400 text-sm transition-colors"
          >
            Docs ↗
          </a>
        )}
      </div>
    </div>
  );
}
