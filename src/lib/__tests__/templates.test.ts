import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Database from "better-sqlite3";
import * as ed from "@noble/ed25519";
import { initDb } from "../db";
import { registerTemplate, deleteTemplate, listTemplates, getTemplate } from "../templates-db";

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function makeKeypair() {
  const { secretKey, publicKey } = await ed.keygenAsync();
  return { secretKey, pubkeyHex: bytesToHex(publicKey) };
}

async function sign(message: string, secretKey: Uint8Array): Promise<string> {
  const msgBytes = new TextEncoder().encode(message);
  const sig = await ed.signAsync(msgBytes, secretKey);
  return bytesToHex(sig);
}

let db: Database.Database;

beforeEach(() => {
  db = new Database(":memory:");
  db.pragma("foreign_keys = ON");
  initDb(db);
});

afterEach(() => {
  db.close();
});

function makePayload(templateId: string, name: string): string {
  return JSON.stringify({ template_id: templateId, name });
}

describe("POST /api/templates/register — registerTemplate", () => {
  it("new template registered returns created status (201)", async () => {
    const { secretKey, pubkeyHex } = await makeKeypair();
    const payload = makePayload("tmpl-1", "My Template");
    const signature = await sign(payload, secretKey);

    const result = registerTemplate({
      template_id: "tmpl-1",
      name: "My Template",
      author_pubkey: pubkeyHex,
      payload,
      signature,
    });

    expect(result.status).toBe("created");
    const stored = getTemplate("tmpl-1");
    expect(stored).not.toBeNull();
    expect(stored!.name).toBe("My Template");
    expect(stored!.author_pubkey).toBe(pubkeyHex);
  });

  it("duplicate same author returns updated status (200)", async () => {
    const { secretKey, pubkeyHex } = await makeKeypair();
    const payload1 = makePayload("tmpl-2", "Original");
    const sig1 = await sign(payload1, secretKey);
    registerTemplate({ template_id: "tmpl-2", name: "Original", author_pubkey: pubkeyHex, payload: payload1, signature: sig1 });

    const payload2 = makePayload("tmpl-2", "Updated");
    const sig2 = await sign(payload2, secretKey);
    const result = registerTemplate({ template_id: "tmpl-2", name: "Updated", author_pubkey: pubkeyHex, payload: payload2, signature: sig2 });

    expect(result.status).toBe("updated");
    expect(getTemplate("tmpl-2")!.name).toBe("Updated");
  });

  it("duplicate different author returns forbidden status (403)", async () => {
    const author1 = await makeKeypair();
    const author2 = await makeKeypair();

    const payload1 = makePayload("tmpl-3", "First");
    const sig1 = await sign(payload1, author1.secretKey);
    registerTemplate({ template_id: "tmpl-3", name: "First", author_pubkey: author1.pubkeyHex, payload: payload1, signature: sig1 });

    const payload2 = makePayload("tmpl-3", "Takeover");
    const sig2 = await sign(payload2, author2.secretKey);
    const result = registerTemplate({ template_id: "tmpl-3", name: "Takeover", author_pubkey: author2.pubkeyHex, payload: payload2, signature: sig2 });

    expect(result.status).toBe("forbidden");
    expect(getTemplate("tmpl-3")!.name).toBe("First");
  });

  it("invalid signature is rejected by verifySignature (400)", async () => {
    const { pubkeyHex } = await makeKeypair();
    const badSig = "00".repeat(64);

    const { verifySignature } = await import("../verify");
    const valid = await verifySignature(pubkeyHex, badSig, "some payload");
    expect(valid).toBe(false);
  });
});

describe("DELETE /api/templates/register — deleteTemplate", () => {
  it("happy path: deletes an owned template (204)", async () => {
    const { secretKey, pubkeyHex } = await makeKeypair();
    const payload = makePayload("tmpl-del", "To Delete");
    const sig = await sign(payload, secretKey);
    registerTemplate({ template_id: "tmpl-del", name: "To Delete", author_pubkey: pubkeyHex, payload, signature: sig });

    const result = deleteTemplate("tmpl-del", pubkeyHex);
    expect(result.status).toBe("deleted");
    expect(getTemplate("tmpl-del")).toBeNull();
  });

  it("not found returns not_found (404)", async () => {
    const { pubkeyHex } = await makeKeypair();
    const result = deleteTemplate("nonexistent", pubkeyHex);
    expect(result.status).toBe("not_found");
  });
});

describe("GET /api/templates — listTemplates", () => {
  it("returns all registered templates", async () => {
    const { secretKey, pubkeyHex } = await makeKeypair();

    for (const id of ["t1", "t2", "t3"]) {
      const p = makePayload(id, `Template ${id}`);
      const s = await sign(p, secretKey);
      registerTemplate({ template_id: id, name: `Template ${id}`, author_pubkey: pubkeyHex, payload: p, signature: s, tags: ["test"] });
    }

    const results = listTemplates();
    expect(results.length).toBe(3);
    expect(results.every((r) => r.tags.includes("test"))).toBe(true);
  });

  it("filters by tag", async () => {
    const { secretKey, pubkeyHex } = await makeKeypair();

    const p1 = makePayload("tagged", "Tagged");
    registerTemplate({ template_id: "tagged", name: "Tagged", author_pubkey: pubkeyHex, payload: p1, signature: await sign(p1, secretKey), tags: ["gaming"] });

    const p2 = makePayload("untagged", "Untagged");
    registerTemplate({ template_id: "untagged", name: "Untagged", author_pubkey: pubkeyHex, payload: p2, signature: await sign(p2, secretKey), tags: [] });

    const results = listTemplates({ tag: "gaming" });
    expect(results.length).toBe(1);
    expect(results[0].template_id).toBe("tagged");
  });
});
