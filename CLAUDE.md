Chess Elo leaderboard app. Vercel frontend, Supabase backend, CLIs for both installed via nix flake.

## Stack

- Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- Supabase for auth and Postgres database
- Elo rating system for ranking players

## Project layout

- `app/` — Next.js pages (`page.tsx` is the main leaderboard, `explanation/` has rating methodology)
- `app/leaderboard/[slug]/` — dynamic leaderboard route
- `app/leaderboards/` — leaderboard listing and creation
- `app/clock/` — chess clock
- `components/main/` — core UI: `leaderboard.tsx`, `add-game.tsx`, `history.tsx`
- `components/` — auth components (`login-button.tsx`, `user-dropdown.tsx`), theme, UI primitives in `ui/`
- `lib/backend.ts` — Supabase queries, game/player fetching, game submission
- `lib/database.ts` — Supabase client, type definitions (`Player`, `Game`)
- `lib/elo.ts` — Elo rating calculation (K=32, initial 1000)
- `database.types.ts` — auto-generated Supabase types (`pnpm gen` to regenerate)
- `supabase/migrations/` — database schema migrations
- `docs/` — planning docs (merged alongside their implementations)

## Environment

- Requires `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`
- `pnpm dev` to run, `pnpm build` to build

## Dev servers in worktrees

Worktree agents should start their dev server from inside the worktree directory on a unique port:

```sh
eval "$(direnv export bash 2>/dev/null)" && pnpm install && pnpm dev --port <PORT>
```

When the parent agent needs to start a worktree's dev server externally, `cd` into the worktree first — `pnpm --dir` does not work with `next dev`, and `direnv export` resolves relative to cwd so it must run from a directory with `.envrc` or the project root.

## Rules

- Save screenshots and other temporary files to `.playwright-mcp/`, not the project directory.
- The top-level agent should orchestrate, not implement. Spawn implementer sub-agents for code changes and tester sub-agents for verification (using Playwright MCP). Reuse both via SendMessage (not new Agent calls) so they retain context.
- Give the implementer the tester's agentId so they can message each other directly — the implementer makes a change, messages the tester to verify, and iterates based on feedback.
- Sub-agents can message each other via agentId (not by name). Names are only resolvable by the parent and only while the agent is running.
- All database schema changes must go through Supabase migrations in `supabase/migrations/`. Create a migration file, then push with `supabase db push`. Never modify the database directly.

## Notes

- `c_id` and `r_id` in the games table stand for "charlie" and "rushil" — this is an inside joke. Do not rename them.
