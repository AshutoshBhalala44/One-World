
-- Weekly polls table
CREATE TABLE public.weekly_polls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  week_start_date DATE NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'approved',
  needs_review BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.weekly_polls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read weekly polls" ON public.weekly_polls
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admins can insert weekly polls" ON public.weekly_polls
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update weekly polls" ON public.weekly_polls
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete weekly polls" ON public.weekly_polls
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Weekly poll options table
CREATE TABLE public.weekly_poll_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  weekly_poll_id UUID NOT NULL REFERENCES public.weekly_polls(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE public.weekly_poll_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read weekly poll options" ON public.weekly_poll_options
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admins can insert weekly poll options" ON public.weekly_poll_options
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update weekly poll options" ON public.weekly_poll_options
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete weekly poll options" ON public.weekly_poll_options
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Weekly votes table
CREATE TABLE public.weekly_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  weekly_poll_id UUID NOT NULL REFERENCES public.weekly_polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES public.weekly_poll_options(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(weekly_poll_id, user_id)
);

ALTER TABLE public.weekly_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own weekly vote" ON public.weekly_votes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own weekly votes" ON public.weekly_votes
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Secure function for aggregated weekly vote counts
CREATE OR REPLACE FUNCTION public.get_weekly_vote_counts()
RETURNS TABLE(weekly_poll_id uuid, option_id uuid, vote_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT v.weekly_poll_id, v.option_id, count(*) AS vote_count
  FROM weekly_votes v
  GROUP BY v.weekly_poll_id, v.option_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_weekly_vote_counts() TO anon, authenticated;
