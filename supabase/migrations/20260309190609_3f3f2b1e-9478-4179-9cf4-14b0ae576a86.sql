
-- Polls table: one poll per day
CREATE TABLE public.polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  active_date date NOT NULL UNIQUE,
  category text NOT NULL DEFAULT 'general',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Poll options
CREATE TABLE public.poll_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid REFERENCES public.polls(id) ON DELETE CASCADE NOT NULL,
  label text NOT NULL,
  sort_order int NOT NULL DEFAULT 0
);

-- Votes: one vote per user per poll
CREATE TABLE public.votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid REFERENCES public.polls(id) ON DELETE CASCADE NOT NULL,
  option_id uuid REFERENCES public.poll_options(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(poll_id, user_id)
);

-- User-submitted questions
CREATE TABLE public.question_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  question text NOT NULL,
  option_1 text NOT NULL,
  option_2 text NOT NULL,
  option_3 text,
  option_4 text,
  category text NOT NULL DEFAULT 'general',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_submissions ENABLE ROW LEVEL SECURITY;

-- Polls: readable by everyone
CREATE POLICY "Anyone can read polls" ON public.polls FOR SELECT TO anon, authenticated USING (true);

-- Poll options: readable by everyone
CREATE POLICY "Anyone can read poll options" ON public.poll_options FOR SELECT TO anon, authenticated USING (true);

-- Votes: users can insert their own vote
CREATE POLICY "Users can insert own vote" ON public.votes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
-- Votes: users can read their own votes
CREATE POLICY "Users can read own votes" ON public.votes FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Question submissions: users can insert
CREATE POLICY "Users can submit questions" ON public.question_submissions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
-- Question submissions: users can read their own
CREATE POLICY "Users can read own submissions" ON public.question_submissions FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Create a view for vote counts (public)
CREATE OR REPLACE VIEW public.poll_vote_counts AS
SELECT poll_id, option_id, COUNT(*) as vote_count
FROM public.votes
GROUP BY poll_id, option_id;

-- Allow everyone to read vote counts
GRANT SELECT ON public.poll_vote_counts TO anon, authenticated;
