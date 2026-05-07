# Pendientes y Deuda Técnica

## Stripe webhook — verificación E2E pendiente

- **Relacionado:** F-09
- **Estado:** Pendiente test E2E con cupón fresco.
- **Contexto:** Se aplicó corrección de verificación de firma para el webhook de Stripe en producción.
- **Validar:**
  - Pago web con Stripe como alternativa a PayPal.
  - Recepción de `checkout.session.completed` con firma válida.
  - Alta/actualización correcta de la suscripción.
  - Registro de invoice si corresponde.
  - Preservación de PayPal en web y Google Play Billing exclusivo en Android nativo.
- **Cupón sugerido para QA:** `MHHQA300`.

## Alineación de entornos Supabase (Lovable vs producción Stripe)

- **Supabase productivo actual:** `kxkofzxfpqvpojyeguie` (independiente, fuera de Lovable Cloud).
- **Lovable Cloud vinculado al repo:** `pwwadvtoabvqvnjkcvjr` (entorno viejo/desalineado, NO productivo para Stripe).
- **Acción pendiente:**
  - Confirmar manualmente que la versión F-09 de `supabase/functions/stripe-webhook/index.ts` esté desplegada en `kxkofzxfpqvpojyeguie` (vía CLI: `supabase functions deploy stripe-webhook --no-verify-jwt --project-ref kxkofzxfpqvpojyeguie`).
  - Confirmar que en `kxkofzxfpqvpojyeguie` existan los secrets `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`, y que `STRIPE_WEBHOOK_SECRET` corresponda exactamente al signing secret del endpoint `https://kxkofzxfpqvpojyeguie.supabase.co/functions/v1/stripe-webhook` en Stripe.
  - Decidir a futuro si se unifica el entorno productivo a Lovable Cloud o se mantiene Supabase independiente, para evitar la desalineación actual.
