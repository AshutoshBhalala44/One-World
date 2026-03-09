
-- Fix security definer view
CREATE OR REPLACE VIEW public.poll_vote_counts 
WITH (security_invoker = true) AS
SELECT poll_id, option_id, COUNT(*) as vote_count
FROM public.votes
GROUP BY poll_id, option_id;

-- Allow anon to read vote counts via a policy on the underlying table
CREATE POLICY "Anyone can read vote counts" ON public.votes FOR SELECT TO anon USING (true);
