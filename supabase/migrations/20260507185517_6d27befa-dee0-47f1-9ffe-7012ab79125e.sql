
-- 1. Extend subscriptions for Mercado Pago support
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS external_reference text,
  ADD COLUMN IF NOT EXISTS mercadopago_preapproval_id text,
  ADD COLUMN IF NOT EXISTS payer_email text,
  ADD COLUMN IF NOT EXISTS currency text,
  ADD COLUMN IF NOT EXISTS amount_cents integer,
  ADD COLUMN IF NOT EXISTS billing_frequency text,
  ADD COLUMN IF NOT EXISTS started_at timestamptz,
  ADD COLUMN IF NOT EXISTS next_payment_date timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS raw_payload jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_mercadopago_preapproval_id_uidx
  ON public.subscriptions (mercadopago_preapproval_id)
  WHERE mercadopago_preapproval_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS subscriptions_external_reference_idx
  ON public.subscriptions (external_reference)
  WHERE external_reference IS NOT NULL;

-- 2. Create billing_events table (multi-provider audit)
CREATE TABLE IF NOT EXISTS public.billing_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  event_type text,
  external_id text,
  user_id uuid,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  processed boolean NOT NULL DEFAULT false,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS billing_events_provider_external_id_idx
  ON public.billing_events (provider, external_id);
CREATE INDEX IF NOT EXISTS billing_events_user_id_idx
  ON public.billing_events (user_id);
CREATE INDEX IF NOT EXISTS billing_events_created_at_desc_idx
  ON public.billing_events (created_at DESC);

ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY billing_events_no_client_insert
  ON public.billing_events FOR INSERT TO public WITH CHECK (false);
CREATE POLICY billing_events_no_client_update
  ON public.billing_events FOR UPDATE TO public USING (false);
CREATE POLICY billing_events_no_client_delete
  ON public.billing_events FOR DELETE TO public USING (false);
CREATE POLICY billing_events_read_superadmin
  ON public.billing_events FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.admin_roles
    WHERE user_id = auth.uid() AND role = 'superadmin'
  ));
