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
