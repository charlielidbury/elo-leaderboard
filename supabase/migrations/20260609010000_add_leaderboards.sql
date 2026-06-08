-- Phase 1: Add multi-leaderboard support

-- A. Create leaderboards table
create table public.leaderboards (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  slug text not null unique,
  created_by uuid not null references auth.users(id)
);

-- B. Add leaderboard_id to games (nullable first for migration)
alter table public.games
  add column leaderboard_id uuid references public.leaderboards(id);

-- C. Migrate existing data: insert default leaderboard and backfill
-- We need a known user to be the creator. Use the first user who has played a game.
-- If no games exist, this DO block simply creates the leaderboard with a placeholder.
do $$
declare
  default_lb_id uuid;
  creator_id uuid;
begin
  -- Find the first player (who is also an auth user since player.id = auth.users.id)
  select id into creator_id from public.players order by created_at asc limit 1;

  -- If no players exist, we still need to create the leaderboard
  -- Use a fallback: pick any auth user
  if creator_id is null then
    select id into creator_id from auth.users limit 1;
  end if;

  -- Only create the leaderboard if we have a creator
  if creator_id is not null then
    insert into public.leaderboards (name, slug, created_by)
    values ('Omnibus', 'omnibus', creator_id)
    returning id into default_lb_id;

    -- Backfill all existing games
    update public.games set leaderboard_id = default_lb_id where leaderboard_id is null;
  end if;
end $$;

-- D. Make leaderboard_id NOT NULL after backfill
alter table public.games
  alter column leaderboard_id set not null;

-- E. RLS policies for leaderboards
alter table public.leaderboards enable row level security;

create policy "Allow public read access on leaderboards"
  on public.leaderboards for select using (true);

create policy "Allow authenticated insert on leaderboards"
  on public.leaderboards for insert with check (auth.role() = 'authenticated');
