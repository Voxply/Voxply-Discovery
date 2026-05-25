# Voxply-discovery

Hub discovery service for the [Voxply](https://github.com/Voxply/Voxply) platform.
A web app where hub operators register their public hubs and users
browse or search for communities to join.

Part of the Voxply project — see the
[docs repo](https://github.com/Voxply/Voxply) for architecture and API spec,
and the [roadmap](https://github.com/Voxply/Voxply/blob/main/ROADMAP.md) for what's next.

## Technologies

- **Next.js 16** — React framework with App Router
- **React 19** + **TypeScript** — UI layer
- **Tailwind CSS 4** — utility-first styling
- **SQLite** via better-sqlite3 — embedded hub registry
- **@noble/ed25519** — Ed25519 signature verification for hub profiles

## Quick start

Requires [Node 20+](https://nodejs.org).

```bash
npm install
npm run dev
# Open http://localhost:3000
```

## Building

```bash
npm run build
npm start
```

## Type checking

```bash
npx tsc --noEmit
```

## Built with AI assistance

This project was built with substantial help from
[Claude](https://claude.ai) (Anthropic's AI assistant). The product
owner directs architecture, features, and tradeoffs; Claude drafts
most of the code, tests, and documentation, which is then reviewed,
adjusted, and accepted.

Calling this out for transparency — it's not a fully hand-written
codebase, and pretending otherwise wouldn't be honest.

## License

[GNU Affero General Public License v3.0](LICENSE).
