## Multi-Leaderboard Support: Implementation Plan

### Current Architecture Summary

The app today is hardcoded to a single leaderboard called "Symbolica Chess." The key structures are:

- **Database**: Two tables -- `players` (id=auth user UUID, name, rating_check) and `games` (c_id, r_id, winner_id, rating checks). Players are identified by their Supabase auth user ID. There is no leaderboard concept in the schema at all.
- **Backend** (`lib/backend.ts`): `getPlayersGames()` fetches ALL players and ALL games from the entire database, then recalculates Elo ratings from scratch. Elo is never stored — it's always derived from game history.
- **Frontend**: `app/page.tsx` is the single page, hardcoded to title "Symbolica Chess". Tab state is managed via `?tab=` query parameter. Components directly import `playersQuery` and `gamesQuery` from `lib/backend.ts` with static query keys `["players"]` and `["games"]`.
- **Player identity**: A player row's `id` IS the Supabase auth user's UUID (see `usePlayer` hook line 30: `.eq("id", user.id)`). This means one auth user = one player row = one name across the whole system.
- **Auth**: Any authenticated user can insert games and players. No ownership/admin concept exists. RLS policies simply check `auth.role() = 'authenticated'`.

### Key Design Decisions

**1. All players exist in all leaderboards.**
There is no per-leaderboard membership. The `players` table stays as-is with no leaderboard FK. A player's games in a given leaderboard determine their rating for that leaderboard (computed from game history, never stored).

**2. Leaderboard creator has elevated permissions.**
The `leaderboards` table has a `created_by` FK to the auth user who created it. Only the creator can perform admin actions (e.g. deleting games, managing the leaderboard). All other authenticated users can add games and join as players.

**3. Elo is always computed, never stored.**
Ratings are recalculated from game history on every page load, scoped to the leaderboard's games. No rating columns on any new tables. The existing `rating_check` fields on `players` and `games` are integrity checks, not sources of truth.

**4. URL structure: `/leaderboard/[slug]`**
Using `/leaderboard/[slug]` rather than `/[slug]` avoids route conflicts with `/explanation`, `/clock`, and any future top-level routes. The slug is a human-readable URL identifier (e.g., `omnibus`).

---

### Phase 1: Database Schema Migration

**A. Add a `leaderboards` table:**
```sql
create table public.leaderboards (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  slug text not null unique,
  created_by uuid not null references auth.users(id)
);
```

**B. Add `leaderboard_id` to `games`:**
```sql
alter table public.games
  add column leaderboard_id uuid references public.leaderboards(id);
```

**C. Migrate existing data:**
- Insert a row into `leaderboards` for "Symbolica Chess" (slug `omnibus`).
- Update all existing `games` rows to set `leaderboard_id` to the new leaderboard's ID.
- Make `leaderboard_id` NOT NULL after backfill.

**D. Update RLS policies:**
- `leaderboards`: public read, authenticated insert.
- `games`: public read, authenticated insert (existing policy already covers this).

**E. No changes to `players` table.** All players are global.

**File to create:** `supabase/migrations/XXXXXX_add_leaderboards.sql`
**File to regenerate:** `database.types.ts` (via `pnpm gen`)

---

### Phase 2: Backend Data Layer Changes

**File: `lib/database.ts`**
- Add `Leaderboard` type from the new table.
- `Game` type gains a `leaderboard_id` field.
- `Player` type unchanged.

**File: `lib/backend.ts`**
- `getPlayersGames(leaderboardId)` — filter games by `leaderboard_id`, keep fetching all players (they're global).
- `playersQuery(leaderboardId)` and `gamesQuery(leaderboardId)` become factory functions with leaderboard-scoped query keys.
- `registerGameMutation` must include `leaderboard_id` in the insert payload.
- Add new queries: `leaderboardBySlugQuery(slug)`, `allLeaderboardsQuery()`, `createLeaderboardMutation`.

**File: `lib/elo.ts`**
- No changes. Pure calculation, leaderboard-agnostic.

---

### Phase 3: Routing and Page Structure

**New route: `app/leaderboard/[slug]/page.tsx`**
- Replaces `app/page.tsx` as the main leaderboard view.
- Uses `useParams()` to extract slug, fetches leaderboard by slug.
- Passes leaderboard ID down via `LeaderboardContext`.
- Title comes from `leaderboard.name` instead of hardcoded "Symbolica Chess".

**Updated `app/page.tsx` — redirects to default leaderboard:**
- Hardcoded redirect to `/leaderboard/omnibus`.

**New context: `LeaderboardContext`**
- Provides `{ leaderboardId, leaderboard }` to all child components.
- Created by `app/leaderboard/[slug]/layout.tsx`.
- 404 if slug not found.

---

### Phase 4: UI Component Updates

**`components/main/leaderboard.tsx`**
- Use `useLeaderboard()` from context.
- Scope players query to show only players who have games in this leaderboard (filter client-side from global players list, or show all and let empty ratings sort to bottom).

**`components/main/history.tsx`**
- Scope games query to current leaderboard.

**`components/main/add-game.tsx`**
- Submit mutation includes `leaderboard_id`.
- Player selector shows all players (since all players are global).

**`hooks/use-player.tsx`**
- Stays global — fetches the player row for the current auth user regardless of leaderboard.
- `createPlayer` still creates a global player row.

**`components/player-setup-modal.tsx`**
- Stays as-is — prompts first-time users to set up their player name globally.

**`components/login-button.tsx`, `components/user-dropdown.tsx`**
- Minimal changes. Name editing remains global.

**New component: `components/create-leaderboard.tsx`**
- Form: name + slug. Authenticated users only.
- After creation, redirect to `/leaderboard/[new-slug]`.

**New component: `components/leaderboard-list.tsx`**
- Landing page list of all leaderboards with links.

---

### Phase 5: Polish and Edge Cases

- **Redirect old URLs**: `/` redirects to `/leaderboard/omnibus` (hardcoded default).
- **Metadata**: Dynamic page title per leaderboard via `generateMetadata`.
- **Sharing**: Each leaderboard has a shareable URL.
- **Admin actions**: Creator (identified by `created_by`) can delete games, edit leaderboard name/slug. Future feature, but schema supports it.
- **Column rename**: Consider renaming `c_id`/`r_id` to `player1_id`/`player2_id` (currently named after specific people).

---

### Migration Path Summary

1. Deploy database migration (new `leaderboards` table, `leaderboard_id` on `games`, migrate existing data).
2. Regenerate `database.types.ts` via `pnpm gen`.
3. Refactor `lib/backend.ts` to accept leaderboard scoping.
4. Create `app/leaderboard/[slug]/page.tsx` route and `LeaderboardContext`.
5. Update components to consume leaderboard context.
6. Convert `app/page.tsx` to landing page.
7. Add create-leaderboard flow.

### Risks and Considerations

- **Elo recalculation cost**: Currently recalculates from ALL games on every load. Per-leaderboard scoping actually helps — each leaderboard only processes its own games.
- **Player visibility**: Since all players are global, a leaderboard may show players who've never played in it. The UI should either filter to players with >=1 game in this leaderboard, or show all with a 1000 default rating.
- **The `c_id`/`r_id` naming**: Named after specific people ("charlie"/"rushil"). This is an intentional inside joke — do not rename.

### Critical Files

- `supabase/migrations/20260608214710_init_schema.sql` — current schema
- `lib/backend.ts` — all data fetching, needs leaderboard scoping
- `app/page.tsx` — becomes landing page; new `app/leaderboard/[slug]/page.tsx` takes over
- `lib/database.ts` — type definitions for new `Leaderboard` type
- `hooks/use-player.tsx` — stays global, minimal changes
