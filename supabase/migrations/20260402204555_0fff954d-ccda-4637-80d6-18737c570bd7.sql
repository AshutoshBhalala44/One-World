
-- Drop the problematic view
DROP VIEW IF EXISTS public.poll_vote_counts;

-- Create a security definer function to return aggregated vote counts
CREATE OR REPLACE FUNCTION public.get_poll_vote_counts()
RETURNS TABLE(poll_id uuid, option_id uuid, vote_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT v.poll_id, v.option_id, count(*) AS vote_count
  FROM votes v
  GROUP BY v.poll_id, v.option_id;
$$;

-- Grant execute to both anon and authenticated
GRANT EXECUTE ON FUNCTION public.get_poll_vote_counts() TO anon, authenticated;
