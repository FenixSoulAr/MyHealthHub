# Supabase

## Edge Function `stripe-webhook`

- **Incidente relacionado:** F-09 — Stripe webhook devuelve `HTTP 400 Invalid signature` en producción.
- **Estado:** Diagnóstico/corrección aplicada, pendiente test E2E con cupón fresco.
- **Lectura del request:** El webhook debe leer el body raw con `await req.text()` y no usar `req.json()` antes de validar la firma.
- **Header requerido:** `stripe-signature`.
- **Secret:** `STRIPE_WEBHOOK_SECRET` debe obtenerse desde variables de entorno y limpiarse con `.trim()` antes de validar.
- **Validación:** Se prioriza `stripe.webhooks.constructEventAsync(...)` por compatibilidad con Deno / Edge Functions.
- **Logs permitidos:** Solo datos no sensibles como existencia y longitud del header, longitud del body, longitud del secret y mensaje/tipo de error.
- **Logs prohibidos:** No registrar secrets, tokens, claves privadas ni contenido del body.
- **Compatibilidad de negocio preservada:**
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
  - Períodos desde `subscription.items.data[0]` con fallback al nivel raíz para compatibilidad con API 2025-02-24.acacia y anteriores.
