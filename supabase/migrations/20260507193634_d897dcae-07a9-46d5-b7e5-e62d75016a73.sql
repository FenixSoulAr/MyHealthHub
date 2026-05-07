-- Localized plan prices per provider/country/currency
CREATE TABLE IF NOT EXISTS public.localized_plan_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  provider text NOT NULL,
  country_code text NOT NULL,
  currency_id text NOT NULL,
  billing_period text NOT NULL,
  amount numeric(12,2) NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, country_code, currency_id, plan_id, billing_period)
);

ALTER TABLE public.localized_plan_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "localized_plan_prices_read_authenticated"
  ON public.localized_plan_prices FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE TRIGGER trg_localized_plan_prices_updated_at
  BEFORE UPDATE ON public.localized_plan_prices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed AR/ARS prices for Mercado Pago (TEST + PROD share same catalog)
INSERT INTO public.localized_plan_prices (plan_id, provider, country_code, currency_id, billing_period, amount)
SELECT p.id, 'mercadopago', 'AR', 'ARS', 'monthly', 5000
  FROM public.plans p WHERE p.code = 'plus_monthly'
UNION ALL
SELECT p.id, 'mercadopago', 'AR', 'ARS', 'yearly', 50000
  FROM public.plans p WHERE p.code = 'plus_yearly'
UNION ALL
SELECT p.id, 'mercadopago', 'AR', 'ARS', 'monthly', 12000
  FROM public.plans p WHERE p.code = 'pro_monthly'
UNION ALL
SELECT p.id, 'mercadopago', 'AR', 'ARS', 'yearly', 120000
  FROM public.plans p WHERE p.code = 'pro_yearly';

-- Add country_code on subscriptions
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS country_code text;