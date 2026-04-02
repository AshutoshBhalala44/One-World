
-- Enable pgcrypto for OTP hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. otp_codes: RLS is already enabled but has no policies.
--    Since only edge functions (service role) access this table, deny-all is correct.
--    No policies needed — service role bypasses RLS.

-- 2. votes: drop the overly permissive anon SELECT policy
DROP POLICY IF EXISTS "Anyone can read vote counts" ON votes;

-- 3. poll_vote_counts: enable RLS and add public read policy
ALTER VIEW public.poll_vote_counts SET (security_invoker = false);
-- Views don't support RLS directly, so we grant SELECT to anon and authenticated
GRANT SELECT ON public.poll_vote_counts TO anon, authenticated;
