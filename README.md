# Mundial 2026

A read-only tracker for the 2026 FIFA World Cup — live scores, schedule, group standings, and the knockout bracket.

Built with Next.js and backed by the [football-data.org](https://www.football-data.org/) API.

## Features

- **Schedule** — browse every match by date, with a calendar picker to jump straight to any tournament day. Live matches auto-refresh.
- **Groups** — standings for all 12 groups (A–L), with qualifying teams highlighted.
- **Bracket** — full knockout tree from the Round of 32 through the Final, including TBD slots before teams qualify.
- **Live updates** — matches in progress poll for fresh scores every 60 seconds; polling pauses when the tab isn't visible.
- **Timezone-aware** — kickoff times and "today" are computed in the viewer's local timezone.

## Stack

- [Next.js](https://nextjs.org/) (App Router, TypeScript, `src/` directory)
- [Tailwind CSS](https://tailwindcss.com/) — dark theme
- [Framer Motion](https://motion.dev/) — animations and transitions
- [Lucide](https://lucide.dev/) — icons
- [Vitest](https://vitest.dev/) + Testing Library — unit and integration tests
- Deployed on [Vercel](https://vercel.com/)

## Getting started

Requires Node 20+.

```bash
npm install
```

Create `.env.local` with a free [football-data.org](https://www.football-data.org/client/register) API token:

```
FOOTBALL_DATA_API_TOKEN=your_token_here
```

Run the dev server:

```bash
npm run dev
```

Open [localhost:3000](http://localhost:3000).

## Scripts

```bash
npm run dev       # dev server with Turbopack
npm run build     # production build
npm run start     # serve production build
npm run lint      # ESLint
npm test          # run all tests
npm run test:watch       # watch mode
npm run test:coverage    # coverage report
```

## Architecture

All three tabs follow the same data flow:

```
football-data.org v4
        ↓ (server-side only, token never exposed to the client)
lib/football/  →  normalize raw API types into domain types
        ↓
app/api/*  route handlers (60s/300s cache + in-memory TTL guard)
        ↓
Server components (schedule/groups/bracket pages)
        ↓ initialData prop
Client components  →  poll for live updates, render UI
```

- **Server-side API proxy** — only `app/api/*` route handlers call football-data.org. Responses are cached (Next `fetch` revalidate + an in-memory TTL guard) so all visitors share one upstream call per cache window, keeping well under the free tier's 10 req/min limit.
- **Normalization boundary** — raw API shapes live in `types/football.ts`; everything downstream uses the domain types in `types/domain.ts`. Status/venue/group normalization happens in `lib/football/endpoints.ts`.
- **Client polling** — only runs while at least one visible match is live, and pauses when the tab is hidden.

## Testing

```bash
npm test                              # full suite
npm test -- path/to/file.test.ts      # single file
```
