import type { InfoResponse } from "./types";

export async function fetchHubInfo(hubUrl: string): Promise<InfoResponse> {
  const base = hubUrl.trim().replace(/\/+$/, "");
  const res = await fetch(`${base}/info`, {
    next: { revalidate: 0 },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Hub returned ${res.status}`);
  return res.json() as Promise<InfoResponse>;
}
