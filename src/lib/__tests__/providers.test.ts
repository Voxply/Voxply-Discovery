import { describe, it, expect, beforeEach } from "vitest";
import Database from "better-sqlite3";
import { getDb, initDb } from "../db";
import { countProviders, getProvider, listProviders, removeProvider, upsertProvider } from "../providers-db";

beforeEach(() => {
  initDb(new Database(":memory:"));
});

function seed() {
  upsertProvider({
    provider_pubkey: "ed25519:aaaa",
    provider_url: "https://free.example",
    name: "Freehold",
    description: "A free tier and not much else.",
    pricing_tiers: [{ name: "Free", price_cents: 0, max_members: 50 }],
  });
  upsertProvider({
    provider_pubkey: "ed25519:bbbb",
    provider_url: "https://paid.example",
    name: "Bigiron",
    description: "Paid only.",
    pricing_tiers: [{ name: "Standard", price_cents: 900 }],
  });
  upsertProvider({
    provider_pubkey: "ed25519:cccc",
    provider_url: "https://full.example",
    name: "Closedshop",
    description: "Out of room.",
    pricing_tiers: [{ name: "free", price_cents: 0 }],
    accepting: false,
  });
}

describe("providers", () => {
  it("finds a free tier by price and by name", () => {
    seed();
    // "Free" priced at zero and a tier merely called "free" both count — the
    // listing is written by the operator, not by a form we control.
    expect(listProviders({ freeTier: true }).map((p) => p.name).sort()).toEqual([
      "Closedshop",
      "Freehold",
    ]);
  });

  it("separates having room from having a free tier", () => {
    seed();
    expect(listProviders({ accepting: true }).map((p) => p.name).sort()).toEqual([
      "Bigiron",
      "Freehold",
    ]);
    expect(listProviders({ freeTier: true, accepting: true }).map((p) => p.name)).toEqual(["Freehold"]);
  });

  it("defaults a provider to accepting", () => {
    upsertProvider({ provider_pubkey: "k", provider_url: "https://x.example", name: "X" });
    expect(getProvider("k")?.accepting).toBe(true);
  });

  it("updates in place rather than duplicating", () => {
    seed();
    upsertProvider({
      provider_pubkey: "ed25519:aaaa",
      provider_url: "https://free.example",
      name: "Freehold Hosting",
    });
    expect(countProviders()).toBe(3);
    expect(getProvider("ed25519:aaaa")?.name).toBe("Freehold Hosting");
  });

  it("ignores a malformed pricing_tiers payload instead of throwing", () => {
    // Written by whoever runs the provider, so it can be anything at all.
    const db = getDb();
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO providers (provider_pubkey, provider_url, name, description, icon,
         pricing_tiers, accepting, listed_at, last_verified_at)
       VALUES (?,?,?,?,?,?,?,?,?)`
    ).run("k", "https://x.example", "Broken", "", null, "{not json", 1, now, now);

    const [provider] = listProviders();
    expect(provider.name).toBe("Broken");
    expect(provider.pricing_tiers).toEqual([]);
    expect(listProviders({ freeTier: true })).toEqual([]);
  });

  it("removes a provider", () => {
    seed();
    expect(removeProvider("ed25519:bbbb")).toBe(true);
    expect(removeProvider("ed25519:bbbb")).toBe(false);
    expect(countProviders()).toBe(2);
  });
});
