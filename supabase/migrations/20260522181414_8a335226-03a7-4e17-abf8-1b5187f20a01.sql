-- 1. otp_codes: explicit deny-all SELECT (defense in depth)
DROP POLICY IF EXISTS "Deny all reads on otp_codes" ON public.otp_codes;
CREATE POLICY "Deny all reads on otp_codes"
ON public.otp_codes
FOR SELECT
TO anon, authenticated
USING (false);

-- Also explicitly deny INSERT/UPDATE/DELETE from clients
DROP POLICY IF EXISTS "Deny all writes on otp_codes" ON public.otp_codes;
CREATE POLICY "Deny all writes on otp_codes"
ON public.otp_codes
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

-- 2. question_submissions: admin read policy for moderation
DROP POLICY IF EXISTS "Admins can read all submissions" ON public.question_submissions;
CREATE POLICY "Admins can read all submissions"
ON public.question_submissions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update submissions" ON public.question_submissions;
CREATE POLICY "Admins can update submissions"
ON public.question_submissions
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 3. Vote count RPCs: restrict to authenticated users only
REVOKE EXECUTE ON FUNCTION public.get_poll_vote_counts() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_weekly_vote_counts() FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_poll_vote_counts() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_weekly_vote_counts() TO authenticated;

-- 4. Internal SECURITY DEFINER helpers: revoke direct EXECUTE from clients
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_otps() FROM anon, authenticated, PUBLIC;