# Registro de Incidencias

## F-09 — Stripe webhook devuelve HTTP 400 Invalid signature en producción

- **Fecha:** 2026-05-07
- **Fecha de resolución:** 2026-05-07
- **Estado:** Resuelto
- **Área:** Cobros web / Stripe
- **Endpoint:** Función `stripe-webhook`
- **Síntoma:** Stripe Checkout creaba checkout, customer y subscription, pero el webhook respondía `HTTP 400 Invalid signature`.
- **Eventos afectados:**
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
- **Causa raíz final:**
  1. Código corregido inicialmente no desplegado en el Supabase productivo real (`kxkofzxfpqvpojyeguie`).
  2. `STRIPE_WEBHOOK_SECRET` desalineado/inválido en el proyecto productivo.
  3. Confusión temporal con el proyecto `pwwadvtoabvqvnjkcvjr` (entorno Lovable Cloud/viejo), que no debe usarse para diagnosticar Stripe productivo.
- **Corrección aplicada:**
  - `STRIPE_WEBHOOK_SECRET` se limpia con `.trim()` antes de validar.
  - Se conserva lectura raw con `await req.text()`.
  - Se usa el header exacto `stripe-signature`.
  - Se cambia la validación a `stripe.webhooks.constructEventAsync(...)`.
  - Se agregan logs diagnósticos no sensibles: existencia y longitud del header, longitud del body, longitud del secret y mensaje/tipo de error.
- **Evidencia de resolución:**
  - Evento `evt_1TUTaGKDVbPJQ8VfZK1HbBgL` reenviado desde Stripe Dashboard.
  - Webhook respondió `HTTP 200 OK` con body `{ "received": true }`.
  - Subscription creada/actualizada en Supabase:
    - id: `9d7e490c-c4c0-4aa8-877e-5ef02e98e179`
    - user_id: `78104541-4e5f-4621-a910-3454ce1ffb3a`
    - plan_id: `6f4ce74a-6139-4016-95ef-00b9b5bdf4ec`
    - stripe_customer_id: `cus_UTQRNDrhFAEyh3`
    - stripe_subscription_id: `sub_1TUTaBKDVbPJQ8Vf9AJrIp8X`
    - status: `active`
    - current_period_start: `2026-05-07 15:11:23+00`
    - current_period_end: `2026-06-07 15:11:23+00`
- **Protección:** No se registran secrets, tokens, claves privadas ni contenido del body.
- **Próximo paso:** Cleanup de entorno QA (subscriptions de prueba, customer de prueba, usuarios QA) según convenga.

### Aclaración de entornos (2026-05-07)

- El Supabase productivo actual de My Health Hub es `kxkofzxfpqvpojyeguie`. Endpoint productivo del webhook: `https://kxkofzxfpqvpojyeguie.supabase.co/functions/v1/stripe-webhook`.
- El proyecto Lovable Cloud vinculado al repo (`pwwadvtoabvqvnjkcvjr`) corresponde a un entorno viejo / desalineado y NO debe usarse para diagnosticar Stripe productivo ni para apuntar el endpoint de Stripe.
- Lovable no tiene acceso directo a `kxkofzxfpqvpojyeguie`: la verificación de logs, secrets y el despliegue de la edge function deben hacerse manualmente desde su Dashboard o con Supabase CLI (`--project-ref kxkofzxfpqvpojyeguie`, `--no-verify-jwt`).
- Evento de referencia validado con éxito: `evt_1TUTaGKDVbPJQ8VfZK1HbBgL` (2026-05-07 12:11:29 -03). Respondió HTTP 200 OK tras deploy manual de la función y rotación de `STRIPE_WEBHOOK_SECRET` en el proyecto correcto.
