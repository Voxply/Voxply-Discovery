import { describe, it, expect } from "vitest";
import * as ed from "@noble/ed25519";
import { verifySignature } from "../verify";

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function makeKeypairAndSign(message: string) {
  const { secretKey, publicKey } = await ed.keygenAsync();
  const msgBytes = new TextEncoder().encode(message);
  const sig = await ed.signAsync(msgBytes, secretKey);
  return {
    pubkeyHex: bytesToHex(publicKey),
    sigHex: bytesToHex(sig),
    message,
    secretKey,
    publicKey,
  };
}

describe("verifySignature", () => {
  it("returns true for a valid signature", async () => {
    const { pubkeyHex, sigHex, message } = await makeKeypairAndSign("hello wavvon");
    expect(await verifySignature(pubkeyHex, sigHex, message)).toBe(true);
  });

  it("returns false when the message is tampered", async () => {
    const { pubkeyHex, sigHex } = await makeKeypairAndSign("original payload");
    expect(await verifySignature(pubkeyHex, sigHex, "tampered payload")).toBe(false);
  });

  it("returns false when the wrong public key is used", async () => {
    const { sigHex, message } = await makeKeypairAndSign("some message");
    const { publicKey: wrongKey } = await ed.keygenAsync();
    expect(await verifySignature(bytesToHex(wrongKey), sigHex, message)).toBe(false);
  });

  it("returns false for a malformed signature hex (odd length)", async () => {
    const { pubkeyHex, message } = await makeKeypairAndSign("test");
    expect(await verifySignature(pubkeyHex, "abc", message)).toBe(false);
  });

  it("returns false for a malformed public key hex (odd length)", async () => {
    const { sigHex, message } = await makeKeypairAndSign("test");
    expect(await verifySignature("xyz", sigHex, message)).toBe(false);
  });

  it("returns false for a zeroed-out (invalid) signature", async () => {
    const { pubkeyHex, message } = await makeKeypairAndSign("test");
    const zeroSig = "00".repeat(64);
    expect(await verifySignature(pubkeyHex, zeroSig, message)).toBe(false);
  });

  it("handles empty message correctly", async () => {
    const { pubkeyHex, sigHex, message } = await makeKeypairAndSign("");
    expect(await verifySignature(pubkeyHex, sigHex, message)).toBe(true);
  });
});
