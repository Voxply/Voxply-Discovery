"use client";

import { useState } from "react";
import type { BotCommand } from "@/lib/types";

const CAPABILITIES = [
  "Slash commands",
  "Event subscriptions",
  "Voice (when available)",
  "Screen share (when available)",
];

export default function BotSubmitPage() {
  const [name, setName] = useState("");
  const [pubkey, setPubkey] = useState("");
  const [description, setDescription] = useState("");
  const [homepageUrl, setHomepageUrl] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [commands, setCommands] = useState<BotCommand[]>([{ name: "", description: "" }]);
  const [tags, setTags] = useState("");
  const [capabilities, setCapabilities] = useState<string[]>([]);

  const [status, setStatus] = useState<"idle" | "submitting" | "ok" | "error">("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submittedPubkey, setSubmittedPubkey] = useState("");
  const [copied, setCopied] = useState(false);

  function toggleCapability(cap: string) {
    setCapabilities((prev) =>
      prev.includes(cap) ? prev.filter((c) => c !== cap) : [...prev, cap]
    );
  }

  function addCommand() {
    setCommands((prev) => [...prev, { name: "", description: "" }]);
  }

  function removeCommand(index: number) {
    setCommands((prev) => prev.filter((_, i) => i !== index));
  }

  function updateCommand(index: number, field: keyof BotCommand, value: string) {
    setCommands((prev) => prev.map((cmd, i) => i === index ? { ...cmd, [field]: value } : cmd));
  }

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Name is required.";
    if (!pubkey.trim()) {
      errs.pubkey = "Public key is required.";
    } else if (!/^[0-9a-fA-F]{64}$/.test(pubkey.trim())) {
      errs.pubkey = "Must be exactly 64 hex characters.";
    }
    if (name.trim().length > 64) errs.name = "Name must be 64 characters or fewer.";
    if (description.length > 500) errs.description = "Description must be 500 characters or fewer.";
    if (homepageUrl && homepageUrl.length > 255) errs.homepage_url = "URL must be 255 characters or fewer.";
    if (webhookUrl && webhookUrl.length > 255) errs.webhook_url = "URL must be 255 characters or fewer.";
    return errs;
  }

  async function submit() {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setStatus("submitting");
    const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean);
    const validCommands = commands.filter((c) => c.name.trim());

    try {
      const res = await fetch("/api/bots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pubkey: pubkey.trim().toLowerCase(),
          name: name.trim(),
          description,
          homepage_url: homepageUrl.trim(),
          webhook_url: webhookUrl.trim(),
          capabilities,
          commands: validCommands,
          tags: tagList,
        }),
      });

      if (!res.ok) {
        const data = await res.json() as { error?: string };
        setErrors({ form: data.error ?? "Submission failed." });
        setStatus("error");
        return;
      }

      setSubmittedPubkey(pubkey.trim().toLowerCase());
      setStatus("ok");
    } catch {
      setErrors({ form: "Network error. Please try again." });
      setStatus("error");
    }
  }

  function copyPubkey() {
    navigator.clipboard.writeText(submittedPubkey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (status === "ok") {
    return (
      <div className="max-w-xl mx-auto px-6 py-10">
        <a href="/bots" className="text-sm text-neutral-500 hover:text-neutral-300 mb-6 inline-block">
          ← Back to bots
        </a>
        <div className="p-6 bg-neutral-900 border border-neutral-700 rounded-xl">
          <h1 className="text-xl font-bold mb-2">Bot listed!</h1>
          <p className="text-neutral-400 text-sm mb-4">
            Your bot is now in the directory. Share the pubkey so hub operators can invite it.
          </p>
          <div className="font-mono text-xs bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 break-all text-neutral-300 mb-3">
            {submittedPubkey}
          </div>
          <button
            onClick={copyPubkey}
            className="w-full px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm transition-colors"
          >
            {copied ? "Copied!" : "Copy pubkey"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-10">
      <a href="/bots" className="text-sm text-neutral-500 hover:text-neutral-300 mb-6 inline-block">
        ← Back to bots
      </a>
      <h1 className="text-2xl font-bold mb-2">List your bot</h1>
      <p className="text-neutral-400 mb-8 text-sm">
        Add your bot to the community directory. Hub operators can invite it using its public key.
      </p>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-1">Bot name <span className="text-red-400">*</span></label>
          <input
            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
            placeholder="My Awesome Bot"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-1">Public key <span className="text-red-400">*</span></label>
          <input
            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-indigo-500"
            placeholder="64 hex characters (Ed25519 pubkey)"
            value={pubkey}
            onChange={(e) => setPubkey(e.target.value)}
          />
          {errors.pubkey && <p className="text-red-400 text-xs mt-1">{errors.pubkey}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-1">Description</label>
          <textarea
            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 resize-y min-h-[80px]"
            placeholder="What does your bot do?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-1">Homepage / docs URL</label>
          <input
            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
            placeholder="https://example.com/my-bot"
            value={homepageUrl}
            onChange={(e) => setHomepageUrl(e.target.value)}
          />
          {errors.homepage_url && <p className="text-red-400 text-xs mt-1">{errors.homepage_url}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-1">Webhook URL</label>
          <input
            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
            placeholder="https://example.com/webhook (for slash command bots)"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
          />
          {errors.webhook_url && <p className="text-red-400 text-xs mt-1">{errors.webhook_url}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-2">Capabilities</label>
          <div className="space-y-2">
            {CAPABILITIES.map((cap) => (
              <label key={cap} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={capabilities.includes(cap)}
                  onChange={() => toggleCapability(cap)}
                  className="rounded border-neutral-600 bg-neutral-900 text-indigo-500 focus:ring-indigo-500"
                />
                <span className="text-sm text-neutral-300">{cap}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-neutral-300">Commands</label>
            <button
              type="button"
              onClick={addCommand}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              + Add command
            </button>
          </div>
          <div className="space-y-2">
            {commands.map((cmd, i) => (
              <div key={i} className="flex gap-2">
                <div className="flex items-center text-neutral-500 text-sm pl-2">/</div>
                <input
                  className="w-28 bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500"
                  placeholder="name"
                  value={cmd.name}
                  onChange={(e) => updateCommand(i, "name", e.target.value)}
                />
                <input
                  className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500"
                  placeholder="Description"
                  value={cmd.description}
                  onChange={(e) => updateCommand(i, "description", e.target.value)}
                />
                {commands.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeCommand(i)}
                    className="text-neutral-600 hover:text-red-400 text-sm px-1 transition-colors"
                    aria-label="Remove command"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-1">Tags</label>
          <input
            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
            placeholder="moderation, music, fun (comma-separated)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </div>

        {errors.form && (
          <p className="text-red-400 text-sm">{errors.form}</p>
        )}

        <button
          onClick={submit}
          disabled={status === "submitting"}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
        >
          {status === "submitting" ? "Submitting…" : "List bot"}
        </button>
      </div>
    </div>
  );
}
