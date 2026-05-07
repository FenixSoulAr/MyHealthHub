# Registro de Incidencias

## F-09 — Stripe webhook devuelve HTTP 400 Invalid signature en producción

- **Fecha:** 2026-05-07
- **Estado:** Diagnóstico/corrección aplicada, pendiente test E2E con cupón fresco.
- **Área:** Cobros web / Stripe
- **Endpoint:** Función `stripe-webhook`
- **Síntoma:** Stripe Checkout creaba checkout, customer y subscription, pero el webhook respondía `HTTP 400 Invalid signature`.
- **Eventos afectados:**
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
- **Hipótesis activas tratadas:**
  - Secret del webhook con espacios, BOM, caracteres invisibles o saltos de línea.
  - Compatibilidad de verificación de firma en Deno / Edge Functions.
- **Corrección aplicada:**
  - `STRIPE_WEBHOOK_SECRET` se limpia con `.trim()` antes de validar.
  - Se conserva lectura raw con `await req.text()`.
  - Se usa el header exacto `stripe-signature`.
  - Se cambia la validación a `stripe.webhooks.constructEventAsync(...)`.
  - Se agregan logs diagnósticos no sensibles: existencia y longitud del header, longitud del body, longitud del secret y mensaje/tipo de error.
- **Protección:** No se registran secrets, tokens, claves privadas ni contenido del body.
- **Próximo paso:** Ejecutar test E2E con cupón fresco, por ejemplo `MHHQA300`.

### Aclaración de entornos (2026-05-07)

- El Supabase productivo actual de My Health Hub es `kxkofzxfpqvpojyeguie`. Endpoint productivo del webhook: `https://kxkofzxfpqvpojyeguie.supabase.co/functions/v1/stripe-webhook`.
- El proyecto Lovable Cloud vinculado al repo (`pwwadvtoabvqvnjkcvjr`) corresponde a un entorno viejo / desalineado y NO debe usarse para diagnosticar Stripe productivo ni para apuntar el endpoint de Stripe.
- Lovable no tiene acceso directo a `kxkofzxfpqvpojyeguie`: la verificación de logs, secrets y el despliegue de la edge function deben hacerse manualmente desde su Dashboard o con Supabase CLI (`--project-ref kxkofzxfpqvpojyeguie`, `--no-verify-jwt`).
- Evento de referencia que falló con HTTP 400 en `kxkofzxfpqvpojyeguie`: `evt_1TUTaGKDVbPJQ8VfZK1HbBgL` (2026-05-07 12:11:29 -03). Pendiente: confirmar si la versión F-09 del código está realmente desplegada en ese proyecto y si `STRIPE_WEBHOOK_SECRET` ahí coincide con el signing secret del endpoint productivo en Stripe.
