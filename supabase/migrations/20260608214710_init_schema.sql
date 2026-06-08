create table public.players (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text not null,
  rating_check real not null default 0
);

create table public.games (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  c_id uuid not null,
  r_id uuid not null,
  c_rating_check real not null,
  r_rating_check real not null,
  winner_id uuid,
  constraint games_player1_id_fkey foreign key (c_id) references public.players(id),
  constraint games_player2_id_fkey foreign key (r_id) references public.players(id),
  constraint games_winner_id_fkey foreign key (winner_id) references public.players(id)
);

alter table public.players enable row level security;
alter table public.games enable row level security;

create policy "Allow public read access on players" on public.players for select using (true);
create policy "Allow public read access on games" on public.games for select using (true);
create policy "Allow authenticated insert on games" on public.games for insert with check (auth.role() = 'authenticated');
create policy "Allow authenticated insert on players" on public.players for insert with check (auth.role() = 'authenticated');
create policy "Allow authenticated update on players" on public.players for update using (auth.role() = 'authenticated');
