-- Make c_rating_check and r_rating_check have defaults so clients don't need to send them
alter table public.games alter column c_rating_check set default 0;
alter table public.games alter column r_rating_check set default 0;

-- Create function that computes Elo ratings server-side
create or replace function public.compute_elo_ratings()
returns trigger as $$
declare
  c_current_rating real;
  r_current_rating real;
  c_to_r_expected real;
  c_to_r_actual real;
  c_to_r_transfer real;
  k_factor constant real := 32;
  initial_rating constant real := 1000;
begin
  -- Get charlie's current rating from their most recent game
  select case
    when g.c_id = new.c_id then g.c_rating_check
    else g.r_rating_check
  end into c_current_rating
  from public.games g
  where g.c_id = new.c_id or g.r_id = new.c_id
  order by g.created_at desc
  limit 1;

  if c_current_rating is null then
    c_current_rating := initial_rating;
  end if;

  -- Get rushil's current rating from their most recent game
  select case
    when g.c_id = new.r_id then g.c_rating_check
    else g.r_rating_check
  end into r_current_rating
  from public.games g
  where g.c_id = new.r_id or g.r_id = new.r_id
  order by g.created_at desc
  limit 1;

  if r_current_rating is null then
    r_current_rating := initial_rating;
  end if;

  -- Compute expected score for rushil (the "to" player in pointsTransfer(charlie, rushil, winner))
  -- toExpected = 1 / (1 + 10^((from.rating - to.rating) / 400))
  c_to_r_expected := 1.0 / (1.0 + power(10.0, (c_current_rating - r_current_rating) / 400.0));

  -- Determine actual score for rushil
  -- winner === to (rushil): result = 1; winner === from (charlie): result = 0; draw: result = 0.5
  if new.winner_id = new.r_id then
    c_to_r_actual := 1.0;
  elsif new.winner_id = new.c_id then
    c_to_r_actual := 0.0;
  else
    c_to_r_actual := 0.5;
  end if;

  -- Transfer = K * (actual - expected)
  c_to_r_transfer := k_factor * (c_to_r_actual - c_to_r_expected);

  -- Set rating checks: charlie loses transfer, rushil gains transfer
  new.c_rating_check := round(c_current_rating - c_to_r_transfer);
  new.r_rating_check := round(r_current_rating + c_to_r_transfer);

  -- Also update players.rating_check for both players
  update public.players set rating_check = new.c_rating_check where id = new.c_id;
  update public.players set rating_check = new.r_rating_check where id = new.r_id;

  return new;
end;
$$ language plpgsql;

-- Create the trigger
create trigger trg_compute_elo_ratings
  before insert on public.games
  for each row
  execute function public.compute_elo_ratings();
