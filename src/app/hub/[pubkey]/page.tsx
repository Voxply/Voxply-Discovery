import { getHub } from "@/lib/db";
import { notFound } from "next/navigation";
import { HubIcon } from "@/components/HubIcon";
import { TagChip } from "@/components/TagChip";
import { JoinButton } from "@/components/JoinButton";

interface Props { params: Promise<{ pubkey: string }> }

export default async function HubPage({ params }: Props) {
  const { pubkey } = await params;
  const hub = getHub(pubkey);
  if (!hub) notFound();

  const voxplyUrl = (() => {
    try {
      const u = new URL(hub.hub_url);
      const hp = u.port ? `${u.hostname}:${u.port}` : u.hostname;
      const invite = hub.invite_code ? `/${hub.invite_code}` : "";
      return `voxply://${hp}${invite}`;
    } catch { return `voxply://${hub.hub_url}`; }
  })();

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <a href="/" className="text-sm text-neutral-500 hover:text-neutral-300 mb-6 inline-block">
        ← Back to directory
      </a>

      <div className="flex items-start gap-5 mb-6">
        <HubIcon icon={hub.icon} name={hub.name} size="lg" />
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold">{hub.name}</h1>
          {hub.description && (
            <p className="text-neutral-400 mt-1">{hub.description}</p>
          )}
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300">
              {hub.language.toUpperCase()}
            </span>
            {hub.invite_only && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-900/60 text-amber-300">
                Invite only
              </span>
            )}
            {hub.min_security_level > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400">
                PoW: {hub.min_security_level >= 20 ? "High" : hub.min_security_level >= 15 ? "Medium" : "Low"}
              </span>
            )}
          </div>
        </div>
      </div>

      {hub.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {hub.tags.map((t) => <TagChip key={t} tag={t} />)}
        </div>
      )}

      {hub.bio && (
        <div className="mb-8 text-neutral-300 leading-relaxed whitespace-pre-wrap">
          {hub.bio}
        </div>
      )}

      <div className="flex gap-3">
        <JoinButton voxplyUrl={voxplyUrl} />
        <a
          href={hub.hub_url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 rounded-lg border border-neutral-700 text-sm text-neutral-300 hover:border-neutral-500 transition-colors"
        >
          Hub URL ↗
        </a>
      </div>

      <p className="mt-8 text-xs text-neutral-600">
        Listed {new Date(hub.listed_at).toLocaleDateString()} · Last verified{" "}
        {new Date(hub.last_verified_at).toLocaleDateString()}
      </p>
    </div>
  );
}
