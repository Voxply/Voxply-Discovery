import * as ed from "@noble/ed25519";
import { randomBytes } from "crypto";
import fs from "fs";
import path from "path";

const KEY_PATH = path.join(process.cwd(), "data", "missions-key.json");

let _priv: Uint8Array | null = null;
let _pub: Uint8Array | null = null;

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

export function bytesToHex(b: Uint8Array): string {
  return Array.from(b).map(x => x.toString(16).padStart(2, "0")).join("");
}

export async function getKeyPair(): Promise<{ priv: Uint8Array; pub: Uint8Array }> {
  if (_priv && _pub) return { priv: _priv, pub: _pub };
  let privHex: string;
  if (fs.existsSync(KEY_PATH)) {
    privHex = JSON.parse(fs.readFileSync(KEY_PATH, "utf-8")).private_key;
  } else {
    privHex = bytesToHex(randomBytes(32));
    fs.mkdirSync(path.dirname(KEY_PATH), { recursive: true });
    fs.writeFileSync(KEY_PATH, JSON.stringify({ private_key: privHex }));
  }
  _priv = hexToBytes(privHex);
  _pub = await ed.getPublicKeyAsync(_priv);
  return { priv: _priv, pub: _pub };
}

export async function signBytes(msg: Uint8Array): Promise<Uint8Array> {
  const { priv } = await getKeyPair();
  return ed.signAsync(msg, priv);
}

export async function getPublicKeyHex(): Promise<string> {
  const { pub } = await getKeyPair();
  return bytesToHex(pub);
}

/** Sign a mission list envelope. Canonical JSON minus "signature" field, keys sorted. */
export async function signMissionList(envelope: Record<string, unknown>): Promise<string> {
  const { signature: _, ...rest } = envelope;
  const sorted = JSON.stringify(rest, Object.keys(rest).sort());
  const sig = await signBytes(new TextEncoder().encode(sorted));
  return bytesToHex(sig);
}

/** Sign an entitlement blob: "user_pubkey:item_id:granted_at" */
export async function signEntitlement(userPubkey: string, itemId: string, grantedAt: number): Promise<string> {
  const msg = `${userPubkey}:${itemId}:${grantedAt}`;
  const sig = await signBytes(new TextEncoder().encode(msg));
  return bytesToHex(sig);
}
