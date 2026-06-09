-- Phase 1: Double-agree game confirmation system

-- A. Add columns to games
ALTER TABLE public.games
  ADD COLUMN status text NOT NULL DEFAULT 'confirmed';

ALTER TABLE public.games
  ADD COLUMN submitted_by uuid REFERENCES auth.users(id);

ALTER TABLE public.games
  ADD COLUMN confirmed_at timestamptz;

ALTER TABLE public.games
  ADD CONSTRAINT games_status_check CHECK (status IN ('pending', 'confirmed'));

-- B. Backfill existing games as confirmed
UPDATE public.games SET status = 'confirmed', submitted_by = c_id WHERE submitted_by IS NULL;
ALTER TABLE public.games ALTER COLUMN submitted_by SET NOT NULL;

-- C. Update RLS policies
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

-- Update: only the NON-submitter can confirm
CREATE POLICY "Allow opponent confirm game" ON public.games
  FOR UPDATE USING (
    status = 'pending'
    AND auth.uid() != submitted_by
    AND (auth.uid() = c_id OR auth.uid() = r_id)
  ) WITH CHECK (
    status = 'confirmed'
  );

-- Delete: either player can delete a pending game (reject/cancel)
CREATE POLICY "Allow players delete pending games" ON public.games
  FOR DELETE USING (
    status = 'pending' AND (auth.uid() = c_id OR auth.uid() = r_id)
  );

-- D. Modify the Elo trigger to respect pending/confirmed status

DROP TRIGGER trg_compute_elo_ratings ON public.games;

CREATE OR REPLACE FUNCTION public.compute_elo_ratings()
RETURNS trigger AS $$
DECLARE
  c_current_rating real;
  r_current_rating real;
  c_to_r_expected real;
  c_to_r_actual real;
  c_to_r_transfer real;
  k_factor constant real := 32;
  initial_rating constant real := 1000;
BEGIN
  -- If not confirmed, set placeholder rating checks and skip Elo computation
  IF NEW.status != 'confirmed' THEN
    NEW.c_rating_check := 0;
    NEW.r_rating_check := 0;
    RETURN NEW;
  END IF;

  -- Get charlie's current rating from their most recent confirmed game
  SELECT CASE
    WHEN g.c_id = NEW.c_id THEN g.c_rating_check
    ELSE g.r_rating_check
  END INTO c_current_rating
  FROM public.games g
  WHERE (g.c_id = NEW.c_id OR g.r_id = NEW.c_id)
    AND g.status = 'confirmed'
    AND g.id != NEW.id
  ORDER BY g.created_at DESC
  LIMIT 1;

  IF c_current_rating IS NULL THEN
    c_current_rating := initial_rating;
  END IF;

  -- Get rushil's current rating from their most recent confirmed game
  SELECT CASE
    WHEN g.c_id = NEW.r_id THEN g.c_rating_check
    ELSE g.r_rating_check
  END INTO r_current_rating
  FROM public.games g
  WHERE (g.c_id = NEW.r_id OR g.r_id = NEW.r_id)
    AND g.status = 'confirmed'
    AND g.id != NEW.id
  ORDER BY g.created_at DESC
  LIMIT 1;

  IF r_current_rating IS NULL THEN
    r_current_rating := initial_rating;
  END IF;

  -- Compute expected score for rushil
  c_to_r_expected := 1.0 / (1.0 + power(10.0, (c_current_rating - r_current_rating) / 400.0));

  -- Determine actual score for rushil
  IF NEW.winner_id = NEW.r_id THEN
    c_to_r_actual := 1.0;
  ELSIF NEW.winner_id = NEW.c_id THEN
    c_to_r_actual := 0.0;
  ELSE
    c_to_r_actual := 0.5;
  END IF;

  -- Transfer = K * (actual - expected)
  c_to_r_transfer := k_factor * (c_to_r_actual - c_to_r_expected);

  -- Set rating checks
  NEW.c_rating_check := round(c_current_rating - c_to_r_transfer);
  NEW.r_rating_check := round(r_current_rating + c_to_r_transfer);

  -- Also update players.rating_check
  UPDATE public.players SET rating_check = NEW.c_rating_check WHERE id = NEW.c_id;
  UPDATE public.players SET rating_check = NEW.r_rating_check WHERE id = NEW.r_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fire on INSERT (for direct confirmed inserts, e.g. backfilled data)
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
