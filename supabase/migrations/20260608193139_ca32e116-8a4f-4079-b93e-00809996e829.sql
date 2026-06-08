
CREATE TYPE public.job_application_status AS ENUM ('new', 'in_review', 'shortlisted', 'rejected', 'hired');

ALTER TABLE public.job_applications
  ADD COLUMN status public.job_application_status NOT NULL DEFAULT 'new',
  ADD COLUMN admin_notes TEXT;

CREATE INDEX job_applications_status_idx ON public.job_applications (status, created_at DESC);
