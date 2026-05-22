
CREATE OR REPLACE FUNCTION public.enforce_weekly_completion_before_daily_vote()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  has_weekly boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.weekly_votes wv
    JOIN public.weekly_polls wp ON wp.id = wv.weekly_poll_id
    WHERE wv.user_id = NEW.user_id
      AND CURRENT_DATE >= wp.week_start_date
      AND (wp.end_date IS NULL OR CURRENT_DATE <= wp.end_date)
  ) INTO has_weekly;

  IF NOT has_weekly THEN
    RAISE EXCEPTION 'You must complete the current Global Topic before voting on the Daily Challenge.'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_weekly_before_daily ON public.votes;
CREATE TRIGGER enforce_weekly_before_daily
BEFORE INSERT ON public.votes
FOR EACH ROW
EXECUTE FUNCTION public.enforce_weekly_completion_before_daily_vote();
