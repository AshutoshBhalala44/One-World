
CREATE TABLE public.job_application_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.job_applications(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  previous_status public.job_application_status,
  new_status public.job_application_status,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.job_application_reviews TO authenticated;
GRANT ALL ON public.job_application_reviews TO service_role;

ALTER TABLE public.job_application_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view review history"
  ON public.job_application_reviews FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can add review entries"
  ON public.job_application_reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    AND reviewer_id = auth.uid()
  );

CREATE INDEX job_application_reviews_app_idx
  ON public.job_application_reviews (application_id, created_at DESC);

-- Auto-log status changes
CREATE OR REPLACE FUNCTION public.log_job_application_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.job_application_reviews
      (application_id, reviewer_id, previous_status, new_status, note)
    VALUES
      (NEW.id, auth.uid(), OLD.status, NEW.status, NULL);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER job_applications_log_status_change
  AFTER UPDATE OF status ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION public.log_job_application_status_change();
