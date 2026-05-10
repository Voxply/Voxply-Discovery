import type { HubListing } from "@/lib/types";
import { HubIcon } from "./HubIcon";
import { TagChip } from "./TagChip";

export function HubCard({ hub }: { hub: HubListing }) {
  const voxplyUrl = (() => {
    try {
      const u = new URL(hub.hub_url);
      const hp = u.port ? `${u.hostname}:${u.port}` : u.hostname;
      const invite = hub.invite_code ? `/${hub.invite_code}` : "";
      return `voxply://${hp}${invite}`;
    } catch { return `voxply://${hub.hub_url}`; }
  })();

  return (
    <div className="flex flex-col bg-neutral-900 border border-neutral-800 rounded-xl p-4 hover:border-neutral-600 transition-colors">
      <div className="flex items-start gap-3 mb-3">
        <HubIcon icon={hub.icon} name={hub.name} size="md" />
        <div className="flex-1 min-w-0">
          <a href={`/hub/${hub.hub_pubkey}`} className="font-semibold hover:text-indigo-300 transition-colors line-clamp-1">
            {hub.name}
          </a>
          <p className="text-xs text-neutral-500 mt-0.5">{hub.language.toUpperCase()}</p>
        </div>
      </div>

      {hub.description && (
        <p className="text-sm text-neutral-400 line-clamp-2 mb-3">{hub.description}</p>
      )}

      {hub.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {hub.tags.slice(0, 4).map((t) => (
            <TagChip key={t} tag={t} href={`/?tag=${t}`} />
          ))}
          {hub.tags.length > 4 && (
            <span className="text-xs text-neutral-600">+{hub.tags.length - 4}</span>
          )}
        </div>
      )}

      <div className="mt-auto pt-2 flex gap-2">
        <a
          href={voxplyUrl}
          className="flex-1 text-center py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-medium transition-colors"
        >
          Open in Voxply
        </a>
        <a
          href={`/hub/${hub.hub_pubkey}`}
          className="px-3 py-1.5 border border-neutral-700 hover:border-neutral-500 rounded-lg text-xs text-neutral-300 transition-colors"
        >
          Details
        </a>
      </div>
    </div>
  );
}
