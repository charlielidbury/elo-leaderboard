Chess Elo leaderboard app. Vercel frontend, Supabase backend, CLIs for both installed via nix flake.

## Stack

- Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- Supabase for auth and Postgres database
- Elo rating system for ranking players

## Project layout

- `app/` — Next.js pages (`page.tsx` is the main leaderboard, `explanation/` has rating methodology)
- `components/main/` — core UI: `leaderboard.tsx`, `add-game.tsx`, `history.tsx`
- `components/` — auth components (`login-button.tsx`, `user-dropdown.tsx`), theme, UI primitives in `ui/`
- `lib/backend.ts` — Supabase queries, game/player fetching, game submission
- `lib/database.ts` — Supabase client, type definitions (`Player`, `Game`)
- `lib/elo.ts` — Elo rating calculation (K=32, initial 1000)
- `database.types.ts` — auto-generated Supabase types (`pnpm gen` to regenerate)

## Environment

- Requires `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`
- `pnpm dev` to run, `pnpm build` to build

## Rules

- Save screenshots and other temporary files to `/tmp`, not the project directory.
