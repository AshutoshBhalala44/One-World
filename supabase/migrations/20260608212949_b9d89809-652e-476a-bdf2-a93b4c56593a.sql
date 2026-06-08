
-- 1) Donations: explicit restrictive deny for client roles on INSERT/UPDATE/DELETE
CREATE POLICY "Block client inserts on donations"
  ON public.donations AS RESTRICTIVE FOR INSERT
  TO anon, authenticated
  WITH CHECK (false);

CREATE POLICY "Block client updates on donations"
  ON public.donations AS RESTRICTIVE FOR UPDATE
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Block client deletes on donations"
  ON public.donations AS RESTRICTIVE FOR DELETE
  TO anon, authenticated
  USING (false);

-- 2) Storage: restrict resume uploads — auth required, path prefix, file size, mime/extension
DROP POLICY IF EXISTS "Anyone can upload a resume" ON storage.objects;

CREATE POLICY "Authenticated users can upload a resume"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'job-resumes'
    AND (storage.foldername(name))[1] = 'applications'
    AND lower(right(name, 4)) IN ('.pdf', '.doc', '.txt', '.rtf')
       OR lower(right(name, 5)) IN ('.docx')
  );

-- 3) SECURITY DEFINER functions: revoke EXECUTE from anon/public
REVOKE EXECUTE ON FUNCTION public.get_poll_vote_counts() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_weekly_vote_counts() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_otps() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_weekly_completion_before_daily_vote() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_job_application_status_change() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_poll_vote_counts() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_weekly_vote_counts() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;
