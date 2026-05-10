import * as ed from "@noble/ed25519";

// Verify an Ed25519 signature.
// pubkeyHex and signatureHex are lowercase hex strings (as produced by the Rust hub).
// message is the canonical payload string.
export async function verifySignature(
  pubkeyHex: string,
  signatureHex: string,
  message: string,
): Promise<boolean> {
  try {
    const pubkey = hexToBytes(pubkeyHex);
    const sig = hexToBytes(signatureHex);
    const msg = new TextEncoder().encode(message);
    return await ed.verify(sig, msg, pubkey);
  } catch {
    return false;
  }
}

function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) throw new Error("Invalid hex");
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}
