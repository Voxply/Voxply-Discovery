"use client";

import { useState } from "react";
import type { InfoResponse } from "@/lib/types";

export default function SubmitPage() {
  const [hubUrl, setHubUrl] = useState("");
  const [info, setInfo] = useState<InfoResponse | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");

  const [tags, setTags] = useState("");
  const [language, setLanguage] = useState("en");
  const [bio, setBio] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [statusMsg, setStatusMsg] = useState("");

  async function verifyHub() {
    setVerifyError("");
    setInfo(null);
    setVerifying(true);
    try {
      const base = hubUrl.trim().replace(/\/+$/, "");
      const res = await fetch(`${base}/info`);
      if (!res.ok) throw new Error(`Hub returned ${res.status}`);
      setInfo(await res.json());
    } catch (e) {
      setVerifyError(String(e));
    } finally {
      setVerifying(false);
    }
  }

  async function submit() {
    if (!info) return;
    setStatus("idle");
    const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean);
    const nonce = new Date(Math.floor(Date.now() / 60000) * 60000).toISOString().replace(".000Z", "Z");
    const canonical = JSON.stringify({
      bio,
      hub_url: hubUrl.trim().replace(/\/+$/, ""),
      language,
      nonce,
      tags: [...tagList].sort(),
    });

    const message = [
      "To submit this listing, your hub needs to sign the payload below with its",
      "Ed25519 private key (hub_identity.json).",
      "",
      "In your Voxply hub admin → Overview → Submit to Directory, paste:",
      canonical,
      "",
      "Then paste the returned signature here.",
    ].join("\n");

    setStatus("ok");
    setStatusMsg(message);
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-10">
      <a href="/" className="text-sm text-neutral-500 hover:text-neutral-300 mb-6 inline-block">
        ← Back to directory
      </a>
      <h1 className="text-2xl font-bold mb-2">List your hub</h1>
      <p className="text-neutral-400 mb-8 text-sm">
        The easiest way is via the Voxply app: open hub settings → Overview →
        <strong className="text-neutral-200"> Submit to Directory</strong>. It
        handles signing automatically. The form below is for advanced/manual use.
      </p>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-1">Hub URL</label>
          <div className="flex gap-2">
            <input
              className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              placeholder="https://hub.example.com"
              value={hubUrl}
              onChange={(e) => { setHubUrl(e.target.value); setInfo(null); }}
            />
            <button
              onClick={verifyHub}
              disabled={!hubUrl.trim() || verifying}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-sm disabled:opacity-50 transition-colors"
            >
              {verifying ? "Checking…" : "Verify"}
            </button>
          </div>
          {verifyError && <p className="text-red-400 text-xs mt-1">{verifyError}</p>}
          {info && (
            <div className="mt-2 p-3 bg-neutral-800 rounded-lg text-sm">
              <p className="font-medium">{info.name}</p>
              {info.description && <p className="text-neutral-400 text-xs mt-0.5">{info.description}</p>}
              <p className="text-neutral-500 text-xs mt-1">Key: {info.public_key.slice(0, 24)}…</p>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-1">Tags</label>
          <input
            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
            placeholder="gaming, music, en (comma-separated)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-1">Language</label>
          <input
            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
            placeholder="en"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-1">Bio</label>
          <textarea
            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 resize-y min-h-[100px]"
            placeholder="Tell people what your hub is about…"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-1">Invite code (optional)</label>
          <input
            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
            placeholder="For invite-only hubs"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
          />
        </div>

        <button
          onClick={submit}
          disabled={!info}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
        >
          Generate signing instructions
        </button>

        {status === "ok" && (
          <div className="p-4 bg-neutral-900 border border-neutral-700 rounded-lg text-xs font-mono whitespace-pre-wrap text-neutral-300">
            {statusMsg}
          </div>
        )}
      </div>
    </div>
  );
}
