# Wally

Personal finance & wealth tracker — _"Know where your money is. Know where your wealth is going."_

- Architecture & requirements: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- Local setup & Google OAuth: [`docs/SETUP.md`](docs/SETUP.md)

## Stack

Next.js 15 (App Router) · TypeScript (strict) · Tailwind CSS v4 · Prisma + PostgreSQL (Neon) ·
Auth.js v5 (Google OAuth, database sessions) · next-intl (th/en) · PWA (Phase 4)

## Getting started

```bash
pnpm install
cp .env.example .env      # then fill in real values
pnpm db:migrate           # needs a reachable PostgreSQL (DATABASE_URL / DIRECT_URL)
pnpm dev                  # http://localhost:3000
```

The app boots without Google / Finnhub credentials — sign-in just won't work
until `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` are set (see `.env.example`).

## Scripts

| Command             | What it does                          |
| ------------------- | ------------------------------------- |
| `pnpm dev`          | Dev server                            |
| `pnpm build`        | `prisma generate` + production build  |
| `pnpm typecheck`    | `tsc --noEmit`                        |
| `pnpm lint`         | ESLint (`next lint`)                  |
| `pnpm test`         | Vitest                               |
| `pnpm db:migrate`   | Create/apply a dev migration         |
| `pnpm db:seed`      | Global seed (no-op for now)          |
| `pnpm db:studio`    | Prisma Studio                        |

## Fonts

LINE Sans files are not committed — see [`public/fonts/README.md`](public/fonts/README.md).
