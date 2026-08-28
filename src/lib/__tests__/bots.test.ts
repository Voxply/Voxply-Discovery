import { describe, it, expect, beforeEach } from "vitest";
import Database from "better-sqlite3";
import * as ed from "@noble/ed25519";
import { getBot, initDb, listBots, upsertBot } from "../db";
import { verifyListingSignature } from "../signed-listing";
import { validateBot } from "../../app/api/bots/route";

/* Bots were the one listing type nobody had to prove they owned: `POST
 * /api/bots` believed whatever pubkey the body named, and `DELETE` took no
 * credential at all — a bare curl removed anybody's listing. These guard the
 * fix, which is the same signed-document shape hubs, clients and skins use. */

function b64url(raw: Uint8Array): string {
  return Buffer.from(raw).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function signedListing(overrides: Record<string, unknown> = {}) {
  const secret = ed.utils.randomSecretKey();
  const pubkey = Buffer.from(await ed.getPublicKeyAsync(secret)).toString("hex");
  const payload = JSON.stringify({ pubkey, name: "Tallyman", ...overrides });
  const sig = b64url(await ed.signAsync(new TextEncoder().encode(payload), secret));
  return { payload, sig, pubkey, secret };
}

beforeEach(() => {
  initDb(new Database(":memory:"));
});

describe("bot listing signatures", () => {
  it("accepts a listing signed by the key it names", async () => {
    const { payload, sig, pubkey } = await signedListing();
    expect(await verifyListingSignature(payload, sig, pubkey)).toBe(true);
  });

  it("refuses a listing altered after signing", async () => {
    const { payload, sig, pubkey } = await signedListing();
    const tampered = payload.replace("Tallyman", "Tallyman2");
    expect(await verifyListingSignature(tampered, sig, pubkey)).toBe(false);
  });

  it("refuses a signature made by a different key", async () => {
    const mine = await signedListing();
    const theirs = await signedListing();
    // Claiming somebody else's pubkey while signing with your own is exactly
    // the takeover the old endpoint allowed.
    expect(await verifyListingSignature(mine.payload, mine.sig, theirs.pubkey)).toBe(false);
  });

  it("refuses a malformed signature without throwing", async () => {
    const { payload, pubkey } = await signedListing();
    expect(await verifyListingSignature(payload, "not-base64url!!", pubkey)).toBe(false);
    expect(await verifyListingSignature(payload, "", pubkey)).toBe(false);
  });

  it("proves a delete the same way", async () => {
    // The delete credential is a signature over the pubkey itself.
    const secret = ed.utils.randomSecretKey();
    const pubkey = Buffer.from(await ed.getPublicKeyAsync(secret)).toString("hex");
    const sig = b64url(await ed.signAsync(new TextEncoder().encode(pubkey), secret));
    expect(await verifyListingSignature(pubkey, sig, pubkey)).toBe(true);

    const other = ed.utils.randomSecretKey();
    const otherSig = b64url(await ed.signAsync(new TextEncoder().encode(pubkey), other));
    expect(await verifyListingSignature(pubkey, otherSig, pubkey)).toBe(false);
  });
});

describe("validateBot", () => {
  const ok = { pubkey: "a".repeat(64), name: "Tallyman" };

  it("accepts a minimal listing", () => {
    expect(validateBot(ok, 100)).toBeNull();
  });

  it("insists on a 64-hex lowercase pubkey", () => {
    expect(validateBot({ ...ok, pubkey: "A".repeat(64) }, 100)).toMatch(/pubkey/);
    expect(validateBot({ ...ok, pubkey: "abc" }, 100)).toMatch(/pubkey/);
  });

  it("bounds the payload and the lists", () => {
    expect(validateBot(ok, 20000)).toMatch(/16 KB/);
    expect(validateBot({ ...ok, tags: new Array(21).fill("x") }, 100)).toMatch(/tags/);
    expect(validateBot({ ...ok, commands: new Array(51).fill({ name: "/x" }) }, 100)).toMatch(/commands/);
  });

  it("rejects a command with no name", () => {
    expect(validateBot({ ...ok, commands: [{ description: "no name" }] }, 100)).toMatch(/command/);
  });
});

describe("bot storage", () => {
  it("upserts by pubkey rather than duplicating", () => {
    const base = {
      pubkey: "b".repeat(64),
      name: "Tallyman",
      description: "",
      homepage_url: "",
      webhook_url: "",
      capabilities: [],
      commands: [],
      tags: [],
    };
    upsertBot(base);
    upsertBot({ ...base, name: "Tallyman 2" });
    expect(listBots({})).toHaveLength(1);
    expect(getBot(base.pubkey)?.name).toBe("Tallyman 2");
  });
});
