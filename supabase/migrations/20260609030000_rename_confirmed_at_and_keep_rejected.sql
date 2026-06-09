-- 1. Rename confirmed_at to finalised_at
ALTER TABLE public.games RENAME COLUMN confirmed_at TO finalised_at;

-- 2. Backfill finalised_at for existing confirmed games
UPDATE public.games SET finalised_at = created_at WHERE status = 'confirmed' AND finalised_at IS NULL;

-- 3. Update the CHECK constraint to allow 'rejected'
ALTER TABLE public.games DROP CONSTRAINT games_status_check;
ALTER TABLE public.games ADD CONSTRAINT games_status_check CHECK (status IN ('pending', 'confirmed', 'rejected'));

-- 4. Remove the DELETE policy (we no longer delete games on reject)
DROP POLICY "Allow players delete pending games" ON public.games;

-- 5. Add SELECT policy for rejected games (visible to participants only)
CREATE POLICY "Allow players read rejected games" ON public.games
  FOR SELECT USING (
    status = 'rejected' AND (auth.uid() = c_id OR auth.uid() = r_id)
  );

-- 6. Update the UPDATE policy: either player can update a pending game to confirmed or rejected
--    (the opponent confirms, either player can reject/cancel)
DROP POLICY "Allow opponent confirm game" ON public.games;

CREATE POLICY "Allow players update pending games" ON public.games
  FOR UPDATE USING (
    status = 'pending'
    AND (auth.uid() = c_id OR auth.uid() = r_id)
  ) WITH CHECK (
    status IN ('confirmed', 'rejected')
    -- Only the non-submitter can confirm; either player can reject
    AND (
      (status = 'rejected')
      OR (status = 'confirmed' AND auth.uid() != submitted_by)
    )
  );
