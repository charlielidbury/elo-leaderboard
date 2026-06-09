## Double-Agree System: Implementation Plan

### Current Architecture Summary

The app is a Next.js 15 + Supabase leaderboard application where:
- **Game submission**: One authenticated player selects an opponent, picks win/loss/draw, submits. The game is immediately inserted into the `games` table.
- **Elo trigger**: A Postgres `BEFORE INSERT` trigger (`trg_compute_elo_ratings`) computes Elo on every game insert, writing `c_rating_check` and `r_rating_check` to the row, and also updating `players.rating_check`.
- **Rating display**: The frontend recalculates ratings from scratch using `calculatePlayerRatings()` in `lib/elo.ts` by replaying all games chronologically. The `rating_check` columns are integrity checks, not the source of truth for the UI.
- **RLS**: Games and players are publicly readable. Insert requires authentication, but there is no check that the inserting user is actually one of the players.
- **No realtime**: Data fetching uses TanStack Query with 5-minute stale time and manual invalidation after mutations.
- **Tabs**: Three tabs exist -- "Leaderboard", "History", "Add Game" -- controlled via `?tab=` query param.

### Key Architectural Observations

1. **The Elo trigger fires on INSERT.** Currently, every game insert immediately mutates ratings. The trigger must be changed to only fire (or only take effect) when a game is confirmed.

2. **Frontend recalculates Elo from game history.** The `getPlayersGames` function fetches all games and replays them through `calculatePlayerRatings`. This means the frontend naturally excludes pending games from rating calculations if we simply filter them out of the query.

3. **No RLS on who can insert a game.** Currently any authenticated user can insert a game claiming any two player IDs. The double-agree system partially addresses this (the opponent must confirm), but we should also add an RLS check that the submitter is one of the two players.

4. **Player identity = auth user ID.** The `players.id` column matches `auth.users.id`, so we can use `auth.uid()` in RLS policies.

---

### Part 1: Database Schema Changes

**New migration file**: `supabase/migrations/XXXXXX_add_game_confirmation.sql`

**A. Add columns to games:**

```sql
ALTER TABLE public.games
  ADD COLUMN status text NOT NULL DEFAULT 'confirmed',
  ADD COLUMN submitted_by uuid REFERENCES auth.users(id),
  ADD COLUMN finalised_at timestamptz;

ALTER TABLE public.games
  ADD CONSTRAINT games_status_check CHECK (status IN ('pending', 'confirmed', 'rejected'));
```

- `status`: `'pending'` | `'confirmed'` | `'rejected'`
- `submitted_by`: who submitted the game
- `finalised_at`: when it was confirmed or rejected (null while pending)

**B. Backfill existing games:**

```sql
UPDATE public.games SET status = 'confirmed', submitted_by = c_id, finalised_at = created_at WHERE submitted_by IS NULL;
ALTER TABLE public.games ALTER COLUMN submitted_by SET NOT NULL;
```

**C. Update RLS policies:**

```sql
DROP POLICY "Allow public read access on games" ON public.games;
DROP POLICY "Allow authenticated insert on games" ON public.games;

-- Confirmed games: publicly readable
CREATE POLICY "Allow public read confirmed games" ON public.games
  FOR SELECT USING (status = 'confirmed');

-- Pending games: only visible to the two players involved
CREATE POLICY "Allow players read pending games" ON public.games
  FOR SELECT USING (
    status = 'pending' AND (auth.uid() = c_id OR auth.uid() = r_id)
  );

-- Insert: submitter must be one of the two players
CREATE POLICY "Allow player insert own games" ON public.games
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
    AND auth.uid() = submitted_by
    AND (auth.uid() = c_id OR auth.uid() = r_id)
  );

-- Update: only the NON-submitter can confirm or reject
CREATE POLICY "Allow opponent finalise game" ON public.games
  FOR UPDATE USING (
    status = 'pending'
    AND auth.uid() != submitted_by
    AND (auth.uid() = c_id OR auth.uid() = r_id)
  ) WITH CHECK (
    status IN ('confirmed', 'rejected')
  );

-- Rejected games: only visible to the two players involved
CREATE POLICY "Allow players read rejected games" ON public.games
  FOR SELECT USING (
    status = 'rejected' AND (auth.uid() = c_id OR auth.uid() = r_id)
  );
```

**D. Modify the Elo trigger:**

The trigger must only compute ratings for confirmed games. Pending games get placeholder rating checks.

```sql
DROP TRIGGER trg_compute_elo_ratings ON public.games;

CREATE OR REPLACE FUNCTION public.compute_elo_ratings()
RETURNS trigger AS $$
DECLARE
  -- ... existing variables ...
BEGIN
  IF NEW.status != 'confirmed' THEN
    NEW.c_rating_check := 0;
    NEW.r_rating_check := 0;
    RETURN NEW;
  END IF;

  -- ... existing Elo computation unchanged ...

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fire on INSERT (for direct confirmed inserts)
CREATE TRIGGER trg_compute_elo_ratings_insert
  BEFORE INSERT ON public.games
  FOR EACH ROW
  EXECUTE FUNCTION public.compute_elo_ratings();

-- Fire on UPDATE when status changes to confirmed
CREATE TRIGGER trg_compute_elo_ratings_update
  BEFORE UPDATE ON public.games
  FOR EACH ROW
  WHEN (OLD.status = 'pending' AND NEW.status = 'confirmed')
  EXECUTE FUNCTION public.compute_elo_ratings();
```

---

### Part 2: Backend Changes

**`lib/backend.ts`:**

- `getPlayersGames(leaderboardId)` adds `.eq("status", "confirmed")` filter
- New `pendingGamesQuery(leaderboardId)` -- fetches pending games (RLS ensures only user's games returned)
- `registerGameMutation` updated to insert with `status: "pending"` and `submitted_by`
- New `confirmGameMutation(gameId)` -- updates status to 'confirmed', sets `finalised_at`
- New `rejectGameMutation(gameId)` -- updates status to 'rejected', sets `finalised_at`

---

### Part 3: UI/UX Design

#### 3.1 Submitting a Game (Submitter's Experience)

Flow is identical until submit. After submit:

**QR code screen**: Instead of redirecting to history, replace the add-game form with a QR code the opponent can scan. The QR encodes `/leaderboard/[slug]/confirm/[gameId]`. Show below the QR:
- Game summary (e.g. "Charlie beat Rushil")
- "Done" button to dismiss and return to the Add Game tab

**QR confirm page** (`app/leaderboard/[slug]/confirm/[gameId]/page.tsx`):
- Shows game details (players, claimed result, who submitted)
- Confirm and Reject buttons
- Must be logged in as the opponent — show login prompt if not
- On confirm: toast, redirect to leaderboard
- On reject: confirmation dialog, then toast, redirect to leaderboard

**QR library**: Use a lightweight client-side QR generator (e.g. `qrcode.react`)

Rating animation still plays as a projection before submit. After submit, the QR screen replaces it.

#### 3.2 Confirming a Game (Opponent's Experience)

**A. Notification banner** at the top of the leaderboard page:
```
┌──────────────────────────────────────────────┐
│  You have 2 games to confirm       [Review]  │
└──────────────────────────────────────────────┘
```
- Only shows for users with unconfirmed games where they are NOT the submitter
- "Review" links to history tab

**B. Pending section in History tab** (above confirmed games):
```
PENDING CONFIRMATION
┌──────────────────────────────────────────────┐
│  Charlie    1 - 0    Rushil                  │
│  Submitted by Charlie · 2 hours ago          │
│  [Confirm] [Reject]                          │
└──────────────────────────────────────────────┘

GAME HISTORY
│  ...confirmed games...                       │
```

- **For the opponent**: Confirm and Reject buttons
- **For the submitter**: "Waiting for {opponent}..." text and a Cancel button (sets status to 'rejected')
- Reject shows a confirmation dialog before rejecting

**No fourth tab.** Pending games are a section within History.

#### 3.3 Visual Differentiation

Pending games: slightly desaturated background, "Pending" badge, clock icon.

#### 3.4 What If Someone Never Confirms?

V1: No auto-expiry. Pending games persist. Submitter can cancel. Social pressure resolves it.

#### 3.5 Multiple Pending Games, Same Players

Allowed. On the Add Game tab, if the user has any pending games in this leaderboard, show a toast: "{N} pending games" that links to the history tab when clicked. Informational only, not blocking.

#### 3.6 Late Confirmation and Elo Ordering

Frontend replays from scratch in `created_at` order -- always correct. The `rating_check` columns may be slightly inaccurate for late confirmations (acceptable since they're integrity checks, not source of truth).

---

### Part 4: Implementation Sequence

1. **Database migration** -- add columns, backfill, update RLS, modify trigger
2. **Backend data layer** -- filter by status, add pending query, add confirm/reject mutations
3. **Add Game flow** -- pass `submitted_by`, update toast/messaging
4. **Pending games UI in History** -- pending section with confirm/reject buttons
5. **Notification banner** -- on leaderboard page for users with pending games
6. **Polish** -- warning for multiple pending games, thorough RLS testing

---

### Edge Cases and Decisions

| Edge Case | Decision |
|---|---|
| Game never confirmed | Persists indefinitely; submitter can cancel |
| Multiple pending games, same players | Allowed. Soft warning after 3+ |
| Late confirmation Elo order | Frontend replays in `created_at` order -- always correct |
| Rating animation accuracy | Shows projection based on current ratings. Acceptable approximation |
| Submitter tries to confirm own game | RLS prevents: update policy requires `auth.uid() != submitted_by` |
| Third party sees pending game | RLS prevents: select requires user to be `c_id` or `r_id` |
| Third party fabricates game | RLS prevents: insert requires `auth.uid() = submitted_by` and in `(c_id, r_id)` |
| Reject action | Status set to 'rejected', `finalised_at` set. Game kept in DB but hidden from public. Either player can reject. Confirmation dialog prevents accidents |

### Critical Files

- `supabase/migrations/20260609000000_add_rating_trigger.sql` -- Elo trigger must respect pending/confirmed
- `lib/backend.ts` -- queries need status filtering, new pending/confirm/reject mutations
- `components/main/add-game.tsx` -- submit flow passes `submitted_by`, pending-aware toast
- `components/main/history.tsx` -- pending games section with confirm/reject
- `app/leaderboard/[slug]/page.tsx` -- notification banner
