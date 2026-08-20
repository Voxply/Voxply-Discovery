# CLAUDE.md

Guidance for Claude Code (claude.ai/code) working in this repository.

## What this repo is

**Wavvon-discovery** — the optional public hub directory site for Wavvon, a
self-hosted, federated voice+text community platform. Next.js 16 + React, with a
local SQLite store (`better-sqlite3`) and Ed25519 signature verification
(`@noble/ed25519`) for the listings hubs and farms publish.

It is *optional* by design: Wavvon works with zero discovery site. Nothing here
is on the critical path of running a hub or a client, and the site must never
become a coordination point the network depends on.

```
src/app/         Next.js App Router routes and pages
src/components/  React components
src/lib/         data access, signature verification, helpers
data/            local runtime database — gitignored, never committed
scripts/
```

Sibling repos (you don't need them checked out):

| Repo | Contents |
|---|---|
| [Wavvon-server](https://github.com/Wavvon/Wavvon-server) | Hub server + the `seed` registry this site queries |
| [Wavvon-clients](https://github.com/Wavvon/Wavvon-clients) | Web + desktop clients |
| [Wavvon-docs](https://github.com/Wavvon/Wavvon-docs) | Architecture wiki + `openapi.yaml` |

Commit to **`develop`**. See `CONTRIBUTING.md`.

---

## Commands

```bash
npm run dev
npm run build
npm run start        # production server
npm run lint
npm run test         # vitest
```

---

## Constraints

**Next.js 16 differs significantly from earlier versions.** Check
`node_modules/next/dist/docs/` before writing Next.js-specific code rather than
relying on recalled patterns from 13/14/15.

**SQLite here is correct.** The hub server is PostgreSQL-only, but that rule is
about the hub. This site keeps its own small local catalog and `better-sqlite3`
is the deliberate choice — don't "align" it with the server.

**Listings are signed data from strangers.** Farms publish signed self-listings;
the site verifies signatures before trusting anything. Treat every field of a
listing as untrusted input for display purposes — it is written by whoever runs
that hub.

**Federated, not centralized.** Don't add features that make hubs or clients
*need* this site to function.

---

## Conventions

- Code comments in **English**, and only when the WHY is non-obvious. Don't explain WHAT.
- No comments in GitHub Actions workflow files — explain the choice in the commit message or the docs.
- Prefer one fixed home per UI control — avoid context-dependent relocation.
- Competitor references are allowed — factual, no logos, no disparagement.
