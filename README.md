# Wavvon Discovery

[![Build check](https://github.com/Wavvon/Wavvon-discovery/actions/workflows/build.yml/badge.svg)](https://github.com/Wavvon/Wavvon-discovery/actions/workflows/build.yml)

The **optional public hub directory** for
[Wavvon](https://github.com/Wavvon/Wavvon) — an open-source, federated
voice + text platform where communities run their own servers.

Wavvon has no central server, so there is nothing you *must* register
with — hubs are joined by URL. Discovery exists purely as a
convenience: hub operators can list their public hubs here, and users
can browse and search for communities to join. Hubs work exactly the
same without it, and because this service is open source you can run
your own directory for your own network.

## What it does

- **Hub directory** — operators submit their hub (`/submit`); listings
  are Ed25519-signed by the hub's own key, so only a hub can publish or
  update its profile. Browse and search with uptime tracking.
- **Hub creation wizard** (`/new`) — pick a config template and get a
  ready-to-boot hub bootstrap.
- **Farm catalog** — browse public farms (multi-hub deployments).
- **Bot directory** — published bots, invitable by public key.
- **Skins gallery** — community `.wavvonskin` themes, signed by their
  authors, shown in the Appearance tab of every client.
- **Config template catalog** — signed channel/role templates for new
  hubs.

## Run it

Requires [Node 20+](https://nodejs.org).

```bash
git clone https://github.com/Wavvon/Wavvon-discovery
cd Wavvon-discovery
npm install
npm run dev
# Open http://localhost:3000
```

Production:

```bash
npm run build
npm start
```

State lives in a single SQLite database at `./data/discovery.db`
(created automatically). To enable hub uptime tracking, point a cron
job at `POST /api/internal/ping-hubs` and set the `CRON_SECRET`
environment variable to guard it.

Hubs choose which directory they announce to via the `discovery_url`
setting in [Wavvon-server](https://github.com/Wavvon/Wavvon-server).

> Note for contributors: this repo pins a Next.js version with breaking
> changes from older releases. Read the bundled guide under
> `node_modules/next/dist/docs/` before touching the App Router code.

## Tech

Next.js (App Router) · React · TypeScript · Tailwind CSS · SQLite via
better-sqlite3 · `@noble/ed25519` for signature verification.

```bash
npx tsc --noEmit   # type check
npm run lint       # eslint
```

## The Wavvon project

| Repo | What it is |
|---|---|
| [Wavvon-server](https://github.com/Wavvon/Wavvon-server) | Hub server, farm tooling, identity crate (Rust) |
| [Wavvon-client](https://github.com/Wavvon/Wavvon-client) | All clients (desktop / web / Android) + shared packages |
| **Wavvon-discovery** *(this repo)* | Optional public hub directory |
| [Wavvon](https://github.com/Wavvon/Wavvon) | Architecture wiki, roadmap, API spec |

Design docs:
[hub-discovery.md](https://github.com/Wavvon/Wavvon/blob/main/docs/hub-discovery.md)
and
[discovery-v2.md](https://github.com/Wavvon/Wavvon/blob/main/docs/discovery-v2.md).

## Contributing

Issues and PRs welcome — see [CONTRIBUTING.md](CONTRIBUTING.md).

## License

GNU Affero General Public License v3.0.

## Built with AI assistance

This project was built with substantial help from
[Claude](https://claude.ai) (Anthropic's AI assistant). The product
owner directs architecture, features, and tradeoffs; Claude drafts
most of the code, tests, and documentation, which is then reviewed,
adjusted, and accepted.

Calling this out for transparency — it's not a fully hand-written
codebase, and pretending otherwise wouldn't be honest.
