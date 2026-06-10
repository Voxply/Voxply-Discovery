# Voxply Discovery

[![Build check](https://github.com/Voxply/Voxply-discovery/actions/workflows/build.yml/badge.svg)](https://github.com/Voxply/Voxply-discovery/actions/workflows/build.yml)

The **optional public hub directory** for
[Voxply](https://github.com/Voxply/Voxply) — an open-source, federated
voice + text platform where communities run their own servers.

Voxply has no central server, so there is nothing you *must* register
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
- **Skins gallery** — community `.voxplyskin` themes, signed by their
  authors, shown in the Appearance tab of every client.
- **Config template catalog** — signed channel/role templates for new
  hubs.

## Run it

Requires [Node 20+](https://nodejs.org).

```bash
git clone https://github.com/Voxply/Voxply-discovery
cd Voxply-discovery
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
setting in [Voxply-server](https://github.com/Voxply/Voxply-server).

## Tech

Next.js (App Router) · React · TypeScript · Tailwind CSS · SQLite via
better-sqlite3 · `@noble/ed25519` for signature verification.

```bash
npx tsc --noEmit   # type check
npm run lint       # eslint
```

## The Voxply project

| Repo | What it is |
|---|---|
| [Voxply-server](https://github.com/Voxply/Voxply-server) | Hub server, farm tooling, identity crate (Rust) |
| [Voxply-desktop](https://github.com/Voxply/Voxply-desktop) | Desktop client — Windows / macOS / Linux (Tauri 2 + React) |
| [Voxply-web](https://github.com/Voxply/Voxply-web) | Browser client (text + DMs) |
| [Voxply-android](https://github.com/Voxply/Voxply-android) | Android client (Tauri 2) |
| **Voxply-discovery** *(this repo)* | Optional public hub directory |
| [Voxply](https://github.com/Voxply/Voxply) | Architecture wiki, roadmap, API spec |

Design docs:
[hub-discovery.md](https://github.com/Voxply/Voxply/blob/main/docs/hub-discovery.md)
and
[discovery-v2.md](https://github.com/Voxply/Voxply/blob/main/docs/discovery-v2.md).

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
