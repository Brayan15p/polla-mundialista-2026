# Polla Mundialista 2026

World Cup 2026 betting-pool app — a faithful implementation of the Claude Design
prototype, rebuilt as a real **Vite + React + TypeScript** application.

## Features

- 🎬 Cinematic animated intro (gold particles, floating trophy, host-nation flags)
- 🔐 Login / registration with optional entry into the general pool ($100,000 COP)
- 👤 FIFA Ultimate Team–style player selection (14 players across legend/gold/silver/bronze tiers)
- 📊 Dashboard with your points, live pool total, live match, and recent results
- 📅 Matches & betting — 3 pts exact score · 1 pt correct winner · betting locks 5 min before kickoff
- 🏆 Real-time leaderboard with animated podium
- 👤 Profile with personal stats + admin panel to enter real results

Scoring and bet-locking rules live in `src/lib/data.ts`. State persists to
`localStorage`.

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build
```

Quick demo login: use **"Acceso demo rápido"** on the auth screen
(`demo@polla.com` / `demo123`).

## Match data & results

The app ships with the **complete group stage** — all 72 matches (12 groups × 6),
generated from the group draw and listed **by date** (June 11–25, 2026). Every
match starts as *upcoming* with **no score**: results are never fabricated. A
score only appears once it comes from the live API or is entered in the admin
panel. Points and the leaderboard recompute from real results only.

### Live data (optional)

To pull live results from [football-data.org](https://www.football-data.org):

1. Register for a free API key.
2. Copy `.env.example` to `.env` and set `VITE_FOOTBALL_API_KEY`.
3. `npm run dev`. The Vite dev server proxies `/football → api.football-data.org`
   to avoid CORS. A green **● DATOS EN VIVO** badge appears when live data loads.

Any failure (no key, network error, empty response) falls back to mock data —
see `src/lib/api.ts`.

## Deploy (Vercel)

The app lives at the **repository root**, so Vercel auto-detects it as a Vite
project — no "Root Directory" setting needed.

1. Import the repo at [vercel.com](https://vercel.com) → New Project.
2. Framework is detected as **Vite** (build `npm run build`, output `dist/`,
   defined in `vercel.json`).
3. Optional: add `VITE_FOOTBALL_API_KEY` under Settings → Environment Variables
   for live data. (Note: `VITE_*` vars are bundled into the public client.)
4. Deploy. Every push to `main` redeploys automatically.

## Project structure

```
index.html, vite.config.ts, package.json   # Vite app at root
src/
  lib/
    data.ts      # teams, flags, groups, players, matches, scoring rules
    state.ts     # app state shape, defaults, localStorage persistence
    api.ts       # live data fetch + mock fallback
  components/     # Intro, Auth, PlayerSelect, Dashboard, Matches, Leaderboard, Profile, Admin, Shared, Particles
  App.tsx         # root state + routing
public/uploads/   # trophy + groups images
design/           # original Claude Design handoff bundle (prototype + chat transcripts)
```
