CREATE TABLE public.donations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text,
  amount_cents integer NOT NULL CHECK (amount_cents >= 50),
  currency text NOT NULL DEFAULT 'usd',
  status text NOT NULL DEFAULT 'pending',
  stripe_session_id text UNIQUE,
  stripe_payment_intent_id text,
  environment text NOT NULL DEFAULT 'sandbox',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_donations_user_id ON public.donations(user_id);
CREATE INDEX idx_donations_session_id ON public.donations(stripe_session_id);

GRANT SELECT ON public.donations TO authenticated;
GRANT ALL ON public.donations TO service_role;

ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own donations"
  ON public.donations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all donations"
  ON public.donations FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER donations_set_updated_at
BEFORE UPDATE ON public.donations
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();