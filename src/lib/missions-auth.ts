import * as ed from "@noble/ed25519";

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

export async function verifyAuthHeader(authHeader: string | null): Promise<{ ok: boolean; pubkey?: string; error?: string }> {
  if (!authHeader) return { ok: false, error: "Missing X-Voxply-Auth header" };
  let parsed: { pubkey: string; sig: string; ts: number };
  try {
    parsed = JSON.parse(Buffer.from(authHeader, "base64").toString("utf-8"));
  } catch {
    return { ok: false, error: "Invalid auth header" };
  }
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parsed.ts) > 300) return { ok: false, error: "Timestamp out of window" };
  const msg = new TextEncoder().encode(`${parsed.pubkey}:${parsed.ts}`);
  try {
    const valid = await ed.verifyAsync(hexToBytes(parsed.sig), msg, hexToBytes(parsed.pubkey));
    if (!valid) return { ok: false, error: "Invalid signature" };
    return { ok: true, pubkey: parsed.pubkey };
  } catch {
    return { ok: false, error: "Signature verification failed" };
  }
}

export function verifyAdminBearer(authHeader: string | null): boolean {
  const token = process.env.MISSIONS_ADMIN_TOKEN;
  if (!token) return false;
  return authHeader === `Bearer ${token}`;
}
