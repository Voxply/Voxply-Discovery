"use client";
import { useState } from "react";

export function JoinButton({ voxplyUrl }: { voxplyUrl: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(voxplyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex gap-2">
      <a
        href={voxplyUrl}
        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors"
      >
        Open in Voxply
      </a>
      <button
        onClick={copy}
        className="px-4 py-2 rounded-lg border border-neutral-700 text-sm text-neutral-300 hover:border-neutral-500 transition-colors"
      >
        {copied ? "Copied!" : "Copy link"}
      </button>
    </div>
  );
}
